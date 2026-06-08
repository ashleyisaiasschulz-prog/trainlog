-- ═══════════════════════════════════════════════════════════════
-- FIX: let users join a group by invite code
-- (RLS hides groups from non-members, so we need a SECURITY DEFINER RPC)
-- Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

create or replace function join_group(p_code text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  g_id uuid;
begin
  select id into g_id from groups where invite_code = upper(p_code);
  if g_id is null then
    return 'not_found';
  end if;

  if exists (select 1 from group_members where group_id = g_id and user_id = auth.uid()) then
    return 'already_member';
  end if;

  insert into group_members (group_id, user_id, role)
  values (g_id, auth.uid(), 'student');

  return 'joined';
end;
$$;

select 'join_group ready ✓' as status;
