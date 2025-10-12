         info         
----------------------
 -- USER ROLES BACKUP
(1 row)

                    info                     
---------------------------------------------
 -- Generated: 2025-10-12 12:37:07.008393+00
(1 row)

 ?column? 
----------
 
(1 row)

                                                                     ?column?                                                                      
LEGACY_API_KEY_REDACTED_FOR_GITHUB_SECURITY------------------
 INSERT INTO public.user_roles (id, user_id, role, department, granted_by, granted_at, expires_at, is_active, permissions, created_at, updated_at)
(1 row)

 ?column? 
----------
 VALUES
(1 row)

                                                                                                                                                          restore_statement                                                                                                                                                           
LEGACY_API_KEY_REDACTED_FOR_GITHUB_SECURITYLEGACY_API_KEY_REDACTED_FOR_GITHUB_SECURITY--------------------------------------------------------------------
   ('95b713ae-a83d-4494-a96b-3e9d12bd32b8'::uuid, 'ff775236-0d8e-4883-94ea-ab55868354f7'::uuid, 'superadmin', NULL, 'ff775236-0d8e-4883-94ea-ab55868354f7'::uuid, '2025-10-12 11:38:49.744379+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 11:38:49.744379+00'::timestamptz, '2025-10-12 11:38:49.744379+00'::timestamptz),
   ('4ad5609e-891c-44ba-a791-16f8fa372466'::uuid, '24103a8a-2cd3-4834-b07f-21cedb85e5b7'::uuid, 'admin', NULL, '24103a8a-2cd3-4834-b07f-21cedb85e5b7'::uuid, '2025-10-12 11:39:00.257664+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 11:39:00.257664+00'::timestamptz, '2025-10-12 11:39:00.257664+00'::timestamptz),
   ('f7abc3bb-26e9-492e-95d4-a42bcbf5ab4b'::uuid, '72bde714-701d-4d8d-91bf-a952678014f4'::uuid, 'manager', NULL, '72bde714-701d-4d8d-91bf-a952678014f4'::uuid, '2025-10-12 11:39:00.33592+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 11:39:00.33592+00'::timestamptz, '2025-10-12 11:39:00.33592+00'::timestamptz),
   ('41356402-c96f-4791-a857-345eef0ce30f'::uuid, 'cdf05c1b-75cd-437c-9d3d-5657ba4da2df'::uuid, 'user', NULL, 'cdf05c1b-75cd-437c-9d3d-5657ba4da2df'::uuid, '2025-10-12 11:39:00.410069+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 11:39:00.410069+00'::timestamptz, '2025-10-12 11:39:00.410069+00'::timestamptz),
   ('628fc23e-c043-4ffa-bf72-cf6534eceb7b'::uuid, 'd831a30b-5577-4ac4-9d3c-08eaf67a3607'::uuid, 'viewer', NULL, 'd831a30b-5577-4ac4-9d3c-08eaf67a3607'::uuid, '2025-10-12 11:39:00.48384+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 11:39:00.48384+00'::timestamptz, '2025-10-12 11:39:00.48384+00'::timestamptz),
   ('b9d7693b-0000-4da4-9b78-feb98401b444'::uuid, '0f3a8380-fde3-4e80-8469-985e9354696f'::uuid, 'guest', NULL, '0f3a8380-fde3-4e80-8469-985e9354696f'::uuid, '2025-10-12 11:39:00.559045+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 11:39:00.559045+00'::timestamptz, '2025-10-12 11:39:00.559045+00'::timestamptz);
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
LEGACY_API_KEY_REDACTED_FOR_GITHUB_SECURITY------------------------------
   ('e3989a5c-50d2-4956-8709-a359a07ded28'::uuid, 'guest', 'read', 'public_content', 'view', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('d76cbcad-3e7b-4b54-9f29-5839c26dc3c7'::uuid, 'viewer', 'read', 'yachts', 'view', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('3c74d077-11c3-4baa-8e3a-4e297eb8bc26'::uuid, 'viewer', 'read', 'reports', 'view', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('8625f2d5-1caf-447f-912d-b0ecf71f24a4'::uuid, 'viewer', 'read', 'inventory', 'view', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('f091bc8c-875f-4d58-bc1d-3b46a92fc1ca'::uuid, 'user', 'read', 'yachts', 'view', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('bb363f64-7e80-49be-a3a4-c8ea6bae52de'::uuid, 'user', 'write', 'yachts', 'update_assigned', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('d33c3f11-170e-43bf-abc0-e2b4461157e7'::uuid, 'user', 'read', 'inventory', 'view', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('ace03cb3-202f-41fb-8a3f-b26745ca5ce7'::uuid, 'user', 'write', 'inventory', 'update_assigned', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('3b90eb91-c4be-48ac-b911-44b1d58b1ba6'::uuid, 'user', 'read', 'reports', 'view', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('ae8a3bbd-5fd0-4e08-b237-23d609287b1d'::uuid, 'user', 'write', 'reports', 'create_own', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('9d1b843c-72b4-4aef-8e13-e0602d7cc6fc'::uuid, 'user', 'read', 'profile', 'view_own', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('99a2f0db-1a44-49be-8768-5ba56358add8'::uuid, 'user', 'write', 'profile', 'update_own', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('17910af1-1892-4470-beb7-c0cfe21ad745'::uuid, 'manager', 'read', 'yachts', 'view_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('e0c231be-92db-4108-b6a4-84694055ee17'::uuid, 'manager', 'write', 'yachts', 'update_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('a149b267-014d-4333-a1f8-4c4c2a2859a2'::uuid, 'manager', 'read', 'users', 'view_team', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('4d19db97-2f8a-4235-860e-75e69255b8e9'::uuid, 'manager', 'write', 'users', 'manage_team', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('f78e9eac-2e05-4193-bc23-15328993c7c0'::uuid, 'manager', 'read', 'inventory', 'view_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('87448844-83c9-4089-bf3c-bd306f56c181'::uuid, 'manager', 'write', 'inventory', 'manage_team', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('94d9814a-7744-48ad-9787-520aa3eb4bbc'::uuid, 'manager', 'read', 'reports', 'view_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('22a3999b-9230-4c40-af11-dcca03c5d111'::uuid, 'manager', 'write', 'reports', 'manage_team', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('44d50342-5949-4203-aad6-b36bea5dd01b'::uuid, 'manager', 'read', 'analytics', 'view_team', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('06f7a317-9f3b-4502-89bd-58992887dba3'::uuid, 'admin', 'read', 'users', 'view_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('131c0bfc-b89d-448d-8058-b843d4f59eb9'::uuid, 'admin', 'write', 'users', 'manage_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('b0fd9fd9-9beb-429d-bb77-e254da856570'::uuid, 'admin', 'delete', 'users', 'deactivate', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('f4a05a47-83aa-4749-a7b8-c74e55a2853a'::uuid, 'admin', 'read', 'system', 'view_config', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('9c0260f0-3abb-431e-9835-48bdc989e9bb'::uuid, 'admin', 'write', 'system', 'configure', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('cd0b2204-c337-4ce1-b635-89bc08bf4702'::uuid, 'admin', 'read', 'yachts', 'view_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('7cdec3f7-2eb2-49f9-ac06-f14ee102deaa'::uuid, 'admin', 'write', 'yachts', 'manage_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('3feff221-4e50-459c-88d5-1cda026e9dbc'::uuid, 'admin', 'delete', 'yachts', 'delete', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('0810e0d8-decd-485e-9ea4-230863662f66'::uuid, 'admin', 'read', 'analytics', 'view_all', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('7b00e0a5-6482-463a-8b33-71c4bcbcd3a2'::uuid, 'admin', 'write', 'roles', 'assign_standard', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('8685cae7-2451-47a7-a80b-dbcbbf17e524'::uuid, 'superadmin', 'admin', '*', '*', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('2521c11b-5fd8-4184-a910-49260306c6c6'::uuid, 'superadmin', 'read', '*', '*', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('a7340fab-4789-42fd-b92c-292ed67b2b52'::uuid, 'superadmin', 'write', '*', '*', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz),
   ('e843df04-25e0-4b12-a51e-f2a5ee44d988'::uuid, 'superadmin', 'delete', '*', '*', '{}'::jsonb, '2025-10-12 11:37:09.368024+00'::timestamptz);
(35 rows)

