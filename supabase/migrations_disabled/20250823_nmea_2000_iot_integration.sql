-- NMEA 2000 IoT Integration Schema
-- Comprehensive yacht sensor data management and real-time monitoring

-- NMEA 2000 devices registry
CREATE TABLE IF NOT EXISTS public.nmea_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN (
    'engine', 'navigation', 'environmental', 'electrical', 
    'fuel', 'water', 'bilge', 'hvac', 'security', 'propulsion'
  )),
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  can_address INTEGER, -- NMEA 2000 CAN bus address
  pgn_codes INTEGER[], -- Parameter Group Numbers this device sends
  firmware_version TEXT,
  installation_date DATE,
  location_description TEXT,
  is_active BOOLEAN DEFAULT true,
  calibration_data JSONB DEFAULT '{}',
  maintenance_schedule JSONB DEFAULT '{}',
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time sensor data storage (time-series optimized)
CREATE TABLE IF NOT EXISTS public.nmea_sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES nmea_devices(id) ON DELETE CASCADE,
  pgn INTEGER NOT NULL, -- Parameter Group Number
  source_address INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  raw_data BYTEA, -- Raw NMEA 2000 message
  parsed_data JSONB NOT NULL, -- Parsed sensor values
  signal_quality INTEGER DEFAULT 100, -- Signal strength/quality (0-100)
  is_valid BOOLEAN DEFAULT true,
  processing_latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NMEA parameter definitions and metadata
CREATE TABLE IF NOT EXISTS public.nmea_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pgn INTEGER NOT NULL,
  parameter_name TEXT NOT NULL,
  parameter_code TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN (
    'integer', 'float', 'boolean', 'string', 'binary', 'enum'
  )),
  unit TEXT,
  min_value DECIMAL,
  max_value DECIMAL,
  precision_digits INTEGER DEFAULT 2,
  description TEXT,
  is_critical BOOLEAN DEFAULT false, -- Critical for safety
  alert_thresholds JSONB DEFAULT '{}',
  category TEXT DEFAULT 'general'
);

-- Sensor alert rules and thresholds
CREATE TABLE IF NOT EXISTS public.sensor_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  device_id UUID REFERENCES nmea_devices(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN (
    'threshold_high', 'threshold_low', 'range_violation', 
    'rate_change', 'device_offline', 'data_invalid', 'custom'
  )),
  threshold_value DECIMAL,
  threshold_range JSONB, -- For range checks: {"min": 0, "max": 100}
  rate_limit DECIMAL, -- For rate of change alerts
  time_window_seconds INTEGER DEFAULT 60,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
  is_active BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '["dashboard", "email"]',
  auto_actions JSONB DEFAULT '{}', -- Automated responses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert history and tracking
CREATE TABLE IF NOT EXISTS public.sensor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES sensor_alert_rules(id) ON DELETE CASCADE,
  yacht_id UUID NOT NULL,
  device_id UUID REFERENCES nmea_devices(id) ON DELETE SET NULL,
  parameter_name TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  triggered_value DECIMAL,
  threshold_value DECIMAL,
  alert_message TEXT NOT NULL,
  additional_context JSONB DEFAULT '{}',
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  notification_sent BOOLEAN DEFAULT false,
  auto_action_taken JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device status and health monitoring
CREATE TABLE IF NOT EXISTS public.device_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES nmea_devices(id) ON DELETE CASCADE,
  yacht_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'error', 'maintenance', 'unknown')),
  last_data_received TIMESTAMP WITH TIME ZONE,
  data_frequency_hz DECIMAL DEFAULT 0,
  error_count_24h INTEGER DEFAULT 0,
  battery_level DECIMAL,
  signal_strength INTEGER,
  temperature DECIMAL,
  uptime_hours DECIMAL DEFAULT 0,
  health_score INTEGER DEFAULT 100, -- 0-100 health score
  diagnostic_data JSONB DEFAULT '{}',
  maintenance_due BOOLEAN DEFAULT false,
  next_maintenance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NMEA data aggregation for analytics (hourly rollups)
CREATE TABLE IF NOT EXISTS public.nmea_data_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  device_id UUID NOT NULL REFERENCES nmea_devices(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  hour_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  sample_count INTEGER DEFAULT 0,
  quality_score DECIMAL DEFAULT 100,
  anomaly_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NMEA system configuration
CREATE TABLE IF NOT EXISTS public.nmea_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL UNIQUE,
  gateway_ip TEXT,
  gateway_port INTEGER DEFAULT 2000,
  update_frequency_hz DECIMAL DEFAULT 1.0,
  data_retention_days INTEGER DEFAULT 365,
  compression_enabled BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT false,
  backup_enabled BOOLEAN DEFAULT true,
  alert_escalation_rules JSONB DEFAULT '{}',
  integration_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_nmea_devices_yacht ON nmea_devices(yacht_id);
CREATE INDEX IF NOT EXISTS idx_nmea_devices_type ON nmea_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_nmea_devices_active ON nmea_devices(is_active);

CREATE INDEX IF NOT EXISTS idx_sensor_data_yacht_time ON nmea_sensor_data(yacht_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_time ON nmea_sensor_data(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_pgn ON nmea_sensor_data(pgn);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON nmea_sensor_data(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sensor_alerts_yacht ON sensor_alerts(yacht_id);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_severity ON sensor_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_unresolved ON sensor_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_sensor_alerts_created ON sensor_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_rules_yacht ON sensor_alert_rules(yacht_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON sensor_alert_rules(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_device_health_yacht ON device_health_status(yacht_id);
CREATE INDEX IF NOT EXISTS idx_device_health_status ON device_health_status(status);

CREATE INDEX IF NOT EXISTS idx_hourly_data_yacht_time ON nmea_data_hourly(yacht_id, hour_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_data_device_param ON nmea_data_hourly(device_id, parameter_name);

-- Enable Row Level Security
ALTER TABLE nmea_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmea_sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_health_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmea_data_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmea_system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (yacht-based access control)
CREATE POLICY "Users can access their yacht's NMEA devices" ON nmea_devices
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's sensor data" ON nmea_sensor_data
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their yacht's alert rules" ON sensor_alert_rules
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their yacht's alerts" ON sensor_alerts
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's device health" ON device_health_status
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's hourly data" ON nmea_data_hourly
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their yacht's NMEA config" ON nmea_system_config
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

-- Functions for NMEA data processing

-- Function to process incoming NMEA 2000 message
CREATE OR REPLACE FUNCTION process_nmea_message(
  p_yacht_id UUID,
  p_device_id UUID,
  p_pgn INTEGER,
  p_source_address INTEGER,
  p_raw_data BYTEA,
  p_parsed_data JSONB
)
RETURNS UUID AS $$
DECLARE
  v_record_id UUID;
  v_alert_rule RECORD;
  v_parameter_name TEXT;
  v_parameter_value DECIMAL;
BEGIN
  -- Insert sensor data
  INSERT INTO nmea_sensor_data (
    yacht_id, device_id, pgn, source_address, 
    raw_data, parsed_data, timestamp
  ) VALUES (
    p_yacht_id, p_device_id, p_pgn, p_source_address,
    p_raw_data, p_parsed_data, NOW()
  ) RETURNING id INTO v_record_id;

  -- Update device health status
  UPDATE device_health_status 
  SET 
    last_data_received = NOW(),
    status = 'online',
    updated_at = NOW()
  WHERE device_id = p_device_id;

  -- Check alert rules for each parameter
  FOR v_parameter_name, v_parameter_value IN
    SELECT key, CAST(value AS DECIMAL)
    FROM jsonb_each_text(p_parsed_data)
    WHERE jsonb_typeof(value) = 'number'
  LOOP
    -- Check all active alert rules for this parameter
    FOR v_alert_rule IN
      SELECT *
      FROM sensor_alert_rules
      WHERE yacht_id = p_yacht_id
        AND (device_id = p_device_id OR device_id IS NULL)
        AND parameter_name = v_parameter_name
        AND is_active = true
    LOOP
      -- Check threshold conditions
      IF (v_alert_rule.condition_type = 'threshold_high' AND v_parameter_value > v_alert_rule.threshold_value) OR
         (v_alert_rule.condition_type = 'threshold_low' AND v_parameter_value < v_alert_rule.threshold_value) THEN
        
        PERFORM trigger_sensor_alert(
          v_alert_rule.id,
          p_yacht_id,
          p_device_id,
          v_parameter_name,
          v_parameter_value,
          v_alert_rule.threshold_value
        );
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_record_id;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger sensor alerts
CREATE OR REPLACE FUNCTION trigger_sensor_alert(
  p_alert_rule_id UUID,
  p_yacht_id UUID,
  p_device_id UUID,
  p_parameter_name TEXT,
  p_triggered_value DECIMAL,
  p_threshold_value DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
  v_rule RECORD;
  v_alert_message TEXT;
BEGIN
  -- Get alert rule details
  SELECT * INTO v_rule FROM sensor_alert_rules WHERE id = p_alert_rule_id;
  
  -- Check if we already have an unresolved alert for this condition
  IF EXISTS (
    SELECT 1 FROM sensor_alerts 
    WHERE alert_rule_id = p_alert_rule_id 
      AND parameter_name = p_parameter_name
      AND is_resolved = false
      AND created_at > NOW() - INTERVAL '1 hour'
  ) THEN
    RETURN NULL; -- Don't spam alerts
  END IF;

  -- Build alert message
  v_alert_message := format(
    '%s alert: %s value %.2f %s threshold %.2f',
    UPPER(v_rule.severity),
    p_parameter_name,
    p_triggered_value,
    CASE 
      WHEN v_rule.condition_type = 'threshold_high' THEN 'exceeds'
      WHEN v_rule.condition_type = 'threshold_low' THEN 'below'
      ELSE 'violates'
    END,
    p_threshold_value
  );

  -- Create alert record
  INSERT INTO sensor_alerts (
    alert_rule_id, yacht_id, device_id, parameter_name,
    alert_type, severity, triggered_value, threshold_value,
    alert_message, additional_context
  ) VALUES (
    p_alert_rule_id, p_yacht_id, p_device_id, p_parameter_name,
    v_rule.condition_type, v_rule.severity, p_triggered_value, p_threshold_value,
    v_alert_message, jsonb_build_object(
      'rule_name', v_rule.rule_name,
      'device_id', p_device_id,
      'timestamp', NOW()
    )
  ) RETURNING id INTO v_alert_id;

  -- Trigger notifications (this would integrate with notification system)
  PERFORM pg_notify('yacht_alert', json_build_object(
    'alert_id', v_alert_id,
    'yacht_id', p_yacht_id,
    'severity', v_rule.severity,
    'message', v_alert_message
  )::text);

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function for hourly data aggregation
CREATE OR REPLACE FUNCTION aggregate_hourly_data()
RETURNS void AS $$
DECLARE
  v_current_hour TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the current hour boundary
  v_current_hour := date_trunc('hour', NOW() - INTERVAL '1 hour');
  
  -- Aggregate data for the previous hour
  INSERT INTO nmea_data_hourly (
    yacht_id, device_id, parameter_name, hour_timestamp,
    avg_value, min_value, max_value, sample_count, quality_score
  )
  SELECT 
    yacht_id,
    device_id,
    key as parameter_name,
    v_current_hour,
    AVG(CAST(value AS DECIMAL)),
    MIN(CAST(value AS DECIMAL)),
    MAX(CAST(value AS DECIMAL)),
    COUNT(*),
    AVG(signal_quality)
  FROM nmea_sensor_data,
       jsonb_each_text(parsed_data)
  WHERE timestamp >= v_current_hour 
    AND timestamp < v_current_hour + INTERVAL '1 hour'
    AND jsonb_typeof(value) = 'number'
    AND is_valid = true
  GROUP BY yacht_id, device_id, key
  ON CONFLICT (yacht_id, device_id, parameter_name, hour_timestamp) DO UPDATE SET
    avg_value = EXCLUDED.avg_value,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    sample_count = EXCLUDED.sample_count,
    quality_score = EXCLUDED.quality_score;
END;
$$ LANGUAGE plpgsql;

-- Insert common NMEA 2000 parameter definitions
INSERT INTO nmea_parameters (pgn, parameter_name, parameter_code, data_type, unit, description, is_critical) VALUES
(127488, 'engine_speed', 'rpm', 'integer', 'rpm', 'Engine Speed', true),
(127488, 'engine_load', 'load', 'integer', '%', 'Engine Load', true),
(127489, 'engine_coolant_temp', 'coolant_temp', 'float', '°C', 'Engine Coolant Temperature', true),
(127489, 'engine_oil_pressure', 'oil_pressure', 'float', 'kPa', 'Engine Oil Pressure', true),
(127505, 'fluid_level', 'level', 'float', '%', 'Fluid Level', false),
(128259, 'boat_speed', 'speed', 'float', 'knots', 'Speed Over Water', false),
(128267, 'water_depth', 'depth', 'float', 'm', 'Water Depth', false),
(129025, 'latitude', 'lat', 'float', 'degrees', 'Latitude', false),
(129025, 'longitude', 'lon', 'float', 'degrees', 'Longitude', false),
(129026, 'course_over_ground', 'cog', 'float', 'degrees', 'Course Over Ground', false),
(129026, 'speed_over_ground', 'sog', 'float', 'knots', 'Speed Over Ground', false),
(130306, 'wind_speed', 'wind_speed', 'float', 'knots', 'Wind Speed', false),
(130306, 'wind_direction', 'wind_dir', 'float', 'degrees', 'Wind Direction', false)
ON CONFLICT (pgn, parameter_code) DO NOTHING;

-- Grant permissions
GRANT ALL ON nmea_devices TO authenticated;
GRANT ALL ON nmea_sensor_data TO authenticated;
GRANT SELECT ON nmea_parameters TO authenticated;
GRANT ALL ON sensor_alert_rules TO authenticated;
GRANT ALL ON sensor_alerts TO authenticated;
GRANT ALL ON device_health_status TO authenticated;
GRANT ALL ON nmea_data_hourly TO authenticated;
GRANT ALL ON nmea_system_config TO authenticated;

COMMENT ON TABLE nmea_devices IS 'Registry of NMEA 2000 devices on each yacht';
COMMENT ON TABLE nmea_sensor_data IS 'Real-time sensor data from NMEA 2000 devices';
COMMENT ON TABLE nmea_parameters IS 'NMEA parameter definitions and metadata';
COMMENT ON TABLE sensor_alert_rules IS 'Configurable alert rules for sensor monitoring';
COMMENT ON TABLE sensor_alerts IS 'Alert history and tracking';
COMMENT ON TABLE device_health_status IS 'Device health and connectivity status';
COMMENT ON TABLE nmea_data_hourly IS 'Hourly aggregated sensor data for analytics';
COMMENT ON TABLE nmea_system_config IS 'NMEA system configuration per yacht';