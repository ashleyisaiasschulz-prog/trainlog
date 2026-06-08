-- ═══════════════════════════════════════════════════════════════
-- Wipe ALL test users + their data (clean slate)
-- Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════

-- Delete profiles first → cascades to sessions/tournaments/groups/etc.
delete from profiles;

-- Then remove the auth users
delete from auth.users;

select 'All users + data deleted ✓' as status;
