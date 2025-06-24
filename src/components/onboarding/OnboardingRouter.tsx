
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminSetupFlow } from './AdminSetupFlow';
import { AdminOverview } from './AdminOverview';
import { StaffOnboarding } from './StaffOnboarding';

export function OnboardingRouter() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: onboardingData, isLoading } = useQuery({
    queryKey: ['onboarding-routing', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user found');

      // Get member data
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('onboarding_completed, default_role, organization_id')
        .eq('profile_id', user.id)
        .single();

      if (memberError) throw memberError;

      // If user already completed onboarding, redirect to dashboard
      if (member.onboarding_completed) {
        navigate('/dashboard');
        return null;
      }

      // Get organization data
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('onboarding_completed, name')
        .eq('id', member.organization_id)
        .single();

      if (orgError) throw orgError;

      return {
        member,
        organization,
        onboardingType: determineOnboardingType(member, organization)
      };
    },
    enabled: !!user?.id
  });

  const determineOnboardingType = (member: any, organization: any) => {
    if (member.default_role === 'admin') {
      return organization.onboarding_completed ? 'admin-overview' : 'admin-setup';
    }
    return 'staff';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (!onboardingData) {
    return null; // User was redirected to dashboard
  }

  const { onboardingType, member, organization } = onboardingData;

  switch (onboardingType) {
    case 'admin-setup':
      return <AdminSetupFlow member={member} organization={organization} />;
    case 'admin-overview':
      return <AdminOverview member={member} organization={organization} />;
    case 'staff':
      return <StaffOnboarding member={member} organization={organization} />;
    default:
      return <AdminSetupFlow member={member} organization={organization} />;
  }
}
