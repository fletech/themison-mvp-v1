
import React, { useState } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { SignupConfirmation } from '@/components/auth/SignupConfirmation';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
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

  if (showConfirmation) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We sent you a confirmation link"
      >
        <SignupConfirmation 
          email={userEmail} 
          onBackToSignup={handleBackToSignup}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={isLogin ? 'Sign In' : 'Create Account'}
      subtitle={isLogin ? 'Access your THEMISON account' : 'Join THEMISON Clinical Trials'}
    >
      {isLogin ? (
        <LoginForm />
      ) : (
        <SignupForm onSignupSuccess={handleSignupSuccess} />
      )}
      
      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 hover:text-blue-500 text-sm"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </AuthLayout>
  );
}
