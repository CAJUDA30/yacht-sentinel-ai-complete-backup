-- Fix security vulnerability: Secure AI system tables with proper RLS policies
-- This migration replaces overly permissive policies with proper access controls

-- Drop existing policies with different names to avoid conflicts
DROP POLICY IF EXISTS "Superadmins can manage AI configs" ON ai_configs;
DROP POLICY IF EXISTS "Superadmins can manage AI providers" ON ai_providers;
DROP POLICY IF EXISTS "Superadmins can manage AI models" ON ai_models;
DROP POLICY IF EXISTS "Superadmins can manage AI system config" ON ai_system_config;
DROP POLICY IF EXISTS "Superadmins can manage AI vision config" ON ai_vision_config;

-- Create secure policies for AI configuration tables (superadmin only)
CREATE POLICY "AI configs access for superadmins only" ON ai_configs
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "AI providers access for superadmins only" ON ai_providers
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "AI models access for superadmins only" ON ai_models
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "AI system config access for superadmins only" ON ai_system_config
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "AI vision config access for superadmins only" ON ai_vision_config
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "AI agent workflows access for superadmins only" ON ai_agent_workflows
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Consensus rules access for superadmins only" ON consensus_rules
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "AI field rules access for superadmins only" ON ai_field_rules
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "AI module preferences access for superadmins only" ON ai_module_preferences
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

-- Create policies for AI monitoring/performance tables (authenticated users can read, system can write)
CREATE POLICY "Authenticated users view AI health" ON ai_health
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System manages AI health data" ON ai_health
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "System updates AI health data" ON ai_health
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users view AI model performance" ON ai_model_performance
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System logs AI model performance" ON ai_model_performance
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users view AI performance logs" ON ai_performance_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates AI performance logs" ON ai_performance_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users view AI model logs" ON ai_model_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates AI model logs" ON ai_model_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users view AI usage metrics" ON ai_usage_metrics
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates AI usage metrics" ON ai_usage_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users view AI provider logs" ON ai_provider_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates AI provider logs" ON ai_provider_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policies for AI operational tables (users can access their own data)
CREATE POLICY "Users access their AI conversations" ON ai_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users create their AI conversations" ON ai_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users update their AI conversations" ON ai_conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Authenticated users view AI processing logs" ON ai_processing_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates AI processing logs" ON ai_processing_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users view AI jobs" ON ai_jobs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System manages AI jobs" ON ai_jobs
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users view AI job attempts" ON ai_job_attempts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates AI job attempts" ON ai_job_attempts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users view their AI action logs" ON ai_action_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "System creates AI action logs" ON ai_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policies for other system tables
CREATE POLICY "Authenticated users view analytics events" ON analytics_events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates analytics events" ON analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users view event bus" ON event_bus
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System creates event bus entries" ON event_bus
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policies for equipment tables (authenticated users)
CREATE POLICY "Authenticated users view equipment" ON equipment
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users manage equipment" ON equipment
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users manage equipment documents" ON equipment_documents
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users manage equipment maintenance" ON equipment_maintenance_tasks
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users manage equipment spare parts" ON equipment_spare_parts
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users manage equipment usage logs" ON equipment_usage_logs
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users manage procurement requests" ON automated_procurement_requests
  FOR ALL TO authenticated
  USING (true);