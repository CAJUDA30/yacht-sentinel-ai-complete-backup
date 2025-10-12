-- =============================================================================
-- YACHT SENTINEL AI - COMPREHENSIVE SEED FILE
-- =============================================================================
-- This file ensures the app remains functional after database resets
-- It creates essential data, users, and configurations required for operation
-- =============================================================================

-- 1. ENSURE CRITICAL INDEXES EXIST
-- These indexes are required by triggers and functions
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles (user_id, role) 
WHERE yacht_id IS NULL AND department IS NULL;

-- 2. ESSENTIAL SYSTEM SETTINGS
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('app_name', 'Yacht Sentinel AI', 'Application name', true),
('app_version', '1.0.0', 'Current application version', true),
('maintenance_mode', 'false', 'Whether the app is in maintenance mode', false),
('max_file_upload_size', '10485760', 'Maximum file upload size in bytes (10MB)', false),
('default_timezone', 'UTC', 'Default system timezone', true),
('enable_notifications', 'true', 'Whether notifications are enabled', false)
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- 3. ENSURE ROLE PERMISSIONS TABLE EXISTS
-- Critical for user access control - create if missing
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'admin'
    resource TEXT, -- e.g., 'yachts', 'users', 'reports', '*' for all
    action TEXT NOT NULL, -- e.g., 'view', 'create', 'update', 'delete', '*' for all
    description TEXT,
    conditions JSONB DEFAULT '{}', -- Additional conditions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique 
ON public.role_permissions (role, permission, COALESCE(resource, ''), action);

-- 4. DEFAULT ROLE PERMISSIONS
-- Insert essential permissions for each role level
INSERT INTO public.role_permissions (role, permission, resource, action, description) VALUES
-- Guest permissions
('guest', 'read', 'public_content', 'view', 'View public content'),

-- Viewer permissions  
('viewer', 'read', 'yachts', 'view', 'View yacht information'),
('viewer', 'read', 'inventory', 'view', 'View inventory items'),
('viewer', 'read', 'documents', 'view', 'View documents'),

-- User permissions
('user', 'read', 'yachts', 'view', 'View yacht information'),
('user', 'write', 'yachts', 'update', 'Update yacht information'),
('user', 'read', 'inventory', 'view', 'View inventory'),
('user', 'write', 'inventory', 'create', 'Create inventory items'),
('user', 'write', 'inventory', 'update', 'Update inventory items'),
('user', 'read', 'documents', 'view', 'View documents'),
('user', 'write', 'documents', 'upload', 'Upload documents'),

-- Manager permissions
('manager', 'read', 'users', 'view_team', 'View team members'),
('manager', 'write', 'users', 'manage_team', 'Manage team roles'),
('manager', 'read', 'analytics', 'view', 'View analytics dashboard'),
('manager', 'write', 'reports', 'generate', 'Generate reports'),

-- Admin permissions
('admin', 'read', 'users', 'view_all', 'View all users'),
('admin', 'write', 'users', 'manage_all', 'Manage all users'),
('admin', 'read', 'system', 'view_config', 'View system configuration'),
('admin', 'write', 'system', 'manage_config', 'Manage system settings'),
('admin', 'delete', 'inventory', 'remove', 'Delete inventory items'),
('admin', 'delete', 'documents', 'remove', 'Delete documents'),

-- Superadmin permissions (full access)
('superadmin', 'read', '*', '*', 'Full read access to all resources'),
('superadmin', 'write', '*', '*', 'Full write access to all resources'),
('superadmin', 'delete', '*', '*', 'Full delete access to all resources'),
('superadmin', 'admin', '*', '*', 'Full administrative access')
ON CONFLICT (role, permission, COALESCE(resource, ''), action) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. SAMPLE YACHT DATA (for testing)
INSERT INTO public.yachts (id, name, type, length_meters, year_built, flag_state, metadata) VALUES
('11111111-1111-1111-1111-111111111111', 'Sample Yacht Alpha', 'Motor Yacht', 45.5, 2020, 'Marshall Islands', '{"crew_capacity": 8, "guest_capacity": 12}'),
('22222222-2222-2222-2222-222222222222', 'Demo Vessel Beta', 'Sailing Yacht', 32.0, 2018, 'Malta', '{"crew_capacity": 4, "guest_capacity": 8}')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- 5. SAMPLE INVENTORY ITEMS
INSERT INTO public.inventory_items (yacht_id, category, name, quantity, unit, status, metadata) VALUES
('11111111-1111-1111-1111-111111111111', 'Safety Equipment', 'Life Jackets', 20, 'pieces', 'in_stock', '{"last_inspection": "2024-01-15", "condition": "excellent"}'),
('11111111-1111-1111-1111-111111111111', 'Engine Parts', 'Oil Filters', 12, 'pieces', 'in_stock', '{"part_number": "OF-2024", "compatible_engines": ["CAT-3412", "MTU-16V2000"]}'),
('22222222-2222-2222-2222-222222222222', 'Navigation', 'Charts - Mediterranean', 15, 'pieces', 'in_stock', '{"edition": "2024", "coverage": "Mediterranean Sea"}')
ON CONFLICT (yacht_id, category, name) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    updated_at = NOW();

-- 6. DEFAULT AI PROVIDER CONFIGURATION
INSERT INTO public.ai_providers_unified (name, provider_type, is_active, config, priority) VALUES
('OpenAI GPT-4', 'openai', true, '{"model": "gpt-4", "max_tokens": 4000, "temperature": 0.7}', 1),
('Google Gemini', 'google', true, '{"model": "gemini-pro", "max_tokens": 2048, "temperature": 0.5}', 2),
('Anthropic Claude', 'anthropic', false, '{"model": "claude-3-sonnet", "max_tokens": 4000, "temperature": 0.6}', 3)
ON CONFLICT (name) DO UPDATE SET
    config = EXCLUDED.config,
    priority = EXCLUDED.priority,
    updated_at = NOW();

-- 7. DOCUMENT AI PROCESSORS (from our new system)
INSERT INTO public.document_ai_processors (
    id, name, processor_id, location, project_id, display_name, description, 
    capabilities, priority, is_active, configuration
) VALUES
('doc-ai-001', 'yacht-documents-primary', '8708cd1d9cd87cc1', 'us', '338523806048', 
 'Primary Yacht Documents', 'Main processor for yacht documentation, certificates, and specifications',
 '["yacht-documentation", "certificate-processing", "specification-analysis", "compliance-checking"]',
 1, true, '{"confidence_threshold": 0.85, "language": "en", "output_format": "structured"}'),
 
('doc-ai-002', 'financial-documents', 'financial-processor-001', 'us', '338523806048',
 'Financial Documents', 'Specialized processor for invoices, contracts, and financial records',
 '["invoice-processing", "contract-analysis", "financial-reporting", "expense-tracking"]',
 2, true, '{"confidence_threshold": 0.90, "currency_detection": true, "date_formats": ["MM/DD/YYYY", "DD-MM-YYYY"]}'),
 
('doc-ai-003', 'legal-contracts', 'legal-processor-001', 'us', '338523806048',
 'Legal & Contract Processor', 'Handles legal documents, contracts, and compliance paperwork',
 '["contract-processing", "legal-analysis", "compliance-checking", "clause-extraction"]',
 3, true, '{"legal_jurisdiction": "maritime", "contract_types": ["charter", "purchase", "service"]}'),

('doc-ai-004', 'survey-inspection', 'survey-processor-001', 'us', '338523806048',
 'Survey & Inspection Reports', 'Processes marine surveys, inspection reports, and technical documentation',
 '["survey-processing", "inspection-analysis", "technical-documentation", "damage-assessment"]',
 4, true, '{"survey_types": ["pre-purchase", "insurance", "damage"], "technical_standards": ["MCA", "ABS", "Lloyds"]}'),

('doc-ai-005', 'insurance-compliance', 'insurance-processor-001', 'us', '338523806048',
 'Insurance & Compliance', 'Handles insurance documents, compliance certificates, and regulatory filings',
 '["insurance-processing", "compliance-checking", "regulatory-analysis", "certificate-validation"]',
 5, true, '{"insurance_types": ["hull", "p&i", "crew"], "compliance_regions": ["EU", "US", "UK"]}')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    configuration = EXCLUDED.configuration,
    updated_at = NOW();

-- 8. SUPERADMIN USER RESTORATION
-- First, get or create the superadmin user
DO $$
DECLARE
  superadmin_user_id UUID;
BEGIN
  -- Check if superadmin user exists in auth.users
  SELECT id INTO superadmin_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@yachtexcel.com'
  LIMIT 1;
  
  IF superadmin_user_id IS NOT NULL THEN
    -- User exists, ensure proper metadata and roles
    UPDATE auth.users 
    SET 
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_superadmin": true, "role": "superadmin"}'::jsonb,
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_superadmin": true, "role": "global_superadmin"}'::jsonb,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = superadmin_user_id;
    
    -- Ensure superadmin role exists
    INSERT INTO public.user_roles (user_id, role, granted_by, is_active) 
    VALUES (superadmin_user_id, 'superadmin', superadmin_user_id, true)
    ON CONFLICT DO NOTHING;
    
    -- Ensure user profile exists
    INSERT INTO public.user_profiles (user_id, display_name) 
    VALUES (superadmin_user_id, 'Super Administrator')
    ON CONFLICT (user_id) DO UPDATE SET 
        display_name = 'Super Administrator',
        updated_at = NOW();
        
    RAISE NOTICE 'Superadmin user restored: %', superadmin_user_id;
  ELSE
    RAISE NOTICE 'Superadmin user not found - run restore_superadmin.sh or create via signup';
  END IF;
END $$;

-- 9. SEED COMPLETION LOG
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('last_seed_run', NOW()::text, 'Timestamp of last successful seed execution', false),
('seed_version', '1.0.0', 'Version of seed data applied', false)
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Log seed execution
INSERT INTO public.unified_ai_logs (
  action,
  provider,
  success,
  details,
  correlation_id
) VALUES (
  'database_seed',
  'system',
  true,
  jsonb_build_object(
    'seeded_at', NOW(),
    'seed_file', 'supabase/seed.sql',
    'version', '1.0.0'
  ),
  gen_random_uuid()
) ON CONFLICT DO NOTHING;

-- 10. FINAL VERIFICATION
DO $$
DECLARE
    user_count INTEGER;
    role_count INTEGER;
    yacht_count INTEGER;
    processor_count INTEGER;
    permission_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.user_profiles;
    SELECT COUNT(*) INTO role_count FROM public.user_roles WHERE is_active = true;
    SELECT COUNT(*) INTO yacht_count FROM public.yachts;
    SELECT COUNT(*) INTO processor_count FROM public.document_ai_processors WHERE is_active = true;
    SELECT COUNT(*) INTO permission_count FROM public.role_permissions;
    
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'YACHT SENTINEL AI - SEED COMPLETED SUCCESSFULLY';
    RAISE NOTICE '===============================================';
    RAISE NOTICE 'System Status:';
    RAISE NOTICE '- User profiles: %', user_count;
    RAISE NOTICE '- Active roles: %', role_count;
    RAISE NOTICE '- Sample yachts: %', yacht_count;
    RAISE NOTICE '- Document AI processors: %', processor_count;
    RAISE NOTICE '- Role permissions: %', permission_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for operation! 🚀';
    RAISE NOTICE 'Login: superadmin@yachtexcel.com / admin123';
    RAISE NOTICE '===============================================';
END;
$$;
