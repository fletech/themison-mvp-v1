import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { OnboardingLayout } from './OnboardingLayout';
import { InviteMembers } from './InviteMembers';
import { CreateCustomRoles } from './CreateCustomRoles';
import { CreateTrial } from './CreateTrial';

interface AdminSetupFlowProps {
  member: any;
  organization: any;
}

export function AdminSetupFlow({ member, organization }: AdminSetupFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Send invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async (members: any[]) => {
      if (!organization.id || !member.id) {
        throw new Error('No organization or member ID available');
      }

      const invitations = members.map(m => ({
        name: m.name,
        email: m.email,
        organization_id: organization.id,
        initial_role: m.role,
        invited_by: member.id,
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
    },
    onError: (error) => {
      toast.error('Failed to send invitations: ' + error.message);
    }
  });

  // Create roles mutation
  const createRolesMutation = useMutation({
    mutationFn: async (roles: any[]) => {
      if (!organization.id || !user?.id) {
        throw new Error('No organization ID available');
      }

      const rolesToCreate = roles.map(role => ({
        name: role.name,
        description: role.description,
        permission_level: role.permission_level,
        organization_id: organization.id,
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

  // Create trial mutation using the new stored procedure
  const createTrialMutation = useMutation({
    mutationFn: async (trialData: any) => {
      if (!organization.id || !member.id) {
        throw new Error('No organization or member ID available');
      }

      // Prepare team assignments including PI if checked
      let teamAssignments = [...(trialData.teamAssignments || [])];
      
      // Add PI assignment if requested
      if (trialData.autoAssignAsPI) {
        const { data: piRole } = await supabase
          .from('roles')
          .select('id')
          .eq('organization_id', organization.id)
          .or('name.ilike.%PI%,name.ilike.%Principal Investigator%')
          .limit(1)
          .single();

        if (piRole) {
          teamAssignments.push({
            member_id: member.id,
            role_id: piRole.id,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          });
        }
      }

      // Use the stored procedure to create trial with members atomically
      const { data: trialId, error: trialError } = await supabase.rpc('create_trial_with_members', {
        trial_data: {
          name: trialData.name,
          description: trialData.description,
          phase: trialData.phase,
          sponsor: trialData.sponsor,
          location: trialData.location,
          study_start: trialData.study_start,
          estimated_close_out: trialData.estimated_close_out
        },
        team_assignments: teamAssignments
      });

      if (trialError) throw trialError;

      // Complete onboarding for both member and organization
      const updatePromises = [
        supabase.from('members')
          .update({ onboarding_completed: true })
          .eq('profile_id', user?.id),
        supabase.from('organizations')
          .update({ onboarding_completed: true })
          .eq('id', organization.id)
      ];

      await Promise.all(updatePromises);

      return trialId;
    },
    onSuccess: () => {
      toast.success('Setup completed! Welcome to THEMISON!');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error('Failed to complete setup: ' + error.message);
    }
  });

  const handleStep1Continue = (members: any[]) => {
    if (members.length > 0) {
      sendInvitationsMutation.mutate(members);
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = (roles: any[]) => {
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
            <CreateTrial 
              onComplete={handleStep3Complete} 
              isFirstTrial={true}
              organizationId={organization.id}
            />
          </OnboardingLayout>
        );
      default:
        return null;
    }
  };

  return renderCurrentStep();
}
