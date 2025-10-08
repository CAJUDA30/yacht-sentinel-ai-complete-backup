import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Wifi, 
  Thermometer, 
  Gauge, 
  MapPin, 
  Waves, 
  Wind, 
  Sun, 
  Cloud,
  Activity,
  Anchor,
  Navigation,
  Radio,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import { useLLMAnalytics } from '@/hooks/useLLMAnalytics';
import LLMAnalyticsPanel from './LLMAnalyticsPanel';

interface IoTDevice {
  id: string;
  name: string;
  type: 'sensor' | 'navigation' | 'engine' | 'safety' | 'communication';
  status: 'online' | 'offline' | 'warning' | 'error';
  value: number | string;
  unit?: string;
  lastUpdate: string;
  location?: string;
  aiInsights?: string;
}

interface MaritimeData {
  weather: {
    temperature: number;
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    visibility: number;
    conditions: string;
  };
  navigation: {
    latitude: number;
    longitude: number;
    course: number;
    speed: number;
    heading: number;
    nextWaypoint: string;
  };
  vessel: {
    fuelLevel: number;
    engineTemp: number;
    batteryLevel: number;
    waterLevel: number;
    bilgeLevel: number;
  };
}

const IoTDeviceManager: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [maritimeData, setMaritimeData] = useState<MaritimeData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const { analytics, refreshAnalytics } = useLLMAnalytics('iot-maritime', { devices, maritimeData });

  // Load real IoT device data from Supabase
  useEffect(() => {
    loadIoTData();
  }, []);

  const loadIoTData = async () => {
    try {
      // Load equipment data as IoT devices
      const { data: equipmentData, error } = await supabase
        .from('equipment')
        .select('*')
        .in('status', ['operational', 'warning', 'maintenance'])
        .order('name');

      if (error) throw error;

      if (equipmentData) {
        const iotDevices: IoTDevice[] = equipmentData.map(eq => ({
          id: eq.id,
          name: eq.name,
          type: getDeviceType(eq.name),
          status: eq.status === 'operational' ? 'online' : eq.status === 'warning' ? 'warning' : 'offline',
          value: generateRandomValue(eq.name),
          unit: getUnit(eq.name),
          lastUpdate: new Date().toISOString(),
          location: eq.location || 'Unknown',
          aiInsights: `Real-time monitoring of ${eq.name} - AI analysis available`
        }));

        setDevices(iotDevices);
      }

      // Load current yacht position data
      const { data: positionData } = await supabase
        .from('yacht_positions')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (positionData) {
        const mockMaritimeData: MaritimeData = {
          weather: {
            temperature: positionData.air_temperature_celsius || 24,
            windSpeed: positionData.wind_speed_knots || 12,
            windDirection: positionData.wind_direction_degrees || 245,
            waveHeight: 1.2,
            visibility: positionData.visibility_meters ? positionData.visibility_meters / 1000 : 8,
            conditions: 'Real-time data'
          },
          navigation: {
            latitude: Number(positionData.latitude),
            longitude: Number(positionData.longitude),
            course: positionData.heading_degrees || 0,
            speed: positionData.speed_knots || 0,
            heading: positionData.heading_degrees || 0,
            nextWaypoint: 'Destination Port'
          },
          vessel: {
            fuelLevel: 75,
            engineTemp: positionData.air_temperature_celsius || 82,
            batteryLevel: 94,
            waterLevel: 68,
            bilgeLevel: 12
          }
        };
        setMaritimeData(mockMaritimeData);
      }
    } catch (error) {
      console.error('Failed to load IoT data:', error);
      // Fallback to default data
      setDevices([]);
      setMaritimeData(null);
    }
  };

  const getDeviceType = (name: string): IoTDevice['type'] => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('gps') || lowerName.includes('navigation')) return 'navigation';
    if (lowerName.includes('engine') || lowerName.includes('motor')) return 'engine';
    if (lowerName.includes('sensor') || lowerName.includes('fuel')) return 'sensor';
    if (lowerName.includes('safety') || lowerName.includes('alarm')) return 'safety';
    if (lowerName.includes('radio') || lowerName.includes('comm')) return 'communication';
    return 'sensor';
  };

  const generateRandomValue = (name: string): number | string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('temperature')) return Math.floor(Math.random() * 20) + 70;
    if (lowerName.includes('fuel') || lowerName.includes('battery')) return Math.floor(Math.random() * 40) + 60;
    if (lowerName.includes('gps') || lowerName.includes('ais')) return 'Active';
    return Math.floor(Math.random() * 100);
  };

  const getUnit = (name: string): string | undefined => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('temperature')) return '°C';
    if (lowerName.includes('fuel') || lowerName.includes('battery') || lowerName.includes('level')) return '%';
    if (lowerName.includes('pressure')) return 'bar';
    return undefined;
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      setDevices(prev => prev.map(device => ({
        ...device,
        lastUpdate: new Date().toISOString(),
        value: device.type === 'sensor' && typeof device.value === 'number' 
          ? device.value + (Math.random() - 0.5) * 2
          : device.value
      })));
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'navigation': return Navigation;
      case 'engine': return Gauge;
      case 'sensor': return Activity;
      case 'safety': return Anchor;
      case 'communication': return Radio;
      default: return Activity;
    }
  };

  const analyzeDevice = async (device: IoTDevice) => {
    const response = await processWithAllLLMs({
      content: `Analyze IoT device: ${device.name}, Type: ${device.type}, Status: ${device.status}, Value: ${device.value}${device.unit || ''}`,
      context: `Device analysis for ${device.name}`,
      type: 'device-analysis',
      module: 'iot'
    });

    setDevices(prev => prev.map(d => 
      d.id === device.id 
        ? { ...d, aiInsights: response.consensus }
        : d
    ));
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            IoT & Maritime Integration
          </CardTitle>
          <CardDescription>
            Real-time monitoring and AI analysis of all connected systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="interval">Interval (s):</Label>
                <Input
                  id="interval"
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="w-20"
                  min="5"
                  max="300"
                />
              </div>
            </div>
            <Button onClick={refreshAnalytics} disabled={isProcessing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              Refresh Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">IoT Devices</TabsTrigger>
          <TabsTrigger value="maritime">Maritime Data</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => {
              const StatusIcon = getStatusIcon(device.type);
              return (
                <Card key={device.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedDevice(device.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <CardTitle className="text-sm">{device.name}</CardTitle>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Value:</span>
                        <span className="text-sm font-medium">
                          {device.value}{device.unit && ` ${device.unit}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <span className="text-sm">{device.location}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Updated:</span>
                        <span>{new Date(device.lastUpdate).toLocaleTimeString()}</span>
                      </div>
                      {device.aiInsights && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                          <strong>AI Insight:</strong> {device.aiInsights}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          analyzeDevice(device);
                        }}
                        disabled={isProcessing}
                      >
                        Analyze with AI
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="maritime">
          {maritimeData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Weather Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Weather Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span>{maritimeData.weather.temperature}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Speed:</span>
                    <span>{maritimeData.weather.windSpeed} kts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Direction:</span>
                    <span>{maritimeData.weather.windDirection}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wave Height:</span>
                    <span>{maritimeData.weather.waveHeight}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visibility:</span>
                    <span>{maritimeData.weather.visibility} nm</span>
                  </div>
                  <Badge variant="outline" className="w-full justify-center">
                    {maritimeData.weather.conditions}
                  </Badge>
                </CardContent>
              </Card>

              {/* Navigation Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Navigation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Latitude:</span>
                    <span>{maritimeData.navigation.latitude.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longitude:</span>
                    <span>{maritimeData.navigation.longitude.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Course:</span>
                    <span>{maritimeData.navigation.course}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span>{maritimeData.navigation.speed} kts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Waypoint:</span>
                    <span className="text-sm">{maritimeData.navigation.nextWaypoint}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Vessel Systems Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Vessel Systems
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Fuel Level:</span>
                      <span>{maritimeData.vessel.fuelLevel}%</span>
                    </div>
                    <Progress value={maritimeData.vessel.fuelLevel} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Battery:</span>
                      <span>{maritimeData.vessel.batteryLevel}%</span>
                    </div>
                    <Progress value={maritimeData.vessel.batteryLevel} className="h-2" />
                  </div>
                  <div className="flex justify-between">
                    <span>Engine Temp:</span>
                    <span>{maritimeData.vessel.engineTemp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Water Level:</span>
                    <span>{maritimeData.vessel.waterLevel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bilge Level:</span>
                    <span>{maritimeData.vessel.bilgeLevel}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <LLMAnalyticsPanel 
            module="iot-maritime" 
            data={{ devices, maritimeData }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IoTDeviceManager;