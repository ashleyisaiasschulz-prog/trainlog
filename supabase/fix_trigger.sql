-- ═══════════════════════════════════════════════════════════════
-- FIX: robust profile-creation trigger
-- Run this in Supabase SQL Editor to replace the broken trigger
-- ═══════════════════════════════════════════════════════════════

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  -- derive a base username
  base_username := lower(coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1)
  ));
  -- strip anything weird, keep it simple
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  if base_username = '' then
    base_username := 'user';
  end if;

  -- ensure uniqueness by appending a number if needed
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), final_username)
  );

  return new;
exception when others then
  -- never block signup; log and continue
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end;
$$;

-- recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
