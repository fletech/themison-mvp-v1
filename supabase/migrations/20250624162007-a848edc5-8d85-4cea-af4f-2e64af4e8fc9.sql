
-- Add onboarding_completed to members table
ALTER TABLE public.members 
ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Remove onboarding_completed from profiles table
ALTER TABLE public.profiles 
DROP COLUMN onboarding_completed;

-- Update the trigger function to set onboarding_completed in members instead of profiles
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    invitation_record record;
BEGIN
    -- Only proceed if email is confirmed (email_confirmed_at is set)
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        RAISE LOG 'User email confirmed for: %', NEW.email;
        
        -- Try to find a matching invitation
        SELECT * INTO invitation_record
        FROM invitations
        WHERE email = NEW.email 
        AND status = 'pending'
        AND (expires_at IS NULL OR expires_at > now())
        ORDER BY invited_at DESC
        LIMIT 1;
        
        IF FOUND THEN
            RAISE LOG 'Found matching invitation with ID: %', invitation_record.id;
            
            -- First, ensure profile exists
            INSERT INTO profiles (
                id, email, first_name, last_name
            ) VALUES (
                NEW.id,
                NEW.email,
                NEW.raw_user_meta_data ->> 'first_name',
                NEW.raw_user_meta_data ->> 'last_name'
            ) ON CONFLICT (id) DO NOTHING;
            
            -- Then create member record with onboarding_completed = false
            INSERT INTO members (
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
            UPDATE invitations 
            SET status = 'accepted', accepted_at = now()
            WHERE id = invitation_record.id;
            
            RAISE LOG 'Updated invitation status to accepted for ID: %', invitation_record.id;
        ELSE
            RAISE LOG 'No valid invitation found for email: %', NEW.email;
            
            -- Still create the profile for users without invitations
            INSERT INTO profiles (
                id, email, first_name, last_name
            ) VALUES (
                NEW.id,
                NEW.email,
                NEW.raw_user_meta_data ->> 'first_name',
                NEW.raw_user_meta_data ->> 'last_name'
            ) ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;
