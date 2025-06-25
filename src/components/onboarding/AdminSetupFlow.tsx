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
      console.log('🔄 AdminSetupFlow - Starting trial creation process');
      console.log('📝 AdminSetupFlow - Received trialData:', JSON.stringify(trialData, null, 2));
      
      if (!organization.id || !member.id) {
        console.error('❌ AdminSetupFlow - Missing required IDs:', {
          organizationId: organization.id,
          memberId: member.id
        });
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

      console.log('📋 AdminSetupFlow - Trial insert data prepared:', JSON.stringify(trialInsertData, null, 2));

      // Create the trial without pi_contact field
      console.log('🚀 AdminSetupFlow - Inserting trial into database...');
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

      // Auto-assign as PI if requested
      if (trialData.autoAssignAsPI) {
        console.log('👨‍⚕️ AdminSetupFlow - Auto-assigning current user as PI...');
        
        console.log('🔍 AdminSetupFlow - Searching for PI role in organization:', organization.id);
        const { data: piRole, error: piRoleError } = await supabase
          .from('roles')
          .select('id, name')
          .eq('organization_id', organization.id)
          .or('name.ilike.%PI%,name.ilike.%Principal Investigator%')
          .order('name')
          .limit(1)
          .single();

        if (piRoleError) {
          console.error('❌ AdminSetupFlow - Error finding PI role:', piRoleError);
        }

        console.log('🔍 AdminSetupFlow - PI role search result:', piRole);

        if (piRole) {
          console.log('👨‍⚕️ AdminSetupFlow - Inserting PI assignment:', {
            trial_id: trial.id,
            member_id: member.id,
            role_id: piRole.id,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          });

          const { error: piAssignError } = await supabase
            .from('trial_members')
            .insert({
              trial_id: trial.id,
              member_id: member.id,
              role_id: piRole.id,
              is_active: true,
              start_date: new Date().toISOString().split('T')[0]
            });

          if (piAssignError) {
            console.error('❌ AdminSetupFlow - Error assigning PI:', piAssignError);
          } else {
            console.log('✅ AdminSetupFlow - Auto-assigned user as PI to trial');
          }
        } else {
          console.warn('⚠️ AdminSetupFlow - No PI role found for auto-assignment');
        }
      }

      // Team assignments logic
      console.log('👥 AdminSetupFlow - Processing team assignments...');
      console.log('📋 AdminSetupFlow - Team assignments data:', JSON.stringify(trialData.teamAssignments, null, 2));

      if (trialData.teamAssignments && trialData.teamAssignments.length > 0) {
        console.log(`👥 AdminSetupFlow - Found ${trialData.teamAssignments.length} team assignments to process`);
        
        const validAssignments = trialData.teamAssignments.filter((assignment: any) => {
          const isValid = assignment.memberId && assignment.roleId;
          console.log('🔍 AdminSetupFlow - Assignment validation:', {
            assignment,
            isValid,
            hasMemberId: !!assignment.memberId,
            hasRoleId: !!assignment.roleId
          });
          return isValid;
        });

        console.log(`✅ AdminSetupFlow - ${validAssignments.length} valid assignments out of ${trialData.teamAssignments.length}`);

        if (validAssignments.length > 0) {
          const teamAssignments = validAssignments.map((assignment: any) => ({
            trial_id: trial.id,
            member_id: assignment.memberId,
            role_id: assignment.roleId,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          }));

          console.log('📋 AdminSetupFlow - Prepared team assignments for insert:', JSON.stringify(teamAssignments, null, 2));

          console.log('🚀 AdminSetupFlow - Inserting team assignments into trial_members...');
          const { data: insertedAssignments, error: assignmentError } = await supabase
            .from('trial_members')
            .insert(teamAssignments)
            .select();

          if (assignmentError) {
            console.error('❌ AdminSetupFlow - Error inserting team assignments:', assignmentError);
            console.error('❌ AdminSetupFlow - Failed assignments data:', JSON.stringify(teamAssignments, null, 2));
          } else {
            console.log('✅ AdminSetupFlow - Team assignments inserted successfully:', insertedAssignments);
            console.log(`✅ AdminSetupFlow - Assigned ${teamAssignments.length} team members to trial`);
          }
        } else {
          console.warn('⚠️ AdminSetupFlow - No valid team assignments to insert');
        }
      } else {
        console.log('ℹ️ AdminSetupFlow - No team assignments provided');
      }

      // Complete onboarding for both member and organization
      console.log('🏁 AdminSetupFlow - Completing onboarding...');
      const updatePromises = [
        supabase.from('members')
          .update({ onboarding_completed: true })
          .eq('profile_id', user?.id),
        supabase.from('organizations')
          .update({ onboarding_completed: true })
          .eq('id', organization.id)
      ];

      const results = await Promise.allSettled(updatePromises);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ AdminSetupFlow - Error updating ${index === 0 ? 'member' : 'organization'} onboarding:`, result.reason);
        } else {
          console.log(`✅ AdminSetupFlow - Updated ${index === 0 ? 'member' : 'organization'} onboarding successfully`);
        }
      });

      console.log('🎉 AdminSetupFlow - Trial creation process completed successfully');
      return trial;
    },
    onSuccess: () => {
      console.log('🎉 AdminSetupFlow - Trial creation mutation succeeded');
      toast.success('Setup completed! Welcome to THEMISON!');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('💥 AdminSetupFlow - Trial creation mutation failed:', error);
      toast.error('Failed to complete setup: ' + error.message);
    }
  });

  const handleStep1Continue = (members: any[]) => {
    console.log('📝 AdminSetupFlow - Step 1 completed with members:', members);
    if (members.length > 0) {
      sendInvitationsMutation.mutate(members);
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = (roles: any[]) => {
    console.log('📝 AdminSetupFlow - Step 2 completed with roles:', roles);
    createRolesMutation.mutate(roles);
    setCurrentStep(3);
  };

  const handleStep3Complete = (trialData: any) => {
    console.log('📝 AdminSetupFlow - Step 3 completed, triggering trial creation');
    console.log('📋 AdminSetupFlow - handleStep3Complete called with:', JSON.stringify(trialData, null, 2));
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
