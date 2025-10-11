-- Create Enterprise Audit Manager tables

-- Audit categories with hierarchical structure
CREATE TABLE audit_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES audit_categories(id),
  thumbnail_url TEXT,
  icon TEXT,
  color TEXT DEFAULT '#0ea5e9',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit templates for different types of inspections
CREATE TABLE audit_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES audit_categories(id),
  template_data JSONB NOT NULL DEFAULT '{}',
  compliance_standards JSONB DEFAULT '[]',
  estimated_duration_minutes INTEGER,
  required_roles TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual audit instances/sessions
CREATE TABLE audit_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES audit_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'approved', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID,
  assigned_by UUID,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  compliance_score NUMERIC,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Hierarchical audit checklist items
CREATE TABLE audit_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_instance_id UUID NOT NULL REFERENCES audit_instances(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES audit_items(id),
  item_code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  evaluation_type TEXT DEFAULT 'ok_ko' CHECK (evaluation_type IN ('ok_ko', 'numeric', 'text', 'checkbox', 'rating')),
  evaluation_criteria JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'ko', 'na', 'deferred')),
  confidence_score NUMERIC,
  ai_assisted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Multi-modal responses for audit items
CREATE TABLE audit_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_item_id UUID NOT NULL REFERENCES audit_items(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL CHECK (response_type IN ('text', 'voice', 'image', 'video', 'mixed')),
  text_response TEXT,
  voice_transcript TEXT,
  voice_url TEXT,
  media_urls TEXT[] DEFAULT '{}',
  ai_analysis JSONB DEFAULT '{}',
  evaluation_result TEXT,
  confidence_score NUMERIC,
  recorded_by UUID,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI insights and analysis results
CREATE TABLE audit_ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_instance_id UUID REFERENCES audit_instances(id),
  audit_item_id UUID REFERENCES audit_items(id),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('defect_detection', 'risk_assessment', 'compliance_check', 'prediction', 'recommendation')),
  modality TEXT NOT NULL CHECK (modality IN ('text', 'vision', 'voice', 'multi_modal')),
  insight_data JSONB NOT NULL,
  confidence_score NUMERIC NOT NULL,
  ai_model TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  validated_by UUID,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'confirmed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow definitions and states
CREATE TABLE audit_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT DEFAULT 'approval' CHECK (workflow_type IN ('approval', 'review', 'escalation', 'notification')),
  steps JSONB NOT NULL DEFAULT '[]',
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Collaboration and real-time updates
CREATE TABLE audit_collaboration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_instance_id UUID NOT NULL REFERENCES audit_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('comment', 'status_change', 'assignment', 'approval', 'media_upload')),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compliance rules and standards
CREATE TABLE audit_compliance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  standard_type TEXT NOT NULL,
  rule_criteria JSONB NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE audit_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_collaboration ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_compliance_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can view audit categories" ON audit_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Superadmins can manage audit categories" ON audit_categories FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Authenticated users can view audit templates" ON audit_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Superadmins can manage audit templates" ON audit_templates FOR ALL USING (is_superadmin_or_named(auth.uid()));

CREATE POLICY "Authenticated users can manage audit instances" ON audit_instances FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage audit items" ON audit_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage audit responses" ON audit_responses FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view AI insights" ON audit_ai_insights FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can create AI insights" ON audit_ai_insights FOR INSERT WITH CHECK (true);

CREATE POLICY "Superadmins can manage workflows" ON audit_workflows FOR ALL USING (is_superadmin_or_named(auth.uid()));
CREATE POLICY "Authenticated users can view workflows" ON audit_workflows FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage collaboration" ON audit_collaboration FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Superadmins can manage compliance rules" ON audit_compliance_rules FOR ALL USING (is_superadmin_or_named(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_audit_categories_parent_id ON audit_categories(parent_id);
CREATE INDEX idx_audit_templates_category_id ON audit_templates(category_id);
CREATE INDEX idx_audit_instances_template_id ON audit_instances(template_id);
CREATE INDEX idx_audit_instances_status ON audit_instances(status);
CREATE INDEX idx_audit_items_audit_instance_id ON audit_items(audit_instance_id);
CREATE INDEX idx_audit_items_parent_id ON audit_items(parent_id);
CREATE INDEX idx_audit_responses_audit_item_id ON audit_responses(audit_item_id);
CREATE INDEX idx_audit_ai_insights_audit_instance_id ON audit_ai_insights(audit_instance_id);
CREATE INDEX idx_audit_collaboration_audit_instance_id ON audit_collaboration(audit_instance_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_audit_categories_updated_at BEFORE UPDATE ON audit_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_templates_updated_at BEFORE UPDATE ON audit_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_instances_updated_at BEFORE UPDATE ON audit_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_items_updated_at BEFORE UPDATE ON audit_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_workflows_updated_at BEFORE UPDATE ON audit_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_compliance_rules_updated_at BEFORE UPDATE ON audit_compliance_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default audit categories
INSERT INTO audit_categories (name, description, icon, color) VALUES
('Safety Inspections', 'Safety-related audit categories', 'Shield', '#ef4444'),
('Equipment Maintenance', 'Equipment and machinery audits', 'Wrench', '#f97316'),
('Environmental Compliance', 'Environmental and regulatory audits', 'Leaf', '#22c55e'),
('Crew & Operations', 'Personnel and operational audits', 'Users', '#3b82f6'),
('Documentation', 'Documentation and record audits', 'FileText', '#8b5cf6');

-- Insert sample audit templates
INSERT INTO audit_templates (name, description, category_id, template_data, estimated_duration_minutes) 
SELECT 
  'Safety Equipment Inspection',
  'Comprehensive safety equipment audit checklist',
  id,
  '{"sections": [{"name": "Life Jackets", "items": ["Count", "Condition", "Certification"]}, {"name": "Fire Equipment", "items": ["Extinguishers", "Smoke Detectors", "Emergency Exits"]}]}',
  45
FROM audit_categories WHERE name = 'Safety Inspections';

INSERT INTO audit_templates (name, description, category_id, template_data, estimated_duration_minutes)
SELECT 
  'Engine Room Inspection',
  'Engine room equipment and systems audit',
  id,
  '{"sections": [{"name": "Engines", "items": ["Oil Levels", "Coolant", "Belt Condition"]}, {"name": "Electrical", "items": ["Wiring", "Connections", "Battery"]}]}',
  60
FROM audit_categories WHERE name = 'Equipment Maintenance';