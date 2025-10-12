import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NMEAMessage {
  pgn: number;
  source: number;
  destination?: number;
  priority: number;
  data: Uint8Array;
  timestamp: number;
}

interface ParsedSensorData {
  [key: string]: number | string | boolean;
}

interface DeviceData {
  yacht_id: string;
  device_id?: string;
  device_name?: string;
  device_type?: string;
  messages: NMEAMessage[];
}

interface ProcessingResult {
  processed_count: number;
  failed_count: number;
  alerts_triggered: number;
  devices_updated: number;
  processing_time_ms: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// NMEA 2000 PGN to parameter mapping
const PGN_MAPPINGS = {
  127488: { // Engine Parameters, Rapid Update
    name: 'engine_rapid',
    parser: parseEngineRapid
  },
  127489: { // Engine Parameters, Dynamic
    name: 'engine_dynamic', 
    parser: parseEngineDynamic
  },
  127505: { // Fluid Level
    name: 'fluid_level',
    parser: parseFluidLevel
  },
  128259: { // Speed, Water Referenced
    name: 'water_speed',
    parser: parseWaterSpeed
  },
  128267: { // Water Depth
    name: 'water_depth',
    parser: parseWaterDepth
  },
  129025: { // Position, Rapid Update
    name: 'position_rapid',
    parser: parsePositionRapid
  },
  129026: { // COG & SOG, Rapid Update
    name: 'cog_sog_rapid',
    parser: parseCogSogRapid
  },
  130306: { // Wind Data
    name: 'wind_data',
    parser: parseWindData
  },
  127250: { // Vessel Heading
    name: 'vessel_heading',
    parser: parseVesselHeading
  },
  128275: { // Distance Log
    name: 'distance_log',
    parser: parseDistanceLog
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const deviceData: DeviceData = await req.json();
    console.log(`📡 NMEA 2000 data received for yacht ${deviceData.yacht_id} with ${deviceData.messages.length} messages`);

    if (!deviceData.yacht_id || !deviceData.messages || deviceData.messages.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request: yacht_id and messages are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process all messages
    const result = await processNMEAMessages(deviceData);

    // Update device health status
    await updateDeviceHealth(deviceData);

    // Check for anomalies and patterns
    await checkAnomalies(deviceData.yacht_id);

    const processingTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      result: {
        ...result,
        processing_time_ms: processingTime
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 NMEA processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'NMEA data processing failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processNMEAMessages(deviceData: DeviceData): Promise<ProcessingResult> {
  let processedCount = 0;
  let failedCount = 0;
  let alertsTriggered = 0;
  const devicesUpdated = new Set<string>();

  console.log(`Processing ${deviceData.messages.length} NMEA messages`);

  for (const message of deviceData.messages) {
    try {
      // Parse the NMEA message
      const parsedData = parseNMEAMessage(message);
      if (!parsedData) {
        failedCount++;
        continue;
      }

      // Find or create device record
      const deviceId = await ensureDevice(deviceData, message);
      if (deviceId) {
        devicesUpdated.add(deviceId);
      }

      // Store sensor data and check alerts
      const { data, error } = await supabase.rpc('process_nmea_message', {
        p_yacht_id: deviceData.yacht_id,
        p_device_id: deviceId,
        p_pgn: message.pgn,
        p_source_address: message.source,
        p_raw_data: message.data,
        p_parsed_data: parsedData
      });

      if (error) {
        console.error(`Failed to process message PGN ${message.pgn}:`, error);
        failedCount++;
      } else {
        processedCount++;
        // Check if any alerts were triggered (this would be returned by the function)
        // For now, we'll count successful processing
      }

    } catch (error) {
      console.error(`Error processing message PGN ${message.pgn}:`, error);
      failedCount++;
    }
  }

  return {
    processed_count: processedCount,
    failed_count: failedCount,
    alerts_triggered: alertsTriggered,
    devices_updated: devicesUpdated.size,
    processing_time_ms: 0
  };
}

function parseNMEAMessage(message: NMEAMessage): ParsedSensorData | null {
  const mapping = PGN_MAPPINGS[message.pgn];
  if (!mapping) {
    console.warn(`Unknown PGN: ${message.pgn}`);
    return null;
  }

  try {
    return mapping.parser(message.data);
  } catch (error) {
    console.error(`Failed to parse PGN ${message.pgn}:`, error);
    return null;
  }
}

// NMEA 2000 message parsers
function parseEngineRapid(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    engine_speed: view.getUint16(0, true), // RPM
    engine_load: view.getUint8(2), // Percentage
    engine_trim: view.getInt8(3) // Degrees
  };
}

function parseEngineDynamic(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    oil_pressure: view.getUint16(0, true) / 100, // kPa
    oil_temperature: view.getUint16(2, true) / 100 - 273.15, // Celsius
    coolant_temperature: view.getUint16(4, true) / 100 - 273.15, // Celsius
    alternator_voltage: view.getUint16(6, true) / 100 // Volts
  };
}

function parseFluidLevel(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    fluid_type: view.getUint8(0), // 0=Fuel, 1=Water, 2=Gray water, etc.
    fluid_level: view.getUint16(1, true) / 100, // Percentage
    fluid_capacity: view.getUint32(3, true) / 10000 // Liters
  };
}

function parseWaterSpeed(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    speed_water_referenced: view.getUint16(0, true) / 100, // m/s
    ground_reference: view.getUint8(2) === 1 // Boolean
  };
}

function parseWaterDepth(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    depth: view.getUint32(0, true) / 100, // meters
    depth_offset: view.getInt16(4, true) / 100 // meters
  };
}

function parsePositionRapid(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    latitude: view.getInt32(0, true) / 10000000, // degrees
    longitude: view.getInt32(4, true) / 10000000 // degrees
  };
}

function parseCogSogRapid(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    course_over_ground: view.getUint16(0, true) / 10000, // radians -> degrees
    speed_over_ground: view.getUint16(2, true) / 100 // m/s
  };
}

function parseWindData(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    wind_speed: view.getUint16(0, true) / 100, // m/s
    wind_direction: view.getUint16(2, true) / 10000, // radians -> degrees
    wind_reference: view.getUint8(4) // 0=True, 1=Magnetic, 2=Apparent
  };
}

function parseVesselHeading(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    heading: view.getUint16(0, true) / 10000, // radians -> degrees
    deviation: view.getInt16(2, true) / 10000, // radians -> degrees
    variation: view.getInt16(4, true) / 10000 // radians -> degrees
  };
}

function parseDistanceLog(data: Uint8Array): ParsedSensorData {
  const view = new DataView(data.buffer);
  return {
    distance_log: view.getUint32(0, true), // meters
    distance_trip: view.getUint32(4, true) // meters
  };
}

async function ensureDevice(deviceData: DeviceData, message: NMEAMessage): Promise<string | null> {
  try {
    // Check if device exists
    const { data: existingDevice } = await supabase
      .from('nmea_devices')
      .select('id')
      .eq('yacht_id', deviceData.yacht_id)
      .eq('can_address', message.source)
      .single();

    if (existingDevice) {
      return existingDevice.id;
    }

    // Create new device
    const deviceType = inferDeviceType(message.pgn);
    const deviceName = deviceData.device_name || `NMEA Device ${message.source}`;

    const { data: newDevice, error } = await supabase
      .from('nmea_devices')
      .insert({
        yacht_id: deviceData.yacht_id,
        device_name: deviceName,
        device_type: deviceType,
        can_address: message.source,
        pgn_codes: [message.pgn],
        last_seen_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create device:', error);
      return null;
    }

    console.log(`Created new NMEA device: ${deviceName} (${newDevice.id})`);
    return newDevice.id;

  } catch (error) {
    console.error('Device management error:', error);
    return null;
  }
}

function inferDeviceType(pgn: number): string {
  // Map PGNs to device types
  const pgnToDeviceType = {
    127488: 'engine', // Engine Parameters, Rapid Update
    127489: 'engine', // Engine Parameters, Dynamic
    127505: 'fuel', // Fluid Level
    128259: 'navigation', // Speed
    128267: 'navigation', // Water Depth
    129025: 'navigation', // Position
    129026: 'navigation', // COG & SOG
    130306: 'environmental', // Wind Data
    127250: 'navigation', // Vessel Heading
    128275: 'navigation' // Distance Log
  };

  return pgnToDeviceType[pgn] || 'general';
}

async function updateDeviceHealth(deviceData: DeviceData): Promise<void> {
  try {
    const uniqueSources = [...new Set(deviceData.messages.map(m => m.source))];
    
    for (const source of uniqueSources) {
      const deviceMessages = deviceData.messages.filter(m => m.source === source);
      const frequency = deviceMessages.length; // Messages per batch
      
      // Calculate health score based on message frequency and quality
      const healthScore = Math.min(100, Math.max(0, frequency * 10));
      
      await supabase
        .from('device_health_status')
        .upsert({
          yacht_id: deviceData.yacht_id,
          device_id: null, // Will be set by trigger
          status: 'online',
          last_data_received: new Date().toISOString(),
          data_frequency_hz: frequency,
          health_score: healthScore,
          diagnostic_data: {
            last_batch_size: deviceMessages.length,
            unique_pgns: [...new Set(deviceMessages.map(m => m.pgn))],
            processing_timestamp: new Date().toISOString()
          }
        }, {
          onConflict: 'device_id'
        });
    }
  } catch (error) {
    console.error('Failed to update device health:', error);
  }
}

async function checkAnomalies(yachtId: string): Promise<void> {
  try {
    // Simple anomaly detection - check for rapid changes in critical parameters
    const criticalParams = ['engine_speed', 'oil_pressure', 'coolant_temperature'];
    
    for (const param of criticalParams) {
      const { data: recentData } = await supabase
        .from('nmea_sensor_data')
        .select('parsed_data, timestamp')
        .eq('yacht_id', yachtId)
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('timestamp', { ascending: false })
        .limit(10);

      if (recentData && recentData.length > 2) {
        const values = recentData
          .map(d => d.parsed_data[param])
          .filter(v => v !== undefined && v !== null)
          .map(v => parseFloat(v));

        if (values.length > 2) {
          const variance = calculateVariance(values);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          
          // If variance is unusually high, it might indicate an anomaly
          if (variance > mean * 0.5) { // 50% of mean as threshold
            console.warn(`Anomaly detected in ${param}: high variance ${variance.toFixed(2)} (mean: ${mean.toFixed(2)})`);
            
            // This could trigger alerts or further analysis
            await supabase.functions.invoke('anomaly-detector', {
              body: {
                yacht_id: yachtId,
                parameter: param,
                values: values,
                variance: variance,
                mean: mean,
                detection_time: new Date().toISOString()
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Anomaly detection error:', error);
  }
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

// Utility function to convert radians to degrees
function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Utility function to convert Kelvin to Celsius
function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15;
}