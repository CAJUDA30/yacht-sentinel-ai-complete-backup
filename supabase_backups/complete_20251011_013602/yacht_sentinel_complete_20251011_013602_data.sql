SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
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
	('00000000-0000-0000-0000-000000000000', 'd0afcc1d-ac7e-42c8-b8ef-1f0da428a782', '{"action":"login","actor_id":"c5f001c6-6a59-49bb-a698-a97c5a028b2a","actor_name":"Super Administrator","actor_username":"superadmin@yachtexcel.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2025-10-10 23:32:52.436071+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', 'authenticated', 'authenticated', 'superadmin@yachtexcel.com', '$2a$10$yM5qLo/DIBcD5sZc/ps3kuoLsW1LWhtOnpDByQnkA9/Smc5OJT77a', '2025-10-10 23:31:47.812442+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-10-10 23:32:52.436397+00', '{"role": "global_superadmin", "roles": ["superadmin"], "provider": "email", "providers": ["email"], "is_superadmin": true}', '{"role": "global_superadmin", "full_name": "Super Administrator", "is_superadmin": true, "email_verified": true}', NULL, '2025-10-10 23:31:47.807944+00', '2025-10-10 23:32:52.43793+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('c5f001c6-6a59-49bb-a698-a97c5a028b2a', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', '{"sub": "c5f001c6-6a59-49bb-a698-a97c5a028b2a", "email": "superadmin@yachtexcel.com", "email_verified": false, "phone_verified": false}', 'email', '2025-10-10 23:31:47.80937+00', '2025-10-10 23:31:47.809386+00', '2025-10-10 23:31:47.809386+00', '69b1be62-fe9c-4a57-8a16-ea8002dea933');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('bea2df69-50ec-4f4c-8146-85060c18c23d', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', '2025-10-10 23:32:52.436424+00', '2025-10-10 23:32:52.436424+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '142.250.184.10', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('bea2df69-50ec-4f4c-8146-85060c18c23d', '2025-10-10 23:32:52.438393+00', '2025-10-10 23:32:52.438393+00', 'password', '1839cd98-8c64-41db-a9c2-851cfcbb966c');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'oefqhl7bbpdp', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a', false, '2025-10-10 23:32:52.437073+00', '2025-10-10 23:32:52.437073+00', NULL, 'bea2df69-50ec-4f4c-8146-85060c18c23d');


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
	('7093858e-e746-466f-ac50-cb0dbca0c89f', 'DeepSeek', 'https://api.deepseek.com', 'https://api.deepseek.com/v1', 'bearer', 'Authorization', NULL, 'https://api.deepseek.com/v1/models', NULL, 'DeepSeek AI models', '{}', '{}', true, '2025-10-10 23:29:54.844685+00', '2025-10-10 23:29:54.860183+00', 'api_key', 'deepseek', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00),
	('0adc214b-6ba1-474b-9053-a1d4a17b5071', 'schema_test_1760139148837', NULL, NULL, 'bearer', 'Authorization', NULL, NULL, NULL, NULL, '{}', '{"test": true}', true, '2025-10-10 23:32:28.847299+00', '2025-10-10 23:32:28.847299+00', 'api_key', 'test', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00),
	('829a6dc7-8a1d-4b44-890e-f9975d871cf6', 'schema_test_1760139148860', NULL, NULL, 'bearer', 'Authorization', NULL, NULL, NULL, NULL, '{}', '{"test": true}', true, '2025-10-10 23:32:28.860908+00', '2025-10-10 23:32:28.860908+00', 'api_key', 'test', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00),
	('8b58cd5c-44c0-4865-8bf9-00a8df8acc14', 'schema_test_1760139180105', NULL, NULL, 'bearer', 'Authorization', NULL, NULL, NULL, NULL, '{}', '{"test": true}', true, '2025-10-10 23:33:00.109596+00', '2025-10-10 23:33:00.109596+00', 'api_key', 'test', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00),
	('07eb2882-ac6a-4cc1-91f5-e2a609c6b459', 'schema_test_1760139180113', NULL, NULL, 'bearer', 'Authorization', NULL, NULL, NULL, NULL, '{}', '{"test": true}', true, '2025-10-10 23:33:00.114293+00', '2025-10-10 23:33:00.114293+00', 'api_key', 'test', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00),
	('0846d4a7-da23-4179-bdd8-bf260be53f25', 'schema_test_1760139347817', NULL, NULL, 'bearer', 'Authorization', NULL, NULL, NULL, NULL, '{}', '{"test": true}', true, '2025-10-10 23:35:47.826689+00', '2025-10-10 23:35:47.826689+00', 'api_key', 'test', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00),
	('58867dbe-0c18-48ec-8f71-1167f46dd55f', 'schema_test_1760139347826', NULL, NULL, 'bearer', 'Authorization', NULL, NULL, NULL, NULL, '{}', '{"test": true}', true, '2025-10-10 23:35:47.82763+00', '2025-10-10 23:35:47.82763+00', 'api_key', 'test', 1, false, 60, '{en}', NULL, 'unknown', 0, 100.00);


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

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
