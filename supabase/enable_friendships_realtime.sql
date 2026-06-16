-- Enable Postgres change events for the friends list live-updates.
-- Run once in the Supabase SQL Editor. RLS still applies, so each user
-- only receives changes to friendship rows they're part of.
alter publication supabase_realtime add table friendships;
