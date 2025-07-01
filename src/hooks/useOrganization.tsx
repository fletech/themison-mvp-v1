import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Organization = Tables<"organizations">;
type Member = Tables<"members">;
type Role = Tables<"roles">;

interface OrganizationStats {
  totalMembers: number;
  totalTrials: number;
  totalRoles: number;
  totalInvitations: number;
}

interface OrganizationContextType {
  organization: Organization | null;
  members: Member[];
  roles: Role[];
  stats: OrganizationStats;
  loading: boolean;
  error: string | null;

  // Actions
  updateOrganization: (data: Partial<Organization>) => Promise<boolean>;
  refreshData: () => Promise<void>;
  inviteMember: (email: string, name: string, role: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, roleId: string) => Promise<boolean>;
  createRole: (
    name: string,
    description: string,
    permissionLevel: "read" | "edit" | "admin"
  ) => Promise<boolean>;
  deleteRole: (roleId: string) => Promise<boolean>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    totalMembers: 0,
    totalTrials: 0,
    totalRoles: 0,
    totalInvitations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizationData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get user's organization through members table
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("organization_id")
        .eq("profile_id", user.id)
        .single();

      if (memberError) {
        if (memberError.code === "PGRST116") {
          setError("No organization found for user");
          return;
        }
        throw memberError;
      }

      if (!memberData) {
        setError("No organization found for user");
        return;
      }

      const orgId = memberData.organization_id;

      // Fetch organization details
      const { data: organization, error: orgDetailsError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (orgDetailsError) throw orgDetailsError;

      // Fetch members
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("organization_id", orgId);

      if (membersError) throw membersError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .eq("organization_id", orgId);

      if (rolesError) throw rolesError;

      // Fetch trials count
      const { count: trialsCount, error: trialsError } = await supabase
        .from("trials")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

      if (trialsError) throw trialsError;

      // Fetch invitations count
      const { count: invitationsCount, error: invitationsError } =
        await supabase
          .from("invitations")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", orgId)
          .eq("status", "pending");

      if (invitationsError) throw invitationsError;

      // Update state
      setOrganization(organization);
      setMembers(members || []);
      setRoles(roles || []);
      setStats({
        totalMembers: members?.length || 0,
        totalTrials: trialsCount || 0,
        totalRoles: roles?.length || 0,
        totalInvitations: invitationsCount || 0,
      });
    } catch (err: any) {
      console.error("Error fetching organization data:", err);
      setError(err.message || "Failed to load organization data");
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (
    data: Partial<Organization>
  ): Promise<boolean> => {
    if (!organization) return false;

    try {
      const { error } = await supabase
        .from("organizations")
        .update(data)
        .eq("id", organization.id);

      if (error) throw error;

      setOrganization({ ...organization, ...data });
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });

      return true;
    } catch (err: any) {
      console.error("Error updating organization:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update organization",
        variant: "destructive",
      });
      return false;
    }
  };

  const inviteMember = async (
    email: string,
    name: string,
    role: string
  ): Promise<boolean> => {
    if (!organization) return false;

    try {
      const { error } = await supabase.from("invitations").insert({
        email,
        name,
        organization_id: organization.id,
        initial_role: role as "admin" | "staff",
        invited_by: user?.id,
        status: "pending",
      });

      if (error) throw error;

      await refreshData();
      toast({
        title: "Success",
        description: `Invitation sent to ${email}`,
      });

      return true;
    } catch (err: any) {
      console.error("Error inviting member:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to send invitation",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeMember = async (memberId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      setMembers(members.filter((m) => m.id !== memberId));
      toast({
        title: "Success",
        description: "Member removed successfully",
      });

      return true;
    } catch (err: any) {
      console.error("Error removing member:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to remove member",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateMemberRole = async (
    memberId: string,
    roleId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("members")
        .update({ default_role: roleId as "admin" | "staff" })
        .eq("id", memberId);

      if (error) throw error;

      await refreshData();
      toast({
        title: "Success",
        description: "Member role updated successfully",
      });

      return true;
    } catch (err: any) {
      console.error("Error updating member role:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update member role",
        variant: "destructive",
      });
      return false;
    }
  };

  const createRole = async (
    name: string,
    description: string,
    permissionLevel: "read" | "edit" | "admin"
  ): Promise<boolean> => {
    if (!organization) return false;

    try {
      const { error } = await supabase.from("roles").insert({
        name,
        description,
        organization_id: organization.id,
        permission_level: permissionLevel,
        created_by: user?.id,
      });

      if (error) throw error;

      await refreshData();
      toast({
        title: "Success",
        description: `Role "${name}" created successfully`,
      });

      return true;
    } catch (err: any) {
      console.error("Error creating role:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create role",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteRole = async (roleId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("roles").delete().eq("id", roleId);

      if (error) throw error;

      setRoles(roles.filter((r) => r.id !== roleId));
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });

      return true;
    } catch (err: any) {
      console.error("Error deleting role:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete role",
        variant: "destructive",
      });
      return false;
    }
  };

  const refreshData = async () => {
    await fetchOrganizationData();
  };

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user]);

  const value = {
    organization,
    members,
    roles,
    stats,
    loading,
    error,
    updateOrganization,
    refreshData,
    inviteMember,
    removeMember,
    updateMemberRole,
    createRole,
    deleteRole,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}
