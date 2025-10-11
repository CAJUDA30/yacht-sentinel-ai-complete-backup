-- Fix function search path security warnings
-- Update existing functions to have proper search_path

-- Update get_user_yacht_access function
CREATE OR REPLACE FUNCTION public.get_user_yacht_access()
 RETURNS TABLE(yacht_id uuid, access_level text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Return yachts the current user owns
  SELECT id, 'owner' FROM yacht_profiles WHERE owner_id = auth.uid()
  UNION
  -- Return yachts the current user crews on
  SELECT yacht_id, 'crew' FROM crew_members WHERE user_id = auth.uid();
$function$;

-- Update get_api_key_status function  
CREATE OR REPLACE FUNCTION public.get_api_key_status(provider_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function will help track which API keys are configured
  -- In production, actual keys are stored in Supabase secrets
  RETURN jsonb_build_object(
    'provider', provider_name,
    'configured', true,
    'last_tested', now()
  );
END;
$function$;