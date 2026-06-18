-- Dated coach note entries (a log per student, not a single editable note).
-- Run in Supabase SQL Editor.

create table if not exists coach_note_entries (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups(id) on delete cascade not null,
  student_id  uuid references profiles(id) on delete cascade not null,
  author_id   uuid references profiles(id) on delete cascade,
  text        text not null,
  created_at  timestamptz default now()
);
create index if not exists cne_idx on coach_note_entries(group_id, student_id);

alter table coach_note_entries enable row level security;

drop policy if exists "cne_read"   on coach_note_entries;
drop policy if exists "cne_insert" on coach_note_entries;
drop policy if exists "cne_delete" on coach_note_entries;

create policy "cne_read" on coach_note_entries for select
  using (is_group_coach(group_id, auth.uid()));
create policy "cne_insert" on coach_note_entries for insert
  with check (is_group_coach(group_id, auth.uid()) and auth.uid() = author_id);
create policy "cne_delete" on coach_note_entries for delete
  using (is_group_coach(group_id, auth.uid()));

select 'coach_note_entries ready' as status;
