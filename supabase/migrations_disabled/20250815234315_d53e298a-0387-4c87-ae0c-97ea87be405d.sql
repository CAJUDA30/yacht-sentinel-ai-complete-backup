-- Phase 3: Proactive Intelligence & Smart Knowledge Database Tables

-- User actions tracking table
CREATE TABLE IF NOT EXISTS public.user_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  module text NOT NULL,
  context jsonb DEFAULT '{}',
  session_id text NOT NULL,
  page_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Behavior patterns table
CREATE TABLE IF NOT EXISTS public.behavior_patterns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type text NOT NULL CHECK (pattern_type IN ('frequent_action', 'workflow_sequence', 'time_based', 'context_switch')),
  user_id uuid NOT NULL,
  module text NOT NULL,
  pattern_data jsonb NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  frequency integer NOT NULL DEFAULT 0,
  last_occurrence timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, module, pattern_type)
);

-- Proactive suggestions table
CREATE TABLE IF NOT EXISTS public.proactive_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_type text NOT NULL CHECK (suggestion_type IN ('action', 'workflow', 'optimization', 'alert')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  suggested_action jsonb NOT NULL,
  trigger_pattern text,
  user_id uuid NOT NULL,
  module text NOT NULL,
  expires_at timestamp with time zone,
  dismissed boolean DEFAULT false,
  dismissed_at timestamp with time zone,
  acted_upon boolean DEFAULT false,
  acted_upon_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Smart knowledge items table
CREATE TABLE IF NOT EXISTS public.smart_knowledge_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'document', 'scan_result')),
  module text NOT NULL,
  tags text[] DEFAULT '{}',
  embedding_vector vector(1536),
  confidence_score numeric,
  source_type text NOT NULL CHECK (source_type IN ('user_generated', 'ai_extracted', 'manual_upload', 'scan_result')),
  yacht_id uuid,
  is_shared boolean DEFAULT false,
  access_level text NOT NULL CHECK (access_level IN ('private', 'yacht', 'fleet', 'public')),
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS on all tables
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_knowledge_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_actions
CREATE POLICY "Users can manage their own actions" ON public.user_actions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for behavior_patterns
CREATE POLICY "Users can view their own patterns" ON public.behavior_patterns
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for proactive_suggestions
CREATE POLICY "Users can manage their own suggestions" ON public.proactive_suggestions
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for smart_knowledge_items
CREATE POLICY "Users can access appropriate knowledge" ON public.smart_knowledge_items
  FOR SELECT USING (
    auth.uid() = created_by OR 
    access_level = 'public' OR 
    (access_level = 'fleet' AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Users can manage their own knowledge" ON public.smart_knowledge_items
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own knowledge" ON public.smart_knowledge_items
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own knowledge" ON public.smart_knowledge_items
  FOR DELETE USING (auth.uid() = created_by);

-- Indexes for performance
CREATE INDEX idx_user_actions_user_module ON public.user_actions(user_id, module);
CREATE INDEX idx_user_actions_created_at ON public.user_actions(created_at);
CREATE INDEX idx_behavior_patterns_user_module ON public.behavior_patterns(user_id, module);
CREATE INDEX idx_proactive_suggestions_user_active ON public.proactive_suggestions(user_id, dismissed, acted_upon);
CREATE INDEX idx_smart_knowledge_module ON public.smart_knowledge_items(module);
CREATE INDEX idx_smart_knowledge_access ON public.smart_knowledge_items(access_level);
CREATE INDEX idx_smart_knowledge_created_by ON public.smart_knowledge_items(created_by);

-- Update triggers
CREATE TRIGGER update_behavior_patterns_updated_at
  BEFORE UPDATE ON public.behavior_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_smart_knowledge_updated_at
  BEFORE UPDATE ON public.smart_knowledge_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();