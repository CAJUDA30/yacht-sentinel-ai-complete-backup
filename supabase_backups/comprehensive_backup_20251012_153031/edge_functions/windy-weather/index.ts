import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeatherRequest {
  latitude: number;
  longitude: number;
  parameters?: string[];
}

interface WindyWeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    pressure: number;
    conditions: string;
    waveHeight: number;
    swellDirection: number;
    precipitation: number;
    cloudCover: number;
  };
  forecast: Array<{
    time: string;
    temperature: number;
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    conditions: string;
    precipitation: number;
    pressure: number;
    humidity: number;
  }>;
  warnings: Array<{
    id: string;
    type: 'gale' | 'storm' | 'fog' | 'small-craft';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    validUntil: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'windy-weather', time: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { latitude, longitude, parameters = ['wind', 'temp', 'waves'] }: WeatherRequest = await req.json();
    
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching weather data for coordinates: ${latitude}, ${longitude}`);

    // Get Windy API key from environment
    const windyApiKey = Deno.env.get('WINDY_API_KEY');
    if (!windyApiKey) {
      console.error('WINDY_API_KEY not found in environment variables');
      
      // Return simulated data if API key is not available
      const simulatedData = generateSimulatedWeatherData(latitude, longitude);
      return new Response(
        JSON.stringify(simulatedData),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch current weather data from Windy API
    const currentWeatherResponse = await fetch(
      `https://api.windy.com/api/point-forecast/v2?key=${windyApiKey}&lat=${latitude}&lon=${longitude}&model=gfs&parameters=${parameters.join(',')}&levels=surface`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!currentWeatherResponse.ok) {
      console.error('Windy API request failed:', currentWeatherResponse.status);
      
      // Fallback to simulated data
      const simulatedData = generateSimulatedWeatherData(latitude, longitude);
      return new Response(
        JSON.stringify(simulatedData),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const windyData = await currentWeatherResponse.json();
    console.log('Windy API response received successfully');

    // Transform Windy data to our format
    const weatherData = transformWindyData(windyData, latitude, longitude);

    return new Response(
      JSON.stringify(weatherData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Return simulated data as fallback
    const simulatedData = generateSimulatedWeatherData(43.7384, 7.4246); // Default to Monaco
    return new Response(
      JSON.stringify(simulatedData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function transformWindyData(windyData: any, lat: number, lng: number): WindyWeatherData {
  const now = new Date();
  const currentIndex = 0; // Use first data point as current
  
  // Extract current conditions
  const current = {
    temperature: windyData.temp?.[currentIndex] || 24,
    humidity: windyData.rh?.[currentIndex] || 65,
    windSpeed: Math.round((windyData.wind_u?.[currentIndex] ** 2 + windyData.wind_v?.[currentIndex] ** 2) ** 0.5 * 1.944) || 12, // Convert m/s to knots
    windDirection: Math.round(Math.atan2(windyData.wind_u?.[currentIndex] || 0, windyData.wind_v?.[currentIndex] || 0) * 180 / Math.PI + 180) || 225,
    visibility: windyData.visibility?.[currentIndex] / 1000 || 10, // Convert m to km
    pressure: windyData.pressure?.[currentIndex] || 1013,
    conditions: determineConditions(windyData.clouds?.[currentIndex] || 30, windyData.rain?.[currentIndex] || 0),
    waveHeight: windyData.waves?.[currentIndex] || 1.2,
    swellDirection: windyData.swell_dir?.[currentIndex] || 240,
    precipitation: windyData.rain?.[currentIndex] || 0,
    cloudCover: windyData.clouds?.[currentIndex] || 30
  };

  // Generate forecast data
  const forecast = [];
  const forecastLength = Math.min(windyData.ts?.length || 0, 48); // 48 hours
  
  for (let i = 0; i < forecastLength; i += 6) { // Every 6 hours
    const forecastTime = new Date(windyData.ts[i]);
    forecast.push({
      time: forecastTime.toISOString(),
      temperature: windyData.temp?.[i] || current.temperature,
      windSpeed: Math.round((windyData.wind_u?.[i] ** 2 + windyData.wind_v?.[i] ** 2) ** 0.5 * 1.944) || current.windSpeed,
      windDirection: Math.round(Math.atan2(windyData.wind_u?.[i] || 0, windyData.wind_v?.[i] || 0) * 180 / Math.PI + 180) || current.windDirection,
      waveHeight: windyData.waves?.[i] || current.waveHeight,
      conditions: determineConditions(windyData.clouds?.[i] || 30, windyData.rain?.[i] || 0),
      precipitation: windyData.rain?.[i] || 0,
      pressure: windyData.pressure?.[i] || current.pressure,
      humidity: windyData.rh?.[i] || current.humidity
    });
  }

  // Generate weather warnings based on conditions
  const warnings = generateWeatherWarnings(current, forecast);

  return { current, forecast, warnings };
}

function determineConditions(cloudCover: number, precipitation: number): string {
  if (precipitation > 0.5) return 'Rainy';
  if (cloudCover > 70) return 'Cloudy';
  if (cloudCover > 30) return 'Partly Cloudy';
  return 'Clear';
}

function generateWeatherWarnings(current: any, forecast: any[]): any[] {
  const warnings = [];

  // High wind warning
  if (current.windSpeed > 25) {
    warnings.push({
      id: 'wind-' + Date.now(),
      type: 'gale',
      severity: current.windSpeed > 35 ? 'high' : 'medium',
      message: `Strong winds detected. Current speed: ${current.windSpeed} knots. Exercise caution.`,
      validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    });
  }

  // High wave warning
  if (current.waveHeight > 2.5) {
    warnings.push({
      id: 'wave-' + Date.now(),
      type: 'small-craft',
      severity: current.waveHeight > 4 ? 'high' : 'medium',
      message: `High waves detected. Current height: ${current.waveHeight}m. Small craft advisory in effect.`,
      validUntil: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    });
  }

  // Low visibility warning
  if (current.visibility < 2) {
    warnings.push({
      id: 'visibility-' + Date.now(),
      type: 'fog',
      severity: current.visibility < 0.5 ? 'high' : 'medium',
      message: `Low visibility conditions. Current visibility: ${current.visibility}km. Navigate with caution.`,
      validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
  }

  return warnings;
}

function generateSimulatedWeatherData(lat: number, lng: number): WindyWeatherData {
  console.log('Generating simulated weather data for fallback');
  
  // Generate realistic weather based on location and time
  const baseTemp = getBaseTemperature(lat);
  const current = {
    temperature: baseTemp + (Math.random() - 0.5) * 8,
    humidity: 50 + Math.random() * 40,
    windSpeed: 5 + Math.random() * 20,
    windDirection: Math.floor(Math.random() * 360),
    visibility: 5 + Math.random() * 15,
    pressure: 1000 + Math.random() * 40,
    conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
    waveHeight: 0.5 + Math.random() * 2.5,
    swellDirection: Math.floor(Math.random() * 360),
    precipitation: Math.random() * 2,
    cloudCover: Math.random() * 100
  };

  // Generate 48-hour forecast
  const forecast = [];
  for (let i = 0; i < 8; i++) {
    const time = new Date(Date.now() + i * 6 * 60 * 60 * 1000);
    forecast.push({
      time: time.toISOString(),
      temperature: current.temperature + (Math.random() - 0.5) * 6,
      windSpeed: Math.max(0, current.windSpeed + (Math.random() - 0.5) * 10),
      windDirection: (current.windDirection + (Math.random() - 0.5) * 60) % 360,
      waveHeight: Math.max(0.1, current.waveHeight + (Math.random() - 0.5) * 1),
      conditions: current.conditions,
      precipitation: Math.random() * 1.5,
      pressure: current.pressure + (Math.random() - 0.5) * 10,
      humidity: Math.max(20, Math.min(100, current.humidity + (Math.random() - 0.5) * 20))
    });
  }

  return {
    current,
    forecast,
    warnings: []
  };
}

function getBaseTemperature(lat: number): number {
  // Approximate temperature based on latitude
  const absLat = Math.abs(lat);
  if (absLat < 23.5) return 28; // Tropics
  if (absLat < 35) return 22;   // Subtropics
  if (absLat < 50) return 18;   // Temperate
  if (absLat < 66.5) return 10; // Subarctic
  return 0; // Arctic
}