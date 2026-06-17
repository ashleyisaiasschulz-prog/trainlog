-- RSVPs for public open mats (anyone signed in can sign up — no QR/scan).
-- Run in Supabase SQL Editor.

create table if not exists open_mat_rsvps (
  id           uuid primary key default gen_random_uuid(),
  open_mat_id  uuid references open_mats(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  created_at   timestamptz default now(),
  unique(open_mat_id, user_id)
);
create index if not exists omr_mat_idx on open_mat_rsvps(open_mat_id);

alter table open_mat_rsvps enable row level security;

drop policy if exists "omr_read"   on open_mat_rsvps;
drop policy if exists "omr_insert" on open_mat_rsvps;
drop policy if exists "omr_delete" on open_mat_rsvps;

-- Anyone signed in can see who's going (count + social proof).
create policy "omr_read" on open_mat_rsvps for select using (true);
-- You manage only your own RSVP.
create policy "omr_insert" on open_mat_rsvps for insert with check (auth.uid() = user_id);
create policy "omr_delete" on open_mat_rsvps for delete using (auth.uid() = user_id);

select 'open_mat_rsvps ready' as status;
