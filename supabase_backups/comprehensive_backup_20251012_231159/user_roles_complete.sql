         info         
----------------------
 -- USER ROLES BACKUP
(1 row)

                    info                     
---------------------------------------------
 -- Generated: 2025-10-12 21:11:59.398346+00
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
   ('0121ad79-a4ce-45f1-9a5d-c2a8deffceb1'::uuid, 'c5f001c6-6a59-49bb-a698-a97c5a028b2a'::uuid, 'user', NULL, 'c5f001c6-6a59-49bb-a698-a97c5a028b2a'::uuid, '2025-10-12 16:14:16.791594+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 16:14:16.791594+00'::timestamptz, '2025-10-12 16:14:16.791594+00'::timestamptz),
   ('5a511af2-af58-4126-98ae-fd218278d9eb'::uuid, 'c5f001c6-6a59-49bb-a698-a97c5a028b2a'::uuid, 'superadmin', NULL, 'c5f001c6-6a59-49bb-a698-a97c5a028b2a'::uuid, '2025-10-12 16:14:16.791594+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 16:14:16.791594+00'::timestamptz, '2025-10-12 16:14:16.791594+00'::timestamptz),
   ('c71fe454-9243-4039-a0f4-913f6538fef5'::uuid, '5df5ce7c-c9f9-4a07-b77f-2e6ea6d3e6b3'::uuid, 'admin', NULL, '5df5ce7c-c9f9-4a07-b77f-2e6ea6d3e6b3'::uuid, '2025-10-12 16:15:07.421752+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 16:15:07.421752+00'::timestamptz, '2025-10-12 16:15:07.421752+00'::timestamptz),
   ('55098df5-954a-4467-ab65-99ea9baa7065'::uuid, 'a8cb7089-39ce-4b82-9c00-e553273b9c0d'::uuid, 'manager', NULL, 'a8cb7089-39ce-4b82-9c00-e553273b9c0d'::uuid, '2025-10-12 16:15:07.512578+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 16:15:07.512578+00'::timestamptz, '2025-10-12 16:15:07.512578+00'::timestamptz),
   ('affaafe0-ca07-4338-bfed-eec527450bcb'::uuid, '42a36c24-ec8e-41c9-af04-e88b4e61a2fa'::uuid, 'user', NULL, '42a36c24-ec8e-41c9-af04-e88b4e61a2fa'::uuid, '2025-10-12 16:15:07.597589+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 16:15:07.597589+00'::timestamptz, '2025-10-12 16:15:07.597589+00'::timestamptz),
   ('ad05bb61-4ec5-4612-be3e-1109839e19ab'::uuid, '8a880a9a-0f14-4d9c-a865-374436e27ae7'::uuid, 'viewer', NULL, '8a880a9a-0f14-4d9c-a865-374436e27ae7'::uuid, '2025-10-12 16:15:07.682178+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 16:15:07.682178+00'::timestamptz, '2025-10-12 16:15:07.682178+00'::timestamptz),
   ('0d253953-06ec-4cba-a0cc-b67f3eca54cf'::uuid, 'f6f4ac3f-1cbf-4a36-b980-11b89c05feed'::uuid, 'guest', NULL, 'f6f4ac3f-1cbf-4a36-b980-11b89c05feed'::uuid, '2025-10-12 16:15:07.7649+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 16:15:07.7649+00'::timestamptz, '2025-10-12 16:15:07.7649+00'::timestamptz),
   ('e0b0d897-f3e7-45da-ae9a-e892a481836d'::uuid, 'f6f4ac3f-1cbf-4a36-b980-11b89c05feed'::uuid, 'superadmin', NULL, 'f6f4ac3f-1cbf-4a36-b980-11b89c05feed'::uuid, '2025-10-12 20:17:25.327486+00'::timestamptz, NULL, true, '{}'::jsonb, '2025-10-12 20:17:25.327486+00'::timestamptz, '2025-10-12 20:17:25.327486+00'::timestamptz);
(8 rows)

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
--------------------------------------------------------------------------------------------------------------------------------------------------------------
   ('bcbb423b-1dfb-44f9-b5b6-be56d60869b0'::uuid, 'guest', 'read', 'public_content', 'view', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('b1bbeada-0b78-428c-bd9f-ba77af0f6017'::uuid, 'viewer', 'read', 'yachts', 'view', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('c31834c2-6de9-4cd1-bc6c-f4b056fb242d'::uuid, 'viewer', 'read', 'reports', 'view', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('97064019-3707-4777-8f52-a1199a5b6e5f'::uuid, 'viewer', 'read', 'inventory', 'view', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('39a58702-cf4b-4978-b1a6-74f2b8897a8a'::uuid, 'user', 'read', 'yachts', 'view', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('180c5265-8608-413e-8b26-7858472a28c5'::uuid, 'user', 'write', 'yachts', 'update_assigned', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('3dbd972a-4827-488f-b43d-2770ce2e4f2d'::uuid, 'user', 'read', 'inventory', 'view', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('c39a24ce-cf43-4fa1-a8da-d95e86daf4a6'::uuid, 'user', 'write', 'inventory', 'update_assigned', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('01f48697-aef8-4f05-bdcf-5ba1ff6a87f5'::uuid, 'user', 'read', 'reports', 'view', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('80cca991-b8d3-4b75-96f5-8d2240cac48f'::uuid, 'user', 'write', 'reports', 'create_own', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('f81b0fe9-1acf-4415-aab9-1e770e6e2448'::uuid, 'user', 'read', 'profile', 'view_own', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('3e96e83b-188f-46ac-961b-04e427e577d5'::uuid, 'user', 'write', 'profile', 'update_own', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('dad28c68-3f75-4fed-a1a2-35150a4d34b5'::uuid, 'manager', 'read', 'yachts', 'view_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('97890694-e783-4b32-8dc6-7b443be885f3'::uuid, 'manager', 'write', 'yachts', 'update_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('0d822ee5-bcbf-4e0e-91e4-3f0b117fb616'::uuid, 'manager', 'read', 'users', 'view_team', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('5fa434bd-162f-47ec-81f0-a8b9f22c1282'::uuid, 'manager', 'write', 'users', 'manage_team', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('34b5f23b-8237-42d3-b7b1-fb82ad00bdfd'::uuid, 'manager', 'read', 'inventory', 'view_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('50a97d43-ecf6-4e39-9c09-3d591e1e8c6d'::uuid, 'manager', 'write', 'inventory', 'manage_team', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('61e60190-4317-4472-9b38-c274ffb9fd88'::uuid, 'manager', 'read', 'reports', 'view_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('a4d041c9-8ab3-4419-bbc5-7c9a42149967'::uuid, 'manager', 'write', 'reports', 'manage_team', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('d683b645-a404-48fd-97f5-dcf4c8727756'::uuid, 'manager', 'read', 'analytics', 'view_team', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('9101cad4-d1f9-4620-9d26-c77376f42153'::uuid, 'admin', 'read', 'users', 'view_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('317ddc97-b53a-4132-ba3f-8bb207ed77ba'::uuid, 'admin', 'write', 'users', 'manage_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('4cce32b1-9ea7-4483-a33b-cbda4aeedee4'::uuid, 'admin', 'delete', 'users', 'deactivate', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('28e329e4-bb54-4cc3-9744-75bf50ef4ceb'::uuid, 'admin', 'read', 'system', 'view_config', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('ccc08230-1de8-455c-b901-455cf7bfdabb'::uuid, 'admin', 'write', 'system', 'configure', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('0d8ddb19-17fa-428f-a0c3-dbfdbaecc3fa'::uuid, 'admin', 'read', 'yachts', 'view_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('7471fb38-7c63-4719-9338-5d0c3f8cdd35'::uuid, 'admin', 'write', 'yachts', 'manage_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('3b5782f8-2181-4508-a6ff-3c6beb8aad8e'::uuid, 'admin', 'delete', 'yachts', 'delete', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('2f48d77b-b909-492e-b601-c261ad165181'::uuid, 'admin', 'read', 'analytics', 'view_all', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('1c81d865-a658-464f-a9df-83c5950baa76'::uuid, 'admin', 'write', 'roles', 'assign_standard', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('3cabf888-6f5b-4844-a8a0-7ab1e6be2c14'::uuid, 'superadmin', 'admin', '*', '*', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('9ca05944-80ba-4ae4-aee3-82610e8c70fe'::uuid, 'superadmin', 'read', '*', '*', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('8897d5e4-73fb-433b-accf-b030ebd427f0'::uuid, 'superadmin', 'write', '*', '*', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz),
   ('0d62a790-b1b6-4aaa-9545-6ecf6f23d212'::uuid, 'superadmin', 'delete', '*', '*', '{}'::jsonb, '2025-10-12 16:14:16.54944+00'::timestamptz);
(35 rows)

