-- Infrastructure monitoring schema for GlobalDeploymentInfrastructure component
-- This replaces mock infrastructure data with real database integration

-- Global deployment regions table
CREATE TABLE IF NOT EXISTS public.deployment_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'maintenance', 'offline')),
  latency_ms INTEGER DEFAULT 0,
  uptime_percentage DECIMAL(5,2) DEFAULT 0.00,
  load_percentage INTEGER DEFAULT 0,
  capacity_percentage INTEGER DEFAULT 0,
  endpoints_count INTEGER DEFAULT 0,
  traffic_share_percentage INTEGER DEFAULT 0,
  last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Infrastructure metrics table for real-time monitoring
CREATE TABLE IF NOT EXISTS public.infrastructure_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES deployment_regions(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_numeric_value DECIMAL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('excellent', 'good', 'warning', 'critical')),
  trend TEXT NOT NULL CHECK (trend IN ('up', 'down', 'stable')),
  description TEXT,
  unit TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-scaling rules for infrastructure management
CREATE TABLE IF NOT EXISTS public.auto_scaling_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES deployment_regions(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,
  action_description TEXT NOT NULL,
  threshold_value DECIMAL NOT NULL,
  threshold_unit TEXT DEFAULT '%',
  is_enabled BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP WITH TIME ZONE,
  trigger_count_today INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System performance metrics for detailed monitoring
CREATE TABLE IF NOT EXISTS public.system_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES deployment_regions(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('cpu', 'memory', 'storage', 'network', 'requests', 'errors')),
  current_value DECIMAL NOT NULL,
  max_value DECIMAL DEFAULT 100,
  unit TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('normal', 'warning', 'critical')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disaster recovery configurations
CREATE TABLE IF NOT EXISTS public.disaster_recovery_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES deployment_regions(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('real_time', 'daily', 'weekly', 'monthly')),
  rto_minutes INTEGER NOT NULL, -- Recovery Time Objective
  rpo_minutes INTEGER NOT NULL, -- Recovery Point Objective
  last_backup TIMESTAMP WITH TIME ZONE,
  last_test TIMESTAMP WITH TIME ZONE,
  test_success_rate DECIMAL(5,2) DEFAULT 100.00,
  encryption_enabled BOOLEAN DEFAULT true,
  replication_regions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE deployment_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_scaling_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_recovery_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enterprise access
CREATE POLICY "Allow all operations on deployment_regions" ON deployment_regions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on infrastructure_metrics" ON infrastructure_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on auto_scaling_rules" ON auto_scaling_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on system_performance_metrics" ON system_performance_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on disaster_recovery_config" ON disaster_recovery_config FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deployment_regions_status ON deployment_regions(status);
CREATE INDEX IF NOT EXISTS idx_infrastructure_metrics_region ON infrastructure_metrics(region_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_metrics_created ON infrastructure_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_scaling_rules_region ON auto_scaling_rules(region_id);
CREATE INDEX IF NOT EXISTS idx_auto_scaling_rules_enabled ON auto_scaling_rules(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_system_performance_metrics_region ON system_performance_metrics(region_id);
CREATE INDEX IF NOT EXISTS idx_system_performance_metrics_recorded ON system_performance_metrics(recorded_at DESC);

-- Insert sample deployment regions
INSERT INTO deployment_regions (
  id, name, location, status, latency_ms, uptime_percentage, load_percentage, 
  capacity_percentage, endpoints_count, traffic_share_percentage, last_health_check
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'North America East',
  'Virginia, USA',
  'active',
  45,
  99.9,
  67,
  85,
  12,
  28,
  NOW() - INTERVAL '30 seconds'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Europe West',
  'Ireland',
  'active',
  32,
  99.8,
  54,
  78,
  10,
  24,
  NOW() - INTERVAL '15 seconds'
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Asia Pacific',
  'Singapore',
  'active',
  38,
  99.7,
  72,
  88,
  8,
  22,
  NOW() - INTERVAL '45 seconds'
),
(
  '550e8400-e29b-41d4-a716-446655440004',
  'Europe Central',
  'Frankfurt, Germany',
  'maintenance',
  41,
  98.9,
  23,
  92,
  6,
  8,
  NOW() - INTERVAL '15 minutes'
),
(
  '550e8400-e29b-41d4-a716-446655440005',
  'North America West',
  'Oregon, USA',
  'active',
  52,
  99.6,
  61,
  81,
  9,
  18,
  NOW() - INTERVAL '40 seconds'
)
ON CONFLICT (id) DO NOTHING;

-- Insert global infrastructure metrics
INSERT INTO infrastructure_metrics (
  metric_name, metric_value, metric_numeric_value, status, trend, description, unit, category
) VALUES 
(
  'Global Uptime',
  '99.75%',
  99.75,
  'excellent',
  'stable',
  'Average uptime across all regions',
  '%',
  'availability'
),
(
  'Response Time',
  '42ms',
  42,
  'excellent',
  'down',
  'Global average response time',
  'ms',
  'performance'
),
(
  'Throughput',
  '847K req/min',
  847000,
  'good',
  'up',
  'Total requests per minute globally',
  'req/min',
  'performance'
),
(
  'Error Rate',
  '0.03%',
  0.03,
  'excellent',
  'down',
  'Global error rate across all services',
  '%',
  'reliability'
),
(
  'Resource Utilization',
  '64%',
  64,
  'good',
  'stable',
  'Average CPU and memory usage',
  '%',
  'resource'
),
(
  'Auto-Scaling Events',
  '23 today',
  23,
  'good',
  'stable',
  'Successful auto-scaling operations',
  'events',
  'scaling'
);

-- Insert auto-scaling rules for each region
INSERT INTO auto_scaling_rules (
  region_id, rule_name, trigger_condition, action_description, threshold_value, threshold_unit, 
  is_enabled, last_triggered, trigger_count_today
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'CPU Scale Out',
  'CPU Usage > 80%',
  'Add 2 instances',
  80,
  '%',
  true,
  NOW() - INTERVAL '3 hours 15 minutes',
  2
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Memory Scale Out',
  'Memory Usage > 85%',
  'Add 1 instance',
  85,
  '%',
  true,
  NOW() - INTERVAL '7 hours 40 minutes',
  1
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Request Rate Scale',
  'Requests > 1000/min',
  'Add 3 instances',
  1000,
  'req/min',
  true,
  NOW() - INTERVAL '12 hours 45 minutes',
  3
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'Scale Down',
  'CPU Usage < 30%',
  'Remove 1 instance',
  30,
  '%',
  true,
  NOW() - INTERVAL '21 hours 30 minutes',
  1
);

-- Insert system performance metrics for all regions
INSERT INTO system_performance_metrics (
  region_id, metric_type, current_value, max_value, unit, status
) VALUES 
-- North America East metrics
('550e8400-e29b-41d4-a716-446655440001', 'cpu', 64, 100, '%', 'normal'),
('550e8400-e29b-41d4-a716-446655440001', 'memory', 71, 100, '%', 'normal'),
('550e8400-e29b-41d4-a716-446655440001', 'storage', 45, 100, '%', 'normal'),
('550e8400-e29b-41d4-a716-446655440001', 'network', 2.1, 10, 'TB/day', 'normal'),
-- Europe West metrics
('550e8400-e29b-41d4-a716-446655440002', 'cpu', 54, 100, '%', 'normal'),
('550e8400-e29b-41d4-a716-446655440002', 'memory', 68, 100, '%', 'normal'),
('550e8400-e29b-41d4-a716-446655440002', 'storage', 52, 100, '%', 'normal'),
('550e8400-e29b-41d4-a716-446655440002', 'network', 1.8, 10, 'TB/day', 'normal'),
-- Asia Pacific metrics
('550e8400-e29b-41d4-a716-446655440003', 'cpu', 72, 100, '%', 'warning'),
('550e8400-e29b-41d4-a716-446655440003', 'memory', 75, 100, '%', 'normal'),
('550e8400-e29b-41d4-a716-446655440003', 'storage', 38, 100, '%', 'normal'),
('550e8400-e29b-41d4-a716-446655440003', 'network', 1.5, 10, 'TB/day', 'normal');

-- Insert disaster recovery configurations
INSERT INTO disaster_recovery_config (
  region_id, backup_type, rto_minutes, rpo_minutes, last_backup, last_test, 
  test_success_rate, encryption_enabled, replication_regions
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'real_time',
  60,
  5,
  NOW() - INTERVAL '15 minutes',
  '2024-01-01'::DATE,
  100.00,
  true,
  ARRAY['Europe West', 'Asia Pacific']
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'real_time',
  60,
  5,
  NOW() - INTERVAL '10 minutes',
  '2024-01-01'::DATE,
  100.00,
  true,
  ARRAY['North America East', 'Asia Pacific']
),
(
  '550e8400-e29b-41d4-a716-446655440003',
  'real_time',
  60,
  5,
  NOW() - INTERVAL '12 minutes',
  '2024-01-01'::DATE,
  100.00,
  true,
  ARRAY['North America East', 'Europe West']
);

-- Create function to update region health automatically
CREATE OR REPLACE FUNCTION update_region_health()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last health check timestamp
  NEW.last_health_check = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update health check timestamps
CREATE TRIGGER update_deployment_regions_health
  BEFORE UPDATE ON deployment_regions
  FOR EACH ROW
  EXECUTE FUNCTION update_region_health();

COMMENT ON TABLE deployment_regions IS 'Global infrastructure deployment regions for real-time monitoring';
COMMENT ON TABLE infrastructure_metrics IS 'Real-time infrastructure performance metrics and monitoring data';
COMMENT ON TABLE auto_scaling_rules IS 'Auto-scaling rules and configurations for dynamic resource management';
COMMENT ON TABLE system_performance_metrics IS 'Detailed system performance metrics for monitoring and alerting';