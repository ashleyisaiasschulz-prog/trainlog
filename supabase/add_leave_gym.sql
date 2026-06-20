-- Members can leave a gym/group themselves (logs a departure). Run in Supabase.

create or replace function leave_gym(p_group uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from group_members where group_id = p_group and user_id = auth.uid()) then
    return 'not_member';
  end if;
  if exists (select 1 from groups where id = p_group and trainer_id = auth.uid()) then
    return 'owner';   -- owner must delete/transfer, not leave
  end if;
  insert into gym_departures (group_id, user_id) values (p_group, auth.uid());
  delete from group_members where group_id = p_group and user_id = auth.uid();
  return 'ok';
end; $$;

select 'leave_gym ready' as status;
