
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SelectedMember {
  memberId: string;
  memberName: string;
  memberEmail: string;
  roleId: string;
  roleName: string;
}

interface TrialMemberSelectorProps {
  organizationId: string;
  onMembersChange: (members: SelectedMember[]) => void;
  currentUserId?: string;
}

export function TrialMemberSelector({ 
  organizationId, 
  onMembersChange, 
  currentUserId
}: TrialMemberSelectorProps) {
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);

  console.log('🔧 TrialMemberSelector - Component initialized with:', {
    organizationId,
    currentUserId,
    selectedMembersCount: selectedMembers.length
  });

  // Fetch all confirmed members
  const { data: members = [] } = useQuery({
    queryKey: ['confirmed-members', organizationId],
    queryFn: async () => {
      console.log('🔍 TrialMemberSelector - Fetching members for organization:', organizationId);
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email, profile_id')
        .eq('organization_id', organizationId);
      
      if (error) {
        console.error('❌ TrialMemberSelector - Error fetching members:', error);
        throw error;
      }
      
      console.log('✅ TrialMemberSelector - Fetched members:', data);
      return data || [];
    },
    enabled: !!organizationId
  });

  // Fetch available roles for this organization
  const { data: roles = [] } = useQuery({
    queryKey: ['organization-roles', organizationId],
    queryFn: async () => {
      console.log('🔍 TrialMemberSelector - Fetching roles for organization:', organizationId);
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, permission_level')
        .eq('organization_id', organizationId)
        .order('name');
      
      if (error) {
        console.error('❌ TrialMemberSelector - Error fetching roles:', error);
        throw error;
      }
      
      console.log('✅ TrialMemberSelector - Fetched roles:', data);
      return data || [];
    },
    enabled: !!organizationId
  });

  // Notify parent component when selectedMembers changes
  useEffect(() => {
    console.log('🔄 TrialMemberSelector - Selected members changed:', selectedMembers);
    onMembersChange(selectedMembers);
  }, [selectedMembers, onMembersChange]);

  const addMember = () => {
    console.log('➕ TrialMemberSelector - Adding new member');
    const availableMembers = members.filter(
      member => !selectedMembers.find(selected => selected.memberId === member.id)
    );
    
    console.log('🔍 TrialMemberSelector - Available members for new assignment:', availableMembers.length);
    
    if (availableMembers.length === 0) return;
    
    const newMember: SelectedMember = {
      memberId: '',
      memberName: '',
      memberEmail: '',
      roleId: '',
      roleName: ''
    };
    
    setSelectedMembers(prev => [...prev, newMember]);
  };

  const removeMember = (index: number) => {
    const member = selectedMembers[index];
    console.log('➖ TrialMemberSelector - Removing member at index:', index, member);
    setSelectedMembers(prev => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof SelectedMember, value: string) => {
    console.log('🔄 TrialMemberSelector - Updating member:', { index, field, value });
    
    setSelectedMembers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If updating member, also update name and email
      if (field === 'memberId') {
        const member = members.find(m => m.id === value);
        if (member) {
          updated[index].memberName = member.name;
          updated[index].memberEmail = member.email;
          console.log('🔄 TrialMemberSelector - Updated member info:', {
            memberName: member.name,
            memberEmail: member.email
          });
        }
      }
      
      // If updating role, also update role name
      if (field === 'roleId') {
        const role = roles.find(r => r.id === value);
        if (role) {
          updated[index].roleName = role.name;
          console.log('🔄 TrialMemberSelector - Updated role info:', {
            roleName: role.name
          });
        }
      }
      
      return updated;
    });
  };

  // Get available members for a specific assignment
  const getAvailableMembersForAssignment = (currentAssignmentIndex: number) => {
    return members.filter(member => {
      // Check if this member is already assigned in OTHER assignments (not the current one being edited)
      const isAlreadyAssigned = selectedMembers.some((assignment, index) => 
        assignment.memberId === member.id && index !== currentAssignmentIndex
      );
      return !isAlreadyAssigned;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Assign Team Members</Label>
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          onClick={addMember}
          disabled={members.length === 0 || selectedMembers.length >= members.length}
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
      ) : selectedMembers.length === 0 ? (
        <Card className="p-4">
          <p className="text-sm text-gray-600 text-center">
            No team members assigned yet. Click "Add Member" to assign roles to your team.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {selectedMembers.map((selectedMember, index) => {
            const availableMembersForThisAssignment = getAvailableMembersForAssignment(index);
            
            return (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`member-${index}`}>Team Member</Label>
                    <Select
                      value={selectedMember.memberId}
                      onValueChange={(value) => updateMember(index, 'memberId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show currently selected member even if not in available list */}
                        {selectedMember.memberId && !availableMembersForThisAssignment.find(m => m.id === selectedMember.memberId) && (
                          <SelectItem value={selectedMember.memberId}>
                            {selectedMember.memberName} ({selectedMember.memberEmail})
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
                        value={selectedMember.roleId}
                        onValueChange={(value) => updateMember(index, 'roleId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeMember(index)}
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
