-- Fix critical security issue: Restrict ai_system_config table access to superadmins only

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on ai_system_config" ON public.ai_system_config;

-- Create secure policies that only allow superadmins to access system configuration

-- Policy for SELECT: Only superadmins can read system configuration  
CREATE POLICY "Superadmins can read system config" 
ON public.ai_system_config 
FOR SELECT 
TO authenticated
USING (
  public.is_superadmin_or_named(auth.uid())
);

-- Policy for INSERT: Only superadmins can create system configuration
CREATE POLICY "Superadmins can insert system config" 
ON public.ai_system_config 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.is_superadmin_or_named(auth.uid())
);

-- Policy for UPDATE: Only superadmins can modify system configuration
CREATE POLICY "Superadmins can update system config" 
ON public.ai_system_config 
FOR UPDATE 
TO authenticated
USING (
  public.is_superadmin_or_named(auth.uid())
)
WITH CHECK (
  public.is_superadmin_or_named(auth.uid())
);

-- Policy for DELETE: Only superadmins can delete system configuration
CREATE POLICY "Superadmins can delete system config" 
ON public.ai_system_config 
FOR DELETE 
TO authenticated
USING (
  public.is_superadmin_or_named(auth.uid())
);

-- Create a trigger to automatically set updated_by field when configuration is modified
CREATE OR REPLACE FUNCTION public.set_ai_config_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT and UPDATE operations
DROP TRIGGER IF EXISTS set_ai_config_updated_by_trigger ON public.ai_system_config;
CREATE TRIGGER set_ai_config_updated_by_trigger
  BEFORE INSERT OR UPDATE ON public.ai_system_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ai_config_updated_by();

-- Ensure the updated_by column is not nullable to enforce accountability
ALTER TABLE public.ai_system_config 
ALTER COLUMN updated_by SET NOT NULL;