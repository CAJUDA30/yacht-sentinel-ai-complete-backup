-- YachtExcel Enhanced User Memory System
-- Long-term per-user memory with RAG capabilities for personalized AI interactions

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- User memory table for long-term conversation history and context
CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'ocr_interaction', 'conversation', 'preference', 'workflow', 'decision', 
    'scan_result', 'module_usage', 'voice_command', 'troubleshooting'
  )),
  session_id TEXT,
  module TEXT, -- Which module this memory relates to
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Contains query, response, metadata, context
  importance_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0 for memory prioritization
  access_frequency INTEGER DEFAULT 0, -- How often this memory is accessed
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- For temporary memories
  tags TEXT[] DEFAULT '{}', -- Searchable tags
  metadata JSONB DEFAULT '{}' -- Additional context
);

-- User memory embeddings for RAG (Retrieval Augmented Generation)
CREATE TABLE IF NOT EXISTS public.user_memory_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.user_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  content_hash TEXT NOT NULL, -- Hash of the embedded content
  embedding_model TEXT DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory interaction patterns for learning user behavior
CREATE TABLE IF NOT EXISTS public.memory_interaction_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'frequent_query', 'workflow_sequence', 'context_switching', 'error_pattern'
  )),
  pattern_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  frequency INTEGER DEFAULT 1,
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory search cache for performance optimization
CREATE TABLE IF NOT EXISTS public.memory_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  search_results JSONB NOT NULL,
  embedding VECTOR(1536),
  cache_hits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- User personalization profiles
CREATE TABLE IF NOT EXISTS public.user_personalization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  communication_style JSONB DEFAULT '{"tone": "professional", "verbosity": "balanced", "language": "en"}',
  domain_expertise JSONB DEFAULT '{}', -- Areas of expertise (maintenance, navigation, etc.)
  preferred_modules JSONB DEFAULT '[]', -- Most used modules
  interaction_preferences JSONB DEFAULT '{}', -- Voice, text, scan preferences
  learning_history JSONB DEFAULT '{}', -- What the user has learned/improved at
  safety_preferences JSONB DEFAULT '{}', -- Safety-related preferences
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{"share_anonymized": false, "retain_conversations": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory compression logs for managing large memory stores
CREATE TABLE IF NOT EXISTS public.memory_compression_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  compression_type TEXT NOT NULL CHECK (compression_type IN ('summary', 'archive', 'delete')),
  original_memories_count INTEGER NOT NULL,
  compressed_memories_count INTEGER NOT NULL,
  compression_ratio DECIMAL(5,2),
  summary_content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced OCR interaction tracking for Yachtie
CREATE TABLE IF NOT EXISTS public.yachtie_ocr_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID,
  session_id TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT,
  ocr_text TEXT,
  classification_result JSONB,
  routing_decision JSONB NOT NULL, -- Which module it was routed to and why
  confidence_score DECIMAL(3,2),
  user_feedback TEXT, -- Did the user confirm/correct the routing?
  memory_context JSONB, -- What memories were used in decision making
  processing_time_ms INTEGER,
  ai_models_used JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON public.user_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memories_module ON public.user_memories(module);
CREATE INDEX IF NOT EXISTS idx_user_memories_importance ON public.user_memories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_memories_frequency ON public.user_memories(access_frequency DESC);
CREATE INDEX IF NOT EXISTS idx_user_memories_created ON public.user_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_memories_tags ON public.user_memories USING GIN(tags);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_vector 
ON public.user_memory_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_user ON public.user_memory_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_memory ON public.user_memory_embeddings(memory_id);

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_memory_cache_user ON public.memory_search_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_cache_hash ON public.memory_search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_memory_cache_expires ON public.memory_search_cache(expires_at);

-- OCR interactions indexes
CREATE INDEX IF NOT EXISTS idx_yachtie_ocr_user ON public.yachtie_ocr_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_yachtie_ocr_session ON public.yachtie_ocr_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_yachtie_ocr_created ON public.yachtie_ocr_interactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_interaction_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personalization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_compression_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yachtie_ocr_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own memories" ON public.user_memories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own memory embeddings" ON public.user_memory_embeddings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interaction patterns" ON public.memory_interaction_patterns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own search cache" ON public.memory_search_cache
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own personalization profile" ON public.user_personalization_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own compression logs" ON public.memory_compression_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own OCR interactions" ON public.yachtie_ocr_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Functions for memory management

-- Function to automatically embed memory content
CREATE OR REPLACE FUNCTION embed_user_memory()
RETURNS TRIGGER AS $$
DECLARE
  content_text TEXT;
  content_hash TEXT;
BEGIN
  -- Extract text content for embedding
  content_text := COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content->>'query', '') || ' ' || COALESCE(NEW.content->>'response', '');
  
  -- Generate content hash
  content_hash := encode(digest(content_text, 'sha256'), 'hex');
  
  -- Note: Actual embedding generation happens via Edge Function
  -- This trigger just sets up the structure
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic embedding
CREATE TRIGGER trigger_embed_user_memory
  AFTER INSERT ON public.user_memories
  FOR EACH ROW EXECUTE FUNCTION embed_user_memory();

-- Function to update memory access frequency
CREATE OR REPLACE FUNCTION update_memory_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_memories 
  SET 
    access_frequency = access_frequency + 1,
    last_accessed_at = NOW()
  WHERE id = NEW.memory_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for access tracking
CREATE TRIGGER trigger_update_memory_access
  AFTER INSERT ON public.user_memory_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_memory_access();

-- Function to clean expired memories
CREATE OR REPLACE FUNCTION clean_expired_memories()
RETURNS void AS $$
BEGIN
  -- Delete expired memories
  DELETE FROM public.user_memories 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  -- Clean expired cache entries
  DELETE FROM public.memory_search_cache 
  WHERE expires_at < NOW();
  
  -- Log cleanup
  INSERT INTO public.memory_compression_logs (user_id, compression_type, original_memories_count, compressed_memories_count, compression_ratio)
  SELECT 
    user_id, 
    'delete', 
    0, 
    0, 
    0.0
  FROM auth.users LIMIT 1; -- Placeholder for cleanup log
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON public.user_memories TO authenticated;
GRANT ALL ON public.user_memory_embeddings TO authenticated;
GRANT ALL ON public.memory_interaction_patterns TO authenticated;
GRANT ALL ON public.memory_search_cache TO authenticated;
GRANT ALL ON public.user_personalization_profiles TO authenticated;
GRANT SELECT ON public.memory_compression_logs TO authenticated;
GRANT ALL ON public.yachtie_ocr_interactions TO authenticated;

-- Insert default personalization profiles for existing users
INSERT INTO public.user_personalization_profiles (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_personalization_profiles)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE public.user_memories IS 'Long-term user memory storage for personalized AI interactions';
COMMENT ON TABLE public.user_memory_embeddings IS 'Vector embeddings for semantic search of user memories';
COMMENT ON TABLE public.memory_interaction_patterns IS 'Learned patterns from user interactions';
COMMENT ON TABLE public.user_personalization_profiles IS 'User preferences and personalization settings';
COMMENT ON TABLE public.yachtie_ocr_interactions IS 'OCR interaction tracking for Yachtie AI routing decisions';