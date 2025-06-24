
import React, { useState } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';
import { SignupConfirmation } from '@/components/auth/SignupConfirmation';

export default function SignUp() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleSignupSuccess = (email: string) => {
    setUserEmail(email);
    setShowConfirmation(true);
  };

  const handleBackToSignup = () => {
    setShowConfirmation(false);
    setUserEmail('');
  };

  return (
    <AuthLayout
      title={showConfirmation ? 'Check Your Email' : 'Create Account'}
      subtitle={showConfirmation ? 'We sent you a confirmation link' : 'Join THEMISON Clinical Trials'}
    >
      {showConfirmation ? (
        <SignupConfirmation 
          email={userEmail} 
          onBackToSignup={handleBackToSignup}
        />
      ) : (
        <SignupForm onSignupSuccess={handleSignupSuccess} />
      )}
    </AuthLayout>
  );
}
