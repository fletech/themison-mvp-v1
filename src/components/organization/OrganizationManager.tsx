import React, { useState } from "react";
import {
  Building2,
  Users,
  Settings,
  Shield,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { OrganizationOverview } from "./OrganizationOverview";
import { MembersManagement } from "./MembersManagement";
import { OrganizationSettings } from "./OrganizationSettings";
import { ErrorBoundary } from "./ErrorBoundary";

type TabType = "overview" | "members" | "roles" | "settings";

interface TabItem {
  id: TabType;
  name: string;
  icon: React.ElementType;
  description: string;
}

const tabs: TabItem[] = [
  {
    id: "overview",
    name: "Overview",
    icon: BarChart3,
    description: "Organization dashboard and statistics",
  },
  {
    id: "members",
    name: "Team Members",
    icon: Users,
    description: "Manage team members and invitations",
  },
  {
    id: "roles",
    name: "Roles & Permissions",
    icon: Shield,
    description: "Configure custom roles and permissions",
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    description: "Organization settings and preferences",
  },
];

function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <div className="border-b border-gray-200 bg-white rounded-t-2xl">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon
                className={`-ml-0.5 mr-2 h-5 w-5 transition-colors ${
                  isActive
                    ? "text-blue-500"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}
              />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function BreadcrumbNavigation({ activeTab }: { activeTab: TabType }) {
  const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <Building2 className="h-4 w-4" />
      <span>Organization</span>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">{currentTab?.name}</span>
    </div>
  );
}

function RolesPlaceholder() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Roles & Permissions
          </h2>
          <p className="text-gray-600">
            Configure custom roles and access permissions for your team
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="text-center">
            <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Role Management
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This feature will allow you to create custom roles with specific
              permissions for different team members.
            </p>
            <div className="text-sm text-gray-500">
              <p>Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function TabContent({ activeTab }: { activeTab: TabType }) {
  switch (activeTab) {
    case "overview":
      return <OrganizationOverview />;
    case "members":
      return <MembersManagement />;
    case "roles":
      return <RolesPlaceholder />;
    case "settings":
      return <OrganizationSettings />;
    default:
      return <OrganizationOverview />;
  }
}

export function OrganizationManager() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <OrganizationProvider>
      <ErrorBoundary>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <BreadcrumbNavigation activeTab={activeTab} />

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <div className="p-6">
              <TabContent activeTab={activeTab} />
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </OrganizationProvider>
  );
}
