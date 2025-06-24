
-- Clear public.profiles table
DELETE FROM public.profiles;

-- Clear auth schema data (users and related tables)
DELETE FROM auth.audit_log_entries;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.users;
