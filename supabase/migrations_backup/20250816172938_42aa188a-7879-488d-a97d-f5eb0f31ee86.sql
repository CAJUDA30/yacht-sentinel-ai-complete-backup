-- Phase 1 continued: tighten function security configs
-- Ensure SECURITY DEFINER or trigger functions have fixed search_path
ALTER FUNCTION public.log_sensitive_table_access() SET search_path = 'public';
ALTER FUNCTION public.track_sensitive_access() SET search_path = 'public';
ALTER FUNCTION public.update_warranty_expiration() SET search_path = 'public';
ALTER FUNCTION public.cleanup_expired_ai_cache() SET search_path = 'public';
ALTER FUNCTION public.update_model_performance(uuid, integer, boolean) SET search_path = 'public';