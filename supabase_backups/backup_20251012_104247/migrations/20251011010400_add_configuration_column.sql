-- Add configuration column to ai_providers_unified table
-- This column is used by some parts of the app while 'config' is used by others
-- Keep them in sync with a trigger

-- Add configuration column
ALTER TABLE ai_providers_unified 
ADD COLUMN IF NOT EXISTS configuration jsonb DEFAULT '{}'::jsonb;

-- Copy existing data from config to configuration
UPDATE ai_providers_unified 
SET configuration = config 
WHERE configuration IS NULL OR configuration = '{}'::jsonb;

-- Create function to keep config and configuration in sync
CREATE OR REPLACE FUNCTION sync_ai_provider_config()
RETURNS TRIGGER AS $$
BEGIN
  -- If config is updated, copy to configuration
  IF NEW.config IS DISTINCT FROM OLD.config THEN
    NEW.configuration := NEW.config;
  END IF;
  
  -- If configuration is updated, copy to config  
  IF NEW.configuration IS DISTINCT FROM OLD.configuration THEN
    NEW.config := NEW.configuration;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync on INSERT and UPDATE
DROP TRIGGER IF EXISTS sync_config_trigger ON ai_providers_unified;
CREATE TRIGGER sync_config_trigger
  BEFORE INSERT OR UPDATE ON ai_providers_unified
  FOR EACH ROW
  EXECUTE FUNCTION sync_ai_provider_config();

-- Comment
COMMENT ON COLUMN ai_providers_unified.configuration IS 'Synced with config column via trigger - used by some legacy code';
COMMENT ON FUNCTION sync_ai_provider_config IS 'Keeps config and configuration columns in sync';
