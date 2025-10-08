-- Fix security warnings

-- Fix WARN 1: Function Search Path Mutable
-- Update the existing function to have a secure search_path
CREATE OR REPLACE FUNCTION check_parts_inventory_trigger()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';