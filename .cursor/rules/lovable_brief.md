# 🧬 THEMISON CLINICAL TRIALS - Brief para Lovable

## 📋 **PROYECTO OVERVIEW**

Plataforma SaaS para gestión de ensayos clínicos. Los hospitales/organizaciones médicas usan nuestra plataforma para crear trials, invitar equipos médicos, y asignar roles específicos a cada trial.

**Stack Tecnológico:**
- React + TypeScript
- Supabase (Auth + Database + RPC Functions)
- Tailwind CSS
- React Router DOM

---

## 🏗️ **ARQUITECTURA DE CARPETAS SOLICITADA**

```
src/
├── components/          # Componentes reutilizables globales
│   ├── ui/             # Shadcn/ui components
│   ├── forms/          # Form components genéricos
│   └── shared/         # Otros componentes compartidos
├── features/           # Features organizadas por funcionalidad
│   ├── auth/
│   │   └── components/
│   ├── onboarding/
│   │   └── components/
│   ├── trials/
│   │   └── components/
│   ├── dashboard/
│   │   └── components/
│   └── organization/
│       └── components/
├── hooks/              # TODOS los hooks aquí (globales y específicos)
├── layouts/            # TODOS los layouts aquí
│   ├── AuthLayout.tsx
│   ├── DashboardLayout.tsx
│   └── OnboardingLayout.tsx
├── lib/                # Configuraciones y utilidades
│   ├── supabase.ts
│   └── utils.ts
└── types/              # Tipos TypeScript globales
```

---

## 🗄️ **ESTRUCTURA DE BASE DE DATOS**

### **Tablas Principales:**
```sql
-- Núcleo organizacional
organizations (id, name, onboarding_completed, created_by, created_at)
profiles (id, email, first_name, last_name, created_at)
members (id, name, email, organization_id, profile_id, default_role, onboarding_completed)
roles (id, name, description, permission_level, organization_id)

-- Gestión de trials
trials (id, name, description, phase, sponsor, location, study_start, estimated_close_out, organization_id, status)
trial_members (id, trial_id, member_id, role_id, is_active, start_date)

-- Sistema de invitaciones
invitations (id, email, organization_id, invited_by, status, created_at)
```

### **Función RPC Principal:**
```javascript
// Función para crear trial con equipo asignado
const { data: trialId, error } = await supabase.rpc('create_trial_with_members', {
  trial_data: {
    name: "Trial Name",
    description: "Description", 
    phase: "Phase I",
    sponsor: "Sponsor Name",
    location: "Location",
    study_start: "2025-07-01",
    estimated_close_out: "2025-12-31"
  },
  team_assignments: [
    {
      member_id: "uuid-member",
      role_id: "uuid-role",
      is_active: true,
      start_date: "2025-06-26"
    }
  ]
});
```

---

## 🎯 **FLUJOS DE USUARIO PRINCIPALES**

### **🥇 PRIMER ADMIN - Onboarding Obligatorio (Steps)**

**Estructura de Navegación:**
- `/onboarding/step-1` → Invitar miembros del equipo
- `/onboarding/step-2` → Confirmar/editar roles de la organización  
- `/onboarding/step-3` → Crear primer trial
- `/dashboard` → Finalización

**Step 1: Invitar Miembros**
```javascript
// Componente: <InviteMembersStep />
// Formulario para invitar múltiples miembros:
{
  email: "dr.smith@hospital.com",
  name: "Dr. Smith", 
  default_role: "admin" | "staff"
}
// Botón "Next Step" obligatorio
```

**Step 2: Confirmar Roles**
```javascript
// Componente: <ConfirmRolesStep />
// Muestra 3 roles sugeridos editables:
[
  { name: "Principal Investigator (PI)", permission_level: "admin" },
  { name: "Clinical Research Coordinator (CRC)", permission_level: "edit" },
  { name: "Clinical Monitor", permission_level: "read" }
]
// Puede editarlos antes de confirmar
// Botón "Create Roles & Next" obligatorio
```

**Step 3: Crear Primer Trial**
```javascript
// Componente: <CreateTrialStep />
// Formulario básico de trial (sin asignación de equipo)
// OPCIONALMENTE puede auto-asignarse un rol (ej: PI)
// Validación: Solo UN PI por trial si se asigna
// IMPORTANTE: Primer admin no tiene colegas registrados aún
// Botón "Create Trial & Finish" obligatorio
```

### **🥈 SEGUNDO ADMIN - Onboarding Informativo (Overview + Opcionales)**

**Estructura:**
- `/onboarding/overview` → Dashboard con métricas + acciones opcionales
- Modals/Dialogs reutilizan componentes del primer admin

**Overview Dashboard:**
```javascript
// Componente: <OnboardingOverview />
// Métricas de la organización:
- Total trials: X
- Total members: X  
- Total roles: X
- Pending invitations: X

// Cards de acciones (abren modals):
- "Invite New Members" → Modal con <InviteMembersStep />
- "Create New Role" → Modal con role creation form
- "Create New Trial" → Modal con <CreateTrialStep />
- "Go to Dashboard" → Skip a dashboard principal
```

### **👤 STAFF - Sin Onboarding**
```javascript
// Mensaje de bienvenida simple
// Redirección directa a `/dashboard`
// Dashboard solo muestra trials donde está asignado
```

---

## 🔗 **QUERIES SUPABASE NECESARIAS**

### **Queries para Onboarding:**
```javascript
// 1. Obtener datos de la organización actual
const getCurrentOrganization = () => 
  supabase.from('organizations').select('*').single();

// 2. Obtener miembros de la organización  
const getOrganizationMembers = (orgId) =>
  supabase.from('members')
    .select(`*, profiles(email, first_name, last_name)`)
    .eq('organization_id', orgId);

// 3. Obtener roles de la organización
const getOrganizationRoles = (orgId) =>
  supabase.from('roles').select('*').eq('organization_id', orgId);

// 4. Obtener trials de la organización
const getOrganizationTrials = (orgId) =>
  supabase.from('trials').select('*').eq('organization_id', orgId);

// 5. Invitar miembros
const inviteMembers = (invitations) =>
  supabase.from('invitations').insert(invitations);

// 6. Crear roles
const createRoles = (roles) =>
  supabase.from('roles').insert(roles);

// 7. Marcar onboarding completado
const completeOnboarding = (memberId, orgId) => {
  // Actualizar member
  supabase.from('members').update({ onboarding_completed: true }).eq('id', memberId);
  // Actualizar organization (si es primer admin)
  supabase.from('organizations').update({ onboarding_completed: true }).eq('id', orgId);
};
```

---

## 🎨 **COMPONENTES CLAVE A DESARROLLAR**

### **Componentes Reutilizables (`/components/forms/`):**
```javascript
// 1. InviteMembersForm.tsx - Formulario para invitar miembros
// Props: { onSubmit, isModal?, showNavigation? }

// 2. CreateTrialForm.tsx - Formulario completo de trial + team assignment  
// Props: { onSubmit, availableMembers, availableRoles, isModal? }

// 3. RoleEditor.tsx - Editor de roles con sugerencias
// Props: { initialRoles?, onSave, canEdit? }
```

### **Hooks (`/hooks/`):**
```javascript
// 1. useOnboardingStatus.ts - Determina tipo de onboarding según user
// 2. useOrganizationData.ts - Fetch data completa de organización
// 3. useCreateTrialWithMembers.ts - Wrapper para RPC function
// 4. useInviteMembers.ts - Hook para invitar miembros
// 5. useCreateRoles.ts - Hook para crear roles
```

### **Layouts (`/layouts/`):**
```javascript
// 1. OnboardingLayout.tsx - Layout para steps de onboarding
// 2. AuthLayout.tsx - Layout para auth (login/register)  
// 3. DashboardLayout.tsx - Layout principal con navegación
```

---

## 🎯 **LÓGICA DE NAVEGACIÓN Y ESTADOS**

### **Determinación de Onboarding:**
```javascript
const determineOnboardingFlow = async (user) => {
  const member = await getMemberByProfileId(user.id);
  const organization = await getOrganization(member.organization_id);
  
  // Staff → Dashboard directo
  if (member.default_role === 'staff') {
    return '/dashboard';
  }
  
  // Member ya completó onboarding → Dashboard
  if (member.onboarding_completed) {
    return '/dashboard';
  }
  
  // Organization ya tiene onboarding → Second admin flow
  if (organization.onboarding_completed) {
    return '/onboarding/overview';
  }
  
  // Primer admin → Steps obligatorios
  return '/onboarding/step-1';
};
```

### **Estados de Loading y Error:**
```javascript
// Implementar estados consistentes para:
- Loading de queries
- Errores de creación
- Validaciones de formularios
- Estados de envío (submitting)
```

---

## 🚀 **FUNCIONALIDADES CRÍTICAS**

### **1. Validaciones:**
- Email válido para invitaciones
- Roles deben tener nombres únicos en la organización
- Trial debe tener al menos un miembro asignado
- Usuario debe auto-asignarse como PI en primer trial

### **2. UX/UI Considerations:**
- Steps del primer admin no pueden saltarse
- Loading states durante creación de trials
- Confirmaciones antes de acciones importantes
- Error handling claro y amigable

### **3. Data Management:**
- Refresh automático de listas después de crear elementos
- Optimistic updates donde sea apropiado
- Cache de queries de organización para performance

---

## ⚠️ **NOTAS IMPORTANTES PARA IMPLEMENTACIÓN**

### **RPC Function Simplificada:**
La función `create_trial_with_members` ya existe en Supabase y maneja automáticamente:
- Validación de permisos
- Creación atómica de trial + assignments
- Manejo de errores

### **Estados de Invitaciones:**
Las invitaciones se crean en tabla `invitations` con status 'pending'. El sistema de auth de Supabase manejará el registro posterior.

### **Reutilización de Componentes:**
Es CRÍTICO que los componentes de formularios sean reutilizables entre:
- Steps del primer admin 
- Modals del segundo admin
- Futuras páginas de gestión (`/organization`)

---

## 🎨 **DISEÑO Y ESTILOS**

- Usar Tailwind CSS + shadcn/ui components
- Diseño limpio y profesional para sector médico
- Steps progress indicator para primer admin
- Cards con métricas para segundo admin overview
- Modals responsivos para acciones opcionales

---

**¿ALGUNA PREGUNTA O CLARIFICACIÓN ADICIONAL ANTES DE EMPEZAR EL DESARROLLO?**