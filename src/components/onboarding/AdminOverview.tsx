
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Shield, Calendar, Eye } from 'lucide-react';

interface AdminOverviewProps {
  member: any;
  organization: any;
}

export function AdminOverview({ member, organization }: AdminOverviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get organization metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['organization-metrics', organization.id],
    queryFn: async () => {
      const [trialsResult, membersResult, rolesResult] = await Promise.all([
        supabase.from('trials').select('id, name, status').eq('organization_id', organization.id),
        supabase.from('members').select('id, name, email, default_role').eq('organization_id', organization.id),
        supabase.from('roles').select('*').eq('organization_id', organization.id)
      ]);

      return {
        trials: trialsResult.data || [],
        members: membersResult.data || [],
        roles: rolesResult.data || []
      };
    }
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('members')
        .update({ onboarding_completed: true })
        .eq('profile_id', user?.id);
    },
    onSuccess: () => {
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error('Failed to complete onboarding: ' + error.message);
    }
  });

  const handleGoToDashboard = () => {
    completeOnboardingMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Welcome to {organization.name}!
          </h1>
          <p className="text-gray-600">
            Your organization is already set up. Here's an overview of what's available.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics?.trials.length || 0}</p>
                <p className="text-sm text-gray-600">Active Trials</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics?.members.length || 0}</p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics?.roles.length || 0}</p>
                <p className="text-sm text-gray-600">Available Roles</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Available Roles Section */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Available Roles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics?.roles.map((role) => (
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

        {/* Current Team Section */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Current Team
            </h2>
            <div className="space-y-3">
              {metrics?.members.map((teamMember) => (
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

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={handleGoToDashboard}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3"
          >
            <FileText className="h-4 w-4 mr-2" />
            Create New Trial
          </Button>
        </div>
      </div>
    </div>
  );
}
