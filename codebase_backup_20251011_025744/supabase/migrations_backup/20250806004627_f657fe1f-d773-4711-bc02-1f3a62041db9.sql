-- Fix infinite recursion in yacht_profiles RLS policies
-- First, drop the problematic policies
DROP POLICY IF EXISTS "Owners can manage their yachts" ON yacht_profiles;
DROP POLICY IF EXISTS "Users can view yachts they own or crew on" ON yacht_profiles;

-- Create a security definer function to check user role safely
CREATE OR REPLACE FUNCTION public.get_user_yacht_access()
RETURNS TABLE(yacht_id UUID, access_level TEXT)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- Return yachts the current user owns
  SELECT id, 'owner' FROM yacht_profiles WHERE owner_id = auth.uid()
  UNION
  -- Return yachts the current user crews on
  SELECT yacht_id, 'crew' FROM crew_members WHERE user_id = auth.uid();
$$;

-- Create new non-recursive RLS policies
CREATE POLICY "Users can view accessible yachts" ON yacht_profiles
FOR SELECT USING (
  id IN (SELECT yacht_id FROM get_user_yacht_access())
);

CREATE POLICY "Owners can manage their yachts" ON yacht_profiles
FOR ALL USING (
  owner_id = auth.uid()
);

-- Add sample yacht data for testing
INSERT INTO yacht_profiles (name, owner_id, length_meters, beam_meters, draft_meters, year_built, guest_capacity, crew_capacity, fuel_capacity, fuel_level, battery_level, builder, flag_state, home_port, status) VALUES
('Serenity', auth.uid(), 85.0, 16.5, 4.2, 2020, 12, 18, 15000, 12500, 95, 'Lurssen', 'Malta', 'Monaco', 'operational'),
('Ocean Pearl', auth.uid(), 65.0, 12.8, 3.5, 2018, 10, 14, 8500, 7200, 88, 'Feadship', 'Netherlands', 'St. Tropez', 'operational'),
('Wind Dancer', auth.uid(), 45.0, 9.2, 2.8, 2021, 8, 10, 4500, 3800, 92, 'Sunseeker', 'UK', 'Antibes', 'maintenance')
ON CONFLICT (id) DO NOTHING;

-- Add crew members
INSERT INTO crew_members (name, position, yacht_id, user_id, status, salary, hire_date, certifications) VALUES
('Captain Smith', 'captain', (SELECT id FROM yacht_profiles WHERE name = 'Serenity' LIMIT 1), auth.uid(), 'active', 8500, '2023-01-15', '["MCA Master 500GT", "STCW95"]'),
('Chef Rodriguez', 'chef', (SELECT id FROM yacht_profiles WHERE name = 'Serenity' LIMIT 1), auth.uid(), 'active', 4500, '2023-03-01', '["Culinary Diploma", "Food Safety"]'),
('Engineer Johnson', 'chief_engineer', (SELECT id FROM yacht_profiles WHERE name = 'Ocean Pearl' LIMIT 1), auth.uid(), 'active', 6500, '2023-02-10', '["MCA ENG1", "Marine Engineering"]')
ON CONFLICT (id) DO NOTHING;

-- Add equipment records
INSERT INTO equipment (name, manufacturer, model_number, serial_number, location, status, description, technical_specs) VALUES
('Main Engine Port', 'Caterpillar', 'C32 ACERT', 'CAT12345ABC', 'Engine Room', 'operational', 'Primary propulsion engine', '{"power_hp": 1925, "fuel_consumption": "120L/hr", "hours": 2350}'),
('Generator 1', 'Kohler', 'MDKD20', 'KOH67890DEF', 'Engine Room', 'operational', 'Main electrical generator', '{"power_kw": 80, "fuel_consumption": "25L/hr", "hours": 1850}'),
('Navigation Radar', 'Furuno', 'FAR-3220', 'FUR11223GHI', 'Bridge', 'operational', 'Primary navigation radar system', '{"range_nm": 96, "frequency": "X-band", "power_w": 25000}'),
('Tender Crane', 'Palfinger', 'PK 12502', 'PAL44556JKL', 'Aft Deck', 'maintenance', 'Hydraulic tender lifting crane', '{"capacity_kg": 2500, "reach_m": 8.5, "hours": 890}')
ON CONFLICT (id) DO NOTHING;

-- Add inventory items with proper data
INSERT INTO inventory_items (name, description, quantity, location, folder, status, condition, min_stock, max_stock, unit_cost, supplier) VALUES
('Engine Oil - Mobil 1', '15W-40 Marine Engine Oil', 24, 'Engine Room Storage', 'Fluids & Lubricants', 'in-stock', 'new', 6, 48, 89.50, 'Mobil Marine'),
('Spark Plugs - NGK', 'Marine grade spark plugs for main engines', 16, 'Engine Room Parts', 'Engine Parts', 'in-stock', 'new', 8, 32, 45.75, 'NGK Marine'),
('Safety Flares', 'SOLAS approved handheld flares', 12, 'Safety Locker', 'Safety Equipment', 'in-stock', 'new', 12, 24, 25.00, 'Pains Wessex'),
('Hydraulic Fluid', 'Marine grade hydraulic fluid', 8, 'Hydraulic Room', 'Fluids & Lubricants', 'in-stock', 'new', 4, 16, 120.00, 'Castrol Marine'),
('Air Filters', 'Engine air filters - set of 4', 3, 'Engine Room Parts', 'Engine Parts', 'low-stock', 'new', 2, 12, 185.25, 'Mann Filter')
ON CONFLICT (id) DO NOTHING;

-- Add financial transactions
INSERT INTO financial_transactions (transaction_type, category, description, amount, transaction_date, yacht_id, vendor_name, status) VALUES
('expense', 'maintenance', 'Engine service and oil change', -2450.00, CURRENT_DATE - INTERVAL '5 days', (SELECT id FROM yacht_profiles WHERE name = 'Serenity' LIMIT 1), 'Marine Service Pro', 'completed'),
('expense', 'fuel', 'Fuel top-up at Monaco', -18500.00, CURRENT_DATE - INTERVAL '7 days', (SELECT id FROM yacht_profiles WHERE name = 'Serenity' LIMIT 1), 'Monaco Marine Fuel', 'completed'),
('income', 'charter', 'Charter payment - Mediterranean week', 125000.00, CURRENT_DATE - INTERVAL '2 days', (SELECT id FROM yacht_profiles WHERE name = 'Ocean Pearl' LIMIT 1), 'Elite Yacht Charters', 'completed'),
('expense', 'provisions', 'Guest provisions and galley supplies', -3200.00, CURRENT_DATE - INTERVAL '3 days', (SELECT id FROM yacht_profiles WHERE name = 'Ocean Pearl' LIMIT 1), 'Gourmet Marine Supplies', 'completed')
ON CONFLICT (id) DO NOTHING;