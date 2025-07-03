import React from "react";
import { FileText, Upload, MessageSquare } from "lucide-react";

interface DocumentAssistantTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function DocumentAssistantTabs({
  currentTab,
  onTabChange,
}: DocumentAssistantTabsProps) {
  const tabs = [
    { id: "document-ai", label: "Document AI", icon: FileText },
    { id: "document-hub", label: "Document Hub", icon: Upload },
    { id: "qa-repository", label: "QA Repository", icon: MessageSquare },
  ];

  return (
    <div className="flex space-x-1 border-b">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              currentTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
