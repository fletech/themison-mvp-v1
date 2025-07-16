import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText, Clock } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import { Link } from "react-router-dom";

export function Dashboard() {
  const { canCreateTrials, canInviteMembers, canViewStats } = usePermissions();
  const { stats } = useAppData();

  // Split stats into two rows for the left panel
  const dashboardStatsRows = [
    [
      {
        name: "Active Trials",
        value: stats?.totalTrials?.toString() || "0",
        icon: FileText,
        color: "text-blue-600",
        href: "/trials",
      },
      {
        name: "Total Patients",
        value: "2",
        icon: Users,
        color: "text-blue-600",
        href: null,
      },
    ],
    [
      {
        name: "Team Members",
        value: stats?.totalMembers?.toString() || "0",
        icon: Users,
        color: "text-blue-600",
        href: "/organization",
      },
      {
        name: "Pending Invitations",
        value: stats?.totalInvitations?.toString() || "0",
        icon: Clock,
        color: "text-blue-600",
        href: null,
      },
    ],
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Panel */}
      <div className="flex-1 space-y-6">
        {/* Stats Grid - Only visible to admin */}
        {canViewStats && (
          <div className="space-y-4">
            {dashboardStatsRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {row.map((stat) => (
                  <Link
                    to={stat.href}
                    key={stat.name}
                    className={`${stat.href ? "" : "cursor-not-allowed"}`}
                  >
                    <Card className="p-6">
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
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            {canCreateTrials && (
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 cursor-not-allowed">
                <Plus className="h-4 w-4 mr-2" />
                Create New Trial
              </Button>
            )}
            {canInviteMembers && (
              <Button
                variant="outline"
                className="w-full justify-start cursor-not-allowed"
              >
                <Users className="h-4 w-4 mr-2" />
                Invite Team Member
              </Button>
            )}
            {!canCreateTrials && !canInviteMembers && (
              <div className="text-sm text-gray-500">
                <p>Welcome to your dashboard!</p>
                <p className="mt-2">
                  Access your assigned trials from the Trials section.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right Panel (Agent Curie Chat) */}
      <div className="flex-1 hidden lg:flex flex-col">
        <Card className="flex flex-col h-full min-h-[400px] max-h-[600px]">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-md">
            <h3 className="text-lg font-semibold text-gray-900">Agent Curie</h3>
          </div>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {/* Example messages, replace with dynamic content later */}
            <div className="text-sm text-gray-500 text-center mt-8">
              No messages yet. Say hello to Agent Curie!
            </div>
          </div>
          {/* Input Box */}
          <form className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-md">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
                disabled
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm cursor-not-allowed"
                disabled
              >
                Send
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
