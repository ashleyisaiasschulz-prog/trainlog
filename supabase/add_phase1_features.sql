-- Phase 1 gym features: promote member, broadcast announcements, class capacity.
-- Run in Supabase SQL Editor.

-- 1) Coach promotes a student (belt + stripes)
create or replace function promote_member(p_group uuid, p_user uuid, p_belt text, p_stripes int)
returns text language plpgsql security definer set search_path = public as $$
declare old_belt text;
begin
  if not is_group_coach(p_group, auth.uid()) then return 'denied'; end if;
  select belt into old_belt from profiles where id = p_user;
  update profiles set belt = p_belt, stripes = p_stripes where id = p_user;
  insert into belt_promotions(user_id, date, from_belt, to_belt, stripes, gym, coach_note)
    values (p_user, current_date, coalesce(old_belt,'white'), p_belt, p_stripes, '', '');
  return 'ok';
end; $$;

-- 2) Gym broadcast announcements
create table if not exists gym_announcements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);
create index if not exists ga_group_idx on gym_announcements(group_id);
alter table gym_announcements enable row level security;
drop policy if exists "ga_read" on gym_announcements;
drop policy if exists "ga_write" on gym_announcements;
create policy "ga_read" on gym_announcements for select
  using (is_group_member(group_id, auth.uid()));
create policy "ga_write" on gym_announcements for all
  using (is_group_coach(group_id, auth.uid()))
  with check (is_group_coach(group_id, auth.uid()));

-- 3) Class capacity (waitlist is handled client-side via session_rsvps.status)
alter table trainer_sessions add column if not exists capacity int;

select 'phase 1 features ready' as status;
