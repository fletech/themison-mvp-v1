
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Shield, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface CustomRole {
  id: string;
  name: string;
  description: string;
  permission_level: 'read' | 'edit' | 'admin';
}

interface CreateCustomRolesProps {
  onContinue: (roles: CustomRole[]) => void;
}

const defaultRoles: CustomRole[] = [
  {
    id: 'pi',
    name: 'Principal Investigator (PI)',
    description: 'Leads the clinical trial and has full responsibility for the study',
    permission_level: 'admin'
  },
  {
    id: 'crc',
    name: 'Clinical Research Coordinator (CRC)',
    description: 'Manages day-to-day trial operations and patient interactions',
    permission_level: 'edit'
  },
  {
    id: 'monitor',
    name: 'Clinical Monitor',
    description: 'Reviews and monitors trial data for quality and compliance',
    permission_level: 'read'
  }
];

export function CreateCustomRoles({ onContinue }: CreateCustomRolesProps) {
  const [roles, setRoles] = useState<CustomRole[]>(defaultRoles);

  const addRole = () => {
    setRoles([...roles, {
      id: Date.now().toString(),
      name: '',
      description: '',
      permission_level: 'read'
    }]);
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
  };

  const updateRole = (id: string, field: keyof CustomRole, value: string) => {
    setRoles(roles.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleContinue = () => {
    const validRoles = roles.filter(r => r.name.trim());
    onContinue(validRoles);
  };

  const getPermissionDescription = (level: string) => {
    switch (level) {
      case 'admin':
        return 'Full control: can edit trial settings, manage team, and view all data';
      case 'edit':
        return 'Can edit trial data, manage patients, but cannot change trial settings';
      case 'read':
        return 'View-only access to trial data and reports';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900">Trial-Specific Roles</h3>
            <p className="text-sm text-green-700 mt-1">
              Create custom roles that can be assigned to team members within specific trials. These roles determine what permissions each member has within individual studies.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {roles.map((role, index) => (
          <Card key={role.id} className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`name-${role.id}`}>Role Name</Label>
                  <Input
                    id={`name-${role.id}`}
                    placeholder="e.g., Study Coordinator"
                    value={role.name}
                    onChange={(e) => updateRole(role.id, 'name', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`permission-${role.id}`}>Permission Level</Label>
                  <Select 
                    value={role.permission_level} 
                    onValueChange={(value: 'read' | 'edit' | 'admin') => updateRole(role.id, 'permission_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                      <SelectItem value="read">Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getPermissionDescription(role.permission_level)}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor={`description-${role.id}`}>Description</Label>
                <Textarea
                  id={`description-${role.id}`}
                  placeholder="Describe the responsibilities and duties of this role..."
                  value={role.description}
                  onChange={(e) => updateRole(role.id, 'description', e.target.value)}
                  rows={2}
                />
              </div>

              {roles.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRole(role.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Role
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={addRole}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Role
      </Button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p>These roles will be available when creating trials and assigning team members to specific studies. You can always add more roles later from the organization settings.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continue to First Trial
        </Button>
      </div>
    </div>
  );
}
