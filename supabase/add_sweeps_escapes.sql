-- ── SWEEPS & ESCAPES columns for training_sessions ──────────────────────────
-- Run in Supabase SQL Editor.

alter table training_sessions
  add column if not exists sweeps_given     text[] default '{}',
  add column if not exists sweeps_received  text[] default '{}',
  add column if not exists escapes_given    text[] default '{}',
  add column if not exists escapes_received text[] default '{}';

select 'sweeps/escapes columns ready ✓' as status;
