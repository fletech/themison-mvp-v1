import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppDataProvider } from "./contexts/AppDataContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import SignUp from "./pages/auth/SignUp";
import SignIn from "./pages/auth/SignIn";
import { DashboardPage } from "./pages/DashboardPage";
import { TrialsPage } from "./pages/TrialsPage";
import { OrganizationPage } from "./pages/OrganizationPage";
import OnboardingPage from "./pages/OnboardingPage";
import DocumentAssistantPage from "./pages/DocumentAssistantPage";
import NotFound from "./pages/NotFound";
import { LoadingSpinner } from "./components/organization";

const queryClient = new QueryClient();

function OnboardingRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  const { data: memberData, isLoading } = useQuery({
    queryKey: ["user-member-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("members")
        .select("onboarding_completed")
        .eq("profile_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching member status:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If user exists but no member record or onboarding not completed, redirect to onboarding
  if (user && (!memberData || !memberData.onboarding_completed)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Index />}
      />
      <Route
        path="/auth/sign-up"
        element={user ? <Navigate to="/dashboard" replace /> : <SignUp />}
      />
      <Route
        path="/auth/sign-in"
        element={user ? <Navigate to="/dashboard" replace /> : <SignIn />}
      />
      {/* Redirect /auth to sign-in as default */}
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/auth/sign-in" replace />
          )
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppDataProvider>
              <OnboardingRedirect>
                <DashboardPage />
              </OnboardingRedirect>
            </AppDataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trials"
        element={
          <ProtectedRoute>
            <AppDataProvider>
              <OnboardingRedirect>
                <TrialsPage />
              </OnboardingRedirect>
            </AppDataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <AppDataProvider>
              <OnboardingRedirect>
                <OrganizationPage />
              </OnboardingRedirect>
            </AppDataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/document-assistant"
        element={
          <ProtectedRoute>
            <AppDataProvider>
              <OnboardingRedirect>
                <DocumentAssistantPage />
              </OnboardingRedirect>
            </AppDataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/document-assistant/:trialId"
        element={
          <ProtectedRoute>
            <AppDataProvider>
              <OnboardingRedirect>
                <DocumentAssistantPage />
              </OnboardingRedirect>
            </AppDataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/document-assistant/:trialId/:tab"
        element={
          <ProtectedRoute>
            <AppDataProvider>
              <OnboardingRedirect>
                <DocumentAssistantPage />
              </OnboardingRedirect>
            </AppDataProvider>
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
