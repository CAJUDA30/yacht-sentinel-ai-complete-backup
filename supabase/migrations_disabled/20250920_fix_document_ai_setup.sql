-- Fix Document AI Form Parser integration setup
-- This migration ensures all necessary AI models and consensus rules are in place

-- 1. Ensure vision AI model exists and is active
INSERT INTO ai_models (
  provider, 
  model_name, 
  model_id, 
  capabilities, 
  parameters, 
  priority, 
  cost_per_token,
  is_active,
  avg_latency_ms,
  success_rate
) VALUES (
  'vision', 
  'Document AI Form Parser', 
  'form-parser-4ab65e484eb85038', 
  '["vision", "ocr", "form_parsing", "document_analysis"]', 
  '{"processor_id": "4ab65e484eb85038", "location": "us", "project_id": "338523806048"}', 
  95, 
  0.000015,
  true,
  2500,
  98.5
) ON CONFLICT (model_id) DO UPDATE SET
  is_active = true,
  priority = 95,
  parameters = EXCLUDED.parameters,
  updated_at = now();

-- 2. Add consensus rules for vision module with form_parser_extraction
INSERT INTO consensus_rules (
  module, 
  action_type, 
  risk_level, 
  consensus_algorithm,
  required_agreement_threshold, 
  minimum_models_required,
  auto_execute_threshold, 
  human_approval_threshold,
  model_weights, 
  fallback_models, 
  timeout_seconds, 
  is_active
) VALUES
-- Form parser extraction rule
('vision', 'form_parser_extraction', 'medium', 'majority', 0.8, 1, 0.9, 0.7, 
 '{"vision": 1.0}', '["form-parser-4ab65e484eb85038"]', 15, true),
 
-- General vision processing rule
('vision', 'document_analysis', 'medium', 'majority', 0.7, 1, 0.85, 0.6,
 '{"vision": 1.0}', '["form-parser-4ab65e484eb85038"]', 12, true),

-- OCR extraction rule
('vision', 'ocr_extraction', 'low', 'majority', 0.7, 1, 0.9, 0.6,
 '{"vision": 1.0}', '["form-parser-4ab65e484eb85038"]', 10, true)

ON CONFLICT (module, action_type, risk_level) DO UPDATE SET
  minimum_models_required = 1,
  model_weights = EXCLUDED.model_weights,
  fallback_models = EXCLUDED.fallback_models,
  is_active = true,
  updated_at = now();

-- 3. Add vision configuration if not exists
INSERT INTO ai_vision_config (
  provider,
  region,
  features_enabled,
  default_preprocessing,
  assigned_modules,
  status,
  notes
) VALUES (
  'google',
  'us',
  '["form_parsing", "ocr", "document_ai", "yacht_extraction"]'::jsonb,
  '{"processor_type": "FORM_PARSER_PROCESSOR", "processor_id": "4ab65e484eb85038"}'::jsonb,
  '["smartscan", "onboarding", "equipment", "documents"]'::jsonb,
  'active',
  'Document AI Form Parser for yacht document processing'
) ON CONFLICT (provider) DO UPDATE SET
  features_enabled = EXCLUDED.features_enabled,
  default_preprocessing = EXCLUDED.default_preprocessing,
  assigned_modules = EXCLUDED.assigned_modules,
  status = 'active',
  updated_at = now();

-- 4. Configure SmartScan settings for vision module
INSERT INTO smartscan_settings (
  module,
  autofill_enabled,
  ocr_provider,
  confidence_threshold,
  features
) VALUES (
  'yacht_onboarding',
  true,
  'document_ai_form_parser',
  0.7,
  '["auto_population", "field_extraction", "table_parsing", "owner_extraction"]'::jsonb
),
(
  'smartscan',
  true,
  'document_ai_form_parser', 
  0.75,
  '["yacht_fields", "form_parsing", "confidence_scoring"]'::jsonb
)
ON CONFLICT (module) DO UPDATE SET
  ocr_provider = EXCLUDED.ocr_provider,
  features = EXCLUDED.features,
  updated_at = now();

-- 5. Add specific workflow for Document AI processing
INSERT INTO ai_agent_workflows (
  workflow_name, 
  module, 
  trigger_type, 
  workflow_steps, 
  model_chain, 
  consensus_rule_id
) VALUES (
  'Document AI Form Parser Processing',
  'vision',
  'document_upload',
  '[
    {"step": "document_upload", "description": "Receive and validate document upload"},
    {"step": "form_parser_extraction", "description": "Extract structured data using Document AI Form Parser"},
    {"step": "yacht_field_mapping", "description": "Map extracted fields to yacht schema"},
    {"step": "confidence_validation", "description": "Validate extraction confidence scores"},
    {"step": "auto_populate_form", "description": "Auto-populate onboarding form fields"}
  ]'::jsonb,
  '[
    {"models": ["vision"], "parallel": false, "purpose": "document_ai_processing"}
  ]'::jsonb,
  (SELECT id FROM consensus_rules WHERE module = 'vision' AND action_type = 'form_parser_extraction' LIMIT 1)
) ON CONFLICT (workflow_name) DO UPDATE SET
  model_chain = EXCLUDED.model_chain,
  workflow_steps = EXCLUDED.workflow_steps,
  updated_at = now();

-- 6. Update any existing vision models to ensure compatibility
UPDATE ai_models 
SET 
  is_active = true,
  parameters = jsonb_set(
    COALESCE(parameters, '{}'::jsonb), 
    '{processor_id}', 
    '"4ab65e484eb85038"'
  ),
  parameters = jsonb_set(
    parameters, 
    '{location}', 
    '"us"'
  ),
  parameters = jsonb_set(
    parameters, 
    '{project_id}', 
    '"338523806048"'
  )
WHERE provider = 'vision' AND model_id LIKE '%vision%';

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_active ON ai_models(provider, is_active);
CREATE INDEX IF NOT EXISTS idx_consensus_rules_module_action ON consensus_rules(module, action_type, is_active);
CREATE INDEX IF NOT EXISTS idx_vision_config_provider ON ai_vision_config(provider, status);

-- 8. Grant necessary permissions for edge functions
-- These tables need to be accessible by the enhanced-multi-ai-processor function
GRANT SELECT ON ai_models TO anon, authenticated;
GRANT SELECT ON consensus_rules TO anon, authenticated;
GRANT SELECT ON ai_vision_config TO anon, authenticated;
GRANT SELECT ON smartscan_settings TO anon, authenticated;

-- 9. Log the migration completion
INSERT INTO ai_system_config (config_key, config_value, description) VALUES
('document_ai_form_parser_setup', '{"status": "completed", "processor_id": "4ab65e484eb85038", "migration_date": "2025-09-20"}', 'Document AI Form Parser setup completed')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now();