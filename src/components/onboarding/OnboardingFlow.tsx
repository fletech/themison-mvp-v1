
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Send invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async (members: any[]) => {
      const { data: userOrgData } = await supabase
        .rpc('user_organization_status', { user_profile_id: user?.id });
      
      if (!userOrgData || userOrgData.length === 0) {
        throw new Error('User organization not found');
      }

      const organizationId = userOrgData[0].organization_id;

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
      const { data: userOrgData } = await supabase
        .rpc('user_organization_status', { user_profile_id: user?.id });
      
      if (!userOrgData || userOrgData.length === 0) {
        throw new Error('User organization not found');
      }

      const organizationId = userOrgData[0].organization_id;

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
      const { data: userOrgData } = await supabase
        .rpc('user_organization_status', { user_profile_id: user?.id });
      
      if (!userOrgData || userOrgData.length === 0) {
        throw new Error('User organization not found');
      }

      const organizationId = userOrgData[0].organization_id;

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
        // Find PI role (should be created in step 2)
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
