import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, MapPin, Building2, User } from "lucide-react";

interface TrialOverviewProps {
  trial: any;
}

export function TrialOverview({ trial }: TrialOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{trial.name}</h2>
        <p className="text-gray-600">
          {trial.description || "No description available"}
        </p>
      </div>

      {/* Trial Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Phase</p>
              <p className="font-semibold">{trial.phase}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sponsor</p>
              <p className="font-semibold">{trial.sponsor}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-semibold">{trial.location}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant="secondary">{trial.status}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Trial Timeline</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Start</span>
            <span>Close-out</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-1/4"></div>
          </div>
          <div className="flex justify-between text-sm">
            <span>{trial.study_start || "TBD"}</span>
            <span>{trial.estimated_close_out || "TBD"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
