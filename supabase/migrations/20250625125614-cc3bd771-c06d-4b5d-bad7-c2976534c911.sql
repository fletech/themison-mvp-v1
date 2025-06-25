
-- 1. Crear función para verificar permisos de manera simple
CREATE OR REPLACE FUNCTION public.can_user_manage_trial_members(user_id UUID, trial_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM members m 
    JOIN trials t ON m.organization_id = t.organization_id
    WHERE m.profile_id = user_id AND t.id = trial_id
  );
$$;

-- 2. Crear stored procedure para crear trial con miembros de forma atómica
CREATE OR REPLACE FUNCTION public.create_trial_with_members(
  trial_data JSONB,
  team_assignments JSONB[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_trial_id UUID;
  assignment JSONB;
  user_org_id UUID;
BEGIN
  -- Obtener organization_id del usuario actual
  SELECT organization_id INTO user_org_id 
  FROM members 
  WHERE profile_id = auth.uid() 
  LIMIT 1;
  
  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'User is not a member of any organization';
  END IF;
  
  -- 1. Crear trial
  INSERT INTO trials (
    name, 
    description, 
    phase, 
    sponsor, 
    location, 
    study_start,
    estimated_close_out,
    organization_id, 
    created_by,
    status
  )
  VALUES (
    trial_data->>'name',
    trial_data->>'description', 
    trial_data->>'phase',
    trial_data->>'sponsor',
    trial_data->>'location',
    trial_data->>'study_start',
    trial_data->>'estimated_close_out',
    user_org_id,
    auth.uid(),
    'planning'
  )
  RETURNING id INTO new_trial_id;
  
  -- 2. Insertar miembros en lote si existen
  IF array_length(team_assignments, 1) > 0 THEN
    INSERT INTO trial_members (trial_id, member_id, role_id, is_active, start_date)
    SELECT 
      new_trial_id,
      (assignment->>'member_id')::UUID,
      (assignment->>'role_id')::UUID,
      COALESCE((assignment->>'is_active')::BOOLEAN, true),
      COALESCE((assignment->>'start_date')::DATE, CURRENT_DATE)
    FROM unnest(team_assignments) AS assignment;
  END IF;
  
  RETURN new_trial_id;
END;
$$;

-- 3. Simplificar las políticas RLS para evitar recursión
DROP POLICY IF EXISTS "Users can insert trial members for same organization" ON public.trial_members;
DROP POLICY IF EXISTS "Users can view trial members from same organization" ON public.trial_members;
DROP POLICY IF EXISTS "Users can update trial members for same organization" ON public.trial_members;
DROP POLICY IF EXISTS "Users can delete trial members for same organization" ON public.trial_members;

-- Políticas RLS simples usando la función
CREATE POLICY "Users can view trial members they can manage" 
ON public.trial_members 
FOR SELECT 
TO authenticated
USING (public.can_user_manage_trial_members(auth.uid(), trial_id));

CREATE POLICY "Users can insert trial members they can manage" 
ON public.trial_members 
FOR INSERT 
TO authenticated
WITH CHECK (public.can_user_manage_trial_members(auth.uid(), trial_id));

CREATE POLICY "Users can update trial members they can manage" 
ON public.trial_members 
FOR UPDATE 
TO authenticated
USING (public.can_user_manage_trial_members(auth.uid(), trial_id));

CREATE POLICY "Users can delete trial members they can manage" 
ON public.trial_members 
FOR DELETE 
TO authenticated
USING (public.can_user_manage_trial_members(auth.uid(), trial_id));

-- 4. Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION public.can_user_manage_trial_members(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_trial_with_members(JSONB, JSONB[]) TO authenticated;
