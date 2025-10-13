-- Add testing and status columns to document_ai_processors table
-- This enables tracking of processor health and test results

ALTER TABLE public.document_ai_processors 
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_test_status TEXT CHECK (last_test_status IN ('success', 'error', 'warning')),
ADD COLUMN IF NOT EXISTS last_test_result JSONB DEFAULT '{}'::jsonb;

-- Create index for efficient querying by test status
CREATE INDEX IF NOT EXISTS idx_document_ai_processors_test_status 
ON public.document_ai_processors(last_test_status, last_tested_at);

-- Create index for active processors
CREATE INDEX IF NOT EXISTS idx_document_ai_processors_active_priority 
ON public.document_ai_processors(is_active, priority) 
WHERE is_active = true;

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Authenticated users can view processors" ON public.document_ai_processors;
DROP POLICY IF EXISTS "Superadmins can manage processors" ON public.document_ai_processors;

-- Recreate policies with proper access
CREATE POLICY "Authenticated users can view processors" 
ON public.document_ai_processors FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Superadmins can manage processors" 
ON public.document_ai_processors FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_superadmin' = 'true' OR
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'is_superadmin' = 'true'
);

-- Create view for processors with testing status
CREATE OR REPLACE VIEW public.document_ai_processors_with_status AS
SELECT 
  p.*,
  CASE 
    WHEN p.last_test_status = 'success' THEN 'operational'
    WHEN p.last_test_status = 'error' THEN 'error'
    WHEN p.last_test_status = 'warning' THEN 'warning'
    WHEN p.last_tested_at IS NULL THEN 'untested'
    ELSE 'unknown'
  END as status_summary,
  CASE 
    WHEN p.last_tested_at IS NULL THEN 'Never tested'
    WHEN p.last_tested_at < NOW() - INTERVAL '24 hours' THEN 'Stale (>24h)'
    WHEN p.last_tested_at < NOW() - INTERVAL '1 hour' THEN 'Recent (<24h)'
    ELSE 'Fresh (<1h)'
  END as test_freshness
FROM public.document_ai_processors p;

-- Grant access to the view
GRANT SELECT ON public.document_ai_processors_with_status TO authenticated;
GRANT ALL ON public.document_ai_processors_with_status TO service_role;

-- Add comment
COMMENT ON VIEW public.document_ai_processors_with_status IS 'Document AI processors with computed testing status and freshness indicators';