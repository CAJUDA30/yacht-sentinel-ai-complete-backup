DROP POLICY IF EXISTS "Authenticated insert access" ON public.ai_health;
CREATE POLICY "Authenticated insert access" ON public.ai_health
FOR INSERT TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated read access" ON public.ai_health;
CREATE POLICY "Authenticated read access" ON public.ai_health
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Authenticated update access" ON public.ai_health;
CREATE POLICY "Authenticated update access" ON public.ai_health
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Service role full access" ON public.ai_health;
CREATE POLICY "Service role full access" ON public.ai_health
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin delete access" ON public.ai_health;
CREATE POLICY "Superadmin delete access" ON public.ai_health
FOR DELETE TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_health;
CREATE POLICY "Superadmin full access" ON public.ai_health
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.ai_models_unified;
CREATE POLICY "Authenticated read access" ON public.ai_models_unified
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Authenticated update access" ON public.ai_models_unified;
CREATE POLICY "Authenticated update access" ON public.ai_models_unified
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated write access" ON public.ai_models_unified;
CREATE POLICY "Authenticated write access" ON public.ai_models_unified
FOR INSERT TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Service role full access" ON public.ai_models_unified;
CREATE POLICY "Service role full access" ON public.ai_models_unified
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin delete access" ON public.ai_models_unified;
CREATE POLICY "Superadmin delete access" ON public.ai_models_unified
FOR DELETE TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_models_unified;
CREATE POLICY "Superadmin full access" ON public.ai_models_unified
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.ai_provider_logs;
CREATE POLICY "Authenticated read access" ON public.ai_provider_logs
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Service role full access" ON public.ai_provider_logs;
CREATE POLICY "Service role full access" ON public.ai_provider_logs
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_provider_logs;
CREATE POLICY "Superadmin full access" ON public.ai_provider_logs
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "authenticated_insert_access_ai_providers" ON public.ai_providers_unified;
CREATE POLICY "authenticated_insert_access_ai_providers" ON public.ai_providers_unified
FOR INSERT TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "authenticated_read_access_ai_providers" ON public.ai_providers_unified;
CREATE POLICY "authenticated_read_access_ai_providers" ON public.ai_providers_unified
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "authenticated_update_access_ai_providers" ON public.ai_providers_unified;
CREATE POLICY "authenticated_update_access_ai_providers" ON public.ai_providers_unified
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "service_role_full_access_ai_providers" ON public.ai_providers_unified;
CREATE POLICY "service_role_full_access_ai_providers" ON public.ai_providers_unified
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "superadmin_full_access_ai_providers" ON public.ai_providers_unified;
CREATE POLICY "superadmin_full_access_ai_providers" ON public.ai_providers_unified
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.ai_system_config;
CREATE POLICY "Authenticated read access" ON public.ai_system_config
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Authenticated update access" ON public.ai_system_config;
CREATE POLICY "Authenticated update access" ON public.ai_system_config
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated write access" ON public.ai_system_config;
CREATE POLICY "Authenticated write access" ON public.ai_system_config
FOR INSERT TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Service role full access" ON public.ai_system_config;
CREATE POLICY "Service role full access" ON public.ai_system_config
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin delete access" ON public.ai_system_config;
CREATE POLICY "Superadmin delete access" ON public.ai_system_config
FOR DELETE TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_system_config;
CREATE POLICY "Superadmin full access" ON public.ai_system_config
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.analytics_events;
CREATE POLICY "Authenticated read access" ON public.analytics_events
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Service role full access" ON public.analytics_events;
CREATE POLICY "Service role full access" ON public.analytics_events
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.analytics_events;
CREATE POLICY "Superadmin full access" ON public.analytics_events
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.audit_workflows;
CREATE POLICY "Authenticated read access" ON public.audit_workflows
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Authenticated update access" ON public.audit_workflows;
CREATE POLICY "Authenticated update access" ON public.audit_workflows
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated write access" ON public.audit_workflows;
CREATE POLICY "Authenticated write access" ON public.audit_workflows
FOR INSERT TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Service role full access" ON public.audit_workflows;
CREATE POLICY "Service role full access" ON public.audit_workflows
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin delete access" ON public.audit_workflows;
CREATE POLICY "Superadmin delete access" ON public.audit_workflows
FOR DELETE TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Superadmin full access" ON public.audit_workflows;
CREATE POLICY "Superadmin full access" ON public.audit_workflows
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.edge_function_health;
CREATE POLICY "Authenticated read access" ON public.edge_function_health
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Service role full access" ON public.edge_function_health;
CREATE POLICY "Service role full access" ON public.edge_function_health
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.edge_function_health;
CREATE POLICY "Superadmin full access" ON public.edge_function_health
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.edge_function_settings;
CREATE POLICY "Authenticated read access" ON public.edge_function_settings
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Service role full access" ON public.edge_function_settings;
CREATE POLICY "Service role full access" ON public.edge_function_settings
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.edge_function_settings;
CREATE POLICY "Superadmin full access" ON public.edge_function_settings
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.event_bus;
CREATE POLICY "Authenticated read access" ON public.event_bus
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Service role full access" ON public.event_bus;
CREATE POLICY "Service role full access" ON public.event_bus
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.event_bus;
CREATE POLICY "Superadmin full access" ON public.event_bus
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.inventory_items;
CREATE POLICY "Authenticated read access" ON public.inventory_items
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Authenticated update access" ON public.inventory_items;
CREATE POLICY "Authenticated update access" ON public.inventory_items
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated write access" ON public.inventory_items;
CREATE POLICY "Authenticated write access" ON public.inventory_items
FOR INSERT TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Service role full access" ON public.inventory_items;
CREATE POLICY "Service role full access" ON public.inventory_items
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.inventory_items;
CREATE POLICY "Superadmin full access" ON public.inventory_items
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Yacht owner and superadmin delete access" ON public.inventory_items;
CREATE POLICY "Yacht owner and superadmin delete access" ON public.inventory_items
FOR DELETE TO authenticated
USING (((yacht_id IN ( SELECT yachts.id
   FROM yachts
  WHERE (yachts.owner_id = auth.uid()))) OR (auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.llm_provider_models;
CREATE POLICY "Authenticated read access" ON public.llm_provider_models
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Service role full access" ON public.llm_provider_models;
CREATE POLICY "Service role full access" ON public.llm_provider_models
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.llm_provider_models;
CREATE POLICY "Superadmin full access" ON public.llm_provider_models
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated delete access" ON public.system_settings;
CREATE POLICY "Authenticated delete access" ON public.system_settings
FOR DELETE TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.system_settings;
CREATE POLICY "Authenticated read access" ON public.system_settings
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Authenticated update access" ON public.system_settings;
CREATE POLICY "Authenticated update access" ON public.system_settings
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated write access" ON public.system_settings;
CREATE POLICY "Authenticated write access" ON public.system_settings
FOR INSERT TO authenticated
WITH CHECK (true);


DROP POLICY IF EXISTS "Service role full access" ON public.system_settings;
CREATE POLICY "Service role full access" ON public.system_settings
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.system_settings;
CREATE POLICY "Superadmin full access" ON public.system_settings
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.unified_ai_configs;
CREATE POLICY "Authenticated read access" ON public.unified_ai_configs
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Service role full access" ON public.unified_ai_configs;
CREATE POLICY "Service role full access" ON public.unified_ai_configs
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.unified_ai_configs;
CREATE POLICY "Superadmin full access" ON public.unified_ai_configs
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated users access" ON public.user_roles;
CREATE POLICY "Authenticated users access" ON public.user_roles
FOR ALL TO authenticated
USING (((auth.uid() = user_id) OR (auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))))
WITH CHECK (((auth.uid() = user_id) OR (auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))));


DROP POLICY IF EXISTS "Service role full access" ON public.user_roles;
CREATE POLICY "Service role full access" ON public.user_roles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Authenticated read access" ON public.yacht_profiles;
CREATE POLICY "Authenticated read access" ON public.yacht_profiles
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Owner full access" ON public.yacht_profiles;
CREATE POLICY "Owner full access" ON public.yacht_profiles
FOR ALL TO authenticated
USING ((auth.uid() = owner_id))
WITH CHECK ((auth.uid() = owner_id));


DROP POLICY IF EXISTS "Service role full access" ON public.yacht_profiles;
CREATE POLICY "Service role full access" ON public.yacht_profiles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.yacht_profiles;
CREATE POLICY "Superadmin full access" ON public.yacht_profiles
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


DROP POLICY IF EXISTS "Authenticated read access" ON public.yachts;
CREATE POLICY "Authenticated read access" ON public.yachts
FOR SELECT TO authenticated
USING (true);


DROP POLICY IF EXISTS "Owner full access" ON public.yachts;
CREATE POLICY "Owner full access" ON public.yachts
FOR ALL TO authenticated
USING ((auth.uid() = owner_id))
WITH CHECK ((auth.uid() = owner_id));


DROP POLICY IF EXISTS "Service role full access" ON public.yachts;
CREATE POLICY "Service role full access" ON public.yachts
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


DROP POLICY IF EXISTS "Superadmin full access" ON public.yachts;
CREATE POLICY "Superadmin full access" ON public.yachts
FOR ALL TO authenticated
USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))))
WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


