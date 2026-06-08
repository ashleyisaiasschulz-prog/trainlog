-- ═══════════════════════════════════════════════════════════════
-- RESET: remove trigger, ensure profiles table + policies exist
-- Run this whole block in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Remove the trigger entirely (we'll create profiles from the client)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- 2. Ensure profiles table exists
create table if not exists profiles (
  id              uuid references auth.users primary key,
  username        text unique not null,
  display_name    text,
  gym             text,
  belt            text default 'white',
  stripes         int  default 0,
  share_stats     boolean default true,
  share_belt      boolean default true,
  share_sessions  boolean default false,
  is_trainer      boolean default false,
  created_at      timestamptz default now()
);

-- 3. RLS + policies (drop first to avoid "already exists")
alter table profiles enable row level security;

drop policy if exists "profiles_read"   on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;

create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- 4. Verify it worked
select 'profiles table ready' as status;
