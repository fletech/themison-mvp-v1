
-- Add onboarding completion flag to organizations table
ALTER TABLE organizations ADD COLUMN onboarding_completed boolean DEFAULT false;
