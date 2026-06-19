-- Allow cancelling a single occurrence of a recurring class.
-- Run in Supabase SQL Editor.

alter table session_occurrences
  add column if not exists cancelled boolean default false;

select 'session_occurrences.cancelled ready' as status;
