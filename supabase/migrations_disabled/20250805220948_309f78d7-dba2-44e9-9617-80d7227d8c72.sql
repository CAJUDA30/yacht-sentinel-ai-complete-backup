-- Phase 1 & 2: Create equipment-parts integration tables and enhance existing schema

-- Equipment spare parts relationship table
CREATE TABLE IF NOT EXISTS equipment_spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  part_number TEXT,
  manufacturer TEXT,
  quantity_required INTEGER DEFAULT 1,
  is_critical BOOLEAN DEFAULT false,
  replacement_frequency_hours INTEGER, -- Hours between replacements
  cost_per_unit NUMERIC(10,2),
  supplier TEXT,
  supplier_part_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enhanced maintenance schedules with hour-based triggers
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  schedule_name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('hours', 'days', 'weeks', 'months', 'years')),
  frequency_value INTEGER NOT NULL, -- e.g., 100 hours, 30 days
  current_hours NUMERIC(10,2) DEFAULT 0,
  next_due_hours NUMERIC(10,2),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimated_duration_hours NUMERIC(4,2),
  requires_shutdown BOOLEAN DEFAULT false,
  auto_generate_tasks BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parts requirements per maintenance schedule
CREATE TABLE IF NOT EXISTS maintenance_parts_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_schedule_id UUID NOT NULL REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  equipment_spare_part_id UUID REFERENCES equipment_spare_parts(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL, -- Fallback if no equipment_spare_part_id
  quantity_needed INTEGER DEFAULT 1,
  is_consumable BOOLEAN DEFAULT false, -- True for oil, filters, etc.
  order_lead_time_days INTEGER DEFAULT 7,
  minimum_stock_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment usage tracking for hour-based maintenance
CREATE TABLE IF NOT EXISTS equipment_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  usage_hours NUMERIC(10,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID,
  notes TEXT,
  meter_reading NUMERIC(15,2), -- For equipment with hour meters
  calculated_hours NUMERIC(10,2), -- Calculated from start/stop times
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Procurement automation table
CREATE TABLE IF NOT EXISTS automated_procurement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_schedule_id UUID REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  part_number TEXT,
  quantity_needed INTEGER NOT NULL,
  current_stock INTEGER DEFAULT 0,
  minimum_threshold INTEGER DEFAULT 1,
  estimated_cost NUMERIC(10,2),
  supplier TEXT,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  request_status TEXT DEFAULT 'pending' CHECK (request_status IN ('pending', 'approved', 'ordered', 'fulfilled', 'cancelled')),
  auto_approved BOOLEAN DEFAULT false,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_spare_parts_equipment_id ON equipment_spare_parts(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_spare_parts_inventory_item_id ON equipment_spare_parts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_equipment_id ON maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_next_due ON maintenance_schedules(next_due_hours);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_logs_equipment_id ON equipment_usage_logs(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_usage_logs_recorded_at ON equipment_usage_logs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_automated_procurement_status ON automated_procurement_requests(request_status);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_equipment_spare_parts_updated_at
  BEFORE UPDATE ON equipment_spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
  BEFORE UPDATE ON maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automated_procurement_requests_updated_at
  BEFORE UPDATE ON automated_procurement_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create procurement requests when parts are low
CREATE OR REPLACE FUNCTION check_parts_inventory_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- When inventory quantity drops below minimum, create procurement request
  IF NEW.quantity < NEW.min_stock AND OLD.quantity >= OLD.min_stock THEN
    INSERT INTO automated_procurement_requests (
      part_name,
      part_number,
      quantity_needed,
      current_stock,
      minimum_threshold,
      urgency,
      notes
    ) VALUES (
      NEW.name,
      NEW.part_number,
      GREATEST(NEW.min_stock * 2, 5), -- Order double minimum or 5, whichever is higher
      NEW.quantity,
      NEW.min_stock,
      CASE 
        WHEN NEW.quantity = 0 THEN 'critical'
        WHEN NEW.quantity < NEW.min_stock / 2 THEN 'high'
        ELSE 'medium'
      END,
      'Automatically generated due to low stock levels'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic procurement requests
CREATE TRIGGER inventory_low_stock_procurement_trigger
  AFTER UPDATE ON inventory_items
  FOR EACH ROW
  WHEN (NEW.quantity IS DISTINCT FROM OLD.quantity)
  EXECUTE FUNCTION check_parts_inventory_trigger();

-- Enable RLS policies for new tables
ALTER TABLE equipment_spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_parts_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_procurement_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables (allowing all operations for now)
CREATE POLICY "Allow all operations on equipment_spare_parts" ON equipment_spare_parts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on maintenance_schedules" ON maintenance_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on maintenance_parts_requirements" ON maintenance_parts_requirements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on equipment_usage_logs" ON equipment_usage_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on automated_procurement_requests" ON automated_procurement_requests FOR ALL USING (true) WITH CHECK (true);