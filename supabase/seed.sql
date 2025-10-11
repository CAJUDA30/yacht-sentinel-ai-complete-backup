-- Seed file to restore critical data after database reset
-- This file runs automatically after migrations during `supabase db reset`

-- Note: User creation must be done via Supabase Auth API (see restore_superadmin.sh)
-- This seed file only handles the user_roles table

-- First, we need to get or create the superadmin user
DO $$
DECLARE
  superadmin_user_id UUID;
BEGIN
  -- Check if superadmin user exists in auth.users
  SELECT id INTO superadmin_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@yachtexcel.com'
  LIMIT 1;
  
  IF superadmin_user_id IS NOT NULL THEN
    -- User exists, ensure user_roles entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (superadmin_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Superadmin role seeded for existing user: %', superadmin_user_id;
  ELSE
    RAISE NOTICE 'Superadmin user not found in auth.users - run restore_superadmin.sh to create';
  END IF;
END $$;

-- Log seed execution
INSERT INTO public.unified_ai_logs (
  action,
  provider,
  success,
  details,
  correlation_id
) VALUES (
  'database_seed',
  'system',
  true,
  jsonb_build_object(
    'seeded_at', NOW(),
    'seed_file', 'supabase/seed.sql'
  ),
  gen_random_uuid()
) ON CONFLICT DO NOTHING;
