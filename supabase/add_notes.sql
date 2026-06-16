-- ── TECHNIQUE NOTES & PARTNER NOTES (account-synced, private) ────────────────
-- Run in Supabase SQL Editor.

create table if not exists technique_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null,
  name       text not null,
  category   text default 'general',
  notes      text default '',
  date       date not null,
  created_at timestamptz default now()
);
create index if not exists tn_user_idx on technique_notes(user_id);

create table if not exists partner_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null,
  name       text not null,
  belt       text default '',
  gym        text default '',
  notes      text default '',
  watch_for  text default '',
  tags       text[] default '{}',
  date       date not null,
  created_at timestamptz default now()
);
create index if not exists pn_user_idx on partner_notes(user_id);

alter table technique_notes enable row level security;
alter table partner_notes   enable row level security;

-- Private to the owner (no sharing).
drop policy if exists "tn_own" on technique_notes;
create policy "tn_own" on technique_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "pn_own" on partner_notes;
create policy "pn_own" on partner_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

select 'technique_notes + partner_notes ready ✓' as status;
