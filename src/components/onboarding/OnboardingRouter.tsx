
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminSetupFlow } from './AdminSetupFlow';
import { AdminOverview } from './AdminOverview';
import { StaffOnboarding } from './StaffOnboarding';

export function OnboardingRouter() {
  const { user } = useAuth();

  // Get member information
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email, onboarding_completed, default_role, organization_id')
        .eq('profile_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Get organization information
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', member?.organization_id],
    queryFn: async () => {
      if (!member?.organization_id) return null;
      
      const { data, error } = await supabase
        .from('organizations')
        .select('onboarding_completed, name, id')
        .eq('id', member.organization_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!member?.organization_id
  });

  if (memberLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no member record, something went wrong
  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h1>
          <p className="text-gray-600">Please contact your administrator to set up your account.</p>
        </div>
      </div>
    );
  }

  // Staff onboarding - simple welcome
  if (member.default_role === 'staff') {
    return <StaffOnboarding member={member} organization={organization} />;
  }

  // Admin onboarding logic
  if (member.default_role === 'admin') {
    // If organization onboarding is not completed, show setup flow
    if (!organization?.onboarding_completed) {
      return <AdminSetupFlow member={member} organization={organization} />;
    }
    
    // If organization is set up but member hasn't completed onboarding, show overview
    if (!member.onboarding_completed) {
      return <AdminOverview member={member} organization={organization} />;
    }
  }

  // Fallback - redirect to dashboard if everything is completed
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
