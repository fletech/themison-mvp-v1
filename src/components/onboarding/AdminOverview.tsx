import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Users, Shield, Eye, Plus, UserPlus, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { InviteMembers } from './InviteMembers';
import { CreateCustomRoles } from './CreateCustomRoles';
import { CreateTrial } from './CreateTrial';

interface AdminOverviewProps {
  member: any;
  organization: any;
}

export function AdminOverview({ member, organization }: AdminOverviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  const [showTrialDialog, setShowTrialDialog] = useState(false);

  // Show more states
  const [showAllTrials, setShowAllTrials] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const INITIAL_DISPLAY_LIMIT = 5;

  console.log('AdminOverview props:', { member, organization });

  // Get organization metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['organization-metrics', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        console.log('No organization ID available for metrics');
        return {
          trials: [],
          members: [],
          roles: []
        };
      }
      
      console.log('Fetching metrics for organization:', organization.id);
      
      const [trialsResult, membersResult, rolesResult] = await Promise.all([
        supabase
          .from('trials')
          .select('id, name, status, phase, sponsor, created_at')
          .eq('organization_id', organization.id),
        supabase
          .from('members')
          .select('id, name, email, default_role')
          .eq('organization_id', organization.id),
        supabase
          .from('roles')
          .select('*')
          .eq('organization_id', organization.id)
      ]);

      console.log('Metrics fetched:', { trialsResult, membersResult, rolesResult });

      if (trialsResult.error) console.error('Trials error:', trialsResult.error);
      if (membersResult.error) console.error('Members error:', membersResult.error);
      if (rolesResult.error) console.error('Roles error:', rolesResult.error);

      return {
        trials: trialsResult.data || [],
        members: membersResult.data || [],
        roles: rolesResult.data || []
      };
    },
    enabled: !!organization?.id
  });

  // Send invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async (members: any[]) => {
      if (!organization?.id || !member?.id) {
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
      toast({
        title: "Success",
        description: "New members invited successfully!"
      });
      setShowInviteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['organization-metrics'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: 'Failed to send invitations: ' + error.message,
        variant: "destructive"
      });
    }
  });

  // Create roles mutation
  const createRolesMutation = useMutation({
    mutationFn: async (roles: any[]) => {
      if (!organization?.id || !user?.id) {
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
      toast({
        title: "Success",
        description: "New custom roles created successfully!"
      });
      setShowRolesDialog(false);
      queryClient.invalidateQueries({ queryKey: ['organization-metrics'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: 'Failed to create roles: ' + error.message,
        variant: "destructive"
      });
    }
  });

  // Create trial mutation
  const createTrialMutation = useMutation({
    mutationFn: async (trialData: any) => {
      console.log('Creating trial with data:', trialData);
      console.log('Organization:', organization);
      console.log('Member:', member);
      console.log('User:', user);
      
      // Validate required data
      if (!organization?.id) {
        console.error('Missing organization ID:', organization);
        throw new Error('Organization information is not available');
      }
      
      if (!member?.id) {
        console.error('Missing member ID:', member);
        throw new Error('Member information is not available');
      }

      if (!user?.id) {
        console.error('Missing user ID:', user);
        throw new Error('User information is not available');
      }

      const piContact = trialData.autoAssignAsPI && member.email 
        ? member.email 
        : trialData.pi_contact;

      console.log('Inserting trial with:', {
        name: trialData.name,
        description: trialData.description,
        phase: trialData.phase,
        sponsor: trialData.sponsor,
        location: trialData.location,
        pi_contact: piContact,
        study_start: trialData.study_start,
        estimated_close_out: trialData.estimated_close_out,
        organization_id: organization.id,
        created_by: user.id,
        status: 'planning'
      });

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
          created_by: user.id,
          status: 'planning'
        })
        .select()
        .single();

      if (trialError) {
        console.error('Trial creation error:', trialError);
        throw trialError;
      }

      console.log('Trial created successfully:', trial);

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

      return trial;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New trial created successfully!"
      });
      setShowTrialDialog(false);
      queryClient.invalidateQueries({ queryKey: ['organization-metrics'] });
    },
    onError: (error) => {
      console.error('Create trial mutation error:', error);
      toast({
        title: "Error",
        description: 'Failed to create trial: ' + error.message,
        variant: "destructive"
      });
    }
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      console.log('Completing onboarding for user:', user?.id);
      const { error } = await supabase
        .from('members')
        .update({ onboarding_completed: true })
        .eq('profile_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('Onboarding completed successfully');
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Failed to complete onboarding:', error);
      toast({
        title: "Error",
        description: 'Failed to complete onboarding: ' + error.message,
        variant: "destructive"
      });
    }
  });

  const handleGoToDashboard = () => {
    console.log('Go to dashboard clicked');
    completeOnboardingMutation.mutate();
  };

  const handleInviteMembers = (members: any[]) => {
    if (members.length > 0) {
      sendInvitationsMutation.mutate(members);
    } else {
      setShowInviteDialog(false);
    }
  };

  const handleCreateRoles = (roles: any[]) => {
    if (roles.length > 0) {
      createRolesMutation.mutate(roles);
    } else {
      setShowRolesDialog(false);
    }
  };

  const handleCreateTrial = (trialData: any) => {
    console.log('handleCreateTrial called with:', trialData);
    console.log('Available data:', { organization, member, user });
    
    // Check if we have all required data before proceeding
    if (!organization?.id) {
      toast({
        title: "Error",
        description: "Organization information is missing. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    if (!member?.id) {
      toast({
        title: "Error", 
        description: "Member information is missing. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    createTrialMutation.mutate(trialData);
  };

  // Show loading if metrics are still loading or if we don't have organization data
  if (isLoading || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const trialsCount = metrics?.trials?.length || 0;
  const membersCount = metrics?.members?.length || 0;
  const rolesCount = metrics?.roles?.length || 0;

  const displayedTrials = showAllTrials ? metrics?.trials : metrics?.trials?.slice(0, INITIAL_DISPLAY_LIMIT);
  const displayedMembers = showAllMembers ? metrics?.members : metrics?.members?.slice(0, INITIAL_DISPLAY_LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {organization?.name || 'your organization'}!
          </h1>
          <p className="text-gray-600">
            Your organization is already set up. Here's an overview of what's available.
          </p>
        </div>

        {/* Clinical Trials Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Clinical Trials
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium px-2 py-1 rounded-full">
                  {trialsCount}
                </Badge>
              </div>
              <Button
                onClick={() => setShowTrialDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Trial
              </Button>
            </div>
            
            {trialsCount > 0 ? (
              <div className="space-y-3">
                {displayedTrials?.map((trial) => (
                  <div key={trial.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{trial.name}</h3>
                        <p className="text-sm text-gray-600">
                          {trial.phase} • {trial.sponsor}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          trial.status === 'active' ? 'default' :
                          trial.status === 'planning' ? 'secondary' :
                          'outline'
                        }>
                          {trial.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(trial.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {trialsCount > INITIAL_DISPLAY_LIMIT && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllTrials(!showAllTrials)}
                    className="w-full mt-4"
                  >
                    {showAllTrials ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show {trialsCount - INITIAL_DISPLAY_LIMIT} More Trials
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No trials created yet. Create your first trial to get started!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Team Members Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Members
                </h2>
                <Badge variant="secondary" className="bg-green-100 text-green-800 font-medium px-2 py-1 rounded-full">
                  {membersCount}
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(true)}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Team Members
              </Button>
            </div>
            
            {membersCount > 0 ? (
              <div className="space-y-3">
                {displayedMembers?.map((teamMember) => (
                  <div key={teamMember.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{teamMember.name}</p>
                      <p className="text-sm text-gray-600">{teamMember.email}</p>
                    </div>
                    <Badge variant={teamMember.default_role === 'admin' ? 'default' : 'secondary'}>
                      {teamMember.default_role}
                    </Badge>
                  </div>
                ))}
                
                {membersCount > INITIAL_DISPLAY_LIMIT && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllMembers(!showAllMembers)}
                    className="w-full mt-4"
                  >
                    {showAllMembers ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show {membersCount - INITIAL_DISPLAY_LIMIT} More Members
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No team members yet. Invite members to start collaborating!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Available Roles Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Trial Roles
                </h2>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-medium px-2 py-1 rounded-full">
                  {rolesCount}
                </Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowRolesDialog(true)}
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Add Custom Roles
              </Button>
            </div>
            
            {rolesCount > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics?.roles?.map((role) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    <Badge 
                      variant={
                        role.permission_level === 'admin' ? 'destructive' :
                        role.permission_level === 'edit' ? 'default' :
                        'secondary'
                      }
                      className="mt-2"
                    >
                      {role.permission_level}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No custom roles created yet. Define roles to organize your team!</p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Button 
            onClick={handleGoToDashboard}
            disabled={completeOnboardingMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            <Eye className="h-4 w-4 mr-2" />
            {completeOnboardingMutation.isPending ? 'Loading...' : 'Go to Dashboard'}
          </Button>
        </div>

        {/* Dialog Modals */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite Team Members</DialogTitle>
            </DialogHeader>
            <InviteMembers onContinue={handleInviteMembers} />
          </DialogContent>
        </Dialog>

        <Dialog open={showRolesDialog} onOpenChange={setShowRolesDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Custom Roles</DialogTitle>
            </DialogHeader>
            <CreateCustomRoles onContinue={handleCreateRoles} />
          </DialogContent>
        </Dialog>

        <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trial</DialogTitle>
            </DialogHeader>
            <CreateTrial 
              onComplete={handleCreateTrial} 
              isFirstTrial={trialsCount === 0}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
