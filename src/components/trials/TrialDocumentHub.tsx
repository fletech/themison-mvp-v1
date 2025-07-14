import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";
import { useTrialDocuments } from "@/hooks/useDocuments";
import { useToast } from "@/hooks/use-toast";

interface TrialDocumentHubProps {
  trial: any;
}

export function TrialDocumentHub({ trial }: TrialDocumentHubProps) {
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();
  const { data: documents = [] } = useTrialDocuments(trial.id);

  // Find latest protocol and amendments
  const latestProtocol = documents.find(
    (doc) => doc.document_type === "protocol" && doc.is_latest
  );

  const amendments = documents.filter(
    (doc) => doc.document_type === "amendment" && doc.is_latest
  );

  const latestAmendment =
    amendments.length > 0
      ? amendments.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      : null;

  const handleUploadComplete = (documents: any[]) => {
    toast({
      title: "Upload successful!",
      description: `${documents.length} document(s) uploaded successfully to ${trial.name}`,
      variant: "default",
    });
    setShowUpload(false);
  };

  const handleUploadError = (error: string) => {
    toast({
      title: "Upload failed",
      description: error,
      variant: "destructive",
    });
  };

  if (showUpload) {
    return (
      <>
        {/* Upload Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Upload Documents</h3>
            <p className="text-sm text-muted-foreground">
              Upload new documents for {trial.name}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowUpload(false)}>
            Back to Documents
          </Button>
        </div>

        {/* Upload Component */}
        <DocumentUpload
          trialId={trial.id}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          maxFiles={10}
          maxSizeBytes={100 * 1024 * 1024} // 100MB
        />
      </>
    );
  }

  return (
    <>
      <DocumentList
        trialId={trial.id}
        trialName={trial.name}
        trialDescription={trial.description}
        latestProtocol={latestProtocol}
        latestAmendment={latestAmendment}
        onAddDocClick={() => setShowUpload(true)}
      />
    </>
  );
}
