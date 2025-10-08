-- =============================================
-- YachtExcel Centralized Registry System
-- =============================================
-- Comprehensive registry for suppliers, clients, yachts, and business relationships
-- with advanced search, categorization, and relationship management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- YACHT FLEET REGISTRY
-- =============================================

-- Enhanced yacht registry with detailed specifications
CREATE TABLE IF NOT EXISTS public.yacht_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_name TEXT NOT NULL,
    imo_number TEXT UNIQUE, -- International Maritime Organization number
    mmsi_number TEXT UNIQUE, -- Maritime Mobile Service Identity
    call_sign TEXT,
    flag_state TEXT,
    yacht_type TEXT NOT NULL CHECK (yacht_type IN ('motor_yacht', 'sailing_yacht', 'catamaran', 'trimaran', 'expedition', 'classic', 'superyacht', 'megayacht', 'explorer')),
    yacht_category TEXT NOT NULL CHECK (yacht_category IN ('private', 'charter', 'commercial', 'research', 'government')),
    length_overall_m DECIMAL(10,2),
    beam_m DECIMAL(10,2),
    draft_m DECIMAL(10,2),
    gross_tonnage DECIMAL(10,2),
    displacement_tons DECIMAL(10,2),
    year_built INTEGER,
    builder TEXT,
    designer TEXT,
    hull_material TEXT CHECK (hull_material IN ('fiberglass', 'aluminum', 'steel', 'carbon_fiber', 'wood', 'composite')),
    engine_make TEXT,
    engine_model TEXT,
    engine_power_hp INTEGER,
    fuel_capacity_l DECIMAL(10,2),
    water_capacity_l DECIMAL(10,2),
    max_speed_knots DECIMAL(5,2),
    cruising_speed_knots DECIMAL(5,2),
    range_nm DECIMAL(10,2),
    guests_capacity INTEGER,
    crew_capacity INTEGER,
    cabins_count INTEGER,
    heads_count INTEGER,
    home_port TEXT,
    current_location JSONB, -- {lat, lng, port_name, country}
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry_date DATE,
    classification_society TEXT,
    mca_code TEXT, -- Maritime and Coastguard Agency code
    class_notation TEXT,
    certificate_expiry_dates JSONB, -- Various maritime certificates
    owner_entity_id UUID REFERENCES public.business_entities(id),
    management_company_id UUID REFERENCES public.business_entities(id),
    captain_name TEXT,
    captain_license TEXT,
    captain_contact JSONB,
    specifications JSONB, -- Technical specifications, equipment lists
    amenities JSONB, -- Entertainment, sports, special features
    charter_rate JSONB, -- Pricing information for charter yachts
    images_urls TEXT[],
    documents_urls TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_available_for_charter BOOLEAN DEFAULT false,
    last_survey_date DATE,
    next_survey_due DATE,
    registry_notes TEXT,
    search_vector tsvector,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for yacht registry
CREATE INDEX idx_yacht_registry_search ON public.yacht_registry USING GIN (search_vector);
CREATE INDEX idx_yacht_registry_type ON public.yacht_registry (yacht_type);
CREATE INDEX idx_yacht_registry_category ON public.yacht_registry (yacht_category);
CREATE INDEX idx_yacht_registry_location ON public.yacht_registry USING GIN (current_location);
CREATE INDEX idx_yacht_registry_owner ON public.yacht_registry (owner_entity_id);
CREATE INDEX idx_yacht_registry_management ON public.yacht_registry (management_company_id);

-- =============================================
-- BUSINESS ENTITIES REGISTRY
-- =============================================

-- Unified registry for suppliers, clients, management companies, etc.
CREATE TABLE IF NOT EXISTS public.business_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'supplier', 'vendor', 'contractor', 'service_provider', 'marina', 'shipyard', 
        'fuel_supplier', 'food_supplier', 'charter_client', 'yacht_owner', 
        'management_company', 'insurance_company', 'bank', 'broker', 'agent',
        'government_agency', 'classification_society', 'certification_body'
    )),
    business_type TEXT CHECK (business_type IN ('individual', 'company', 'corporation', 'government', 'nonprofit')),
    industry_category TEXT[],
    company_registration_number TEXT,
    tax_id TEXT,
    duns_number TEXT, -- Dun & Bradstreet number
    primary_contact_person TEXT,
    website_url TEXT,
    email_primary TEXT,
    phone_primary TEXT,
    phone_secondary TEXT,
    fax TEXT,
    
    -- Address information
    addresses JSONB NOT NULL DEFAULT '[]', -- Array of address objects
    -- [{type: 'headquarters|billing|shipping|service', street, city, state, postal_code, country, is_primary}]
    
    -- Financial information
    payment_terms TEXT,
    credit_limit DECIMAL(12,2),
    payment_methods TEXT[],
    bank_details JSONB,
    currency_preference TEXT DEFAULT 'USD',
    
    -- Supplier/Vendor specific
    supplier_categories TEXT[], -- What they supply
    service_areas TEXT[], -- Geographic service areas
    certifications JSONB, -- Industry certifications
    quality_rating DECIMAL(3,2) CHECK (quality_rating >= 0 AND quality_rating <= 5),
    reliability_score DECIMAL(3,2) CHECK (reliability_score >= 0 AND reliability_score <= 5),
    last_performance_review DATE,
    
    -- Client specific
    client_tier TEXT CHECK (client_tier IN ('platinum', 'gold', 'silver', 'bronze', 'standard')),
    total_contract_value DECIMAL(15,2),
    last_transaction_date DATE,
    
    -- Relationship management
    relationship_manager TEXT,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended', 'blacklisted', 'pending_approval')),
    contract_details JSONB,
    insurance_coverage JSONB,
    emergency_contacts JSONB,
    
    -- Documentation
    documents_urls TEXT[],
    compliance_documents JSONB,
    contract_documents JSONB,
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    internal_notes TEXT, -- Private notes not visible to entity
    search_vector tsvector,
    is_verified BOOLEAN DEFAULT false,
    verification_date DATE,
    created_by UUID REFERENCES auth.users(id),
    last_updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for business entities
CREATE INDEX idx_business_entities_search ON public.business_entities USING GIN (search_vector);
CREATE INDEX idx_business_entities_type ON public.business_entities (entity_type);
CREATE INDEX idx_business_entities_industry ON public.business_entities USING GIN (industry_category);
CREATE INDEX idx_business_entities_status ON public.business_entities (account_status);
CREATE INDEX idx_business_entities_location ON public.business_entities USING GIN (addresses);
CREATE INDEX idx_business_entities_tags ON public.business_entities USING GIN (tags);

-- =============================================
-- CONTACT MANAGEMENT
-- =============================================

-- Detailed contact management for each business entity
CREATE TABLE IF NOT EXISTS public.entity_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL CHECK (contact_type IN (
        'primary', 'secondary', 'emergency', 'technical', 'financial', 'legal', 
        'operations', 'sales', 'support', 'management', 'captain', 'engineer'
    )),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    title TEXT,
    department TEXT,
    email TEXT,
    phone_work TEXT,
    phone_mobile TEXT,
    phone_direct TEXT,
    languages_spoken TEXT[],
    time_zone TEXT,
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp', 'text')),
    availability_hours JSONB, -- Business hours, time zones
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entity_contacts_entity ON public.entity_contacts (entity_id);
CREATE INDEX idx_entity_contacts_type ON public.entity_contacts (contact_type);
CREATE INDEX idx_entity_contacts_primary ON public.entity_contacts (entity_id, is_primary) WHERE is_primary = true;

-- =============================================
-- PRODUCT & SERVICE CATALOG
-- =============================================

-- Comprehensive catalog of products and services offered by suppliers
CREATE TABLE IF NOT EXISTS public.product_service_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
    catalog_type TEXT NOT NULL CHECK (catalog_type IN ('product', 'service', 'package')),
    category TEXT NOT NULL, -- Main category (fuel, food, maintenance, parts, etc.)
    subcategory TEXT,
    item_name TEXT NOT NULL,
    item_description TEXT,
    item_code TEXT, -- Supplier's internal code
    manufacturer TEXT,
    brand TEXT,
    model_number TEXT,
    specifications JSONB,
    unit_of_measure TEXT, -- liters, kg, hours, pieces, etc.
    
    -- Pricing information
    base_price DECIMAL(12,2),
    currency TEXT DEFAULT 'USD',
    pricing_tiers JSONB, -- Volume discounts, special pricing
    minimum_order_quantity DECIMAL(10,2),
    lead_time_days INTEGER,
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'limited', 'backorder', 'discontinued')),
    
    -- Geographic and operational
    service_regions TEXT[],
    delivery_options JSONB,
    installation_available BOOLEAN DEFAULT false,
    warranty_terms TEXT,
    
    -- Quality and compliance
    certifications TEXT[],
    compliance_standards TEXT[],
    quality_grade TEXT,
    environmental_rating TEXT,
    
    -- Documentation
    datasheet_url TEXT,
    manual_url TEXT,
    image_urls TEXT[],
    video_urls TEXT[],
    
    -- Metadata
    tags TEXT[],
    search_vector tsvector,
    is_active BOOLEAN DEFAULT true,
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for product/service catalog
CREATE INDEX idx_catalog_search ON public.product_service_catalog USING GIN (search_vector);
CREATE INDEX idx_catalog_supplier ON public.product_service_catalog (supplier_id);
CREATE INDEX idx_catalog_category ON public.product_service_catalog (category, subcategory);
CREATE INDEX idx_catalog_type ON public.product_service_catalog (catalog_type);
CREATE INDEX idx_catalog_availability ON public.product_service_catalog (availability_status);
CREATE INDEX idx_catalog_tags ON public.product_service_catalog USING GIN (tags);

-- =============================================
-- RELATIONSHIP MAPPING
-- =============================================

-- Track relationships between entities (partnerships, subsidiaries, etc.)
CREATE TABLE IF NOT EXISTS public.entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_a_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
    entity_b_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'subsidiary', 'parent_company', 'partner', 'preferred_vendor', 'exclusive_supplier',
        'agent', 'representative', 'distributor', 'reseller', 'competitor', 'alliance'
    )),
    relationship_status TEXT DEFAULT 'active' CHECK (relationship_status IN ('active', 'inactive', 'pending', 'terminated')),
    start_date DATE,
    end_date DATE,
    contract_reference TEXT,
    relationship_details JSONB,
    exclusivity_terms JSONB,
    performance_metrics JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT no_self_relationship CHECK (entity_a_id != entity_b_id),
    CONSTRAINT unique_relationship UNIQUE (entity_a_id, entity_b_id, relationship_type)
);

CREATE INDEX idx_entity_relationships_a ON public.entity_relationships (entity_a_id);
CREATE INDEX idx_entity_relationships_b ON public.entity_relationships (entity_b_id);
CREATE INDEX idx_entity_relationships_type ON public.entity_relationships (relationship_type);

-- =============================================
-- PERFORMANCE TRACKING
-- =============================================

-- Track performance metrics for suppliers and service providers
CREATE TABLE IF NOT EXISTS public.entity_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
    metric_period DATE NOT NULL, -- Monthly tracking
    transactions_count INTEGER DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2), -- Percentage
    quality_score DECIMAL(3,2), -- 1-5 scale
    customer_satisfaction DECIMAL(3,2), -- 1-5 scale
    response_time_hours DECIMAL(8,2),
    complaint_count INTEGER DEFAULT 0,
    resolution_rate DECIMAL(5,2), -- Percentage
    cost_competitiveness DECIMAL(3,2), -- 1-5 scale
    innovation_score DECIMAL(3,2), -- 1-5 scale
    sustainability_score DECIMAL(3,2), -- 1-5 scale
    compliance_score DECIMAL(3,2), -- 1-5 scale
    overall_rating DECIMAL(3,2), -- Calculated overall score
    performance_notes TEXT,
    review_date DATE DEFAULT CURRENT_DATE,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_entity ON public.entity_performance_metrics (entity_id);
CREATE INDEX idx_performance_metrics_period ON public.entity_performance_metrics (metric_period);
CREATE INDEX idx_performance_metrics_rating ON public.entity_performance_metrics (overall_rating);

-- =============================================
-- REGISTRY SEARCH & EMBEDDINGS
-- =============================================

-- Embeddings for semantic search across registry
CREATE TABLE IF NOT EXISTS public.registry_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('yacht', 'business_entity', 'product_service', 'contact')),
    entity_id UUID NOT NULL,
    content_hash TEXT NOT NULL,
    embedding vector(1536), -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_entity_embedding UNIQUE (entity_type, entity_id)
);

CREATE INDEX idx_registry_embeddings_vector ON public.registry_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_registry_embeddings_entity ON public.registry_embeddings (entity_type, entity_id);

-- =============================================
-- REGISTRY ACTIVITY LOG
-- =============================================

-- Track all registry changes and activities
CREATE TABLE IF NOT EXISTS public.registry_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view', 'search', 'export', 'import')),
    user_id UUID REFERENCES auth.users(id),
    changes JSONB, -- What changed (for updates)
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_registry_activity_entity ON public.registry_activity_log (entity_type, entity_id);
CREATE INDEX idx_registry_activity_user ON public.registry_activity_log (user_id);
CREATE INDEX idx_registry_activity_date ON public.registry_activity_log (created_at);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_registry_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    -- Update yacht registry search vector
    IF TG_TABLE_NAME = 'yacht_registry' THEN
        NEW.search_vector := to_tsvector('english', 
            COALESCE(NEW.yacht_name, '') || ' ' ||
            COALESCE(NEW.imo_number, '') || ' ' ||
            COALESCE(NEW.call_sign, '') || ' ' ||
            COALESCE(NEW.builder, '') || ' ' ||
            COALESCE(NEW.designer, '') || ' ' ||
            COALESCE(NEW.engine_make, '') || ' ' ||
            COALESCE(NEW.engine_model, '') || ' ' ||
            COALESCE(NEW.home_port, '')
        );
    END IF;
    
    -- Update business entities search vector
    IF TG_TABLE_NAME = 'business_entities' THEN
        NEW.search_vector := to_tsvector('english',
            COALESCE(NEW.entity_name, '') || ' ' ||
            COALESCE(NEW.company_registration_number, '') || ' ' ||
            COALESCE(NEW.primary_contact_person, '') || ' ' ||
            COALESCE(array_to_string(NEW.industry_category, ' '), '') || ' ' ||
            COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
            COALESCE(NEW.notes, '')
        );
    END IF;
    
    -- Update product/service catalog search vector
    IF TG_TABLE_NAME = 'product_service_catalog' THEN
        NEW.search_vector := to_tsvector('english',
            COALESCE(NEW.item_name, '') || ' ' ||
            COALESCE(NEW.item_description, '') || ' ' ||
            COALESCE(NEW.item_code, '') || ' ' ||
            COALESCE(NEW.manufacturer, '') || ' ' ||
            COALESCE(NEW.brand, '') || ' ' ||
            COALESCE(NEW.model_number, '') || ' ' ||
            COALESCE(NEW.category, '') || ' ' ||
            COALESCE(NEW.subcategory, '') || ' ' ||
            COALESCE(array_to_string(NEW.tags, ' '), '')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for search vector updates
CREATE TRIGGER yacht_registry_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.yacht_registry
    FOR EACH ROW EXECUTE FUNCTION update_registry_search_vector();

CREATE TRIGGER business_entities_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.business_entities
    FOR EACH ROW EXECUTE FUNCTION update_registry_search_vector();

CREATE TRIGGER catalog_search_vector_trigger
    BEFORE INSERT OR UPDATE ON public.product_service_catalog
    FOR EACH ROW EXECUTE FUNCTION update_registry_search_vector();

-- Function to log registry activities
CREATE OR REPLACE FUNCTION log_registry_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.registry_activity_log (
        entity_type,
        entity_id,
        action_type,
        user_id,
        changes
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE TG_OP 
            WHEN 'INSERT' THEN 'create'
            WHEN 'UPDATE' THEN 'update' 
            WHEN 'DELETE' THEN 'delete'
        END,
        COALESCE(NEW.last_updated_by, NEW.created_by, OLD.last_updated_by),
        CASE TG_OP
            WHEN 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
            WHEN 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create activity logging triggers
CREATE TRIGGER yacht_registry_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.yacht_registry
    FOR EACH ROW EXECUTE FUNCTION log_registry_activity();

CREATE TRIGGER business_entities_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.business_entities
    FOR EACH ROW EXECUTE FUNCTION log_registry_activity();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_registry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create timestamp update triggers
CREATE TRIGGER yacht_registry_timestamp_trigger
    BEFORE UPDATE ON public.yacht_registry
    FOR EACH ROW EXECUTE FUNCTION update_registry_timestamp();

CREATE TRIGGER business_entities_timestamp_trigger
    BEFORE UPDATE ON public.business_entities
    FOR EACH ROW EXECUTE FUNCTION update_registry_timestamp();

CREATE TRIGGER entity_contacts_timestamp_trigger
    BEFORE UPDATE ON public.entity_contacts
    FOR EACH ROW EXECUTE FUNCTION update_registry_timestamp();

CREATE TRIGGER catalog_timestamp_trigger
    BEFORE UPDATE ON public.product_service_catalog
    FOR EACH ROW EXECUTE FUNCTION update_registry_timestamp();

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.yacht_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for yacht registry (yacht-specific access)
CREATE POLICY "Users can view yachts they have access to"
    ON public.yacht_registry FOR SELECT
    USING (
        owner_entity_id IN (
            SELECT entity_id FROM public.user_entity_access 
            WHERE user_id = auth.uid()
        ) OR
        management_company_id IN (
            SELECT entity_id FROM public.user_entity_access 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage yachts they have access to"
    ON public.yacht_registry FOR ALL
    USING (
        owner_entity_id IN (
            SELECT entity_id FROM public.user_entity_access 
            WHERE user_id = auth.uid() AND access_level IN ('admin', 'manager')
        ) OR
        management_company_id IN (
            SELECT entity_id FROM public.user_entity_access 
            WHERE user_id = auth.uid() AND access_level IN ('admin', 'manager')
        )
    );

-- RLS policies for business entities
CREATE POLICY "Users can view business entities"
    ON public.business_entities FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create business entities"
    ON public.business_entities FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update entities they created or have access to"
    ON public.business_entities FOR UPDATE
    USING (
        created_by = auth.uid() OR
        id IN (
            SELECT entity_id FROM public.user_entity_access 
            WHERE user_id = auth.uid() AND access_level IN ('admin', 'manager')
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Users can view entity contacts"
    ON public.entity_contacts FOR SELECT
    USING (
        entity_id IN (
            SELECT id FROM public.business_entities 
            WHERE created_by = auth.uid() OR
            id IN (
                SELECT entity_id FROM public.user_entity_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view product catalog"
    ON public.product_service_catalog FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Suppliers can manage their catalog"
    ON public.product_service_catalog FOR ALL
    USING (
        supplier_id IN (
            SELECT entity_id FROM public.user_entity_access 
            WHERE user_id = auth.uid() AND access_level IN ('admin', 'manager')
        )
    );

-- Create user entity access table for permissions
CREATE TABLE IF NOT EXISTS public.user_entity_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL CHECK (access_level IN ('viewer', 'editor', 'manager', 'admin')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT unique_user_entity_access UNIQUE (user_id, entity_id)
);

ALTER TABLE public.user_entity_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access"
    ON public.user_entity_access FOR SELECT
    USING (user_id = auth.uid());

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample business entities
INSERT INTO public.business_entities (
    entity_name, entity_type, business_type, industry_category,
    email_primary, phone_primary, addresses, account_status
) VALUES 
(
    'Monaco Marine Services', 'supplier', 'company', 
    ARRAY['maintenance', 'repair', 'refit'],
    'contact@monacomarine.com', '+377-93-123456',
    '[{"type": "headquarters", "street": "Port Hercule", "city": "Monaco", "country": "Monaco", "is_primary": true}]'::jsonb,
    'active'
),
(
    'Mediterranean Yacht Supplies', 'supplier', 'company',
    ARRAY['provisioning', 'equipment', 'parts'],
    'sales@medyachtsupplies.com', '+33-4-93-876543',
    '[{"type": "headquarters", "street": "Port de Cannes", "city": "Cannes", "country": "France", "is_primary": true}]'::jsonb,
    'active'
),
(
    'Caribbean Charter Solutions', 'charter_client', 'company',
    ARRAY['charter_management', 'guest_services'],
    'bookings@caribbeancharter.com', '+1-340-555-0123',
    '[{"type": "headquarters", "street": "Yacht Haven Grande", "city": "St. Thomas", "country": "US Virgin Islands", "is_primary": true}]'::jsonb,
    'active'
);

-- Insert sample yacht
INSERT INTO public.yacht_registry (
    yacht_name, yacht_type, yacht_category, length_overall_m, year_built,
    builder, home_port, current_location, is_active
) VALUES (
    'Serenity Star', 'motor_yacht', 'private', 65.5, 2019,
    'Feadship', 'Monaco', 
    '{"lat": 43.7384, "lng": 7.4246, "port_name": "Port Hercule", "country": "Monaco"}'::jsonb,
    true
);

COMMENT ON TABLE public.yacht_registry IS 'Comprehensive yacht fleet registry with detailed specifications and operational data';
COMMENT ON TABLE public.business_entities IS 'Unified registry for all business entities including suppliers, clients, and service providers';
COMMENT ON TABLE public.product_service_catalog IS 'Complete catalog of products and services offered by registered suppliers';
COMMENT ON TABLE public.entity_relationships IS 'Business relationship mapping between entities';
COMMENT ON TABLE public.entity_performance_metrics IS 'Performance tracking and rating system for suppliers and service providers';