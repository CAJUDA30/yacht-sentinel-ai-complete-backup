-- =============================================
-- YachtExcel Self-Learning Loop System
-- =============================================
-- Comprehensive feedback aggregation, model tuning, and continuous improvement

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================
-- USER FEEDBACK & INTERACTIONS
-- =============================================

-- Comprehensive user feedback collection
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    yacht_id UUID,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN (
        'ai_response_rating', 'feature_feedback', 'bug_report', 'suggestion',
        'recommendation_feedback', 'prediction_accuracy', 'user_experience',
        'workflow_efficiency', 'safety_feedback', 'performance_feedback'
    )),
    feedback_category TEXT NOT NULL CHECK (feedback_category IN (
        'yachtie_ai', 'safety_recommendations', 'maintenance_predictions',
        'expense_management', 'inventory_management', 'weather_routing',
        'equipment_monitoring', 'user_interface', 'data_accuracy', 'general'
    )),
    
    -- Feedback content
    feedback_title TEXT,
    feedback_description TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    
    -- Context information
    interaction_context JSONB, -- Original AI interaction or system state
    user_input TEXT, -- What the user asked/did
    system_output TEXT, -- What the system provided
    expected_output TEXT, -- What the user expected
    actual_outcome TEXT, -- What actually happened
    
    -- Feedback specifics
    accuracy_assessment TEXT CHECK (accuracy_assessment IN ('very_accurate', 'accurate', 'partially_accurate', 'inaccurate', 'very_inaccurate')),
    usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
    clarity_rating INTEGER CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    
    -- Impact assessment
    time_saved_minutes INTEGER,
    cost_impact_usd DECIMAL(10,2),
    safety_impact TEXT CHECK (safety_impact IN ('positive', 'neutral', 'negative', 'critical')),
    operational_impact TEXT CHECK (operational_impact IN ('significant_improvement', 'improvement', 'no_change', 'minor_issue', 'major_issue')),
    
    -- Follow-up actions
    suggested_improvements TEXT,
    would_recommend BOOLEAN,
    likelihood_to_use_again INTEGER CHECK (likelihood_to_use_again >= 1 AND likelihood_to_use_again <= 5),
    
    -- Processing status
    feedback_status TEXT DEFAULT 'pending' CHECK (feedback_status IN ('pending', 'reviewed', 'processed', 'implemented', 'rejected')),
    processing_notes TEXT,
    response_provided TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    
    -- Metadata
    device_info JSONB,
    session_id TEXT,
    interaction_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user feedback
CREATE INDEX idx_user_feedback_user ON public.user_feedback (user_id);
CREATE INDEX idx_user_feedback_type ON public.user_feedback (feedback_type);
CREATE INDEX idx_user_feedback_category ON public.user_feedback (feedback_category);
CREATE INDEX idx_user_feedback_rating ON public.user_feedback (rating);
CREATE INDEX idx_user_feedback_status ON public.user_feedback (feedback_status);
CREATE INDEX idx_user_feedback_created ON public.user_feedback (created_at);

-- =============================================
-- AI MODEL PERFORMANCE TRACKING
-- =============================================

-- Track performance of different AI models and components
CREATE TABLE IF NOT EXISTS public.ai_model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    model_version TEXT NOT NULL,
    model_type TEXT NOT NULL CHECK (model_type IN (
        'llm_consensus', 'yachtie_ai', 'safety_prediction', 'maintenance_prediction',
        'expense_classification', 'ocr_processing', 'recommendation_engine',
        'anomaly_detection', 'weather_analysis', 'route_optimization'
    )),
    deployment_environment TEXT DEFAULT 'production' CHECK (deployment_environment IN ('development', 'staging', 'production')),
    
    -- Performance metrics
    evaluation_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    evaluation_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_interactions INTEGER DEFAULT 0,
    successful_interactions INTEGER DEFAULT 0,
    failed_interactions INTEGER DEFAULT 0,
    
    -- Accuracy metrics
    accuracy_score DECIMAL(5,4), -- 0.0000 to 1.0000
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    confidence_score DECIMAL(5,4),
    
    -- Response time metrics
    avg_response_time_ms DECIMAL(10,2),
    median_response_time_ms DECIMAL(10,2),
    p95_response_time_ms DECIMAL(10,2),
    p99_response_time_ms DECIMAL(10,2),
    
    -- User satisfaction metrics
    avg_user_rating DECIMAL(3,2),
    user_satisfaction_rate DECIMAL(5,4),
    recommendation_adoption_rate DECIMAL(5,4),
    user_retention_rate DECIMAL(5,4),
    
    -- Business impact metrics
    cost_savings_usd DECIMAL(12,2),
    time_savings_hours DECIMAL(10,2),
    error_reduction_rate DECIMAL(5,4),
    efficiency_improvement_rate DECIMAL(5,4),
    
    -- Model-specific metrics
    hallucination_rate DECIMAL(5,4), -- For LLMs
    false_positive_rate DECIMAL(5,4),
    false_negative_rate DECIMAL(5,4),
    drift_score DECIMAL(5,4), -- Model drift detection
    
    -- Resource utilization
    avg_tokens_used INTEGER,
    avg_computation_cost_usd DECIMAL(8,4),
    resource_efficiency_score DECIMAL(5,4),
    
    -- Comparative analysis
    baseline_performance JSONB, -- Previous model performance
    improvement_metrics JSONB, -- Improvements over baseline
    degradation_alerts JSONB, -- Performance degradation warnings
    
    -- Metadata
    evaluation_methodology TEXT,
    test_dataset_size INTEGER,
    evaluation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for model performance
CREATE INDEX idx_model_performance_name ON public.ai_model_performance (model_name);
CREATE INDEX idx_model_performance_type ON public.ai_model_performance (model_type);
CREATE INDEX idx_model_performance_period ON public.ai_model_performance (evaluation_period_start, evaluation_period_end);
CREATE INDEX idx_model_performance_accuracy ON public.ai_model_performance (accuracy_score);

-- =============================================
-- LEARNING PATTERNS & INSIGHTS
-- =============================================

-- Capture learning patterns and insights from user behavior
CREATE TABLE IF NOT EXISTS public.learning_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'user_behavior', 'usage_pattern', 'preference_pattern', 'error_pattern',
        'workflow_pattern', 'seasonal_pattern', 'performance_pattern', 'interaction_pattern'
    )),
    pattern_name TEXT NOT NULL,
    pattern_description TEXT,
    
    -- Pattern identification
    detection_method TEXT CHECK (detection_method IN ('rule_based', 'statistical', 'ml_clustering', 'manual_identification')),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    significance_level DECIMAL(3,2),
    
    -- Pattern data
    pattern_data JSONB NOT NULL,
    supporting_evidence JSONB,
    statistical_measures JSONB,
    
    -- Scope and applicability
    applies_to_users TEXT[], -- User segments this pattern applies to
    applies_to_yachts TEXT[], -- Yacht types/categories
    applies_to_features TEXT[], -- System features
    geographic_scope TEXT[], -- Geographic regions
    temporal_scope JSONB, -- Time periods, seasons, etc.
    
    -- Impact and implications
    business_impact TEXT CHECK (business_impact IN ('high', 'medium', 'low', 'negligible')),
    user_experience_impact TEXT CHECK (user_experience_impact IN ('positive', 'neutral', 'negative')),
    operational_efficiency_impact DECIMAL(5,2), -- Percentage improvement/degradation
    
    -- Actionable insights
    recommended_actions JSONB,
    implementation_priority TEXT CHECK (implementation_priority IN ('critical', 'high', 'medium', 'low')),
    estimated_effort TEXT CHECK (estimated_effort IN ('minimal', 'low', 'medium', 'high', 'extensive')),
    expected_roi DECIMAL(5,2), -- Expected return on investment
    
    -- Validation and tracking
    validation_status TEXT DEFAULT 'identified' CHECK (validation_status IN ('identified', 'validated', 'implemented', 'tested', 'deployed')),
    validation_results JSONB,
    implementation_status TEXT DEFAULT 'pending' CHECK (implementation_status IN ('pending', 'in_progress', 'completed', 'abandoned')),
    
    -- Metadata
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_validated_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT, -- System or analyst
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for learning patterns
CREATE INDEX idx_learning_patterns_type ON public.learning_patterns (pattern_type);
CREATE INDEX idx_learning_patterns_confidence ON public.learning_patterns (confidence_score);
CREATE INDEX idx_learning_patterns_impact ON public.learning_patterns (business_impact);
CREATE INDEX idx_learning_patterns_status ON public.learning_patterns (validation_status);

-- =============================================
-- MODEL TRAINING JOBS & EXPERIMENTS
-- =============================================

-- Track model training, fine-tuning, and experimentation
CREATE TABLE IF NOT EXISTS public.model_training_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    job_type TEXT NOT NULL CHECK (job_type IN (
        'fine_tuning', 'retraining', 'hyperparameter_optimization', 'data_augmentation',
        'transfer_learning', 'ensemble_training', 'online_learning', 'federated_learning'
    )),
    model_name TEXT NOT NULL,
    base_model_version TEXT,
    target_model_version TEXT,
    
    -- Training configuration
    training_config JSONB NOT NULL,
    hyperparameters JSONB,
    dataset_config JSONB,
    training_data_size INTEGER,
    validation_data_size INTEGER,
    test_data_size INTEGER,
    
    -- Training progress
    job_status TEXT DEFAULT 'queued' CHECK (job_status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    current_epoch INTEGER,
    total_epochs INTEGER,
    
    -- Performance metrics
    training_loss DECIMAL(10,6),
    validation_loss DECIMAL(10,6),
    training_accuracy DECIMAL(5,4),
    validation_accuracy DECIMAL(5,4),
    best_validation_score DECIMAL(5,4),
    
    -- Resource utilization
    gpu_hours_used DECIMAL(10,2),
    compute_cost_usd DECIMAL(10,2),
    memory_peak_gb DECIMAL(8,2),
    storage_used_gb DECIMAL(8,2),
    
    -- Results and artifacts
    model_artifacts JSONB, -- Model file paths, checksums, etc.
    training_logs TEXT,
    evaluation_results JSONB,
    comparison_with_baseline JSONB,
    
    -- Deployment information
    deployment_approved BOOLEAN DEFAULT false,
    deployment_date TIMESTAMP WITH TIME ZONE,
    rollback_plan TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for training jobs
CREATE INDEX idx_training_jobs_status ON public.model_training_jobs (job_status);
CREATE INDEX idx_training_jobs_model ON public.model_training_jobs (model_name);
CREATE INDEX idx_training_jobs_type ON public.model_training_jobs (job_type);
CREATE INDEX idx_training_jobs_started ON public.model_training_jobs (started_at);

-- =============================================
-- FEEDBACK AGGREGATION & ANALYSIS
-- =============================================

-- Aggregated feedback metrics for analysis
CREATE TABLE IF NOT EXISTS public.feedback_aggregations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregation_type TEXT NOT NULL CHECK (aggregation_type IN (
        'daily_summary', 'weekly_summary', 'monthly_summary', 'feature_summary',
        'model_summary', 'user_segment_summary', 'yacht_type_summary'
    )),
    aggregation_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    aggregation_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Scope filters
    feedback_category TEXT,
    model_name TEXT,
    user_segment TEXT,
    yacht_type TEXT,
    
    -- Aggregated metrics
    total_feedback_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2),
    rating_distribution JSONB, -- Distribution of ratings 1-5
    sentiment_distribution JSONB, -- Positive, neutral, negative
    
    -- Satisfaction metrics
    satisfaction_score DECIMAL(5,4),
    nps_score DECIMAL(5,2), -- Net Promoter Score
    user_retention_rate DECIMAL(5,4),
    feature_adoption_rate DECIMAL(5,4),
    
    -- Issue tracking
    bug_report_count INTEGER DEFAULT 0,
    critical_issues_count INTEGER DEFAULT 0,
    improvement_suggestions_count INTEGER DEFAULT 0,
    
    -- Performance indicators
    accuracy_perception DECIMAL(3,2), -- User-perceived accuracy
    usefulness_score DECIMAL(3,2),
    ease_of_use_score DECIMAL(3,2),
    response_time_satisfaction DECIMAL(3,2),
    
    -- Business impact
    estimated_time_saved_hours DECIMAL(10,2),
    estimated_cost_savings_usd DECIMAL(12,2),
    safety_improvements_count INTEGER DEFAULT 0,
    
    -- Trends and insights
    trend_analysis JSONB,
    key_insights TEXT[],
    action_items JSONB,
    priority_improvements TEXT[],
    
    -- Processing metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_version TEXT,
    data_quality_score DECIMAL(3,2)
);

-- Indexes for feedback aggregations
CREATE INDEX idx_feedback_agg_type ON public.feedback_aggregations (aggregation_type);
CREATE INDEX idx_feedback_agg_period ON public.feedback_aggregations (aggregation_period_start, aggregation_period_end);
CREATE INDEX idx_feedback_agg_category ON public.feedback_aggregations (feedback_category);
CREATE INDEX idx_feedback_agg_satisfaction ON public.feedback_aggregations (satisfaction_score);

-- =============================================
-- CONTINUOUS IMPROVEMENT ACTIONS
-- =============================================

-- Track improvement actions and their outcomes
CREATE TABLE IF NOT EXISTS public.improvement_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'model_improvement', 'feature_enhancement', 'bug_fix', 'ui_improvement',
        'performance_optimization', 'data_quality_improvement', 'workflow_optimization',
        'safety_enhancement', 'user_experience_improvement'
    )),
    priority_level TEXT NOT NULL CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    
    -- Problem identification
    identified_issue TEXT NOT NULL,
    root_cause_analysis TEXT,
    impact_assessment JSONB,
    affected_users_count INTEGER,
    affected_features TEXT[],
    
    -- Solution design
    proposed_solution TEXT NOT NULL,
    implementation_approach TEXT,
    required_resources JSONB,
    estimated_effort_hours INTEGER,
    estimated_cost_usd DECIMAL(10,2),
    
    -- Success criteria
    success_metrics JSONB,
    target_improvements JSONB,
    acceptance_criteria TEXT[],
    testing_requirements TEXT[],
    
    -- Implementation tracking
    action_status TEXT DEFAULT 'planned' CHECK (action_status IN ('planned', 'approved', 'in_progress', 'testing', 'deployed', 'completed', 'cancelled')),
    assigned_to TEXT,
    start_date DATE,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Results and validation
    implementation_results JSONB,
    performance_before JSONB,
    performance_after JSONB,
    user_feedback_improvement DECIMAL(3,2),
    business_impact_realized DECIMAL(10,2),
    
    -- Follow-up
    lessons_learned TEXT,
    additional_actions_needed TEXT[],
    monitoring_requirements TEXT[],
    
    -- Metadata
    created_from_feedback_ids UUID[], -- Related feedback entries
    created_from_pattern_ids UUID[], -- Related learning patterns
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for improvement actions
CREATE INDEX idx_improvement_actions_type ON public.improvement_actions (action_type);
CREATE INDEX idx_improvement_actions_priority ON public.improvement_actions (priority_level);
CREATE INDEX idx_improvement_actions_status ON public.improvement_actions (action_status);
CREATE INDEX idx_improvement_actions_target_date ON public.improvement_actions (target_completion_date);

-- =============================================
-- ADAPTIVE LEARNING CONFIGURATION
-- =============================================

-- Configuration for adaptive learning behaviors
CREATE TABLE IF NOT EXISTS public.learning_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_name TEXT UNIQUE NOT NULL,
    config_type TEXT NOT NULL CHECK (config_type IN (
        'feedback_processing', 'model_tuning', 'pattern_detection', 'auto_improvement',
        'user_personalization', 'system_adaptation', 'performance_monitoring'
    )),
    
    -- Configuration parameters
    config_parameters JSONB NOT NULL,
    default_parameters JSONB,
    parameter_constraints JSONB,
    
    -- Learning behavior settings
    learning_rate DECIMAL(6,5), -- For applicable algorithms
    adaptation_threshold DECIMAL(5,4), -- When to trigger adaptations
    feedback_weight DECIMAL(3,2), -- Weight of user feedback vs. system metrics
    confidence_threshold DECIMAL(3,2), -- Minimum confidence for auto-actions
    
    -- Automation settings
    auto_tuning_enabled BOOLEAN DEFAULT true,
    auto_deployment_enabled BOOLEAN DEFAULT false,
    human_approval_required BOOLEAN DEFAULT true,
    rollback_on_degradation BOOLEAN DEFAULT true,
    
    -- Monitoring and safety
    performance_degradation_threshold DECIMAL(5,4),
    max_automated_changes_per_day INTEGER DEFAULT 5,
    safety_constraints JSONB,
    monitoring_frequency_hours INTEGER DEFAULT 24,
    
    -- Scope and applicability
    applies_to_models TEXT[],
    applies_to_features TEXT[],
    applies_to_user_segments TEXT[],
    
    -- Status and versioning
    is_active BOOLEAN DEFAULT true,
    version_number INTEGER DEFAULT 1,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for learning configuration
CREATE INDEX idx_learning_config_type ON public.learning_configuration (config_type);
CREATE INDEX idx_learning_config_active ON public.learning_configuration (is_active);

-- =============================================
-- FUNCTIONS FOR LEARNING ANALYTICS
-- =============================================

-- Function to calculate model performance trends
CREATE OR REPLACE FUNCTION calculate_model_performance_trend(
    p_model_name TEXT,
    p_days_back INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    performance_trend JSONB;
    recent_performance DECIMAL;
    previous_performance DECIMAL;
    trend_direction TEXT;
    improvement_rate DECIMAL;
BEGIN
    -- Get recent performance
    SELECT avg(accuracy_score) INTO recent_performance
    FROM public.ai_model_performance
    WHERE model_name = p_model_name
        AND evaluation_period_start >= NOW() - INTERVAL '7 days';

    -- Get previous performance
    SELECT avg(accuracy_score) INTO previous_performance
    FROM public.ai_model_performance
    WHERE model_name = p_model_name
        AND evaluation_period_start >= NOW() - INTERVAL '30 days'
        AND evaluation_period_start < NOW() - INTERVAL '7 days';

    -- Calculate trend
    IF recent_performance IS NOT NULL AND previous_performance IS NOT NULL THEN
        improvement_rate := ((recent_performance - previous_performance) / previous_performance) * 100;
        
        IF improvement_rate > 5 THEN
            trend_direction := 'improving';
        ELSIF improvement_rate < -5 THEN
            trend_direction := 'declining';
        ELSE
            trend_direction := 'stable';
        END IF;
    ELSE
        trend_direction := 'insufficient_data';
        improvement_rate := 0;
    END IF;

    performance_trend := jsonb_build_object(
        'model_name', p_model_name,
        'recent_performance', COALESCE(recent_performance, 0),
        'previous_performance', COALESCE(previous_performance, 0),
        'trend_direction', trend_direction,
        'improvement_rate_percent', COALESCE(improvement_rate, 0),
        'calculated_at', NOW()
    );

    RETURN performance_trend;
END;
$$ LANGUAGE plpgsql;

-- Function to identify learning opportunities
CREATE OR REPLACE FUNCTION identify_learning_opportunities()
RETURNS TABLE (
    opportunity_type TEXT,
    description TEXT,
    priority_score DECIMAL,
    potential_impact TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    -- Low user satisfaction areas
    RETURN QUERY
    SELECT 
        'user_satisfaction'::TEXT as opportunity_type,
        'Feature with consistently low user ratings: ' || feedback_category as description,
        (5.0 - avg(rating::DECIMAL))::DECIMAL as priority_score,
        'high'::TEXT as potential_impact,
        'Investigate and improve user experience'::TEXT as recommended_action
    FROM public.user_feedback
    WHERE created_at >= NOW() - INTERVAL '30 days'
        AND rating IS NOT NULL
    GROUP BY feedback_category
    HAVING avg(rating::DECIMAL) < 3.0
        AND count(*) >= 10;

    -- Model performance degradation
    RETURN QUERY
    SELECT 
        'model_performance'::TEXT as opportunity_type,
        'Model showing performance decline: ' || model_name as description,
        (1.0 - accuracy_score)::DECIMAL as priority_score,
        'critical'::TEXT as potential_impact,
        'Retrain or fine-tune model'::TEXT as recommended_action
    FROM public.ai_model_performance
    WHERE evaluation_period_start >= NOW() - INTERVAL '7 days'
        AND accuracy_score < 0.8;

    -- High feedback volume without action
    RETURN QUERY
    SELECT 
        'unaddressed_feedback'::TEXT as opportunity_type,
        'High volume of unprocessed feedback for: ' || feedback_category as description,
        count(*)::DECIMAL / 10 as priority_score,
        'medium'::TEXT as potential_impact,
        'Process and analyze feedback'::TEXT as recommended_action
    FROM public.user_feedback
    WHERE feedback_status = 'pending'
        AND created_at >= NOW() - INTERVAL '14 days'
    GROUP BY feedback_category
    HAVING count(*) >= 20;

END;
$$ LANGUAGE plpgsql;

-- Function to trigger automated learning actions
CREATE OR REPLACE FUNCTION trigger_automated_learning_action(
    p_trigger_type TEXT,
    p_context JSONB
)
RETURNS JSONB AS $$
DECLARE
    action_result JSONB;
    learning_config RECORD;
    action_allowed BOOLEAN;
BEGIN
    -- Get relevant learning configuration
    SELECT * INTO learning_config
    FROM public.learning_configuration
    WHERE config_type = p_trigger_type
        AND is_active = true
        AND effective_from <= NOW()
        AND (effective_until IS NULL OR effective_until > NOW())
    ORDER BY version_number DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No active learning configuration found for trigger type'
        );
    END IF;

    -- Check if automated action is allowed
    action_allowed := learning_config.auto_tuning_enabled 
        AND (NOT learning_config.human_approval_required OR p_context->>'force_action' = 'true');

    IF NOT action_allowed THEN
        -- Create improvement action for human review
        INSERT INTO public.improvement_actions (
            action_name,
            action_type,
            priority_level,
            identified_issue,
            proposed_solution,
            action_status
        ) VALUES (
            'Automated Learning Trigger: ' || p_trigger_type,
            'model_improvement',
            'medium',
            'Automated learning system identified improvement opportunity',
            'Review and implement suggested improvements',
            'planned'
        );

        action_result := jsonb_build_object(
            'success', true,
            'action_type', 'human_review_required',
            'message', 'Improvement action created for human review'
        );
    ELSE
        -- Execute automated action (would integrate with actual ML pipeline)
        action_result := jsonb_build_object(
            'success', true,
            'action_type', 'automated_execution',
            'message', 'Automated learning action triggered',
            'trigger_type', p_trigger_type,
            'context', p_context
        );
    END IF;

    RETURN action_result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all learning tables
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_configuration ENABLE ROW LEVEL SECURITY;

-- RLS policies for user feedback
CREATE POLICY "Users can create their own feedback"
    ON public.user_feedback FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own feedback"
    ON public.user_feedback FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System admins can view all feedback"
    ON public.user_feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS policies for model performance (admin only)
CREATE POLICY "Admins can view model performance"
    ON public.ai_model_performance FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' IN ('admin', 'analyst')
        )
    );

-- Similar policies for other tables...
CREATE POLICY "Admins can manage learning configuration"
    ON public.learning_configuration FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample learning configuration
INSERT INTO public.learning_configuration (
    config_name,
    config_type,
    config_parameters,
    learning_rate,
    adaptation_threshold,
    feedback_weight
) VALUES (
    'default_feedback_processing',
    'feedback_processing',
    '{"min_feedback_count": 10, "analysis_frequency_hours": 24, "auto_categorization": true}'::jsonb,
    0.01,
    0.75,
    0.6
),
(
    'yachtie_ai_tuning',
    'model_tuning',
    '{"retrain_threshold": 0.1, "fine_tune_epochs": 5, "validation_split": 0.2}'::jsonb,
    0.001,
    0.8,
    0.7
);

COMMENT ON TABLE public.user_feedback IS 'Comprehensive user feedback collection for continuous improvement';
COMMENT ON TABLE public.ai_model_performance IS 'AI model performance tracking and analysis';
COMMENT ON TABLE public.learning_patterns IS 'Discovered patterns and insights from user behavior and system performance';
COMMENT ON TABLE public.improvement_actions IS 'Tracked improvement actions and their outcomes';