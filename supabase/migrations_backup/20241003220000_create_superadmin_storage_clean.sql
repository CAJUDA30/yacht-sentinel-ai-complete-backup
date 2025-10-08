-- =============================================
-- SuperAdmin Complete Persistent Storage Schema (Clean Version)
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

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Developer Configuration
CREATE INDEX IF NOT EXISTS idx_dev_config_user_key ON dev_configuration_settings(user_id, setting_key);
CREATE INDEX IF NOT EXISTS idx_dev_config_encrypted ON dev_configuration_settings(is_encrypted, user_id);

-- Monitoring Preferences  
CREATE INDEX IF NOT EXISTS idx_monitoring_user ON monitoring_preferences(user_id);

-- Admin Panel Settings
CREATE INDEX IF NOT EXISTS idx_admin_panel_user ON admin_panel_settings(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE dev_configuration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_panel_settings ENABLE ROW LEVEL SECURITY;

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

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to increment access count
CREATE OR REPLACE FUNCTION increment_access_count(setting_key_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE dev_configuration_settings 
  SET 
    access_count = COALESCE(access_count, 0) + 1,
    last_accessed = NOW()
  WHERE setting_key = setting_key_param;
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

-- Apply triggers to tables
CREATE TRIGGER update_dev_config_updated_at
  BEFORE UPDATE ON dev_configuration_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_preferences_updated_at  
  BEFORE UPDATE ON monitoring_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_panel_settings_updated_at
  BEFORE UPDATE ON admin_panel_settings
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

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION increment_access_count(TEXT) TO authenticated;