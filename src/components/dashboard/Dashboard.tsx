
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Clock } from 'lucide-react';

export function Dashboard() {
  const stats = [
    { name: 'Active Trials', value: '0', icon: FileText, color: 'text-blue-600' },
    { name: 'Total Patients', value: '0', icon: Users, color: 'text-blue-600' },
    { name: 'Team Members', value: '1', icon: Users, color: 'text-blue-600' },
    { name: 'Pending Invitations', value: '1', icon: Clock, color: 'text-blue-600' },
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

      {/* Getting Started */}
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to THEMISON!</h3>
          <p className="text-gray-600 mb-4">
            Start by setting up your organization and creating your first clinical trial.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Quick Start Guide
          </Button>
        </div>
      </Card>
    </div>
  );
}
