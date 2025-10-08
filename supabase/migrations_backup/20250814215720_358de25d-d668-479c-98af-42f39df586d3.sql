-- Add cross-module foreign keys to audit_instances table
ALTER TABLE audit_instances 
ADD COLUMN equipment_id uuid REFERENCES equipment(id),
ADD COLUMN inventory_item_id uuid REFERENCES inventory_items(id),
ADD COLUMN maintenance_schedule_id uuid REFERENCES maintenance_schedules(id);

-- Add indexes for performance
CREATE INDEX idx_audit_instances_equipment ON audit_instances(equipment_id);
CREATE INDEX idx_audit_instances_inventory ON audit_instances(inventory_item_id);
CREATE INDEX idx_audit_instances_maintenance ON audit_instances(maintenance_schedule_id);

-- Create finance_transactions table for cross-module financial integration
CREATE TABLE public.finance_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_id uuid,
  reference_type text NOT NULL, -- 'claims_repair', 'equipment', 'inventory', etc.
  transaction_type text NOT NULL, -- 'expense', 'invoice', 'payment', 'refund'
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  supplier_contractor_id uuid REFERENCES suppliers_contractors(id),
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  paid_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on finance_transactions
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for finance_transactions
CREATE POLICY "Authenticated users can manage finance transactions" 
ON public.finance_transactions 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create cross_module_integrations table to track relationships
CREATE TABLE public.cross_module_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_module text NOT NULL,
  primary_record_id uuid NOT NULL,
  related_module text NOT NULL,
  related_record_id uuid NOT NULL,
  relationship_type text NOT NULL, -- 'depends_on', 'triggers', 'references', 'consumes'
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS on cross_module_integrations
ALTER TABLE public.cross_module_integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for cross_module_integrations
CREATE POLICY "Authenticated users can manage cross module integrations" 
ON public.cross_module_integrations 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add indexes for cross_module_integrations
CREATE INDEX idx_cross_module_primary ON cross_module_integrations(primary_module, primary_record_id);
CREATE INDEX idx_cross_module_related ON cross_module_integrations(related_module, related_record_id);

-- Create compliance_requirements table for maritime compliance tracking
CREATE TABLE public.compliance_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  regulation_code text NOT NULL, -- 'SIRE_2_0', 'DNV_ST_N001', 'ISM_CODE', 'MLC', etc.
  requirement_title text NOT NULL,
  description text,
  category text NOT NULL, -- 'safety', 'environmental', 'technical', 'operational'
  severity text NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  applicable_modules text[] NOT NULL DEFAULT '{}',
  verification_criteria jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on compliance_requirements
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies for compliance_requirements
CREATE POLICY "Authenticated users can view compliance requirements" 
ON public.compliance_requirements 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage compliance requirements" 
ON public.compliance_requirements 
FOR ALL 
USING (is_superadmin_or_named(auth.uid()));

-- Seed some basic compliance requirements
INSERT INTO public.compliance_requirements (regulation_code, requirement_title, description, category, severity, applicable_modules) VALUES
('SIRE_2_0', 'SIRE 2.0 CVIQ Compliance', 'Ship Inspection Report Programme 2.0 compliance verification', 'safety', 'critical', ARRAY['claims_repairs', 'equipment', 'safety']),
('DNV_ST_N001', 'DNV Standard for Maritime Technology', 'DNV-ST-N001 requirements for equipment and systems', 'technical', 'high', ARRAY['claims_repairs', 'equipment', 'maintenance']),
('ISM_CODE', 'International Safety Management Code', 'ISM Code compliance for safety management systems', 'safety', 'critical', ARRAY['claims_repairs', 'safety', 'crew']),
('MLC_2006', 'Maritime Labour Convention 2006', 'MLC requirements for crew welfare and working conditions', 'operational', 'high', ARRAY['claims_repairs', 'crew']),
('PSC_PREP', 'Port State Control Preparation', 'Preparation requirements for Port State Control inspections', 'safety', 'critical', ARRAY['claims_repairs', 'equipment', 'safety', 'crew']);