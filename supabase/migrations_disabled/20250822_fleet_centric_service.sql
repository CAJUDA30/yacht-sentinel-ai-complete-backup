-- Fleet-Centric Service database schema

-- Extended yacht profiles with fleet management data
CREATE TABLE IF NOT EXISTS public.yacht_fleet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  current_port TEXT,
  current_country TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'maintenance', 'charter', 'transit', 'docked')),
  owner_name TEXT,
  owner_contact TEXT,
  management_company TEXT,
  captain_name TEXT,
  management_contact TEXT,
  cruising_speed DECIMAL(5,2) DEFAULT 0,
  max_speed DECIMAL(5,2) DEFAULT 0,
  fuel_capacity_liters INTEGER DEFAULT 0,
  water_capacity_liters INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet operational metrics
CREATE TABLE IF NOT EXISTS public.fleet_operational_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  operational_cost DECIMAL(12,2) DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  maintenance_score INTEGER DEFAULT 100,
  utilization_rate DECIMAL(5,2) DEFAULT 0,
  guest_satisfaction DECIMAL(3,2) DEFAULT 5.0,
  crew_efficiency DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet financial tracking
CREATE TABLE IF NOT EXISTS public.fleet_financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet compliance records
CREATE TABLE IF NOT EXISTS public.fleet_compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL,
  compliance_score INTEGER DEFAULT 100,
  certification_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('valid', 'pending', 'expired', 'overdue')),
  expiry_date DATE,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE yacht_fleet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_operational_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_compliance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on yacht_fleet_profiles" ON yacht_fleet_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on fleet_operational_metrics" ON fleet_operational_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on fleet_financial_records" ON fleet_financial_records FOR ALL USING (true);
CREATE POLICY "Allow all operations on fleet_compliance_records" ON fleet_compliance_records FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_yacht_fleet_profiles_yacht ON yacht_fleet_profiles(yacht_id);
CREATE INDEX IF NOT EXISTS idx_fleet_operational_metrics_yacht_date ON fleet_operational_metrics(yacht_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_financial_records_yacht_date ON fleet_financial_records(yacht_id, transaction_date DESC);

-- Insert sample data
INSERT INTO yacht_fleet_profiles (
  yacht_id, location_latitude, location_longitude, current_port, current_country, 
  status, owner_name, owner_contact, management_company, captain_name,
  cruising_speed, max_speed, fuel_capacity_liters, water_capacity_liters
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  43.7384, 7.4246, 'Monaco', 'Monaco',
  'active', 'John Doe', 'john@example.com', 'Elite Management', 'Captain Smith',
  12.0, 18.0, 5000, 2000
),
(
  '550e8400-e29b-41d4-a716-446655440001', 
  25.7617, -80.1918, 'Miami', 'USA',
  'charter', 'Jane Smith', 'jane@example.com', 'Ocean Management', 'Captain Johnson',
  14.0, 20.0, 6000, 2500
) ON CONFLICT (yacht_id) DO NOTHING;

-- Insert operational metrics
INSERT INTO fleet_operational_metrics (
  yacht_id, operational_cost, revenue_generated, maintenance_score,
  utilization_rate, guest_satisfaction, crew_efficiency
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  15000.00, 25000.00, 92, 78.5, 4.6, 89.2
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  18000.00, 35000.00, 87, 85.3, 4.4, 86.7
) ON CONFLICT DO NOTHING;

-- Insert financial records
INSERT INTO fleet_financial_records (
  yacht_id, transaction_type, amount, description
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'charter_income', 25000.00, 'Weekly charter Monaco to Cannes'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'charter_income', 35000.00, 'Week charter Miami to Bahamas'
) ON CONFLICT DO NOTHING;

-- Fleet metrics calculation function
CREATE OR REPLACE FUNCTION calculate_fleet_metrics()
RETURNS TABLE (
  total_yachts BIGINT,
  active_yachts BIGINT,
  maintenance_yachts BIGINT,
  charter_yachts BIGINT,
  average_length DECIMAL,
  total_gross_tonnage DECIMAL,
  fleet_value DECIMAL,
  utilization_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_yachts,
    COUNT(*) FILTER (WHERE yfp.status = 'active')::BIGINT as active_yachts,
    COUNT(*) FILTER (WHERE yfp.status = 'maintenance')::BIGINT as maintenance_yachts,
    COUNT(*) FILTER (WHERE yfp.status = 'charter')::BIGINT as charter_yachts,
    COALESCE(AVG(yp.length_meters), 0) as average_length,
    COALESCE(SUM(yp.gross_tonnage), 0) as total_gross_tonnage,
    COALESCE(SUM(yp.length_meters * 100000), 0) as fleet_value,
    COALESCE(AVG(fom.utilization_rate), 0) as utilization_rate
  FROM yacht_profiles yp
  LEFT JOIN yacht_fleet_profiles yfp ON yp.id = yfp.yacht_id
  LEFT JOIN fleet_operational_metrics fom ON yp.id = fom.yacht_id 
    AND fom.metric_date >= CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Yacht comparison metrics function
CREATE OR REPLACE FUNCTION get_yacht_comparison_metrics()
RETURNS TABLE (
  yacht_id UUID,
  operational_cost DECIMAL,
  revenue_generated DECIMAL,
  maintenance_score DECIMAL,
  utilization_rate DECIMAL,
  guest_satisfaction DECIMAL,
  crew_efficiency DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fom.yacht_id,
    AVG(fom.operational_cost) as avg_operational_cost,
    AVG(fom.revenue_generated) as avg_revenue_generated,
    AVG(fom.maintenance_score) as avg_maintenance_score,
    AVG(fom.utilization_rate) as avg_utilization_rate,
    AVG(fom.guest_satisfaction) as avg_guest_satisfaction,
    AVG(fom.crew_efficiency) as avg_crew_efficiency
  FROM fleet_operational_metrics fom
  WHERE fom.metric_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY fom.yacht_id;
END;
$$ LANGUAGE plpgsql;