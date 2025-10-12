         info         
----------------------
 -- USER ROLES BACKUP
(1 row)

                    info                     
---------------------------------------------
 -- Generated: 2025-10-12 15:50:19.133123+00
(1 row)

 ?column? 
----------
 
(1 row)

                                                                     ?column?                                                                      
---------------------------------------------------------------------------------------------------------------------------------------------------
 INSERT INTO public.user_roles (id, user_id, role, department, granted_by, granted_at, expires_at, is_active, permissions, created_at, updated_at)
(1 row)

 ?column? 
----------
 VALUES
(1 row)

                                                                                                                                                          restore_statement                                                                                                                                                           
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   ('0467539b-21d0-47a9-9bc9-6483b5059298'::uuid, '1bd0c48f-ee24-44da-8d0e-37683526a6cf'::uuid, 'superadmin', NULL, '1bd0c48f-ee24-44da-8d0e-37683526a6cf'::uuid, '2025-10-12 15:50:13.056077+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 15:50:13.056077+00'::timestamptz, '2025-10-12 15:50:13.056077+00'::timestamptz),
   ('86597721-4c89-4ba3-afef-5d0d10c9445c'::uuid, '519453b6-1c23-4d07-86ff-60f276cae84f'::uuid, 'admin', NULL, '519453b6-1c23-4d07-86ff-60f276cae84f'::uuid, '2025-10-12 15:50:13.151189+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 15:50:13.151189+00'::timestamptz, '2025-10-12 15:50:13.151189+00'::timestamptz),
   ('03f0b6ee-86ec-4c94-8da5-2a46b4fdbb75'::uuid, 'ff989ef6-5c1f-46b6-bb27-7580ad3b0ba5'::uuid, 'manager', NULL, 'ff989ef6-5c1f-46b6-bb27-7580ad3b0ba5'::uuid, '2025-10-12 15:50:13.235822+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 15:50:13.235822+00'::timestamptz, '2025-10-12 15:50:13.235822+00'::timestamptz),
   ('84eb75ee-56f2-431e-b9e4-05916f21a2ff'::uuid, 'd541b3fd-0d19-4cb4-af4e-4629d0a7b7bd'::uuid, 'user', NULL, 'd541b3fd-0d19-4cb4-af4e-4629d0a7b7bd'::uuid, '2025-10-12 15:50:13.318468+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 15:50:13.318468+00'::timestamptz, '2025-10-12 15:50:13.318468+00'::timestamptz),
   ('96ef8d3c-4580-4716-9672-7f89a7d4fea4'::uuid, 'd176c456-1dd7-4a5c-841e-b1557cdb2ae5'::uuid, 'viewer', NULL, 'd176c456-1dd7-4a5c-841e-b1557cdb2ae5'::uuid, '2025-10-12 15:50:13.402421+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 15:50:13.402421+00'::timestamptz, '2025-10-12 15:50:13.402421+00'::timestamptz),
   ('6be2a06c-6634-4374-9371-7903294e0c88'::uuid, '80b3f53d-a543-44d4-b5af-46a6d53d6ee5'::uuid, 'guest', NULL, '80b3f53d-a543-44d4-b5af-46a6d53d6ee5'::uuid, '2025-10-12 15:50:13.486846+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 15:50:13.486846+00'::timestamptz, '2025-10-12 15:50:13.486846+00'::timestamptz);
(6 rows)

 ?column? 
----------
 
(1 row)

          ?column?          
----------------------------
 -- ROLE PERMISSIONS MATRIX
(1 row)

                                               ?column?                                               
------------------------------------------------------------------------------------------------------
 INSERT INTO public.role_permissions (id, role, permission, resource, action, conditions, created_at)
(1 row)

 ?column? 
----------
 VALUES
(1 row)

                                                                       restore_statement                                                                       
---------------------------------------------------------------------------------------------------------------------------------------------------------------
   ('9c62bb3f-91f4-4b1b-a417-334f0c33a89a'::uuid, 'guest', 'read', 'public_content', 'view', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('97e5bd55-387f-4afc-a711-1f68294b79be'::uuid, 'viewer', 'read', 'yachts', 'view', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('c4e353d2-4a2d-42c6-92f8-05361a2c9055'::uuid, 'viewer', 'read', 'reports', 'view', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('3ca0f7b8-6fff-42ae-b797-83af71b1aecd'::uuid, 'viewer', 'read', 'inventory', 'view', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('eda5a0d2-6470-4c3f-b3eb-c2e34d84ab2d'::uuid, 'user', 'read', 'yachts', 'view', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('c5c42db3-6ade-4b90-a02e-2ed56223357e'::uuid, 'user', 'write', 'yachts', 'update_assigned', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('15580896-ae5e-4c11-8053-511a6a2003b0'::uuid, 'user', 'read', 'inventory', 'view', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('1d7356af-3a07-4937-a8f2-65814a8f3901'::uuid, 'user', 'write', 'inventory', 'update_assigned', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('82ee7123-4f9f-41bf-b1c3-500dc9523d15'::uuid, 'user', 'read', 'reports', 'view', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('8bdf8e32-6c29-4f52-8de8-c1b1e451850d'::uuid, 'user', 'write', 'reports', 'create_own', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('ab27acdc-e6b2-469a-9fb0-61edace3fdac'::uuid, 'user', 'read', 'profile', 'view_own', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('4ce07efe-1f0d-4296-a7df-d7c38745a5dc'::uuid, 'user', 'write', 'profile', 'update_own', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('b557e53a-08a9-4371-88b6-fe1d152e480b'::uuid, 'manager', 'read', 'yachts', 'view_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('eb5dc561-8388-4736-9624-a7a33b734302'::uuid, 'manager', 'write', 'yachts', 'update_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('977bd0fd-9c04-42fe-a5fe-fe8d8c4990ed'::uuid, 'manager', 'read', 'users', 'view_team', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('30f40b11-7342-4261-b079-ee98180d0cd7'::uuid, 'manager', 'write', 'users', 'manage_team', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('45bb6a98-c895-4b96-b640-fd775f93a74e'::uuid, 'manager', 'read', 'inventory', 'view_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('5c4db287-d356-4faf-a863-f11a65839383'::uuid, 'manager', 'write', 'inventory', 'manage_team', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('29921da6-0f9c-4bf3-aa81-7bf61c03b21f'::uuid, 'manager', 'read', 'reports', 'view_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('7e18c45f-9e58-4ee8-8199-76fcf89fde0d'::uuid, 'manager', 'write', 'reports', 'manage_team', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('76c2bd86-79f9-45b5-8949-7f92654f4515'::uuid, 'manager', 'read', 'analytics', 'view_team', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('990f8406-15ec-4f90-b585-1440c77c06da'::uuid, 'admin', 'read', 'users', 'view_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('66e9a412-b4e5-46cc-a7ca-88720e900e25'::uuid, 'admin', 'write', 'users', 'manage_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('6740f62b-6a6e-4e3b-b6f2-86408accb754'::uuid, 'admin', 'delete', 'users', 'deactivate', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('8a1eafdd-4d60-454b-8dc7-67d672b2cd46'::uuid, 'admin', 'read', 'system', 'view_config', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('acc854d4-c7bd-48cd-9ad3-5449de2ea4f8'::uuid, 'admin', 'write', 'system', 'configure', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('8fe29212-b3a8-4721-a2f0-adb7932457d5'::uuid, 'admin', 'read', 'yachts', 'view_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('093d9064-0952-4a4b-8051-ed47bdc67e6b'::uuid, 'admin', 'write', 'yachts', 'manage_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('728acee6-62cf-4d3d-a56d-7ecb96187d4c'::uuid, 'admin', 'delete', 'yachts', 'delete', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('52ad211d-a94a-471a-9a52-3310dceebd5f'::uuid, 'admin', 'read', 'analytics', 'view_all', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('082d5a6f-e370-41c1-a813-b15681bdd1fd'::uuid, 'admin', 'write', 'roles', 'assign_standard', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('97ab8f2d-af41-40db-a995-c76ac9704477'::uuid, 'superadmin', 'admin', '*', '*', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('881838bf-e54f-440c-bd62-bd91443cf15f'::uuid, 'superadmin', 'read', '*', '*', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('01be360e-2add-4083-af67-4af980e07147'::uuid, 'superadmin', 'write', '*', '*', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz),
   ('11c0bc24-0b20-46ac-a6c7-dce91ae967fe'::uuid, 'superadmin', 'delete', '*', '*', '{}'::jsonb, '2025-10-12 14:55:24.521088+00'::timestamptz);
(35 rows)

