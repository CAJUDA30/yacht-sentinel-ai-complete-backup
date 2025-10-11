-- Create missing cross_module_relationships table
CREATE TABLE IF NOT EXISTS public.cross_module_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_module text NOT NULL,
  primary_record_id text NOT NULL,
  related_module text NOT NULL,
  related_record_id text NOT NULL,
  relationship_type text NOT NULL CHECK (relationship_type IN ('depends_on', 'triggers', 'references', 'consumes')),
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Add missing columns to financial_transactions to match our interface
ALTER TABLE public.financial_transactions 
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS paid_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS reference_id text,
ADD COLUMN IF NOT EXISTS reference_type text,
ADD COLUMN IF NOT EXISTS supplier_contractor_id uuid;

-- Add foreign key constraints
ALTER TABLE public.cross_module_relationships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cross_module_relationships
CREATE POLICY "Authenticated users can view relationships" ON public.cross_module_relationships
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage relationships" ON public.cross_module_relationships
  FOR ALL USING (true);

-- Add foreign key for supplier_contractor_id
ALTER TABLE public.financial_transactions
ADD CONSTRAINT fk_financial_transactions_supplier_contractor
FOREIGN KEY (supplier_contractor_id) REFERENCES public.suppliers_contractors(id);

-- Seed suppliers_contractors with maritime service providers
INSERT INTO public.suppliers_contractors (
  name, type, category, contact_person, email, phone, 
  country, overall_rating, certifications, maritime_specialties,
  vessel_types_served, compliance_standards
) VALUES 
('Mediterranean Marine Services', 'contractor', 'repair', 'Marco Rossi', 'marco@medmarineservices.com', '+39-123-456789', 
 'Italy', 4.8, '["ISO 9001", "MLC Certificate", "DNV GL Approved"]'::jsonb, 
 '["engine_repair", "hull_maintenance", "electrical_systems"]'::jsonb,
 '["motor_yacht", "sailing_yacht", "superyacht"]'::jsonb,
 '["IMO", "MCA", "DNV GL"]'::jsonb),

('Caribbean Yacht Repair Co.', 'contractor', 'repair', 'Sarah Johnson', 'sarah@caribyachtrepair.com', '+1-242-555-0123',
 'Bahamas', 4.5, '["ABYC Certified", "NMEA Certified", "Caterpillar Dealer"]'::jsonb,
 '["generator_service", "air_conditioning", "plumbing"]'::jsonb,
 '["motor_yacht", "sailing_yacht"]'::jsonb,
 '["ABYC", "MCA", "US Coast Guard"]'::jsonb),

('Nordic Marine Supply', 'supplier', 'parts', 'Lars Andersen', 'lars@nordicmarinesupply.no', '+47-123-45678',
 'Norway', 4.7, '["ISO 14001", "CE Marking", "DNV Approved"]'::jsonb,
 '["navigation_equipment", "safety_equipment", "deck_hardware"]'::jsonb,
 '["motor_yacht", "sailing_yacht", "commercial_vessel"]'::jsonb,
 '["CE", "DNV GL", "IMO SOLAS"]'::jsonb),

('Pacific Marine Electronics', 'supplier', 'electronics', 'Takeshi Yamamoto', 'takeshi@pacificmarineelec.jp', '+81-3-1234-5678',
 'Japan', 4.9, '["IEC 61162", "NMEA 2000 Certified", "Furuno Dealer"]'::jsonb,
 '["radar", "navigation", "communication", "fish_finder"]'::jsonb,
 '["motor_yacht", "sailing_yacht", "fishing_vessel"]'::jsonb,
 '["IEC", "IMO", "FCC"]'::jsonb),

('Atlantic Safety Systems', 'supplier', 'safety', 'Emma Thompson', 'emma@atlanticsafety.co.uk', '+44-20-7123-4567',
 'United Kingdom', 4.6, '["SOLAS Approved", "MED Certified", "ISO 9001"]'::jsonb,
 '["life_rafts", "fire_suppression", "safety_equipment"]'::jsonb,
 '["motor_yacht", "sailing_yacht", "commercial_vessel"]'::jsonb,
 '["SOLAS", "MED", "MCA"]'::jsonb);

-- Seed compliance requirements with proper categories
INSERT INTO public.compliance_requirements (
  regulation_code, requirement_title, description, category, severity,
  applicable_modules, verification_criteria
) VALUES 
('MCA-LY3-001', 'Annual Safety Inspection', 'Comprehensive safety inspection required annually for commercial yachts', 
 'safety', 'critical', ARRAY['claims_repairs', 'maintenance'], 
 '{"inspection_type": "visual_and_functional", "required_certificates": ["MCA LY3"], "validity_months": 12}'::jsonb),

('SOLAS-V-19', 'Navigation Equipment Compliance', 'All navigation equipment must comply with SOLAS V/19 requirements',
 'technical', 'high', ARRAY['claims_repairs', 'equipment'],
 '{"equipment_types": ["radar", "gps", "ais"], "testing_required": true, "validity_months": 24}'::jsonb),

('MARPOL-I-37', 'Oil Pollution Prevention', 'Compliance with MARPOL Annex I for oil pollution prevention',
 'environmental', 'high', ARRAY['claims_repairs', 'maintenance'],
 '{"inspection_frequency": "annual", "documentation_required": ["oil_record_book"], "validity_months": 12}'::jsonb),

('MLC-2006-A3', 'Crew Accommodation Standards', 'Crew accommodation must meet MLC 2006 Annex A3 standards',
 'operational', 'medium', ARRAY['claims_repairs', 'crew'],
 '{"accommodation_requirements": true, "min_space_per_person": 4.5, "validity_months": 36}'::jsonb);

-- Create some cross-module relationships
INSERT INTO public.cross_module_relationships (
  primary_module, primary_record_id, related_module, related_record_id,
  relationship_type, metadata
) VALUES 
('claims_repairs', 'sample-job-1', 'equipment', 'sample-equipment-1', 'references',
 '{"description": "Repair job references main engine", "priority": "high"}'::jsonb),
('claims_repairs', 'sample-job-2', 'inventory', 'sample-part-1', 'consumes',
 '{"description": "Job consumes hydraulic oil", "quantity": 20}'::jsonb),
('equipment', 'sample-equipment-1', 'maintenance', 'sample-schedule-1', 'triggers',
 '{"description": "Equipment failure triggers maintenance schedule", "urgency": "immediate"}'::jsonb);

-- Enable RLS on financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view financial transactions" ON public.financial_transactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage financial transactions" ON public.financial_transactions
  FOR ALL USING (true);