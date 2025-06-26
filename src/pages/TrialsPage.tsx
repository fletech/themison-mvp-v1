import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Trial {
  id: string;
  name: string;
  description: string;
  phase: string;
  sponsor: string;
  location: string;
  study_start: string;
  estimated_close_out: string;
  status: string;
}

interface TrialMember {
  id: string;
  trial_id: string;
  member_id: string;
  role_id: string;
  is_active: boolean;
  members: {
    name: string;
  };
  roles: {
    name: string;
    permission_level: string;
  };
}

export function TrialsPage() {
  const { user } = useAuth();
  const [activePhase, setActivePhase] = useState("All phases");
  const [activeLocation, setActiveLocation] = useState("All places");

  // Fetch user's organization ID
  const { data: member } = useQuery({
    queryKey: ["user-member", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("members")
        .select("organization_id")
        .eq("profile_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch trials
  const { data: trials = [], isLoading } = useQuery({
    queryKey: ["trials", member?.organization_id],
    queryFn: async () => {
      if (!member?.organization_id) return [];

      const { data, error } = await supabase
        .from("trials")
        .select("*")
        .eq("organization_id", member.organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Trial[];
    },
    enabled: !!member?.organization_id,
  });

  // Fetch trial members
  const { data: trialMembers = [] } = useQuery({
    queryKey: ["trial-members", member?.organization_id],
    queryFn: async () => {
      if (!member?.organization_id) return [];

      const { data, error } = await supabase
        .from("trial_members")
        .select(
          `
          *,
          members(name),
          roles(name, permission_level)
        `
        )
        .eq("is_active", true);

      if (error) throw error;
      return data as TrialMember[];
    },
    enabled: !!member?.organization_id,
  });

  const handleCreateTrial = () => {
    // TODO: Implement create trial modal or navigation
    console.log("Create trial clicked");
  };

  const phases = [
    "All phases",
    "Phase I",
    "Phase II",
    "Phase III",
    "Phase IV",
    "Observational",
    "Registry",
  ];

  // Dynamic locations from trials data
  const locations = [
    "All places",
    ...Array.from(new Set(trials.map((trial) => trial.location))),
  ];

  const filteredTrials = trials.filter((trial) => {
    const phaseMatch =
      activePhase === "All phases" || trial.phase === activePhase;
    const locationMatch =
      activeLocation === "All places" || trial.location === activeLocation;
    return phaseMatch && locationMatch;
  });

  // Get PI and member count for a trial
  const getTrialInfo = (trialId: string) => {
    const members = trialMembers.filter((tm) => tm.trial_id === trialId);
    const pi = members.find(
      (tm) =>
        tm.roles?.permission_level === "admin" ||
        tm.roles?.name.toLowerCase().includes("pi") ||
        tm.roles?.name.toLowerCase().includes("principal")
    );
    const memberCount = members.length;

    return {
      piName: pi?.members?.name || "No PI assigned",
      memberCount,
    };
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Trials"
        showSearch={true}
        showCreateButton={true}
        onCreateClick={handleCreateTrial}
      >
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-80 animate-pulse">
              <div className="h-48 bg-gray-300 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Trials"
      showSearch={true}
      showCreateButton={true}
      onCreateClick={handleCreateTrial}
    >
      <div className="space-y-6">
        {/* Trial count */}
        <div className="text-sm text-gray-600">
          {trials.length} Active Trials
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Phase filters */}
          <div>
            <span className="text-sm font-medium text-gray-700 mr-4">
              Phases
            </span>
            <div className="flex flex-wrap gap-2">
              {phases.map((phase) => (
                <Button
                  key={phase}
                  variant={activePhase === phase ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActivePhase(phase)}
                  className={`rounded-full ${
                    activePhase === phase
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  }`}
                >
                  {phase}
                </Button>
              ))}
            </div>
          </div>

          {/* Location filters */}
          <div>
            <span className="text-sm font-medium text-gray-700 mr-4">
              Locations
            </span>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <Button
                  key={location}
                  variant={activeLocation === location ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLocation(location)}
                  className={`rounded-full ${
                    activeLocation === location
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  }`}
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Trials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTrials.length === 0 ? (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No trials found
                </h3>
                <p className="text-gray-500 mb-6">
                  Get started by creating your first clinical trial
                </p>
                <Button
                  onClick={handleCreateTrial}
                  className="bg-black hover:bg-gray-800"
                >
                  Create your first trial
                </Button>
              </Card>
            </div>
          ) : (
            filteredTrials.map((trial) => {
              const { piName, memberCount } = getTrialInfo(trial.id);

              return (
                <Card
                  key={trial.id}
                  className="w-full max-w-sm overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Card Image/Header */}
                  <div className="h-48 bg-gray-500 relative">
                    {/* Tags in top left */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <Badge className="bg-teal-100 text-teal-800 text-xs rounded-full">
                        {trial.phase}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-800 text-xs rounded-full">
                        {trial.location}
                      </Badge>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {trial.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {trial.description || "No description available"}
                    </p>

                    {/* Progress Timeline */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Start</span>
                        <span>Close-out</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mb-3">
                        <div className="bg-gray-800 h-1 rounded-full w-1/4"></div>
                      </div>
                    </div>

                    {/* Trial Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <div className="w-3 h-3 rounded-full border border-gray-400 mr-2"></div>
                        <span>{piName}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <div className="w-3 h-3 rounded-full border border-gray-400 mr-2"></div>
                        <span>+{memberCount} members</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
