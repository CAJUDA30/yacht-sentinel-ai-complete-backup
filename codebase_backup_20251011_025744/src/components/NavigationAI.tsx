import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UniversalSmartScan from "@/components/UniversalSmartScan";
import { supabase } from "@/integrations/supabase/client";
import { Navigation, MapPin, Wind, Anchor, Fuel, TrendingUp, Zap, Route } from "lucide-react";
import { toast } from "sonner";

interface RouteOptimization {
  id: string;
  destination: string;
  distance: number;
  estimated_time: string;
  fuel_consumption: number;
  weather_conditions: string;
  ai_confidence: number;
  savings: {
    fuel: number;
    time: number;
    cost: number;
  };
}

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    wind_speed: number;
    wind_direction: string;
    wave_height: number;
    visibility: number;
  };
  forecast: Array<{
    time: string;
    weather: string;
    wind_speed: number;
    wave_height: number;
  }>;
}

const NavigationAI = () => {
  const [routes, setRoutes] = useState<RouteOptimization[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    loadNavigationData();
  }, []);

  const loadNavigationData = async () => {
    const mockRoutes: RouteOptimization[] = [
      {
        id: "1",
        destination: "Monaco to St. Tropez",
        distance: 45.2,
        estimated_time: "3h 15m",
        fuel_consumption: 120,
        weather_conditions: "Favorable",
        ai_confidence: 94,
        savings: {
          fuel: 15,
          time: 25,
          cost: 450
        }
      },
      {
        id: "2",
        destination: "St. Tropez to Portofino",
        distance: 158.7,
        estimated_time: "8h 45m",
        fuel_consumption: 380,
        weather_conditions: "Moderate",
        ai_confidence: 87,
        savings: {
          fuel: 22,
          time: 35,
          cost: 820
        }
      }
    ];

    const mockWeather: WeatherData = {
      location: "Monaco",
      current: {
        temperature: 24,
        wind_speed: 12,
        wind_direction: "NW",
        wave_height: 1.2,
        visibility: 10
      },
      forecast: [
        { time: "12:00", weather: "Sunny", wind_speed: 10, wave_height: 1.0 },
        { time: "15:00", weather: "Partly Cloudy", wind_speed: 15, wave_height: 1.5 },
        { time: "18:00", weather: "Clear", wind_speed: 8, wave_height: 0.8 }
      ]
    };

    setRoutes(mockRoutes);
    setWeather(mockWeather);
  };

  const optimizeRoute = async () => {
    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          type: 'text',
          content: 'Optimize navigation route considering weather, fuel efficiency, and time',
          context: 'navigation_optimization',
          module: 'navigation'
        }
      });

      if (error) throw error;

      toast.success("Route optimized using AI weather and traffic analysis");
      await loadNavigationData();
    } catch (error) {
      console.error('Route optimization error:', error);
      toast.error("Failed to optimize route");
    } finally {
      setIsOptimizing(false);
    }
  };

  const getWeatherConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'favorable': return 'default';
      case 'moderate': return 'secondary';
      case 'poor': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Navigation</h1>
          <p className="text-muted-foreground">AI-powered route optimization, weather analysis, and fuel efficiency</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsScanning(true)}
            variant="outline"
          >
            <Zap className="mr-2 h-4 w-4" />
            Smart Scan
          </Button>
          <Button 
            onClick={optimizeRoute}
            disabled={isOptimizing}
          >
            <Route className="mr-2 h-4 w-4" />
            {isOptimizing ? "Optimizing..." : "AI Optimize"}
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="routes">AI Routes</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
                <Navigation className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routes.length}</div>
                <p className="text-xs text-muted-foreground">AI optimized</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fuel Savings</CardTitle>
                <Fuel className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {routes.reduce((acc, route) => acc + route.savings.fuel, 0)}%
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {routes.reduce((acc, route) => acc + route.savings.time, 0)}min
                </div>
                <p className="text-xs text-muted-foreground">Per route average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${routes.reduce((acc, route) => acc + route.savings.cost, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total saved</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Weather</CardTitle>
                <CardDescription>Real-time conditions at {weather?.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {weather && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Temperature</p>
                      <p className="text-2xl font-bold">{weather.current.temperature}°C</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Wind</p>
                      <p className="text-lg">{weather.current.wind_speed} kts {weather.current.wind_direction}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Wave Height</p>
                      <p className="text-lg">{weather.current.wave_height}m</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Visibility</p>
                      <p className="text-lg">{weather.current.visibility} nm</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Route Insights</CardTitle>
                <CardDescription>Latest optimization recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Optimal Departure</p>
                    <p className="text-xs text-blue-600">Leave at 14:00 for best weather window and fuel efficiency</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Route Adjustment</p>
                    <p className="text-xs text-green-600">Northern route saves 18% fuel due to favorable currents</p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Weather Alert</p>
                    <p className="text-xs text-yellow-600">Light wind expected after 18:00 - consider speed adjustment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          {routes.map((route) => (
            <Card key={route.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {route.destination}
                      <Badge variant={getWeatherConditionColor(route.weather_conditions) as any}>
                        {route.weather_conditions}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {route.distance} nm • {route.estimated_time} • {route.fuel_consumption}L fuel
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">AI Confidence</p>
                    <p className="text-lg font-semibold">{route.ai_confidence}%</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Fuel Saved</p>
                      <p className="text-lg font-bold text-green-600">{route.savings.fuel}%</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Time Saved</p>
                      <p className="text-lg font-bold text-blue-600">{route.savings.time}min</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-medium text-purple-800">Cost Saved</p>
                      <p className="text-lg font-bold text-purple-600">${route.savings.cost}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">AI Optimization Score</p>
                      <Progress value={route.ai_confidence} className="h-2 w-24" />
                    </div>
                    <Button size="sm">Select Route</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          {weather && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Conditions</CardTitle>
                  <CardDescription>{weather.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Wind className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Wind</p>
                          <p className="text-lg">{weather.current.wind_speed} kts {weather.current.wind_direction}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Wave Height</p>
                          <p className="text-lg">{weather.current.wave_height}m</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Temperature</p>
                        <p className="text-2xl font-bold">{weather.current.temperature}°C</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Visibility</p>
                        <p className="text-lg">{weather.current.visibility} nm</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forecast</CardTitle>
                  <CardDescription>Next 6 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weather.forecast.map((forecast, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{forecast.time}</p>
                          <p className="text-sm text-muted-foreground">{forecast.weather}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{forecast.wind_speed} kts</p>
                          <p className="text-sm text-muted-foreground">{forecast.wave_height}m waves</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Efficiency</CardTitle>
                <CardDescription>AI optimization performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Fuel Optimization</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Time Optimization</span>
                    <span className="text-sm font-medium">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Weather Integration</span>
                    <span className="text-sm font-medium">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings Summary</CardTitle>
                <CardDescription>Monthly AI optimization impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Fuel Saved</span>
                    <span className="text-lg font-semibold">1,245L</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Time Saved</span>
                    <span className="text-lg font-semibold">8.5 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Cost Saved</span>
                    <span className="text-lg font-semibold">$3,240</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">CO₂ Reduction</span>
                    <span className="text-lg font-semibold text-green-600">2.1 tons</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <UniversalSmartScan
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanComplete={(result) => {
          console.log('Navigation scan result:', result);
          toast.success("Navigation chart scan completed");
        }}
        module="navigation"
        context="navigation_optimization"
        scanType="document"
      />
    </div>
  );
};

export default NavigationAI;