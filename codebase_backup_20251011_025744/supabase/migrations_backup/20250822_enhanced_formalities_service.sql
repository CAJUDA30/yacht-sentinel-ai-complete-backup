-- Enhanced Formalities Service database schema
-- Real formalities documents, port authorities, and enhanced crew data

-- Port authorities table for real port data
CREATE TABLE IF NOT EXISTS public.port_authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  port_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  email TEXT NOT NULL,
  fax_number TEXT,
  website TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  document_requirements TEXT[] DEFAULT '{}',
  supported_languages TEXT[] DEFAULT '{}',
  processing_time_hours INTEGER DEFAULT 24,
  clearance_fee DECIMAL(10,2) DEFAULT 0,
  overtime_fee DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  operating_hours JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced crew personal details
CREATE TABLE IF NOT EXISTS public.crew_personal_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  nationality TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  passport_issuing_country TEXT,
  visa_status TEXT,
  visa_expiry DATE,
  birth_date DATE,
  birth_place TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  next_of_kin JSONB DEFAULT '{}',
  medical_information JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Formalities documents storage
CREATE TABLE IF NOT EXISTS public.formalities_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL CHECK (document_type IN (
    'crew_list', 'cargo_manifest', 'port_clearance', 'customs_declaration', 
    'immigration_form', 'health_declaration', 'security_declaration'
  )),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  port_id UUID REFERENCES port_authorities(id),
  document_data JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'submitted', 'approved', 'rejected', 'expired')),
  language TEXT DEFAULT 'en',
  original_language TEXT DEFAULT 'en',
  submission_reference TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  submission_method TEXT CHECK (submission_method IN ('email', 'api', 'manual')),
  document_hash TEXT, -- For integrity verification
  file_attachments JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document submission tracking
CREATE TABLE IF NOT EXISTS public.document_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_reference TEXT NOT NULL UNIQUE,
  document_ids UUID[] NOT NULL,
  port_authority_id UUID NOT NULL REFERENCES port_authorities(id),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id),
  submission_method TEXT NOT NULL,
  submitted_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('submitted', 'processing', 'approved', 'rejected', 'expired')),
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  tracking_notes JSONB DEFAULT '[]',
  port_response JSONB DEFAULT '{}',
  fees_paid DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cargo/inventory items for manifests
CREATE TABLE IF NOT EXISTS public.cargo_manifest_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_document_id UUID NOT NULL REFERENCES formalities_documents(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  value DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  category TEXT,
  origin_country TEXT,
  hs_code TEXT, -- Harmonized System code for customs
  weight_kg DECIMAL(8,2),
  dimensions JSONB DEFAULT '{}',
  supplier_name TEXT,
  invoice_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template forms for different ports
CREATE TABLE IF NOT EXISTS public.port_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  port_authority_id UUID NOT NULL REFERENCES port_authorities(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  form_name TEXT NOT NULL,
  form_structure JSONB NOT NULL,
  required_fields TEXT[] DEFAULT '{}',
  optional_fields TEXT[] DEFAULT '{}',
  validation_rules JSONB DEFAULT '{}',
  language TEXT DEFAULT 'en',
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE port_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_personal_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE formalities_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargo_manifest_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE port_form_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enterprise access
CREATE POLICY "Allow all operations on port_authorities" ON port_authorities FOR ALL USING (true);
CREATE POLICY "Users can manage crew personal details" ON crew_personal_details FOR ALL USING (true);
CREATE POLICY "Users can manage formalities documents" ON formalities_documents FOR ALL USING (true);
CREATE POLICY "Users can manage document submissions" ON document_submissions FOR ALL USING (true);
CREATE POLICY "Users can manage cargo manifest items" ON cargo_manifest_items FOR ALL USING (true);
CREATE POLICY "Allow read access to port form templates" ON port_form_templates FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_port_authorities_country ON port_authorities(country);
CREATE INDEX IF NOT EXISTS idx_port_authorities_active ON port_authorities(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crew_personal_details_crew ON crew_personal_details(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_formalities_documents_yacht ON formalities_documents(yacht_id);
CREATE INDEX IF NOT EXISTS idx_formalities_documents_type_status ON formalities_documents(document_type, status);
CREATE INDEX IF NOT EXISTS idx_document_submissions_reference ON document_submissions(submission_reference);
CREATE INDEX IF NOT EXISTS idx_document_submissions_yacht ON document_submissions(yacht_id);
CREATE INDEX IF NOT EXISTS idx_cargo_manifest_items_manifest ON cargo_manifest_items(manifest_document_id);
CREATE INDEX IF NOT EXISTS idx_port_form_templates_port ON port_form_templates(port_authority_id);

-- Insert sample port authorities
INSERT INTO port_authorities (
  port_code, name, country, city, email, document_requirements, supported_languages,
  processing_time_hours, clearance_fee, overtime_fee, currency
) VALUES 
(
  'MCM_MONACO', 'Port Hercules Monaco', 'Monaco', 'Monaco',
  'marine@gouv.mc', 
  ARRAY['crew_list', 'customs_declaration', 'port_clearance'],
  ARRAY['fr', 'en'],
  4, 150.00, 75.00, 'EUR'
),
(
  'SXM_SIMPSON', 'Simpson Bay Marina', 'St. Maarten', 'Philipsburg',
  'harbormaster@simpsonbay.com',
  ARRAY['crew_list', 'immigration_form', 'customs_declaration'],
  ARRAY['en', 'nl'],
  2, 75.00, 0.00, 'USD'
),
(
  'DXB_DUBAI', 'Dubai Marine', 'UAE', 'Dubai',
  'marine@dmca.ae',
  ARRAY['crew_list', 'cargo_manifest', 'customs_declaration', 'immigration_form'],
  ARRAY['ar', 'en'],
  6, 500.00, 200.00, 'AED'
) ON CONFLICT (port_code) DO NOTHING;

-- Insert sample crew personal details
INSERT INTO crew_personal_details (
  crew_member_id, nationality, passport_number, passport_expiry,
  passport_issuing_country, emergency_contact_name, emergency_contact_phone
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'British', 'GBR123456789', '2026-06-15',
  'United Kingdom', 'Emma Thompson', '+44-20-7946-0958'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'French', 'FRA987654321', '2025-12-30',
  'France', 'Marie Dubois', '+33-1-42-86-83-26'
) ON CONFLICT DO NOTHING;

-- Insert sample formalities documents
INSERT INTO formalities_documents (
  document_type, yacht_id, port_id, document_data, status, submission_reference
) VALUES 
(
  'crew_list',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM port_authorities WHERE port_code = 'MCM_MONACO' LIMIT 1),
  jsonb_build_object(
    'yachtName', 'Demo Yacht',
    'imoNumber', 'IMO1234567',
    'crewCount', 8,
    'arrivalDate', CURRENT_DATE,
    'departureDate', CURRENT_DATE + INTERVAL '7 days'
  ),
  'submitted',
  'SUB_' || EXTRACT(epoch FROM NOW())::TEXT || '_CREW01'
),
(
  'cargo_manifest',
  '550e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM port_authorities WHERE port_code = 'DXB_DUBAI' LIMIT 1),
  jsonb_build_object(
    'yachtName', 'Demo Yacht',
    'manifestType', 'arrival',
    'totalValue', 25000,
    'currency', 'USD',
    'itemCount', 15
  ),
  'draft',
  NULL
) ON CONFLICT DO NOTHING;

-- Insert sample document submission
INSERT INTO document_submissions (
  submission_reference, document_ids, port_authority_id, yacht_id,
  submission_method, status, estimated_completion
) VALUES 
(
  'SUB_' || EXTRACT(epoch FROM NOW())::TEXT || '_CREW01',
  ARRAY[(SELECT id FROM formalities_documents WHERE document_type = 'crew_list' LIMIT 1)],
  (SELECT id FROM port_authorities WHERE port_code = 'MCM_MONACO' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  'email',
  'processing',
  NOW() + INTERVAL '4 hours'
) ON CONFLICT DO NOTHING;

-- Functions for document management

-- Function to generate crew list with real data
CREATE OR REPLACE FUNCTION generate_crew_list_data(p_yacht_id UUID, p_port_id UUID)
RETURNS JSONB AS $$
DECLARE
  yacht_data RECORD;
  crew_data RECORD[];
  port_data RECORD;
  result JSONB;
BEGIN
  -- Get yacht information
  SELECT name, imo_number INTO yacht_data
  FROM yacht_profiles 
  WHERE id = p_yacht_id;
  
  -- Get port information
  SELECT name INTO port_data
  FROM port_authorities
  WHERE id = p_port_id;
  
  -- Get crew information with personal details
  SELECT ARRAY_AGG(
    jsonb_build_object(
      'id', cm.id,
      'name', cm.name,
      'position', cm.position,
      'nationality', COALESCE(cpd.nationality, 'Unknown'),
      'passportNumber', COALESCE(cpd.passport_number, 'N/A'),
      'passportExpiry', COALESCE(cpd.passport_expiry::TEXT, 'N/A'),
      'emergencyContact', COALESCE(cpd.emergency_contact_name || ' - ' || cpd.emergency_contact_phone, 'N/A')
    )
  ) INTO crew_data
  FROM crew_members cm
  LEFT JOIN crew_personal_details cpd ON cm.id = cpd.crew_member_id
  WHERE cm.yacht_id = p_yacht_id AND cm.status = 'active';
  
  -- Build result
  result := jsonb_build_object(
    'yachtName', COALESCE(yacht_data.name, 'Unknown Yacht'),
    'imoNumber', COALESCE(yacht_data.imo_number, 'N/A'),
    'arrivalDate', CURRENT_DATE,
    'departureDate', CURRENT_DATE + INTERVAL '7 days',
    'crewCount', COALESCE(array_length(crew_data, 1), 0),
    'crewList', COALESCE(crew_data, '[]'::JSONB),
    'captain', (
      SELECT jsonb_build_object(
        'name', cm.name,
        'position', cm.position
      )
      FROM crew_members cm
      WHERE cm.yacht_id = p_yacht_id 
        AND cm.status = 'active'
        AND LOWER(cm.position) LIKE '%captain%'
      LIMIT 1
    ),
    'portAuthority', COALESCE(port_data.name, 'Unknown Port'),
    'documentType', 'crew_list',
    'generatedAt', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate cargo manifest data
CREATE OR REPLACE FUNCTION generate_cargo_manifest_data(p_yacht_id UUID, p_port_id UUID, p_manifest_type TEXT DEFAULT 'arrival')
RETURNS JSONB AS $$
DECLARE
  yacht_data RECORD;
  port_data RECORD;
  inventory_data RECORD[];
  result JSONB;
BEGIN
  -- Get yacht information
  SELECT name, imo_number INTO yacht_data
  FROM yacht_profiles 
  WHERE id = p_yacht_id;
  
  -- Get port information
  SELECT name INTO port_data
  FROM port_authorities
  WHERE id = p_port_id;
  
  -- Get inventory/cargo items (assuming inventory table exists)
  SELECT ARRAY_AGG(
    jsonb_build_object(
      'description', COALESCE(item_name, 'Unknown Item'),
      'quantity', COALESCE(quantity, 0),
      'unit', COALESCE(unit, 'pcs'),
      'value', COALESCE(total_value, 0),
      'currency', 'USD',
      'category', COALESCE(category, 'general'),
      'origin', COALESCE(supplier_name, 'Unknown')
    )
  ) INTO inventory_data
  FROM fleet_inventory
  WHERE yacht_id = p_yacht_id;
  
  -- Build result
  result := jsonb_build_object(
    'yachtName', COALESCE(yacht_data.name, 'Unknown Yacht'),
    'imoNumber', COALESCE(yacht_data.imo_number, 'N/A'),
    'manifestType', p_manifest_type,
    'portOfCall', COALESCE(port_data.name, 'Unknown Port'),
    'date', CURRENT_DATE,
    'items', COALESCE(inventory_data, '[]'::JSONB),
    'totalValue', (
      SELECT COALESCE(SUM(total_value), 0)
      FROM fleet_inventory
      WHERE yacht_id = p_yacht_id
    ),
    'currency', 'USD'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to track submission status
CREATE OR REPLACE FUNCTION update_submission_status(p_submission_reference TEXT, p_new_status TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE document_submissions
  SET 
    status = p_new_status,
    updated_at = NOW(),
    actual_completion = CASE WHEN p_new_status IN ('approved', 'rejected') THEN NOW() ELSE actual_completion END
  WHERE submission_reference = p_submission_reference;
  
  -- Add tracking note
  UPDATE document_submissions
  SET tracking_notes = tracking_notes || jsonb_build_array(
    jsonb_build_object(
      'status', p_new_status,
      'timestamp', NOW(),
      'note', 'Status updated to ' || p_new_status
    )
  )
  WHERE submission_reference = p_submission_reference;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE port_authorities IS 'Real port authorities data with contact information and requirements';
COMMENT ON TABLE crew_personal_details IS 'Enhanced crew personal details for formalities documentation';
COMMENT ON TABLE formalities_documents IS 'Generated formalities documents with real data storage';
COMMENT ON TABLE document_submissions IS 'Document submission tracking and status management';