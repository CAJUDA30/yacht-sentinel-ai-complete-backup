import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Cpu, 
  Thermometer, 
  Gauge, 
  Waves,
  Wind,
  Zap,
  Battery,
  Wifi,
  Satellite,
  Anchor,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Eye,
  Network,
  Database
} from 'lucide-react';

interface IoTSensor {
  id: string;
  name: string;
  type: 'temperature' | 'pressure' | 'motion' | 'water' | 'fuel' | 'battery' | 'navigation' | 'security';
  location: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  value: number;
  unit: string;
  batteryLevel: number;
  signalStrength: number;
  lastUpdate: string;
  threshold: {
    min: number;
    max: number;
  };
}

interface EdgeNode {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'updating';
  connectedSensors: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkLatency: number;
  uptime: number;
}

interface NetworkMetrics {
  totalSensors: number;
  activeSensors: number;
  edgeNodes: number;
  dataPointsPerHour: number;
  networkUptime: number;
  averageLatency: number;
}

export default function MaritimeIoTEcosystem() {
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [edgeNodes, setEdgeNodes] = useState<EdgeNode[]>([]);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(null);
  const [selectedSensorType, setSelectedSensorType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIoTData();
    loadEdgeNodes();
    loadNetworkMetrics();
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      loadIoTData();
      loadNetworkMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadIoTData = async () => {
    setIsLoading(true);
    try {
      // Fetch real IoT sensor data from database
      const { data: devicesData, error: devicesError } = await supabase
        .from('nmea_devices')
        .select(`
          id,
          device_name,
          device_type,
          location_description,
          is_active,
          created_at,
          device_health_status (
            status,
            battery_level,
            signal_strength,
            last_data_received,
            health_score
          )
        `)
        .eq('is_active', true)
        .order('device_name');

      if (devicesError) {
        console.error('Error fetching devices:', devicesError);
        return;
      }

      // Get latest sensor readings for each device
      const { data: sensorData, error: sensorError } = await supabase
        .from('nmea_sensor_data')
        .select('device_id, parsed_data, timestamp, signal_quality')
        .order('timestamp', { ascending: false });

      if (sensorError) {
        console.error('Error fetching sensor data:', sensorError);
        return;
      }

      // Transform database data to component format
      const transformedSensors: IoTSensor[] = (devicesData || []).map(device => {
        const latestReading = sensorData?.find(reading => reading.device_id === device.id);
        const healthStatus = device.device_health_status?.[0];
        
        // Extract sensor value and unit from parsed data
        let sensorValue = 0;
        let sensorUnit = '';
        if (latestReading?.parsed_data) {
          const parsedData = latestReading.parsed_data as any;
          if (parsedData.temperature !== undefined) {
            sensorValue = parsedData.temperature;
            sensorUnit = parsedData.unit || '°C';
          } else if (parsedData.pressure !== undefined) {
            sensorValue = parsedData.pressure;
            sensorUnit = parsedData.unit || 'PSI';
          } else if (parsedData.fuel_level !== undefined) {
            sensorValue = parsedData.fuel_level;
            sensorUnit = parsedData.unit || '%';
          } else if (parsedData.water_level !== undefined) {
            sensorValue = parsedData.water_level;
            sensorUnit = parsedData.unit || 'cm';
          } else if (parsedData.voltage !== undefined) {
            sensorValue = parsedData.voltage;
            sensorUnit = parsedData.unit || 'V';
          } else if (parsedData.satellites !== undefined) {
            sensorValue = parsedData.satellites;
            sensorUnit = parsedData.unit || 'satellites';
          } else if (parsedData.motion_events !== undefined) {
            sensorValue = parsedData.motion_events;
            sensorUnit = parsedData.unit || 'events';
          }
        }

        // Map device type to sensor type
        const getSensorType = (deviceType: string): IoTSensor['type'] => {
          switch (deviceType) {
            case 'engine': case 'hvac': return 'temperature';
            case 'propulsion': return 'pressure';
            case 'fuel': return 'fuel';
            case 'water': return 'water';
            case 'electrical': return 'battery';
            case 'navigation': return 'navigation';
            case 'security': return 'security';
            default: return 'temperature';
          }
        };

        // Set appropriate thresholds based on sensor type
        const getThresholds = (type: IoTSensor['type']) => {
          switch (type) {
            case 'temperature': return { min: 18, max: 90 };
            case 'pressure': return { min: 100, max: 200 };
            case 'fuel': return { min: 10, max: 100 };
            case 'water': return { min: 0, max: 5 };
            case 'battery': return { min: 22, max: 26 };
            case 'navigation': return { min: 4, max: 24 };
            case 'security': return { min: 0, max: 10 };
            default: return { min: 0, max: 100 };
          }
        };

        const sensorType = getSensorType(device.device_type);
        const deviceStatus = healthStatus?.status === 'maintenance' ? 'maintenance' : 
                           healthStatus?.status === 'offline' ? 'inactive' :
                           healthStatus?.status === 'error' ? 'error' : 'active';

        return {
          id: device.id,
          name: device.device_name,
          type: sensorType,
          location: device.location_description || 'Unknown',
          status: deviceStatus,
          value: sensorValue,
          unit: sensorUnit,
          batteryLevel: healthStatus?.battery_level || 0,
          signalStrength: healthStatus?.signal_strength || latestReading?.signal_quality || 0,
          lastUpdate: latestReading?.timestamp || device.created_at,
          threshold: getThresholds(sensorType)
        };
      });

      setSensors(transformedSensors);
    } catch (error) {
      console.error('Failed to load IoT sensor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEdgeNodes = async () => {
    try {
      // Fetch edge nodes data from system configuration
      const { data: configData, error: configError } = await supabase
        .from('nmea_system_config')
        .select('integration_settings')
        .limit(1)
        .single();

      if (configError) {
        console.error('Error fetching edge nodes config:', configError);
        return;
      }

      if (configData?.integration_settings?.edge_nodes) {
        const edgeNodesData = configData.integration_settings.edge_nodes as EdgeNode[];
        setEdgeNodes(edgeNodesData);
      } else {
        // Fallback to empty array if no edge nodes configured
        setEdgeNodes([]);
      }
    } catch (error) {
      console.error('Failed to load edge nodes:', error);
    }
  };

  const loadNetworkMetrics = async () => {
    try {
      // Get total sensor count
      const { count: totalSensors } = await supabase
        .from('nmea_devices')
        .select('*', { count: 'exact', head: true });

      // Get active sensor count
      const { count: activeSensors } = await supabase
        .from('nmea_devices')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get edge nodes count from configuration
      const { data: configData } = await supabase
        .from('nmea_system_config')
        .select('integration_settings')
        .limit(1)
        .single();

      const edgeNodesCount = configData?.integration_settings?.edge_nodes?.length || 0;

      // Calculate data points per hour from recent sensor data
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentDataPoints } = await supabase
        .from('nmea_sensor_data')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', oneHourAgo);

      // Calculate average signal quality as network uptime proxy
      const { data: healthData } = await supabase
        .from('device_health_status')
        .select('health_score, signal_strength')
        .eq('status', 'online');

      const avgHealthScore = healthData?.length > 0 
        ? healthData.reduce((sum, device) => sum + (device.health_score || 0), 0) / healthData.length
        : 99.0;

      const avgLatency = healthData?.length > 0
        ? Math.round(healthData.reduce((sum, device) => sum + (100 - (device.signal_strength || 0)) / 10, 0) / healthData.length)
        : 16;

      const networkMetrics: NetworkMetrics = {
        totalSensors: totalSensors || 0,
        activeSensors: activeSensors || 0,
        edgeNodes: edgeNodesCount,
        dataPointsPerHour: recentDataPoints || 0,
        networkUptime: Math.round(avgHealthScore * 10) / 10,
        averageLatency: avgLatency
      };

      setNetworkMetrics(networkMetrics);
    } catch (error) {
      console.error('Failed to load network metrics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
      case 'updating':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'pressure':
        return <Gauge className="w-4 h-4" />;
      case 'motion':
        return <Activity className="w-4 h-4" />;
      case 'water':
        return <Waves className="w-4 h-4" />;
      case 'fuel':
        return <Zap className="w-4 h-4" />;
      case 'battery':
        return <Battery className="w-4 h-4" />;
      case 'navigation':
        return <Satellite className="w-4 h-4" />;
      case 'security':
        return <Eye className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  const getSignalIcon = (strength: number) => {
    if (strength >= 80) return <Wifi className="w-4 h-4 text-green-600" />;
    if (strength >= 60) return <Wifi className="w-4 h-4 text-yellow-600" />;
    if (strength >= 40) return <Wifi className="w-4 h-4 text-orange-600" />;
    return <Wifi className="w-4 h-4 text-red-600" />;
  };

  const toggleSensor = async (sensorId: string) => {
    try {
      // Find the current sensor state
      const currentSensor = sensors.find(s => s.id === sensorId);
      if (!currentSensor) return;

      const newStatus = currentSensor.status === 'active' ? 'inactive' : 'active';
      const newDeviceStatus = newStatus === 'active' ? 'online' : 'offline';

      // Update device status in database
      const { error } = await supabase
        .from('device_health_status')
        .update({ 
          status: newDeviceStatus,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', sensorId);

      if (error) {
        console.error('Error updating sensor status:', error);
        return;
      }

      // Also update the device active status
      await supabase
        .from('nmea_devices')
        .update({ 
          is_active: newStatus === 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', sensorId);

      // Update local state optimistically
      setSensors(prev => 
        prev.map(sensor => 
          sensor.id === sensorId 
            ? { ...sensor, status: newStatus }
            : sensor
        )
      );
    } catch (error) {
      console.error('Failed to toggle sensor:', error);
    }
  };

  const filteredSensors = selectedSensorType === 'all' 
    ? sensors 
    : sensors.filter(sensor => sensor.type === selectedSensorType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading IoT ecosystem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Maritime IoT Ecosystem</h2>
          <p className="text-muted-foreground">Next-generation IoT integration and sensor networks</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Network className="w-4 h-4 mr-1" />
            {networkMetrics?.activeSensors} Active Sensors
          </Badge>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-4 h-4 mr-1" />
            {networkMetrics?.networkUptime}% Uptime
          </Badge>
        </div>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Sensors</p>
                <p className="text-2xl font-bold">{networkMetrics?.totalSensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Sensors</p>
                <p className="text-2xl font-bold">{networkMetrics?.activeSensors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Edge Nodes</p>
                <p className="text-2xl font-bold">{networkMetrics?.edgeNodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Data Points/Hr</p>
                <p className="text-2xl font-bold">{(networkMetrics?.dataPointsPerHour / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Network Uptime</p>
                <p className="text-2xl font-bold">{networkMetrics?.networkUptime}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">{networkMetrics?.averageLatency}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sensors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sensors">Sensor Network</TabsTrigger>
          <TabsTrigger value="edge">Edge Computing</TabsTrigger>
          <TabsTrigger value="analytics">Real-time Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sensors" className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter by type:</span>
              <select 
                value={selectedSensorType}
                onChange={(e) => setSelectedSensorType(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">All Sensors</option>
                <option value="temperature">Temperature</option>
                <option value="pressure">Pressure</option>
                <option value="fuel">Fuel</option>
                <option value="water">Water</option>
                <option value="battery">Battery</option>
                <option value="navigation">Navigation</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSensors.map((sensor) => (
              <Card key={sensor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{sensor.name}</CardTitle>
                        <CardDescription>{sensor.location}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(sensor.status)} variant="outline">
                      {sensor.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {sensor.value.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">{sensor.unit}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Battery className="w-3 h-3" />
                          Battery
                        </span>
                        <span className="font-medium">{sensor.batteryLevel}%</span>
                      </div>
                      <Progress value={sensor.batteryLevel} className="h-1" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          {getSignalIcon(sensor.signalStrength)}
                          Signal
                        </span>
                        <span className="font-medium">{sensor.signalStrength}%</span>
                      </div>
                      <Progress value={sensor.signalStrength} className="h-1" />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <div>Range: {sensor.threshold.min} - {sensor.threshold.max} {sensor.unit}</div>
                    <div>Last update: {new Date(sensor.lastUpdate).toLocaleTimeString()}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Sensor Status</span>
                    <Switch
                      checked={sensor.status === 'active'}
                      onCheckedChange={() => toggleSensor(sensor.id)}
                      disabled={sensor.status === 'maintenance' || sensor.status === 'error'}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="edge" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {edgeNodes.map((node) => (
              <Card key={node.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{node.name}</CardTitle>
                        <CardDescription>{node.location}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(node.status)} variant="outline">
                      {node.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{node.connectedSensors}</div>
                      <div className="text-xs text-blue-700">Connected Sensors</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{node.uptime}%</div>
                      <div className="text-xs text-green-700">Uptime</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span className="font-medium">{node.cpuUsage}%</span>
                      </div>
                      <Progress value={node.cpuUsage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span className="font-medium">{node.memoryUsage}%</span>
                      </div>
                      <Progress value={node.memoryUsage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Storage Usage</span>
                        <span className="font-medium">{node.storageUsage}%</span>
                      </div>
                      <Progress value={node.storageUsage} className="h-2" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-sm">
                    <span className="text-muted-foreground">Network Latency</span>
                    <span className="font-medium">{node.networkLatency}ms</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Data Processing</CardTitle>
                <CardDescription>Live sensor data analytics and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">847K</div>
                    <div className="text-sm text-green-700">Data Points Today</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">15.2ms</div>
                    <div className="text-sm text-blue-700">Avg Processing Time</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Processing Pipeline</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Data Ingestion</span>
                      <span className="font-medium">98.7%</span>
                    </div>
                    <Progress value={98.7} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Real-time Analysis</span>
                      <span className="font-medium">96.4%</span>
                    </div>
                    <Progress value={96.4} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Anomaly Detection</span>
                      <span className="font-medium">94.1%</span>
                    </div>
                    <Progress value={94.1} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>AI-powered predictions and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                    <div className="font-medium text-blue-900">Maintenance Prediction</div>
                    <div className="text-sm text-blue-700">Engine oil change recommended in 47 hours</div>
                  </div>
                  <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
                    <div className="font-medium text-yellow-900">Performance Alert</div>
                    <div className="text-sm text-yellow-700">Fuel efficiency decreased by 8% over last week</div>
                  </div>
                  <div className="p-3 border-l-4 border-green-400 bg-green-50">
                    <div className="font-medium text-green-900">Optimization Opportunity</div>
                    <div className="text-sm text-green-700">Route adjustment could save 12% fuel consumption</div>
                  </div>
                  <div className="p-3 border-l-4 border-purple-400 bg-purple-50">
                    <div className="font-medium text-purple-900">System Health</div>
                    <div className="text-sm text-purple-700">All critical systems operating within normal parameters</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}