-- ── COACH NOTES ──────────────────────────────────────────────────────────────
-- Private notes a gym's coaches keep about a student (promotion readiness +
-- general). Shared among the gym's coaches; the student never sees them.
-- Relies on is_group_coach() (paid-gym aware). Run in Supabase SQL Editor.

create table if not exists coach_notes (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups(id)   on delete cascade not null,
  student_id  uuid references profiles(id) on delete cascade not null,
  general     text default '',
  promotion   text default '',
  updated_by  uuid references profiles(id),
  updated_at  timestamptz default now(),
  unique(group_id, student_id)
);
create index if not exists cn_group_idx on coach_notes(group_id);

alter table coach_notes enable row level security;

-- Only coaches of the (paid) gym can read or write these notes.
drop policy if exists "cn_coach_all" on coach_notes;
create policy "cn_coach_all" on coach_notes for all
  using (is_group_coach(group_id, auth.uid()))
  with check (is_group_coach(group_id, auth.uid()));

select 'coach_notes ready ✓' as status;
