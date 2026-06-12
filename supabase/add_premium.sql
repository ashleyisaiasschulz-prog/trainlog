-- Add is_premium flag to profiles
alter table profiles
  add column if not exists is_premium boolean default false;
