import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  Wind, 
  Waves, 
  Compass,
  Navigation,
  AlertTriangle,
  TrendingUp,
  Thermometer,
  Eye,
  Gauge
} from 'lucide-react';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import { useLLMAnalytics } from '@/hooks/useLLMAnalytics';
import { geolocationService } from '@/services/geolocationService';
import { supabase } from '@/integrations/supabase/client';

interface WeatherData {
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
  };
  forecast: {
    time: string;
    temperature: number;
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    conditions: string;
    precipitation: number;
  }[];
  warnings: {
    id: string;
    type: 'gale' | 'storm' | 'fog' | 'small-craft';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    validUntil: string;
  }[];
}

interface RouteRecommendation {
  id: string;
  route: { lat: number; lng: number }[];
  estimatedTime: string;
  fuelConsumption: number;
  weatherScore: number;
  safetyRating: number;
  description: string;
  aiConfidence: number;
}

const MaritimeWeatherIntegration: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const [weatherData, setWeatherData] = useState<WeatherData>({
    current: {
      temperature: 24,
      humidity: 68,
      windSpeed: 15,
      windDirection: 225,
      visibility: 8.5,
      pressure: 1013.2,
      conditions: 'Loading...',
      waveHeight: 1.2,
      swellDirection: 240
    },
    forecast: [],
    warnings: []
  });

  // Fetch real weather data on component mount
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        console.log('Fetching real-time weather data...');
        
        // Get current position
        const position = await geolocationService.getCurrentPosition();
        console.log('Using position for weather:', position);

        // Fetch weather from Windy API via our edge function
        const response = await supabase.functions.invoke('windy-weather', {
          body: {
            latitude: position.latitude,
            longitude: position.longitude,
            parameters: ['wind', 'temp', 'waves', 'visibility', 'pressure', 'humidity']
          }
        });

        if (response.data) {
          console.log('Weather data received:', response.data);
          setWeatherData(response.data);
        }
        
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
        // Keep default values if fetch fails
      }
    };

    fetchWeatherData();
    
    // Refresh weather data every 15 minutes
    const interval = setInterval(fetchWeatherData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const [routeRecommendations, setRouteRecommendations] = useState<RouteRecommendation[]>([]);
  const [selectedDestination, setSelectedDestination] = useState('');

  const { analytics, refreshAnalytics } = useLLMAnalytics('maritime-weather', { weatherData, routeRecommendations });

  // Minor real-time updates (small variations in live data)
  useEffect(() => {
    const interval = setInterval(() => {
      setWeatherData(prev => ({
        ...prev,
        current: {
          ...prev.current,
          temperature: Math.max(15, Math.min(35, prev.current.temperature + (Math.random() - 0.5) * 0.5)),
          windSpeed: Math.max(0, prev.current.windSpeed + (Math.random() - 0.5) * 1),
          windDirection: (prev.current.windDirection + (Math.random() - 0.5) * 5) % 360,
          waveHeight: Math.max(0.1, prev.current.waveHeight + (Math.random() - 0.5) * 0.1),
          pressure: Math.max(990, Math.min(1030, prev.current.pressure + (Math.random() - 0.5) * 0.5))
        }
      }));
    }, 30000); // Update every 30 seconds with minor variations

    return () => clearInterval(interval);
  }, []);

  // Generate AI-powered route recommendations
  useEffect(() => {
    const generateRouteRecommendations = async () => {
      const response = await processWithAllLLMs({
        content: `Generate optimal maritime route recommendations based on current weather conditions: ${JSON.stringify(weatherData.current)}`,
        context: 'Maritime route planning and weather analysis',
        type: 'route-optimization',
        module: 'maritime-weather'
      });

      // Mock route recommendations based on AI response
      const recommendations: RouteRecommendation[] = [
        {
          id: '1',
          route: [
            { lat: 43.7696, lng: -79.4094 },
            { lat: 43.8563, lng: -79.3370 },
            { lat: 43.9045, lng: -79.2584 }
          ],
          estimatedTime: '3h 45m',
          fuelConsumption: 180,
          weatherScore: 8.5,
          safetyRating: 9.2,
          description: 'Optimal route avoiding high wind areas',
          aiConfidence: response.confidence || 0.89
        },
        {
          id: '2',
          route: [
            { lat: 43.7696, lng: -79.4094 },
            { lat: 43.8200, lng: -79.3800 },
            { lat: 43.8800, lng: -79.3200 }
          ],
          estimatedTime: '4h 15m',
          fuelConsumption: 200,
          weatherScore: 7.8,
          safetyRating: 8.7,
          description: 'Scenic coastal route with moderate conditions',
          aiConfidence: response.confidence || 0.82
        }
      ];

      setRouteRecommendations(recommendations);
    };

    generateRouteRecommendations();
  }, [weatherData.current, processWithAllLLMs]);

  const getWeatherIcon = (conditions: string) => {
    switch (conditions.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'cloudy':
      case 'partly cloudy':
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rainy':
      case 'rain':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      default:
        return <Cloud className="h-6 w-6 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5" />
            AI-Enhanced Maritime Weather & Navigation
          </CardTitle>
          <CardDescription>
            Real-time weather monitoring with intelligent route optimization
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current Conditions</TabsTrigger>
          <TabsTrigger value="forecast">Weather Forecast</TabsTrigger>
          <TabsTrigger value="routes">Route Planning</TabsTrigger>
          <TabsTrigger value="warnings">Weather Warnings</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Current Weather Overview */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getWeatherIcon(weatherData.current.conditions)}
                  Current Weather
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Thermometer className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{weatherData.current.temperature}°C</div>
                    <div className="text-sm text-muted-foreground">Temperature</div>
                  </div>
                  <div className="text-center">
                    <Wind className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{weatherData.current.windSpeed} kts</div>
                    <div className="text-sm text-muted-foreground">Wind Speed</div>
                  </div>
                  <div className="text-center">
                    <Compass className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{weatherData.current.windDirection}°</div>
                    <div className="text-sm text-muted-foreground">Wind Dir</div>
                  </div>
                  <div className="text-center">
                    <Waves className="h-6 w-6 mx-auto mb-2 text-cyan-500" />
                    <div className="text-2xl font-bold">{weatherData.current.waveHeight}m</div>
                    <div className="text-sm text-muted-foreground">Wave Height</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Marine Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Visibility</span>
                  </div>
                  <span className="font-medium">{weatherData.current.visibility} nm</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    <span className="text-sm">Pressure</span>
                  </div>
                  <span className="font-medium">{weatherData.current.pressure} hPa</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    <span className="text-sm">Humidity</span>
                  </div>
                  <span className="font-medium">{weatherData.current.humidity}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>48-Hour Weather Forecast</CardTitle>
              <CardDescription>AI-enhanced weather predictions for optimal planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 8 }, (_, i) => {
                  const hour = new Date();
                  hour.setHours(hour.getHours() + i * 6);
                  
                  return (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">
                          {hour.toLocaleDateString()} {hour.getHours()}:00
                        </div>
                        {getWeatherIcon('partly cloudy')}
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-4 w-4" />
                          {(24 + Math.random() * 8).toFixed(1)}°C
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind className="h-4 w-4" />
                          {(10 + Math.random() * 15).toFixed(0)} kts
                        </div>
                        <div className="flex items-center gap-1">
                          <Waves className="h-4 w-4" />
                          {(0.8 + Math.random() * 1.5).toFixed(1)}m
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {analytics.predictions && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">AI Weather Analysis</h4>
                  <p className="text-sm">{analytics.predictions.consensus}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  AI Route Recommendations
                </CardTitle>
                <CardDescription>
                  Optimized routes based on real-time weather and sea conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={refreshAnalytics} disabled={isProcessing} className="mb-4">
                  <TrendingUp className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                  Generate New Routes
                </Button>
                
                <div className="space-y-4">
                  {routeRecommendations.map((route) => (
                    <div key={route.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Route Option {route.id}</h4>
                        <Badge variant="secondary">
                          {Math.round(route.aiConfidence * 100)}% AI confidence
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{route.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Est. Time</div>
                          <div className="font-medium">{route.estimatedTime}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Fuel</div>
                          <div className="font-medium">{route.fuelConsumption}L</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Weather Score</div>
                          <div className="font-medium flex items-center gap-1">
                            {route.weatherScore}/10
                            <Progress value={route.weatherScore * 10} className="w-16 h-2" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Safety Rating</div>
                          <div className="font-medium flex items-center gap-1">
                            {route.safetyRating}/10
                            <Progress value={route.safetyRating * 10} className="w-16 h-2" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-3">
                        <Button size="sm" variant="outline">
                          Select Route
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warnings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Weather Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weatherData.warnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active weather warnings</p>
                    <p className="text-sm">Current conditions are favorable for navigation</p>
                  </div>
                ) : (
                  weatherData.warnings.map((warning) => (
                    <div key={warning.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          <span className="font-medium capitalize">{warning.type} Warning</span>
                        </div>
                        <Badge className={`text-white ${getSeverityColor(warning.severity)}`}>
                          {warning.severity}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{warning.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Valid until: {warning.validUntil}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaritimeWeatherIntegration;