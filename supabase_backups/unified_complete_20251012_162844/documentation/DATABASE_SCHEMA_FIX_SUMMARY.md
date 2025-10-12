# Database Schema Fix Summary - 2025-10-11

## Issue Description

The application was experiencing multiple database schema errors:

1. **400/500 errors** on `ai_providers_unified` table queries
2. **404 errors** on `ai_models_unified` table (table didn't exist)
3. **Schema mismatch errors**: Code expected columns that didn't exist in database
4. **Auto-setup failures**: `aiTableAutoSetup.ts` trying to insert data with non-existent columns

### Error Messages
```
❌ Could not find the 'auth_method' column of 'ai_providers_unified' in the schema cache
❌ GET ai_providers_unified 500 (Internal Server Error)
❌ GET ai_models_unified 404 (Not Found)
❌ Provider insertion failed: Could not find the 'auth_method' column
```

---

## Root Cause

The database schema in migrations was **outdated** compared to what the TypeScript code expected:

### Missing Columns in `ai_providers_unified`:
- `auth_method` - Authentication method (api_key, bearer, etc.)
- `provider_type` - Provider type identifier (openai, anthropic, google, etc.)
- `priority` - Provider priority for selection
- `is_primary` - Flag for primary provider
- `rate_limit_per_minute` - Rate limiting configuration
- `supported_languages` - Array of supported language codes
- `last_health_check` - Last health check timestamp
- `health_status` - Current health status
- `error_count` - Error counter
- `success_rate` - Success rate percentage

### Missing Table:
- `ai_models_unified` - Entire table was missing

---

## Solution Applied

### Step 1: Backup Created ✅
```bash
./backup_supabase.sh
# Created: yacht_sentinel_20251011_002555.dump
```

### Step 2: Disabled Conflicting Migrations
Moved to `migrations_disabled/`:
- `20251004115000_simple_consolidation.sql` - Conflicted with existing system_settings table
- `20251007220203_fix-ai-models-relationship.sql` - Referenced provider_type before it existed

### Step 3: Created New Migrations

#### Migration 1: `20251011002600_add_missing_ai_provider_columns.sql`
**Purpose**: Add all missing columns to existing `ai_providers_unified` table

**Changes**:
- Added 11 missing columns with proper defaults
- Updated existing providers with correct `provider_type` based on name
- Created indexes for new columns (provider_type, priority, is_primary, health_status)
- Mapped auth_type → auth_method for existing data

**SQL Operations**:
```sql
ALTER TABLE public.ai_providers_unified ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'api_key';
ALTER TABLE public.ai_providers_unified ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'openai';
ALTER TABLE public.ai_providers_unified ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;
-- ... 8 more columns

-- Update existing data
UPDATE public.ai_providers_unified 
SET provider_type = CASE 
  WHEN name ILIKE '%openai%' THEN 'openai'
  WHEN name ILIKE '%gemini%' OR name ILIKE '%google%' THEN 'google'
  -- ... more cases
END;

-- Create indexes
CREATE INDEX idx_ai_providers_unified_type ON public.ai_providers_unified(provider_type);
CREATE INDEX idx_ai_providers_unified_priority ON public.ai_providers_unified(priority);
-- ... more indexes
```

#### Migration 2: `20251011002700_create_ai_models_unified.sql`
**Purpose**: Create the missing `ai_models_unified` table with proper foreign key relationship

**Changes**:
- Created table with all required columns
- Added foreign key constraint to ai_providers_unified
- Created RLS policies (superadmin full access, authenticated read-only, service_role full access)
- Inserted default models for existing providers (GPT-4o, Gemini 1.5 Pro, DeepSeek Chat)
- Created performance indexes

**Table Structure**:
```sql
CREATE TABLE public.ai_models_unified (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    provider_id UUID NOT NULL REFERENCES ai_providers_unified(id),
    model_type TEXT DEFAULT 'text',
    is_active BOOLEAN DEFAULT true,
    max_tokens INTEGER,
    input_cost_per_token DECIMAL(10,8),
    output_cost_per_token DECIMAL(10,8),
    config JSONB,
    capabilities JSONB,
    priority INTEGER,
    description TEXT
);
```

### Step 4: Applied Migrations ✅
```bash
npx supabase migration up
# Applied: 20251010220800_create_unified_ai_configs.sql
# Applied: 20251011002600_add_missing_ai_provider_columns.sql
# Applied: 20251011002700_create_ai_models_unified.sql
```

### Step 5: Restarted Supabase ✅
```bash
npx supabase stop && npx supabase start
# Reloaded PostgREST schema cache
```

### Step 6: Restored Superadmin ✅
```bash
./restore_superadmin.sh
# Email: superadmin@yachtexcel.com
# Password: admin123
```

---

## Verification

### Database Schema Verified ✅

**ai_providers_unified table:**
```sql
SELECT name, provider_type, auth_method, is_active FROM public.ai_providers_unified;

     name      | provider_type | auth_method | is_active 
---------------+---------------+-------------+-----------
 OpenAI        | openai        | api_key     | t
 Google Gemini | google        | api_key     | t
 DeepSeek      | deepseek      | api_key     | t
```

**ai_models_unified table:**
```sql
SELECT name, display_name, model_type, is_active FROM public.ai_models_unified;

        name        |  display_name   | model_type | is_active 
--------------------+-----------------+------------+-----------
 gpt-4o             | GPT-4o (Latest) | text       | t
 gemini-1.5-pro-002 | Gemini 1.5 Pro  | text       | t
 deepseek-chat      | DeepSeek Chat   | text       | t
```

### All Required Columns Present ✅
```sql
\d public.ai_providers_unified | grep -E "(auth_method|provider_type|priority|is_primary)"

 auth_method           | text      | 'api_key'::text
 provider_type         | text      | 'openai'::text
 priority              | integer   | 1
 is_primary            | boolean   | false
```

---

## Expected Results

After these fixes, the application should:

1. ✅ **No more 400/500 errors** on ai_providers_unified queries
2. ✅ **No more 404 errors** on ai_models_unified queries
3. ✅ **Auto-setup works** - can insert providers with auth_method, provider_type, etc.
4. ✅ **Frontend loads** - AI Operations Center can query providers and models
5. ✅ **Relationships work** - Models linked to providers via foreign key
6. ✅ **RLS policies active** - Proper access control for authenticated users and superadmin

---

## Files Modified

### New Migration Files:
1. `/supabase/migrations/20251011002600_add_missing_ai_provider_columns.sql` - Add missing columns
2. `/supabase/migrations/20251011002700_create_ai_models_unified.sql` - Create models table

### Disabled Migration Files:
1. `/supabase/migrations_disabled/20251004115000_simple_consolidation.sql` - Conflicted with existing tables
2. `/supabase/migrations_disabled/20251007220203_fix-ai-models-relationship.sql` - Out of order execution

### Backup Created:
1. `/supabase_backups/yacht_sentinel_20251011_002555.dump` - Full database backup before changes
2. `/supabase_backups/yacht_sentinel_20251011_002555.sql.gz` - SQL text backup
3. `/supabase_backups/yacht_sentinel_20251011_002555_auth.sql.gz` - Auth tables backup

---

## Prevention Measures

### 1. Schema Validation
Before migrations, always verify:
```sql
-- Check table structure
\d public.ai_providers_unified
\d public.ai_models_unified

-- Verify data exists
SELECT COUNT(*) FROM public.ai_providers_unified;
SELECT COUNT(*) FROM public.ai_models_unified;
```

### 2. Type Definitions Match Database
Ensure TypeScript types in `/src/types/ai-providers.ts` match actual database schema.

### 3. Migration Order Matters
- Migrations should be applied in timestamp order
- Dependencies must be created before being referenced
- Column additions before data inserts

### 4. Always Backup Before Migrations
```bash
./backup_supabase.sh
npx supabase migration up
./restore_superadmin.sh
```

---

## Testing Checklist

After schema fixes, test:

- [ ] Can login as superadmin@yachtexcel.com
- [ ] SuperAdmin page loads without errors
- [ ] AI Providers list appears
- [ ] AI Models list appears
- [ ] Can add new AI providers
- [ ] Can add new AI models
- [ ] Provider-Model relationship works
- [ ] Auto-setup creates providers if table empty
- [ ] Health checks work for providers
- [ ] No 400/404/500 errors in console

---

## Summary

✅ **Database schema fixed**
✅ **All missing columns added**
✅ **ai_models_unified table created**
✅ **Foreign key relationships established**
✅ **Default data inserted**
✅ **RLS policies configured**
✅ **Superadmin account restored**
✅ **Backup created before changes**

The systematic approach:
1. Created backup first (critical workflow)
2. Identified missing columns and tables
3. Created targeted migrations
4. Applied migrations in correct order
5. Restarted services to reload schema cache
6. Restored superadmin access
7. Verified all changes

**Status**: ✅ **RESOLVED** - Application should now load without database schema errors.
