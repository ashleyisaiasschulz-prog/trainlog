-- Member contact data for coaches (email from auth + optional phone).
-- Returned only to a gym's coaches via a security-definer RPC. Run in Supabase.

alter table profiles add column if not exists phone text;

create or replace function gym_member_contacts(p_group uuid)
returns table(user_id uuid, email text, phone text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_group_coach(p_group, auth.uid()) then return; end if;
  return query
  select x.uid, u.email::text, p.phone
  from (
    select gm.user_id as uid from group_members gm where gm.group_id = p_group
    union
    select gd.user_id from gym_departures gd where gd.group_id = p_group
  ) x
  join auth.users u on u.id = x.uid
  left join profiles p on p.id = x.uid;
end; $$;

select 'member contacts ready' as status;
