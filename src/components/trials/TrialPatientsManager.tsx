import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  DollarSign,
  CheckCircle,
  Clock,
  Filter,
  X,
  TrendingUp,
  MessageSquare,
  Eye,
  Plus,
  AlertTriangle,
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScheduleVisitModal } from "./patients/ScheduleVisitModal";

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
  patient_data?: any; // JSONB field for enhanced patient data
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

  // Filter functions

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
    <div className="space-y-6">

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients by code, name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
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
        
        {canManageMembers && (
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Patient to Trial</DialogTitle>
                <DialogDescription>
                  Select a patient from your organization to assign to this trial.
                </DialogDescription>
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
              </div>
              <DialogFooter>
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
                >
                  {submitting ? "Assigning..." : "Assign Patient"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Enhanced Patients List with Tabs */}
      <div className="space-y-4">
        {filteredAssignedPatients.map((trialPatient) => {
          const patientData = trialPatient.patient_data || {};
          const visits = patientData.visits || null;
          const costs = trialPatient.cost_data || null;
          const medical = patientData.medical || null;
          const compliance = patientData.compliance || null;
          
          return (
            <Card key={trialPatient.id} className="hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Patient Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {trialPatient.patient.first_name.charAt(0)}{trialPatient.patient.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold">
                            {trialPatient.patient.first_name} {trialPatient.patient.last_name}
                          </h4>
                          {getStatusBadge(trialPatient.status)}
                          <Badge variant="outline" className="text-xs">
                            {trialPatient.patient.patient_code}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Age: {calculateAge(trialPatient.patient.date_of_birth)} • Enrolled: {new Date(trialPatient.enrollment_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {trialPatient.patient.email} • {trialPatient.patient.phone_number}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Tabbed Patient Information */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                      <TabsTrigger value="visits" className="text-xs">Visits</TabsTrigger>
                      <TabsTrigger value="costs" className="text-xs">Costs</TabsTrigger>
                      <TabsTrigger value="medical" className="text-xs">Medical</TabsTrigger>
                      <TabsTrigger value="compliance" className="text-xs">Compliance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Visit Progress
                          </h5>
                          {visits ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Completed</span>
                                <span>{visits.completed || 0}/{(visits.completed || 0) + (visits.remaining || 0)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ 
                                    width: `${((visits.completed || 0) / ((visits.completed || 0) + (visits.remaining || 0)) || 0) * 100}%` 
                                  }}
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs text-center pt-2">
                                <div>
                                  <div className="font-medium text-green-600">{visits.completed || 0}</div>
                                  <div className="text-muted-foreground">Done</div>
                                </div>
                                <div>
                                  <div className="font-medium text-blue-600">{visits.scheduled || 0}</div>
                                  <div className="text-muted-foreground">Scheduled</div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-600">{visits.remaining || 0}</div>
                                  <div className="text-muted-foreground">Remaining</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No visit data available
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Cost Summary
                          </h5>
                          {costs && costs.budget_allocated ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Budget:</span>
                                <span className="font-medium">{formatCurrency(costs.budget_allocated)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Spent:</span>
                                <span className="font-medium">{formatCurrency(costs.costs_to_date || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Remaining:</span>
                                <span className="font-medium text-green-600">{formatCurrency(costs.budget_allocated - (costs.costs_to_date || 0))}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2 mt-2">
                                <div 
                                  className="bg-primary h-2 rounded-full"
                                  style={{ 
                                    width: `${((costs.costs_to_date || 0) / costs.budget_allocated) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No cost data available
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Next Visit
                          </h5>
                          {patientData.nextVisit ? (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="font-medium text-blue-900">
                                {patientData.nextVisit.type}
                              </div>
                              <div className="text-sm text-blue-700">
                                {patientData.nextVisit.date} at {patientData.nextVisit.time}
                              </div>
                              <div className="text-xs text-blue-600">
                                {patientData.nextVisit.location}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No upcoming visits scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="visits" className="mt-4">
                      <div className="space-y-4">
                        <h5 className="font-medium">Visit History & Schedule</h5>
                        {patientData.visitHistory && patientData.visitHistory.length > 0 ? (
                          <div className="space-y-2">
                            {patientData.visitHistory.map((visit: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${
                                    visit.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                  }`} />
                                  <div>
                                    <div className="font-medium">{visit.type}</div>
                                    <div className="text-sm text-muted-foreground">{visit.date}</div>
                                  </div>
                                </div>
                                <Badge variant={visit.status === 'completed' ? 'default' : 'secondary'}>
                                  {visit.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No visit history available
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="costs" className="mt-4">
                      <div className="space-y-4">
                        {costs ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-medium mb-3">Cost Breakdown</h5>
                              {costs.breakdown && costs.breakdown.length > 0 ? (
                                <div className="space-y-2">
                                  {costs.breakdown.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between text-sm">
                                      <span>{item.category}</span>
                                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  No cost breakdown available
                                </div>
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium mb-3">Budget Overview</h5>
                              <div className="space-y-3">
                                {costs.budget_allocated && (
                                  <div className="flex justify-between">
                                    <span>Total Allocated</span>
                                    <span className="font-medium">{formatCurrency(costs.budget_allocated)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Total Spent</span>
                                  <span className="font-medium">{formatCurrency(costs.costs_to_date || 0)}</span>
                                </div>
                                {costs.budget_allocated && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Remaining</span>
                                    <span className="font-medium">{formatCurrency(costs.budget_allocated - (costs.costs_to_date || 0))}</span>
                                  </div>
                                )}
                                {costs.transport_allowance && (
                                  <div className="flex justify-between text-blue-600">
                                    <span>Transport Allowance</span>
                                    <span className="font-medium">{formatCurrency(costs.transport_allowance)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No cost data available
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="medical" className="mt-4">
                      {medical ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h5 className="font-medium">Physical Information</h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Height:</span>
                                <div className="font-medium">{medical.height || 'Not recorded'}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Weight:</span>
                                <div className="font-medium">{medical.weight || 'Not recorded'}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">BMI:</span>
                                <div className="font-medium">{medical.bmi || 'Not calculated'}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Blood Type:</span>
                                <div className="font-medium">{medical.bloodType || 'Unknown'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h5 className="font-medium">Medical History</h5>
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm text-muted-foreground">Conditions:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {medical.conditions && medical.conditions.length > 0 ? (
                                    medical.conditions.map((condition: any, index: number) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {condition}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground">None reported</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Medications:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {medical.medications && medical.medications.length > 0 ? (
                                    medical.medications.map((med: any, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {med}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground">None reported</span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Allergies:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {medical.allergies && medical.allergies.length > 0 ? (
                                    medical.allergies.map((allergy: any, index: number) => (
                                      <Badge key={index} variant="destructive" className="text-xs">
                                        {allergy}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground">None reported</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No medical data available
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="compliance" className="mt-4">
                      {compliance ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h5 className="font-medium">Compliance Scores</h5>
                            <div className="space-y-3">
                              {compliance.overallScore && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Overall Score</span>
                                    <span className="font-medium">{compliance.overallScore}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full"
                                      style={{ width: `${compliance.overallScore}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {compliance.medicationAdherence && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Medication Adherence</span>
                                    <span className="font-medium">{compliance.medicationAdherence}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${compliance.medicationAdherence}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {compliance.visitAttendance && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Visit Attendance</span>
                                    <span className="font-medium">{compliance.visitAttendance}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-purple-600 h-2 rounded-full"
                                      style={{ width: `${compliance.visitAttendance}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {compliance.questionnaires && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm">Questionnaires</span>
                                    <span className="font-medium">{compliance.questionnaires}%</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div 
                                      className="bg-orange-600 h-2 rounded-full"
                                      style={{ width: `${compliance.questionnaires}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h5 className="font-medium">Compliance Issues</h5>
                            {compliance.issues && compliance.issues.length > 0 ? (
                              <div className="space-y-2">
                                {compliance.issues.map((issue: any, index: number) => (
                                  <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                                      <span className="text-sm">{issue}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm">No compliance issues reported</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No compliance data available
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAssignedPatients.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">No patients found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "No patients have been assigned to this trial yet."
              }
            </p>
          </CardContent>
        </Card>
      )}

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
