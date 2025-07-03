import React, { createContext, useContext, ReactNode } from "react";
import { useOnboardingData } from "@/hooks/useOnboardingData";

// Extendemos la interface para ser más explícitos
interface AppDataContextType {
  // Usuario y organización
  member: any;
  organization: any;

  // Datos de la organización
  trials: any[];
  organizationMembers: any[];
  roles: any[];

  // Asignaciones del usuario
  userTrialAssignments: any[];

  // Helper functions
  isUserAssignedToTrial: (trialId: string) => boolean;
  getUserRoleInTrial: (trialId: string) => any;

  // Loading states
  isLoading: boolean;
  hasError: boolean;

  // IDs útiles
  organizationId?: string;
  memberId?: string;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const data = useOnboardingData();

  // Creamos aliases más claros para los datos
  const contextValue: AppDataContextType = {
    // Usuario y organización
    member: data.member,
    organization: data.organization,

    // Datos de la organización
    trials: data.metrics?.trials || [],
    organizationMembers: data.metrics?.members || [],
    roles: data.metrics?.roles || [],

    // Asignaciones del usuario
    userTrialAssignments: data.userTrialAssignments,

    // Helper functions (mantenemos las existentes)
    isUserAssignedToTrial: data.isUserAssignedToTrial,
    getUserRoleInTrial: data.getUserRoleInTrial,

    // Loading states
    isLoading: data.isLoading,
    hasError: !!data.hasError,

    // IDs útiles
    organizationId: data.organizationId,
    memberId: data.memberId,
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}

// Export también el contexto por si alguien lo necesita
export { AppDataContext };
