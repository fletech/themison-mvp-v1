
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, CheckCircle } from 'lucide-react';

interface StaffOnboardingProps {
  member: any;
  organization: any;
}

export function StaffOnboarding({ member, organization }: StaffOnboardingProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('members')
        .update({ onboarding_completed: true })
        .eq('profile_id', user?.id);
    },
    onSuccess: () => {
      toast.success('Welcome to the team!');
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error('Failed to complete onboarding: ' + error.message);
    }
  });

  const handleGoToDashboard = () => {
    completeOnboardingMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Welcome to {organization.name}!
            </h1>
            <p className="text-gray-600">
              You've been invited to join the team as a Staff member.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  You'll be able to participate in clinical trials when an administrator assigns you to specific studies.
                </p>
                <p className="text-sm text-blue-700">
                  Once assigned, you'll receive notifications and be able to access trial data according to your assigned role permissions.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-gray-600">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Account created successfully</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-600">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Added to {organization.name}</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-gray-600">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Waiting for trial assignment</span>
            </div>
          </div>

          <Button 
            onClick={handleGoToDashboard}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
            disabled={completeOnboardingMutation.isPending}
          >
            {completeOnboardingMutation.isPending ? 'Setting up...' : 'Go to Dashboard'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
