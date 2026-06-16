-- Enable Realtime on session_rsvps so coaches see RSVP changes live.
-- Run in Supabase SQL Editor.

alter publication supabase_realtime add table session_rsvps;

select 'session_rsvps realtime enabled' as status;
