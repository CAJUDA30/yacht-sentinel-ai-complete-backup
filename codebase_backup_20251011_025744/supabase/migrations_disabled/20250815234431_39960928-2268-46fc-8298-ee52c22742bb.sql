-- Phase 3: Proactive Intelligence & Smart Knowledge Database Tables (Simple)

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
  pattern_type text NOT NULL,
  user_id uuid NOT NULL,
  module text NOT NULL,
  pattern_data jsonb NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  frequency integer NOT NULL DEFAULT 0,
  last_occurrence timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Proactive suggestions table
CREATE TABLE IF NOT EXISTS public.proactive_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_type text NOT NULL,
  priority text NOT NULL,
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
  content_type text NOT NULL,
  module text NOT NULL,
  tags text[] DEFAULT '{}',
  embedding_vector jsonb,
  confidence_score numeric,
  source_type text NOT NULL,
  yacht_id uuid,
  is_shared boolean DEFAULT false,
  access_level text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_knowledge_items ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users manage own actions" ON public.user_actions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own patterns" ON public.behavior_patterns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own suggestions" ON public.proactive_suggestions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access knowledge" ON public.smart_knowledge_items FOR SELECT USING (auth.uid() = created_by OR access_level = 'public');
CREATE POLICY "Users create knowledge" ON public.smart_knowledge_items FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users update own knowledge" ON public.smart_knowledge_items FOR UPDATE USING (auth.uid() = created_by);