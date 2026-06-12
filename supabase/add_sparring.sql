-- ── SPARRING RECORDS (friend vs friend match tracking) ──────────────────────
-- Run in Supabase SQL Editor.

create table if not exists sparring_records (
  id          uuid primary key default gen_random_uuid(),
  logger_id   uuid references profiles(id) on delete cascade not null,
  opponent_id uuid references profiles(id) on delete cascade not null,
  date        date not null,
  result      text not null, -- 'win' | 'loss' | 'draw' — from logger's perspective
  finish_type text default 'submission', -- 'submission' | 'points' | 'advantages' | 'other'
  submission  text default '',
  notes       text default '',
  created_at  timestamptz default now()
);

create index if not exists sr_logger_idx   on sparring_records(logger_id);
create index if not exists sr_opponent_idx on sparring_records(opponent_id);

alter table sparring_records enable row level security;

drop policy if exists "sr_read"   on sparring_records;
drop policy if exists "sr_insert" on sparring_records;
drop policy if exists "sr_update" on sparring_records;
drop policy if exists "sr_delete" on sparring_records;

-- Both participants can read the record
create policy "sr_read" on sparring_records for select
  using (auth.uid() in (logger_id, opponent_id));

create policy "sr_insert" on sparring_records for insert
  with check (auth.uid() = logger_id);

create policy "sr_update" on sparring_records for update
  using (auth.uid() = logger_id);

create policy "sr_delete" on sparring_records for delete
  using (auth.uid() = logger_id);

select 'sparring_records ready ✓' as status;
