import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { TrialManager } from "@/components/trials/TrialManager";
import { FlaskConical } from "lucide-react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";
import { TrialDropdownBreadcrumb } from "@/components/common/breadcrumbs/TrialDropdownBreadcrumb";

const tabNames = {
  overview: "Overview",
  "document-hub": "Document Hub",
  team: "Team",
};

export default function TrialDetailPage() {
  const { trialId, tab } = useParams();
  const navigate = useNavigate();
  const { metrics, isUserAssignedToTrial } = useAppData();
  const trials = metrics?.trials || [];

  const currentTab =
    (tab as "overview" | "document-hub" | "team") || "overview";

  // Validate trial exists and user has access
  const selectedTrial = trials.find((t) => t.id === trialId);

  // Base breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Trials",
      href: "/trials",
      icon: FlaskConical,
    },
  ];

  // Siempre agregamos el selector de trial
  breadcrumbItems.push({
    customContent: (
      <TrialDropdownBreadcrumb
        currentTrial={
          selectedTrial || {
            id: "",
            name: "Select Trial",
          }
        }
        basePath="/trials"
        className="px-2 py-1 -ml-2"
      />
    ),
  });

  if (!selectedTrial) {
    return (
      <AppLayout title="Trial Details" breadcrumbItems={breadcrumbItems}>
        <TrialError message="Trial not found" />
      </AppLayout>
    );
  }

  if (!isUserAssignedToTrial(trialId!)) {
    return (
      <AppLayout title="Trial Details" breadcrumbItems={breadcrumbItems}>
        <TrialError message="You don't have access to this trial" />
      </AppLayout>
    );
  }

  // Add current tab to breadcrumb
  if (currentTab && tabNames[currentTab]) {
    breadcrumbItems.push({
      label: tabNames[currentTab],
      isActive: true,
    });
  }

  const handleTabChange = (newTab: string) => {
    navigate(`/trials/${trialId}/${newTab}`);
  };

  return (
    <AppLayout title={selectedTrial.name} breadcrumbItems={breadcrumbItems}>
      <TrialManager
        trial={selectedTrial}
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />
    </AppLayout>
  );
}

// Error component
function TrialError({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-red-600">{message}</h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
