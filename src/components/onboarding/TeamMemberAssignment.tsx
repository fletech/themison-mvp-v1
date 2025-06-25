
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TeamAssignment {
  memberId: string;
  memberName: string;
  memberEmail: string;
  roleId: string;
  roleName: string;
}

interface TeamMemberAssignmentProps {
  organizationId: string;
  onAssignmentsChange: (assignments: TeamAssignment[]) => void;
  currentUserId?: string;
  autoAssignAsPI: boolean;
  onAutoAssignPIChange: (checked: boolean) => void;
}

export function TeamMemberAssignment({ 
  organizationId, 
  onAssignmentsChange, 
  currentUserId,
  autoAssignAsPI,
  onAutoAssignPIChange
}: TeamMemberAssignmentProps) {
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);

  // Fetch all confirmed members (removed onboarding_completed filter)
  const { data: members = [] } = useQuery({
    queryKey: ['confirmed-members', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email, profile_id')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId
  });

  // Fetch available roles for this organization
  const { data: roles = [] } = useQuery({
    queryKey: ['organization-roles', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, permission_level')
        .eq('organization_id', organizationId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId
  });

  const addAssignment = () => {
    const availableMembers = members.filter(
      member => !assignments.find(a => a.memberId === member.id)
    );
    
    if (availableMembers.length === 0) return;
    
    const newAssignment: TeamAssignment = {
      memberId: '',
      memberName: '',
      memberEmail: '',
      roleId: '',
      roleName: ''
    };
    
    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    onAssignmentsChange(updatedAssignments);
  };

  const removeAssignment = (index: number) => {
    const updatedAssignments = assignments.filter((_, i) => i !== index);
    setAssignments(updatedAssignments);
    onAssignmentsChange(updatedAssignments);
  };

  const updateAssignment = (index: number, field: keyof TeamAssignment, value: string) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[index] = { ...updatedAssignments[index], [field]: value };
    
    // If updating member, also update name and email
    if (field === 'memberId') {
      const member = members.find(m => m.id === value);
      if (member) {
        updatedAssignments[index].memberName = member.name;
        updatedAssignments[index].memberEmail = member.email;
      }
    }
    
    // If updating role, also update role name
    if (field === 'roleId') {
      const role = roles.find(r => r.id === value);
      if (role) {
        updatedAssignments[index].roleName = role.name;
      }
    }
    
    setAssignments(updatedAssignments);
    onAssignmentsChange(updatedAssignments);
  };

  // Get available members for a specific assignment
  const getAvailableMembersForAssignment = (currentAssignmentIndex: number) => {
    return members.filter(member => {
      // Check if this member is already assigned in OTHER assignments (not the current one being edited)
      const isAlreadyAssigned = assignments.some((assignment, index) => 
        assignment.memberId === member.id && index !== currentAssignmentIndex
      );
      return !isAlreadyAssigned;
    });
  };

  // Find the Principal Investigator role
  const piRole = roles.find(role => 
    role.name.toLowerCase().includes('principal investigator') || 
    role.name.toLowerCase().includes('pi')
  );

  // Check if there's already a PI assigned in the assignments
  const hasPIAssigned = assignments.some(assignment => {
    const role = roles.find(r => r.id === assignment.roleId);
    return role && (role.name.toLowerCase().includes('principal investigator') || 
                   role.name.toLowerCase().includes('pi'));
  });

  // Check if current user is assigned as PI in the assignments
  const currentUserAssignedAsPI = assignments.some(assignment => {
    const member = members.find(m => m.id === assignment.memberId);
    const role = roles.find(r => r.id === assignment.roleId);
    return member?.profile_id === currentUserId && 
           role && (role.name.toLowerCase().includes('principal investigator') || 
                   role.name.toLowerCase().includes('pi'));
  });

  return (
    <div className="space-y-4">
      {/* PI Auto-assignment checkbox */}
      <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Checkbox
          id="autoAssignPI"
          checked={autoAssignAsPI}
          onCheckedChange={onAutoAssignPIChange}
          disabled={hasPIAssigned && !currentUserAssignedAsPI}
        />
        <Label htmlFor="autoAssignPI" className="text-sm font-medium">
          Auto-assign me as Principal Investigator for this trial
          {hasPIAssigned && !currentUserAssignedAsPI && (
            <span className="text-gray-500 text-xs block">
              (Disabled: Another member is already assigned as PI)
            </span>
          )}
        </Label>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Assign Team Members</Label>
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          onClick={addAssignment}
          disabled={members.length === 0 || assignments.length >= members.length}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Card className="p-4">
          <div className="text-center text-gray-500">
            <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No team members available to assign.</p>
            <p className="text-sm mt-1">Members will appear here once they accept their invitations.</p>
          </div>
        </Card>
      ) : assignments.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-gray-600 text-center">
            No team members assigned yet. Click "Add Member" to assign roles to your team.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment, index) => {
            const availableMembersForThisAssignment = getAvailableMembersForAssignment(index);
            
            return (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`member-${index}`}>Team Member</Label>
                    <Select
                      value={assignment.memberId}
                      onValueChange={(value) => updateAssignment(index, 'memberId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show currently selected member even if not in available list */}
                        {assignment.memberId && !availableMembersForThisAssignment.find(m => m.id === assignment.memberId) && (
                          <SelectItem value={assignment.memberId}>
                            {assignment.memberName} ({assignment.memberEmail})
                          </SelectItem>
                        )}
                        {/* Show available members */}
                        {availableMembersForThisAssignment.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <Label htmlFor={`role-${index}`}>Trial Role</Label>
                      <Select
                        value={assignment.roleId}
                        onValueChange={(value) => updateAssignment(index, 'roleId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => {
                            const isPIRole = piRole && role.id === piRole.id;
                            const isCurrentUserAssigning = members.find(m => m.id === assignment.memberId)?.profile_id === currentUserId;
                            
                            // Disable PI role if:
                            // 1. Auto-assign is ON and this is the current user (because they're already auto-assigned)
                            // 2. There's already another PI assigned and this isn't that assignment
                            const isDisabled = isPIRole && (
                              (autoAssignAsPI && isCurrentUserAssigning) ||
                              (hasPIAssigned && assignment.roleId !== role.id)
                            );
                            
                            return (
                              <SelectItem 
                                key={role.id} 
                                value={role.id}
                                disabled={isDisabled}
                                className={isDisabled ? 'text-gray-400 cursor-not-allowed' : ''}
                              >
                                {role.name}
                                {isPIRole && autoAssignAsPI && isCurrentUserAssigning && ' (Auto-assigned to you)'}
                                {isPIRole && hasPIAssigned && assignment.roleId !== role.id && ' (Already assigned to another member)'}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeAssignment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
