import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Globe, 
  Map, 
  Satellite, 
  Ship,
  Cloud,
  Anchor,
  Waves,
  Wind,
  AlertTriangle,
  TrendingUp,
  Activity,
  BarChart3,
  Users,
  Clock,
  Zap,
  Target,
  Navigation,
  MapPin
} from 'lucide-react';

interface FleetData {
  totalVessels: number;
  activeVessels: number;
  globalPorts: number;
  dataPoints: number;
  networkUptime: number;
  predictiveAccuracy: number;
}

interface RegionalMetrics {
  region: string;
  vessels: number;
  ports: number;
  weatherEvents: number;
  trafficDensity: number;
  optimalRoutes: number;
}

interface WeatherEvent {
  id: string;
  type: 'storm' | 'wind' | 'fog' | 'calm';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  affectedVessels: number;
  duration: string;
  recommendation: string;
}

interface PortOptimization {
  id: string;
  portName: string;
  country: string;
  congestionLevel: number;
  waitTime: string;
  fuelCost: number;
  recommendation: string;
  efficiency: number;
}

export default function GlobalFleetIntelligence() {
  const [fleetData, setFleetData] = useState<FleetData | null>(null);
  const [regionalMetrics, setRegionalMetrics] = useState<RegionalMetrics[]>([]);
  const [weatherEvents, setWeatherEvents] = useState<WeatherEvent[]>([]);
  const [portOptimizations, setPortOptimizations] = useState<PortOptimization[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGlobalFleetData();
    loadRegionalMetrics();
    loadWeatherEvents();
    loadPortOptimizations();
  }, []);

  const loadGlobalFleetData = async () => {
    setIsLoading(true);
    try {
      // Mock global fleet data
      const mockData: FleetData = {
        totalVessels: 2847,
        activeVessels: 2683,
        globalPorts: 485,
        dataPoints: 1247568,
        networkUptime: 99.8,
        predictiveAccuracy: 94.7
      };

      setFleetData(mockData);
    } catch (error) {
      console.error('Failed to load global fleet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRegionalMetrics = async () => {
    try {
      // Mock regional metrics
      const mockRegions: RegionalMetrics[] = [
        {
          region: 'Mediterranean',
          vessels: 847,
          ports: 127,
          weatherEvents: 23,
          trafficDensity: 78,
          optimalRoutes: 156
        },
        {
          region: 'Caribbean',
          vessels: 623,
          ports: 89,
          weatherEvents: 45,
          trafficDensity: 65,
          optimalRoutes: 134
        },
        {
          region: 'Pacific',
          vessels: 1247,
          ports: 198,
          weatherEvents: 67,
          trafficDensity: 72,
          optimalRoutes: 289
        },
        {
          region: 'Atlantic',
          vessels: 456,
          ports: 71,
          weatherEvents: 34,
          trafficDensity: 54,
          optimalRoutes: 98
        }
      ];

      setRegionalMetrics(mockRegions);
    } catch (error) {
      console.error('Failed to load regional metrics:', error);
    }
  };

  const loadWeatherEvents = async () => {
    try {
      // Mock weather events
      const mockEvents: WeatherEvent[] = [
        {
          id: '1',
          type: 'storm',
          severity: 'high',
          location: 'North Atlantic (42.5°N, 41.2°W)',
          affectedVessels: 23,
          duration: '12-18 hours',
          recommendation: 'Reroute via southern passage, reduce speed'
        },
        {
          id: '2',
          type: 'wind',
          severity: 'medium',
          location: 'Mediterranean Sea (35.8°N, 14.5°E)',
          affectedVessels: 67,
          duration: '6-8 hours',
          recommendation: 'Adjust course by 15°, monitor fuel consumption'
        },
        {
          id: '3',
          type: 'fog',
          severity: 'low',
          location: 'English Channel (50.2°N, 1.4°W)',
          affectedVessels: 45,
          duration: '4-6 hours',
          recommendation: 'Reduce speed, increase radar monitoring'
        },
        {
          id: '4',
          type: 'calm',
          severity: 'low',
          location: 'Caribbean Sea (18.2°N, 66.5°W)',
          affectedVessels: 12,
          duration: '2-4 hours',
          recommendation: 'Optimal sailing conditions, maintain course'
        }
      ];

      setWeatherEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load weather events:', error);
    }
  };

  const loadPortOptimizations = async () => {
    try {
      // Mock port optimization data
      const mockPorts: PortOptimization[] = [
        {
          id: '1',
          portName: 'Port of Barcelona',
          country: 'Spain',
          congestionLevel: 23,
          waitTime: '2.5 hours',
          fuelCost: 0.89,
          recommendation: 'Optimal arrival window: 14:00-16:00',
          efficiency: 94
        },
        {
          id: '2',
          portName: 'Marina di Porto Cervo',
          country: 'Italy',
          congestionLevel: 67,
          waitTime: '5.2 hours',
          fuelCost: 1.15,
          recommendation: 'Consider alternative: Porto Rotondo',
          efficiency: 67
        },
        {
          id: '3',
          portName: 'Port Hercules',
          country: 'Monaco',
          congestionLevel: 89,
          waitTime: '8.7 hours',
          fuelCost: 1.45,
          recommendation: 'Delay arrival by 12 hours',
          efficiency: 45
        },
        {
          id: '4',
          portName: 'Port de Cannes',
          country: 'France',
          congestionLevel: 34,
          waitTime: '3.1 hours',
          fuelCost: 0.95,
          recommendation: 'Good conditions, proceed as planned',
          efficiency: 87
        }
      ];

      setPortOptimizations(mockPorts);
    } catch (error) {
      console.error('Failed to load port optimizations:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case 'storm':
        return <AlertTriangle className="w-4 h-4" />;
      case 'wind':
        return <Wind className="w-4 h-4" />;
      case 'fog':
        return <Cloud className="w-4 h-4" />;
      case 'calm':
        return <Waves className="w-4 h-4" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  const getCongestionColor = (level: number) => {
    if (level >= 80) return 'bg-red-100 text-red-800 border-red-200';
    if (level >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading global fleet intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Global Fleet Intelligence</h2>
          <p className="text-muted-foreground">Worldwide fleet coordination and intelligence sharing</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Globe className="w-4 h-4 mr-1" />
            {fleetData?.networkUptime}% Network Uptime
          </Badge>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global View</SelectItem>
              <SelectItem value="mediterranean">Mediterranean</SelectItem>
              <SelectItem value="caribbean">Caribbean</SelectItem>
              <SelectItem value="pacific">Pacific</SelectItem>
              <SelectItem value="atlantic">Atlantic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Ship className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Vessels</p>
                <p className="text-2xl font-bold">{fleetData?.totalVessels.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Vessels</p>
                <p className="text-2xl font-bold">{fleetData?.activeVessels.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Anchor className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Global Ports</p>
                <p className="text-2xl font-bold">{fleetData?.globalPorts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Data Points/Hour</p>
                <p className="text-2xl font-bold">{(fleetData?.dataPoints / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Satellite className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Network Uptime</p>
                <p className="text-2xl font-bold">{fleetData?.networkUptime}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Prediction Accuracy</p>
                <p className="text-2xl font-bold">{fleetData?.predictiveAccuracy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Fleet Overview</TabsTrigger>
          <TabsTrigger value="weather">Weather Intelligence</TabsTrigger>
          <TabsTrigger value="ports">Port Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Predictive Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional Fleet Distribution</CardTitle>
                <CardDescription>Vessel distribution across major maritime regions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {regionalMetrics.map((region) => (
                  <div key={region.region} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{region.region}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {region.vessels} vessels • {region.ports} ports
                      </div>
                    </div>
                    <Progress value={(region.vessels / 2847) * 100} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <span>Traffic: {region.trafficDensity}%</span>
                      <span>Weather Events: {region.weatherEvents}</span>
                      <span>Routes: {region.optimalRoutes}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Fleet Status</CardTitle>
                <CardDescription>Current operational status across the global fleet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">94.3%</div>
                    <div className="text-sm text-green-700">Operating Normally</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">4.2%</div>
                    <div className="text-sm text-yellow-700">Weather Delays</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">1.3%</div>
                    <div className="text-sm text-orange-700">Port Congestion</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">0.2%</div>
                    <div className="text-sm text-red-700">Emergency</div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">Network Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Global Coverage</span>
                      <span className="font-medium">99.8%</span>
                    </div>
                    <Progress value={99.8} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Data Synchronization</span>
                      <span className="font-medium">97.5%</span>
                    </div>
                    <Progress value={97.5} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Prediction Engine</span>
                      <span className="font-medium">94.7%</span>
                    </div>
                    <Progress value={94.7} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Weather Intelligence</CardTitle>
              <CardDescription>Real-time weather monitoring and predictive analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weatherEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                        {getWeatherIcon(event.type)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{event.type} System</div>
                        <div className="text-sm text-muted-foreground">{event.location}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <strong>Duration:</strong> {event.duration} • 
                          <strong> Affected Vessels:</strong> {event.affectedVessels}
                        </div>
                        <div className="text-sm mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <strong>Recommendation:</strong> {event.recommendation}
                        </div>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(event.severity)} variant="outline">
                      {event.severity} severity
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Port Optimization Intelligence</CardTitle>
              <CardDescription>Real-time port conditions and optimization recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {portOptimizations.map((port) => (
                  <div key={port.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <h3 className="font-medium">{port.portName}</h3>
                      </div>
                      <Badge className={getCongestionColor(port.congestionLevel)} variant="outline">
                        {port.congestionLevel}% congestion
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Country:</span>
                        <span className="font-medium">{port.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Wait Time:</span>
                        <span className="font-medium">{port.waitTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fuel Cost:</span>
                        <span className="font-medium">${port.fuelCost}/L</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Efficiency:</span>
                        <span className="font-medium">{port.efficiency}%</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-green-50 rounded border-l-4 border-green-400">
                      <div className="text-sm">
                        <strong>Recommendation:</strong> {port.recommendation}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Port Efficiency</span>
                        <span>{port.efficiency}%</span>
                      </div>
                      <Progress value={port.efficiency} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Intelligence Metrics</CardTitle>
                <CardDescription>AI-powered prediction accuracy and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Weather Prediction Accuracy</span>
                      <span className="font-medium">97.2%</span>
                    </div>
                    <Progress value={97.2} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Route Optimization Success</span>
                      <span className="font-medium">94.8%</span>
                    </div>
                    <Progress value={94.8} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Port Congestion Forecasting</span>
                      <span className="font-medium">89.5%</span>
                    </div>
                    <Progress value={89.5} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fuel Consumption Optimization</span>
                      <span className="font-medium">92.1%</span>
                    </div>
                    <Progress value={92.1} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Global Fleet Insights</CardTitle>
                <CardDescription>Key performance indicators and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">15.2%</div>
                    <div className="text-xs text-blue-700">Fuel Savings</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">23.7%</div>
                    <div className="text-xs text-green-700">Time Efficiency</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">89.3%</div>
                    <div className="text-xs text-purple-700">Route Optimization</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">94.8%</div>
                    <div className="text-xs text-orange-700">Safety Score</div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium text-sm">Recent AI Achievements</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Prevented 47 weather-related delays this week</li>
                    <li>• Optimized 1,247 routes for fuel efficiency</li>
                    <li>• Predicted port congestion with 94% accuracy</li>
                    <li>• Reduced average journey time by 18.5%</li>
                    <li>• Saved $2.3M in operational costs this month</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}