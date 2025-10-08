-- Fix security vulnerability: Secure AI system tables with proper RLS policies
-- This migration replaces overly permissive "Allow all operations" policies with proper access controls

-- First, drop all existing overly permissive policies on AI tables
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

-- Create secure policies for AI configuration tables (superadmin only)
CREATE POLICY "Superadmins can manage AI configs" ON ai_configs
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI providers" ON ai_providers
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI models" ON ai_models
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI system config" ON ai_system_config
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI vision config" ON ai_vision_config
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI agent workflows" ON ai_agent_workflows
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage consensus rules" ON consensus_rules
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI field rules" ON ai_field_rules
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can manage AI module preferences" ON ai_module_preferences
  FOR ALL TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

-- Create policies for AI monitoring/performance tables (authenticated users can read, superadmins can write)
CREATE POLICY "Authenticated users can view AI health" ON ai_health
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Superadmins can manage AI health" ON ai_health
  FOR INSERT TO authenticated
  WITH CHECK (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Superadmins can update AI health" ON ai_health
  FOR UPDATE TO authenticated
  USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Authenticated users can view AI model performance" ON ai_model_performance
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can log AI model performance" ON ai_model_performance
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view AI performance logs" ON ai_performance_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create AI performance logs" ON ai_performance_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view AI model logs" ON ai_model_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create AI model logs" ON ai_model_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view AI usage metrics" ON ai_usage_metrics
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create AI usage metrics" ON ai_usage_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view AI provider logs" ON ai_provider_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create AI provider logs" ON ai_provider_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policies for AI operational tables (authenticated users can access their own data)
CREATE POLICY "Users can view their AI conversations" ON ai_conversations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users can create their AI conversations" ON ai_conversations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users can update their AI conversations" ON ai_conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Authenticated users can view AI processing logs" ON ai_processing_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create AI processing logs" ON ai_processing_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view AI jobs" ON ai_jobs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can manage AI jobs" ON ai_jobs
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view AI job attempts" ON ai_job_attempts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create AI job attempts" ON ai_job_attempts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their AI action logs" ON ai_action_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "System can create AI action logs" ON ai_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policies for other system tables
CREATE POLICY "Authenticated users can view analytics events" ON analytics_events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create analytics events" ON analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view event bus" ON event_bus
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can create event bus entries" ON event_bus
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create policies for equipment tables (authenticated users)
CREATE POLICY "Authenticated users can view equipment" ON equipment
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage equipment" ON equipment
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage equipment documents" ON equipment_documents
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage equipment maintenance tasks" ON equipment_maintenance_tasks
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage equipment spare parts" ON equipment_spare_parts
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage equipment usage logs" ON equipment_usage_logs
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage procurement requests" ON automated_procurement_requests
  FOR ALL TO authenticated
  USING (true);