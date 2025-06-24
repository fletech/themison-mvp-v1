
-- Create the trigger that will fire when a new profile is inserted
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_invitation_acceptance();
