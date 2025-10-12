import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IoTData {
  deviceId: string;
  deviceType: 'engine' | 'navigation' | 'fuel' | 'electrical' | 'hvac' | 'safety';
  timestamp: string;
  location?: string;
  metrics: Record<string, any>;
  alerts?: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    code?: string;
  }>;
}

interface MaritimeAPI {
  weather: any;
  ports: any;
  regulations: any;
  traffic: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'iot-maritime-integration', time: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { type, data, location, deviceId } = await req.json();
    
    console.log(`IoT Integration request: ${type}`);

    let response;
    
    switch (type) {
      case 'iot-data':
        response = await processIoTData(data);
        break;
      case 'weather-data':
        response = await getWeatherData(location);
        break;
      case 'port-info':
        response = await getPortInformation(location);
        break;
      case 'maritime-regulations':
        response = await getMaritimeRegulations(location);
        break;
      case 'traffic-data':
        response = await getTrafficData(location);
        break;
      case 'device-status':
        response = await getDeviceStatus(deviceId);
        break;
      default:
        throw new Error('Invalid integration type');
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('IoT Integration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processIoTData(iotData: IoTData) {
  // Process and analyze IoT sensor data
  const analysis = {
    deviceId: iotData.deviceId,
    status: 'operational',
    efficiency: calculateEfficiency(iotData.metrics),
    predictions: generatePredictions(iotData),
    recommendations: generateRecommendations(iotData),
    alerts: processAlerts(iotData.alerts || []),
    timestamp: new Date().toISOString()
  };

  // Simulate data storage and real-time broadcasting
  console.log('IoT Data processed:', analysis);

  return {
    success: true,
    analysis,
    rawData: iotData
  };
}

async function getWeatherData(location: string) {
  try {
    // Simulate weather API call
    const weather = {
      location,
      current: {
        temperature: Math.floor(Math.random() * 10) + 20,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        waveHeight: Math.floor(Math.random() * 3) + 1,
        visibility: Math.floor(Math.random() * 5) + 10,
        barometricPressure: Math.floor(Math.random() * 50) + 1000,
        conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain'][Math.floor(Math.random() * 4)]
      },
      forecast: Array.from({ length: 5 }, (_, i) => ({
        day: i + 1,
        temperature: Math.floor(Math.random() * 10) + 18,
        conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain'][Math.floor(Math.random() * 4)],
        windSpeed: Math.floor(Math.random() * 25) + 5,
        waveHeight: Math.floor(Math.random() * 4) + 1
      })),
      alerts: generateWeatherAlerts(),
      lastUpdated: new Date().toISOString()
    };

    return weather;
  } catch (error) {
    throw new Error(`Weather data fetch failed: ${error.message}`);
  }
}

async function getPortInformation(location: string) {
  // Simulate port information API
  const portInfo = {
    name: `Port of ${location}`,
    coordinates: {
      latitude: 43.7384 + (Math.random() - 0.5) * 2,
      longitude: 7.4246 + (Math.random() - 0.5) * 2
    },
    facilities: {
      fuel: true,
      water: true,
      provisioning: true,
      maintenance: Math.random() > 0.3,
      customs: true,
      immigration: true
    },
    fees: {
      docking: Math.floor(Math.random() * 500) + 200,
      fuel: Math.floor(Math.random() * 50) + 150,
      water: Math.floor(Math.random() * 20) + 10
    },
    availability: {
      berths: Math.floor(Math.random() * 10) + 1,
      nextAvailable: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    contact: {
      harborMaster: `+${Math.floor(Math.random() * 900000000) + 100000000}`,
      email: `harbor@port${location.toLowerCase()}.com`
    },
    regulations: [
      'Valid documentation required',
      'Environmental compliance mandatory',
      'Speed limit: 5 knots in harbor'
    ]
  };

  return portInfo;
}

async function getMaritimeRegulations(location: string) {
  // Simulate maritime regulations API
  const regulations = {
    region: location,
    navigationRules: [
      'COLREGS (International Regulations for Preventing Collisions at Sea)',
      'Local traffic separation schemes must be followed',
      'AIS transponder required for vessels over 300 GT'
    ],
    environmentalRules: [
      'MARPOL Annex I - Oil pollution prevention',
      'MARPOL Annex V - Garbage disposal restrictions',
      'Ballast water management requirements'
    ],
    securityRequirements: [
      'ISPS Code compliance for commercial vessels',
      'Security alert system operational',
      'Crew identification documentation'
    ],
    customsRequirements: [
      'Valid vessel registration',
      'Crew list and passenger manifest',
      'Customs declaration for goods onboard'
    ],
    emergencyContacts: {
      coastGuard: '+33-196-70-20-13',
      harborAuthority: '+33-493-34-93-27',
      medicalEmergency: '15',
      fireEmergency: '18'
    },
    lastUpdated: new Date().toISOString()
  };

  return regulations;
}

async function getTrafficData(location: string) {
  // Simulate maritime traffic API
  const trafficData = {
    location,
    vessels: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, i) => ({
      id: `vessel_${i + 1}`,
      name: `MV ${['Atlantic', 'Pacific', 'Mediterranean', 'Baltic'][Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 1000)}`,
      type: ['Cargo', 'Tanker', 'Passenger', 'Yacht', 'Fishing'][Math.floor(Math.random() * 5)],
      position: {
        latitude: 43.7384 + (Math.random() - 0.5) * 0.5,
        longitude: 7.4246 + (Math.random() - 0.5) * 0.5
      },
      course: Math.floor(Math.random() * 360),
      speed: Math.floor(Math.random() * 20) + 5,
      destination: ['Monaco', 'Nice', 'Cannes', 'St. Tropez'][Math.floor(Math.random() * 4)],
      eta: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
    })),
    trafficDensity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    restrictions: [
      'Speed restriction in harbor approaches',
      'Large vessel traffic lane - stay clear'
    ],
    lastUpdated: new Date().toISOString()
  };

  return trafficData;
}

async function getDeviceStatus(deviceId: string) {
  // Simulate IoT device status check
  const deviceStatus = {
    deviceId,
    online: Math.random() > 0.1, // 90% uptime
    lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    batteryLevel: Math.floor(Math.random() * 100),
    signalStrength: Math.floor(Math.random() * 100),
    firmware: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    diagnostics: {
      temperature: Math.floor(Math.random() * 30) + 20,
      memory: Math.floor(Math.random() * 100),
      cpu: Math.floor(Math.random() * 100),
      network: Math.random() > 0.2 ? 'connected' : 'disconnected'
    },
    alerts: Math.random() > 0.8 ? [
      {
        level: 'warning' as const,
        message: 'Low battery level detected',
        code: 'BATT_LOW'
      }
    ] : []
  };

  return deviceStatus;
}

function calculateEfficiency(metrics: Record<string, any>): number {
  // Simple efficiency calculation based on metrics
  const values = Object.values(metrics).filter(v => typeof v === 'number');
  if (values.length === 0) return 85; // Default efficiency
  
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.min(100, Math.max(0, average));
}

function generatePredictions(iotData: IoTData): Array<{ type: string; prediction: string; confidence: number }> {
  const predictions = [];
  
  // Generate device-specific predictions
  switch (iotData.deviceType) {
    case 'engine':
      predictions.push({
        type: 'maintenance',
        prediction: 'Oil change recommended in 150 operating hours',
        confidence: 0.87
      });
      break;
    case 'fuel':
      predictions.push({
        type: 'consumption',
        prediction: 'Current consumption rate will require refueling in 18 hours',
        confidence: 0.92
      });
      break;
    case 'navigation':
      predictions.push({
        type: 'route',
        prediction: 'Weather conditions favor current route for next 12 hours',
        confidence: 0.78
      });
      break;
  }

  return predictions;
}

function generateRecommendations(iotData: IoTData): string[] {
  const recommendations = [
    'Schedule preventive maintenance based on usage patterns',
    'Optimize operational parameters for better efficiency',
    'Consider upgrading firmware for improved performance'
  ];

  return recommendations.slice(0, Math.floor(Math.random() * 3) + 1);
}

function processAlerts(alerts: Array<{ level: string; message: string; code?: string }>) {
  return alerts.map(alert => ({
    ...alert,
    timestamp: new Date().toISOString(),
    acknowledged: false
  }));
}

function generateWeatherAlerts(): Array<{ level: string; message: string }> {
  const alerts = [];
  
  if (Math.random() > 0.7) {
    alerts.push({
      level: 'warning',
      message: 'High winds expected in next 6 hours'
    });
  }
  
  if (Math.random() > 0.8) {
    alerts.push({
      level: 'info',
      message: 'Favorable conditions for next 24 hours'
    });
  }

  return alerts;
}