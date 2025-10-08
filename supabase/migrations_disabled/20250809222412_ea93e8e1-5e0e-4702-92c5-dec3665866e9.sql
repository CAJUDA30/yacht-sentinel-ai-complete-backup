-- Fix remaining function search path security issue

-- Update existing functions to have proper search path
CREATE OR REPLACE FUNCTION public.get_api_key_status(provider_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function will help track which API keys are configured
  -- In production, actual keys are stored in Supabase secrets
  RETURN jsonb_build_object(
    'provider', provider_name,
    'configured', true,
    'last_tested', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_parts_inventory_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When inventory quantity drops below minimum, create procurement request
  IF NEW.quantity < NEW.min_stock AND OLD.quantity >= OLD.min_stock THEN
    INSERT INTO automated_procurement_requests (
      part_name,
      part_number,
      quantity_needed,
      current_stock,
      minimum_threshold,
      urgency,
      notes
    ) VALUES (
      NEW.name,
      NEW.part_number,
      GREATEST(NEW.min_stock * 2, 5), -- Order double minimum or 5, whichever is higher
      NEW.quantity,
      NEW.min_stock,
      CASE 
        WHEN NEW.quantity = 0 THEN 'critical'
        WHEN NEW.quantity < NEW.min_stock / 2 THEN 'high'
        ELSE 'medium'
      END,
      'Automatically generated due to low stock levels'
    );
  END IF;
  
  RETURN NEW;
END;
$$;