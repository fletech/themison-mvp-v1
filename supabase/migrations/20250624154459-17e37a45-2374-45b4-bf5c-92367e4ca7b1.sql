
-- Update the handle_invitation_acceptance function with better debugging
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    invitation_record record;
BEGIN
    -- Log the new profile being created
    RAISE LOG 'Profile created for email: %', NEW.email;
    
    -- Try to find a matching invitation
    SELECT * INTO invitation_record
    FROM invitations
    WHERE email = NEW.email 
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;
    
    IF FOUND THEN
        RAISE LOG 'Found matching invitation with ID: %', invitation_record.id;
        
        -- Insert into members table
        INSERT INTO members (
            name, email, organization_id, profile_id, 
            default_role, invited_by, created_at
        ) VALUES (
            invitation_record.name,
            invitation_record.email,
            invitation_record.organization_id,
            NEW.id,
            invitation_record.initial_role,
            invitation_record.invited_by,
            now()
        );
        
        RAISE LOG 'Created member record for profile: %', NEW.id;
        
        -- Update invitation status
        UPDATE invitations 
        SET status = 'accepted', accepted_at = now()
        WHERE id = invitation_record.id;
        
        RAISE LOG 'Updated invitation status to accepted for ID: %', invitation_record.id;
    ELSE
        RAISE LOG 'No matching invitation found for email: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$;
