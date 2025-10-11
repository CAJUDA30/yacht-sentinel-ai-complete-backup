-- Quantum Security System schema for QuantumSecuritySystem component
-- This replaces mock security and biometric data with real database integration

-- Security metrics tracking for real-time monitoring
CREATE TABLE IF NOT EXISTS public.security_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL CHECK (metric_name IN (
    'quantum_protection', 'threat_detection', 'encryption_strength', 
    'access_attempts', 'blocked_threats', 'active_monitoring'
  )),
  metric_value DECIMAL NOT NULL,
  unit TEXT DEFAULT '%',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threat events table for security monitoring
CREATE TABLE IF NOT EXISTS public.threat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_type TEXT NOT NULL CHECK (threat_type IN (
    'quantum', 'intrusion', 'malware', 'phishing', 'social', 'ddos', 'ransomware'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  source_ip TEXT,
  source_description TEXT,
  target_system TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('detected', 'blocked', 'investigating', 'resolved')),
  description TEXT NOT NULL,
  detection_method TEXT,
  response_actions JSONB DEFAULT '{}',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security layers configuration and status
CREATE TABLE IF NOT EXISTS public.security_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_name TEXT NOT NULL,
  layer_type TEXT NOT NULL CHECK (layer_type IN (
    'quantum', 'biometric', 'behavioral', 'network', 'endpoint', 'encryption'
  )),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'updating', 'error')),
  protection_percentage DECIMAL DEFAULT 0.00,
  is_enabled BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  update_frequency_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Biometric authentication systems
CREATE TABLE IF NOT EXISTS public.biometric_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_type TEXT NOT NULL CHECK (system_type IN (
    'fingerprint', 'iris', 'facial', 'voice', 'behavioral', 'palm', 'retina'
  )),
  accuracy_percentage DECIMAL DEFAULT 0.00,
  average_speed_seconds DECIMAL DEFAULT 0.00,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'calibrating', 'maintenance')),
  active_users INTEGER DEFAULT 0,
  total_enrollments INTEGER DEFAULT 0,
  success_rate DECIMAL DEFAULT 0.00,
  hardware_info JSONB DEFAULT '{}',
  calibration_data JSONB DEFAULT '{}',
  last_calibration TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User biometric enrollments
CREATE TABLE IF NOT EXISTS public.user_biometric_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biometric_system_id UUID NOT NULL REFERENCES biometric_systems(id) ON DELETE CASCADE,
  enrollment_status TEXT NOT NULL CHECK (enrollment_status IN ('enrolled', 'pending', 'failed', 'revoked')),
  template_data BYTEA, -- Encrypted biometric template
  enrollment_quality_score DECIMAL DEFAULT 0.00,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access control events for monitoring
CREATE TABLE IF NOT EXISTS public.access_control_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login', 'logout', 'authentication', 'authorization', 'access_denied', 'session_timeout'
  )),
  authentication_method TEXT CHECK (authentication_method IN (
    'password', 'biometric', 'mfa', 'api_key', 'oauth'
  )),
  biometric_system_id UUID REFERENCES biometric_systems(id),
  source_ip TEXT,
  user_agent TEXT,
  resource_accessed TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  risk_score INTEGER DEFAULT 0,
  geolocation JSONB DEFAULT '{}',
  device_info JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security system configurations
CREATE TABLE IF NOT EXISTS public.security_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  last_modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE security_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_biometric_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_control_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_system_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enterprise access
CREATE POLICY "Allow all operations on security_metrics" ON security_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on threat_events" ON threat_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on security_layers" ON security_layers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on biometric_systems" ON biometric_systems FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view their biometric enrollments" ON user_biometric_enrollments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their biometric enrollments" ON user_biometric_enrollments FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Allow all operations on access_control_events" ON access_control_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on security_system_config" ON security_system_config FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_metrics_recorded ON security_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_metrics_name ON security_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_threat_events_created ON threat_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_events_severity ON threat_events(severity);
CREATE INDEX IF NOT EXISTS idx_threat_events_status ON threat_events(status);
CREATE INDEX IF NOT EXISTS idx_security_layers_type ON security_layers(layer_type);
CREATE INDEX IF NOT EXISTS idx_security_layers_status ON security_layers(status);
CREATE INDEX IF NOT EXISTS idx_biometric_systems_type ON biometric_systems(system_type);
CREATE INDEX IF NOT EXISTS idx_user_biometric_enrollments_user ON user_biometric_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_access_control_events_user ON access_control_events(user_id);
CREATE INDEX IF NOT EXISTS idx_access_control_events_created ON access_control_events(created_at DESC);

-- Insert sample security metrics
INSERT INTO security_metrics (metric_name, metric_value, unit) VALUES
('quantum_protection', 100.0, '%'),
('threat_detection', 99.7, '%'),
('encryption_strength', 256, 'bits'),
('access_attempts', 15847, 'count'),
('blocked_threats', 247, 'count'),
('active_monitoring', 99.9, '%');

-- Insert sample threat events
INSERT INTO threat_events (
  threat_type, severity, source_ip, source_description, target_system, 
  status, description, detection_method, response_actions
) VALUES 
(
  'quantum',
  'high',
  '203.142.67.89',
  'External threat actor',
  'Authentication System',
  'blocked',
  'Quantum decryption attempt on authentication tokens',
  'Quantum signature analysis',
  '{"action": "blocked_ip", "notification": "sent", "escalated": true}'
),
(
  'intrusion',
  'critical',
  '45.231.108.174',
  'Unknown external source',
  'Database Server',
  'blocked',
  'Attempted unauthorized access to vessel data',
  'Intrusion detection system',
  '{"action": "blocked_ip", "forensics": "collected", "alert": "critical"}'
),
(
  'malware',
  'medium',
  'email@suspicious-domain.com',
  'Phishing email',
  'User Workstation',
  'resolved',
  'Malicious email attachment neutralized',
  'Email security gateway',
  '{"action": "quarantined", "user_notified": true, "scan_complete": true}'
),
(
  'phishing',
  'low',
  'fake-login.yachtexcel.com',
  'Spoofed domain',
  'User Portal',
  'investigating',
  'Phishing website attempting credential theft',
  'DNS monitoring',
  '{"action": "domain_blocked", "investigation": "ongoing", "users_warned": true}'
),
(
  'social',
  'high',
  'Phone Call',
  'Social engineering attempt',
  'Support Team',
  'blocked',
  'Social engineering attempt targeting support staff',
  'Staff training protocol',
  '{"action": "call_terminated", "staff_alerted": true, "protocol_followed": true}'
);

-- Insert sample security layers
INSERT INTO security_layers (
  id, layer_name, layer_type, status, protection_percentage, is_enabled, features
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Quantum Encryption Layer',
  'quantum',
  'active',
  100.0,
  true,
  ARRAY['Quantum Key Distribution', 'Post-Quantum Cryptography', 'Quantum Random Number Generation', 'Quantum-Safe Protocols']
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Advanced Biometric Authentication',
  'biometric',
  'active',
  99.8,
  true,
  ARRAY['Multi-Modal Biometrics', 'Liveness Detection', 'Behavioral Analysis', 'Continuous Authentication']
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'AI Behavioral Analysis',
  'behavioral',
  'active',
  97.5,
  true,
  ARRAY['User Behavior Modeling', 'Anomaly Detection', 'Risk Scoring', 'Adaptive Policies']
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Network Security Fortress',
  'network',
  'active',
  98.9,
  true,
  ARRAY['Zero-Trust Architecture', 'Micro-Segmentation', 'DDoS Protection', 'Intrusion Prevention']
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'Endpoint Protection Guardian',
  'endpoint',
  'updating',
  96.2,
  true,
  ARRAY['Real-time Monitoring', 'Malware Prevention', 'Device Control', 'Application Whitelisting']
);

-- Insert sample biometric systems
INSERT INTO biometric_systems (
  system_type, accuracy_percentage, average_speed_seconds, status, 
  active_users, total_enrollments, success_rate
) VALUES 
('fingerprint', 99.7, 0.3, 'active', 1247, 1389, 99.2),
('iris', 99.9, 0.5, 'active', 856, 923, 99.8),
('facial', 98.4, 0.2, 'active', 1534, 1678, 97.9),
('voice', 97.8, 1.2, 'active', 678, 734, 96.5),
('behavioral', 94.2, 0.1, 'calibrating', 2156, 2398, 93.8);

-- Insert sample access control events (recent activity)
INSERT INTO access_control_events (
  user_id, event_type, authentication_method, source_ip, resource_accessed, 
  success, risk_score, device_info, session_id
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'login',
  'biometric',
  '192.168.1.100',
  '/dashboard',
  true,
  5,
  '{"device": "mobile", "os": "iOS", "browser": "Safari"}',
  'sess_' || gen_random_uuid()
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'authentication',
  'mfa',
  '10.0.0.45',
  '/api/yacht-data',
  true,
  3,
  '{"device": "desktop", "os": "Windows", "browser": "Chrome"}',
  'sess_' || gen_random_uuid()
),
(
  null,
  'access_denied',
  'password',
  '45.231.108.174',
  '/admin',
  false,
  95,
  '{"device": "unknown", "suspicious": true}',
  null
);

-- Insert system configuration
INSERT INTO security_system_config (config_key, config_value, description) VALUES 
(
  'quantum_encryption_enabled',
  'true',
  'Enable quantum-resistant encryption protocols'
),
(
  'biometric_threshold',
  '{"fingerprint": 95.0, "iris": 98.0, "facial": 92.0, "voice": 90.0}',
  'Minimum accuracy thresholds for biometric authentication'
),
(
  'threat_detection_sensitivity',
  '{"level": "high", "auto_block": true, "notification": true}',
  'Threat detection system sensitivity and response configuration'
),
(
  'security_monitoring',
  '{"real_time": true, "retention_days": 90, "alerting": true}',
  'Security monitoring and logging configuration'
);

-- Create function to update security metrics
CREATE OR REPLACE FUNCTION update_security_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update access attempts count
  UPDATE security_metrics 
  SET metric_value = metric_value + 1, recorded_at = NOW()
  WHERE metric_name = 'access_attempts';

  -- Update blocked threats if access was denied
  IF NEW.success = false AND NEW.risk_score > 50 THEN
    UPDATE security_metrics 
    SET metric_value = metric_value + 1, recorded_at = NOW()
    WHERE metric_name = 'blocked_threats';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update metrics
CREATE TRIGGER update_security_metrics_trigger
  AFTER INSERT ON access_control_events
  FOR EACH ROW
  EXECUTE FUNCTION update_security_metrics();

-- Create function for automatic threat escalation
CREATE OR REPLACE FUNCTION handle_threat_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-escalate critical and high severity threats
  IF NEW.severity IN ('critical', 'high') AND NEW.status = 'detected' THEN
    -- Log escalation
    INSERT INTO security_audit_logs (
      event_type, action_attempted, access_granted, risk_level, details
    ) VALUES (
      'threat_escalation',
      'Auto-escalated ' || NEW.severity || ' threat: ' || NEW.threat_type,
      false,
      NEW.severity,
      jsonb_build_object(
        'threat_id', NEW.id,
        'threat_type', NEW.threat_type,
        'source', NEW.source_ip,
        'target', NEW.target_system
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for threat escalation
CREATE TRIGGER threat_escalation_trigger
  AFTER INSERT ON threat_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_threat_escalation();

COMMENT ON TABLE security_metrics IS 'Real-time security system metrics and monitoring data';
COMMENT ON TABLE threat_events IS 'Security threat detection, analysis and response tracking';
COMMENT ON TABLE security_layers IS 'Multi-layered security system configuration and status';
COMMENT ON TABLE biometric_systems IS 'Biometric authentication systems and performance metrics';