
-- PASO 1: Verificar y eliminar políticas existentes de manera más específica
DO $$
BEGIN
    -- Eliminar políticas específicas si existen
    DROP POLICY IF EXISTS "Users can view trial members from their organization" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can insert trial members for their organization" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can update trial members from their organization" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can delete trial members from their organization" ON public.trial_members;
    
    -- Eliminar cualquier otra política que pueda existir
    DROP POLICY IF EXISTS "Users can view trial members they can manage" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can insert trial members they can manage" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can update trial members they can manage" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can delete trial members they can manage" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can view trial members from same organization" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can insert trial members for same organization" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can update trial members for same organization" ON public.trial_members;
    DROP POLICY IF EXISTS "Users can delete trial members for same organization" ON public.trial_members;
END $$;

-- PASO 2: Eliminar funciones problemáticas si existen
DROP FUNCTION IF EXISTS public.can_user_manage_trial_members(UUID, UUID);

-- PASO 3: Crear función simple (reemplazando si existe)
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 STABLE
AS $$
BEGIN
    RETURN (
        SELECT m.organization_id
        FROM members m
        WHERE m.profile_id = auth.uid()
        LIMIT 1
    );
END;
$$;

-- PASO 4: Crear políticas RLS con nombres únicos
CREATE POLICY "trial_members_select_by_org" 
ON public.trial_members 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trials t 
    WHERE t.id = trial_members.trial_id 
    AND t.organization_id = public.user_belongs_to_organization()
  )
);

CREATE POLICY "trial_members_insert_by_org" 
ON public.trial_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trials t 
    WHERE t.id = trial_members.trial_id 
    AND t.organization_id = public.user_belongs_to_organization()
  )
);

CREATE POLICY "trial_members_update_by_org" 
ON public.trial_members 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trials t 
    WHERE t.id = trial_members.trial_id 
    AND t.organization_id = public.user_belongs_to_organization()
  )
);

CREATE POLICY "trial_members_delete_by_org" 
ON public.trial_members 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trials t 
    WHERE t.id = trial_members.trial_id 
    AND t.organization_id = public.user_belongs_to_organization()
  )
);

-- PASO 5: Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION public.user_belongs_to_organization() TO authenticated;
