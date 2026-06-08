-- ═══════════════════════════════════════════════════════════════
-- FIX: groups ↔ group_members RLS infinite recursion
-- Replace cross-referencing policies with SECURITY DEFINER helpers.
-- Run this whole block in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- Helpers bypass RLS (security definer) → no recursion
create or replace function is_group_member(gid uuid, uid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = uid);
$$;

create or replace function is_group_trainer(gid uuid, uid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from groups where id = gid and trainer_id = uid);
$$;

-- ── GROUPS policies (no longer reference group_members directly) ──
drop policy if exists "g_read"   on groups;
drop policy if exists "g_insert" on groups;
drop policy if exists "g_update" on groups;
drop policy if exists "g_delete" on groups;
create policy "g_read" on groups for select using (
  auth.uid() = trainer_id or is_group_member(id, auth.uid())
);
create policy "g_insert" on groups for insert with check (auth.uid() = trainer_id);
create policy "g_update" on groups for update using (auth.uid() = trainer_id);
create policy "g_delete" on groups for delete using (auth.uid() = trainer_id);

-- ── GROUP MEMBERS policies (use helper, not subquery on groups) ──
drop policy if exists "gm_read"   on group_members;
drop policy if exists "gm_insert" on group_members;
drop policy if exists "gm_delete" on group_members;
create policy "gm_read" on group_members for select using (
  auth.uid() = user_id or is_group_trainer(group_id, auth.uid())
);
create policy "gm_insert" on group_members for insert with check (auth.uid() = user_id);
create policy "gm_delete" on group_members for delete using (
  auth.uid() = user_id or is_group_trainer(group_id, auth.uid())
);

-- ── TRAINER SESSIONS: use helper too (referenced group_members) ──
drop policy if exists "trs_read" on trainer_sessions;
create policy "trs_read" on trainer_sessions for select using (
  auth.uid() = trainer_id or is_group_member(group_id, auth.uid())
);

select 'Group RLS fixed ✓' as status;
