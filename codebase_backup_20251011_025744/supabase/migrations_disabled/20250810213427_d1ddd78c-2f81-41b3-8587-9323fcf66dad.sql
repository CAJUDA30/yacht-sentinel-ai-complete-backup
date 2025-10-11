
-- Ensure the view runs with the querying user's privileges and respects RLS
ALTER VIEW public.unified_ai_logs
SET (security_invoker = true);
