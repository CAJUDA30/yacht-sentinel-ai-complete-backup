import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ship, 
  MapPin, 
  Gauge, 
  Users, 
  Package, 
  Wrench, 
  AlertTriangle,
  Battery,
  Fuel,
  Compass,
  Activity,
  Zap,
  Camera,
  Mic,
  Bell,
  Wifi,
  Signal
} from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useOffline } from '@/contexts/OfflineContext';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  path: string;
  color: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemStatus {
  id: string;
  name: string;
  status: 'operational' | 'warning' | 'critical' | 'offline';
  value: number | string;
  unit?: string;
  lastUpdate: Date;
}

const MobileDashboard: React.FC = () => {
  const { formatLocationForDisplay, rawPosition } = useLocation();
  const { isConnected } = useRealtime();
  const { isOnline, pendingSync } = useOffline();
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<number>(0);

  const quickActions: QuickAction[] = [
    { id: '1', title: 'Smart Scan', icon: Camera, path: '/smart-scan', color: 'bg-blue-500', urgency: 'medium' },
    { id: '2', title: 'Voice Log', icon: Mic, path: '/voice-log', color: 'bg-green-500' },
    { id: '3', title: 'Emergency', icon: AlertTriangle, path: '/emergency', color: 'bg-red-500', urgency: 'critical' },
    { id: '4', title: 'Crew Check', icon: Users, path: '/crew', color: 'bg-purple-500' },
    { id: '5', title: 'Quick Inventory', icon: Package, path: '/inventory/quick', color: 'bg-orange-500' },
    { id: '6', title: 'Maintenance', icon: Wrench, path: '/maintenance', color: 'bg-yellow-500', urgency: 'high' },
  ];

  // Initialize system status
  useEffect(() => {
    const mockStatus: SystemStatus[] = [
      { id: '1', name: 'Fuel Level', status: 'operational', value: 78, unit: '%', lastUpdate: new Date() },
      { id: '2', name: 'Engine Temp', status: 'warning', value: 85, unit: '°C', lastUpdate: new Date() },
      { id: '3', name: 'Battery', status: 'operational', value: 94, unit: '%', lastUpdate: new Date() },
      { id: '4', name: 'Navigation', status: 'operational', value: 'Active', lastUpdate: new Date() },
      { id: '5', name: 'Communication', status: isConnected ? 'operational' : 'offline', value: isConnected ? 'Online' : 'Offline', lastUpdate: new Date() },
    ];
    setSystemStatus(mockStatus);
    setCriticalAlerts(mockStatus.filter(s => s.status === 'critical').length);
  }, [isConnected]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'operational': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      case 'offline': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Status Bar */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Yacht Status</h3>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{rawPosition ? formatLocationForDisplay() : 'Location Unknown'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </div>
              {pendingSync.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {pendingSync.length} sync
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <h4 className="font-semibold text-red-700">Critical Alerts</h4>
                <p className="text-sm text-red-600">{criticalAlerts} system(s) require immediate attention</p>
              </div>
              <Button size="sm" variant="destructive" className="ml-auto">
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card key={action.id} className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`p-3 rounded-full ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-sm">{action.title}</h4>
                        {action.urgency && action.urgency !== 'low' && (
                          <Badge 
                            variant={action.urgency === 'critical' ? 'destructive' : 'secondary'} 
                            className="text-xs mt-1"
                          >
                            {action.urgency}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="systems">
          <div className="space-y-3">
            {systemStatus.map((system) => (
              <Card key={system.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        system.status === 'operational' ? 'bg-green-500' :
                        system.status === 'warning' ? 'bg-yellow-500' :
                        system.status === 'critical' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-sm">{system.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Updated {system.lastUpdate.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getStatusColor(system.status)}`}>
                        {system.value}{system.unit}
                      </div>
                      <Badge variant={getStatusBadgeVariant(system.status) as any} className="text-xs">
                        {system.status}
                      </Badge>
                    </div>
                  </div>
                  {typeof system.value === 'number' && system.unit === '%' && (
                    <div className="mt-3">
                      <Progress 
                        value={system.value} 
                        className="h-2"
                        color={system.status === 'operational' ? 'green' : 
                               system.status === 'warning' ? 'yellow' : 'red'}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">System Check Completed</h4>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2m ago</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Crew Check-in</h4>
                    <p className="text-xs text-muted-foreground">All crew members accounted for</p>
                  </div>
                  <span className="text-xs text-muted-foreground">15m ago</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Wrench className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Maintenance Alert</h4>
                    <p className="text-xs text-muted-foreground">Engine service due in 5 hours</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1h ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileDashboard;