
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CreateTrial } from './CreateTrial';
import { OnboardingLayout } from './OnboardingLayout';

interface AdminOverviewProps {
  member: any;
  organization: any;
}

export function AdminOverview({ member, organization }: AdminOverviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  console.log('AdminOverview props:', { member, organization });

  const createTrialMutation = useMutation({
    mutationFn: async (trialData: any) => {
      console.log('AdminOverview - createTrialMutation received trialData:', trialData);
      
      if (!organization?.id || !member?.id) {
        throw new Error('No organization or member ID available');
      }

      // Prepare trial data - explicitly exclude pi_contact
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

      console.log('AdminOverview - Inserting trial with data:', trialInsertData);

      // Create the trial without pi_contact field
      const { data: trial, error: trialError } = await supabase
        .from('trials')
        .insert(trialInsertData)
        .select()
        .single();

      if (trialError) {
        console.error('AdminOverview - Trial creation error:', trialError);
        throw trialError;
      }

      console.log('AdminOverview - Trial created successfully:', trial);

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
      console.error('AdminOverview - Create trial mutation error:', error);
      toast.error('Failed to complete setup: ' + error.message);
    }
  });

  const handleCreateTrial = (trialData: any) => {
    console.log('AdminOverview - handleCreateTrial called with:', trialData);
    
    // Clear any potential cached queries that might interfere
    queryClient.removeQueries({ queryKey: ['trials'] });
    
    createTrialMutation.mutate(trialData);
  };

  return (
    <OnboardingLayout
      title="Complete Setup"
      subtitle="Create your first trial to complete the organization setup"
      currentStep={1}
      totalSteps={1}
    >
      <CreateTrial 
        onComplete={handleCreateTrial}
        isFirstTrial={true}
        organizationId={organization?.id}
      />
    </OnboardingLayout>
  );
}
