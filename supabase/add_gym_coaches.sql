-- ── GYM COACH SEATS ──────────────────────────────────────────────────────────
-- A group (gym) can have up to `max_coaches` coaches. The owner is the head
-- coach and always counts as one. Run in Supabase SQL Editor.

alter table groups add column if not exists max_coaches int default 3;

-- A "coach" = the group owner, or a member with role 'trainer'/'coach'.
create or replace function is_group_coach(gid uuid, uid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from groups where id = gid and trainer_id = uid)
      or exists (select 1 from group_members
                  where group_id = gid and user_id = uid and role in ('trainer','coach'));
$$;

-- The owner can promote/demote members (change their role).
drop policy if exists "gm_update" on group_members;
create policy "gm_update" on group_members for update
  using (is_group_trainer(group_id, auth.uid()))
  with check (is_group_trainer(group_id, auth.uid()));

-- Coaches (not only the owner) can manage the group's scheduled sessions.
drop policy if exists "trs_insert" on trainer_sessions;
drop policy if exists "trs_update" on trainer_sessions;
drop policy if exists "trs_delete" on trainer_sessions;
create policy "trs_insert" on trainer_sessions for insert
  with check (auth.uid() = trainer_id and is_group_coach(group_id, auth.uid()));
create policy "trs_update" on trainer_sessions for update
  using (is_group_coach(group_id, auth.uid()));
create policy "trs_delete" on trainer_sessions for delete
  using (is_group_coach(group_id, auth.uid()));

-- Let any coach (not only the owner) view the group's aggregated insights.
create or replace function group_insights(gid uuid)
returns table(kind text, name text, count bigint)
language plpgsql security definer set search_path = public as $$
begin
  -- caller must be a coach of this group
  if not is_group_coach(gid, auth.uid()) then
    return;
  end if;

  return query
  with member_sessions as (
    select ts.* from training_sessions ts
    join group_members gm on gm.user_id = ts.user_id
    join profiles p on p.id = ts.user_id
    where gm.group_id = gid and p.share_sessions = true
  )
  select 'position'::text, pos, count(*)::bigint
    from member_sessions, unnest(positions) as pos group by pos
  union all
  select 'sub_given'::text, s, count(*)::bigint
    from member_sessions, unnest(submissions_given) as s group by s
  union all
  select 'sub_received'::text, s, count(*)::bigint
    from member_sessions, unnest(submissions_received) as s group by s;
end;
$$;

select 'gym coaches ready ✓' as status;
