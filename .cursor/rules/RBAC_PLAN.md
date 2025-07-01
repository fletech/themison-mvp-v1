# **Role-Based Access Control (RBAC) - Plan de Escalabilidad**

> **Estado Actual:** Sistema básico con roles `admin` y `staff`  
> **Objetivo:** Arquitectura escalable para clínica de ensayos clínicos  
> **Implementación:** Futuro post-MVP

---

## **1. Análisis de la Situación Actual**

### **✅ Fortalezas Existentes**

- Sistema dual: roles organizacionales + roles específicos por trial
- Arquitectura de base de datos sólida (`members`, `roles`, `trial_members`)
- Hook `useOnboardingData()` centralizado
- Componente `PermissionGate` conceptualmente correcto

### **❌ Limitaciones Actuales**

- Solo 2 roles organizacionales (`admin`, `staff`)
- Lógica de permisos hardcodeada en componentes
- No hay configuración centralizada de permisos
- Escalabilidad limitada para nuevos roles

---

## **2. Arquitectura Objetivo**

### **2.1 Estructura de Roles**

```typescript
// Roles Organizacionales
type OrganizationalRole =
  | "owner" // Dueño de la clínica
  | "admin" // Director ejecutivo
  | "study_director" // Supervisa múltiples studies
  | "investigator" // Principal Investigator
  | "coordinator" // Coordinador senior
  | "staff" // Personal general
  | "regulatory" // Asuntos regulatorios
  | "monitor" // Monitor externo
  | "guest"; // Acceso temporal

// Roles de Trial (ya existentes)
type TrialRole = "admin" | "edit" | "read";
```

### **2.2 Matriz de Permisos**

```typescript
// src/config/permissions.ts
export const PERMISSIONS = {
  // ORGANIZACIONALES
  "organization.manageFinances": ["owner", "admin"],
  "organization.manageMembers": ["owner", "admin", "study_director"],
  "organization.createTrials": [
    "owner",
    "admin",
    "study_director",
    "investigator",
  ],
  "organization.viewAllTrials": [
    "owner",
    "admin",
    "study_director",
    "regulatory",
  ],
  "organization.viewStats": ["owner", "admin", "study_director"],
  "organization.inviteMembers": ["owner", "admin", "study_director"],

  // TRIAL-ESPECÍFICOS
  "trial.viewData": ["admin", "edit", "read"],
  "trial.editData": ["admin", "edit"],
  "trial.manageSettings": ["admin"],
  "trial.assignMembers": ["admin"],
  "trial.exportData": ["admin", "edit"],

  // HÍBRIDOS (requieren ambos niveles)
  "trial.deleteData": {
    organizational: ["owner", "admin"],
    trial: ["admin"],
  },

  // BYPASS (rol organizacional da acceso automático)
  "trial.auditAccess": {
    organizational: ["owner", "admin", "study_director"],
    bypass_assignment: true,
  },
} as const;
```

---

## **3. Plan de Implementación**

### **Fase 1: Fundaciones (1-2 sprints)**

#### **3.1 Configuración Centralizada**

```typescript
// src/config/roles.ts
export const ORGANIZATIONAL_ROLES = {
  owner: {
    label: "Owner",
    description: "Clinic owner with full access",
    level: 1000,
    color: "red",
  },
  admin: {
    label: "Administrator",
    description: "Full organizational access",
    level: 900,
    color: "blue",
  },
  study_director: {
    label: "Study Director",
    description: "Oversees multiple clinical trials",
    level: 800,
    color: "purple",
  },
  investigator: {
    label: "Principal Investigator",
    description: "Leads clinical trials",
    level: 700,
    color: "green",
  },
  coordinator: {
    label: "Study Coordinator",
    description: "Senior coordination role",
    level: 600,
    color: "orange",
  },
  staff: {
    label: "Staff Member",
    description: "General staff access",
    level: 500,
    color: "gray",
  },
  regulatory: {
    label: "Regulatory Affairs",
    description: "Regulatory compliance access",
    level: 400,
    color: "yellow",
  },
  monitor: {
    label: "External Monitor",
    description: "CRO/Sponsor monitor",
    level: 300,
    color: "teal",
  },
  guest: {
    label: "Guest",
    description: "Temporary limited access",
    level: 100,
    color: "slate",
  },
} as const;

export const TRIAL_ROLES = {
  admin: {
    label: "Trial Administrator",
    description: "Full control of trial",
    level: 100,
  },
  edit: {
    label: "Editor",
    description: "Can modify trial data",
    level: 50,
  },
  read: {
    label: "Read Only",
    description: "View-only access",
    level: 10,
  },
} as const;
```

#### **3.2 Hook de Permisos Robusto**

```typescript
// src/hooks/usePermissions.tsx
export function usePermissions() {
  const { user } = useAuth();
  const { member, userTrialAssignments } = useOnboardingData();

  const hasPermission = useCallback(
    (
      action: keyof typeof PERMISSIONS,
      context?: { trialId?: string }
    ): boolean => {
      const permission = PERMISSIONS[action];

      // Simple permission (array of roles)
      if (Array.isArray(permission)) {
        return permission.includes(member?.default_role);
      }

      // Complex permission (object with conditions)
      if (typeof permission === "object") {
        // Check organizational requirement
        if (permission.organizational) {
          const hasOrgPermission = permission.organizational.includes(
            member?.default_role
          );
          if (!hasOrgPermission) return false;
        }

        // Check trial-specific requirement
        if (permission.trial && context?.trialId) {
          if (permission.bypass_assignment) {
            return true; // Org role bypasses trial assignment
          }

          const trialRole = getUserRoleInTrial(context.trialId);
          if (
            !trialRole ||
            !permission.trial.includes(trialRole.permission_level)
          ) {
            return false;
          }
        }

        return true;
      }

      return false;
    },
    [member, userTrialAssignments]
  );

  const getUserRoleInTrial = useCallback(
    (trialId: string) => {
      return userTrialAssignments?.find(
        (assignment) => assignment.trial_id === trialId
      )?.roles;
    },
    [userTrialAssignments]
  );

  return {
    hasPermission,
    getUserRoleInTrial,
    userRole: member?.default_role,
    canBypassTrialAssignment: (action: string) => {
      const permission = PERMISSIONS[action as keyof typeof PERMISSIONS];
      return typeof permission === "object" && permission.bypass_assignment;
    },
  };
}
```

#### **3.3 Componente PermissionGate Mejorado**

```typescript
// src/components/PermissionGate.tsx
interface PermissionGateProps {
  action: keyof typeof PERMISSIONS;
  trialId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showFallback?: boolean;
}

export function PermissionGate({
  action,
  trialId,
  fallback,
  children,
  showFallback = false,
}: PermissionGateProps) {
  const { hasPermission } = usePermissions();

  const allowed = hasPermission(action, { trialId });

  if (allowed) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
}
```

### **Fase 2: Migración de Datos (1 sprint)**

#### **3.4 Migración de Usuarios Existentes**

```sql
-- Preparar columna para nuevos roles
ALTER TABLE members ALTER COLUMN default_role TYPE VARCHAR(50);

-- Migrar usuarios existentes (decidir caso por caso)
UPDATE members
SET default_role = 'study_director'
WHERE default_role = 'admin'
  AND id IN (
    SELECT DISTINCT member_id
    FROM trial_members
    GROUP BY member_id
    HAVING COUNT(*) > 2
  );

-- Mantener algunos como admin puro
UPDATE members
SET default_role = 'admin'
WHERE default_role = 'admin'
  AND default_role != 'study_director';
```

#### **3.5 Seeders para Roles por Defecto**

```typescript
// src/db/seeders/defaultRoles.ts
export const seedDefaultRoles = async () => {
  // Asegurar que los roles por defecto existan en la tabla roles
  const defaultTrialRoles = [
    {
      name: "Principal Investigator",
      description: "Leads the clinical trial",
      permission_level: "admin",
    },
    {
      name: "Clinical Research Coordinator",
      description: "Manages trial operations",
      permission_level: "edit",
    },
    {
      name: "Monitor",
      description: "Reviews trial data",
      permission_level: "read",
    },
  ];

  // Insert logic...
};
```

### **Fase 3: Actualización de UI (2 sprints)**

#### **3.6 Componentes de Gestión de Roles**

```typescript
// src/components/RoleManagement/RoleSelector.tsx
export function RoleSelector({ value, onChange, roleType = "organizational" }) {
  const roles =
    roleType === "organizational" ? ORGANIZATIONAL_ROLES : TRIAL_ROLES;

  return (
    <Select value={value} onValueChange={onChange}>
      {Object.entries(roles).map(([key, role]) => (
        <SelectItem key={key} value={key}>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={`bg-${role.color}-100`}>
              {role.label}
            </Badge>
            <span className="text-sm text-gray-600">{role.description}</span>
          </div>
        </SelectItem>
      ))}
    </Select>
  );
}
```

#### **3.7 Actualización de Páginas Existentes**

```typescript
// src/pages/TrialsPage.tsx - Actualización
export function TrialsPage() {
  const { hasPermission, userRole } = usePermissions();
  const { trials } = useOnboardingData();

  // Filtrar trials basado en permisos
  const visibleTrials = useMemo(() => {
    if (hasPermission("organization.viewAllTrials")) {
      return trials; // Ve todos
    }

    // Solo trials asignados
    return trials.filter((trial) => isUserAssignedToTrial(trial.id));
  }, [trials, hasPermission]);

  return (
    <DashboardLayout
      title="Trials"
      showCreateButton={hasPermission("organization.createTrials")}
      onCreateClick={handleCreateTrial}
    >
      {/* ... resto del componente */}
    </DashboardLayout>
  );
}
```

### **Fase 4: Características Avanzadas (2-3 sprints)**

#### **3.8 Sistema de Invitaciones por Roles**

```typescript
// src/components/InviteMember.tsx
export function InviteMember() {
  const { hasPermission } = usePermissions();

  const availableRoles = useMemo(() => {
    const roles = Object.entries(ORGANIZATIONAL_ROLES);

    // Filtrar roles que el usuario actual puede asignar
    return roles.filter(([key, role]) => {
      if (hasPermission("organization.manageMembers")) {
        // Admin puede asignar cualquier rol excepto owner
        return key !== "owner";
      }

      if (hasPermission("organization.inviteMembers")) {
        // Study director puede invitar roles menores
        return role.level < 800;
      }

      return false;
    });
  }, [hasPermission]);

  // ... resto del componente
}
```

#### **3.9 Audit Log**

```typescript
// src/hooks/useAuditLog.tsx
export function useAuditLog() {
  const logAction = useCallback(
    async (action: string, resource: string, details: any) => {
      await supabase.from("audit_logs").insert({
        action,
        resource,
        details,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
      });
    },
    [user]
  );

  return { logAction };
}
```

---

## **4. Consideraciones de Implementación**

### **4.1 Migración Gradual**

- **Mantener compatibilidad:** Los componentes existentes siguen funcionando
- **Opt-in:** Nuevas características usan el sistema nuevo
- **Rollback:** Posibilidad de volver al sistema anterior

### **4.2 Testing**

```typescript
// tests/permissions.test.ts
describe("Permission System", () => {
  test("admin can create trials", () => {
    const { hasPermission } = renderHook(() =>
      usePermissions({ userRole: "admin" })
    );

    expect(hasPermission("organization.createTrials")).toBe(true);
  });

  test("staff cannot view organization stats", () => {
    const { hasPermission } = renderHook(() =>
      usePermissions({ userRole: "staff" })
    );

    expect(hasPermission("organization.viewStats")).toBe(false);
  });
});
```

### **4.3 Performance**

- **Memoización:** Cálculos de permisos cacheados
- **Lazy loading:** Cargar roles de trial solo cuando se necesiten
- **Optimistic updates:** UI responde inmediatamente

---

## **5. Timeline Sugerido**

| Fase        | Duración    | Entregables                    |
| ----------- | ----------- | ------------------------------ |
| **Fase 1**  | 1-2 sprints | Config centralizada, hook base |
| **Fase 2**  | 1 sprint    | Migración de datos, seeders    |
| **Fase 3**  | 2 sprints   | UI actualizada, componentes    |
| **Fase 4**  | 2-3 sprints | Características avanzadas      |
| **Testing** | 1 sprint    | Tests completos, documentación |

**Total estimado:** 7-9 sprints (3.5-4.5 meses)

---

## **6. Criterios de Éxito**

### **6.1 Funcionales**

- [ ] Usuarios pueden tener múltiples roles organizacionales
- [ ] Permisos granulares por trial
- [ ] Sistema de invitaciones por roles
- [ ] Audit trail completo

### **6.2 Técnicos**

- [ ] Zero downtime durante migración
- [ ] Performance < 100ms para verificación de permisos
- [ ] 100% cobertura de tests para lógica de permisos
- [ ] Documentación completa de la API

### **6.3 UX**

- [ ] Interfaz intuitiva para gestión de roles
- [ ] Mensajes de error claros cuando no hay permisos
- [ ] Onboarding smooth para nuevos roles

---

## **7. Próximos Pasos**

1. **Validar plan** con stakeholders
2. **Priorizar fases** según feedback de MVP
3. **Asignar recursos** para implementación
4. **Crear tickets** detallados para cada fase
5. **Preparar entorno** de testing

> **Nota:** Este plan se activa post-MVP, una vez validado el producto base con usuarios reales.

---

## **8. Implementación Inmediata Mínima**

### **8.1 Quick Win: PermissionGate Simple**

```typescript
// src/components/PermissionGate.tsx - Versión MVP
interface PermissionGateProps {
  allowedRoles: ("admin" | "staff")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  allowedRoles,
  children,
  fallback,
}: PermissionGateProps) {
  const { member } = useOnboardingData();

  if (allowedRoles.includes(member?.default_role)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Uso inmediato:
<PermissionGate allowedRoles={["admin"]}>
  <Button>Create Trial</Button>
</PermissionGate>;
```

Esta implementación mínima te permite empezar a proteger componentes **HOY MISMO** con el sistema actual, manteniendo la compatibilidad con el plan futuro.
