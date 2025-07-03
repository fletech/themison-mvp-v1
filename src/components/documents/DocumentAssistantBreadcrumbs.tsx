import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
    "document-hub": "Document Hub",
    "qa-repository": "QA Repository",
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {from === "trials" ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="/trials">Trials</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/trials/${trial.id}`}>
                {trial.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : null}

        <BreadcrumbItem>
          <BreadcrumbLink href="/document-assistant">
            Document Assistant
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbPage>{tabNames[currentTab] || currentTab}</BreadcrumbPage>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
