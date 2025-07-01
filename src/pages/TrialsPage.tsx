import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOnboardingData } from "@/hooks/useOnboardingData";
import { User, Users, UserCheck } from "lucide-react";

export function TrialsPage() {
  const [activePhase, setActivePhase] = useState("All phases");
  const [activeLocation, setActiveLocation] = useState("All places");

  // Use centralized hook instead of duplicating logic
  const {
    metrics,
    isLoading,
    isUserAssignedToTrial,
    getUserRoleInTrial,
    userTrialAssignments,
  } = useOnboardingData();

  const trials = metrics?.trials || [];
  const trialMembers = userTrialAssignments || [];

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
    return phaseMatch && locationMatch;
  });

  // Get PI and member count for a trial
  const getTrialInfo = (trialId: string) => {
    // Note: This would need to be updated to fetch actual trial member data
    // For now, returning placeholder data for compatibility
    return {
      piName: "PI assigned",
      memberCount: 0,
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
                      <div className="absolute top-3 right-3">
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
