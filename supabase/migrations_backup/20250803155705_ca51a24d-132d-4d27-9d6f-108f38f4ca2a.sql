-- Fix OTP expiry warning by setting shorter OTP expiry time
-- Note: auth.config may not exist in all Supabase versions, using conditional approach
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'config') THEN
    UPDATE auth.config SET 
      token_expiry = 3600 
    WHERE lower(option_name) = 'token_expiry';
  END IF;
END $$;