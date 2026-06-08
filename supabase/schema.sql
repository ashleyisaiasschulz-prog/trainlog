-- ═══════════════════════════════════════════════════════════════
-- TrainLog – COMPLETE Schema (cloud-only)
-- Run this whole file ONCE in Supabase SQL Editor.
-- Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════

-- ── PROFILES ─────────────────────────────────────────────────────
create table if not exists profiles (
  id              uuid references auth.users primary key,
  username        text unique not null,
  display_name    text,
  gym             text,
  belt            text default 'white',
  stripes         int  default 0,
  share_stats     boolean default true,
  share_belt      boolean default true,
  share_sessions  boolean default false,
  is_trainer      boolean default false,
  created_at      timestamptz default now()
);

-- ── TRAINING SESSIONS ────────────────────────────────────────────
create table if not exists training_sessions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references profiles(id) on delete cascade not null,
  date                  date not null,
  gym                   text default '',
  duration              int  default 60,
  gi                    boolean default true,
  intensity             int  default 3,
  positions             text[] default '{}',
  submissions_given     text[] default '{}',
  submissions_received  text[] default '{}',
  notes                 text default '',
  what_worked           text default '',
  what_didnt_work       text default '',
  focus                 text default '',
  schedule_id           uuid,
  created_at            timestamptz default now()
);
create index if not exists ts_user_idx on training_sessions(user_id);

-- ── BELT PROMOTIONS ──────────────────────────────────────────────
create table if not exists belt_promotions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  date        date not null,
  from_belt   text,
  to_belt     text not null,
  stripes     int default 0,
  gym         text default '',
  coach_note  text default '',
  created_at  timestamptz default now()
);
create index if not exists bp_user_idx on belt_promotions(user_id);

-- ── TOURNAMENTS ──────────────────────────────────────────────────
create table if not exists tournaments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  name          text not null,
  date          date not null,
  location      text default '',
  weight_class  text default '',
  gi            boolean default true,
  placement     text default '',
  notes         text default '',
  matches       jsonb default '[]',
  created_at    timestamptz default now()
);
create index if not exists tn_user_idx on tournaments(user_id);

-- ── SCHEDULES (personal recurring) ───────────────────────────────
create table if not exists schedules (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade not null,
  name         text not null,
  day_of_week  int not null,
  time         text default '18:00',
  duration     int default 90,
  gi           boolean default true,
  gym          text default '',
  active       boolean default true,
  created_at   timestamptz default now()
);
create index if not exists sc_user_idx on schedules(user_id);

-- ── CHECK-INS (attended/missed for personal schedule) ────────────
create table if not exists check_ins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  schedule_id uuid not null,
  date        date not null,
  attended    boolean default false,
  session_id  uuid,
  created_at  timestamptz default now(),
  unique(user_id, schedule_id, date)
);

-- ── FRIENDSHIPS ──────────────────────────────────────────────────
create table if not exists friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid references profiles(id) on delete cascade,
  addressee_id  uuid references profiles(id) on delete cascade,
  status        text default 'pending',
  created_at    timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- ── GROUPS ───────────────────────────────────────────────────────
create table if not exists groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  gym          text,
  trainer_id   uuid references profiles(id) on delete cascade,
  invite_code  text unique default upper(substring(md5(random()::text), 1, 6)),
  created_at   timestamptz default now()
);

create table if not exists group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid references groups(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  role       text default 'student',
  joined_at  timestamptz default now(),
  unique(group_id, user_id)
);

-- ── TRAINER SESSIONS ─────────────────────────────────────────────
create table if not exists trainer_sessions (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references groups(id) on delete cascade,
  trainer_id    uuid references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  focus         text,
  date          date,
  time          time,
  duration      int,
  gi            boolean default true,
  recurring     boolean default false,
  day_of_week   int,
  active        boolean default true,
  created_at    timestamptz default now()
);

create table if not exists session_rsvps (
  id                  uuid primary key default gen_random_uuid(),
  trainer_session_id  uuid references trainer_sessions(id) on delete cascade,
  user_id             uuid references profiles(id) on delete cascade,
  status              text default 'going',
  occurrence_date     date,
  created_at          timestamptz default now(),
  unique(trainer_session_id, user_id, occurrence_date)
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table profiles          enable row level security;
alter table training_sessions enable row level security;
alter table belt_promotions   enable row level security;
alter table tournaments       enable row level security;
alter table schedules         enable row level security;
alter table check_ins         enable row level security;
alter table friendships       enable row level security;
alter table groups            enable row level security;
alter table group_members     enable row level security;
alter table trainer_sessions  enable row level security;
alter table session_rsvps     enable row level security;

-- helper: are two users friends?
create or replace function are_friends(a uuid, b uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b)
        or (requester_id = b and addressee_id = a))
  );
$$;

-- helper: do users share a group where `viewer` is trainer?
create or replace function trainer_sees(viewer uuid, member uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from group_members gm
    join groups g on g.id = gm.group_id
    where g.trainer_id = viewer and gm.user_id = member
  );
$$;

-- helpers to break groups ↔ group_members RLS recursion (bypass RLS)
create or replace function is_group_member(gid uuid, uid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = uid);
$$;
create or replace function is_group_trainer(gid uuid, uid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from groups where id = gid and trainer_id = uid);
$$;

-- ── PROFILES policies ──
drop policy if exists "profiles_read"   on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;
create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- ── TRAINING SESSIONS policies ──
drop policy if exists "ts_own"         on training_sessions;
drop policy if exists "ts_friends"     on training_sessions;
drop policy if exists "ts_shared_read" on training_sessions;
create policy "ts_own" on training_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- friends with share_stats OR trainers with share_sessions can read
create policy "ts_shared_read" on training_sessions for select using (
  exists (select 1 from profiles p where p.id = user_id and (
    (p.share_stats   and are_friends(auth.uid(), user_id)) or
    (p.share_sessions and trainer_sees(auth.uid(), user_id))
  ))
);

-- ── BELT PROMOTIONS policies ──
drop policy if exists "bp_own" on belt_promotions;
create policy "bp_own" on belt_promotions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── TOURNAMENTS policies ──
drop policy if exists "tn_own"         on tournaments;
drop policy if exists "tn_shared_read" on tournaments;
create policy "tn_own" on tournaments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tn_shared_read" on tournaments for select using (
  exists (select 1 from profiles p where p.id = user_id
    and p.share_stats and are_friends(auth.uid(), user_id))
);

-- ── SCHEDULES + CHECK-INS policies ──
drop policy if exists "sc_own" on schedules;
create policy "sc_own" on schedules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ci_own" on check_ins;
create policy "ci_own" on check_ins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── FRIENDSHIPS policies ──
drop policy if exists "fr_read"   on friendships;
drop policy if exists "fr_insert" on friendships;
drop policy if exists "fr_update" on friendships;
drop policy if exists "fr_delete" on friendships;
create policy "fr_read"   on friendships for select using (auth.uid() in (requester_id, addressee_id));
create policy "fr_insert" on friendships for insert with check (auth.uid() = requester_id);
create policy "fr_update" on friendships for update using (auth.uid() in (requester_id, addressee_id));
create policy "fr_delete" on friendships for delete using (auth.uid() in (requester_id, addressee_id));

-- ── GROUPS policies ──
drop policy if exists "g_read"   on groups;
drop policy if exists "g_insert" on groups;
drop policy if exists "g_update" on groups;
drop policy if exists "g_delete" on groups;
create policy "g_read" on groups for select using (
  auth.uid() = trainer_id or is_group_member(id, auth.uid())
);
create policy "g_insert" on groups for insert with check (auth.uid() = trainer_id);
create policy "g_update" on groups for update using (auth.uid() = trainer_id);
create policy "g_delete" on groups for delete using (auth.uid() = trainer_id);

-- ── GROUP MEMBERS policies ──
drop policy if exists "gm_read"   on group_members;
drop policy if exists "gm_insert" on group_members;
drop policy if exists "gm_delete" on group_members;
create policy "gm_read" on group_members for select using (
  auth.uid() = user_id
  or is_group_member(group_id, auth.uid())
  or is_group_trainer(group_id, auth.uid())
);
create policy "gm_insert" on group_members for insert with check (auth.uid() = user_id);
create policy "gm_delete" on group_members for delete using (
  auth.uid() = user_id or is_group_trainer(group_id, auth.uid())
);

-- ── TRAINER SESSIONS policies ──
drop policy if exists "trs_read"   on trainer_sessions;
drop policy if exists "trs_insert" on trainer_sessions;
drop policy if exists "trs_update" on trainer_sessions;
drop policy if exists "trs_delete" on trainer_sessions;
create policy "trs_read" on trainer_sessions for select using (
  auth.uid() = trainer_id or
  exists (select 1 from group_members where group_id = trainer_sessions.group_id and user_id = auth.uid())
);
create policy "trs_insert" on trainer_sessions for insert with check (auth.uid() = trainer_id);
create policy "trs_update" on trainer_sessions for update using (auth.uid() = trainer_id);
create policy "trs_delete" on trainer_sessions for delete using (auth.uid() = trainer_id);

-- ── RSVPS policies ──
drop policy if exists "rsvp_read"   on session_rsvps;
drop policy if exists "rsvp_insert" on session_rsvps;
drop policy if exists "rsvp_update" on session_rsvps;
drop policy if exists "rsvp_delete" on session_rsvps;
create policy "rsvp_read" on session_rsvps for select using (
  auth.uid() = user_id or
  exists (select 1 from trainer_sessions ts where ts.id = trainer_session_id and ts.trainer_id = auth.uid())
);
create policy "rsvp_insert" on session_rsvps for insert with check (auth.uid() = user_id);
create policy "rsvp_update" on session_rsvps for update using (auth.uid() = user_id);
create policy "rsvp_delete" on session_rsvps for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- GROUP INSIGHTS RPC — aggregated positions/submissions for a group
-- Only the trainer can call; only counts members with share_sessions.
-- ═══════════════════════════════════════════════════════════════
create or replace function group_insights(gid uuid)
returns table(kind text, name text, count bigint)
language plpgsql security definer set search_path = public as $$
begin
  -- caller must be the trainer of this group
  if not exists (select 1 from groups g where g.id = gid and g.trainer_id = auth.uid()) then
    return;
  end if;

  return query
  with member_sessions as (
    select ts.* from training_sessions ts
    join group_members gm on gm.user_id = ts.user_id
    join profiles p on p.id = ts.user_id
    where gm.group_id = gid and p.share_sessions = true
  )
  select 'position'::text, pos, count(*)::bigint
    from member_sessions, unnest(positions) as pos group by pos
  union all
  select 'sub_given'::text, s, count(*)::bigint
    from member_sessions, unnest(submissions_given) as s group by s
  union all
  select 'sub_received'::text, s, count(*)::bigint
    from member_sessions, unnest(submissions_received) as s group by s;
end;
$$;

-- ── Join a group by invite code (bypasses RLS so non-members can find it) ──
create or replace function join_group(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare g_id uuid;
begin
  select id into g_id from groups where invite_code = upper(p_code);
  if g_id is null then return 'not_found'; end if;
  if exists (select 1 from group_members where group_id = g_id and user_id = auth.uid())
    then return 'already_member'; end if;
  insert into group_members (group_id, user_id, role) values (g_id, auth.uid(), 'student');
  return 'joined';
end;
$$;

select 'Schema ready ✓' as status;
