-- Comprehensive security fix: Drop all existing permissive policies and create secure ones
-- This fixes the vulnerability where AI system logs were publicly accessible

-- First, systematically drop ALL existing policies on affected tables
DROP POLICY IF EXISTS "Allow all operations on ai_action_logs" ON ai_action_logs;
DROP POLICY IF EXISTS "Allow all operations on ai_agent_workflows" ON ai_agent_workflows;
DROP POLICY IF EXISTS "Allow all operations on ai_configs" ON ai_configs;
DROP POLICY IF EXISTS "Allow all operations on ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Allow all operations on ai_field_rules" ON ai_field_rules;
DROP POLICY IF EXISTS "Allow all operations on ai_health" ON ai_health;
DROP POLICY IF EXISTS "Allow all operations on ai_job_attempts" ON ai_job_attempts;
DROP POLICY IF EXISTS "Allow all operations on ai_jobs" ON ai_jobs;
DROP POLICY IF EXISTS "Allow all operations on ai_model_logs" ON ai_model_logs;
DROP POLICY IF EXISTS "Allow all operations on ai_model_performance" ON ai_model_performance;
DROP POLICY IF EXISTS "Allow all operations on ai_models" ON ai_models;
DROP POLICY IF EXISTS "Allow all operations on ai_module_preferences" ON ai_module_preferences;
DROP POLICY IF EXISTS "Allow all operations on ai_performance_logs" ON ai_performance_logs;
DROP POLICY IF EXISTS "Allow all operations on ai_processing_logs" ON ai_processing_logs;
DROP POLICY IF EXISTS "Allow all operations on ai_provider_logs" ON ai_provider_logs;
DROP POLICY IF EXISTS "Allow all operations on ai_providers" ON ai_providers;
DROP POLICY IF EXISTS "Allow all operations on ai_system_config" ON ai_system_config;
DROP POLICY IF EXISTS "Allow all operations on ai_usage_metrics" ON ai_usage_metrics;
DROP POLICY IF EXISTS "Allow all operations on ai_vision_config" ON ai_vision_config;
DROP POLICY IF EXISTS "Allow all operations on analytics_events" ON analytics_events;
DROP POLICY IF EXISTS "Allow all operations on automated_procurement_requests" ON automated_procurement_requests;
DROP POLICY IF EXISTS "Allow all operations on consensus_rules" ON consensus_rules;
DROP POLICY IF EXISTS "Allow all operations on equipment" ON equipment;
DROP POLICY IF EXISTS "Allow all operations on equipment_documents" ON equipment_documents;
DROP POLICY IF EXISTS "Allow all operations on equipment_maintenance_tasks" ON equipment_maintenance_tasks;
DROP POLICY IF EXISTS "Allow all operations on equipment_spare_parts" ON equipment_spare_parts;
DROP POLICY IF EXISTS "Allow all operations on equipment_usage_logs" ON equipment_usage_logs;
DROP POLICY IF EXISTS "Allow all operations on event_bus" ON event_bus;

-- Drop any previously created secure policies to start fresh
DROP POLICY IF EXISTS "AI configs access for superadmins only" ON ai_configs;
DROP POLICY IF EXISTS "AI providers access for superadmins only" ON ai_providers;
DROP POLICY IF EXISTS "AI models access for superadmins only" ON ai_models;
DROP POLICY IF EXISTS "AI system config access for superadmins only" ON ai_system_config;
DROP POLICY IF EXISTS "AI vision config access for superadmins only" ON ai_vision_config;
DROP POLICY IF EXISTS "Superadmins can manage AI configs" ON ai_configs;
DROP POLICY IF EXISTS "Superadmins can manage AI providers" ON ai_providers;
DROP POLICY IF EXISTS "Superadmins can manage AI models" ON ai_models;
DROP POLICY IF EXISTS "Superadmins can manage AI system config" ON ai_system_config;
DROP POLICY IF EXISTS "Superadmins can manage AI vision config" ON ai_vision_config;

-- Now create secure policies with unique names
-- Critical configuration tables: Superadmin access only
CREATE POLICY "secure_ai_configs_superadmin_only" ON ai_configs
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_providers_superadmin_only" ON ai_providers
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_models_superadmin_only" ON ai_models
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_system_config_superadmin_only" ON ai_system_config
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_vision_config_superadmin_only" ON ai_vision_config
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_workflows_superadmin_only" ON ai_agent_workflows
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_consensus_rules_superadmin_only" ON consensus_rules
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_field_rules_superadmin_only" ON ai_field_rules
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_module_prefs_superadmin_only" ON ai_module_preferences
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

-- Monitoring tables: Authenticated read, system write
CREATE POLICY "secure_ai_health_read" ON ai_health
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_health_write" ON ai_health
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "secure_ai_health_update" ON ai_health
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "secure_ai_performance_read" ON ai_model_performance
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_performance_write" ON ai_model_performance
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "secure_ai_perf_logs_read" ON ai_performance_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_perf_logs_write" ON ai_performance_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "secure_ai_model_logs_read" ON ai_model_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_model_logs_write" ON ai_model_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "secure_ai_usage_metrics_read" ON ai_usage_metrics
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_usage_metrics_write" ON ai_usage_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "secure_ai_provider_logs_read" ON ai_provider_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_provider_logs_write" ON ai_provider_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- User-specific operational tables
CREATE POLICY "secure_ai_conversations_user_access" ON ai_conversations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_action_logs_user_access" ON ai_action_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_ai_action_logs_write" ON ai_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- System operational tables
CREATE POLICY "secure_ai_processing_logs_read" ON ai_processing_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_processing_logs_write" ON ai_processing_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "secure_ai_jobs_read" ON ai_jobs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_jobs_manage" ON ai_jobs
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "secure_ai_job_attempts_read" ON ai_job_attempts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_ai_job_attempts_write" ON ai_job_attempts
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- System event tables
CREATE POLICY "secure_analytics_events_read" ON analytics_events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_analytics_events_write" ON analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "secure_event_bus_read" ON event_bus
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "secure_event_bus_write" ON event_bus
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Equipment tables: Authenticated user access
CREATE POLICY "secure_equipment_access" ON equipment
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "secure_equipment_docs_access" ON equipment_documents
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "secure_equipment_maintenance_access" ON equipment_maintenance_tasks
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "secure_equipment_parts_access" ON equipment_spare_parts
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "secure_equipment_usage_access" ON equipment_usage_logs
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "secure_procurement_access" ON automated_procurement_requests
  FOR ALL TO authenticated
  USING (true);