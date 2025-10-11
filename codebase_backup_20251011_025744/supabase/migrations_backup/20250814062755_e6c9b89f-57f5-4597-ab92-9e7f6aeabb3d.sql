-- Create master products table for universal product library
CREATE TABLE public.master_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  part_number TEXT,
  upc_code TEXT,
  barcode TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('inventory', 'equipment')),
  
  -- Product specifications
  specifications JSONB NOT NULL DEFAULT '{}',
  dimensions JSONB DEFAULT '{}',
  weight NUMERIC,
  materials JSONB DEFAULT '[]',
  
  -- Documentation
  description TEXT,
  owner_manual_url TEXT,
  installation_guide_url TEXT,
  technical_specs_url TEXT,
  datasheet_url TEXT,
  safety_instructions TEXT,
  
  -- Images and media
  primary_image_url TEXT,
  additional_images JSONB DEFAULT '[]',
  
  -- Maintenance and lifecycle
  maintenance_schedule JSONB DEFAULT '[]',
  expected_lifespan_hours INTEGER,
  warranty_period_months INTEGER,
  
  -- Compatibility and parts
  compatible_parts JSONB DEFAULT '[]',
  required_spare_parts JSONB DEFAULT '[]',
  installation_requirements TEXT,
  
  -- Data quality and validation
  confidence_score NUMERIC DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  data_quality_score NUMERIC DEFAULT 0.5 CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'disputed')),
  
  -- Contribution tracking
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  last_verified_by UUID,
  
  -- Usage statistics
  scan_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  
  -- Search and matching
  search_keywords TEXT[],
  alternative_names TEXT[],
  
  UNIQUE(product_name, brand, model, product_type)
);

-- Create product contributions table for collaborative improvements
CREATE TABLE public.product_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_product_id UUID NOT NULL REFERENCES public.master_products(id) ON DELETE CASCADE,
  contributor_id UUID,
  
  -- Contribution details
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('new_field', 'correction', 'enhancement', 'image', 'documentation')),
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  
  -- Status and approval
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Quality metrics
  confidence_score NUMERIC DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence_sources TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product versions table for version control
CREATE TABLE public.product_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_product_id UUID NOT NULL REFERENCES public.master_products(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Version data snapshot
  product_data JSONB NOT NULL,
  
  -- Version metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_summary TEXT,
  change_type TEXT CHECK (change_type IN ('initial', 'correction', 'enhancement', 'merge', 'verification')),
  
  UNIQUE(master_product_id, version_number)
);

-- Enable RLS on all tables
ALTER TABLE public.master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for master_products
CREATE POLICY "Everyone can view master products" 
ON public.master_products FOR SELECT USING (true);

CREATE POLICY "Authenticated users can contribute products" 
ON public.master_products FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Contributors can update their products" 
ON public.master_products FOR UPDATE 
USING (created_by = auth.uid() OR auth.uid() IS NOT NULL);

-- Create RLS policies for product_contributions
CREATE POLICY "Everyone can view contributions" 
ON public.product_contributions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can make contributions" 
ON public.product_contributions FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Contributors can update their contributions" 
ON public.product_contributions FOR UPDATE 
USING (contributor_id = auth.uid());

-- Create RLS policies for product_versions
CREATE POLICY "Everyone can view product versions" 
ON public.product_versions FOR SELECT USING (true);

CREATE POLICY "System can create versions" 
ON public.product_versions FOR INSERT 
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_master_products_updated_at
  BEFORE UPDATE ON public.master_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_contributions_updated_at
  BEFORE UPDATE ON public.product_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_master_products_type ON public.master_products(product_type);
CREATE INDEX idx_master_products_category ON public.master_products(category);
CREATE INDEX idx_master_products_search ON public.master_products USING GIN(search_keywords);
CREATE INDEX idx_master_products_name ON public.master_products(product_name);
CREATE INDEX idx_master_products_brand_model ON public.master_products(brand, model);
CREATE INDEX idx_product_contributions_product ON public.product_contributions(master_product_id);
CREATE INDEX idx_product_contributions_status ON public.product_contributions(status);