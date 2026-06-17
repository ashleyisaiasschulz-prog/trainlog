-- Coach-tagged positions per class, for accurate curriculum analytics.
-- Run in Supabase SQL Editor.

alter table trainer_sessions
  add column if not exists positions text[] default '{}';

select 'trainer_sessions.positions ready' as status;
