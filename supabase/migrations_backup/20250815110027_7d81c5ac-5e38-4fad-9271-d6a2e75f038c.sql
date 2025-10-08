-- Enhanced Cross-Module Integration Tables
CREATE TABLE IF NOT EXISTS cross_module_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_module TEXT NOT NULL,
  primary_record_id UUID NOT NULL,
  related_module TEXT NOT NULL,
  related_record_id UUID NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('depends_on', 'triggers', 'references', 'consumes', 'generates', 'blocks')),
  metadata JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cross_module_primary ON cross_module_integrations(primary_module, primary_record_id);
CREATE INDEX IF NOT EXISTS idx_cross_module_related ON cross_module_integrations(related_module, related_record_id);
CREATE INDEX IF NOT EXISTS idx_cross_module_active ON cross_module_integrations(is_active) WHERE is_active = true;

-- Finance Transactions table for cross-module financial tracking
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_id UUID NOT NULL,
  reference_type TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('expense', 'invoice', 'payment', 'refund', 'procurement', 'warranty_claim')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  supplier_contractor_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'disputed')),
  due_date DATE,
  paid_date DATE,
  approval_workflow JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  approved_by UUID
);

-- Compliance Requirements for maritime regulations
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  regulation_code TEXT NOT NULL,
  requirement_title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('safety', 'environmental', 'technical', 'operational', 'financial')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  applicable_modules JSONB NOT NULL DEFAULT '[]',
  verification_criteria JSONB NOT NULL DEFAULT '{}',
  auto_check_enabled BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event Bus for real-time cross-module notifications
CREATE TABLE IF NOT EXISTS event_bus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  module TEXT NOT NULL,
  source_record_id UUID,
  target_modules JSONB DEFAULT '[]',
  payload JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID
);

-- Workflow Automation Rules
CREATE TABLE IF NOT EXISTS workflow_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_module TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Inventory Reservations for Claims & Repairs
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL,
  reserved_for_module TEXT NOT NULL,
  reserved_for_record_id UUID NOT NULL,
  quantity_reserved INTEGER NOT NULL,
  reservation_type TEXT NOT NULL CHECK (reservation_type IN ('hard', 'soft', 'planned')),
  valid_until TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'cancelled', 'expired')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Performance Metrics for cross-module analytics
CREATE TABLE IF NOT EXISTS cross_module_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  module_combination TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('count', 'duration', 'cost', 'efficiency', 'success_rate')),
  time_period TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE cross_module_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bus ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_module_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view cross module integrations" ON cross_module_integrations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can manage cross module integrations" ON cross_module_integrations FOR ALL USING (true);

CREATE POLICY "Authenticated users can view finance transactions" ON finance_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create finance transactions" ON finance_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their finance transactions" ON finance_transactions FOR UPDATE USING (created_by = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Authenticated users can view compliance requirements" ON compliance_requirements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Superadmins can manage compliance requirements" ON compliance_requirements FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "System can manage event bus" ON event_bus FOR ALL USING (true);
CREATE POLICY "Authenticated users can view events" ON event_bus FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view workflow rules" ON workflow_automation_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Superadmins can manage workflow rules" ON workflow_automation_rules FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Authenticated users can manage inventory reservations" ON inventory_reservations FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view metrics" ON cross_module_metrics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can record metrics" ON cross_module_metrics FOR INSERT WITH CHECK (true);

-- Functions for automation
CREATE OR REPLACE FUNCTION trigger_cross_module_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO event_bus (event_type, module, source_record_id, payload, user_id)
  VALUES (
    TG_OP || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    to_jsonb(COALESCE(NEW, OLD)),
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_cross_module_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for timestamp updates
CREATE TRIGGER cross_module_integrations_updated_at BEFORE UPDATE ON cross_module_integrations FOR EACH ROW EXECUTE FUNCTION update_cross_module_timestamps();
CREATE TRIGGER finance_transactions_updated_at BEFORE UPDATE ON finance_transactions FOR EACH ROW EXECUTE FUNCTION update_cross_module_timestamps();
CREATE TRIGGER workflow_automation_rules_updated_at BEFORE UPDATE ON workflow_automation_rules FOR EACH ROW EXECUTE FUNCTION update_cross_module_timestamps();
CREATE TRIGGER inventory_reservations_updated_at BEFORE UPDATE ON inventory_reservations FOR EACH ROW EXECUTE FUNCTION update_cross_module_timestamps();