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

  // Create trial mutation - refactored to use single batch insert
  const createTrialMutation = useMutation({
    mutationFn: async (trialData: any) => {
      if (!organization.id || !member.id) {
        throw new Error('No organization or member ID available');
      }

      console.log('🚀 AdminSetupFlow - Creating trial with data:', trialData);

      // STEP 1: Create the trial
      const trialInsertData = {
        name: trialData.name,
        description: trialData.description,
        phase: trialData.phase,
        sponsor: trialData.sponsor,
        location: trialData.location,
        study_start: trialData.study_start,
        estimated_close_out: trialData.estimated_close_out,
        organization_id: organization.id,
        created_by: user?.id,
        status: 'planning'
      };

      console.log('📝 AdminSetupFlow - Creating trial with data:', trialInsertData);

      const { data: trial, error: trialError } = await supabase
        .from('trials')
        .insert(trialInsertData)
        .select()
        .single();

      if (trialError) {
        console.error('❌ AdminSetupFlow - Trial creation error:', trialError);
        throw trialError;
      }

      console.log('✅ AdminSetupFlow - Trial created successfully:', trial);

      // STEP 2: Batch insert all selected members if any
      if (trialData.selectedMembers && trialData.selectedMembers.length > 0) {
        console.log('👥 AdminSetupFlow - Preparing batch insert for members:', trialData.selectedMembers);

        const memberAssignments = trialData.selectedMembers
          .filter((member: any) => member.memberId && member.roleId) // Only include complete assignments
          .map((member: any) => ({
            trial_id: trial.id,
            member_id: member.memberId,
            role_id: member.roleId,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          }));

        console.log('📋 AdminSetupFlow - Member assignments to insert:', memberAssignments);

        if (memberAssignments.length > 0) {
          const { error: membersError } = await supabase
            .from('trial_members')
            .insert(memberAssignments);

          if (membersError) {
            console.error('❌ AdminSetupFlow - Member assignments error:', membersError);
            throw membersError;
          }

          console.log('✅ AdminSetupFlow - Member assignments created successfully');
        }
      }

      // STEP 3: Complete onboarding for both member and organization
      const updatePromises = [
        supabase.from('members')
          .update({ onboarding_completed: true })
          .eq('profile_id', user?.id),
        supabase.from('organizations')
          .update({ onboarding_completed: true })
          .eq('id', organization.id)
      ];

      await Promise.all(updatePromises);

      console.log('✅ AdminSetupFlow - Onboarding marked as completed');

      return trial;
    },
    onSuccess: () => {
      toast.success('Setup completed! Welcome to THEMISON!');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('❌ AdminSetupFlow - Create trial mutation error:', error);
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
    console.log('🎯 AdminSetupFlow - Completing step 3 with trial data:', trialData);
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
