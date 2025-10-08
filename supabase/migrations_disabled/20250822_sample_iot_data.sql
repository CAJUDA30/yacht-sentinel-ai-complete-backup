-- Insert sample IoT devices and sensor data for real database integration
-- This replaces mock data in MaritimeIoTEcosystem component

-- First, ensure we have a sample yacht for reference
INSERT INTO public.yacht_profiles (id, name, owner_id, imo_number, status) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Yacht', '550e8400-e29b-41d4-a716-446655440001', 'IMO1234567', 'operational')
ON CONFLICT (id) DO NOTHING;

-- Insert sample NMEA devices (IoT sensors)
INSERT INTO public.nmea_devices (
  id, yacht_id, device_name, device_type, manufacturer, model, 
  location_description, is_active, created_at, updated_at
) VALUES 
(
  'temp-001', 
  '550e8400-e29b-41d4-a716-446655440000',
  'Engine Temperature',
  'engine',
  'Marine Systems Inc',
  'TempSensor Pro',
  'Engine Room',
  true,
  NOW(),
  NOW()
),
(
  'press-002',
  '550e8400-e29b-41d4-a716-446655440000', 
  'Hydraulic Pressure',
  'propulsion',
  'HydroTech Ltd',
  'PressureMax 200',
  'Steering System',
  true,
  NOW(),
  NOW()
),
(
  'fuel-003',
  '550e8400-e29b-41d4-a716-446655440000',
  'Fuel Level Sensor',
  'fuel',
  'FuelSense Corp',
  'FlowGuard Elite',
  'Fuel Tank A',
  true,
  NOW(),
  NOW()
),
(
  'water-004',
  '550e8400-e29b-41d4-a716-446655440000',
  'Bilge Water Level',
  'water',
  'AquaMonitor Inc',
  'BilgeWatch 500',
  'Engine Compartment',
  true,
  NOW(),
  NOW()
),
(
  'batt-005',
  '550e8400-e29b-41d4-a716-446655440000',
  'Main Battery Bank',
  'electrical',
  'PowerSafe Marine',
  'BatteryGuard X1',
  'Battery Compartment',
  true,
  NOW(),
  NOW()
),
(
  'nav-006',
  '550e8400-e29b-41d4-a716-446655440000',
  'GPS Position Sensor',
  'navigation',
  'NavTech Systems',
  'GPS Pro Navigator',
  'Navigation Bridge',
  true,
  NOW(),
  NOW()
),
(
  'sec-007',
  '550e8400-e29b-41d4-a716-446655440000',
  'Motion Detector',
  'security',
  'SecureBoat Ltd',
  'MotionWatch HD',
  'Main Deck',
  true,
  NOW(),
  NOW()
),
(
  'temp-008',
  '550e8400-e29b-41d4-a716-446655440000',
  'Cabin Temperature',
  'hvac',
  'Climate Control Inc',
  'TempControl Elite',
  'Master Cabin',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert device health status for all devices
INSERT INTO public.device_health_status (
  device_id, yacht_id, status, last_data_received, battery_level, 
  signal_strength, health_score, uptime_hours, created_at, updated_at
) VALUES 
(
  'temp-001',
  '550e8400-e29b-41d4-a716-446655440000',
  'online',
  NOW() - INTERVAL '2 minutes',
  87,
  92,
  95,
  324.5,
  NOW(),
  NOW()
),
(
  'press-002',
  '550e8400-e29b-41d4-a716-446655440000',
  'online',
  NOW() - INTERVAL '3 minutes',
  94,
  88,
  97,
  421.2,
  NOW(),
  NOW()
),
(
  'fuel-003',
  '550e8400-e29b-41d4-a716-446655440000',
  'online',
  NOW() - INTERVAL '1 minute',
  76,
  91,
  89,
  156.7,
  NOW(),
  NOW()
),
(
  'water-004',
  '550e8400-e29b-41d4-a716-446655440000',
  'online',
  NOW() - INTERVAL '4 minutes',
  83,
  89,
  92,
  278.3,
  NOW(),
  NOW()
),
(
  'batt-005',
  '550e8400-e29b-41d4-a716-446655440000',
  'online',
  NOW() - INTERVAL '1 minute',
  100,
  96,
  98,
  654.1,
  NOW(),
  NOW()
),
(
  'nav-006',
  '550e8400-e29b-41d4-a716-446655440000',
  'online',
  NOW() - INTERVAL '30 seconds',
  91,
  95,
  99,
  521.8,
  NOW(),
  NOW()
),
(
  'sec-007',
  '550e8400-e29b-41d4-a716-446655440000',
  'online',
  NOW() - INTERVAL '5 minutes',
  68,
  84,
  85,
  234.9,
  NOW(),
  NOW()
),
(
  'temp-008',
  '550e8400-e29b-41d4-a716-446655440000',
  'maintenance',
  NOW() - INTERVAL '15 minutes',
  45,
  67,
  70,
  89.2,
  NOW(),
  NOW()
)
ON CONFLICT (device_id) DO NOTHING;

-- Insert sample sensor data for realistic readings
INSERT INTO public.nmea_sensor_data (
  yacht_id, device_id, pgn, source_address, parsed_data, signal_quality, timestamp
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'temp-001',
  127489,
  1,
  '{"temperature": 78.5, "unit": "°C"}',
  92,
  NOW() - INTERVAL '2 minutes'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'press-002',
  127250,
  2,
  '{"pressure": 145.8, "unit": "PSI"}',
  88,
  NOW() - INTERVAL '3 minutes'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'fuel-003',
  127505,
  3,
  '{"fuel_level": 67.2, "unit": "%"}',
  91,
  NOW() - INTERVAL '1 minute'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'water-004',
  127505,
  4,
  '{"water_level": 2.3, "unit": "cm"}',
  89,
  NOW() - INTERVAL '4 minutes'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'batt-005',
  127506,
  5,
  '{"voltage": 24.8, "unit": "V"}',
  96,
  NOW() - INTERVAL '1 minute'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'nav-006',
  129025,
  6,
  '{"satellites": 12, "unit": "count"}',
  95,
  NOW() - INTERVAL '30 seconds'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'sec-007',
  130820,
  7,
  '{"motion_events": 0, "unit": "events"}',
  84,
  NOW() - INTERVAL '5 minutes'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'temp-008',
  127489,
  8,
  '{"temperature": 22.1, "unit": "°C"}',
  67,
  NOW() - INTERVAL '15 minutes'
);

-- Insert sample alert rules for critical sensors
INSERT INTO public.sensor_alert_rules (
  yacht_id, device_id, parameter_name, rule_name, condition_type,
  threshold_value, severity, is_active
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'temp-001',
  'temperature',
  'Engine Temperature High',
  'threshold_high',
  90.0,
  'critical',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'press-002',
  'pressure',
  'Hydraulic Pressure Low',
  'threshold_low',
  100.0,
  'warning',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'fuel-003',
  'fuel_level',
  'Fuel Level Low',
  'threshold_low',
  10.0,
  'critical',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'water-004',
  'water_level',
  'Bilge Water High',
  'threshold_high',
  5.0,
  'emergency',
  true
)
ON CONFLICT DO NOTHING;

-- Create some edge node data in the system config table
INSERT INTO public.nmea_system_config (
  yacht_id, gateway_ip, gateway_port, update_frequency_hz,
  integration_settings
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '192.168.1.100',
  2000,
  1.0,
  '{
    "edge_nodes": [
      {
        "id": "edge-001",
        "name": "Engine Room Hub",
        "location": "Engine Room",
        "status": "online",
        "connected_sensors": 12,
        "cpu_usage": 34,
        "memory_usage": 67,
        "storage_usage": 23,
        "network_latency": 15,
        "uptime": 99.8
      },
      {
        "id": "edge-002", 
        "name": "Navigation Bridge Hub",
        "location": "Bridge",
        "status": "online",
        "connected_sensors": 8,
        "cpu_usage": 28,
        "memory_usage": 54,
        "storage_usage": 18,
        "network_latency": 12,
        "uptime": 99.9
      },
      {
        "id": "edge-003",
        "name": "Deck Systems Hub", 
        "location": "Main Deck",
        "status": "online",
        "connected_sensors": 15,
        "cpu_usage": 42,
        "memory_usage": 71,
        "storage_usage": 31,
        "network_latency": 18,
        "uptime": 99.7
      },
      {
        "id": "edge-004",
        "name": "Guest Areas Hub",
        "location": "Guest Deck", 
        "status": "updating",
        "connected_sensors": 6,
        "cpu_usage": 15,
        "memory_usage": 38,
        "storage_usage": 12,
        "network_latency": 22,
        "uptime": 99.5
      }
    ]
  }'
)
ON CONFLICT (yacht_id) DO UPDATE SET
  integration_settings = EXCLUDED.integration_settings,
  updated_at = NOW();

COMMENT ON TABLE nmea_devices IS 'IoT devices and sensors on yacht for real-time monitoring';
COMMENT ON TABLE device_health_status IS 'Real-time health and connectivity status of IoT devices';
COMMENT ON TABLE nmea_sensor_data IS 'Real-time sensor readings and measurements from IoT devices';