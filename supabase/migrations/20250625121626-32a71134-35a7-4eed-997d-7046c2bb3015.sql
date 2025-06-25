
-- Grant necessary permissions to the security definer functions
GRANT EXECUTE ON FUNCTION public.get_user_organization_id_for_trial_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_trial(UUID) TO authenticated;

-- Also grant to anon role for safety
GRANT EXECUTE ON FUNCTION public.get_user_organization_id_for_trial_members() TO anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_trial(UUID) TO anon;

-- Ensure the functions can access the required tables
GRANT SELECT ON public.members TO public;
GRANT SELECT ON public.trials TO public;

-- Check if there are any missing foreign key constraints that might cause issues
-- Let's also make sure trial_members has proper foreign key constraints
ALTER TABLE public.trial_members 
DROP CONSTRAINT IF EXISTS trial_members_trial_id_fkey;

ALTER TABLE public.trial_members 
ADD CONSTRAINT trial_members_trial_id_fkey 
FOREIGN KEY (trial_id) REFERENCES public.trials(id) ON DELETE CASCADE;

ALTER TABLE public.trial_members 
DROP CONSTRAINT IF EXISTS trial_members_member_id_fkey;

ALTER TABLE public.trial_members 
ADD CONSTRAINT trial_members_member_id_fkey 
FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;

ALTER TABLE public.trial_members 
DROP CONSTRAINT IF EXISTS trial_members_role_id_fkey;

ALTER TABLE public.trial_members 
ADD CONSTRAINT trial_members_role_id_fkey 
FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;
