
-- Clean up old functions and ensure proper flow
DROP FUNCTION IF EXISTS public.handle_invitation_acceptance() CASCADE;
DROP TRIGGER IF EXISTS handle_invitation_acceptance_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP TRIGGER IF EXISTS handle_new_profile_trigger ON public.profiles;
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;

-- Recreate the correct functions
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only proceed if email is confirmed (email_confirmed_at is set)
    IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
        RAISE LOG 'User email confirmed for: %', NEW.email;
        
        -- Create profile - this will trigger the next function
        INSERT INTO public.profiles (
            id, email, first_name, last_name
        ) VALUES (
            NEW.id,
            NEW.email,
            NEW.raw_user_meta_data ->> 'first_name',
            NEW.raw_user_meta_data ->> 'last_name'
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE LOG 'Profile created for user: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record record;
BEGIN
    RAISE LOG 'New profile created for email: %', NEW.email;
    
    -- Try to find a matching invitation
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE email = NEW.email 
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now())
    ORDER BY invited_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        RAISE LOG 'Found matching invitation with ID: %', invitation_record.id;
        
        -- Create member record
        INSERT INTO public.members (
            name, email, organization_id, profile_id, 
            default_role, invited_by, created_at, onboarding_completed
        ) VALUES (
            invitation_record.name,
            invitation_record.email,
            invitation_record.organization_id,
            NEW.id,
            invitation_record.initial_role,
            invitation_record.invited_by,
            now(),
            false
        );
        
        RAISE LOG 'Created member record for profile: %', NEW.id;
        
        -- Update invitation status
        UPDATE public.invitations 
        SET status = 'accepted', accepted_at = now()
        WHERE id = invitation_record.id;
        
        RAISE LOG 'Updated invitation status to accepted for ID: %', invitation_record.id;
    ELSE
        RAISE LOG 'No valid invitation found for email: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the triggers with proper separation
CREATE TRIGGER handle_email_confirmation_trigger
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_email_confirmation();

CREATE TRIGGER handle_new_profile_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_profile();
