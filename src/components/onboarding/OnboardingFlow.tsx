
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
        invited_by: currentMemberId,
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
      console.log('🔄 OnboardingFlow - Starting trial creation process');
      console.log('📝 OnboardingFlow - Received trialData:', JSON.stringify(trialData, null, 2));
      
      if (!organizationId || !currentMemberId) {
        console.error('❌ OnboardingFlow - Missing required IDs:', {
          organizationId,
          currentMemberId
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
        organization_id: organizationId,
        created_by: user?.id,
        status: 'planning'
      };

      console.log('📋 OnboardingFlow - Trial insert data prepared:', JSON.stringify(trialInsertData, null, 2));

      // Create the trial without pi_contact field
      console.log('🚀 OnboardingFlow - Inserting trial into database...');
      const { data: trial, error: trialError } = await supabase
        .from('trials')
        .insert(trialInsertData)
        .select()
        .single();

      if (trialError) {
        console.error('❌ OnboardingFlow - Trial creation error:', trialError);
        throw trialError;
      }

      console.log('✅ OnboardingFlow - Trial created successfully:', trial);

      // Auto-assign PI logic
      if (trialData.autoAssignAsPI) {
        console.log('👨‍⚕️ OnboardingFlow - Auto-assigning current user as PI...');
        
        // Find PI role (look for Principal Investigator roles first)
        console.log('🔍 OnboardingFlow - Searching for PI role in organization:', organizationId);
        const { data: piRole, error: piRoleError } = await supabase
          .from('roles')
          .select('id, name')
          .eq('organization_id', organizationId)
          .or('name.ilike.%PI%,name.ilike.%Principal Investigator%')
          .order('name')
          .limit(1)
          .single();

        if (piRoleError) {
          console.error('❌ OnboardingFlow - Error finding PI role:', piRoleError);
        }

        console.log('🔍 OnboardingFlow - PI role search result:', piRole);

        if (piRole) {
          const piAssignmentData = {
            trial_id: trial.id,
            member_id: currentMemberId,
            role_id: piRole.id,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          };

          console.log('👨‍⚕️ OnboardingFlow - Inserting PI assignment:', JSON.stringify(piAssignmentData, null, 2));

          const { data: piAssignmentResult, error: piAssignError } = await supabase
            .from('trial_members')
            .insert(piAssignmentData)
            .select();

          if (piAssignError) {
            console.error('❌ OnboardingFlow - Error assigning PI:', piAssignError);
            console.error('❌ OnboardingFlow - PI assignment data that failed:', JSON.stringify(piAssignmentData, null, 2));
          } else {
            console.log('✅ OnboardingFlow - Auto-assigned user as PI to trial');
            console.log('✅ OnboardingFlow - PI assignment result:', piAssignmentResult);
          }
        } else {
          console.warn('⚠️ OnboardingFlow - No PI role found for auto-assignment');
        }
      }

      // Team assignments logic
      console.log('👥 OnboardingFlow - Processing team assignments...');
      console.log('📋 OnboardingFlow - Team assignments data:', JSON.stringify(trialData.teamAssignments, null, 2));

      if (trialData.teamAssignments && trialData.teamAssignments.length > 0) {
        console.log(`👥 OnboardingFlow - Found ${trialData.teamAssignments.length} team assignments to process`);
        
        const validAssignments = trialData.teamAssignments.filter((assignment: any) => {
          const isValid = assignment.memberId && assignment.roleId;
          console.log('🔍 OnboardingFlow - Assignment validation:', {
            assignment,
            isValid,
            hasMemberId: !!assignment.memberId,
            hasRoleId: !!assignment.roleId
          });
          return isValid;
        });

        console.log(`✅ OnboardingFlow - ${validAssignments.length} valid assignments out of ${trialData.teamAssignments.length}`);

        if (validAssignments.length > 0) {
          const teamAssignments = validAssignments.map((assignment: any) => ({
            trial_id: trial.id,
            member_id: assignment.memberId,
            role_id: assignment.roleId,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0]
          }));

          console.log('📋 OnboardingFlow - Prepared team assignments for insert:', JSON.stringify(teamAssignments, null, 2));

          console.log('🚀 OnboardingFlow - Inserting team assignments into trial_members...');
          
          // Insert each assignment individually to better track errors
          const insertResults = [];
          for (let i = 0; i < teamAssignments.length; i++) {
            const assignment = teamAssignments[i];
            console.log(`🔄 OnboardingFlow - Inserting assignment ${i + 1}/${teamAssignments.length}:`, assignment);
            
            const { data: insertedAssignment, error: assignmentError } = await supabase
              .from('trial_members')
              .insert(assignment)
              .select();
            
            if (assignmentError) {
              console.error(`❌ OnboardingFlow - Error inserting assignment ${i + 1}:`, assignmentError);
              console.error(`❌ OnboardingFlow - Failed assignment data:`, JSON.stringify(assignment, null, 2));
            } else {
              console.log(`✅ OnboardingFlow - Assignment ${i + 1} inserted successfully:`, insertedAssignment);
              insertResults.push(insertedAssignment[0]);
            }
          }

          console.log(`📊 OnboardingFlow - Final results: ${insertResults.length}/${teamAssignments.length} assignments inserted successfully`);
          console.log('📋 OnboardingFlow - All inserted assignments:', insertResults);
        } else {
          console.warn('⚠️ OnboardingFlow - No valid team assignments to insert');
        }
      } else {
        console.log('ℹ️ OnboardingFlow - No team assignments provided');
      }

      // Mark onboarding as completed
      console.log('🏁 OnboardingFlow - Marking onboarding as completed...');
      const { error: onboardingError } = await supabase
        .from('members')
        .update({ onboarding_completed: true })
        .eq('profile_id', user?.id);

      if (onboardingError) {
        console.error('❌ OnboardingFlow - Error updating onboarding status:', onboardingError);
      } else {
        console.log('✅ OnboardingFlow - Onboarding marked as completed');
      }

      console.log('🎉 OnboardingFlow - Trial creation process completed successfully');
      return trial;
    },
    onSuccess: () => {
      console.log('🎉 OnboardingFlow - Trial creation mutation succeeded');
      toast.success('Trial created successfully! Welcome to THEMISON!');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('💥 OnboardingFlow - Trial creation mutation failed:', error);
      toast.error('Failed to create trial: ' + error.message);
    }
  });

  const handleStep1Continue = (members: any[]) => {
    console.log('📝 OnboardingFlow - Step 1 completed with members:', members);
    setInvitedMembers(members);
    if (members.length > 0) {
      sendInvitationsMutation.mutate(members);
    }
    setCurrentStep(2);
  };

  const handleStep2Continue = (roles: any[]) => {
    console.log('📝 OnboardingFlow - Step 2 completed with roles:', roles);
    setCustomRoles(roles);
    createRolesMutation.mutate(roles);
    setCurrentStep(3);
  };

  const handleStep3Complete = (trialData: any) => {
    console.log('📝 OnboardingFlow - Step 3 completed, triggering trial creation');
    console.log('📋 OnboardingFlow - handleStep3Complete called with:', JSON.stringify(trialData, null, 2));
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
