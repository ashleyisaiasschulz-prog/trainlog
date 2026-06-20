-- Profile pictures + date of birth. Run in Supabase SQL Editor.

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists birthdate date;

-- Storage bucket for avatars (public read, owner-only write to their own folder)
insert into storage.buckets (id, name, public) values ('avatars','avatars',true)
  on conflict (id) do nothing;

drop policy if exists "avatars_read"  on storage.objects;
drop policy if exists "avatars_write" on storage.objects;
create policy "avatars_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_write" on storage.objects for all
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

select 'profile avatar + age ready' as status;
