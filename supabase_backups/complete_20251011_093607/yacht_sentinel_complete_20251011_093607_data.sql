SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '648be8bd-5836-42f0-b632-c44eb43b3768', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"superadmin@yachtexcel.com","user_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","user_phone":""}}', '2025-10-10 23:31:47.809835+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd0afcc1d-ac7e-42c8-b8ef-1f0da428a782', '{"action":"login","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 23:32:52.436071+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e707cad1-20b1-43e4-9dd0-3308ccdf5eb7', '{"action":"logout","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account"}', '2025-10-10 23:36:03.409298+00', ''),
	('00000000-0000-0000-0000-000000000000', '918d199b-53e5-46d9-91cf-b60a8a5c2507', '{"action":"login","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-11 00:03:15.985274+00', ''),
	('00000000-0000-0000-0000-000000000000', '0b5571d4-3e23-48c6-ad3a-511949323364', '{"action":"logout","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account"}', '2025-10-11 00:04:30.22535+00', ''),
	('00000000-0000-0000-0000-000000000000', '4e2a7eef-76c4-45cd-ae8d-6d93cb3e959e', '{"action":"login","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-11 00:04:37.18504+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aaf2be55-51b5-48ad-81a9-7108af9179c6', '{"action":"logout","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account"}', '2025-10-11 00:07:50.140626+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e0b67d6f-a121-41fa-bd8d-92b38bc04e4d', '{"action":"login","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-11 00:07:59.720403+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b423624e-da37-43f7-a13f-ffcff77a81e9', '{"action":"login","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-11 00:19:00.229553+00', ''),
	('00000000-0000-0000-0000-000000000000', '97b888de-7234-4e66-801a-43ec6068a950', '{"action":"login","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-11 00:53:39.034634+00', ''),
	('00000000-0000-0000-0000-000000000000', '7b9903b6-2917-4c5c-b7d5-1a381dd3f34d', '{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"superadmin@yachtexcel.com","user_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","user_phone":""}}', '2025-10-11 00:53:45.796443+00', ''),
	('00000000-0000-0000-0000-000000000000', '9eaf38fe-4906-4cb4-8938-a0ed102e0f37', '{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"superadmin@yachtexcel.com","user_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","user_phone":""}}', '2025-10-11 00:53:45.799134+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fee9aef4-3a56-4260-80a1-e74dd5ba0a85', '{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"superadmin@yachtexcel.com","user_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","user_phone":""}}', '2025-10-11 00:54:12.258766+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f5f6eac-7721-4fa2-8af7-6b0519c31117', '{"action":"user_modified","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"user","traits":{"user_email":"superadmin@yachtexcel.com","user_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","user_phone":""}}', '2025-10-11 00:54:12.25955+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bd613f5e-fb97-4a94-b72b-ab5583c6c15b', '{"action":"token_refreshed","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 01:52:28.386+00', ''),
	('00000000-0000-0000-0000-000000000000', '4ca04007-2f2c-4c8c-a5c6-124109351869', '{"action":"token_revoked","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 01:52:28.386757+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd9f8e3a9-63dd-4493-b053-4ca8fd9eb71e', '{"action":"token_refreshed","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 02:51:28.288151+00', ''),
	('00000000-0000-0000-0000-000000000000', '3c42c66f-317d-4229-a74f-0a3312ada8ad', '{"action":"token_revoked","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 02:51:28.288668+00', ''),
	('00000000-0000-0000-0000-000000000000', '3d2d9d66-3eb9-4723-97ae-9dd39a7a21c7', '{"action":"token_refreshed","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 03:50:28.311688+00', ''),
	('00000000-0000-0000-0000-000000000000', '416d1182-461e-4ae8-bf14-305326eac71e', '{"action":"token_revoked","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 03:50:28.312461+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ed895608-8237-4e97-b380-71fcb77651f6', '{"action":"token_refreshed","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 04:49:28.333205+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd4f40112-af66-4f36-96df-3dee4db4e5a1', '{"action":"token_revoked","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 04:49:28.333685+00', ''),
	('00000000-0000-0000-0000-000000000000', '149e32c7-4a39-4b99-9623-f21b0f1524c2', '{"action":"token_refreshed","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 05:48:28.356089+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e05ff488-7acb-4527-b936-7a9e47fe5947', '{"action":"token_revoked","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 05:48:28.356527+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de37c708-5f03-4cfb-b664-dbfeb3dbfc6c', '{"action":"token_refreshed","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 06:47:28.378925+00', ''),
	('00000000-0000-0000-0000-000000000000', '6d593221-902f-412e-9e41-0d5b6f8b867e', '{"action":"token_revoked","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"token"}', '2025-10-11 06:47:28.379384+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', 'authenticated', 'authenticated', 'superadmin@yachtexcel.com', '$2a$10$yM5qLo/DIBcD5sZc/ps3kuoLsW1LWhtOnpDByQnkA9/Smc5OJT77a', '2025-10-10 23:31:47.812442+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-10-11 00:53:39.036238+00', '{"role": "global_superadmin", "roles": ["superadmin"], "provider": "email", "providers": ["email"], "is_superadmin": true}', '{"role": "global_superadmin", "full_name": "Super Administrator", "is_superadmin": true, "email_verified": true}', NULL, '2025-10-10 23:31:47.807944+00', '2025-10-11 06:47:28.380401+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('c5f001c6-6a59-49bb-a698-a97c5a028b2a', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', '{"sub": "c5f001c6-6a59-49bb-a698-a97c5a028b2a", "email": "superadmin@yachtexcel.com", "email_verified": false, "phone_verified": false}', 'email', '2025-10-10 23:31:47.80937+00', '2025-10-10 23:31:47.809386+00', '2025-10-10 23:31:47.809386+00', '69b1be62-fe9c-4a57-8a16-ea8002dea933');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id") VALUES
	('68d353b8-86ee-4e83-9034-b0e67c73d593', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', '2025-10-11 00:07:59.720948+00', '2025-10-11 00:07:59.720948+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '142.250.184.10', NULL, NULL),
	('4bc1103d-01af-45c8-a749-f356bc0e39e3', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', '2025-10-11 00:19:00.22996+00', '2025-10-11 00:19:00.22996+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '142.250.184.10', NULL, NULL),
	('f760dd1f-078e-4ba5-8f24-8f569ca87c63', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', '2025-10-11 00:53:39.036277+00', '2025-10-11 06:47:28.380917+00', NULL, 'aal1', NULL, '2025-10-11 06:47:28.380879', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '172.217.168.170', NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('68d353b8-86ee-4e83-9034-b0e67c73d593', '2025-10-11 00:07:59.721842+00', '2025-10-11 00:07:59.721842+00', 'password', '2c2e5003-7528-4bff-9146-83bb48e22084'),
	('4bc1103d-01af-45c8-a749-f356bc0e39e3', '2025-10-11 00:19:00.230886+00', '2025-10-11 00:19:00.230886+00', 'password', 'f01a49d1-8085-4ba1-8f54-4d29a407952c'),
	('f760dd1f-078e-4ba5-8f24-8f569ca87c63', '2025-10-11 00:53:39.037856+00', '2025-10-11 00:53:39.037856+00', 'password', '1447428f-1b75-4d15-8a92-d7f904ba456e');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 4, 'x7gp5nzhr67b', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', false, '2025-10-11 00:07:59.721367+00', '2025-10-11 00:07:59.721367+00', NULL, '68d353b8-86ee-4e83-9034-b0e67c73d593'),
	('00000000-0000-0000-0000-000000000000', 5, 'tspul6irue3l', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', false, '2025-10-11 00:19:00.230358+00', '2025-10-11 00:19:00.230358+00', NULL, '4bc1103d-01af-45c8-a749-f356bc0e39e3'),
	('00000000-0000-0000-0000-000000000000', 6, 'bw5vbnov4q7i', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', true, '2025-10-11 00:53:39.036957+00', '2025-10-11 01:52:28.387464+00', NULL, 'f760dd1f-078e-4ba5-8f24-8f569ca87c63'),
	('00000000-0000-0000-0000-000000000000', 7, 'inxjurnvseq6', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', true, '2025-10-11 01:52:28.388216+00', '2025-10-11 02:51:28.2892+00', 'bw5vbnov4q7i', 'f760dd1f-078e-4ba5-8f24-8f569ca87c63'),
	('00000000-0000-0000-0000-000000000000', 8, 'w2xz7m3uxjqs', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', true, '2025-10-11 02:51:28.289418+00', '2025-10-11 03:50:28.313238+00', 'inxjurnvseq6', 'f760dd1f-078e-4ba5-8f24-8f569ca87c63'),
	('00000000-0000-0000-0000-000000000000', 9, 'juq3aesz4zqt', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', true, '2025-10-11 03:50:28.313714+00', '2025-10-11 04:49:28.334056+00', 'w2xz7m3uxjqs', 'f760dd1f-078e-4ba5-8f24-8f569ca87c63'),
	('00000000-0000-0000-0000-000000000000', 10, 'azfudj7662bs', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', true, '2025-10-11 04:49:28.334254+00', '2025-10-11 05:48:28.357072+00', 'juq3aesz4zqt', 'f760dd1f-078e-4ba5-8f24-8f569ca87c63'),
	('00000000-0000-0000-0000-000000000000', 11, 'wjfhi2kmaofu', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', true, '2025-10-11 05:48:28.357329+00', '2025-10-11 06:47:28.379762+00', 'azfudj7662bs', 'f760dd1f-078e-4ba5-8f24-8f569ca87c63'),
	('00000000-0000-0000-0000-000000000000', 12, 'o6dj73lqsb4o', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', false, '2025-10-11 06:47:28.379963+00', '2025-10-11 06:47:28.379963+00', 'wjfhi2kmaofu', 'f760dd1f-078e-4ba5-8f24-8f569ca87c63');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: ai_providers_unified; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ai_providers_unified" ("id", "name", "base_url", "api_endpoint", "auth_type", "auth_header_name", "api_secret_name", "models_endpoint", "discovery_url", "description", "capabilities", "config", "is_active", "created_at", "updated_at", "auth_method", "provider_type", "priority", "is_primary", "rate_limit_per_minute", "supported_languages", "last_health_check", "health_status", "error_count", "success_rate") VALUES
	('1a95b045-b229-41d2-8f5a-c5230eda8a47', 'OpenAI', 'https://api.openai.com', 'https://api.openai.com/v1', 'bearer', 'Authorization', NULL, 'https://api.openai.com/v1/models', NULL, 'OpenAI GPT models', '{}', '{}', true, '2025-10-10 23:29:54.844685+00', '2025-10-10 23:29:54.860183+00', 'api_key', 'openai', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00),
	('fbb73489-2e39-4053-9972-c551e84681b4', 'Google Gemini', 'https://generativelanguage.googleapis.com', 'https://generativelanguage.googleapis.com/v1beta', 'bearer', 'Authorization', NULL, NULL, NULL, 'Google Gemini AI models', '{}', '{}', true, '2025-10-10 23:29:54.844685+00', '2025-10-10 23:29:54.860183+00', 'api_key', 'google', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00),
	('7093858e-e746-466f-ac50-cb0dbca0c89f', 'DeepSeek', 'https://api.deepseek.com', 'https://api.deepseek.com/v1', 'bearer', 'Authorization', NULL, 'https://api.deepseek.com/v1/models', NULL, 'DeepSeek AI models', '{}', '{}', true, '2025-10-10 23:29:54.844685+00', '2025-10-10 23:29:54.860183+00', 'api_key', 'deepseek', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00);


--
-- Data for Name: ai_health; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_models_unified; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ai_models_unified" ("id", "created_at", "updated_at", "name", "display_name", "provider_id", "model_type", "is_active", "max_tokens", "input_cost_per_token", "output_cost_per_token", "config", "capabilities", "priority", "description") VALUES
	('9a7d8042-cd70-4e83-b52e-9e0e5ad911a4', '2025-10-10 23:29:54.86319+00', '2025-10-10 23:29:54.86319+00', 'gpt-4o', 'GPT-4o (Latest)', '1a95b045-b229-41d2-8f5a-c5230eda8a47', 'text', true, 128000, NULL, NULL, '{}', '{}', 1, 'OpenAI GPT-4o - Latest multimodal model'),
	('67d66a62-eb1c-46f6-a859-d01ef6a6764d', '2025-10-10 23:29:54.86319+00', '2025-10-10 23:29:54.86319+00', 'gemini-1.5-pro-002', 'Gemini 1.5 Pro', 'fbb73489-2e39-4053-9972-c551e84681b4', 'text', true, 2097152, NULL, NULL, '{}', '{}', 1, 'Google Gemini 1.5 Pro - Large context window'),
	('9d05cad3-fb9d-4598-9bca-6f722d1c07ab', '2025-10-10 23:29:54.86319+00', '2025-10-10 23:29:54.86319+00', 'deepseek-chat', 'DeepSeek Chat', '7093858e-e746-466f-ac50-cb0dbca0c89f', 'text', true, 32768, NULL, NULL, '{}', '{}', 1, 'DeepSeek Chat - Efficient reasoning model');


--
-- Data for Name: ai_provider_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ai_system_config; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: audit_workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: edge_function_health; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: edge_function_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_bus; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: llm_provider_models; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."system_settings" ("id", "key", "value", "description", "category", "is_public", "created_at", "updated_at") VALUES
	('7f34f905-0525-4737-97b3-0d735b2c5714', 'system.maintenance', 'false', 'System maintenance mode flag', 'system', false, '2025-10-10 23:29:54.834066+00', '2025-10-10 23:29:54.834066+00'),
	('c3e5d29f-ee13-481e-8316-0a896ec8bde0', 'system.registration', 'true', 'User registration enabled flag', 'system', false, '2025-10-10 23:29:54.834066+00', '2025-10-10 23:29:54.834066+00'),
	('79ba34e8-1a43-47ee-88f4-f304b77313a4', 'system.maxFileSize', '10485760', 'Maximum file upload size in bytes (10MB)', 'system', false, '2025-10-10 23:29:54.834066+00', '2025-10-10 23:29:54.834066+00');


--
-- Data for Name: unified_ai_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_roles" ("id", "user_id", "role", "created_at", "updated_at") VALUES
	('2902a775-d25b-4394-96b5-9eb9ee0d21a1', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', 'superadmin', '2025-10-10 23:31:47.80777+00', '2025-10-10 23:31:47.83566+00');


--
-- Data for Name: yachts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: yacht_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 12, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
