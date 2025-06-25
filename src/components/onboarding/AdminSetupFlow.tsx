
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

  // Create trial and complete onboarding mutation
  const createTrialMutation = useMutation({
    mutationFn: async (trialData: any) => {
      if (!organization.id || !member.id) {
        throw new Error('No organization or member ID available');
      }

      const piContact = trialData.autoAssignAsPI && member.email 
        ? member.email 
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
          organization_id: organization.id,
          created_by: user?.id,
          status: 'planning'
        })
        .select()
        .single();

      if (trialError) throw trialError;

      // Auto-assign as PI if requested
      if (trialData.autoAssignAsPI) {
        const { data: piRole } = await supabase
          .from('roles')
          .select('id')
          .eq('organization_id', organization.id)
          .or('name.ilike.%PI%,name.ilike.%Principal Investigator%')
          .order('name')
          .limit(1)
          .single();

        if (piRole) {
          await supabase
            .from('trial_members')
            .insert({
              trial_id: trial.id,
              member_id: member.id,
              role_id: piRole.id,
              is_active: true,
              start_date: new Date().toISOString().split('T')[0]
            });
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
        }
      }

      // Complete onboarding for both member and organization
      await Promise.all([
        supabase.from('members')
          .update({ onboarding_completed: true })
          .eq('profile_id', user?.id),
        supabase.from('organizations')
          .update({ onboarding_completed: true })
          .eq('id', organization.id)
      ]);

      return trial;
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
