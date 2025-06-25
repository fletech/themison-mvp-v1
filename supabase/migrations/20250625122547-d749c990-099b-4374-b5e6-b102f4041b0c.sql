
-- Revertir las políticas inseguras y crear políticas seguras y simples
DROP POLICY IF EXISTS "Allow authenticated users to view trial_members" ON public.trial_members;
DROP POLICY IF EXISTS "Allow authenticated users to insert trial_members" ON public.trial_members;
DROP POLICY IF EXISTS "Allow authenticated users to update trial_members" ON public.trial_members;
DROP POLICY IF EXISTS "Allow authenticated users to delete trial_members" ON public.trial_members;

-- Crear políticas simples pero seguras basadas en la organización del usuario
-- Solo permitir acceso a trial_members donde el usuario pertenece a la misma organización que el trial
CREATE POLICY "Users can view trial members from same organization" 
ON public.trial_members 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trials t 
    JOIN members m ON t.organization_id = m.organization_id 
    WHERE t.id = trial_members.trial_id 
    AND m.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can insert trial members for same organization" 
ON public.trial_members 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM trials t 
    JOIN members m ON t.organization_id = m.organization_id 
    WHERE t.id = trial_members.trial_id 
    AND m.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can update trial members for same organization" 
ON public.trial_members 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trials t 
    JOIN members m ON t.organization_id = m.organization_id 
    WHERE t.id = trial_members.trial_id 
    AND m.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can delete trial members for same organization" 
ON public.trial_members 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trials t 
    JOIN members m ON t.organization_id = m.organization_id 
    WHERE t.id = trial_members.trial_id 
    AND m.profile_id = auth.uid()
  )
);
