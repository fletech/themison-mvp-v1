import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OrganizationManager } from "@/components/organization/OrganizationManager";
import { Building2 } from "lucide-react";
import type { BreadcrumbItem } from "@/components/ui/breadcrumb";

const tabs = [
  {
    id: "overview",
    name: "Overview",
  },
  {
    id: "members",
    name: "Members",
  },
  {
    id: "roles",
    name: "Roles & Permissions",
  },
  {
    id: "patients",
    name: "Patients",
  },
  {
    id: "settings",
    name: "Settings",
  },
] as const;

type TabType = (typeof tabs)[number]["id"];

export function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: "Organization",
      href: "/organization",
      icon: Building2,
    },
  ];

  if (currentTab) {
    breadcrumbItems.push({
      label: currentTab.name,
    });
  }

  return (
    <AppLayout title="Organisation" breadcrumbItems={breadcrumbItems}>
      <OrganizationManager activeTab={activeTab} onTabChange={setActiveTab} />
    </AppLayout>
  );
}
