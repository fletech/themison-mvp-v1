import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  Calendar,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScheduleVisitModal } from "./patients/ScheduleVisitModal";
import { VisitSummaryCard } from "./patients/VisitSummaryCard";

interface Patient {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email: string;
  phone_number: string;
  city: string;
  state_province: string;
  country: string;
  is_active: boolean;
  organization_id: string;
}

interface TrialPatient {
  id: string;
  trial_id: string;
  patient_id: string;
  enrollment_date: string;
  status: string;
  randomization_code: string;
  notes: string;
  cost_data?: any;
  patient: Patient;
}

interface TrialPatientsManagerProps {
  trial: any;
}

export function TrialPatientsManager({ trial }: TrialPatientsManagerProps) {
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<TrialPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showScheduleVisitModal, setShowScheduleVisitModal] = useState(false);
  const [selectedTrialPatient, setSelectedTrialPatient] =
    useState<TrialPatient | null>(null);

  const { organizationId, memberId } = useAppData();
  const { canManageMembers } = usePermissions();
  const { toast } = useToast();

  // Load data
  useEffect(() => {
    if (trial?.id && organizationId) {
      loadData();
    }
  }, [trial?.id, organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load available patients from organization (not assigned to this trial)
      const { data: allPatients, error: patientsError } = await supabase
        .from("patients")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("patient_code", { ascending: true });

      if (patientsError) throw patientsError;

      // Load assigned patients for this trial
      const { data: trialPatients, error: trialPatientsError } = await supabase
        .from("trial_patients")
        .select(
          `
          *,
          patient:patients(*)
        `
        )
        .eq("trial_id", trial.id);

      if (trialPatientsError) throw trialPatientsError;

      // Filter available patients (exclude already assigned)
      const assignedPatientIds = new Set(
        trialPatients?.map((tp) => tp.patient_id) || []
      );
      const available =
        allPatients?.filter((p) => !assignedPatientIds.has(p.id)) || [];

      setAvailablePatients(available);
      setAssignedPatients(trialPatients || []);
    } catch (error) {
      console.error("Error loading patient data:", error);
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPatient = async () => {
    if (!selectedPatient || !memberId) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from("trial_patients").insert({
        trial_id: trial.id,
        patient_id: selectedPatient.id,
        status: "enrolled",
        notes: assignmentNotes,
        assigned_by: memberId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Patient ${selectedPatient.patient_code} assigned to trial`,
      });

      // Refresh data
      await loadData();

      // Reset form
      setShowAssignDialog(false);
      setSelectedPatient(null);
      setAssignmentNotes("");
    } catch (error) {
      console.error("Error assigning patient:", error);
      toast({
        title: "Error",
        description: "Failed to assign patient to trial",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (
    trialPatientId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("trial_patients")
        .update({ status: newStatus })
        .eq("id", trialPatientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient status updated",
      });

      await loadData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      });
    }
  };

  // Filter functions
  const filteredAvailablePatients = availablePatients.filter((patient) => {
    const matchesSearch =
      patient.patient_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${patient.first_name} ${patient.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const filteredAssignedPatients = assignedPatients.filter((trialPatient) => {
    if (statusFilter === "all") return true;
    return trialPatient.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      enrolled: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      screening: { color: "bg-blue-100 text-blue-800", icon: Clock },
      completed: { color: "bg-gray-100 text-gray-800", icon: CheckCircle },
      withdrawn: { color: "bg-red-100 text-red-800", icon: X },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.enrolled;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-xs flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Patients</p>
              <p className="text-2xl font-bold">{availablePatients.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Assigned Patients</p>
              <p className="text-2xl font-bold">{assignedPatients.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold">
                {
                  assignedPatients.filter((tp) => tp.status === "enrolled")
                    .length
                }
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Patient Cost</p>
              <p className="text-2xl font-bold">
                {assignedPatients.length > 0
                  ? formatCurrency(
                      assignedPatients.reduce(
                        (sum, tp) =>
                          sum + (tp.cost_data?.budget_allocated || 0),
                        0
                      ) / assignedPatients.length
                    )
                  : "$0"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Patients Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Available Patients ({availablePatients.length})
          </h3>
          {canManageMembers && (
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign Patient to Trial</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Select Patient
                    </label>
                    <Select
                      value={selectedPatient?.id || ""}
                      onValueChange={(value) => {
                        const patient = availablePatients.find(
                          (p) => p.id === value
                        );
                        setSelectedPatient(patient || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a patient..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.patient_code} - {patient.first_name}{" "}
                            {patient.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Assignment Notes
                    </label>
                    <Textarea
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Optional notes about this assignment..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAssignDialog(false);
                        setSelectedPatient(null);
                        setAssignmentNotes("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignPatient}
                      disabled={!selectedPatient || submitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {submitting ? "Assigning..." : "Assign Patient"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients by code, name, or email..."
            className="pl-10"
          />
        </div>

        {/* Available Patients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAvailablePatients.map((patient) => (
            <Card
              key={patient.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {patient.patient_code}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {calculateAge(patient.date_of_birth)}y old
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {patient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  {patient.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{patient.phone_number}</span>
                    </div>
                  )}
                  {(patient.city || patient.state_province) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {[patient.city, patient.state_province]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredAvailablePatients.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Available Patients
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "No patients match your search criteria."
                : "All patients from your organization are already assigned to this trial."}
            </p>
          </Card>
        )}
      </div>

      <Separator />

      {/* Assigned Patients Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Assigned Patients ({assignedPatients.length})
          </h3>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assigned Patients List */}
        <div className="space-y-4">
          {filteredAssignedPatients.map((trialPatient) => (
            <Card key={trialPatient.id} className="p-6">
              <div className="space-y-6">
                {/* Patient Basic Info and Cost in Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Patient Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {trialPatient.patient.first_name}{" "}
                        {trialPatient.patient.last_name}
                      </h4>
                      {getStatusBadge(trialPatient.status)}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Code:</strong>{" "}
                        {trialPatient.patient.patient_code}
                      </p>
                      <p>
                        <strong>Age:</strong>{" "}
                        {calculateAge(trialPatient.patient.date_of_birth)} years
                      </p>
                      <p>
                        <strong>Enrolled:</strong>{" "}
                        {new Date(
                          trialPatient.enrollment_date
                        ).toLocaleDateString()}
                      </p>
                      {trialPatient.randomization_code && (
                        <p>
                          <strong>Randomization:</strong>{" "}
                          {trialPatient.randomization_code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cost Information */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Cost Information
                    </h5>

                    {trialPatient.cost_data &&
                    Object.keys(trialPatient.cost_data).length > 0 ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Budget Allocated:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              trialPatient.cost_data.budget_allocated || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Costs to Date:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              trialPatient.cost_data.costs_to_date || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Reimbursement Rate:
                          </span>
                          <span className="font-medium">
                            {formatCurrency(
                              trialPatient.cost_data.reimbursement_rate || 0
                            )}
                          </span>
                        </div>
                        {trialPatient.cost_data.transport_allowance && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Transport Allowance:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                trialPatient.cost_data.transport_allowance
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No cost data available
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Actions</h5>

                    {canManageMembers && (
                      <div className="space-y-2">
                        <Select
                          value={trialPatient.status}
                          onValueChange={(value) =>
                            handleUpdateStatus(trialPatient.id, value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enrolled">Enrolled</SelectItem>
                            <SelectItem value="screening">Screening</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          className="w-full"
                          size="sm"
                          onClick={() => {
                            setSelectedTrialPatient(trialPatient);
                            setShowScheduleVisitModal(true);
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Visit
                        </Button>
                      </div>
                    )}

                    {trialPatient.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {trialPatient.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visit Summary - Full Width */}
                <VisitSummaryCard
                  trialPatient={trialPatient}
                  trial={trial}
                  onScheduleClick={() => {
                    setSelectedTrialPatient(trialPatient);
                    setShowScheduleVisitModal(true);
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        {filteredAssignedPatients.length === 0 && (
          <Card className="p-8 text-center">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Assigned Patients
            </h3>
            <p className="text-gray-500 mb-4">
              {statusFilter === "all"
                ? "No patients have been assigned to this trial yet."
                : `No patients with status "${statusFilter}" found.`}
            </p>
            {canManageMembers && availablePatients.length > 0 && (
              <Button
                onClick={() => setShowAssignDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Your First Patient
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Schedule Visit Modal */}
      <ScheduleVisitModal
        isOpen={showScheduleVisitModal}
        onClose={() => {
          setShowScheduleVisitModal(false);
          setSelectedTrialPatient(null);
        }}
        trialPatient={selectedTrialPatient}
        trial={trial}
        onVisitScheduled={() => {
          // Refresh data when a visit is scheduled
          loadData();
        }}
      />
    </div>
  );
}
