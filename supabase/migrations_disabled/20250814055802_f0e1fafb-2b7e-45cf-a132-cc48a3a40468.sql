
-- Grant superadmin role to the superadmin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('2c701da5-b77a-443f-9ab0-2185a5f7c030', 'superadmin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;
