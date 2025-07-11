import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import {
  FlaskConical,
  Search,
  MapPin,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TrialSelectorProps {
  from: string;
}

export function TrialSelector({ from }: TrialSelectorProps) {
  const { metrics, isLoading } = useAppData();
  const trials = metrics?.trials || [];
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrials = trials.filter((trial) =>
    trial.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}

      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Trials List */}
        <div className="border rounded-lg divide-y">
          {filteredTrials.map((trial) => (
            <div
              key={trial.id}
              className={cn(
                "flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer group",
                "transition-colors duration-200"
              )}
              onClick={() =>
                navigate(`/document-assistant/${trial.id}/active-documents`)
              }
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FlaskConical className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {trial.name}
                    </h3>
                    <Badge variant="outline" className="h-5">
                      {trial.phase}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{trial.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>{trial.sponsor}</span>
                    </div>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {filteredTrials.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            No trials found matching your search
          </div>
        )}
      </div>
    </div>
  );
}
