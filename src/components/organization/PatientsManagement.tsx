import React, { useState } from "react";
import {
  Users,
  Eye,
  Plus,
  ImportIcon,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Placeholder/mock data for now
const mockPatients = [
  {
    id: "1",
    patient_code: "P-001",
    first_name: "John",
    last_name: "Doe",
    date_of_birth: "1980-01-01",
    gender: "male",
    consent_signed: true,
    is_active: true,
  },
  {
    id: "2",
    patient_code: "P-002",
    first_name: "Jane",
    last_name: "Smith",
    date_of_birth: "1992-05-12",
    gender: "female",
    consent_signed: false,
    is_active: true,
  },
];

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function PatientsManagement() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    patient_code: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "male",
    consent_signed: false,
    is_active: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
        <p className="text-gray-600">Manage patients in your organization</p>
      </div>
      {/* Action buttons */}
      <div className="flex justify-end gap-2 mb-2">
        <Button
          className="flex items-center gap-2"
          variant="default"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Create Patient
        </Button>
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2" variant="outline">
              <ImportIcon className="w-4 h-4" />
              Import
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> XLSX
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="w-4 h-4 mr-2 text-blue-600" /> CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className="bg-black/10 " />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Patient</DialogTitle>
            <DialogDescription>
              Fill in the patient details below.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <Label htmlFor="patient_code">Patient Code</Label>
              <Input
                id="patient_code"
                value={form.patient_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, patient_code: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, first_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, last_name: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date_of_birth: e.target.value }))
                  }
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, gender: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Checkbox
                id="consent_signed"
                checked={form.consent_signed}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, consent_signed: !!checked }))
                }
              />
              <Label htmlFor="consent_signed">Consent Signed</Label>
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, is_active: !!checked }))
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </form>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={() => setOpen(false)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Code</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>{patient.patient_code}</TableCell>
                  <TableCell>{patient.first_name}</TableCell>
                  <TableCell>{patient.last_name}</TableCell>
                  <TableCell>{patient.date_of_birth}</TableCell>
                  <TableCell className="capitalize">{patient.gender}</TableCell>
                  <TableCell>
                    {patient.consent_signed ? (
                      <span className="text-green-600 font-semibold">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {patient.is_active ? (
                      <span className="text-green-600 font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="text-gray-400">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" title="View details">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
