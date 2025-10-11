-- Safe migration to fix policies and UUID defaults without losing data
-- This addresses the issues found in db diff without resetting

-- Fix UUID generation defaults for AI tables (they currently use uuid_generate_v4 but should use gen_random_uuid)
ALTER TABLE "public"."ai_health" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "public"."ai_models_unified" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "public"."ai_providers_unified" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Drop and recreate yacht_profiles policies with correct references
DROP POLICY IF EXISTS "Users can view their own yacht profiles" ON "public"."yacht_profiles";
DROP POLICY IF EXISTS "Yacht owners can manage their yachts" ON "public"."yacht_profiles";

-- Fixed yacht_profiles policies (corrected the self-reference bug in user_roles join)
CREATE POLICY "Users can view their own yacht profiles" ON "public"."yacht_profiles"
  AS PERMISSIVE FOR SELECT TO public
  USING (
    -- Hardcoded superadmin access
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::uuid OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::uuid OR
    -- Email-based superadmin access
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid() 
      AND users.email = 'superadmin@yachtexcel.com'
    ) OR
    -- Owner access
    auth.uid() = owner_id OR
    -- User role access (FIXED: yacht_profiles.id not ur.id)
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.yacht_id = yacht_profiles.id 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Yacht owners can manage their yachts" ON "public"."yacht_profiles"
  AS PERMISSIVE FOR ALL TO public
  USING (
    -- Hardcoded superadmin access
    auth.uid() = '6d201176-5be1-45d4-b09f-f70cb4ad38ac'::uuid OR
    auth.uid() = 'a751a50b-740c-4a38-a169-33185128fec5'::uuid OR
    -- Email-based superadmin access
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid() 
      AND users.email = 'superadmin@yachtexcel.com'
    ) OR
    -- Owner access
    auth.uid() = owner_id
  );

-- Create superadmin user if not exists (safe upsert approach)
DO $$
DECLARE
  superadmin_user_id uuid;
BEGIN
  -- Check if superadmin user already exists
  SELECT id INTO superadmin_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@yachtexcel.com' 
  LIMIT 1;

  -- If user doesn't exist, we need to create it via the application
  -- This migration just ensures the user_roles entry exists if the user exists
  IF superadmin_user_id IS NOT NULL THEN
    -- Ensure superadmin role exists
    INSERT INTO public.user_roles (user_id, role, yacht_id, is_active, created_by)
    VALUES (superadmin_user_id, 'superadmin', NULL, true, superadmin_user_id)
    ON CONFLICT (user_id, yacht_id, role) DO NOTHING;
    
    RAISE NOTICE 'Superadmin role ensured for existing user: %', superadmin_user_id;
  ELSE
    RAISE NOTICE 'Superadmin user does not exist yet - will need to be created via auth API';
  END IF;
END $$;