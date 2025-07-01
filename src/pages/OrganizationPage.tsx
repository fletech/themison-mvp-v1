import React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OrganizationManager } from "@/components/organization/OrganizationManager";

export function OrganizationPage() {
  return (
    <DashboardLayout title="Organisation">
      <OrganizationManager />
    </DashboardLayout>
  );
}
