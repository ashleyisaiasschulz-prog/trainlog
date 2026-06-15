-- ── INJURIES (account-synced, friends can see active-injury status) ──────────
-- Run in Supabase SQL Editor. Relies on are_friends() / trainer_sees() helpers
-- already defined in schema.sql.

create table if not exists injuries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  body_part   text not null,
  type        text not null,
  severity    int  default 1,        -- 1 | 2 | 3
  start_date  date not null,
  end_date    date,                  -- null = still active
  notes       text default '',
  created_at  timestamptz default now()
);

create index if not exists inj_user_idx on injuries(user_id);

alter table injuries enable row level security;

drop policy if exists "inj_own"         on injuries;
drop policy if exists "inj_shared_read" on injuries;

-- Full control over your own injuries
create policy "inj_own" on injuries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Friends with share_stats (or trainers with share_sessions) can read,
-- which drives the "currently injured" status on the friend profile.
create policy "inj_shared_read" on injuries for select using (
  exists (select 1 from profiles p where p.id = user_id and (
    (p.share_stats    and are_friends(auth.uid(), user_id)) or
    (p.share_sessions and trainer_sees(auth.uid(), user_id))
  ))
);

select 'injuries ready ✓' as status;
