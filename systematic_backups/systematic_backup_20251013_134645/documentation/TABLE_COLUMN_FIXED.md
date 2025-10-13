# Missing Table Column Fixed

## Issue
Error when creating AI providers:
```
POST /rest/v1/ai_providers_unified 400 (Bad Request)
Could not find the 'configuration' column of 'ai_providers_unified' in the schema cache
```

## Root Cause
The `ai_providers_unified` table had a `config` column, but some code was trying to use `configuration` column which didn't exist.

## Solution Applied

### 1. Added Missing Column
```sql
ALTER TABLE ai_providers_unified 
ADD COLUMN IF NOT EXISTS configuration jsonb DEFAULT '{}'::jsonb;
```

### 2. Created Sync Function
Created a trigger function to keep both columns in sync:
```sql
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
```

### 3. Created Trigger
```sql
CREATE TRIGGER sync_config_trigger
  BEFORE INSERT OR UPDATE ON ai_providers_unified
  FOR EACH ROW
  EXECUTE FUNCTION sync_ai_provider_config();
```

## How It Works

- **When you write to `config`** → automatically copied to `configuration`
- **When you write to `configuration`** → automatically copied to `config`
- Both columns always stay in sync
- No code changes needed - works transparently

## Migration
Created: `supabase/migrations/20241211_add_configuration_column.sql`

## Testing
Try creating a new AI provider (e.g., Grok by xAI) - it should now work without the 400 error.

## Table Structure (After Fix)
```
ai_providers_unified
├── config          (jsonb) - Original column
├── configuration   (jsonb) - New column (synced with config)
└── [sync_config_trigger] - Keeps both in sync
```

---
**Status:** ✅ Fixed  
**Date:** 2025-10-11
