
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { OnboardingLayout } from './OnboardingLayout';
import { InviteMembers } from './InviteMembers';
import { CreateCustomRoles } from './CreateCustomRoles';
import { CreateTrial } from './CreateTrial';

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [invitedMembers, setInvitedMembers] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's organization ID and member info
  const { data: memberData, isLoading: memberLoading, error: memberError } = useQuery({
    queryKey: ['user-organization', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('members')
        .select('id, organization_id, email, organizations(name)')
        .eq('profile_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User is not part of any organization');

      return data;
    },
    enabled: !!user?.id
  });

  const organizationId = memberData?.organization_id;
  const currentMemberId = memberData?.id;
  const currentMemberEmail = memberData?.email;

  // Send invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async (members: any[]) => {
      if (!organizationId || !currentMemberId) {
        throw new Error('No organization or member ID available');
      }

      const invitations = members.map(member => ({
        name: member.name,
        email: member.email,
        organization_id: organizationId,
        initial_role: member.role,
        invited_by: currentMemberId, // Using member_id instead of profile_id
        status: 'pending'
      }));

      const { error } = await supabase
        .from('invitations')
        .insert(invitations);

      if (error) throw error;

      return invitations;
    },
    onSuccess: () => {
      toast.success('Invitations sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['pending-invitations-count'] });
    },
    onError: (error) => {
      toast.error('Failed to send invitations: ' + error.message);
    }
  });

  // Create roles mutation
  const createRolesMutation = useMutation({
    mutationFn: async (roles: any[]) => {
      if (!organizationId || !user?.id) {
        throw new Error('No organization ID available');
      }

      const rolesToCreate = roles.map(role => ({
        name: role.name,
        description: role.description,
        permission_level: role.permission_level,
        organization_id: organizationId,
        created_by: user.id
      }));

      const { error } = await supabase
        .from('roles')
        .insert(rolesToCreate);

      if (error) throw error;

      return rolesToCreate;
    },
    onSuccess: () => {
      toast.success('Custom roles created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create roles: ' + error.message);
    }
  });

  // Create trial and complete onboarding mutation
  const createTrialMutation = useMutation({
    mutationFn: async (trialData: any) => {
      if (!organizationId || !currentMemberId) {
        throw new Error('No organization or member ID available');
      }

      // Use member email as PI contact if auto-assigning as PI
      const piContact = trialData.autoAssignAsPI && currentMemberEmail 
        ? currentMemberEmail 
        : trialData.pi_contact;

      // Create the trial
      const { data: trial, error: trialError } = await supabase
        .from('trials')
        .insert({
          name: trialData.name,
          description: trialData.description,
          phase: trialData.phase,
          sponsor: trialData.sponsor,
          location: trialData.location,
          pi_contact: piContact,
          study_start: trialData.study_start,
          estimated_close_out: trialData.estimated_close_out,
          organization_id: organizationId,
          created_by: user?.id,
          status: 'planning'
        })
        .select()
        .single();

      if (trialError) throw trialError;

      // If auto-assign as PI, add user to trial team
      if (trialData.autoAssignAsPI) {
        // Find PI role (look for Principal Investigator roles first)
        const { data: piRole } = await supabase
          .from('roles')
          .select('id')
          .eq('organization_id', organizationId)
          .or('name.ilike.%PI%,name.ilike.%Principal Investigator%')
          .order('name')
          .limit(1)
          .single();

        if (piRole) {
          await supabase
            .from('trial_members')
            .insert({
              trial_id: trial.id,
              member_id: currentMemberId,
              role_id: piRole.id,
              is_active: true,
              start_date: new Date().toISOString().split('T')[0]
            });

          console.log('Auto-assigned user as PI to trial');
        } else {
          console.warn('No PI role found for auto-assignment');
        }
      }

      // Assign team members to trial
      if (trialData.teamAssignments && trialData.teamAssignments.length > 0) {
        const teamAssignments = trialData.teamAssignments
          .filter((assignment: any) => assignment.memberId && assignment.roleId)
          .map((assignment: any) => ({
            trial_id: trial.id,
            member_id: assignment.memberId,
            role_id: assignment.roleId,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          }));

        if (teamAssignments.length > 0) {
          await supabase
            .from('trial_members')
            .insert(teamAssignments);
          
          console.log(`Assigned ${teamAssignments.length} team members to trial`);
        }
      }

      // Mark onboarding as completed
      await supabase
        .from('members')
        .update({ onboarding_completed: true })
        .eq('profile_id', user?.id);

      return trial;
    },
    onSuccess: () => {
      toast.success('Trial created successfully! Welcome to THEMISON!');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error('Failed to create trial: ' + error.message);
    }
  });

  const handleStep1Continue = (members: any[]) => {
    setInvitedMembers(members);
    if (members.length > 0) {
      sendInvitationsMutation.mutate(members);
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = (roles: any[]) => {
    setCustomRoles(roles);
    createRolesMutation.mutate(roles);
    setCurrentStep(3);
  };

  const handleStep3Complete = (trialData: any) => {
    createTrialMutation.mutate(trialData);
  };

  // Show loading while fetching organization data
  if (memberLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your organization...</p>
        </div>
      </div>
    );
  }

  // Show error if user doesn't have an organization
  if (memberError || !organizationId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Organization Not Found</h2>
            <p className="text-red-700 mb-4">
              You don't seem to be part of any organization. Please contact your administrator.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingLayout
            title="Invite Team Members"
            subtitle="Build your organization team by inviting members and assigning organizational roles"
            currentStep={1}
            totalSteps={3}
          >
            <InviteMembers onContinue={handleStep1Continue} />
          </OnboardingLayout>
        );
      case 2:
        return (
          <OnboardingLayout
            title="Create Custom Roles"
            subtitle="Define trial-specific roles that can be assigned to team members within individual studies"
            currentStep={2}
            totalSteps={3}
            onBack={() => setCurrentStep(1)}
          >
            <CreateCustomRoles onContinue={handleStep2Continue} />
          </OnboardingLayout>
        );
      case 3:
        return (
          <OnboardingLayout
            title="Create Your First Trial"
            subtitle="Set up your first clinical trial to get started with the platform"
            currentStep={3}
            totalSteps={3}
            onBack={() => setCurrentStep(2)}
          >
            <CreateTrial 
              onComplete={handleStep3Complete} 
              isFirstTrial={true}
              organizationId={organizationId}
            />
          </OnboardingLayout>
        );
      default:
        return null;
    }
  };

  return renderCurrentStep();
}
