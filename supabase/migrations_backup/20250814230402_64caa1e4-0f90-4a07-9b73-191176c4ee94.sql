-- PHASE 1 COMPLETION: Insert default system settings into proper table structure

-- Insert default system settings with proper key-value structure
INSERT INTO public.system_settings (key, value, updated_by) VALUES
  ('system.maintenance', 'false', NULL),
  ('system.registration', 'true', NULL),
  ('system.maxFileSize', '10', NULL),
  ('system.sessionTimeout', '30', NULL),
  ('ai.defaultProvider', '"openai"', NULL),
  ('ai.maxTokens', '4096', NULL),
  ('ai.temperature', '0.7', NULL),
  ('security.rateLimiting', 'true', NULL),
  ('security.maxLoginAttempts', '5', NULL),
  ('security.requireMFA', 'false', NULL),
  ('security.sessionTimeout', '30', NULL),
  ('security.auditLogging', 'true', NULL),
  ('security.inputValidation', 'true', NULL),
  ('security.csrfProtection', 'true', NULL)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;