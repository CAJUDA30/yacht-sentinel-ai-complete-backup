-- Create real database tables for logging and monitoring

-- Scan events table for tracking all scan activities
CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'scan_initiated', 'scan_completed', 'scan_error', 'auto_executed'
  module TEXT NOT NULL,
  scan_type TEXT,
  confidence DECIMAL,
  processing_time_ms INTEGER,
  extracted_data JSONB,
  ai_analysis JSONB,
  suggestions JSONB,
  actions JSONB,
  error_message TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System logs table for system monitoring  
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL, -- 'info', 'warning', 'error', 'debug'
  source TEXT NOT NULL, -- 'System Monitor', 'AI Processor', etc.
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  module TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics events table for real analytics data
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID,
  module TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI processing logs for tracking AI model performance
CREATE TABLE IF NOT EXISTS public.ai_processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  model_name TEXT NOT NULL, -- 'openai', 'grok', 'deepseek', 'gemini', 'vision'
  request_type TEXT NOT NULL, -- 'text', 'vision', 'analysis', 'suggestions'
  processing_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  response_data JSONB,
  error_message TEXT,
  confidence DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User sessions table for tracking scan sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  module TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_scans INTEGER DEFAULT 0,
  successful_scans INTEGER DEFAULT 0,
  failed_scans INTEGER DEFAULT 0,
  device_info JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for all operations (public access for enterprise features)
CREATE POLICY "Allow all operations on scan_events" ON public.scan_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on system_logs" ON public.system_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on analytics_events" ON public.analytics_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ai_processing_logs" ON public.ai_processing_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on user_sessions" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_events_session_id ON public.scan_events(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_created_at ON public.scan_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_session_id ON public.ai_processing_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions(session_id);