-- ═══════════════════════════════════════════════════════════════
-- FIX: let any group member see the full member list (incl. admin)
-- Previously students could only see their own membership row.
-- Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "gm_read" on group_members;
create policy "gm_read" on group_members for select using (
  auth.uid() = user_id
  or is_group_member(group_id, auth.uid())   -- any member sees all members
  or is_group_trainer(group_id, auth.uid())  -- trainer sees all members
);

select 'Member visibility fixed ✓' as status;
