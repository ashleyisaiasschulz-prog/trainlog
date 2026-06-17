-- Open Mats: gyms publish public sessions; everyone can browse & filter.
-- Gym address is geocoded once (Nominatim) → lat/lng for radius filtering.
-- Run in Supabase SQL Editor.

-- Gym location (set in gym settings, owner only)
alter table groups add column if not exists address text;
alter table groups add column if not exists country text;
alter table groups add column if not exists lat double precision;
alter table groups add column if not exists lng double precision;

-- Owner can update their group (address etc.)
drop policy if exists "group_update_owner" on groups;
create policy "group_update_owner" on groups for update
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

-- Open mats — location denormalized so the public list needs no group join
create table if not exists open_mats (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups(id) on delete cascade not null,
  gym_name    text,
  title       text not null,
  date        date not null,
  time        time,
  gi          boolean default true,
  notes       text,
  address     text,
  country     text,
  lat         double precision,
  lng         double precision,
  created_at  timestamptz default now()
);
create index if not exists openmats_date_idx on open_mats(date);

alter table open_mats enable row level security;

drop policy if exists "om_read"  on open_mats;
drop policy if exists "om_write" on open_mats;

-- Public: anyone signed in can browse open mats.
create policy "om_read" on open_mats for select using (true);

-- Only a gym's coaches/owner can post / edit / remove its open mats.
create policy "om_write" on open_mats for all
  using (is_group_coach(group_id, auth.uid()))
  with check (is_group_coach(group_id, auth.uid()));

select 'open_mats ready' as status;
