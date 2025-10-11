-- Create yacht_status table for real-time monitoring
CREATE TABLE public.yacht_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'online',
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_name TEXT,
  engine_status TEXT DEFAULT 'good',
  fuel_level NUMERIC DEFAULT 100,
  battery_level NUMERIC DEFAULT 100,
  generator_hours NUMERIC DEFAULT 0,
  speed_knots NUMERIC DEFAULT 0,
  heading NUMERIC DEFAULT 0,
  weather_conditions JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_alerts table
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create iot_sensor_data table for equipment monitoring
CREATE TABLE public.iot_sensor_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID,
  equipment_id UUID,
  sensor_type TEXT NOT NULL,
  sensor_value NUMERIC NOT NULL,
  unit TEXT,
  status TEXT DEFAULT 'normal',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Create predictive_maintenance_insights table
CREATE TABLE public.predictive_maintenance_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL,
  yacht_id UUID,
  insight_type TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low',
  predicted_failure_date DATE,
  confidence_score NUMERIC,
  recommended_actions JSONB DEFAULT '[]',
  estimated_cost NUMERIC,
  potential_savings NUMERIC,
  ai_model TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  implemented BOOLEAN DEFAULT false,
  implementation_notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.yacht_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_maintenance_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for yacht_status
CREATE POLICY "Users can view yacht status for their yachts"
ON public.yacht_status FOR SELECT
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
  )
);

CREATE POLICY "System can update yacht status"
ON public.yacht_status FOR ALL
USING (true)
WITH CHECK (true);

-- Create RLS policies for system_alerts
CREATE POLICY "Users can view alerts for their yachts"
ON public.system_alerts FOR SELECT
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
  )
);

CREATE POLICY "Users can update alerts for their yachts"
ON public.system_alerts FOR UPDATE
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
  )
);

CREATE POLICY "System can manage alerts"
ON public.system_alerts FOR ALL
USING (true)
WITH CHECK (true);

-- Create RLS policies for iot_sensor_data
CREATE POLICY "Users can view sensor data for their yachts"
ON public.iot_sensor_data FOR SELECT
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
  )
);

CREATE POLICY "System can manage sensor data"
ON public.iot_sensor_data FOR ALL
USING (true)
WITH CHECK (true);

-- Create RLS policies for predictive_maintenance_insights
CREATE POLICY "Users can view maintenance insights for their yachts"
ON public.predictive_maintenance_insights FOR SELECT
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
  )
);

CREATE POLICY "Users can update maintenance insights for their yachts"
ON public.predictive_maintenance_insights FOR UPDATE
USING (
  yacht_id IN (
    SELECT yacht_id FROM public.get_user_yacht_access_safe()
  )
);

CREATE POLICY "System can manage maintenance insights"
ON public.predictive_maintenance_insights FOR ALL
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_yacht_status_yacht_id ON public.yacht_status(yacht_id);
CREATE INDEX idx_yacht_status_last_updated ON public.yacht_status(last_updated);
CREATE INDEX idx_system_alerts_yacht_id ON public.system_alerts(yacht_id);
CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX idx_system_alerts_acknowledged ON public.system_alerts(acknowledged);
CREATE INDEX idx_iot_sensor_data_yacht_id ON public.iot_sensor_data(yacht_id);
CREATE INDEX idx_iot_sensor_data_equipment_id ON public.iot_sensor_data(equipment_id);
CREATE INDEX idx_iot_sensor_data_recorded_at ON public.iot_sensor_data(recorded_at);
CREATE INDEX idx_predictive_insights_equipment_id ON public.predictive_maintenance_insights(equipment_id);
CREATE INDEX idx_predictive_insights_yacht_id ON public.predictive_maintenance_insights(yacht_id);

-- Create triggers for updated_at
CREATE TRIGGER update_yacht_status_updated_at
  BEFORE UPDATE ON public.yacht_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();