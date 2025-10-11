-- Create central suppliers/contractors table for sharing across all modules
CREATE TABLE public.suppliers_contractors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('supplier', 'contractor', 'both')),
  category TEXT NOT NULL, -- equipment, maintenance, marine_services, etc.
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  country TEXT,
  website TEXT,
  
  -- Performance & Rating
  overall_rating NUMERIC DEFAULT 0 CHECK (overall_rating >= 0 AND overall_rating <= 5),
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  on_time_delivery_rate NUMERIC DEFAULT 100,
  cost_rating NUMERIC DEFAULT 0,
  quality_rating NUMERIC DEFAULT 0,
  communication_rating NUMERIC DEFAULT 0,
  
  -- Maritime Specific
  certifications JSONB DEFAULT '[]'::jsonb,
  maritime_specialties JSONB DEFAULT '[]'::jsonb, -- engines, hull, electronics, etc.
  vessel_types_served JSONB DEFAULT '[]'::jsonb, -- motor_yacht, sailing_yacht, commercial, etc.
  compliance_standards JSONB DEFAULT '[]'::jsonb, -- SIRE 2.0, DNV-ST-N001, ISM Code, ISO 9001
  
  -- Business Info
  tax_id TEXT,
  vat_number TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  currency TEXT DEFAULT 'USD',
  credit_limit NUMERIC DEFAULT 0,
  
  -- Status & Activity
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval')),
  preferred_communication TEXT DEFAULT 'email' CHECK (preferred_communication IN ('email', 'whatsapp', 'both')),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  last_job_at TIMESTAMP WITH TIME ZONE,
  
  -- Module Associations
  module_access JSONB DEFAULT '["procurement"]'::jsonb, -- which modules can use this supplier
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.suppliers_contractors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view suppliers/contractors" 
ON public.suppliers_contractors 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage suppliers/contractors" 
ON public.suppliers_contractors 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create module-specific relationship table
CREATE TABLE public.supplier_module_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers_contractors(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL CHECK (module_name IN ('inventory', 'equipment', 'maintenance', 'finance', 'procurement', 'safety_compliance', 'claims_repairs', 'documents', 'communications')),
  specialties JSONB DEFAULT '[]'::jsonb, -- module-specific specialties
  preferred BOOLEAN DEFAULT false, -- preferred supplier for this module
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, module_name)
);

-- Enable RLS for assignments
ALTER TABLE public.supplier_module_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supplier assignments" 
ON public.supplier_module_assignments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage supplier assignments" 
ON public.supplier_module_assignments 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create hierarchical job categories for Claims & Repairs
CREATE TABLE public.claims_repairs_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('claims', 'repairs', 'both')),
  parent_id UUID REFERENCES public.claims_repairs_categories(id) ON DELETE CASCADE,
  description TEXT,
  icon TEXT DEFAULT 'Wrench',
  color TEXT DEFAULT '#0ea5e9',
  sort_order INTEGER DEFAULT 0,
  
  -- Maritime specific
  equipment_types JSONB DEFAULT '[]'::jsonb, -- engines, hull, electronics, etc.
  urgency_level TEXT DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  estimated_duration_hours INTEGER,
  
  -- Compliance requirements  
  required_certifications JSONB DEFAULT '[]'::jsonb,
  compliance_standards JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.claims_repairs_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories" 
ON public.claims_repairs_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage categories" 
ON public.claims_repairs_categories 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add category_id to audit_instances (existing table used by Claims & Repairs)
ALTER TABLE public.audit_instances 
ADD COLUMN category_id UUID REFERENCES public.claims_repairs_categories(id),
ADD COLUMN supplier_contractor_id UUID REFERENCES public.suppliers_contractors(id),
ADD COLUMN job_type_specific TEXT DEFAULT 'general' CHECK (job_type_specific IN ('warranty_claim', 'insurance_claim', 'maintenance_repair', 'emergency_repair', 'preventive_maintenance', 'general')),
ADD COLUMN urgency_level TEXT DEFAULT 'medium' CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN expected_completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN communication_preference TEXT DEFAULT 'email' CHECK (communication_preference IN ('email', 'whatsapp', 'both')),
ADD COLUMN compliance_requirements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN ai_suggestions JSONB DEFAULT '{}'::jsonb;

-- Create cost estimates table for quotes
CREATE TABLE public.cost_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_instance_id UUID NOT NULL REFERENCES public.audit_instances(id) ON DELETE CASCADE,
  supplier_contractor_id UUID NOT NULL REFERENCES public.suppliers_contractors(id),
  
  -- Quote details
  quote_number TEXT,
  quote_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  
  -- Costs
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  travel_cost NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Timeline
  estimated_start_date DATE,
  estimated_completion_date DATE,
  estimated_duration_hours INTEGER,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'approved', 'rejected', 'expired')),
  
  -- Communication
  communication_thread JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Approval
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cost estimates" 
ON public.cost_estimates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized users can manage cost estimates" 
ON public.cost_estimates 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_suppliers_contractors_type ON public.suppliers_contractors(type);
CREATE INDEX idx_suppliers_contractors_category ON public.suppliers_contractors(category);
CREATE INDEX idx_suppliers_contractors_status ON public.suppliers_contractors(status);
CREATE INDEX idx_suppliers_contractors_rating ON public.suppliers_contractors(overall_rating);

CREATE INDEX idx_supplier_assignments_module ON public.supplier_module_assignments(module_name);
CREATE INDEX idx_supplier_assignments_preferred ON public.supplier_module_assignments(preferred) WHERE preferred = true;

CREATE INDEX idx_categories_type ON public.claims_repairs_categories(type);
CREATE INDEX idx_categories_parent ON public.claims_repairs_categories(parent_id);
CREATE INDEX idx_categories_active ON public.claims_repairs_categories(is_active) WHERE is_active = true;

CREATE INDEX idx_audit_instances_category ON public.audit_instances(category_id);
CREATE INDEX idx_audit_instances_supplier ON public.audit_instances(supplier_contractor_id);
CREATE INDEX idx_audit_instances_job_type ON public.audit_instances(job_type_specific);
CREATE INDEX idx_audit_instances_urgency ON public.audit_instances(urgency_level);

CREATE INDEX idx_cost_estimates_status ON public.cost_estimates(status);
CREATE INDEX idx_cost_estimates_audit ON public.cost_estimates(audit_instance_id);
CREATE INDEX idx_cost_estimates_supplier ON public.cost_estimates(supplier_contractor_id);

-- Insert default categories for maritime operations
INSERT INTO public.claims_repairs_categories (name, type, description, icon, color, equipment_types, urgency_level, sort_order) VALUES
('Engine Systems', 'both', 'Main engines, generators, propulsion systems', 'Engine', '#dc2626', '["main_engine", "generator", "propulsion", "fuel_system"]', 'high', 1),
('Hull & Structure', 'repairs', 'Hull integrity, structural repairs, waterproofing', 'Ship', '#0ea5e9', '["hull", "deck", "superstructure", "windows", "doors"]', 'critical', 2),
('Electronics & Navigation', 'both', 'Navigation equipment, communication systems, radar', 'Radar', '#7c3aed', '["navigation", "communication", "radar", "autopilot", "electronics"]', 'medium', 3),
('Safety Equipment', 'both', 'Life rafts, fire systems, safety gear', 'Shield', '#dc2626', '["life_raft", "fire_system", "safety_gear", "emergency_equipment"]', 'critical', 4),
('HVAC & Plumbing', 'repairs', 'Air conditioning, heating, water systems', 'Wind', '#059669', '["hvac", "plumbing", "water_system", "sewage_system"]', 'medium', 5),
('Electrical Systems', 'repairs', 'Power distribution, lighting, electrical repairs', 'Zap', '#f59e0b', '["electrical", "lighting", "power_distribution", "shore_power"]', 'high', 6),
('Warranty Claims', 'claims', 'OEM warranty claims and manufacturer defects', 'FileText', '#0ea5e9', '[]', 'medium', 7),
('Insurance Claims', 'claims', 'Insurance related damage and coverage claims', 'Shield', '#dc2626', '[]', 'high', 8);

-- Insert sub-categories for Engine Systems
INSERT INTO public.claims_repairs_categories (name, type, parent_id, description, icon, color, equipment_types, urgency_level, sort_order) 
SELECT 
  category_name,
  'both',
  (SELECT id FROM public.claims_repairs_categories WHERE name = 'Engine Systems' LIMIT 1),
  description,
  'Wrench',
  '#dc2626',
  equipment_types::jsonb,
  urgency_level,
  sort_order
FROM (VALUES
  ('Main Engine', 'Primary propulsion engine maintenance and repairs', '["main_engine"]', 'critical', 1),
  ('Generators', 'Power generation equipment and systems', '["generator", "auxiliary_engine"]', 'high', 2),
  ('Fuel Systems', 'Fuel tanks, pumps, filters, and fuel delivery', '["fuel_tank", "fuel_pump", "fuel_filter"]', 'high', 3),
  ('Cooling Systems', 'Engine cooling, heat exchangers, pumps', '["cooling_system", "heat_exchanger", "water_pump"]', 'high', 4)
) AS subcats(category_name, description, equipment_types, urgency_level, sort_order);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_contractors_updated_at
    BEFORE UPDATE ON public.suppliers_contractors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_assignments_updated_at
    BEFORE UPDATE ON public.supplier_module_assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.claims_repairs_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_estimates_updated_at
    BEFORE UPDATE ON public.cost_estimates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();