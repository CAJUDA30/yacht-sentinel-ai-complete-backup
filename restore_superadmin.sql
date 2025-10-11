-- Restore superadmin account after database reset
-- This script creates/updates the superadmin user with correct credentials

-- First, check if user exists and create/update accordingly
DO $$
DECLARE
  superadmin_user_id UUID;
  password_hash TEXT;
BEGIN
  -- Create password hash for 'admin123'
  -- Note: In production, Supabase handles password hashing via the Auth API
  -- For local development, we'll use the Auth API directly
  
  -- Check if superadmin user exists
  SELECT id INTO superadmin_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@yachtexcel.com';
  
  IF superadmin_user_id IS NULL THEN
    -- User doesn't exist, will be created via Auth API
    RAISE NOTICE 'Superadmin user not found, will be created via Supabase Auth API';
  ELSE
    -- User exists, update metadata
    RAISE NOTICE 'Superadmin user found with ID: %', superadmin_user_id;
    
    -- Update user metadata to ensure superadmin role
    UPDATE auth.users 
    SET 
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{is_superadmin}',
        'true'::jsonb
      ),
      raw_app_meta_data = jsonb_set(
        jsonb_set(
          COALESCE(raw_app_meta_data, '{}'::jsonb),
          '{is_superadmin}',
          'true'::jsonb
        ),
        '{role}',
        '"global_superadmin"'::jsonb
      ),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = superadmin_user_id;
    
    -- Ensure user_roles entry exists
    INSERT INTO public.user_roles (user_id, role, yacht_id, granted_by, granted_at)
    VALUES (
      superadmin_user_id,
      'superadmin',
      NULL,
      superadmin_user_id,
      NOW()
    )
    ON CONFLICT (user_id, role, COALESCE(yacht_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET
      granted_at = NOW(),
      is_active = true;
    
    RAISE NOTICE 'Superadmin roles restored for user: %', superadmin_user_id;
  END IF;
END $$;

-- Grant superadmin necessary permissions
DO $$
DECLARE
  superadmin_user_id UUID;
BEGIN
  SELECT id INTO superadmin_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@yachtexcel.com';
  
  IF superadmin_user_id IS NOT NULL THEN
    -- Log the restoration
    INSERT INTO public.unified_ai_logs (
      action,
      provider,
      success,
      details,
      correlation_id
    ) VALUES (
      'superadmin_restoration',
      'system',
      true,
      jsonb_build_object(
        'user_id', superadmin_user_id,
        'email', 'superadmin@yachtexcel.com',
        'restored_at', NOW()
      ),
      gen_random_uuid()
    );
    
    RAISE NOTICE 'Superadmin restoration logged';
  END IF;
END $$;
