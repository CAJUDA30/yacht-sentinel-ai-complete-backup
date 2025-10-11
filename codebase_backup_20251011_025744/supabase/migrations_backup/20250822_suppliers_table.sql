-- Create suppliers table for real supplier data instead of mock data
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialties TEXT[] DEFAULT '{}',
  location TEXT,
  response_time_hours INTEGER DEFAULT 24,
  success_rate DECIMAL(5,2) DEFAULT 95.00,
  rating DECIMAL(3,2) DEFAULT 4.5,
  verified BOOLEAN DEFAULT false,
  contact_info JSONB DEFAULT '{}',
  certification_info JSONB DEFAULT '{}',
  service_areas TEXT[] DEFAULT '{}',
  website TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public access (since this is enterprise level data)
CREATE POLICY "Allow all operations on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_specialties ON public.suppliers USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON public.suppliers(location);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON public.suppliers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);

-- Insert sample supplier data
INSERT INTO public.suppliers (
  name, company, email, phone, specialties, location, response_time_hours, success_rate, rating, verified
) VALUES 
(
  'Marine Tech Solutions',
  'MTS Marine',
  'quotes@mts-marine.com',
  '+1-555-0123',
  ARRAY['Electronics', 'Navigation', 'Radar'],
  'Fort Lauderdale, FL',
  4,
  95.0,
  4.8,
  true
),
(
  'Yacht Engine Specialists',
  'YES Marine',
  'service@yes-marine.com',
  '+1-555-0456',
  ARRAY['Engines', 'Propulsion', 'Mechanical'],
  'Monaco',
  6,
  88.0,
  4.5,
  true
),
(
  'Premium Marine Electronics',
  'PME Ltd',
  'support@pme-marine.com',
  '+44-20-7946-0958',
  ARRAY['Electronics', 'Communications', 'Entertainment'],
  'Southampton, UK',
  8,
  92.0,
  4.7,
  true
),
(
  'Mediterranean Marine Services',
  'Med Marine Co',
  'contact@medmarine.com',
  '+33-4-9288-7654',
  ARRAY['Maintenance', 'Repair', 'Inspection'],
  'Cannes, France',
  12,
  90.0,
  4.3,
  true
),
(
  'Caribbean Yacht Solutions',
  'CYS Ltd',
  'info@caribbeanyacht.com',
  '+1-758-555-0789',
  ARRAY['Provisioning', 'Crew', 'Services'],
  'St. Lucia',
  24,
  87.0,
  4.2,
  false
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_suppliers_updated_at();