-- Create Document AI Processors table for persistent configuration
CREATE TABLE IF NOT EXISTS public.document_ai_processors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Processor Identity
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    processor_id TEXT NOT NULL UNIQUE, -- Short ID like "8708cd1d9cd87cc1"
    processor_full_id TEXT NOT NULL, -- Full Google Cloud path
    
    -- Configuration
    processor_type TEXT NOT NULL DEFAULT 'CUSTOM_EXTRACTOR',
    location TEXT NOT NULL DEFAULT 'us',
    project_id TEXT NOT NULL DEFAULT '338523806048',
    
    -- Capabilities & Specialization
    specialization TEXT NOT NULL,
    supported_formats TEXT[] DEFAULT ARRAY['PDF', 'PNG', 'JPG', 'JPEG', 'TIFF', 'BMP', 'WEBP']::TEXT[],
    accuracy DECIMAL(3,2) DEFAULT 0.95,
    
    -- Status & Configuration
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1,
    
    -- Processing Settings
    max_pages_per_document INTEGER DEFAULT 50,
    confidence_threshold DECIMAL(3,2) DEFAULT 0.75,
    
    -- Rate Limiting & Costs
    rate_limit_per_minute INTEGER DEFAULT 600,
    estimated_cost_per_page DECIMAL(6,4) DEFAULT 0.05,
    
    -- Metadata
    description TEXT,
    configuration JSONB DEFAULT '{}'::jsonb,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes and RLS
CREATE INDEX IF NOT EXISTS idx_document_ai_processors_active ON public.document_ai_processors(is_active);
CREATE INDEX IF NOT EXISTS idx_document_ai_processors_priority ON public.document_ai_processors(priority);

ALTER TABLE public.document_ai_processors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "authenticated_read_document_ai_processors" ON public.document_ai_processors
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "superadmin_full_access_document_ai_processors" ON public.document_ai_processors
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Insert the 5 specialized Document AI processors
INSERT INTO public.document_ai_processors (
    name, display_name, processor_id, processor_full_id, processor_type,
    specialization, accuracy, is_active, is_primary, priority, description, configuration
) VALUES 
-- 1. Primary Yacht Documents Processor (your existing one)
(
    'yacht-documents-primary',
    'Yacht Documents - Primary Processor',
    '8708cd1d9cd87cc1',
    'projects/338523806048/locations/us/processors/8708cd1d9cd87cc1',
    'CUSTOM_EXTRACTOR',
    'Maritime Documents, Certificates of Registry, Yacht Specifications',
    0.98,
    true,
    true,
    1,
    'Primary processor specialized in yacht certificates, registration documents, and technical specifications.',
    '{
        "optimized_for": ["yacht_certificates", "registration_docs", "specifications"],
        "field_extraction": {
            "vessel_name": true,
            "registration_number": true,
            "certificate_dates": true,
            "owner_information": true,
            "specifications": true
        },
        "training_specialized": true
    }'::jsonb
),
-- 2. Financial Documents Processor
(
    'financial-documents',
    'Financial & Invoice Processor',
    'financial-processor-001',
    'projects/338523806048/locations/us/processors/financial-processor-001',
    'INVOICE_PROCESSOR',
    'Invoices, Purchase Orders, Financial Documents, Receipts',
    0.96,
    true,
    false,
    2,
    'Specialized processor for financial documents, invoices, and purchase orders related to yacht operations.',
    '{
        "optimized_for": ["invoices", "purchase_orders", "receipts", "financial_statements"],
        "currency_detection": true,
        "line_item_extraction": true,
        "vendor_extraction": true
    }'::jsonb
),
-- 3. Legal & Contract Processor
(
    'legal-contracts',
    'Legal & Contract Document Processor',
    'legal-processor-001',
    'projects/338523806048/locations/us/processors/legal-processor-001',
    'CUSTOM_EXTRACTOR',
    'Contracts, Legal Documents, Agreements, Charter Agreements',
    0.94,
    true,
    false,
    3,
    'Advanced processor for legal documents, contracts, and charter agreements.',
    '{
        "optimized_for": ["contracts", "agreements", "charter_contracts", "legal_docs"],
        "clause_extraction": true,
        "party_identification": true,
        "date_extraction": true,
        "liability_clauses": true
    }'::jsonb
),
-- 4. Survey & Inspection Reports
(
    'survey-inspection',
    'Survey & Inspection Report Processor',
    'survey-processor-001',
    'projects/338523806048/locations/us/processors/survey-processor-001',
    'CUSTOM_EXTRACTOR',
    'Survey Reports, Inspection Documents, Technical Assessments',
    0.95,
    true,
    false,
    4,
    'Specialized processor for marine surveys, inspections, and technical assessments.',
    '{
        "optimized_for": ["survey_reports", "inspections", "technical_assessments", "condition_reports"],
        "condition_assessment": true,
        "recommendations_extraction": true,
        "technical_specifications": true,
        "deficiency_identification": true
    }'::jsonb
),
-- 5. Insurance & Compliance Documents
(
    'insurance-compliance',
    'Insurance & Compliance Processor',
    'insurance-processor-001',
    'projects/338523806048/locations/us/processors/insurance-processor-001',
    'CUSTOM_EXTRACTOR',
    'Insurance Policies, Compliance Documents, Certificates, Permits',
    0.93,
    true,
    false,
    5,
    'Processor for insurance documents, compliance certificates, and regulatory permits.',
    '{
        "optimized_for": ["insurance_policies", "compliance_docs", "certificates", "permits"],
        "policy_number_extraction": true,
        "coverage_details": true,
        "expiry_date_detection": true,
        "regulatory_compliance": true
    }'::jsonb
)
ON CONFLICT (processor_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    specialization = EXCLUDED.specialization,
    accuracy = EXCLUDED.accuracy,
    description = EXCLUDED.description,
    configuration = EXCLUDED.configuration,
    updated_at = NOW();

-- Create a view for easy processor selection
CREATE OR REPLACE VIEW public.active_document_processors AS
SELECT 
    id,
    name,
    display_name,
    processor_id,
    processor_full_id,
    processor_type,
    specialization,
    accuracy,
    priority,
    description,
    configuration,
    created_at,
    updated_at
FROM public.document_ai_processors 
WHERE is_active = true 
ORDER BY priority ASC, accuracy DESC;

COMMENT ON TABLE public.document_ai_processors IS 'Document AI processor configurations with specialized capabilities and personalized names';
COMMENT ON VIEW public.active_document_processors IS 'Active Document AI processors ordered by priority and accuracy';