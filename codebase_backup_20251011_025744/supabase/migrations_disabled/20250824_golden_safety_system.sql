-- =============================================
-- YachtExcel Golden Safety Features System
-- =============================================
-- Core safety management with location-based recommendations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================
-- SAFETY ZONES & GEOGRAPHIC BOUNDARIES
-- =============================================

CREATE TABLE IF NOT EXISTS public.safety_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name TEXT NOT NULL,
    zone_type TEXT NOT NULL CHECK (zone_type IN (
        'safe_harbor', 'anchorage', 'marina', 'emergency_services',
        'restricted_area', 'shallow_water', 'reef_area', 'storm_shelter',
        'piracy_risk', 'weather_routing'
    )),
    country TEXT,
    region TEXT,
    center_point GEOGRAPHY(POINT, 4326),
    boundary GEOGRAPHY(POLYGON, 4326),
    facilities JSONB,
    contact_info JSONB,
    safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
    risk_factors TEXT[],
    recommended_actions TEXT[],
    emergency_procedures TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safety_zones_geography ON public.safety_zones USING GIST (center_point);
CREATE INDEX idx_safety_zones_type ON public.safety_zones (zone_type);

-- =============================================
-- WEATHER CONDITIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.weather_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    observation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    data_source TEXT NOT NULL,
    
    -- Weather parameters
    temperature_c DECIMAL(5,2),
    wind_speed_kts DECIMAL(5,2),
    wind_direction_deg INTEGER,
    wave_height_m DECIMAL(4,2),
    visibility_km DECIMAL(6,2),
    
    -- Safety assessments
    safety_score INTEGER CHECK (safety_score >= 1 AND safety_score <= 5),
    risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'extreme')),
    weather_warnings TEXT[],
    navigation_impact TEXT,
    
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weather_location ON public.weather_conditions USING GIST (location);
CREATE INDEX idx_weather_time ON public.weather_conditions (observation_time);

-- =============================================
-- SAFETY PROTOCOLS
-- =============================================

CREATE TABLE IF NOT EXISTS public.safety_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_name TEXT NOT NULL,
    protocol_type TEXT NOT NULL CHECK (protocol_type IN (
        'emergency_procedure', 'navigation_safety', 'weather_protocol',
        'medical_emergency', 'fire_safety', 'man_overboard'
    )),
    severity_level TEXT NOT NULL CHECK (severity_level IN ('routine', 'caution', 'warning', 'emergency', 'mayday')),
    
    trigger_conditions JSONB,
    step_by_step_procedure JSONB,
    required_equipment TEXT[],
    emergency_contacts JSONB,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safety_protocols_type ON public.safety_protocols (protocol_type);

-- =============================================
-- LOCATION-BASED RECOMMENDATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.location_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_id UUID NOT NULL,
    current_location GEOGRAPHY(POINT, 4326) NOT NULL,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
        'route_planning', 'weather_routing', 'safe_harbor',
        'emergency_shelter', 'fuel_stop', 'security_advisory'
    )),
    
    priority_level TEXT NOT NULL CHECK (priority_level IN ('info', 'advisory', 'caution', 'warning', 'urgent')),
    recommendation_title TEXT NOT NULL,
    recommendation_description TEXT NOT NULL,
    
    weather_context JSONB,
    safety_context JSONB,
    immediate_actions TEXT[],
    recommended_locations JSONB,
    
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    recommendation_status TEXT DEFAULT 'active' CHECK (recommendation_status IN ('active', 'acknowledged', 'expired')),
    
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recommendations_yacht ON public.location_recommendations (yacht_id);
CREATE INDEX idx_recommendations_location ON public.location_recommendations USING GIST (current_location);
CREATE INDEX idx_recommendations_active ON public.location_recommendations (yacht_id, recommendation_status) WHERE recommendation_status = 'active';

-- =============================================
-- SAFETY EQUIPMENT
-- =============================================

CREATE TABLE IF NOT EXISTS public.safety_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_id UUID NOT NULL,
    equipment_type TEXT NOT NULL CHECK (equipment_type IN (
        'life_jacket', 'life_raft', 'epirb', 'flares', 'fire_extinguisher',
        'first_aid_kit', 'emergency_radio', 'gps_beacon'
    )),
    equipment_name TEXT NOT NULL,
    location_on_vessel TEXT,
    quantity INTEGER DEFAULT 1,
    
    last_inspection_date DATE,
    next_inspection_due DATE,
    condition_status TEXT DEFAULT 'good' CHECK (condition_status IN ('excellent', 'good', 'fair', 'poor', 'failed')),
    operational_status TEXT DEFAULT 'active' CHECK (operational_status IN ('active', 'inactive', 'expired', 'failed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safety_equipment_yacht ON public.safety_equipment (yacht_id);
CREATE INDEX idx_safety_equipment_inspection ON public.safety_equipment (next_inspection_due);

-- =============================================
-- EMERGENCY CONTACTS
-- =============================================

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name TEXT NOT NULL,
    contact_type TEXT NOT NULL CHECK (contact_type IN (
        'coast_guard', 'marine_rescue', 'medical', 'port_authority', 'marina'
    )),
    organization TEXT,
    
    phone_primary TEXT,
    phone_emergency TEXT,
    email TEXT,
    radio_frequency TEXT,
    
    country TEXT,
    coverage_area GEOGRAPHY(POLYGON, 4326),
    services_provided TEXT[],
    response_time_minutes INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emergency_contacts_type ON public.emergency_contacts (contact_type);
CREATE INDEX idx_emergency_contacts_coverage ON public.emergency_contacts USING GIST (coverage_area);

-- =============================================
-- SAFETY ANALYTICS
-- =============================================

CREATE TABLE IF NOT EXISTS public.safety_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_id UUID NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN (
        'risk_assessment', 'route_safety', 'weather_risk', 'equipment_reliability'
    )),
    analysis_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    overall_safety_score DECIMAL(5,2) CHECK (overall_safety_score >= 0 AND overall_safety_score <= 100),
    risk_level TEXT CHECK (risk_level IN ('very_low', 'low', 'moderate', 'high', 'very_high')),
    
    navigation_safety_score DECIMAL(5,2),
    equipment_safety_score DECIMAL(5,2),
    weather_preparedness_score DECIMAL(5,2),
    
    predicted_risks JSONB,
    key_findings TEXT[],
    action_items JSONB,
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safety_analytics_yacht ON public.safety_analytics (yacht_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get nearest safety zones
CREATE OR REPLACE FUNCTION get_nearest_safety_zones(
    vessel_location GEOGRAPHY,
    zone_types TEXT[] DEFAULT NULL,
    max_distance_km INTEGER DEFAULT 50
)
RETURNS TABLE (
    zone_id UUID,
    zone_name TEXT,
    zone_type TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sz.id,
        sz.zone_name,
        sz.zone_type,
        ROUND((ST_Distance(vessel_location, sz.center_point) / 1000)::DECIMAL, 2)
    FROM public.safety_zones sz
    WHERE sz.is_active = true
        AND (zone_types IS NULL OR sz.zone_type = ANY(zone_types))
        AND ST_Distance(vessel_location, sz.center_point) <= (max_distance_km * 1000)
    ORDER BY ST_Distance(vessel_location, sz.center_point)
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Function to assess safety status
CREATE OR REPLACE FUNCTION assess_current_safety_status(
    p_yacht_id UUID,
    p_current_location GEOGRAPHY
)
RETURNS JSONB AS $$
DECLARE
    safety_assessment JSONB;
    weather_risk TEXT;
    equipment_issues INTEGER;
    overall_score DECIMAL;
BEGIN
    -- Get weather risk
    SELECT risk_level INTO weather_risk
    FROM public.weather_conditions
    WHERE ST_DWithin(location, p_current_location, 10000)
        AND observation_time > NOW() - INTERVAL '3 hours'
    ORDER BY observation_time DESC
    LIMIT 1;

    -- Count equipment issues
    SELECT COUNT(*) INTO equipment_issues
    FROM public.safety_equipment
    WHERE yacht_id = p_yacht_id
        AND operational_status IN ('failed', 'expired');

    -- Calculate score
    overall_score := 100;
    
    CASE weather_risk
        WHEN 'high' THEN overall_score := overall_score - 30;
        WHEN 'extreme' THEN overall_score := overall_score - 50;
        ELSE NULL;
    END CASE;
    
    overall_score := overall_score - (equipment_issues * 10);
    overall_score := GREATEST(overall_score, 0);

    safety_assessment := jsonb_build_object(
        'overall_score', overall_score,
        'risk_level', CASE 
            WHEN overall_score >= 80 THEN 'low'
            WHEN overall_score >= 60 THEN 'moderate'
            ELSE 'high'
        END,
        'weather_risk', COALESCE(weather_risk, 'unknown'),
        'equipment_issues', equipment_issues,
        'assessed_at', NOW()
    );

    RETURN safety_assessment;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.safety_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_equipment ENABLE ROW LEVEL SECURITY;

-- Public data policies
CREATE POLICY "Safety zones are publicly readable"
    ON public.safety_zones FOR SELECT
    USING (is_active = true);

CREATE POLICY "Weather conditions are publicly readable"
    ON public.weather_conditions FOR SELECT
    USING (true);

-- Yacht-specific policies
CREATE POLICY "Users can view recommendations for accessible yachts"
    ON public.location_recommendations FOR SELECT
    USING (
        yacht_id IN (
            SELECT yr.id FROM public.yacht_registry yr
            WHERE yr.owner_entity_id IN (
                SELECT entity_id FROM public.user_entity_access 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage equipment for accessible yachts"
    ON public.safety_equipment FOR ALL
    USING (
        yacht_id IN (
            SELECT yr.id FROM public.yacht_registry yr
            WHERE yr.owner_entity_id IN (
                SELECT entity_id FROM public.user_entity_access 
                WHERE user_id = auth.uid()
            )
        )
    );

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample safety zones
INSERT INTO public.safety_zones (zone_name, zone_type, country, center_point, safety_rating, facilities) VALUES 
('Monaco Harbor', 'safe_harbor', 'Monaco', ST_GeogFromText('POINT(7.4246 43.7384)'), 5, '{"fuel": true, "repairs": true, "customs": true}'::jsonb),
('Port de Cannes', 'marina', 'France', ST_GeogFromText('POINT(7.0174 43.5503)'), 4, '{"fuel": true, "provisions": true}'::jsonb),
('Gibraltar Harbor', 'safe_harbor', 'Gibraltar', ST_GeogFromText('POINT(-5.3536 36.1408)'), 5, '{"fuel": true, "repairs": true, "medical": true}'::jsonb);

-- Insert sample emergency contacts
INSERT INTO public.emergency_contacts (contact_name, contact_type, organization, phone_emergency, country, services_provided) VALUES 
('French Coast Guard', 'coast_guard', 'CROSS Med', '+33-4-94-61-71-10', 'France', ARRAY['rescue', 'medical_evacuation']),
('Monaco Marine Police', 'coast_guard', 'Monaco Police', '+377-93-15-30-15', 'Monaco', ARRAY['rescue', 'security']),
('Gibraltar Port Authority', 'port_authority', 'Gibraltar Port', '+350-200-46222', 'Gibraltar', ARRAY['port_services', 'customs']);

COMMENT ON TABLE public.safety_zones IS 'Geographic safety zones with facilities and emergency information';
COMMENT ON TABLE public.weather_conditions IS 'Real-time and forecast weather data with safety assessments';
COMMENT ON TABLE public.location_recommendations IS 'AI-generated safety recommendations based on location and conditions';