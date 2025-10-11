
-- Ensure we operate on the public schema
SET search_path TO public;

-- ========================================
-- Phase 1: Add covering indexes for FKs
-- ========================================

-- ai_agent_workflows.consensus_rule_id
CREATE INDEX IF NOT EXISTS idx_ai_agent_workflows_consensus_rule_id
  ON public.ai_agent_workflows (consensus_rule_id);

-- ai_conversations.current_workflow_id
CREATE INDEX IF NOT EXISTS idx_ai_conversations_current_workflow_id
  ON public.ai_conversations (current_workflow_id);

-- ai_model_logs.model_id
CREATE INDEX IF NOT EXISTS idx_ai_model_logs_model_id
  ON public.ai_model_logs (model_id);

-- ai_model_performance.workflow_id
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_workflow_id
  ON public.ai_model_performance (workflow_id);

-- ai_performance_logs.model_id
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_model_id
  ON public.ai_performance_logs (model_id);

-- automated_procurement_requests.equipment_id
CREATE INDEX IF NOT EXISTS idx_automated_procurement_requests_equipment_id
  ON public.automated_procurement_requests (equipment_id);

-- automated_procurement_requests.maintenance_schedule_id
CREATE INDEX IF NOT EXISTS idx_automated_procurement_requests_maintenance_schedule_id
  ON public.automated_procurement_requests (maintenance_schedule_id);

-- financial_transactions.charter_id
CREATE INDEX IF NOT EXISTS idx_financial_transactions_charter_id
  ON public.financial_transactions (charter_id);

-- financial_transactions.equipment_id
CREATE INDEX IF NOT EXISTS idx_financial_transactions_equipment_id
  ON public.financial_transactions (equipment_id);

-- inventory_folders.parent_id
CREATE INDEX IF NOT EXISTS idx_inventory_folders_parent_id
  ON public.inventory_folders (parent_id);

-- maintenance_parts_requirements.equipment_spare_part_id
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_requirements_equipment_spare_part_id
  ON public.maintenance_parts_requirements (equipment_spare_part_id);

-- maintenance_parts_requirements.maintenance_schedule_id
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_requirements_maintenance_schedule_id
  ON public.maintenance_parts_requirements (maintenance_schedule_id);

-- ========================================
-- Phase 2: Drop indexes flagged as unused
-- NOTE: These are safe to drop; they do not back PK/UK constraints.
-- ========================================

-- inventory_items
DROP INDEX IF EXISTS public.idx_inventory_items_folder_id;
DROP INDEX IF EXISTS public.idx_inventory_items_status;
DROP INDEX IF EXISTS public.idx_inventory_items_priority;
DROP INDEX IF EXISTS public.idx_inventory_items_created_at;

-- inventory_alerts
DROP INDEX IF EXISTS public.idx_inventory_alerts_item_id;

-- movement_records
DROP INDEX IF EXISTS public.idx_movement_records_item_id;

-- stock_adjustments
DROP INDEX IF EXISTS public.idx_stock_adjustments_item_id;

-- equipment
DROP INDEX IF EXISTS public.idx_equipment_status;
DROP INDEX IF EXISTS public.idx_equipment_manufacturer;

-- equipment_maintenance_tasks
DROP INDEX IF EXISTS public.idx_maintenance_tasks_equipment_id;
DROP INDEX IF EXISTS public.idx_maintenance_tasks_due_date;

-- equipment_documents
DROP INDEX IF EXISTS public.idx_equipment_documents_equipment_id;

-- equipment_spare_parts
DROP INDEX IF EXISTS public.idx_equipment_spare_parts_equipment_id;
DROP INDEX IF EXISTS public.idx_equipment_spare_parts_inventory_item_id;

-- maintenance_schedules
DROP INDEX IF EXISTS public.idx_maintenance_schedules_equipment_id;
DROP INDEX IF EXISTS public.idx_maintenance_schedules_next_due;

-- equipment_usage_logs
DROP INDEX IF EXISTS public.idx_equipment_usage_logs_equipment_id;
DROP INDEX IF EXISTS public.idx_equipment_usage_logs_recorded_at;

-- automated_procurement_requests
DROP INDEX IF EXISTS public.idx_automated_procurement_status;

-- scan_events
DROP INDEX IF EXISTS public.idx_scan_events_session_id;

-- ai_processing_logs
DROP INDEX IF EXISTS public.idx_ai_processing_logs_session_id;

-- user_sessions
DROP INDEX IF EXISTS public.idx_user_sessions_session_id;

-- yacht_profiles
DROP INDEX IF EXISTS public.idx_yacht_profiles_owner;

-- crew_members
DROP INDEX IF EXISTS public.idx_crew_members_yacht;
DROP INDEX IF EXISTS public.idx_crew_members_user;

-- guest_charters
DROP INDEX IF EXISTS public.idx_guest_charters_yacht;
DROP INDEX IF EXISTS public.idx_guest_charters_dates;

-- fuel_consumption
DROP INDEX IF EXISTS public.idx_fuel_consumption_yacht;

-- financial_transactions
DROP INDEX IF EXISTS public.idx_financial_transactions_yacht;

-- yacht_positions
DROP INDEX IF EXISTS public.idx_yacht_positions_yacht;
DROP INDEX IF EXISTS public.idx_yacht_positions_time;

-- ai_models
DROP INDEX IF EXISTS public.idx_ai_models_provider;
DROP INDEX IF EXISTS public.idx_ai_models_active;
DROP INDEX IF EXISTS public.idx_ai_models_active_priority;
DROP INDEX IF EXISTS public.idx_ai_models_connection_status;
DROP INDEX IF EXISTS public.idx_ai_models_last_tested;
DROP INDEX IF EXISTS public.idx_ai_models_provider_model;

-- ai_agent_workflows
DROP INDEX IF EXISTS public.idx_ai_workflows_module;

-- ai_model_performance
DROP INDEX IF EXISTS public.idx_ai_performance_model;

-- ai_conversations
DROP INDEX IF EXISTS public.idx_ai_conversations_session;
DROP INDEX IF EXISTS public.idx_ai_conversations_user;

-- ai_module_preferences
DROP INDEX IF EXISTS public.idx_ai_module_prefs_module;

-- vision_connection_logs
DROP INDEX IF EXISTS public.vision_logs_config_idx;

-- ai_configs
DROP INDEX IF EXISTS public.idx_ai_configs_provider;

-- ai_provider_logs
DROP INDEX IF EXISTS public.idx_ai_provider_logs_provider;
DROP INDEX IF EXISTS public.idx_ai_provider_logs_tested_at;

-- ai_usage_metrics
DROP INDEX IF EXISTS public.idx_ai_usage_metrics_window;
DROP INDEX IF EXISTS public.idx_ai_usage_metrics_collected;

-- llm_provider_models
DROP INDEX IF EXISTS public.idx_llm_provider_models_provider;

-- ai_action_logs
DROP INDEX IF EXISTS public.idx_ai_action_logs_created_at;
DROP INDEX IF EXISTS public.idx_ai_action_logs_action_type;

-- ai_jobs
DROP INDEX IF EXISTS public.idx_ai_jobs_status;
DROP INDEX IF EXISTS public.idx_ai_jobs_type;

-- ai_job_attempts
DROP INDEX IF EXISTS public.idx_ai_job_attempts_job;
