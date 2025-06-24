
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { OnboardingLayout } from './OnboardingLayout';
import { InviteMembers } from './InviteMembers';
import { CreateCustomRoles } from './CreateCustomRoles';
import { CreateFirstTrial } from './CreateFirstTrial';

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [invitedMembers, setInvitedMembers] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Create organization and member record
  const createOrganizationMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user found');

      // First check if user already has an organization
      const { data: existingMember } = await supabase
        .from('members')
        .select('organization_id, organizations(name)')
        .eq('profile_id', user.id)
        .single();

      if (existingMember) {
        return existingMember.organization_id;
      }

      // Create organization
      const orgName = `${user.user_metadata?.first_name || user.email.split('@')[0]}'s Organization`;
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          created_by: user.id
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create member record for the creator
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email,
          email: user.email,
          organization_id: org.id,
          profile_id: user.id,
          default_role: 'admin',
          onboarding_completed: false
        });

      if (memberError) throw memberError;

      return org.id;
    },
    onSuccess: (orgId) => {
      setOrganizationId(orgId);
      toast.success('Organization created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create organization: ' + error.message);
    }
  });

  // Send invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async (members: any[]) => {
      if (!organizationId) {
        throw new Error('No organization ID available');
      }

      const invitations = members.map(member => ({
        name: member.name,
        email: member.email,
        organization_id: organizationId,
        initial_role: member.role,
        invited_by: user?.id,
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
      if (!organizationId) {
        throw new Error('No organization ID available');
      }

      const rolesToCreate = roles.map(role => ({
        name: role.name,
        description: role.description,
        permission_level: role.permission_level,
        organization_id: organizationId,
        created_by: user?.id
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
      if (!organizationId) {
        throw new Error('No organization ID available');
      }

      // Create the trial
      const { data: trial, error: trialError } = await supabase
        .from('trials')
        .insert({
          name: trialData.name,
          description: trialData.description,
          phase: trialData.phase,
          sponsor: trialData.sponsor,
          location: trialData.location,
          pi_contact: trialData.pi_contact,
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
        // Find PI role
        const { data: piRole } = await supabase
          .from('roles')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('name', 'Principal Investigator (PI)')
          .single();

        if (piRole) {
          // Get current user's member record
          const { data: memberData } = await supabase
            .from('members')
            .select('id')
            .eq('profile_id', user?.id)
            .single();

          if (memberData) {
            await supabase
              .from('trial_members')
              .insert({
                trial_id: trial.id,
                member_id: memberData.id,
                role_id: piRole.id,
                is_active: true,
                start_date: new Date().toISOString().split('T')[0]
              });
          }
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

  // Initialize organization on component mount
  React.useEffect(() => {
    if (user && !organizationId) {
      createOrganizationMutation.mutate();
    }
  }, [user]);

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

  // Show loading while creating organization
  if (createOrganizationMutation.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your organization...</p>
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
            <CreateFirstTrial onComplete={handleStep3Complete} />
          </OnboardingLayout>
        );
      default:
        return null;
    }
  };

  return renderCurrentStep();
}
