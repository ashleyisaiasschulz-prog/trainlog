-- Gym joins require coach/owner approval. Free (social) groups join directly.
-- Run in Supabase SQL Editor.

create table if not exists join_requests (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups(id) on delete cascade not null,
  user_id     uuid references profiles(id) on delete cascade not null,
  created_at  timestamptz default now(),
  unique(group_id, user_id)
);
create index if not exists jr_group_idx on join_requests(group_id);

alter table join_requests enable row level security;

drop policy if exists "jr_read"   on join_requests;
drop policy if exists "jr_insert" on join_requests;
drop policy if exists "jr_delete" on join_requests;

create policy "jr_read" on join_requests for select
  using (auth.uid() = user_id or is_group_coach(group_id, auth.uid()));
create policy "jr_insert" on join_requests for insert
  with check (auth.uid() = user_id);
create policy "jr_delete" on join_requests for delete
  using (auth.uid() = user_id or is_group_coach(group_id, auth.uid()));

-- Join by code: a gym creates a pending request; a free group joins directly.
create or replace function request_join(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare g record;
begin
  select id, is_gym into g from groups where upper(invite_code) = upper(p_code);
  if g.id is null then return 'not_found'; end if;
  if exists (select 1 from group_members where group_id = g.id and user_id = auth.uid()) then
    return 'already_member';
  end if;
  if coalesce(g.is_gym, false) then
    insert into join_requests(group_id, user_id) values (g.id, auth.uid())
      on conflict (group_id, user_id) do nothing;
    return 'requested';
  else
    insert into group_members(group_id, user_id, role) values (g.id, auth.uid(), 'student');
    return 'joined';
  end if;
end; $$;

-- Coach/owner approves a pending request → adds the member.
create or replace function approve_join(p_group uuid, p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not is_group_coach(p_group, auth.uid()) then return 'denied'; end if;
  insert into group_members(group_id, user_id, role) values (p_group, p_user, 'student')
    on conflict (group_id, user_id) do nothing;
  delete from join_requests where group_id = p_group and user_id = p_user;
  return 'ok';
end; $$;

create or replace function deny_join(p_group uuid, p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not is_group_coach(p_group, auth.uid()) then return 'denied'; end if;
  delete from join_requests where group_id = p_group and user_id = p_user;
  return 'ok';
end; $$;

select 'join_requests ready' as status;
