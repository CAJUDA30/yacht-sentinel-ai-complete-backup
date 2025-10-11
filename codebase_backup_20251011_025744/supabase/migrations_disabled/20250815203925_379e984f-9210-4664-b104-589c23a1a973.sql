-- Enhanced database schema for multi-model AI orchestration and behavior analytics

-- User behavior analytics for proactive support
CREATE TABLE IF NOT EXISTS public.user_behavior_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID,
  action_type TEXT NOT NULL, -- 'smart_scan', 'document_upload', 'search', 'module_access'
  action_details JSONB NOT NULL DEFAULT '{}', -- Detailed action data
  module_context TEXT, -- Which module the action occurred in
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI orchestration rules for dynamic model routing
CREATE TABLE IF NOT EXISTS public.ai_orchestration_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  task_type TEXT NOT NULL, -- 'ocr', 'classification', 'analysis', 'decision', 'search'
  primary_model_id UUID REFERENCES public.ai_models_unified(id),
  fallback_models JSONB NOT NULL DEFAULT '[]', -- Array of model IDs for fallbacks
  conditions JSONB NOT NULL DEFAULT '{}', -- Conditions for rule activation
  priority INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  performance_threshold NUMERIC DEFAULT 0.8, -- Minimum performance to use primary model
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shared knowledge library for cross-vessel technical data
CREATE TABLE IF NOT EXISTS public.shared_knowledge_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  knowledge_type TEXT NOT NULL, -- 'manual', 'technical_spec', 'safety_document', 'maintenance_guide'
  title TEXT NOT NULL,
  description TEXT,
  content_data JSONB NOT NULL DEFAULT '{}',
  vector_embedding VECTOR(1536), -- For similarity search (OpenAI embeddings)
  source_url TEXT,
  equipment_category TEXT,
  manufacturer TEXT,
  model_number TEXT,
  yacht_types JSONB DEFAULT '[]', -- Which yacht types this applies to
  is_public BOOLEAN NOT NULL DEFAULT true,
  confidence_score NUMERIC DEFAULT 1.0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Proactive suggestion tracking
CREATE TABLE IF NOT EXISTS public.proactive_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'budget_report', 'maintenance_schedule', 'module_route'
  suggestion_data JSONB NOT NULL DEFAULT '{}',
  trigger_pattern TEXT NOT NULL, -- What pattern triggered this suggestion
  confidence_score NUMERIC NOT NULL DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed', 'auto_executed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE
);

-- Multi-model processing results cache
CREATE TABLE IF NOT EXISTS public.ai_processing_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_hash TEXT NOT NULL UNIQUE, -- SHA256 hash of input content
  processing_type TEXT NOT NULL, -- 'smart_scan', 'document_analysis', 'search'
  input_data JSONB NOT NULL DEFAULT '{}',
  orchestration_result JSONB NOT NULL DEFAULT '{}',
  models_used JSONB NOT NULL DEFAULT '[]', -- Which models were used
  processing_time_ms INTEGER,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enhanced ai_models_unified for multi-model support
ALTER TABLE public.ai_models_unified 
ADD COLUMN IF NOT EXISTS specialization TEXT[], -- What this model is best at
ADD COLUMN IF NOT EXISTS cost_per_1k_tokens NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS max_context_length INTEGER DEFAULT 4096,
ADD COLUMN IF NOT EXISTS supports_vision BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS supports_function_calling BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS response_time_avg_ms INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS success_rate NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP WITH TIME ZONE;

-- Enhanced ai_providers_unified for comprehensive provider support
ALTER TABLE public.ai_providers_unified
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'api_key', -- 'api_key', 'oauth', 'service_account'
ADD COLUMN IF NOT EXISTS rate_limit_per_minute INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS rate_limit_per_day INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS cost_tracking_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS health_check_endpoint TEXT,
ADD COLUMN IF NOT EXISTS documentation_url TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_user_timestamp ON public.user_behavior_analytics(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_action_type ON public.user_behavior_analytics(action_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_orchestration_rules_task_active ON public.ai_orchestration_rules(task_type, is_active);
CREATE INDEX IF NOT EXISTS idx_shared_knowledge_library_type_category ON public.shared_knowledge_library(knowledge_type, equipment_category);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_user_status ON public.proactive_suggestions(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_processing_cache_hash ON public.ai_processing_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_ai_processing_cache_expires ON public.ai_processing_cache(expires_at);

-- Enable RLS on new tables
ALTER TABLE public.user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_orchestration_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_knowledge_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_behavior_analytics
CREATE POLICY "Users can view their own behavior analytics" 
ON public.user_behavior_analytics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert behavior analytics" 
ON public.user_behavior_analytics FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Superadmins can view all behavior analytics" 
ON public.user_behavior_analytics FOR ALL 
USING (is_superadmin_or_named(auth.uid()));

-- RLS policies for ai_orchestration_rules
CREATE POLICY "Superadmins can manage orchestration rules" 
ON public.ai_orchestration_rules FOR ALL 
USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Authenticated users can view active orchestration rules" 
ON public.ai_orchestration_rules FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS policies for shared_knowledge_library
CREATE POLICY "Authenticated users can view public knowledge" 
ON public.shared_knowledge_library FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_public = true);

CREATE POLICY "Superadmins can manage knowledge library" 
ON public.shared_knowledge_library FOR ALL 
USING (is_superadmin_or_named(auth.uid()));

-- RLS policies for proactive_suggestions
CREATE POLICY "Users can view their own suggestions" 
ON public.proactive_suggestions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their suggestion responses" 
ON public.proactive_suggestions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create suggestions" 
ON public.proactive_suggestions FOR INSERT 
WITH CHECK (true);

-- RLS policies for ai_processing_cache
CREATE POLICY "System can manage processing cache" 
ON public.ai_processing_cache FOR ALL 
USING (true);

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_processing_cache 
  WHERE expires_at < now();
END;
$$;

-- Function to update model performance metrics
CREATE OR REPLACE FUNCTION public.update_model_performance(
  model_id_param UUID,
  response_time_ms INTEGER,
  was_successful BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_models_unified 
  SET 
    response_time_avg_ms = COALESCE(
      (response_time_avg_ms * 0.9) + (response_time_ms * 0.1), 
      response_time_ms
    ),
    success_rate = CASE 
      WHEN was_successful THEN LEAST(success_rate + 0.01, 1.0)
      ELSE GREATEST(success_rate - 0.05, 0.0)
    END,
    last_health_check = now(),
    updated_at = now()
  WHERE id = model_id_param;
END;
$$;