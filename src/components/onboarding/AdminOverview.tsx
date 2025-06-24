
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Users, Shield, Eye, Plus, UserPlus } from 'lucide-react';
import { InviteMembers } from './InviteMembers';
import { CreateCustomRoles } from './CreateCustomRoles';
import { CreateFirstTrial } from './CreateFirstTrial';

interface AdminOverviewProps {
  member: any;
  organization: any;
}

export function AdminOverview({ member, organization }: AdminOverviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRolesDialog, setShowRolesDialog] = useState(false);
  const [showTrialDialog, setShowTrialDialog] = useState(false);

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
      toast.success('Invitations sent successfully!');
      setShowInviteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['organization-metrics'] });
    },
    onError: (error) => {
      toast.error('Failed to send invitations: ' + error.message);
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
      toast.success('Custom roles created successfully!');
      setShowRolesDialog(false);
      queryClient.invalidateQueries({ queryKey: ['organization-metrics'] });
    },
    onError: (error) => {
      toast.error('Failed to create roles: ' + error.message);
    }
  });

  // Create trial mutation
  const createTrialMutation = useMutation({
    mutationFn: async (trialData: any) => {
      if (!organization?.id || !member?.id) {
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

      return trial;
    },
    onSuccess: () => {
      toast.success('Trial created successfully!');
      setShowTrialDialog(false);
      queryClient.invalidateQueries({ queryKey: ['organization-metrics'] });
    },
    onError: (error) => {
      toast.error('Failed to create trial: ' + error.message);
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
      toast.error('Failed to complete onboarding: ' + error.message);
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

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{trialsCount}</p>
                  <p className="text-sm text-gray-600">Active Trials</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrialDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{membersCount}</p>
                  <p className="text-sm text-gray-600">Team Members</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteDialog(true)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{rolesCount}</p>
                  <p className="text-sm text-gray-600">Available Roles</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRolesDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Trials Detail Section */}
        {trialsCount > 0 && (
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Current Trials
              </h2>
              <div className="space-y-3">
                {metrics?.trials?.map((trial) => (
                  <div key={trial.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{trial.name}</h3>
                        <p className="text-sm text-gray-600">
                          {trial.phase} • {trial.sponsor}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          trial.status === 'active' ? 'bg-green-100 text-green-800' :
                          trial.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {trial.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(trial.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Available Roles Section */}
        {rolesCount > 0 && (
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Available Roles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics?.roles?.map((role) => (
                  <div key={role.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                      role.permission_level === 'admin' ? 'bg-red-100 text-red-800' :
                      role.permission_level === 'edit' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {role.permission_level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Current Team Section */}
        {membersCount > 0 && (
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Current Team
              </h2>
              <div className="space-y-3">
                {metrics?.members?.map((teamMember) => (
                  <div key={teamMember.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{teamMember.name}</p>
                      <p className="text-sm text-gray-600">{teamMember.email}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      teamMember.default_role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {teamMember.default_role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

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
              <DialogTitle>Create Custom Roles</DialogTitle>
            </DialogHeader>
            <CreateCustomRoles onContinue={handleCreateRoles} />
          </DialogContent>
        </Dialog>

        <Dialog open={showTrialDialog} onOpenChange={setShowTrialDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trial</DialogTitle>
            </DialogHeader>
            <CreateFirstTrial onComplete={handleCreateTrial} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
