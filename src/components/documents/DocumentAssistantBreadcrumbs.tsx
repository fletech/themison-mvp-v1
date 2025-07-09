import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MessageSquare } from "lucide-react";

interface DocumentAssistantBreadcrumbsProps {
  trial: any;
  currentTab: string;
  from: string;
}

export function DocumentAssistantBreadcrumbs({
  trial,
  currentTab,
  from,
}: DocumentAssistantBreadcrumbsProps) {
  const tabNames = {
    "document-ai": "Document AI",
    "active-documents": "Active Documents",
    "qa-repository": "QA Repository",
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      <MessageSquare className="h-4 w-4" />
      <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
        Dashboard
      </Link>
      <ChevronRight className="h-4 w-4" />

      {from === "trials" ? (
        <>
          <Link to="/trials" className="hover:text-blue-600 transition-colors">
            Trials
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            to={`/trials/${trial.id}`}
            className="hover:text-blue-600 transition-colors"
          >
            {trial.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
        </>
      ) : null}

      <Link
        to="/document-assistant"
        className="hover:text-blue-600 transition-colors"
      >
        Document Assistant
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">
        {tabNames[currentTab] || currentTab}
      </span>
    </div>
  );
}
