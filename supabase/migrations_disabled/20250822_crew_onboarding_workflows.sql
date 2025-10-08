-- Crew Onboarding Workflows database schema
-- Real workflow storage to replace mock console logging

-- Onboarding workflows storage
CREATE TABLE IF NOT EXISTS public.onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL UNIQUE,
  crew_member_id UUID NOT NULL, -- Removed foreign key constraint temporarily
  yacht_id UUID NOT NULL, -- Removed foreign key constraint temporarily
  status TEXT NOT NULL CHECK (status IN ('initiated', 'in_progress', 'pending_validation', 'approved', 'rejected', 'completed')),
  current_step INTEGER DEFAULT 0,
  assigned_by UUID, -- Removed foreign key constraint temporarily
  workflow_data JSONB NOT NULL DEFAULT '{}',
  ai_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding steps storage
CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES onboarding_workflows(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  ai_validated BOOLEAN DEFAULT false,
  confidence DECIMAL(3,2),
  validation_notes TEXT,
  step_order INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding documents storage
CREATE TABLE IF NOT EXISTS public.onboarding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL, -- Removed foreign key constraint temporarily
  document_type TEXT NOT NULL CHECK (document_type IN (
    'passport', 'visa', 'medical_certificate', 'seaman_book', 
    'certification', 'experience_reference', 'banking_details'
  )),
  document_data JSONB NOT NULL DEFAULT '{}',
  file_url TEXT,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
  validation_notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow step templates
CREATE TABLE IF NOT EXISTS public.onboarding_step_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_name TEXT NOT NULL,
  step_description TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  step_order INTEGER NOT NULL,
  ai_validation_enabled BOOLEAN DEFAULT false,
  validation_context TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Onboarding notifications log
CREATE TABLE IF NOT EXISTS public.onboarding_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL, -- Removed foreign key constraint temporarily
  crew_member_id UUID NOT NULL, -- Removed foreign key constraint temporarily
  notification_type TEXT NOT NULL,
  notification_stage TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_email TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE onboarding_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enterprise access
CREATE POLICY "Users can manage onboarding workflows" ON onboarding_workflows FOR ALL USING (true);
CREATE POLICY "Users can manage onboarding steps" ON onboarding_steps FOR ALL USING (true);
CREATE POLICY "Users can manage onboarding documents" ON onboarding_documents FOR ALL USING (true);
CREATE POLICY "Allow read access to step templates" ON onboarding_step_templates FOR SELECT USING (true);
CREATE POLICY "Users can view onboarding notifications" ON onboarding_notifications FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_workflow_id ON onboarding_workflows(workflow_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_crew ON onboarding_workflows(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_yacht ON onboarding_workflows(yacht_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_workflows_status ON onboarding_workflows(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_workflow ON onboarding_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_order ON onboarding_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_workflow ON onboarding_documents(workflow_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_type ON onboarding_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_templates_order ON onboarding_step_templates(step_order);
CREATE INDEX IF NOT EXISTS idx_onboarding_notifications_workflow ON onboarding_notifications(workflow_id);

-- Insert default onboarding step templates
INSERT INTO onboarding_step_templates (
  step_name, step_description, is_required, step_order, ai_validation_enabled, validation_context
) VALUES 
('Personal Information', 'Basic personal details and contact information', true, 1, false, 'personal_info'),
('Document Upload', 'Upload passport, visa, and other required documents', true, 2, false, 'document_upload'),
('Smart Scan Validation', 'AI-powered document verification using Smart Scan', true, 3, true, 'crew_document_validation'),
('Certifications', 'Professional certifications and licenses', true, 4, true, 'crew_certifications'),
('Experience Verification', 'Previous work experience and references', false, 5, true, 'crew_experience'),
('Background Check', 'AI-powered background and sentiment analysis', true, 6, true, 'crew_background_check'),
('Medical Clearance', 'Medical certificate validation', true, 7, true, 'medical_clearance'),
('Banking Setup', 'Payment and banking information', false, 8, false, 'banking_details'),
('Final Approval', 'Management approval and yacht assignment', true, 9, false, 'final_approval')
ON CONFLICT DO NOTHING;

-- Functions for workflow management

-- Function to create new onboarding workflow
CREATE OR REPLACE FUNCTION create_onboarding_workflow(
  p_workflow_id TEXT,
  p_crew_member_id UUID,
  p_yacht_id UUID,
  p_assigned_by UUID,
  p_initial_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_workflow_uuid UUID;
  v_step RECORD;
BEGIN
  -- Create workflow record
  INSERT INTO onboarding_workflows (
    workflow_id, crew_member_id, yacht_id, status, assigned_by, workflow_data
  ) VALUES (
    p_workflow_id, p_crew_member_id, p_yacht_id, 'initiated', p_assigned_by, p_initial_data
  ) RETURNING id INTO v_workflow_uuid;
  
  -- Create workflow steps from templates
  FOR v_step IN 
    SELECT * FROM onboarding_step_templates 
    WHERE is_active = true 
    ORDER BY step_order
  LOOP
    INSERT INTO onboarding_steps (
      workflow_id, step_id, step_name, step_description, 
      is_required, step_order, ai_validated
    ) VALUES (
      v_workflow_uuid, 'step_' || v_step.step_order, v_step.step_name, 
      v_step.step_description, v_step.is_required, v_step.step_order,
      v_step.ai_validation_enabled
    );
  END LOOP;
  
  RETURN v_workflow_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update workflow
CREATE OR REPLACE FUNCTION update_onboarding_workflow(
  p_workflow_id TEXT,
  p_updates JSONB
)
RETURNS VOID AS $$
DECLARE
  v_key TEXT;
  v_value JSONB;
BEGIN
  -- Update main workflow fields
  FOR v_key, v_value IN SELECT * FROM jsonb_each(p_updates)
  LOOP
    CASE v_key
      WHEN 'status' THEN
        UPDATE onboarding_workflows 
        SET status = (v_value #>> '{}'), updated_at = NOW()
        WHERE workflow_id = p_workflow_id;
        
      WHEN 'current_step' THEN
        UPDATE onboarding_workflows 
        SET current_step = (v_value #>> '{}')::INTEGER, updated_at = NOW()
        WHERE workflow_id = p_workflow_id;
        
      WHEN 'completed_at' THEN
        UPDATE onboarding_workflows 
        SET completed_at = (v_value #>> '{}')::TIMESTAMP WITH TIME ZONE, updated_at = NOW()
        WHERE workflow_id = p_workflow_id;
        
      WHEN 'workflow_data', 'data' THEN
        UPDATE onboarding_workflows 
        SET workflow_data = v_value, updated_at = NOW()
        WHERE workflow_id = p_workflow_id;
        
      WHEN 'ai_analysis' THEN
        UPDATE onboarding_workflows 
        SET ai_analysis = v_value, updated_at = NOW()
        WHERE workflow_id = p_workflow_id;
        
      WHEN 'steps' THEN
        -- Update steps if provided
        PERFORM update_workflow_steps(p_workflow_id, v_value);
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update workflow steps
CREATE OR REPLACE FUNCTION update_workflow_steps(
  p_workflow_id TEXT,
  p_steps JSONB
)
RETURNS VOID AS $$
DECLARE
  v_step JSONB;
  v_workflow_uuid UUID;
BEGIN
  -- Get workflow UUID
  SELECT id INTO v_workflow_uuid 
  FROM onboarding_workflows 
  WHERE workflow_id = p_workflow_id;
  
  -- Update each step
  FOR v_step IN SELECT * FROM jsonb_array_elements(p_steps)
  LOOP
    UPDATE onboarding_steps 
    SET 
      is_completed = COALESCE((v_step ->> 'completed')::BOOLEAN, is_completed),
      ai_validated = COALESCE((v_step ->> 'aiValidated')::BOOLEAN, ai_validated),
      confidence = COALESCE((v_step ->> 'confidence')::DECIMAL, confidence),
      validation_notes = COALESCE(v_step ->> 'validationNotes', validation_notes),
      completed_at = CASE 
        WHEN (v_step ->> 'completed')::BOOLEAN = true AND completed_at IS NULL 
        THEN NOW() 
        ELSE completed_at 
      END,
      updated_at = NOW()
    WHERE workflow_id = v_workflow_uuid 
      AND step_id = v_step ->> 'id';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get workflow with steps
CREATE OR REPLACE FUNCTION get_onboarding_workflow(p_workflow_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_workflow RECORD;
  v_steps JSONB;
  v_result JSONB;
BEGIN
  -- Get workflow data
  SELECT * INTO v_workflow
  FROM onboarding_workflows
  WHERE workflow_id = p_workflow_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Get steps
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', step_id,
      'name', step_name,
      'description', step_description,
      'required', is_required,
      'completed', is_completed,
      'aiValidated', ai_validated,
      'confidence', confidence,
      'validationNotes', validation_notes
    ) ORDER BY step_order
  ) INTO v_steps
  FROM onboarding_steps
  WHERE workflow_id = v_workflow.id;
  
  -- Build result
  v_result := jsonb_build_object(
    'id', v_workflow.workflow_id,
    'crewMemberId', v_workflow.crew_member_id,
    'yachtId', v_workflow.yacht_id,
    'status', v_workflow.status,
    'currentStep', v_workflow.current_step,
    'steps', COALESCE(v_steps, '[]'::JSONB),
    'assignedBy', v_workflow.assigned_by,
    'createdAt', v_workflow.created_at,
    'completedAt', v_workflow.completed_at,
    'data', v_workflow.workflow_data,
    'aiAnalysis', v_workflow.ai_analysis
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to get active workflows
CREATE OR REPLACE FUNCTION get_active_onboarding_workflows(p_yacht_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_workflows JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', workflow_id,
      'crewMemberId', crew_member_id,
      'yachtId', yacht_id,
      'status', status,
      'currentStep', current_step,
      'assignedBy', assigned_by,
      'createdAt', created_at,
      'completedAt', completed_at
    )
  ) INTO v_workflows
  FROM onboarding_workflows
  WHERE 
    status NOT IN ('completed', 'rejected')
    AND (p_yacht_id IS NULL OR yacht_id = p_yacht_id)
  ORDER BY created_at DESC;
  
  RETURN COALESCE(v_workflows, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function to log onboarding notification
CREATE OR REPLACE FUNCTION log_onboarding_notification(
  p_workflow_id TEXT,
  p_crew_member_id UUID,
  p_notification_type TEXT,
  p_stage TEXT,
  p_subject TEXT,
  p_message TEXT,
  p_recipient_email TEXT
)
RETURNS VOID AS $$
DECLARE
  v_workflow_uuid UUID;
BEGIN
  -- Get workflow UUID
  SELECT id INTO v_workflow_uuid 
  FROM onboarding_workflows 
  WHERE workflow_id = p_workflow_id;
  
  -- Insert notification log
  INSERT INTO onboarding_notifications (
    workflow_id, crew_member_id, notification_type, notification_stage,
    subject, message, recipient_email
  ) VALUES (
    v_workflow_uuid, p_crew_member_id, p_notification_type, p_stage,
    p_subject, p_message, p_recipient_email
  );
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_workflows_timestamp
  BEFORE UPDATE ON onboarding_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

CREATE TRIGGER update_onboarding_steps_timestamp
  BEFORE UPDATE ON onboarding_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_timestamp();

COMMENT ON TABLE onboarding_workflows IS 'Crew onboarding workflows with real database storage';
COMMENT ON TABLE onboarding_steps IS 'Individual onboarding steps for each workflow';
COMMENT ON TABLE onboarding_documents IS 'Documents uploaded during onboarding process';
COMMENT ON TABLE onboarding_notifications IS 'Notification history for onboarding workflows';