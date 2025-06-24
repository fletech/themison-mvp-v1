
-- Update the function to debug each condition separately
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    invitation_record record;
    invitation_count integer;
    pending_count integer;
    not_expired_count integer;
BEGIN
    -- Log the new profile being created
    RAISE LOG 'Profile created for email: %', NEW.email;
    
    -- Debug: Count total invitations for this email
    SELECT COUNT(*) INTO invitation_count
    FROM invitations
    WHERE email = NEW.email;
    RAISE LOG 'Total invitations for email %: %', NEW.email, invitation_count;
    
    -- Debug: Count pending invitations for this email
    SELECT COUNT(*) INTO pending_count
    FROM invitations
    WHERE email = NEW.email AND status = 'pending';
    RAISE LOG 'Pending invitations for email %: %', NEW.email, pending_count;
    
    -- Debug: Count non-expired invitations for this email
    SELECT COUNT(*) INTO not_expired_count
    FROM invitations
    WHERE email = NEW.email 
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > now());
    RAISE LOG 'Non-expired pending invitations for email %: %', NEW.email, not_expired_count;
    
    -- Try to find a matching invitation with more flexible conditions
    SELECT * INTO invitation_record
    FROM invitations
    WHERE email = NEW.email 
    AND status = 'pending'
    ORDER BY invited_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        RAISE LOG 'Found matching invitation with ID: %, expires_at: %', invitation_record.id, invitation_record.expires_at;
        
        -- Check if it's expired
        IF invitation_record.expires_at IS NOT NULL AND invitation_record.expires_at <= now() THEN
            RAISE LOG 'Invitation % is expired (expires_at: %, now: %)', invitation_record.id, invitation_record.expires_at, now();
        ELSE
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
        END IF;
    ELSE
        RAISE LOG 'No pending invitation found for email: %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$;
