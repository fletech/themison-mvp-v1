
-- Fix the function to only create profiles when there's a valid invitation
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record record;
BEGIN
    -- Only proceed if email is confirmed (email_confirmed_at is set)
    IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
        RAISE LOG 'User email confirmed for: %', NEW.email;
        
        -- Try to find a matching invitation FIRST
        SELECT * INTO invitation_record
        FROM public.invitations
        WHERE email = NEW.email 
        AND status = 'pending'
        AND (expires_at IS NULL OR expires_at > now())
        ORDER BY invited_at DESC
        LIMIT 1;
        
        IF FOUND THEN
            RAISE LOG 'Found matching invitation with ID: %', invitation_record.id;
            
            -- Only create profile if there's a valid invitation
            INSERT INTO public.profiles (
                id, email, first_name, last_name
            ) VALUES (
                NEW.id,
                NEW.email,
                NEW.raw_user_meta_data ->> 'first_name',
                NEW.raw_user_meta_data ->> 'last_name'
            ) ON CONFLICT (id) DO NOTHING;
            
            RAISE LOG 'Profile created for invited user: %', NEW.id;
            
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
            
            RAISE LOG 'Created member record for user: %', NEW.id;
            
            -- Update invitation status
            UPDATE public.invitations 
            SET status = 'accepted', accepted_at = now()
            WHERE id = invitation_record.id;
            
            RAISE LOG 'Updated invitation status to accepted for ID: %', invitation_record.id;
        ELSE
            RAISE LOG 'No valid invitation found for email: %. User registration blocked.', NEW.email;
            -- Could optionally delete the auth user here if you want to prevent registration
            -- DELETE FROM auth.users WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;
