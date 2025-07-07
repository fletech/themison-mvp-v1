import React from "react";
import { DocumentHub } from "@/components/documents/DocumentHub";

interface TrialDocumentHubProps {
  trial: any;
}

export function TrialDocumentHub({ trial }: TrialDocumentHubProps) {
  return <DocumentHub trial={trial} />;
}
