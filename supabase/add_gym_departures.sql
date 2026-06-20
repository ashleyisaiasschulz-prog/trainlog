-- Log when members leave a gym, so coaches can win them back. Run in Supabase.

create table if not exists gym_departures (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid references groups(id) on delete cascade not null,
  user_id   uuid references profiles(id) on delete cascade not null,
  left_at   timestamptz default now()
);
create index if not exists gd_group_idx on gym_departures(group_id);

alter table gym_departures enable row level security;
drop policy if exists "gd_read"  on gym_departures;
drop policy if exists "gd_write" on gym_departures;
create policy "gd_read" on gym_departures for select
  using (is_group_coach(group_id, auth.uid()));
create policy "gd_write" on gym_departures for all
  using (is_group_coach(group_id, auth.uid()))
  with check (is_group_coach(group_id, auth.uid()));

select 'gym_departures ready' as status;
