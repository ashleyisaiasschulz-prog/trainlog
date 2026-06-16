-- Store the Stripe customer id so users can open the billing portal
-- (manage / cancel their subscription). Run in Supabase SQL Editor.
alter table public.profiles
  add column if not exists stripe_customer_id text;
