-- Confirm superadmin email manually to bypass email verification
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE id = '2c701da5-b77a-443f-9ab0-2185a5f7c030' 
AND email = 'superadmin@yachtexcel.com';