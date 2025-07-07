import React, { useState } from "react";
import { FileText, Users, BarChart3, ChevronRight } from "lucide-react";
import { TrialBreadcrumbs } from "./TrialBreadcrumbs.tsx";
import { TrialDocumentHub } from "./TrialDocumentHub.tsx";
import { TrialOverview } from "./TrialOverview.tsx";
import { TrialTeam } from "./TrialTeam.tsx";

type TabType = "overview" | "document-hub" | "team";

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
    description: "Trial details and statistics",
  },
  {
    id: "document-hub",
    name: "Document Hub",
    icon: FileText,
    description: "Trial documents and protocols",
  },
  {
    id: "team",
    name: "Team",
    icon: Users,
    description: "Trial team members and assignments",
  },
];

interface TrialManagerProps {
  trial: any;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

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

function TabContent({ activeTab, trial }: { activeTab: TabType; trial: any }) {
  switch (activeTab) {
    case "overview":
      return <TrialOverview trial={trial} />;
    case "document-hub":
      return <TrialDocumentHub trial={trial} />;
    case "team":
      return <TrialTeam trial={trial} />;
    default:
      return <TrialOverview trial={trial} />;
  }
}

export function TrialManager({
  trial,
  activeTab = "overview",
  onTabChange,
}: TrialManagerProps) {
  const [internalTab, setInternalTab] = useState<TabType>(activeTab);

  const handleTabChange = (tab: TabType) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const currentTab = onTabChange ? activeTab : internalTab;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <TrialBreadcrumbs trial={trial} currentTab={currentTab} />

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <TabNavigation activeTab={currentTab} onTabChange={handleTabChange} />

        {/* Tab Content */}
        <div className="p-6">
          <TabContent activeTab={currentTab} trial={trial} />
        </div>
      </div>
    </div>
  );
}
