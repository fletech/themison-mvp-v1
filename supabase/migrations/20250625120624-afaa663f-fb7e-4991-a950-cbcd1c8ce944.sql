
-- First, ensure RLS is enabled on trial_members
ALTER TABLE public.trial_members ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id_for_trial_members()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT m.organization_id
        FROM members m
        WHERE m.profile_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a security definer function to check if user can access trial
CREATE OR REPLACE FUNCTION public.user_can_access_trial(trial_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM trials t
        JOIN members m ON t.organization_id = m.organization_id
        WHERE t.id = trial_id_param 
        AND m.profile_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "trial_members_select_policy" ON public.trial_members;
DROP POLICY IF EXISTS "trial_members_insert_policy" ON public.trial_members;
DROP POLICY IF EXISTS "trial_members_update_policy" ON public.trial_members;
DROP POLICY IF EXISTS "trial_members_delete_policy" ON public.trial_members;

-- Create safe policies using security definer functions
CREATE POLICY "Users can view trial members from their organization" 
ON public.trial_members 
FOR SELECT 
USING (public.user_can_access_trial(trial_id));

CREATE POLICY "Users can insert trial members for their organization trials" 
ON public.trial_members 
FOR INSERT 
WITH CHECK (public.user_can_access_trial(trial_id));

CREATE POLICY "Users can update trial members for their organization trials" 
ON public.trial_members 
FOR UPDATE 
USING (public.user_can_access_trial(trial_id));

CREATE POLICY "Users can delete trial members for their organization trials" 
ON public.trial_members 
FOR DELETE 
USING (public.user_can_access_trial(trial_id));
