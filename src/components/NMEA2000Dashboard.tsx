import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Wifi, 
  WifiOff, 
  Zap,
  Gauge,
  Thermometer,
  Fuel,
  Navigation,
  Wind,
  Anchor,
  Engine,
  Database,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useNMEADevices,
  useSensorData,
  useSensorAlerts,
  useDeviceHealth,
  useAlertRules,
  useNMEASimulator,
  type NMEADevice,
  type SensorData,
  type SensorAlert,
  type DeviceHealth
} from '@/hooks/useNMEAData';

interface NMEA2000DashboardProps {
  yachtId: string;
  isDemo?: boolean;
}

const NMEA2000Dashboard: React.FC<NMEA2000DashboardProps> = ({ 
  yachtId, 
  isDemo = false 
}) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const { toast } = useToast();

  // NMEA data hooks
  const { devices, loading: devicesLoading, refetch: refetchDevices } = useNMEADevices(yachtId);
  const { sensorData, loading: dataLoading, isRealTime, startRealTime, stopRealTime } = useSensorData(
    yachtId, 
    selectedDevice || undefined
  );
  const { alerts, unreadCount, acknowledgeAlert, resolveAlert } = useSensorAlerts(yachtId);
  const { deviceHealth, healthSummary } = useDeviceHealth(yachtId);
  const { rules: alertRules } = useAlertRules(yachtId);
  const { isSimulating, simulationStats, startSimulation, stopSimulation } = useNMEASimulator(yachtId);

  useEffect(() => {
    if (realTimeEnabled && !isRealTime) {
      startRealTime();
    } else if (!realTimeEnabled && isRealTime) {
      stopRealTime();
    }
  }, [realTimeEnabled, isRealTime, startRealTime, stopRealTime]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'engine': return Engine;
      case 'navigation': return Navigation;
      case 'environmental': return Wind;
      case 'fuel': return Fuel;
      case 'electrical': return Zap;
      default: return Activity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'bg-red-600';
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'error': return 'text-red-600';
      case 'maintenance': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const formatSensorValue = (key: string, value: any): string => {
    if (typeof value !== 'number') return String(value);
    
    // Format based on parameter type
    const formatters: Record<string, (v: number) => string> = {
      engine_speed: (v) => `${v.toFixed(0)} RPM`,
      oil_pressure: (v) => `${v.toFixed(1)} kPa`,
      coolant_temperature: (v) => `${v.toFixed(1)}°C`,
      oil_temperature: (v) => `${v.toFixed(1)}°C`,
      alternator_voltage: (v) => `${v.toFixed(1)}V`,
      fluid_level: (v) => `${v.toFixed(0)}%`,
      speed_water_referenced: (v) => `${(v * 1.944).toFixed(1)} knots`, // m/s to knots
      depth: (v) => `${v.toFixed(1)}m`,
      latitude: (v) => `${v.toFixed(6)}°`,
      longitude: (v) => `${v.toFixed(6)}°`,
      wind_speed: (v) => `${(v * 1.944).toFixed(1)} knots`,
      wind_direction: (v) => `${v.toFixed(0)}°`,
      course_over_ground: (v) => `${v.toFixed(0)}°`,
      speed_over_ground: (v) => `${(v * 1.944).toFixed(1)} knots`,
      heading: (v) => `${v.toFixed(0)}°`
    };
    
    return formatters[key] ? formatters[key](value) : value.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">NMEA 2000 Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time yacht sensor data and device management
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="realtime-toggle" className="text-sm font-medium">
              Real-time
            </label>
            <Switch
              id="realtime-toggle"
              checked={realTimeEnabled}
              onCheckedChange={setRealTimeEnabled}
            />
          </div>
          {isDemo && (
            <Button
              variant={isSimulating ? "destructive" : "secondary"}
              onClick={isSimulating ? stopSimulation : startSimulation}
              className="gap-2"
            >
              {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isSimulating ? 'Stop' : 'Start'} Simulation
            </Button>
          )}
          <Button variant="outline" onClick={refetchDevices} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
              <p className="text-2xl font-bold">{devices.length}</p>
            </div>
            <Database className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Online Devices</p>
              <p className="text-2xl font-bold text-green-600">{healthSummary.online}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Health</p>
              <p className="text-2xl font-bold">{healthSummary.avgHealth.toFixed(0)}%</p>
            </div>
            <Activity className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Simulation Stats (Demo Mode) */}
      {isDemo && isSimulating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Simulation Active
            </CardTitle>
            <CardDescription>
              Real-time NMEA 2000 data simulation for demonstration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Messages Generated</p>
                <p className="text-lg font-semibold">{simulationStats.messagesGenerated}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Devices Simulated</p>
                <p className="text-lg font-semibold">{simulationStats.devicesSimulated}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <p className="text-lg font-semibold">
                  {simulationStats.lastUpdate ? 
                    simulationStats.lastUpdate.toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard */}
      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sensors">Sensor Data</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NMEA 2000 Devices</CardTitle>
              <CardDescription>
                Manage and monitor yacht sensor devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devicesLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {devices.map((device) => {
                    const Icon = getDeviceIcon(device.device_type);
                    const health = deviceHealth.find(h => h.device_id === device.id);
                    
                    return (
                      <Card 
                        key={device.id}
                        className={`cursor-pointer transition-colors ${
                          selectedDevice === device.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedDevice(
                          selectedDevice === device.id ? null : device.id
                        )}
                      >
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <Icon className="h-6 w-6" />
                            <div>
                              <p className="font-medium">{device.device_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {device.device_type} • CAN Address: {device.can_address}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={health?.status === 'online' ? 'default' : 'secondary'}
                              className={health?.status === 'online' ? 'bg-green-500' : ''}
                            >
                              {health?.status || 'unknown'}
                            </Badge>
                            {health?.status === 'online' ? (
                              <Wifi className="h-4 w-4 text-green-500" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {devices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No NMEA devices found. Connect devices to start monitoring.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sensor Data Tab */}
        <TabsContent value="sensors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Sensor Data
                {isRealTime && (
                  <Badge variant="outline" className="ml-2 animate-pulse">
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {selectedDevice ? 
                  `Data from ${devices.find(d => d.id === selectedDevice)?.device_name}` :
                  'All device sensor data'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {sensorData.slice(0, 10).map((data) => (
                    <Card key={data.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">PGN {data.pgn}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(data.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                          {Object.entries(data.parsed_data).map(([key, value]) => (
                            <div key={key} className="flex justify-between p-2 bg-muted rounded">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">
                                {formatSensorValue(key, value)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Signal Quality:
                          </span>
                          <Progress value={data.signal_quality} className="flex-1 h-2" />
                          <span className="text-xs">{data.signal_quality}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {sensorData.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No sensor data available. Check device connections.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sensor Alerts
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Monitor and manage sensor alerts and warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.slice(0, 20).map((alert) => (
                  <Alert key={alert.id} className={alert.is_resolved ? 'opacity-60' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                          {alert.parameter_name} - {alert.severity.toUpperCase()}
                          {!alert.is_acknowledged && (
                            <Badge variant="outline" className="ml-2">New</Badge>
                          )}
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {alert.alert_message}
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.created_at).toLocaleString()}
                          </div>
                        </AlertDescription>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!alert.is_acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {!alert.is_resolved && (
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
                
                {alerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No alerts found. All systems operating normally.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4">
            {deviceHealth.map((health) => {
              const device = devices.find(d => d.id === health.device_id);
              const Icon = device ? getDeviceIcon(device.device_type) : Activity;
              
              return (
                <Card key={health.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {device?.device_name || 'Unknown Device'}
                      <Badge className={getStatusColor(health.status)}>
                        {health.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Health Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={health.health_score} className="flex-1" />
                          <span className="text-sm font-medium">{health.health_score}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Data</p>
                        <p className="text-sm font-medium">
                          {health.last_data_received ? 
                            new Date(health.last_data_received).toLocaleTimeString() : 
                            'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <p className="text-sm font-medium">{health.uptime_hours.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Errors (24h)</p>
                        <p className="text-sm font-medium">{health.error_count_24h}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                NMEA 2000 Configuration
              </CardTitle>
              <CardDescription>
                System settings and alert rule management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Alert Rules</h4>
                  <div className="space-y-2">
                    {alertRules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{rule.rule_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.parameter_name} - {rule.condition_type}
                          </p>
                        </div>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">System Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Real-time Processing</p>
                      <p className="font-medium">{isRealTime ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data Retention</p>
                      <p className="font-medium">365 days</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NMEA2000Dashboard;