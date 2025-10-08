-- Phase 1: Database Schema Extension for Yacht-Centric Claims & Repairs

-- Create yacht_profiles table as the central entity
CREATE TABLE public.yacht_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  imo_number TEXT UNIQUE,
  flag_state TEXT,
  vessel_type TEXT,
  gross_tonnage INTEGER,
  built_year INTEGER,
  length_meters NUMERIC,
  beam_meters NUMERIC,
  classification_society TEXT,
  owner_id UUID,
  specifications JSONB DEFAULT '{}',
  documentation JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add yacht_id to audit_instances for yacht-centric operations
ALTER TABLE public.audit_instances 
ADD COLUMN yacht_id UUID REFERENCES public.yacht_profiles(id),
ADD COLUMN job_type TEXT DEFAULT 'audit' CHECK (job_type IN ('audit', 'warranty_claim', 'repair')),
ADD COLUMN warranty_start_date DATE,
ADD COLUMN warranty_duration_months INTEGER,
ADD COLUMN warranty_expires_at DATE,
ADD COLUMN contractor_id UUID,
ADD COLUMN performance_score NUMERIC CHECK (performance_score >= 1 AND performance_score <= 10),
ADD COLUMN cost_rating NUMERIC CHECK (cost_rating >= 1 AND cost_rating <= 10),
ADD COLUMN estimated_cost NUMERIC DEFAULT 0,
ADD COLUMN actual_cost NUMERIC,
ADD COLUMN currency TEXT DEFAULT 'USD';

-- Create claimed_items_library for tracking repeated warranty claims
CREATE TABLE public.claimed_items_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  warranty_duration_months INTEGER,
  claim_history JSONB DEFAULT '[]',
  total_claims INTEGER DEFAULT 0,
  last_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create warranty_library for predefined warranty periods
CREATE TABLE public.warranty_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type TEXT NOT NULL,
  manufacturer TEXT,
  warranty_duration_months INTEGER NOT NULL,
  coverage_details JSONB DEFAULT '{}',
  standard_type TEXT, -- e.g., 'SIRE_2_0', 'DNV_ST_N001', 'ISM_CODE'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create communication_channels table
CREATE TABLE public.communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_instance_id UUID NOT NULL REFERENCES public.audit_instances(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'whatsapp', 'both')),
  supplier_email TEXT,
  supplier_whatsapp TEXT,
  thread_data JSONB DEFAULT '{}',
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create supplier_communications for message tracking
CREATE TABLE public.supplier_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('outgoing', 'incoming')),
  channel_used TEXT NOT NULL CHECK (channel_used IN ('email', 'whatsapp')),
  subject TEXT,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  ai_extracted_data JSONB DEFAULT '{}',
  sentiment_score NUMERIC,
  read_status BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create cost_estimates table for financial tracking
CREATE TABLE public.cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_instance_id UUID NOT NULL REFERENCES public.audit_instances(id) ON DELETE CASCADE,
  estimate_type TEXT NOT NULL CHECK (estimate_type IN ('initial', 'revised', 'final')),
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  valid_until DATE,
  supplier_quote_ref TEXT,
  ai_extracted BOOLEAN DEFAULT false,
  source_message_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quote_approvals for procurement routing
CREATE TABLE public.quote_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_estimate_id UUID NOT NULL REFERENCES public.cost_estimates(id) ON DELETE CASCADE,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'routed_to_procurement')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  procurement_task_id UUID,
  payment_terms JSONB DEFAULT '{}',
  e_signature_data JSONB DEFAULT '{}',
  routing_threshold NUMERIC DEFAULT 5000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create maritime_compliance_templates
CREATE TABLE public.maritime_compliance_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  compliance_standard TEXT NOT NULL CHECK (compliance_standard IN ('SIRE_2_0_CVIQ', 'DNV_ST_N001', 'ISM_CODE', 'MARPOL', 'STCW')),
  template_version TEXT NOT NULL,
  template_data JSONB NOT NULL,
  checklist_items JSONB DEFAULT '[]',
  risk_matrix JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create contractor_performance for scoring
CREATE TABLE public.contractor_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  audit_instance_id UUID NOT NULL REFERENCES public.audit_instances(id) ON DELETE CASCADE,
  quality_score NUMERIC CHECK (quality_score >= 1 AND quality_score <= 10),
  timeliness_score NUMERIC CHECK (timeliness_score >= 1 AND timeliness_score <= 10),
  communication_score NUMERIC CHECK (communication_score >= 1 AND communication_score <= 10),
  cost_effectiveness_score NUMERIC CHECK (cost_effectiveness_score >= 1 AND cost_effectiveness_score <= 10),
  overall_rating NUMERIC CHECK (overall_rating >= 1 AND overall_rating <= 10),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create IoT integration table for sensor-triggered maintenance
CREATE TABLE public.iot_sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL REFERENCES public.yacht_profiles(id) ON DELETE CASCADE,
  sensor_type TEXT NOT NULL,
  sensor_location TEXT NOT NULL,
  equipment_id UUID,
  reading_value NUMERIC NOT NULL,
  unit_of_measure TEXT NOT NULL,
  threshold_min NUMERIC,
  threshold_max NUMERIC,
  alert_triggered BOOLEAN DEFAULT false,
  maintenance_required BOOLEAN DEFAULT false,
  created_audit_id UUID,
  reading_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimed_items_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maritime_compliance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_sensor_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view yacht profiles" ON public.yacht_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage yacht profiles" ON public.yacht_profiles
  FOR ALL USING (owner_id = auth.uid() OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users can view claimed items library" ON public.claimed_items_library
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage claimed items library" ON public.claimed_items_library
  FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users can view warranty library" ON public.warranty_library
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage warranty library" ON public.warranty_library
  FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users can manage communications" ON public.communication_channels
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage supplier communications" ON public.supplier_communications
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage cost estimates" ON public.cost_estimates
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage quote approvals" ON public.quote_approvals
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view compliance templates" ON public.maritime_compliance_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Superadmins can manage compliance templates" ON public.maritime_compliance_templates
  FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users can manage contractor performance" ON public.contractor_performance
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view IoT sensor data" ON public.iot_sensor_data
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert IoT sensor data" ON public.iot_sensor_data
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_yacht_profiles_owner ON public.yacht_profiles(owner_id);
CREATE INDEX idx_yacht_profiles_imo ON public.yacht_profiles(imo_number);
CREATE INDEX idx_audit_instances_yacht ON public.audit_instances(yacht_id);
CREATE INDEX idx_audit_instances_job_type ON public.audit_instances(job_type);
CREATE INDEX idx_audit_instances_warranty_expires ON public.audit_instances(warranty_expires_at);
CREATE INDEX idx_communication_channels_audit ON public.communication_channels(audit_instance_id);
CREATE INDEX idx_supplier_communications_channel ON public.supplier_communications(channel_id);
CREATE INDEX idx_cost_estimates_audit ON public.cost_estimates(audit_instance_id);
CREATE INDEX idx_quote_approvals_estimate ON public.quote_approvals(cost_estimate_id);
CREATE INDEX idx_contractor_performance_contractor ON public.contractor_performance(contractor_id);
CREATE INDEX idx_iot_sensor_data_yacht ON public.iot_sensor_data(yacht_id);
CREATE INDEX idx_iot_sensor_data_timestamp ON public.iot_sensor_data(reading_timestamp);

-- Create function to update warranty expiration
CREATE OR REPLACE FUNCTION public.update_warranty_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.warranty_start_date IS NOT NULL AND NEW.warranty_duration_months IS NOT NULL THEN
    NEW.warranty_expires_at := NEW.warranty_start_date + (NEW.warranty_duration_months || ' months')::interval;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for warranty expiration
CREATE TRIGGER update_warranty_expiration_trigger
  BEFORE INSERT OR UPDATE ON public.audit_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_warranty_expiration();

-- Create function to track claimed items
CREATE OR REPLACE FUNCTION public.track_claimed_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  item_record RECORD;
BEGIN
  IF NEW.job_type = 'warranty_claim' AND TG_OP = 'INSERT' THEN
    -- Update claimed items library
    SELECT ai.* INTO item_record
    FROM public.audit_items ai
    WHERE ai.audit_instance_id = NEW.id
    LIMIT 1;
    
    IF item_record IS NOT NULL THEN
      INSERT INTO public.claimed_items_library (item_name, item_type, total_claims, last_claimed_at)
      VALUES (item_record.title, item_record.category, 1, now())
      ON CONFLICT (item_name, item_type) DO UPDATE SET
        total_claims = claimed_items_library.total_claims + 1,
        last_claimed_at = now(),
        claim_history = claimed_items_library.claim_history || jsonb_build_object('claim_id', NEW.id, 'yacht_id', NEW.yacht_id, 'date', now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for tracking claimed items
CREATE TRIGGER track_claimed_item_trigger
  AFTER INSERT ON public.audit_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.track_claimed_item();

-- Insert initial maritime compliance templates
INSERT INTO public.maritime_compliance_templates (template_name, compliance_standard, template_version, template_data, checklist_items) VALUES
('SIRE 2.0 CVIQ Digital Inspection', 'SIRE_2_0_CVIQ', '2025.1', 
 '{"description": "Ship Inspection Report Programme 2.0 - Cargo Vessel Inspection Questionnaire", "scope": "Tanker vessel inspection", "risk_focus": "Environmental and safety compliance"}',
 '[
   {"id": 1, "category": "Navigation", "item": "Bridge equipment functional", "risk_level": "high"},
   {"id": 2, "category": "Safety", "item": "Fire detection systems operational", "risk_level": "critical"},
   {"id": 3, "category": "Environmental", "item": "Ballast water treatment system compliant", "risk_level": "high"},
   {"id": 4, "category": "Security", "item": "ISPS compliance verified", "risk_level": "medium"}
 ]'),
('DNV-ST-N001 Transport & Installation', 'DNV_ST_N001', '2024.1',
 '{"description": "Standard for certification of transport and installation of offshore wind structures", "scope": "Marine operations for renewable energy", "update": "2024 revision for enhanced warranty requirements"}',
 '[
   {"id": 1, "category": "Structural", "item": "Hull warranty compliance verified", "risk_level": "critical"},
   {"id": 2, "category": "Equipment", "item": "Crane operations certified", "risk_level": "high"},
   {"id": 3, "category": "Environmental", "item": "Weather routing approved", "risk_level": "medium"},
   {"id": 4, "category": "Documentation", "item": "Warranty periods documented", "risk_level": "high"}
 ]'),
('ISM Code Safety Management', 'ISM_CODE', '2023.1',
 '{"description": "International Safety Management Code compliance", "scope": "Safety management system verification", "focus": "Operational safety and environmental protection"}',
 '[
   {"id": 1, "category": "Management", "item": "SMS implementation verified", "risk_level": "critical"},
   {"id": 2, "category": "Training", "item": "Crew competency documented", "risk_level": "high"},
   {"id": 3, "category": "Maintenance", "item": "Planned maintenance system active", "risk_level": "high"},
   {"id": 4, "category": "Emergency", "item": "Emergency procedures tested", "risk_level": "critical"}
 ]');

-- Insert sample warranty library entries
INSERT INTO public.warranty_library (equipment_type, manufacturer, warranty_duration_months, coverage_details, standard_type) VALUES
('Main Engine', 'Wärtsilä', 24, '{"parts": true, "labor": true, "performance": true}', 'DNV_ST_N001'),
('Main Engine', 'MAN Energy Solutions', 24, '{"parts": true, "labor": true, "performance": true}', 'DNV_ST_N001'),
('Generator', 'Caterpillar', 12, '{"parts": true, "labor": false, "performance": true}', 'ISM_CODE'),
('Propulsion System', 'Rolls-Royce', 36, '{"parts": true, "labor": true, "performance": true}', 'DNV_ST_N001'),
('Hull Structure', 'Various', 60, '{"structural": true, "coating": false, "performance": false}', 'SIRE_2_0_CVIQ'),
('Navigation Equipment', 'Kongsberg', 18, '{"hardware": true, "software": true, "support": true}', 'SIRE_2_0_CVIQ'),
('Safety Systems', 'Consilium', 24, '{"equipment": true, "maintenance": false, "updates": true}', 'ISM_CODE');