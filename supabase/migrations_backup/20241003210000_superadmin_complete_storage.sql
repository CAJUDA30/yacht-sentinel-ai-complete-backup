-- =============================================
-- SuperAdmin Complete Persistent Storage Schema
-- Creates encrypted storage for all SuperAdmin settings
-- =============================================

-- Developer Configuration Settings (Encrypted API Keys)
CREATE TABLE IF NOT EXISTS dev_configuration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  encrypted_value TEXT, -- For API keys and sensitive data
  is_encrypted BOOLEAN DEFAULT FALSE,
  encryption_version INTEGER DEFAULT 1,
  last_accessed TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0
);

-- Monitoring Dashboard Preferences
CREATE TABLE IF NOT EXISTS monitoring_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  dashboard_layout JSONB DEFAULT '{
    "widgets": [],
    "grid_size": "medium",
    "auto_refresh": true,
    "refresh_interval": 30000
  }'::jsonb,
  alert_thresholds JSONB DEFAULT '{
    "cpu_warning": 70,
    "cpu_critical": 90,
    "memory_warning": 80,
    "memory_critical": 95,
    "response_time_warning": 1000,
    "response_time_critical": 3000
  }'::jsonb,
  notification_settings JSONB DEFAULT '{
    "email_alerts": true,
    "desktop_notifications": true,
    "sound_enabled": false,
    "critical_only": false
  }'::jsonb,
  display_preferences JSONB DEFAULT '{
    "theme": "dark",
    "chart_types": {
      "cpu": "line",
      "memory": "area",
      "requests": "bar"
    },
    "time_range": "1h",
    "show_legends": true
  }'::jsonb
);

-- Administration Panel Settings
CREATE TABLE IF NOT EXISTS admin_panel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  panel_preferences JSONB DEFAULT '{
    "default_view": "overview",
    "items_per_page": 25,
    "auto_save": true,
    "confirmation_dialogs": true
  }'::jsonb,
  access_control_settings JSONB DEFAULT '{
    "session_timeout": 3600,
    "require_confirmation": true,
    "audit_all_actions": true,
    "ip_restrictions": []
  }'::jsonb,
  user_management_preferences JSONB DEFAULT '{
    "default_role": "user",
    "auto_approve_registrations": false,
    "require_email_verification": true,
    "password_requirements": {
      "min_length": 8,
      "require_uppercase": true,
      "require_numbers": true,
      "require_symbols": true
    }
  }'::jsonb
);

-- Visual Mapping Configurations (Extended)
CREATE TABLE IF NOT EXISTS visual_mapping_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  mapping_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  field_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_thresholds JSONB DEFAULT '{
    "high": 0.9,
    "medium": 0.7,
    "low": 0.5
  }'::jsonb,
  processing_settings JSONB DEFAULT '{
    "auto_process": false,
    "require_review": true,
    "backup_originals": true
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ
);

-- AI Configuration Storage (Extended)
CREATE TABLE IF NOT EXISTS ai_configuration_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  provider_name TEXT NOT NULL,
  configuration JSONB NOT NULL,
  encrypted_credentials TEXT, -- Encrypted API keys
  is_active BOOLEAN DEFAULT true,
  priority_order INTEGER DEFAULT 0,
  rate_limits JSONB DEFAULT '{
    "requests_per_minute": 60,
    "tokens_per_minute": 10000
  }'::jsonb,
  cost_tracking JSONB DEFAULT '{
    "daily_limit": 50.00,
    "monthly_limit": 1000.00,
    "current_usage": 0.00
  }'::jsonb
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Developer Configuration
CREATE INDEX IF NOT EXISTS idx_dev_config_user_key ON dev_configuration_settings(user_id, setting_key);
CREATE INDEX IF NOT EXISTS idx_dev_config_encrypted ON dev_configuration_settings(is_encrypted, user_id);
CREATE INDEX IF NOT EXISTS idx_dev_config_accessed ON dev_configuration_settings(last_accessed DESC);

-- Monitoring Preferences
CREATE INDEX IF NOT EXISTS idx_monitoring_user ON monitoring_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_updated ON monitoring_preferences(updated_at DESC);

-- Admin Panel Settings
CREATE INDEX IF NOT EXISTS idx_admin_panel_user ON admin_panel_settings(user_id);

-- Visual Mapping
CREATE INDEX IF NOT EXISTS idx_visual_mapping_user ON visual_mapping_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_visual_mapping_type ON visual_mapping_configurations(document_type, is_active);
CREATE INDEX IF NOT EXISTS idx_visual_mapping_global ON visual_mapping_configurations(is_global, is_active);

-- AI Configuration
CREATE INDEX IF NOT EXISTS idx_ai_config_user ON ai_configuration_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_config_provider ON ai_configuration_storage(provider_name, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_config_priority ON ai_configuration_storage(priority_order, is_active);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE dev_configuration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_mapping_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configuration_storage ENABLE ROW LEVEL SECURITY;

-- Developer Configuration Policies
CREATE POLICY "Users can manage their own dev config" ON dev_configuration_settings
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT unnest(ARRAY['6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID, 'a751a50b-740c-4a38-a169-33185128fec5'::UUID])
    )
  );

-- Monitoring Preferences Policies
CREATE POLICY "Users can manage their monitoring preferences" ON monitoring_preferences
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT unnest(ARRAY['6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID, 'a751a50b-740c-4a38-a169-33185128fec5'::UUID])
    )
  );

-- Admin Panel Settings Policies (SuperAdmin only)
CREATE POLICY "SuperAdmins can manage admin panel settings" ON admin_panel_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT unnest(ARRAY['6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID, 'a751a50b-740c-4a38-a169-33185128fec5'::UUID])
    )
  );

-- Visual Mapping Policies
CREATE POLICY "Users can manage their visual mappings" ON visual_mapping_configurations
  FOR ALL USING (
    auth.uid() = user_id OR 
    (is_global = true AND auth.uid() IN (
      SELECT unnest(ARRAY['6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID, 'a751a50b-740c-4a38-a169-33185128fec5'::UUID])
    ))
  );

-- AI Configuration Policies
CREATE POLICY "Users can manage their AI configurations" ON ai_configuration_storage
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT unnest(ARRAY['6d201176-5be1-45d4-b09f-f70cb4ad38ac'::UUID, 'a751a50b-740c-4a38-a169-33185128fec5'::UUID])
    )
  );

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to clean up old access logs
CREATE OR REPLACE FUNCTION cleanup_old_access_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Keep only last 1000 access records per user for dev config
  DELETE FROM dev_configuration_settings 
  WHERE id NOT IN (
    SELECT id FROM dev_configuration_settings 
    ORDER BY last_accessed DESC NULLS LAST 
    LIMIT 1000
  );
END;
$$;

-- Function to get user's encrypted settings count
CREATE OR REPLACE FUNCTION get_encrypted_settings_count(user_id_param UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  encrypted_count INTEGER;
BEGIN
  target_user_id := COALESCE(user_id_param, auth.uid());
  
  SELECT COUNT(*) INTO encrypted_count
  FROM dev_configuration_settings
  WHERE user_id = target_user_id AND is_encrypted = true;
  
  RETURN encrypted_count;
END;
$$;

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply triggers to all tables
CREATE TRIGGER update_dev_config_updated_at
  BEFORE UPDATE ON dev_configuration_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_preferences_updated_at
  BEFORE UPDATE ON monitoring_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_panel_settings_updated_at
  BEFORE UPDATE ON admin_panel_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visual_mapping_updated_at
  BEFORE UPDATE ON visual_mapping_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_config_updated_at
  BEFORE UPDATE ON ai_configuration_storage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GRANTS AND PERMISSIONS
-- =============================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON dev_configuration_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monitoring_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_panel_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON visual_mapping_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_configuration_storage TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION cleanup_old_access_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION get_encrypted_settings_count(UUID) TO authenticated;