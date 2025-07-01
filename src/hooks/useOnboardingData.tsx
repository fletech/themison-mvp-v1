import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOnboardingData() {
  const { user } = useAuth();

  // Get user's member information
  const {
    data: member,
    isLoading: memberLoading,
    error: memberError,
  } = useQuery({
    queryKey: ["member", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("members")
        .select(
          "id, name, email, onboarding_completed, default_role, organization_id"
        )
        .eq("profile_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get organization information
  const {
    data: organization,
    isLoading: organizationLoading,
    error: organizationError,
  } = useQuery({
    queryKey: ["organization", member?.organization_id],
    queryFn: async () => {
      if (!member?.organization_id) return null;

      const { data, error } = await supabase
        .from("organizations")
        .select("onboarding_completed, name, id")
        .eq("id", member.organization_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!member?.organization_id,
  });

  // Get trial assignments for current user
  const {
    data: userTrialAssignments = [],
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery({
    queryKey: ["user-trial-assignments", member?.id],
    queryFn: async () => {
      if (!member?.id) return [];

      const { data, error } = await supabase
        .from("trial_members")
        .select("trial_id, role_id, is_active, roles(name, permission_level)")
        .eq("member_id", member.id)
        .eq("is_active", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!member?.id,
  });

  // Get organization metrics (for AdminOverview)
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["organization-metrics", organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        return {
          trials: [],
          members: [],
          roles: [],
        };
      }

      console.log("Fetching metrics for organization:", organization.id);

      const [trialsResult, membersResult, rolesResult] = await Promise.all([
        supabase
          .from("trials")
          .select(
            "id, name, status, phase, sponsor, location, description, created_at"
          )
          .eq("organization_id", organization.id),
        supabase
          .from("members")
          .select("id, name, email, default_role")
          .eq("organization_id", organization.id),
        supabase
          .from("roles")
          .select("*")
          .eq("organization_id", organization.id),
      ]);

      console.log("Metrics fetched:", {
        trialsResult,
        membersResult,
        rolesResult,
      });

      if (trialsResult.error)
        console.error("Trials error:", trialsResult.error);
      if (membersResult.error)
        console.error("Members error:", membersResult.error);
      if (rolesResult.error) console.error("Roles error:", rolesResult.error);

      return {
        trials: trialsResult.data || [],
        members: membersResult.data || [],
        roles: rolesResult.data || [],
      };
    },
    enabled: !!organization?.id,
  });

  // Get member data with organization (for OnboardingFlow compatibility)
  const {
    data: memberData,
    isLoading: memberDataLoading,
    error: memberDataError,
  } = useQuery({
    queryKey: ["user-organization", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("members")
        .select("id, organization_id, email, organizations(name)")
        .eq("profile_id", user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("User is not part of any organization");

      return data;
    },
    enabled: !!user?.id,
  });

  // Helper function to check if user is assigned to a trial
  const isUserAssignedToTrial = (trialId: string) => {
    return userTrialAssignments.some(
      (assignment) => assignment.trial_id === trialId
    );
  };

  // Helper function to get user's role in a trial
  const getUserRoleInTrial = (trialId: string) => {
    const assignment = userTrialAssignments.find(
      (assignment) => assignment.trial_id === trialId
    );
    return assignment?.roles || null;
  };

  const isLoading = memberLoading || organizationLoading;
  const hasError = memberError || organizationError;

  return {
    // Main data
    member,
    organization,
    metrics,
    userTrialAssignments,

    // Compatibility data for existing components
    memberData,

    // Helper functions
    isUserAssignedToTrial,
    getUserRoleInTrial,

    // Loading states
    isLoading,
    memberLoading,
    organizationLoading,
    metricsLoading,
    assignmentsLoading,
    memberDataLoading,

    // Error states
    hasError,
    memberError,
    organizationError,
    metricsError,
    assignmentsError,
    memberDataError,

    // Computed values
    organizationId: member?.organization_id || organization?.id,
    memberId: member?.id,
    currentMemberId: memberData?.id,
  };
}
