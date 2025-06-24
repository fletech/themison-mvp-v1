
-- Clear all data from public schema tables (in correct order to handle foreign key constraints)
DELETE FROM public.trial_patients;
DELETE FROM public.trial_members;
DELETE FROM public.patients;
DELETE FROM public.trials;
DELETE FROM public.members;
DELETE FROM public.invitations;
DELETE FROM public.roles;
DELETE FROM public.profiles;
DELETE FROM public.organizations;
DELETE FROM public.themison_admins;

-- Clear auth schema data (users and related tables)
DELETE FROM auth.audit_log_entries;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.users;
