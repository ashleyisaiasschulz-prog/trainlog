-- ═══════════════════════════════════════════════════════════════
-- TrainLog – extra features: group chat, RSVP visibility, goals
-- Run this whole block in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- ── GROUP CHAT ───────────────────────────────────────────────────
create table if not exists group_messages (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  content     text not null,
  created_at  timestamptz default now()
);
create index if not exists gmsg_group_idx on group_messages(group_id, created_at);

alter table group_messages enable row level security;

drop policy if exists "gmsg_read"   on group_messages;
drop policy if exists "gmsg_insert" on group_messages;
create policy "gmsg_read" on group_messages for select using (
  is_group_member(group_id, auth.uid()) or is_group_trainer(group_id, auth.uid())
);
create policy "gmsg_insert" on group_messages for insert with check (
  user_id = auth.uid()
  and (is_group_member(group_id, auth.uid()) or is_group_trainer(group_id, auth.uid()))
);

-- realtime for chat
do $$ begin
  alter publication supabase_realtime add table group_messages;
exception when others then null; end $$;

-- ── PERSONAL GOALS (progress) ────────────────────────────────────
create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  text        text not null,
  done        boolean default false,
  created_at  timestamptz default now()
);
create index if not exists goals_user_idx on goals(user_id);

alter table goals enable row level security;
drop policy if exists "goals_own" on goals;
create policy "goals_own" on goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── RSVP visibility: members can see who else is going ────────────
-- (the trainer already could; this lets students see the attendee list)
drop policy if exists "rsvp_group_read" on session_rsvps;
create policy "rsvp_group_read" on session_rsvps for select using (
  exists (
    select 1 from trainer_sessions ts
    where ts.id = trainer_session_id
      and is_group_member(ts.group_id, auth.uid())
  )
);

select 'Features ready ✓' as status;
