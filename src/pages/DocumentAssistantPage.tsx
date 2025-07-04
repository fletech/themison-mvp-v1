import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAppData } from "@/contexts/AppDataContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { TrialSelector } from "@/components/documents/TrialSelector";
import { DocumentAssistantBreadcrumbs } from "@/components/documents/DocumentAssistantBreadcrumbs";
import { DocumentAssistantTabs } from "@/components/documents/DocumentAssistantTabs";
import { DocumentHub } from "@/components/documents/DocumentHub";
import { DocumentAI } from "@/components/documents/DocumentAI";
import { QARepository } from "@/components/documents/QARepository";

export default function DocumentAssistantPage() {
  const { trialId, tab } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { trials, isUserAssignedToTrial } = useAppData();

  const from = searchParams.get("from") || "other";
  const currentTab = tab || "document-hub";

  // Si no hay trialId, mostrar selector de trial
  if (!trialId) {
    return (
      <DashboardLayout title="Document Assistant">
        <TrialSelector from={from} />
      </DashboardLayout>
    );
  }

  // Validar que el trial existe y el usuario tiene acceso
  const selectedTrial = trials.find((t) => t.id === trialId);
  if (!selectedTrial) {
    return (
      <DashboardLayout title="Document Assistant">
        <TrialError message="Trial not found" />
      </DashboardLayout>
    );
  }

  if (!isUserAssignedToTrial(trialId)) {
    return (
      <DashboardLayout title="Document Assistant">
        <TrialError message="You don't have access to this trial" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Document Assistant">
      <div className="flex-1 space-y-4">
        <DocumentAssistantBreadcrumbs
          trial={selectedTrial}
          currentTab={currentTab}
          from={from}
        />

        <DocumentAssistantTabs
          currentTab={currentTab}
          onTabChange={(newTab) =>
            navigate(`/document-assistant/${trialId}/${newTab}?from=${from}`)
          }
        />

        <DocumentAssistantContent
          trial={selectedTrial}
          currentTab={currentTab}
        />
      </div>
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

// Content router component
function DocumentAssistantContent({
  trial,
  currentTab,
}: {
  trial: any;
  currentTab: string;
}) {
  switch (currentTab) {
    case "document-ai":
      return <DocumentAI trial={trial} />;
    case "document-hub":
      return <DocumentHub trial={trial} />;
    case "qa-repository":
      return <QARepository trial={trial} />;
    default:
      return <DocumentHub trial={trial} />;
  }
}
