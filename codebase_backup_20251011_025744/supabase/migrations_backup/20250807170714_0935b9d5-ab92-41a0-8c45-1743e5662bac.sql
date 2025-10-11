-- Fix the remaining function security warning
CREATE OR REPLACE FUNCTION public.check_parts_inventory_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;