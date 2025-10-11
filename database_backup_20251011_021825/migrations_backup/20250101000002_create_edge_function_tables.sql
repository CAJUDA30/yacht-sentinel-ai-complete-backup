-- Create missing edge function tables
CREATE TABLE IF NOT EXISTS public.edge_function_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  timeout_ms INTEGER DEFAULT 10000,
  warm_schedule TEXT DEFAULT '*/10 * * * *',
  verify_jwt BOOLEAN DEFAULT false,
  department TEXT DEFAULT 'Operations',
  feature_flag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.edge_function_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  latency_ms INTEGER,
  region TEXT DEFAULT 'unknown',
  version TEXT DEFAULT 'unknown',
  error JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(function_name)
);

CREATE TABLE IF NOT EXISTS public.event_bus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info',
  module TEXT DEFAULT 'system',
  department TEXT DEFAULT 'Operations',
  source TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_edge_function_settings_function_name ON public.edge_function_settings(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_function_health_function_name ON public.edge_function_health(function_name);
CREATE INDEX IF NOT EXISTS idx_edge_function_health_status ON public.edge_function_health(status);
CREATE INDEX IF NOT EXISTS idx_event_bus_event_type ON public.event_bus(event_type);
CREATE INDEX IF NOT EXISTS idx_event_bus_created_at ON public.event_bus(created_at);

-- Enable RLS
ALTER TABLE public.edge_function_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_function_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bus ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for service_role" ON public.edge_function_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON public.edge_function_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable superadmin access" ON public.edge_function_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'superadmin'
    )
  );

CREATE POLICY "Enable all access for service_role" ON public.edge_function_health
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON public.edge_function_health
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable superadmin access" ON public.edge_function_health
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'superadmin'
    )
  );

CREATE POLICY "Enable all access for service_role" ON public.event_bus
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable read access for authenticated users" ON public.event_bus
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable superadmin access" ON public.event_bus
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'superadmin'
    )
  );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_edge_function_settings_updated_at ON public.edge_function_settings;
CREATE TRIGGER trigger_edge_function_settings_updated_at
  BEFORE UPDATE ON public.edge_function_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();