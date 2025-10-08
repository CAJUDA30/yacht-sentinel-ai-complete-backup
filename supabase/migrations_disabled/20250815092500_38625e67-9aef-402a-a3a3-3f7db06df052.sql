-- Enhance claims_repairs_categories table structure for professional workflow
DO $$ 
BEGIN
  -- Only add columns that don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims_repairs_categories' AND column_name = 'workflow_stages') THEN
    ALTER TABLE claims_repairs_categories ADD COLUMN workflow_stages JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'claims_repairs_categories' AND column_name = 'required_documentation') THEN
    ALTER TABLE claims_repairs_categories ADD COLUMN required_documentation JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create warranty_claims table for warranty-specific data
CREATE TABLE IF NOT EXISTS public.warranty_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES audit_instances(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date DATE,
  warranty_start_date DATE,
  warranty_end_date DATE,
  claim_type TEXT NOT NULL DEFAULT 'replacement',
  failure_description TEXT,
  damage_photos JSONB DEFAULT '[]'::jsonb,
  warranty_documents JSONB DEFAULT '[]'::jsonb,
  manufacturer_response TEXT,
  claim_status TEXT NOT NULL DEFAULT 'submitted',
  claim_reference TEXT,
  resolution_notes TEXT,
  replacement_parts JSONB DEFAULT '[]'::jsonb,
  labor_hours NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on warranty_claims
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

-- Create policies for warranty_claims
CREATE POLICY "Users can view warranty claims" 
ON public.warranty_claims 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create warranty claims" 
ON public.warranty_claims 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update warranty claims" 
ON public.warranty_claims 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create repair_jobs table for repair-specific data  
CREATE TABLE IF NOT EXISTS public.repair_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES audit_instances(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  location_on_vessel TEXT,
  issue_description TEXT NOT NULL,
  severity_level TEXT NOT NULL DEFAULT 'medium',
  safety_concerns TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  required_parts JSONB DEFAULT '[]'::jsonb,
  required_tools JSONB DEFAULT '[]'::jsonb,
  contractor_requirements TEXT,
  before_photos JSONB DEFAULT '[]'::jsonb,
  after_photos JSONB DEFAULT '[]'::jsonb,
  work_performed TEXT,
  parts_used JSONB DEFAULT '[]'::jsonb,
  labor_hours NUMERIC DEFAULT 0,
  completion_notes TEXT,
  quality_check_passed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on repair_jobs
ALTER TABLE public.repair_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for repair_jobs
CREATE POLICY "Users can view repair jobs" 
ON public.repair_jobs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create repair jobs" 
ON public.repair_jobs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update repair jobs" 
ON public.repair_jobs 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create supplier_quotes table for quote management (without foreign key to suppliers table)
CREATE TABLE IF NOT EXISTS public.supplier_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES audit_instances(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_email TEXT,
  supplier_phone TEXT,
  supplier_company TEXT,
  quote_reference TEXT,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  travel_cost NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  estimated_duration_days INTEGER,
  warranty_offered_months INTEGER,
  payment_terms TEXT,
  special_conditions TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  selected BOOLEAN DEFAULT false,
  response_time_hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on supplier_quotes
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for supplier_quotes
CREATE POLICY "Users can view supplier quotes" 
ON public.supplier_quotes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create supplier quotes" 
ON public.supplier_quotes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update supplier quotes" 
ON public.supplier_quotes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create job_communications table for tracking all communications
CREATE TABLE IF NOT EXISTS public.job_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES audit_instances(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL, -- 'email', 'phone', 'whatsapp', 'in_person'
  direction TEXT NOT NULL, -- 'outbound', 'inbound'
  recipient_type TEXT NOT NULL, -- 'supplier', 'manufacturer', 'crew', 'owner'
  recipient_name TEXT,
  recipient_contact TEXT,
  subject TEXT,
  message_content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_status BOOLEAN DEFAULT false,
  response_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_communications
ALTER TABLE public.job_communications ENABLE ROW LEVEL SECURITY;

-- Create policies for job_communications
CREATE POLICY "Users can view job communications" 
ON public.job_communications 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create job communications" 
ON public.job_communications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update job communications" 
ON public.job_communications 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_warranty_claims_updated_at') THEN
    CREATE TRIGGER update_warranty_claims_updated_at
        BEFORE UPDATE ON warranty_claims
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_repair_jobs_updated_at') THEN
    CREATE TRIGGER update_repair_jobs_updated_at
        BEFORE UPDATE ON repair_jobs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_supplier_quotes_updated_at') THEN
    CREATE TRIGGER update_supplier_quotes_updated_at
        BEFORE UPDATE ON supplier_quotes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;