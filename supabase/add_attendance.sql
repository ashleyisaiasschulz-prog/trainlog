-- ── ATTENDANCE (QR check-in) ─────────────────────────────────────────────────
-- Students check into a class by scanning the gym's QR. One row per
-- (session, student, day). Run in Supabase SQL Editor.

create table if not exists attendance (
  id                  uuid primary key default gen_random_uuid(),
  group_id            uuid references groups(id) on delete cascade not null,
  trainer_session_id  uuid references trainer_sessions(id) on delete cascade,
  user_id             uuid references profiles(id) on delete cascade not null,
  date                date not null,
  created_at          timestamptz default now(),
  unique(trainer_session_id, user_id, date)
);
create index if not exists att_group_idx on attendance(group_id);

alter table attendance enable row level security;

drop policy if exists "att_insert" on attendance;
drop policy if exists "att_read"   on attendance;
drop policy if exists "att_delete" on attendance;

-- A member can check themselves in to a group they belong to.
create policy "att_insert" on attendance for insert
  with check (auth.uid() = user_id and is_group_member(group_id, auth.uid()));

-- Read: any member of the group (needed for the attendance leaderboard).
create policy "att_read" on attendance for select
  using (auth.uid() = user_id or is_group_member(group_id, auth.uid()));

-- Delete: your own (mis-scan) or a coach.
create policy "att_delete" on attendance for delete
  using (auth.uid() = user_id or is_group_coach(group_id, auth.uid()));

select 'attendance ready ✓' as status;
