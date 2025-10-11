-- Enhanced Error Logs System - Database Schema
-- Create comprehensive error management, tracking, and analytics tables

-- 1. Error Categories and Classification
CREATE TABLE IF NOT EXISTS public.error_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  severity_level TEXT NOT NULL DEFAULT 'medium' CHECK (severity_level IN ('critical', 'high', 'medium', 'low')),
  color TEXT DEFAULT '#ef4444',
  icon TEXT DEFAULT 'AlertTriangle',
  auto_assign_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default error categories
INSERT INTO public.error_categories (name, description, severity_level, color, icon) VALUES
('Security', 'Authentication failures, unauthorized access, permission issues', 'critical', '#dc2626', 'Shield'),
('Performance', 'Slow queries, high latency, timeouts', 'high', '#ea580c', 'Zap'),
('Integration', 'External API failures, third-party service issues', 'high', '#7c3aed', 'Link'),
('Database', 'SQL errors, connection failures, constraint violations', 'critical', '#be123c', 'Database'),
('AI/ML', 'Model failures, consensus issues, processing errors', 'medium', '#059669', 'Brain'),
('System', 'Infrastructure issues, memory/disk problems', 'critical', '#4338ca', 'Server'),
('Validation', 'Input validation errors, data format issues', 'low', '#0891b2', 'CheckCircle'),
('Network', 'Connection issues, DNS problems, timeouts', 'medium', '#7c2d12', 'Wifi')
ON CONFLICT (name) DO NOTHING;

-- 2. Enhanced Error Logs with categorization and resolution tracking
CREATE TABLE IF NOT EXISTS public.enhanced_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_log_id UUID, -- Reference to original log entry
  error_hash TEXT NOT NULL, -- Hash for grouping similar errors
  category_id UUID REFERENCES public.error_categories(id),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  module TEXT,
  source_table TEXT, -- Which log table this came from
  stack_trace TEXT,
  error_code TEXT,
  user_impact_score INTEGER DEFAULT 0 CHECK (user_impact_score >= 0 AND user_impact_score <= 10),
  business_impact_score INTEGER DEFAULT 0 CHECK (business_impact_score >= 0 AND business_impact_score <= 10),
  frequency_count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  estimated_resolution_time INTERVAL,
  actual_resolution_time INTERVAL,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Error Resolution Actions and Workflows
CREATE TABLE IF NOT EXISTS public.error_resolution_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_log_id UUID REFERENCES public.enhanced_error_logs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('investigate', 'assign', 'comment', 'resolve', 'reopen', 'escalate')),
  action_by UUID,
  action_details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Error Alerting Rules and Configuration
CREATE TABLE IF NOT EXISTS public.error_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_ids UUID[] DEFAULT '{}', -- Multiple categories can trigger this rule
  severity_levels TEXT[] DEFAULT '{}',
  frequency_threshold INTEGER DEFAULT 5, -- Alert after X occurrences
  time_window INTERVAL DEFAULT '5 minutes',
  escalation_time INTERVAL DEFAULT '30 minutes',
  notification_channels JSONB DEFAULT '[]'::jsonb, -- slack, email, webhook configs
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Error Analytics and Metrics
CREATE TABLE IF NOT EXISTS public.error_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  time_period TEXT NOT NULL CHECK (time_period IN ('hourly', 'daily', 'weekly')),
  category_id UUID REFERENCES public.error_categories(id),
  module TEXT,
  total_errors INTEGER DEFAULT 0,
  unique_errors INTEGER DEFAULT 0,
  critical_errors INTEGER DEFAULT 0,
  resolved_errors INTEGER DEFAULT 0,
  avg_resolution_time INTERVAL,
  error_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
  trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Error Notification Log
CREATE TABLE IF NOT EXISTS public.error_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_log_id UUID REFERENCES public.enhanced_error_logs(id),
  alert_rule_id UUID REFERENCES public.error_alert_rules(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'slack', 'webhook', 'in_app')),
  recipient TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.error_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_resolution_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for superadmin access
CREATE POLICY "Superadmins can manage error categories" ON public.error_categories FOR ALL TO authenticated USING (public.is_superadmin_or_named(auth.uid()));
CREATE POLICY "Superadmins can manage enhanced error logs" ON public.enhanced_error_logs FOR ALL TO authenticated USING (public.is_superadmin_or_named(auth.uid()));
CREATE POLICY "Superadmins can manage error resolution actions" ON public.error_resolution_actions FOR ALL TO authenticated USING (public.is_superadmin_or_named(auth.uid()));
CREATE POLICY "Superadmins can manage error alert rules" ON public.error_alert_rules FOR ALL TO authenticated USING (public.is_superadmin_or_named(auth.uid()));
CREATE POLICY "Superadmins can view error analytics" ON public.error_analytics_snapshots FOR ALL TO authenticated USING (public.is_superadmin_or_named(auth.uid()));
CREATE POLICY "Superadmins can view error notifications" ON public.error_notifications FOR ALL TO authenticated USING (public.is_superadmin_or_named(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_error_logs_error_hash ON public.enhanced_error_logs(error_hash);
CREATE INDEX IF NOT EXISTS idx_enhanced_error_logs_category ON public.enhanced_error_logs(category_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_error_logs_severity ON public.enhanced_error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_enhanced_error_logs_status ON public.enhanced_error_logs(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_error_logs_created_at ON public.enhanced_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_analytics_snapshots_date ON public.error_analytics_snapshots(snapshot_date, time_period);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_error_logs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' AND NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
    NEW.actual_resolution_time = NEW.resolved_at - NEW.first_occurred_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enhanced_error_logs_timestamp
  BEFORE UPDATE ON public.enhanced_error_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_error_logs_timestamp();

CREATE TRIGGER update_error_categories_timestamp
  BEFORE UPDATE ON public.error_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_error_alert_rules_timestamp
  BEFORE UPDATE ON public.error_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();