-- Manually confirm all existing users (so they can log in without email link)
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null;

select email, email_confirmed_at from auth.users;
