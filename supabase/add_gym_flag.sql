-- ── GYM FLAG ─────────────────────────────────────────────────────────────────
-- A group becomes a paid "gym" (coaches + scheduling + insights) only when
-- is_gym = true, set by the Stripe webhook. Run in Supabase SQL Editor.

alter table groups add column if not exists is_gym boolean default false;

-- Coaching abilities (schedule sessions, insights) require a PAID gym.
-- This makes the gate non-bypassable: a free group's owner/admin cannot
-- schedule classes even via the API, because the RLS check fails.
create or replace function is_group_coach(gid uuid, uid uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from groups g
    where g.id = gid and g.is_gym = true and (
      g.trainer_id = uid
      or exists (select 1 from group_members gm
                  where gm.group_id = gid and gm.user_id = uid and gm.role in ('trainer','coach'))
    )
  );
$$;

select 'gym flag ready ✓' as status;
