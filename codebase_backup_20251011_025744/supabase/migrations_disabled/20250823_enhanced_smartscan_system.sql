-- Enhanced SmartScan Configuration System
-- Superadmin configuration, ML model management, bulk processing, and privacy controls

-- SmartScan system configuration table (superadmin only)
CREATE TABLE IF NOT EXISTS public.smartscan_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name TEXT NOT NULL UNIQUE,
  ai_model_config JSONB DEFAULT '{
    "primary_model": "yachtie-enhanced-orchestrator",
    "fallback_model": "general-ocr",
    "confidence_threshold": 0.7,
    "yacht_specific_model": null,
    "training_enabled": false
  }',
  document_types_config JSONB DEFAULT '{
    "yacht_documents": ["yacht_registration", "insurance_certificate", "safety_certificate"],
    "crew_documents": ["crew_license", "passport", "medical_certificate", "stcw_certificate"],
    "custom_types": [],
    "max_file_size_mb": 10,
    "supported_formats": ["jpeg", "jpg", "png", "pdf"]
  }',
  privacy_settings JSONB DEFAULT '{
    "require_explicit_consent": true,
    "data_retention_days": 30,
    "auto_delete_processed": false,
    "gdpr_compliance": true,
    "audit_all_access": true,
    "per_document_consent": false
  }',
  thumbnail_config JSONB DEFAULT '{
    "max_size_px": 200,
    "quality": 85,
    "format": "jpeg",
    "auto_crop": true,
    "max_file_size_mb": 5
  }',
  popup_banner_config JSONB DEFAULT '{
    "show_at_login": true,
    "auto_dismiss_seconds": 5,
    "frequency_days": 7,
    "role_exemptions": [],
    "custom_text": null
  }',
  bulk_processing_config JSONB DEFAULT '{
    "enabled": true,
    "max_documents_per_batch": 50,
    "parallel_processing_limit": 5,
    "timeout_minutes": 30,
    "progress_polling_interval_ms": 1000
  }',
  mobile_camera_config JSONB DEFAULT '{
    "auto_capture_enabled": true,
    "edge_detection": true,
    "glare_detection": true,
    "guidance_overlay": true,
    "auto_focus": true,
    "flash_detection": true
  }',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SmartScan ML training jobs table
CREATE TABLE IF NOT EXISTS public.smartscan_ml_training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  training_type TEXT NOT NULL CHECK (training_type IN ('fine_tune', 'custom_model', 'domain_adaptation')),
  base_model TEXT NOT NULL,
  training_dataset JSONB NOT NULL, -- Dataset metadata and file references
  training_config JSONB DEFAULT '{
    "epochs": 10,
    "learning_rate": 0.001,
    "batch_size": 16,
    "validation_split": 0.2
  }',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0,
  training_metrics JSONB DEFAULT '{}',
  model_artifact_path TEXT,
  error_log TEXT,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SmartScan bulk processing sessions
CREATE TABLE IF NOT EXISTS public.smartscan_bulk_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  yacht_id UUID REFERENCES yacht_profiles(id),
  document_count INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processing_config JSONB DEFAULT '{}',
  batch_results JSONB DEFAULT '[]',
  error_details JSONB DEFAULT '[]',
  estimated_completion TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SmartScan documents for bulk processing
CREATE TABLE IF NOT EXISTS public.smartscan_bulk_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_session_id UUID NOT NULL REFERENCES smartscan_bulk_sessions(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB DEFAULT '{}',
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SmartScan privacy audit logs
CREATE TABLE IF NOT EXISTS public.smartscan_privacy_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  yacht_id UUID REFERENCES yacht_profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('consent_given', 'consent_revoked', 'data_accessed', 'data_processed', 'data_deleted', 'export_requested')),
  document_id UUID,
  document_type TEXT,
  consent_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  processing_purpose TEXT,
  data_retention_until TIMESTAMP WITH TIME ZONE,
  gdpr_legal_basis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SmartScan user document consents (granular privacy control)
CREATE TABLE IF NOT EXISTS public.smartscan_document_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('processing', 'storage', 'ml_training', 'sharing')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  purpose_description TEXT,
  legal_basis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, document_id, consent_type)
);

-- SmartScan yacht thumbnails
CREATE TABLE IF NOT EXISTS public.smartscan_yacht_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  original_filename TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  original_path TEXT,
  file_size_bytes INTEGER,
  width_px INTEGER,
  height_px INTEGER,
  format TEXT NOT NULL,
  quality INTEGER,
  is_primary BOOLEAN DEFAULT false,
  upload_source TEXT DEFAULT 'smartscan' CHECK (upload_source IN ('smartscan', 'manual', 'bulk')),
  processing_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SmartScan login triggers
CREATE TABLE IF NOT EXISTS public.smartscan_login_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('onboarding', 'profile_update', 'compliance_check', 'thumbnail_refresh')),
  role_assigned TEXT,
  yacht_id UUID REFERENCES yacht_profiles(id),
  trigger_reason TEXT,
  last_shown_at TIMESTAMP WITH TIME ZONE,
  times_shown INTEGER DEFAULT 0,
  times_dismissed INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  next_trigger_at TIMESTAMP WITH TIME ZONE,
  is_persistent BOOLEAN DEFAULT false,
  config_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trigger_type, yacht_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_smartscan_config_active ON public.smartscan_system_config(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_smartscan_training_status ON public.smartscan_ml_training_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smartscan_bulk_sessions_user ON public.smartscan_bulk_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smartscan_bulk_documents_session ON public.smartscan_bulk_documents(bulk_session_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_smartscan_privacy_audit_user ON public.smartscan_privacy_audit(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smartscan_consents_user_doc ON public.smartscan_document_consents(user_id, document_id);
CREATE INDEX IF NOT EXISTS idx_smartscan_thumbnails_yacht ON public.smartscan_yacht_thumbnails(yacht_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_smartscan_login_triggers_user ON public.smartscan_login_triggers(user_id, next_trigger_at);

-- Enable Row Level Security
ALTER TABLE public.smartscan_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartscan_ml_training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartscan_bulk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartscan_bulk_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartscan_privacy_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartscan_document_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartscan_yacht_thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartscan_login_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- System config - superadmin only
CREATE POLICY "Superadmins can manage SmartScan config" ON public.smartscan_system_config
  FOR ALL USING (is_superadmin_or_named(auth.uid()));

-- ML training jobs - superadmin and job creators
CREATE POLICY "Users can view their ML training jobs" ON public.smartscan_ml_training_jobs
  FOR SELECT USING (auth.uid() = created_by OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "Users can create ML training jobs" ON public.smartscan_ml_training_jobs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Superadmins can manage all ML training jobs" ON public.smartscan_ml_training_jobs
  FOR ALL USING (is_superadmin_or_named(auth.uid()));

-- Bulk sessions - users can manage their own
CREATE POLICY "Users can manage their bulk sessions" ON public.smartscan_bulk_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all bulk sessions" ON public.smartscan_bulk_sessions
  FOR SELECT USING (is_superadmin_or_named(auth.uid()));

-- Bulk documents - users can manage their session documents
CREATE POLICY "Users can manage their bulk documents" ON public.smartscan_bulk_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM smartscan_bulk_sessions 
      WHERE id = bulk_session_id AND user_id = auth.uid()
    )
  );

-- Privacy audit - users can view their own, superadmins can view all
CREATE POLICY "Users can view their privacy audit" ON public.smartscan_privacy_audit
  FOR SELECT USING (auth.uid() = user_id OR is_superadmin_or_named(auth.uid()));

CREATE POLICY "System can insert privacy audit logs" ON public.smartscan_privacy_audit
  FOR INSERT WITH CHECK (true);

-- Document consents - users can manage their own
CREATE POLICY "Users can manage their document consents" ON public.smartscan_document_consents
  FOR ALL USING (auth.uid() = user_id);

-- Yacht thumbnails - yacht access control
CREATE POLICY "Users can manage yacht thumbnails they have access to" ON public.smartscan_yacht_thumbnails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM yacht_access_control 
      WHERE yacht_id = smartscan_yacht_thumbnails.yacht_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager', 'captain')
    ) OR auth.uid() = user_id
  );

-- Login triggers - users can manage their own
CREATE POLICY "Users can manage their login triggers" ON public.smartscan_login_triggers
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.smartscan_system_config TO authenticated;
GRANT ALL ON public.smartscan_ml_training_jobs TO authenticated;
GRANT ALL ON public.smartscan_bulk_sessions TO authenticated;
GRANT ALL ON public.smartscan_bulk_documents TO authenticated;
GRANT ALL ON public.smartscan_privacy_audit TO authenticated;
GRANT ALL ON public.smartscan_document_consents TO authenticated;
GRANT ALL ON public.smartscan_yacht_thumbnails TO authenticated;
GRANT ALL ON public.smartscan_login_triggers TO authenticated;

-- Insert default system configuration
INSERT INTO public.smartscan_system_config (config_name, created_by)
SELECT 'default_config', id FROM auth.users WHERE email = 'superadmin@yachtexcel.com' LIMIT 1
ON CONFLICT (config_name) DO NOTHING;

-- Trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_smartscan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_smartscan_config_updated_at
  BEFORE UPDATE ON public.smartscan_system_config
  FOR EACH ROW EXECUTE FUNCTION update_smartscan_updated_at();

CREATE TRIGGER update_smartscan_training_updated_at
  BEFORE UPDATE ON public.smartscan_ml_training_jobs
  FOR EACH ROW EXECUTE FUNCTION update_smartscan_updated_at();

CREATE TRIGGER update_smartscan_bulk_sessions_updated_at
  BEFORE UPDATE ON public.smartscan_bulk_sessions
  FOR EACH ROW EXECUTE FUNCTION update_smartscan_updated_at();

CREATE TRIGGER update_smartscan_consents_updated_at
  BEFORE UPDATE ON public.smartscan_document_consents
  FOR EACH ROW EXECUTE FUNCTION update_smartscan_updated_at();

CREATE TRIGGER update_smartscan_thumbnails_updated_at
  BEFORE UPDATE ON public.smartscan_yacht_thumbnails
  FOR EACH ROW EXECUTE FUNCTION update_smartscan_updated_at();

CREATE TRIGGER update_smartscan_triggers_updated_at
  BEFORE UPDATE ON public.smartscan_login_triggers
  FOR EACH ROW EXECUTE FUNCTION update_smartscan_updated_at();

COMMENT ON TABLE public.smartscan_system_config IS 'Enhanced SmartScan system configuration managed by superadmins';
COMMENT ON TABLE public.smartscan_ml_training_jobs IS 'ML model training job tracking for custom yacht-specific models';
COMMENT ON TABLE public.smartscan_bulk_sessions IS 'Bulk document processing sessions with progress tracking';
COMMENT ON TABLE public.smartscan_privacy_audit IS 'GDPR/CCPA compliance audit trail for SmartScan data processing';
COMMENT ON TABLE public.smartscan_yacht_thumbnails IS 'Yacht thumbnail images processed through SmartScan';
COMMENT ON TABLE public.smartscan_login_triggers IS 'Login-triggered SmartScan prompts and compliance checks';