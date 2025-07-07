import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Users, UserCheck } from "lucide-react";

export function TrialsPage() {
  const [activePhase, setActivePhase] = useState("All phases");
  const [activeLocation, setActiveLocation] = useState("All places");

  // Use AppData context instead of duplicating logic
  const {
    metrics,
    isLoading,
    metricsLoading,
    isUserAssignedToTrial,
    getUserRoleInTrial,
    userTrialAssignments,
  } = useAppData();
  const trials = metrics?.trials || [];

  // Include metrics loading to prevent "No trials found" flash
  const isFullyLoading = isLoading || metricsLoading;

  // Get permissions for current user
  const { canCreateTrials, canViewAllTrials } = usePermissions();

  // Get trial team members for all trials
  const { data: trialTeams = {} } = useQuery({
    queryKey: ["trial-teams", trials.map((t) => t.id)],
    queryFn: async () => {
      const teams: Record<string, any[]> = {};

      // Fetch team members for each trial
      for (const trial of trials) {
        try {
          const { data, error } = await supabase.rpc("get_trial_team", {
            trial_id_param: trial.id,
          });

          if (error) {
            console.error(`Error fetching team for trial ${trial.id}:`, error);
            teams[trial.id] = [];
          } else {
            teams[trial.id] = data || [];
          }
        } catch (err) {
          console.error(`Exception fetching team for trial ${trial.id}:`, err);
          teams[trial.id] = [];
        }
      }

      return teams;
    },
    enabled: trials.length > 0,
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

  const headerColors = [
    "bg-red-100",
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-purple-100",
    "bg-orange-100",
    "bg-pink-100",
    "bg-teal-100",
    "bg-gray-100",
    "bg-indigo-100",
    "bg-lime-100",
    "bg-amber-100",
    "bg-cyan-100",
    "bg-fuchsia-100",
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

    // Staff users can only see trials they are assigned to
    const accessMatch = canViewAllTrials || isUserAssignedToTrial(trial.id);

    return phaseMatch && locationMatch && accessMatch;
  });

  // Get PI and member count for a trial
  const getTrialInfo = (trialId: string) => {
    const teamMembers = trialTeams[trialId] || [];

    // Find the PI (Principal Investigator)
    const pi = teamMembers.find(
      (member) =>
        member.role_name.toLowerCase().includes("principal investigator") ||
        member.role_name.toLowerCase().includes("pi")
    );

    // Count active members excluding the PI
    const otherMembers = teamMembers.filter(
      (member) =>
        member.is_active &&
        !member.role_name.toLowerCase().includes("principal investigator") &&
        !member.role_name.toLowerCase().includes("pi")
    );

    return {
      piName: pi ? `PI: ${pi.member_name}` : "No PI assigned",
      memberCount: otherMembers.length,
    };
  };

  if (isFullyLoading) {
    return (
      <DashboardLayout
        title="Trials"
        showSearch={true}
        showCreateButton={canCreateTrials}
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
      showCreateButton={canCreateTrials}
      onCreateClick={handleCreateTrial}
    >
      <div className="space-y-6">
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
            filteredTrials.map((trial, index) => {
              const { piName, memberCount } = getTrialInfo(trial.id);
              const isAssigned = isUserAssignedToTrial(trial.id);
              const userRole = getUserRoleInTrial(trial.id);

              return (
                <Card
                  key={trial.id}
                  className={`w-full max-w-sm overflow-hidden hover:shadow-lg transition-shadow ${
                    isAssigned ? "ring-2 ring-blue-200" : ""
                  }`}
                >
                  {/* Card Image/Header */}
                  <div
                    className={`h-36 ${
                      headerColors[index % headerColors.length]
                    } relative`}
                  >
                    {/* Tags in top left */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <Badge className="bg-teal-100 text-teal-800 text-xs rounded-full">
                        {trial.phase}
                      </Badge>
                      {trial.location && (
                        <Badge className="bg-gray-100 text-gray-800 text-xs rounded-full">
                          {trial.location}
                        </Badge>
                      )}
                    </div>

                    {/* Assignment indicator in top right */}
                    {isAssigned && (
                      <div className="absolute bottom-3 left-3">
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800 border-blue-300"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Assigned
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {trial.name}
                    </h3>

                    {/* Show user's role if assigned */}
                    {isAssigned && userRole && (
                      <p className="text-xs text-blue-700 mb-2">
                        Your role: {userRole.name} ({userRole.permission_level})
                      </p>
                    )}

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
                      <div className="flex items-center text-gray-600 font-medium">
                        <User className="w-3 h-3 mr-2" />
                        <span>{piName}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-3 h-3 mr-2" />
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
