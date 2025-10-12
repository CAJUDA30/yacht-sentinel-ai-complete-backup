import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SafetyRequest {
  action: 'assess_location' | 'get_recommendations' | 'update_weather' | 'emergency_response' | 'route_safety' | 'equipment_check';
  yacht_id?: string;
  location?: {
    lat: number;
    lng: number;
  };
  destination?: {
    lat: number;
    lng: number;
  };
  emergency_type?: string;
  data?: any;
}

interface SafetyResponse {
  success: boolean;
  safety_score?: number;
  risk_level?: string;
  recommendations?: any[];
  emergency_contacts?: any[];
  weather_data?: any;
  nearest_harbors?: any[];
  route_analysis?: any;
  error?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Weather API configuration
const weatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SafetyRequest = await req.json();
    console.log(`⚓ Safety operation: ${request.action}`);

    let result: SafetyResponse;

    switch (request.action) {
      case 'assess_location':
        result = await assessLocationSafety(request);
        break;
      case 'get_recommendations':
        result = await getLocationRecommendations(request);
        break;
      case 'update_weather':
        result = await updateWeatherData(request);
        break;
      case 'emergency_response':
        result = await handleEmergencyResponse(request);
        break;
      case 'route_safety':
        result = await analyzeRouteSafety(request);
        break;
      case 'equipment_check':
        result = await checkSafetyEquipment(request);
        break;
      default:
        throw new Error(`Unsupported safety action: ${request.action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 Safety operation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Safety operation failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function assessLocationSafety(request: SafetyRequest): Promise<SafetyResponse> {
  const { yacht_id, location } = request;
  
  if (!location) {
    throw new Error('Location is required for safety assessment');
  }

  console.log(`🔍 Assessing safety for location: ${location.lat}, ${location.lng}`);

  const locationPoint = `POINT(${location.lng} ${location.lat})`;

  // Get current safety assessment
  const { data: safetyData, error: safetyError } = await supabase.rpc(
    'assess_current_safety_status',
    {
      p_yacht_id: yacht_id,
      p_current_location: locationPoint
    }
  );

  if (safetyError) {
    console.error('Safety assessment error:', safetyError);
  }

  // Get nearby safety zones
  const { data: nearbyZones, error: zonesError } = await supabase.rpc(
    'get_nearest_safety_zones',
    {
      vessel_location: locationPoint,
      zone_types: ['safe_harbor', 'marina', 'anchorage', 'emergency_services'],
      max_distance_km: 100
    }
  );

  if (zonesError) {
    console.error('Zones query error:', zonesError);
  }

  // Get current weather conditions
  const weatherData = await getCurrentWeather(location);

  // Get nearby hazards
  const { data: hazards } = await supabase
    .from('safety_zones')
    .select('*')
    .eq('zone_type', 'restricted_area')
    .or('zone_type.eq.shallow_water,zone_type.eq.reef_area,zone_type.eq.piracy_risk')
    .is('is_active', true);

  // Calculate enhanced safety score
  const enhancedAssessment = calculateEnhancedSafetyScore(
    safetyData,
    weatherData,
    nearbyZones || [],
    hazards || []
  );

  return {
    success: true,
    safety_score: enhancedAssessment.overall_score,
    risk_level: enhancedAssessment.risk_level,
    weather_data: weatherData,
    nearest_harbors: nearbyZones || [],
    recommendations: enhancedAssessment.recommendations
  };
}

async function getLocationRecommendations(request: SafetyRequest): Promise<SafetyResponse> {
  const { yacht_id, location } = request;

  if (!yacht_id || !location) {
    throw new Error('Yacht ID and location are required');
  }

  console.log(`📋 Getting recommendations for yacht ${yacht_id}`);

  // Get active recommendations
  const { data: activeRecs, error } = await supabase
    .from('location_recommendations')
    .select('*')
    .eq('yacht_id', yacht_id)
    .eq('recommendation_status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('priority_level', { ascending: false });

  if (error) {
    throw new Error(`Failed to get recommendations: ${error.message}`);
  }

  // Generate new recommendations if needed
  await generateSmartRecommendations(yacht_id, location);

  // Get emergency contacts for the area
  const { data: emergencyContacts } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('country', await getCountryFromLocation(location))
    .eq('is_active', true)
    .order('priority_level', { ascending: false });

  return {
    success: true,
    recommendations: activeRecs || [],
    emergency_contacts: emergencyContacts || []
  };
}

async function updateWeatherData(request: SafetyRequest): Promise<SafetyResponse> {
  const { location } = request;

  if (!location) {
    throw new Error('Location is required for weather update');
  }

  console.log(`🌤️ Updating weather data for ${location.lat}, ${location.lng}`);

  const weatherData = await fetchWeatherFromAPI(location);
  
  if (weatherData) {
    // Store weather data in database
    const { error } = await supabase
      .from('weather_conditions')
      .insert({
        location: `POINT(${location.lng} ${location.lat})`,
        observation_time: new Date().toISOString(),
        data_source: 'openweather',
        temperature_c: weatherData.temperature,
        wind_speed_kts: weatherData.wind_speed,
        wind_direction_deg: weatherData.wind_direction,
        wave_height_m: weatherData.wave_height,
        visibility_km: weatherData.visibility,
        safety_score: weatherData.safety_score,
        risk_level: weatherData.risk_level,
        weather_warnings: weatherData.warnings || []
      });

    if (error) {
      console.error('Failed to store weather data:', error);
    }
  }

  return {
    success: true,
    weather_data: weatherData
  };
}

async function handleEmergencyResponse(request: SafetyRequest): Promise<SafetyResponse> {
  const { yacht_id, location, emergency_type } = request;

  if (!yacht_id || !location || !emergency_type) {
    throw new Error('Yacht ID, location, and emergency type are required');
  }

  console.log(`🚨 Emergency response: ${emergency_type} for yacht ${yacht_id}`);

  // Get relevant emergency protocols
  const { data: protocols } = await supabase
    .from('safety_protocols')
    .select('*')
    .eq('protocol_type', emergency_type)
    .eq('is_active', true)
    .order('severity_level', { ascending: false });

  // Get nearest emergency services
  const locationPoint = `POINT(${location.lng} ${location.lat})`;
  const { data: emergencyServices } = await supabase.rpc(
    'get_nearest_safety_zones',
    {
      vessel_location: locationPoint,
      zone_types: ['emergency_services', 'coast_guard', 'medical'],
      max_distance_km: 200
    }
  );

  // Get emergency contacts
  const { data: emergencyContacts } = await supabase
    .from('emergency_contacts')
    .select('*')
    .in('contact_type', ['coast_guard', 'marine_rescue', 'medical'])
    .eq('is_active', true);

  // Create emergency recommendation
  const { error: recError } = await supabase
    .from('location_recommendations')
    .insert({
      yacht_id,
      current_location: locationPoint,
      recommendation_type: 'emergency_shelter',
      priority_level: 'urgent',
      recommendation_title: `Emergency Response: ${emergency_type}`,
      recommendation_description: 'Immediate emergency response activated',
      immediate_actions: ['Follow emergency protocols', 'Contact emergency services', 'Prepare for assistance'],
      recommended_locations: emergencyServices,
      time_sensitivity: 1, // 1 hour
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

  if (recError) {
    console.error('Failed to create emergency recommendation:', recError);
  }

  return {
    success: true,
    recommendations: protocols || [],
    emergency_contacts: emergencyContacts || [],
    nearest_harbors: emergencyServices || []
  };
}

async function analyzeRouteSafety(request: SafetyRequest): Promise<SafetyResponse> {
  const { yacht_id, location, destination } = request;

  if (!location || !destination) {
    throw new Error('Start and destination locations are required');
  }

  console.log(`🗺️ Analyzing route safety from ${location.lat},${location.lng} to ${destination.lat},${destination.lng}`);

  // Simple route analysis (in production, use proper routing service)
  const routeDistance = calculateDistance(location, destination);
  const routeBearing = calculateBearing(location, destination);

  // Check for hazards along the route
  const { data: routeHazards } = await supabase
    .from('safety_zones')
    .select('*')
    .in('zone_type', ['restricted_area', 'shallow_water', 'reef_area', 'piracy_risk'])
    .eq('is_active', true);

  // Get weather along the route
  const routeWeather = await getRouteWeather(location, destination);

  // Calculate route safety score
  let routeSafetyScore = 85; // Base score
  
  if (routeWeather?.risk_level === 'high') routeSafetyScore -= 20;
  if (routeWeather?.risk_level === 'extreme') routeSafetyScore -= 40;
  if (routeHazards && routeHazards.length > 0) routeSafetyScore -= (routeHazards.length * 5);

  const routeAnalysis = {
    distance_nm: routeDistance,
    bearing_deg: routeBearing,
    estimated_time_hours: routeDistance / 8, // Assuming 8 knots average
    safety_score: Math.max(routeSafetyScore, 0),
    risk_level: routeSafetyScore >= 70 ? 'low' : routeSafetyScore >= 50 ? 'moderate' : 'high',
    hazards_count: routeHazards?.length || 0,
    weather_conditions: routeWeather
  };

  return {
    success: true,
    route_analysis: routeAnalysis,
    recommendations: generateRouteRecommendations(routeAnalysis)
  };
}

async function checkSafetyEquipment(request: SafetyRequest): Promise<SafetyResponse> {
  const { yacht_id } = request;

  if (!yacht_id) {
    throw new Error('Yacht ID is required');
  }

  console.log(`🛟 Checking safety equipment for yacht ${yacht_id}`);

  const { data: equipment, error } = await supabase
    .from('safety_equipment')
    .select('*')
    .eq('yacht_id', yacht_id);

  if (error) {
    throw new Error(`Failed to get safety equipment: ${error.message}`);
  }

  const equipmentAnalysis = analyzeEquipmentStatus(equipment || []);

  return {
    success: true,
    safety_score: equipmentAnalysis.safety_score,
    recommendations: equipmentAnalysis.recommendations
  };
}

// Helper functions

async function getCurrentWeather(location: { lat: number; lng: number }) {
  if (!weatherApiKey) {
    console.warn('Weather API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${weatherApiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      temperature: data.main.temp,
      wind_speed: data.wind.speed * 1.944, // Convert m/s to knots
      wind_direction: data.wind.deg,
      visibility: data.visibility / 1000, // Convert m to km
      wave_height: null, // Would need marine weather API
      safety_score: calculateWeatherSafetyScore(data),
      risk_level: getWeatherRiskLevel(data),
      warnings: getWeatherWarnings(data)
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
}

function calculateEnhancedSafetyScore(safetyData: any, weatherData: any, nearbyZones: any[], hazards: any[]) {
  let score = safetyData?.overall_score || 50;
  const recommendations = [];

  // Weather impact
  if (weatherData?.risk_level === 'high') {
    score -= 15;
    recommendations.push('Monitor weather conditions closely');
  } else if (weatherData?.risk_level === 'extreme') {
    score -= 30;
    recommendations.push('Seek immediate shelter');
  }

  // Nearby safe harbors boost score
  const nearbyHarbors = nearbyZones.filter(z => ['safe_harbor', 'marina'].includes(z.zone_type));
  if (nearbyHarbors.length > 0) {
    score += 10;
    recommendations.push(`${nearbyHarbors.length} safe harbors within range`);
  }

  // Hazards reduce score
  if (hazards.length > 0) {
    score -= hazards.length * 5;
    recommendations.push('Navigate carefully - hazards in area');
  }

  return {
    overall_score: Math.max(Math.min(score, 100), 0),
    risk_level: score >= 80 ? 'low' : score >= 60 ? 'moderate' : score >= 40 ? 'high' : 'critical',
    recommendations
  };
}

async function generateSmartRecommendations(yachtId: string, location: { lat: number; lng: number }) {
  // This would implement AI-driven recommendation generation
  // For now, we'll create basic recommendations based on conditions
  
  const weatherData = await getCurrentWeather(location);
  
  if (weatherData?.risk_level === 'high' || weatherData?.risk_level === 'extreme') {
    await supabase.from('location_recommendations').insert({
      yacht_id: yachtId,
      current_location: `POINT(${location.lng} ${location.lat})`,
      recommendation_type: 'weather_routing',
      priority_level: 'warning',
      recommendation_title: 'Weather Advisory',
      recommendation_description: 'Severe weather conditions ahead',
      immediate_actions: ['Monitor weather updates', 'Consider alternative route', 'Prepare heavy weather gear'],
      time_sensitivity: 6,
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    });
  }
}

function calculateWeatherSafetyScore(weatherData: any): number {
  let score = 100;
  
  // Wind speed impact
  const windSpeedKnots = weatherData.wind?.speed * 1.944;
  if (windSpeedKnots > 25) score -= 30;
  else if (windSpeedKnots > 15) score -= 15;
  
  // Visibility impact
  const visibilityKm = weatherData.visibility / 1000;
  if (visibilityKm < 1) score -= 40;
  else if (visibilityKm < 5) score -= 20;
  
  // Precipitation impact
  if (weatherData.rain) score -= 10;
  if (weatherData.snow) score -= 20;
  
  return Math.max(score, 0);
}

function getWeatherRiskLevel(weatherData: any): string {
  const windSpeedKnots = weatherData.wind?.speed * 1.944;
  const visibilityKm = weatherData.visibility / 1000;
  
  if (windSpeedKnots > 35 || visibilityKm < 1) return 'extreme';
  if (windSpeedKnots > 25 || visibilityKm < 2) return 'high';
  if (windSpeedKnots > 15 || visibilityKm < 5) return 'moderate';
  return 'low';
}

function getWeatherWarnings(weatherData: any): string[] {
  const warnings = [];
  const windSpeedKnots = weatherData.wind?.speed * 1.944;
  
  if (windSpeedKnots > 25) warnings.push('Strong winds');
  if (weatherData.visibility < 2000) warnings.push('Poor visibility');
  if (weatherData.rain) warnings.push('Rain conditions');
  
  return warnings;
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 3440.065; // Nautical miles
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateBearing(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const lat1 = point1.lat * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

async function getRouteWeather(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  // Simplified - would normally check weather along entire route
  const midPoint = {
    lat: (start.lat + end.lat) / 2,
    lng: (start.lng + end.lng) / 2
  };
  
  return await getCurrentWeather(midPoint);
}

function generateRouteRecommendations(routeAnalysis: any): any[] {
  const recommendations = [];
  
  if (routeAnalysis.safety_score < 70) {
    recommendations.push({
      type: 'route_planning',
      priority: 'warning',
      title: 'Route Safety Concern',
      description: 'Consider alternative route or delay departure'
    });
  }
  
  if (routeAnalysis.hazards_count > 0) {
    recommendations.push({
      type: 'navigation_safety',
      priority: 'caution',
      title: 'Navigation Hazards',
      description: `${routeAnalysis.hazards_count} hazards along route`
    });
  }
  
  return recommendations;
}

function analyzeEquipmentStatus(equipment: any[]): { safety_score: number; recommendations: any[] } {
  let score = 100;
  const recommendations = [];
  
  const failed = equipment.filter(e => e.operational_status === 'failed').length;
  const expired = equipment.filter(e => e.operational_status === 'expired').length;
  const overdue = equipment.filter(e => new Date(e.next_inspection_due) < new Date()).length;
  
  score -= failed * 20;
  score -= expired * 10;
  score -= overdue * 5;
  
  if (failed > 0) {
    recommendations.push({
      type: 'equipment_replacement',
      priority: 'urgent',
      title: 'Failed Equipment',
      description: `${failed} safety equipment items have failed`
    });
  }
  
  if (expired > 0) {
    recommendations.push({
      type: 'equipment_renewal',
      priority: 'warning',
      title: 'Expired Equipment',
      description: `${expired} items need renewal`
    });
  }
  
  return {
    safety_score: Math.max(score, 0),
    recommendations
  };
}

async function getCountryFromLocation(location: { lat: number; lng: number }): Promise<string> {
  // Simplified - would normally use reverse geocoding
  // For now, return default based on rough location
  if (location.lat > 30 && location.lat < 50 && location.lng > -10 && location.lng < 30) {
    return 'France'; // Mediterranean region
  }
  return 'International';
}

async function fetchWeatherFromAPI(location: { lat: number; lng: number }) {
  return await getCurrentWeather(location);
}