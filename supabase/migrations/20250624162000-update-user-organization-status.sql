
-- Update the user_organization_status function to return onboarding_completed from members table
CREATE OR REPLACE FUNCTION public.user_organization_status(user_profile_id uuid)
RETURNS TABLE(organization_id uuid, organization_name text, default_role text, member_since timestamp with time zone, onboarding_completed boolean)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        o.id as organization_id,
        o.name as organization_name,
        m.default_role::text,
        m.created_at as member_since,
        m.onboarding_completed
    FROM members m
    JOIN organizations o ON m.organization_id = o.id
    WHERE m.profile_id = user_profile_id
    LIMIT 1;
END;
$function$;
