-- Add missing columns to scan_events table for product library integration
ALTER TABLE public.scan_events 
ADD COLUMN IF NOT EXISTS master_product_id UUID REFERENCES public.master_products(id),
ADD COLUMN IF NOT EXISTS recognition_confidence NUMERIC,
ADD COLUMN IF NOT EXISTS image_hash TEXT,
ADD COLUMN IF NOT EXISTS ai_models_used TEXT[],
ADD COLUMN IF NOT EXISTS data_sources TEXT[],
ADD COLUMN IF NOT EXISTS user_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_corrections JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_inventory_item BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_equipment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for updated_at on scan_events
CREATE TRIGGER update_scan_events_updated_at
  BEFORE UPDATE ON public.scan_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for scan_events
CREATE INDEX IF NOT EXISTS idx_scan_events_product ON public.scan_events(master_product_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_user ON public.scan_events(user_id);