
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function Dashboard() {
  const { user } = useAuth();

  // Fetch user's organization ID
  const { data: member } = useQuery({
    queryKey: ['user-member', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('members')
        .select('organization_id')
        .eq('profile_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch active trials count
  const { data: activeTrialsCount } = useQuery({
    queryKey: ['active-trials-count', member?.organization_id],
    queryFn: async () => {
      if (!member?.organization_id) return 0;
      
      const { data, error } = await supabase
        .from('trials')
        .select('id', { count: 'exact' })
        .eq('organization_id', member.organization_id);
      
      if (error) {
        console.error('Error fetching active trials:', error);
        return 0;
      }
      
      return data?.length || 0;
    },
    enabled: !!member?.organization_id
  });

  // Fetch team members count
  const { data: teamMembersCount } = useQuery({
    queryKey: ['team-members-count', member?.organization_id],
    queryFn: async () => {
      if (!member?.organization_id) return 0;
      
      const { data, error } = await supabase
        .from('members')
        .select('id', { count: 'exact' })
        .eq('organization_id', member.organization_id);
      
      if (error) {
        console.error('Error fetching team members:', error);
        return 0;
      }
      
      return data?.length || 0;
    },
    enabled: !!member?.organization_id
  });

  // Fetch pending invitations count
  const { data: pendingInvitationsCount } = useQuery({
    queryKey: ['pending-invitations-count', member?.organization_id],
    queryFn: async () => {
      if (!member?.organization_id) return 0;
      
      const { data, error } = await supabase
        .from('invitations')
        .select('id', { count: 'exact' })
        .eq('organization_id', member.organization_id)
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching pending invitations:', error);
        return 0;
      }
      
      return data?.length || 0;
    },
    enabled: !!member?.organization_id
  });

  const stats = [
    { name: 'Active Trials', value: activeTrialsCount?.toString() || '0', icon: FileText, color: 'text-blue-600' },
    { name: 'Total Patients', value: '0', icon: Users, color: 'text-blue-600' },
    { name: 'Team Members', value: teamMembersCount?.toString() || '0', icon: Users, color: 'text-blue-600' },
    { name: 'Pending Invitations', value: pendingInvitationsCount?.toString() || '0', icon: Clock, color: 'text-blue-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Trial
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="text-sm text-gray-500">
            <p>No recent activity to show.</p>
            <p className="mt-2">Start by creating your first clinical trial!</p>
          </div>
        </Card>
      </div>

      
    </div>
  );
}
