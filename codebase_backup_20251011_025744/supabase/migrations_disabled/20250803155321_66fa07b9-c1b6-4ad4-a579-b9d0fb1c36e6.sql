-- Create inventory folders table
CREATE TABLE public.inventory_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.inventory_folders(id) ON DELETE CASCADE,
    location TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'Package',
    item_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory items table
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    folder TEXT NOT NULL,
    subfolder TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER,
    max_stock INTEGER,
    location TEXT NOT NULL,
    sublocation TEXT,
    folder_id UUID REFERENCES public.inventory_folders(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'in-stock' CHECK (status IN ('in-stock', 'low-stock', 'out-of-stock', 'expired', 'maintenance')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    
    -- Financial
    purchase_price DECIMAL(10,2),
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    
    -- Identification
    sku TEXT,
    barcode TEXT,
    qr_code TEXT,
    serial_number TEXT,
    model_number TEXT,
    part_number TEXT,
    
    -- Supplier & Purchase Info
    supplier TEXT,
    supplier_contact TEXT,
    supplier_item_id TEXT,
    purchase_date DATE,
    warranty_date DATE,
    expiry_date DATE,
    
    -- Physical Properties
    weight DECIMAL(8,2),
    dimensions JSONB,
    color TEXT,
    material TEXT,
    condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'good', 'fair', 'poor', 'needs-repair')),
    
    -- Media
    photos TEXT[],
    documents TEXT[],
    
    -- Maintenance & Service
    maintenance_schedule TEXT,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_notes TEXT,
    
    -- Usage & Movement
    last_moved_date DATE,
    last_used_date DATE,
    usage_count INTEGER DEFAULT 0,
    
    -- Custom Fields
    custom_fields JSONB DEFAULT '{}',
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Tags and Notes
    tags TEXT[],
    notes TEXT
);

-- Create inventory alerts table
CREATE TABLE public.inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('low-stock', 'expiry', 'maintenance', 'custom')),
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create movement records table
CREATE TABLE public.movement_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    moved_by TEXT NOT NULL,
    moved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create stock adjustments table
CREATE TABLE public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('increase', 'decrease', 'set')),
    quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by TEXT NOT NULL,
    adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    cost DECIMAL(10,2)
);

-- Enable Row Level Security
ALTER TABLE public.inventory_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (since no auth is implemented yet)
CREATE POLICY "Allow all operations on inventory_folders" ON public.inventory_folders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_alerts" ON public.inventory_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on movement_records" ON public.movement_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_adjustments" ON public.stock_adjustments FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_inventory_items_folder_id ON public.inventory_items(folder_id);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX idx_inventory_items_priority ON public.inventory_items(priority);
CREATE INDEX idx_inventory_items_created_at ON public.inventory_items(created_at);
CREATE INDEX idx_inventory_alerts_item_id ON public.inventory_alerts(item_id);
CREATE INDEX idx_movement_records_item_id ON public.movement_records(item_id);
CREATE INDEX idx_stock_adjustments_item_id ON public.stock_adjustments(item_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_inventory_folders_updated_at
    BEFORE UPDATE ON public.inventory_folders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial folders
INSERT INTO public.inventory_folders (id, name, description, color, icon) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Safety', 'Safety equipment and emergency supplies', '#EF4444', 'Shield'),
('550e8400-e29b-41d4-a716-446655440001', 'Engine', 'Engine parts and maintenance supplies', '#059669', 'Wrench'),
('550e8400-e29b-41d4-a716-446655440002', 'Electronics', 'Navigation and communication equipment', '#3B82F6', 'Zap'),
('550e8400-e29b-41d4-a716-446655440003', 'Hydraulic', 'Hydraulic systems and components', '#7C3AED', 'Settings');

-- Insert sample inventory items with the new structure
INSERT INTO public.inventory_items (
    id, name, description, folder, subfolder, quantity, min_stock, max_stock, location, sublocation, status, priority,
    purchase_price, unit_cost, total_cost, sku, barcode, qr_code, serial_number, supplier, supplier_contact,
    purchase_date, warranty_date, expiry_date, weight, dimensions, color, material, condition, photos, folder_id,
    maintenance_schedule, last_maintenance_date, next_maintenance_date, custom_fields, tags, notes
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440100',
    'Life Jackets - Adult Type I',
    'USCG approved life jackets for adult passengers, bright orange color with reflective strips',
    'Safety', 'Life Safety', 24, 20, 50, 'Safety Locker A', 'Upper Shelf', 'in-stock', 'critical',
    50, 50, 1200, 'LJ-ADT-001', '123456789012', 'QR-LJ-001', 'LJ2024001-024', 'Marine Safety Corp', 'safety@marinesafety.com',
    '2024-01-01', '2026-01-01', '2029-01-01', 2.5, '{"length": 30, "width": 20, "height": 8, "unit": "cm"}', 'Orange', 'Nylon/Foam', 'new',
    ARRAY['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'], '550e8400-e29b-41d4-a716-446655440000',
    'Annual', '2024-01-01', '2025-01-01', 
    '{"USCG Approval": "160.002/23/1", "Size Range": "40+ inches chest", "Buoyancy": "22 lbs minimum"}',
    ARRAY['safety', 'emergency', 'mandatory', 'uscg-approved'], 'Inspect monthly for wear and damage'
),
(
    '550e8400-e29b-41d4-a716-446655440101',
    'Engine Oil - 15W40 Marine',
    'High-performance marine engine oil for diesel engines',
    'Engine', 'Lubricants', 3, 5, 20, 'Engine Room', 'Oil Storage', 'low-stock', 'high',
    150, 150, 450, 'EO-15W40-001', '123456789013', 'QR-EO-001', NULL, 'Marine Lubricants Inc', 'orders@marinelube.com',
    '2024-01-10', NULL, '2026-01-10', 18.9, '{"length": 25, "width": 25, "height": 35, "unit": "cm"}', NULL, NULL, 'new',
    ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'], '550e8400-e29b-41d4-a716-446655440001',
    NULL, NULL, NULL,
    '{"Viscosity": "15W-40", "API Rating": "CI-4", "Volume": "5L"}',
    ARRAY['engine', 'maintenance', 'lubricant'], 'Check levels weekly during operation'
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    'Marine GPS Navigator',
    '12-inch touchscreen GPS chart plotter with sonar integration',
    'Electronics', 'Navigation', 1, 1, 2, 'Bridge', 'Helm Station', 'in-stock', 'critical',
    3500, 3500, 3500, 'GPS-NAV-001', '123456789016', 'QR-GPS-001', NULL, 'Marine Electronics Co', 'support@marineelectronics.com',
    '2024-01-01', '2027-01-01', NULL, 2.8, '{"length": 30, "width": 20, "height": 8, "unit": "cm"}', NULL, NULL, 'new',
    ARRAY['https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400'], '550e8400-e29b-41d4-a716-446655440002',
    NULL, NULL, NULL,
    '{"Screen Size": "12 inches", "Resolution": "1920x1080", "Water Rating": "IPX7"}',
    ARRAY['electronics', 'navigation', 'gps', 'critical'], 'Update software monthly and backup waypoints'
);

-- Insert sample alerts
INSERT INTO public.inventory_alerts (item_id, type, message, severity) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'low-stock', 'Stock below minimum threshold', 'warning');