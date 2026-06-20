-- ───────────────────────────────────────────────────────────────────────────
-- SEED TEST GYM DATA
-- Creates 10 fake members + ~6 weeks of attendance for a gym, so the coach
-- dashboard (attendance, retention radar, most active, leaderboard, badges,
-- member growth) shows realistic data.
--
-- 1. Replace 'PASTE_YOUR_GROUP_ID' below with your gym's group id
--    (open the gym → the invite code page, or: select id,name from groups; )
-- 2. Run in the Supabase SQL Editor.
-- 3. To remove the test data later, run the CLEANUP block at the bottom.
-- ───────────────────────────────────────────────────────────────────────────

do $$
declare
  gid   uuid := 'PASTE_YOUR_GROUP_ID';
  uid   uuid;
  sess  uuid[];
  names text[] := array['Alex','Sam','Jordan','Casey','Riley','Morgan','Taylor','Jamie','Drew','Quinn'];
  belts text[] := array['white','blue','white','purple','blue','white','brown','blue','purple','white'];
  i int; dd int; nsess int;
begin
  select array_agg(id) into sess from trainer_sessions where group_id = gid and active = true;
  nsess := coalesce(array_length(sess, 1), 0);

  for i in 1 .. array_length(names, 1) loop
    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'test_' || i || '@grapplr.test', '$2a$10$abcdefghijklmnopqrstuv',
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}', '{}',
      '', '', '', ''
    );

    insert into profiles (id, username, display_name, belt, stripes, created_at)
      values (uid, 'test_' || lower(names[i]) || i, names[i], belts[i], (random()*3)::int,
              now() - ((random()*150)::int || ' days')::interval);

    insert into group_members (group_id, user_id, role, joined_at)
      values (gid, uid, 'student', now() - ((random()*150)::int || ' days')::interval);

    if nsess > 0 then
      -- Members 1–3 lapsed (only older attendance) → show in the retention radar.
      -- The rest train regularly through to now.
      if i <= 3 then
        for dd in 18 .. 50 loop
          if random() < 0.4 then
            insert into attendance (group_id, trainer_session_id, user_id, date)
              values (gid, sess[1 + (random()*(nsess-1))::int], uid, current_date - dd)
              on conflict do nothing;
          end if;
        end loop;
      else
        for dd in 0 .. 50 loop
          if random() < 0.45 then
            insert into attendance (group_id, trainer_session_id, user_id, date)
              values (gid, sess[1 + (random()*(nsess-1))::int], uid, current_date - dd)
              on conflict do nothing;
          end if;
        end loop;
      end if;
    end if;
  end loop;
end $$;

select 'seeded test members ✓' as status;

-- ── CLEANUP (run separately to remove all test data) ──
-- delete from auth.users where email like 'test_%@grapplr.test';
