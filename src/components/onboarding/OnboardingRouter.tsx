import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import { AdminSetupFlow } from "./AdminSetupFlow";
import { AdminOverview } from "./AdminOverview";
import { StaffOnboarding } from "./StaffOnboarding";

export function OnboardingRouter() {
  const navigate = useNavigate();

  // Use centralized data hook
  const { member, organization, isLoading } = useOnboardingData();

  // Check if onboarding is completed and redirect
  useEffect(() => {
    if (!isLoading && member) {
      // For staff members, just check if their onboarding is completed
      if (member.default_role === "staff" && member.onboarding_completed) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // For admin members, check both member and organization onboarding
      if (
        member.default_role === "admin" &&
        member.onboarding_completed &&
        organization?.onboarding_completed
      ) {
        navigate("/dashboard", { replace: true });
        return;
      }
    }
  }, [member, organization, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no member record, something went wrong
  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Setup Required
          </h1>
          <p className="text-gray-600">
            Please contact your administrator to set up your account.
          </p>
        </div>
      </div>
    );
  }

  // Staff onboarding - simple welcome
  if (member.default_role === "staff") {
    return <StaffOnboarding member={member} organization={organization} />;
  }

  // Admin onboarding logic
  if (member.default_role === "admin") {
    // If organization onboarding is not completed, show setup flow
    if (!organization?.onboarding_completed) {
      return <AdminSetupFlow member={member} organization={organization} />;
    }

    // If organization is set up but member hasn't completed onboarding, show overview
    if (!member.onboarding_completed) {
      return <AdminOverview member={member} organization={organization} />;
    }
  }

  // Fallback - show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
