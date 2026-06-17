-- Per-date plan for a class: each occurrence (also of a recurring class) can
-- have its own positions + notes, overriding the template's defaults.
-- Run in Supabase SQL Editor.

create table if not exists session_occurrences (
  id                  uuid primary key default gen_random_uuid(),
  group_id            uuid references groups(id) on delete cascade not null,
  trainer_session_id  uuid references trainer_sessions(id) on delete cascade not null,
  date                date not null,
  focus               text,
  positions           text[] default '{}',
  created_at          timestamptz default now(),
  unique(trainer_session_id, date)
);
create index if not exists socc_group_idx on session_occurrences(group_id);

alter table session_occurrences enable row level security;

drop policy if exists "socc_read"  on session_occurrences;
drop policy if exists "socc_write" on session_occurrences;

-- Any group member can read the plan.
create policy "socc_read" on session_occurrences for select
  using (is_group_member(group_id, auth.uid()));

-- Only coaches can create / change / remove a day's plan.
create policy "socc_write" on session_occurrences for all
  using (is_group_coach(group_id, auth.uid()))
  with check (is_group_coach(group_id, auth.uid()));

select 'session_occurrences ready' as status;
