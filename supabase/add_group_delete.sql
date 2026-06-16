-- Allow group owners to delete their groups + kick members.
-- Run in Supabase SQL Editor.

-- Owner can delete their group
drop policy if exists "group_delete" on groups;
create policy "group_delete" on groups for delete
  using (auth.uid() = trainer_id);

-- Owner can remove members from their group
drop policy if exists "member_delete" on group_members;
create policy "member_delete" on group_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from groups where groups.id = group_members.group_id and groups.trainer_id = auth.uid()
    )
  );

-- Enable realtime on attendance table too
alter publication supabase_realtime add table attendance;

select 'group delete + member kick policies ready' as status;
