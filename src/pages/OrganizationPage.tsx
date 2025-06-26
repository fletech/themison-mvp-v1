import React from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";

export function OrganizationPage() {
  return (
    <DashboardLayout title="Organisation">
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Organization Settings</h2>
          <p className="text-gray-600">
            Manage your organization settings here.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
