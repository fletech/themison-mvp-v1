# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development

- `npm run dev` - Start Vite development server (runs on localhost:8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

### Code Quality

Run `npm run lint` after making changes to ensure code quality standards are met.

## Project Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL with RLS)
- **State Management**: TanStack React Query + Context
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation

### Key Architecture Patterns

#### 1. Clinical Trial Management SaaS

This is a multi-tenant SaaS platform for managing clinical trials. Organizations (hospitals/medical institutions) create trials, invite team members, and assign roles.

#### 2. Database Structure (Supabase)

Core entities:

- `organizations` - Hospital/clinic entities
- `members` - Users within organizations with roles (admin/staff)
- `trials` - Clinical trials belonging to organizations
- `trial_members` - Role assignments for trials (admin/edit/read permissions)
- `trial_documents` - File storage for trial documentation
- `invitations` - Member invitation system
- `roles` - Custom roles per organization

#### 3. Role-Based Access Control (RBAC)

- **Organizational roles**: `admin` | `staff`
- **Trial-specific roles**: `admin` | `edit` | `read` (stored in `permission_level`)
- Users can have different roles across different trials
- Access controlled via RLS policies and permission checks

#### 4. Component Architecture

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard-specific components
│   ├── documents/       # Document management components
│   ├── onboarding/      # Multi-step onboarding flow
│   ├── organization/    # Organization management
│   ├── trials/          # Trial management components
│   └── layout/          # Layout components (AppLayout, AppSidebar)
├── hooks/               # Custom hooks for data and logic
├── pages/               # Page components (routed views)
├── integrations/        # Supabase client and types
└── services/            # Business logic services
```

### Critical Business Logic

#### 1. Onboarding Flow

The app enforces a mandatory onboarding process:

- **First admin**: Must complete 3-step flow (invite members → create roles → create trial)
- **Subsequent admins**: See organization overview with optional actions
- **Staff**: Skip onboarding, go directly to dashboard
- Controlled by `OnboardingRedirect` component checking `member.onboarding_completed`

#### 2. Multi-tenant Data Access

- All data queries filter by `organization_id` via RLS policies
- Users can only see data from their organization
- Use `useAppData` hook for organization-scoped data

#### 3. Trial Creation with Team Assignment

Uses Supabase RPC function `create_trial_with_members`:

```typescript
await supabase.rpc("create_trial_with_members", {
  trial_data: {
    name,
    description,
    phase,
    sponsor,
    location,
    study_start,
    estimated_close_out,
  },
  team_assignments: [{ member_id, role_id, is_active, start_date }],
});
```

### Important Hooks

#### Core Data Hooks

- `useAuth()` - Authentication state and user profile
- `useAppData()` - Organization members, trials, roles (centralized data layer)
- `usePermissions()` - Permission checking for UI elements
- `useTrials()` - Trial-specific data and mutations
- `useDocuments()` - Document upload and management

#### Navigation & State

- `useBreadcrumb()` - Dynamic breadcrumb management
- `useOnboardingStep()` - Onboarding flow navigation

### Development Guidelines

#### 1. Permission Checking

Always check permissions before showing actions:

```typescript
const { hasPermission } = usePermissions();
// Check organizational permissions
if (hasPermission("create_trials")) {
  /* show create button */
}
```

#### 2. Error Handling

- Use React Query for data fetching with built-in error states
- Show user-friendly error messages using toast notifications
- Handle Supabase auth errors gracefully

#### 3. Form Patterns

- Use React Hook Form + Zod for validation
- Implement optimistic updates where appropriate
- Show loading states during mutations

#### 4. File Uploads

Document uploads go through `documentService.ts` and are stored in Supabase Storage with proper organization isolation.

### Database Relationships & Constraints

#### Key Foreign Keys

- `members.organization_id` → `organizations.id`
- `trials.organization_id` → `organizations.id`
- `trial_members.trial_id` → `trials.id`
- `trial_members.member_id` → `members.id`
- `trial_documents.trial_id` → `trials.id`

#### Permission Levels

Trial permissions follow hierarchy: `admin` > `edit` > `read`

- `admin`: Full trial control (settings, team management)
- `edit`: Can modify trial data and documents
- `read`: View-only access

### TypeScript Patterns

#### Database Types

Generated Supabase types are in `src/integrations/supabase/types.ts`. Use type aliases:

- `Tables<'table_name'>` for row types
- `TablesInsert<'table_name'>` for insert operations
- `TablesUpdate<'table_name'>` for update operations

#### Common Type Patterns

```typescript
type MemberWithProfile = Tables<"members"> & {
  profiles: Tables<"profiles">;
};

type TrialWithMembers = Tables<"trials"> & {
  trial_members: (Tables<"trial_members"> & {
    members: MemberWithProfile;
    roles: Tables<"roles">;
  })[];
};
```

### Performance Considerations

#### 1. Query Optimization

- Use React Query's `staleTime` and `cacheTime` appropriately
- Batch related queries using parallel execution
- Implement pagination for large datasets (trials, documents)

#### 2. Component Optimization

- Lazy load heavy components (document viewers, charts)
- Use React.memo for expensive renders
- Implement virtual scrolling for large lists

### Security Notes

#### 1. Row Level Security (RLS)

All tables have RLS policies that filter by organization. Never disable RLS or bypass these policies.

#### 2. File Access

Document URLs from Supabase Storage include security tokens. Don't store these URLs permanently - regenerate as needed.

#### 3. Invitation System

Invitations create pending records that are converted to members upon signup. Ensure proper cleanup of expired invitations.

## Testing Strategy

### Unit Tests

Focus on:

- Hook logic (permission calculations, data transformations)
- Form validation schemas
- Utility functions

### Integration Tests

Test:

- Authentication flows
- Onboarding completion
- Trial creation with team assignment
- Document upload and access

When writing tests, mock Supabase calls and focus on component behavior rather than database operations.

# 📄 **Guía: Cómo Gestionar Documentos de Pacientes**

## ✅ **Problemas Arreglados**

### 1. **Error de Edición de Paciente**

- **Problema**: "JSON object requested, multiple (or no) rows returned"
- **Solución**: Añadida validación de existencia y duplicados antes del update
- **Estado**: ✅ ARREGLADO

### 2. **Errores de TypeScript en PatientDocuments**

- **Problema**: Tipos incompatibles para `status` field
- **Solución**: Actualizados los tipos para manejar `string | null` desde la DB
- **Estado**: ✅ ARREGLADO

## 🗂️ **Cómo Subir Documentos para Pacientes**

### **Método 1: Desde la Tabla de Pacientes**

1. Ve a **Organization > Patients**
2. Haz click en el **ojo (👁️)** del paciente
3. Se abre el **PatientDetailsDrawer**
4. Click en la pestaña **"Documents"**
5. Click en **"Upload Document"**

### **Método 2: Flujo Completo Paso a Paso**

#### **Paso 1: Acceder a Documentos**

```typescript
// La tabla muestra un resumen de documentos por paciente
<PatientDocumentsSummary patientId={patient.id} />
```

#### **Paso 2: Dialog de Upload**

- **Select File**: Arrastra archivos o click para seleccionar
- **Document Name**: Opcional (usa filename si está vacío)
- **Document Type**: 📋 Medical Record, 🧪 Lab Result, etc.
- **Status**: Pending, Approved, Signed, etc.
- **Description**: Descripción opcional
- **Tags**: tag1, tag2, tag3 (separados por comas)

#### **Paso 3: Formatos Soportados**

```
✅ PDF, DOC, DOCX, JPG, JPEG, PNG, TXT, CSV, XLSX
```

## 🎯 **Tipos de Documentos Disponibles**

| Tipo                 | Icono | Descripción                   |
| -------------------- | ----- | ----------------------------- |
| Medical Record       | 📋    | Expediente médico             |
| Lab Result           | 🧪    | Resultados de laboratorio     |
| Imaging              | 🔬    | Imágenes médicas              |
| Consent Form         | 📝    | Formularios de consentimiento |
| Assessment           | 📊    | Evaluaciones                  |
| Questionnaire        | ❓    | Cuestionarios                 |
| Adverse Event Report | ⚠️    | Reportes de eventos adversos  |
| Medication Record    | 💊    | Registros de medicamentos     |
| Visit Note           | 📄    | Notas de visitas              |
| Discharge Summary    | 🏥    | Resúmenes de alta             |
| Other                | 📁    | Otros documentos              |

## 📊 **Estados de Documentos**

| Estado    | Color       | Descripción             |
| --------- | ----------- | ----------------------- |
| Pending   | 🟡 Amarillo | Esperando revisión      |
| Approved  | 🟢 Verde    | Aprobado para uso       |
| Signed    | 🔵 Azul     | Firmado por el paciente |
| Submitted | 🟣 Púrpura  | Enviado para revisión   |
| Active    | 🟢 Verde    | Documento activo        |
| Rejected  | 🔴 Rojo     | Rechazado               |
| Archived  | ⚫ Gris     | Archivado               |

## 🔍 **Funcionalidades de Búsqueda y Filtros**

### **Búsqueda Inteligente**

- Busca por **nombre del documento**
- Busca por **descripción**
- Busca por **tags**

### **Filtros Avanzados**

- **Por tipo**: Filtra por tipo de documento
- **Por estado**: Filtra por estado de aprobación
- **Combinados**: Usa ambos filtros simultáneamente

## ⚡ **Acciones Disponibles**

### **En la Tabla de Documentos**

- **👁️ Ver/Descargar**: Abre el documento en nueva pestaña
- **✏️ Editar**: Modifica metadata (nombre, tipo, estado, descripción, tags)
- **🗑️ Eliminar**: Borra el documento (con confirmación)

### **Información Mostrada**

- **Nombre y descripción** del documento
- **Tags** (máximo 3 visibles + contador)
- **Tipo** con icono identificativo
- **Estado** con badge colorido
- **Tamaño** del archivo formateado
- **Fecha de subida** y **versión**
- **Badge "Latest"** para última versión

## 💾 **Almacenamiento Técnico**

### **Supabase Storage**

- Bucket: `documents`
- Carpeta: `patient-documents/`
- URLs públicas automáticas
- Naming único: `timestamp-random.extension`

### **Base de Datos**

```sql
patient_documents
├── id (UUID)
├── patient_id → patients.id
├── uploaded_by → members.id
├── document_name, document_type
├── status, description, tags
├── file_size, mime_type
├── version, is_latest
└── created_at, updated_at
```

## 🚀 **Ejemplos de Uso**

### **Subir Resultados de Lab**

1. Patient Details → Documents tab
2. Upload Document
3. Type: "Lab Result" 🧪
4. Status: "Pending"
5. Description: "Blood work from 2024-01-15"
6. Tags: "blood, routine, quarterly"

### **Subir Consentimiento Firmado**

1. Upload Document
2. Type: "Consent Form" 📝
3. Status: "Signed"
4. Description: "Informed consent for trial participation"
5. Tags: "consent, signed, trial"

### **Buscar Documentos Específicos**

- Buscar: "blood" → Encuentra todos los análisis de sangre
- Filtro Tipo: "Lab Result" → Solo resultados de lab
- Filtro Estado: "Approved" → Solo documentos aprobados

## 🎉 **Todo Funcional Ahora**

✅ **Upload de documentos** con metadata completa  
✅ **Edición de documentos** (metadata, no archivo)  
✅ **Búsqueda y filtros** avanzados  
✅ **Estados y versionado** automático  
✅ **Responsive design** (Desktop + Mobile)  
✅ **Integración completa** con la tabla de pacientes  
✅ **Errores TypeScript** resueltos  
✅ **Error de edición** de pacientes arreglado

¡El sistema de gestión de documentos está completamente operativo! 🏥✨
