import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { TrialManager } from "@/components/trials/TrialManager";

export default function TrialDetailPage() {
  const { trialId, tab } = useParams();
  const navigate = useNavigate();
  const { metrics, isUserAssignedToTrial } = useAppData();
  const trials = metrics?.trials || [];

  const currentTab =
    (tab as "overview" | "document-hub" | "team") || "overview";

  // Validate trial exists and user has access
  const selectedTrial = trials.find((t) => t.id === trialId);
  if (!selectedTrial) {
    return (
      <DashboardLayout title="Trial Details">
        <TrialError message="Trial not found" />
      </DashboardLayout>
    );
  }

  if (!isUserAssignedToTrial(trialId!)) {
    return (
      <DashboardLayout title="Trial Details">
        <TrialError message="You don't have access to this trial" />
      </DashboardLayout>
    );
  }

  const handleTabChange = (newTab: string) => {
    navigate(`/trials/${trialId}/${newTab}`);
  };

  return (
    <DashboardLayout title={selectedTrial.name}>
      <TrialManager
        trial={selectedTrial}
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />
    </DashboardLayout>
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
