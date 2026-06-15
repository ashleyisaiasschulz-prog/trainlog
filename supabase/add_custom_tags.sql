-- Per-user customizable tag palette (positions, submissions, sweeps,
-- escapes, body parts, injury types). Null = user still on defaults.
alter table public.profiles
  add column if not exists custom_tags jsonb;
