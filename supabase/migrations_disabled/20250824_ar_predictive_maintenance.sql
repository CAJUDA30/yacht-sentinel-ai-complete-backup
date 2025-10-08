-- =============================================
-- YachtExcel AR Troubleshooting & Predictive Maintenance
-- =============================================
-- Advanced AR visualization and AI-powered predictive maintenance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================
-- EQUIPMENT & SYSTEMS REGISTRY
-- =============================================

-- Comprehensive equipment and systems registry for AR tracking
CREATE TABLE IF NOT EXISTS public.equipment_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_id UUID NOT NULL,
    
    -- Equipment identification
    equipment_name TEXT NOT NULL,
    equipment_type TEXT NOT NULL CHECK (equipment_type IN (
        'engine', 'generator', 'hvac', 'navigation', 'communication', 'safety',
        'plumbing', 'electrical', 'hydraulic', 'pneumatic', 'lighting',
        'entertainment', 'galley', 'anchor', 'propulsion', 'steering'
    )),
    equipment_category TEXT NOT NULL CHECK (equipment_category IN (
        'propulsion', 'electrical', 'mechanical', 'electronics', 'safety',
        'comfort', 'navigation', 'communication'
    )),
    
    -- Physical properties
    manufacturer TEXT,
    model_number TEXT,
    serial_number TEXT,
    installation_date DATE,
    warranty_expiry DATE,
    
    -- Location and AR tracking
    deck_level TEXT,
    compartment TEXT,
    location_description TEXT,
    ar_anchor_position JSONB, -- 3D position for AR anchoring
    ar_model_url TEXT, -- URL to 3D model for AR visualization
    ar_scale DECIMAL(5,3) DEFAULT 1.0,
    ar_rotation JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
    
    -- Technical specifications
    specifications JSONB DEFAULT '{}', -- Technical specs, power ratings, etc.
    operating_parameters JSONB DEFAULT '{}', -- Normal operating ranges
    maintenance_intervals JSONB DEFAULT '{}', -- Scheduled maintenance intervals
    
    -- Predictive maintenance configuration
    monitoring_enabled BOOLEAN DEFAULT true,
    prediction_model TEXT, -- AI model used for predictions
    failure_patterns JSONB DEFAULT '[]', -- Known failure patterns
    replacement_cost_usd DECIMAL(10,2),
    criticality_level TEXT CHECK (criticality_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Status and health
    operational_status TEXT DEFAULT 'operational' CHECK (operational_status IN (
        'operational', 'degraded', 'warning', 'failed', 'maintenance', 'offline'
    )),
    health_score DECIMAL(5,2) CHECK (health_score >= 0 AND health_score <= 100),
    last_health_assessment TIMESTAMP WITH TIME ZONE,
    
    -- Maintenance history
    last_maintenance_date DATE,
    next_scheduled_maintenance DATE,
    maintenance_overdue BOOLEAN DEFAULT false,
    
    -- Documentation and manuals
    manual_urls TEXT[],
    documentation_urls TEXT[],
    video_guides TEXT[],
    ar_instructions_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AR MARKERS & SPATIAL ANCHORS
-- =============================================

-- AR spatial anchors for equipment positioning and tracking
CREATE TABLE IF NOT EXISTS public.ar_spatial_anchors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_id UUID NOT NULL,
    equipment_id UUID REFERENCES public.equipment_systems(id),
    
    -- Spatial anchor data
    anchor_type TEXT NOT NULL CHECK (anchor_type IN (
        'equipment_marker', 'compartment_label', 'safety_zone', 'maintenance_point',
        'inspection_point', 'diagnostic_overlay', 'instruction_overlay'
    )),
    anchor_name TEXT NOT NULL,
    
    -- 3D positioning
    position_x DECIMAL(10,6) NOT NULL,
    position_y DECIMAL(10,6) NOT NULL,
    position_z DECIMAL(10,6) NOT NULL,
    rotation_x DECIMAL(8,4) DEFAULT 0,
    rotation_y DECIMAL(8,4) DEFAULT 0,
    rotation_z DECIMAL(8,4) DEFAULT 0,
    scale_factor DECIMAL(5,3) DEFAULT 1.0,
    
    -- Reference system
    coordinate_system TEXT DEFAULT 'yacht_local' CHECK (coordinate_system IN (
        'yacht_local', 'world_gps', 'compartment_local', 'equipment_local'
    )),
    reference_frame TEXT, -- Reference object or coordinate system
    
    -- AR content
    ar_content_type TEXT CHECK (ar_content_type IN (
        '3d_model', 'text_label', 'image_overlay', 'video_overlay', 
        'diagnostic_data', 'instruction_steps', 'warning_indicator'
    )),
    ar_content_url TEXT,
    ar_content_data JSONB,
    
    -- Visibility and interaction
    is_visible BOOLEAN DEFAULT true,
    interaction_enabled BOOLEAN DEFAULT true,
    visibility_conditions JSONB, -- Conditions for when anchor should be visible
    
    -- Accuracy and validation
    positioning_accuracy DECIMAL(5,3), -- Accuracy in meters
    last_calibrated TIMESTAMP WITH TIME ZONE,
    calibration_confidence DECIMAL(3,2) CHECK (calibration_confidence >= 0 AND calibration_confidence <= 1),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PREDICTIVE MAINTENANCE MODELS
-- =============================================

-- AI models and algorithms for predictive maintenance
CREATE TABLE IF NOT EXISTS public.predictive_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT UNIQUE NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN (
        'failure_prediction', 'anomaly_detection', 'remaining_useful_life',
        'maintenance_optimization', 'fault_diagnosis', 'performance_degradation'
    )),
    
    -- Model configuration
    equipment_types TEXT[], -- Types of equipment this model applies to
    input_parameters TEXT[], -- Required sensor inputs
    output_parameters TEXT[], -- Model outputs
    
    -- Model performance
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    last_training_date TIMESTAMP WITH TIME ZONE,
    training_data_size INTEGER,
    
    -- Model configuration
    model_config JSONB NOT NULL,
    hyperparameters JSONB,
    feature_importance JSONB,
    
    -- Deployment info
    model_version TEXT NOT NULL,
    deployment_status TEXT DEFAULT 'development' CHECK (deployment_status IN (
        'development', 'testing', 'staging', 'production', 'deprecated'
    )),
    api_endpoint TEXT,
    
    -- Performance thresholds
    prediction_confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
    alert_threshold DECIMAL(3,2) DEFAULT 0.7,
    maintenance_threshold DECIMAL(3,2) DEFAULT 0.6,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MAINTENANCE PREDICTIONS & ALERTS
-- =============================================

-- AI-generated maintenance predictions and alerts
CREATE TABLE IF NOT EXISTS public.maintenance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment_systems(id),
    model_id UUID REFERENCES public.predictive_models(id),
    
    -- Prediction details
    prediction_type TEXT NOT NULL CHECK (prediction_type IN (
        'failure_risk', 'maintenance_due', 'performance_degradation',
        'anomaly_detected', 'replacement_recommended', 'inspection_needed'
    )),
    prediction_category TEXT NOT NULL CHECK (prediction_category IN (
        'preventive', 'predictive', 'condition_based', 'emergency', 'optimization'
    )),
    
    -- Risk assessment
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    confidence_score DECIMAL(5,4) NOT NULL,
    probability_of_failure DECIMAL(5,4),
    
    -- Timing predictions
    predicted_failure_date DATE,
    remaining_useful_life_days INTEGER,
    recommended_action_date DATE,
    urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'immediate')),
    
    -- Predicted impacts
    estimated_repair_cost DECIMAL(10,2),
    estimated_downtime_hours DECIMAL(8,2),
    safety_impact TEXT CHECK (safety_impact IN ('none', 'low', 'medium', 'high', 'critical')),
    operational_impact TEXT CHECK (operational_impact IN ('none', 'low', 'medium', 'high', 'critical')),
    
    -- Recommendation details
    recommended_action TEXT NOT NULL,
    maintenance_type TEXT CHECK (maintenance_type IN (
        'inspection', 'cleaning', 'lubrication', 'adjustment', 'repair', 
        'replacement', 'upgrade', 'calibration'
    )),
    required_parts JSONB DEFAULT '[]',
    estimated_labor_hours DECIMAL(6,2),
    required_skills TEXT[],
    
    -- Supporting data
    input_data JSONB, -- Sensor data and inputs used for prediction
    model_output JSONB, -- Raw model output
    feature_contributions JSONB, -- Feature importance for this prediction
    
    -- Alert management
    alert_status TEXT DEFAULT 'active' CHECK (alert_status IN (
        'active', 'acknowledged', 'in_progress', 'completed', 'dismissed', 'false_positive'
    )),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Validation and feedback
    prediction_accuracy TEXT CHECK (prediction_accuracy IN (
        'correct', 'partially_correct', 'incorrect', 'too_early', 'too_late', 'pending'
    )),
    actual_failure_date DATE,
    feedback_notes TEXT,
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AR TROUBLESHOOTING SESSIONS
-- =============================================

-- Track AR troubleshooting sessions and user interactions
CREATE TABLE IF NOT EXISTS public.ar_troubleshooting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    yacht_id UUID NOT NULL,
    equipment_id UUID REFERENCES public.equipment_systems(id),
    
    -- Session details
    session_type TEXT NOT NULL CHECK (session_type IN (
        'guided_inspection', 'troubleshooting', 'maintenance_task', 
        'training', 'diagnostic', 'repair_guidance'
    )),
    session_status TEXT DEFAULT 'active' CHECK (session_status IN (
        'active', 'paused', 'completed', 'aborted', 'failed'
    )),
    
    -- Problem and context
    reported_issue TEXT,
    issue_category TEXT CHECK (issue_category IN (
        'mechanical', 'electrical', 'hydraulic', 'pneumatic', 'software',
        'performance', 'noise', 'vibration', 'leakage', 'overheating'
    )),
    issue_severity TEXT CHECK (issue_severity IN ('low', 'medium', 'high', 'critical')),
    
    -- AR session data
    ar_device_info JSONB, -- Device capabilities, camera resolution, etc.
    tracking_quality DECIMAL(3,2), -- AR tracking quality during session
    calibration_data JSONB, -- AR calibration parameters
    
    -- Session progression
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER,
    steps_completed INTEGER DEFAULT 0,
    step_history JSONB DEFAULT '[]', -- History of completed steps
    
    -- Diagnostic results
    diagnostic_results JSONB,
    identified_problems TEXT[],
    recommended_solutions TEXT[],
    parts_identified JSONB DEFAULT '[]',
    
    -- User interaction data
    user_interactions JSONB DEFAULT '[]', -- Touch, gestures, voice commands
    time_spent_seconds INTEGER DEFAULT 0,
    help_requests_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Session outcomes
    issue_resolved BOOLEAN,
    resolution_method TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    maintenance_scheduled BOOLEAN DEFAULT false,
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating >= 1 AND user_satisfaction_rating <= 5),
    
    -- Media and documentation
    photos_taken TEXT[],
    videos_recorded TEXT[],
    voice_notes TEXT[],
    annotations JSONB DEFAULT '[]',
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EQUIPMENT SENSOR DATA (for ML training)
-- =============================================

-- Historical and real-time sensor data for predictive modeling
CREATE TABLE IF NOT EXISTS public.equipment_sensor_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.equipment_systems(id),
    
    -- Sensor information
    sensor_type TEXT NOT NULL,
    sensor_location TEXT,
    measurement_unit TEXT NOT NULL,
    
    -- Data values
    value DECIMAL(15,6) NOT NULL,
    normalized_value DECIMAL(10,6), -- Normalized for ML models
    quality_score DECIMAL(3,2) DEFAULT 1.0, -- Data quality indicator
    
    -- Operating context
    operating_mode TEXT,
    environmental_conditions JSONB,
    load_factor DECIMAL(5,4), -- Operating load as percentage of capacity
    
    -- Data validation
    is_anomaly BOOLEAN DEFAULT false,
    anomaly_score DECIMAL(5,4),
    validation_status TEXT DEFAULT 'valid' CHECK (validation_status IN (
        'valid', 'suspect', 'invalid', 'interpolated', 'estimated'
    )),
    
    -- Timing
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MAINTENANCE WORK ORDERS
-- =============================================

-- Work orders generated from predictive maintenance
CREATE TABLE IF NOT EXISTS public.maintenance_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_id UUID NOT NULL,
    equipment_id UUID NOT NULL REFERENCES public.equipment_systems(id),
    prediction_id UUID REFERENCES public.maintenance_predictions(id),
    
    -- Work order details
    work_order_number TEXT UNIQUE NOT NULL,
    work_order_type TEXT NOT NULL CHECK (work_order_type IN (
        'preventive', 'predictive', 'corrective', 'emergency', 'inspection'
    )),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'emergency')),
    
    -- Task description
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    detailed_instructions TEXT,
    safety_precautions TEXT[],
    required_tools TEXT[],
    required_parts JSONB DEFAULT '[]',
    
    -- Resource requirements
    estimated_duration_hours DECIMAL(6,2),
    required_skill_level TEXT CHECK (required_skill_level IN ('basic', 'intermediate', 'advanced', 'specialist')),
    required_certifications TEXT[],
    
    -- Scheduling
    status TEXT DEFAULT 'planned' CHECK (status IN (
        'planned', 'scheduled', 'in_progress', 'completed', 'canceled', 'deferred'
    )),
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Assignment
    assigned_to UUID,
    team_members UUID[],
    
    -- Cost tracking
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    cost_breakdown JSONB,
    
    -- AR integration
    ar_instructions_available BOOLEAN DEFAULT false,
    ar_session_id UUID REFERENCES public.ar_troubleshooting_sessions(id),
    
    -- Completion details
    completion_notes TEXT,
    issues_encountered TEXT[],
    recommendations TEXT[],
    follow_up_required BOOLEAN DEFAULT false,
    
    -- Quality assurance
    qa_performed BOOLEAN DEFAULT false,
    qa_passed BOOLEAN,
    qa_notes TEXT,
    qa_performed_by UUID,
    
    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS FOR PREDICTIVE MAINTENANCE
-- =============================================

-- Function to calculate equipment health score
CREATE OR REPLACE FUNCTION calculate_equipment_health_score(p_equipment_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    health_score DECIMAL := 100;
    sensor_data RECORD;
    prediction_data RECORD;
    maintenance_factor DECIMAL;
BEGIN
    -- Factor in recent predictions
    SELECT 
        AVG(CASE 
            WHEN risk_level = 'critical' THEN 20
            WHEN risk_level = 'high' THEN 40
            WHEN risk_level = 'medium' THEN 70
            ELSE 90
        END) INTO health_score
    FROM public.maintenance_predictions
    WHERE equipment_id = p_equipment_id
        AND alert_status = 'active'
        AND generated_at >= NOW() - INTERVAL '30 days';

    -- Factor in maintenance history
    SELECT 
        CASE 
            WHEN maintenance_overdue THEN 0.7
            WHEN last_maintenance_date < NOW() - INTERVAL '6 months' THEN 0.8
            WHEN last_maintenance_date < NOW() - INTERVAL '3 months' THEN 0.9
            ELSE 1.0
        END INTO maintenance_factor
    FROM public.equipment_systems
    WHERE id = p_equipment_id;

    health_score := health_score * maintenance_factor;

    -- Ensure score is within bounds
    health_score := GREATEST(LEAST(health_score, 100), 0);

    -- Update equipment record
    UPDATE public.equipment_systems
    SET 
        health_score = health_score,
        last_health_assessment = NOW(),
        updated_at = NOW()
    WHERE id = p_equipment_id;

    RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Function to generate maintenance recommendations
CREATE OR REPLACE FUNCTION generate_maintenance_recommendations(p_yacht_id UUID)
RETURNS TABLE (
    equipment_name TEXT,
    recommendation_type TEXT,
    urgency TEXT,
    description TEXT,
    estimated_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es.equipment_name,
        mp.prediction_type::TEXT as recommendation_type,
        mp.urgency_level::TEXT as urgency,
        mp.recommended_action as description,
        mp.estimated_repair_cost as estimated_cost
    FROM public.maintenance_predictions mp
    JOIN public.equipment_systems es ON mp.equipment_id = es.id
    WHERE es.yacht_id = p_yacht_id
        AND mp.alert_status = 'active'
        AND mp.confidence_score >= 0.7
    ORDER BY 
        CASE mp.urgency_level
            WHEN 'immediate' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            ELSE 4
        END,
        mp.confidence_score DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INDEXES AND CONSTRAINTS
-- =============================================

-- Indexes for equipment systems
CREATE INDEX idx_equipment_systems_yacht ON public.equipment_systems (yacht_id);
CREATE INDEX idx_equipment_systems_type ON public.equipment_systems (equipment_type);
CREATE INDEX idx_equipment_systems_status ON public.equipment_systems (operational_status);
CREATE INDEX idx_equipment_systems_health ON public.equipment_systems (health_score);

-- Indexes for AR anchors
CREATE INDEX idx_ar_anchors_yacht ON public.ar_spatial_anchors (yacht_id);
CREATE INDEX idx_ar_anchors_equipment ON public.ar_spatial_anchors (equipment_id);
CREATE INDEX idx_ar_anchors_type ON public.ar_spatial_anchors (anchor_type);

-- Indexes for predictions
CREATE INDEX idx_predictions_equipment ON public.maintenance_predictions (equipment_id);
CREATE INDEX idx_predictions_status ON public.maintenance_predictions (alert_status);
CREATE INDEX idx_predictions_risk ON public.maintenance_predictions (risk_level);
CREATE INDEX idx_predictions_date ON public.maintenance_predictions (predicted_failure_date);

-- Indexes for sensor data
CREATE INDEX idx_sensor_data_equipment ON public.equipment_sensor_data (equipment_id);
CREATE INDEX idx_sensor_data_recorded ON public.equipment_sensor_data (recorded_at);
CREATE INDEX idx_sensor_data_type ON public.equipment_sensor_data (sensor_type);

-- Indexes for work orders
CREATE INDEX idx_work_orders_yacht ON public.maintenance_work_orders (yacht_id);
CREATE INDEX idx_work_orders_equipment ON public.maintenance_work_orders (equipment_id);
CREATE INDEX idx_work_orders_status ON public.maintenance_work_orders (status);
CREATE INDEX idx_work_orders_priority ON public.maintenance_work_orders (priority);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.equipment_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_spatial_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_troubleshooting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_work_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies (users can access data for their yachts)
CREATE POLICY "Users can access equipment for their yachts"
    ON public.equipment_systems FOR ALL
    USING (
        yacht_id IN (
            SELECT yacht_id FROM user_yacht_access 
            WHERE user_id = auth.uid()
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Users can access AR data for their yachts"
    ON public.ar_spatial_anchors FOR ALL
    USING (
        yacht_id IN (
            SELECT yacht_id FROM user_yacht_access 
            WHERE user_id = auth.uid()
        )
    );

-- Admins can view predictive models
CREATE POLICY "Admins can manage predictive models"
    ON public.predictive_models FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

COMMENT ON TABLE public.equipment_systems IS 'Comprehensive equipment registry with AR tracking and maintenance data';
COMMENT ON TABLE public.ar_spatial_anchors IS 'AR spatial anchors for equipment positioning and visualization';
COMMENT ON TABLE public.predictive_models IS 'AI models for predictive maintenance and fault diagnosis';
COMMENT ON TABLE public.maintenance_predictions IS 'AI-generated maintenance predictions and alerts';
COMMENT ON TABLE public.ar_troubleshooting_sessions IS 'AR troubleshooting sessions and user interactions';