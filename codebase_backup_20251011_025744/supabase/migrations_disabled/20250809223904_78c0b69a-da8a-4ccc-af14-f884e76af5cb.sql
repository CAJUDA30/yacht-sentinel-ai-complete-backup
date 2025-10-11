-- Add covering indexes for remaining unindexed foreign keys
-- ai_model_performance
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_model_id ON public.ai_model_performance (model_id);

-- crew_members
CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON public.crew_members (user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_yacht_id ON public.crew_members (yacht_id);

-- equipment_documents
CREATE INDEX IF NOT EXISTS idx_equipment_documents_equipment_id ON public.equipment_documents (equipment_id);

-- equipment_maintenance_tasks
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_tasks_equipment_id ON public.equipment_maintenance_tasks (equipment_id);

-- equipment_spare_parts
CREATE INDEX IF NOT EXISTS idx_equipment_spare_parts_equipment_id ON public.equipment_spare_parts (equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_spare_parts_inventory_item_id ON public.equipment_spare_parts (inventory_item_id);

-- equipment_usage_logs
CREATE INDEX IF NOT EXISTS idx_equipment_usage_logs_equipment_id ON public.equipment_usage_logs (equipment_id);

-- financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_yacht_id ON public.financial_transactions (yacht_id);

-- fuel_consumption
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_yacht_id ON public.fuel_consumption (yacht_id);

-- guest_charters
CREATE INDEX IF NOT EXISTS idx_guest_charters_yacht_id ON public.guest_charters (yacht_id);

-- inventory_alerts
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_item_id ON public.inventory_alerts (item_id);

-- inventory_items
CREATE INDEX IF NOT EXISTS idx_inventory_items_folder_id ON public.inventory_items (folder_id);

-- maintenance_schedules
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_equipment_id ON public.maintenance_schedules (equipment_id);

-- movement_records
CREATE INDEX IF NOT EXISTS idx_movement_records_item_id ON public.movement_records (item_id);

-- stock_adjustments
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_item_id ON public.stock_adjustments (item_id);

-- vision_connection_logs
CREATE INDEX IF NOT EXISTS idx_vision_connection_logs_config_id ON public.vision_connection_logs (config_id);

-- yacht_positions
CREATE INDEX IF NOT EXISTS idx_yacht_positions_yacht_id ON public.yacht_positions (yacht_id);

-- yacht_profiles
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_owner_id ON public.yacht_profiles (owner_id);
