import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Bell,
  Battery,
  Wifi,
  Signal,
  MapPin,
  Thermometer,
  Gauge,
  Anchor,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Waves,
  Wind,
  Eye,
  Camera
} from 'lucide-react';

interface MobileWidget {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  status: 'normal' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'stable';
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  action: () => void;
}

const EnhancedMobileDashboard = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'limited'>('online');
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [notifications, setNotifications] = useState(3);

  const [widgets] = useState<MobileWidget[]>([
    {
      id: 'speed',
      title: 'Speed',
      value: 12.5,
      unit: 'kts',
      status: 'normal',
      icon: Gauge,
      trend: 'stable'
    },
    {
      id: 'depth',
      title: 'Depth',
      value: 15.2,
      unit: 'm',
      status: 'normal',
      icon: Waves,
      trend: 'stable'
    },
    {
      id: 'temp',
      title: 'Engine Temp',
      value: 82,
      unit: '°C',
      status: 'warning',
      icon: Thermometer,
      trend: 'up'
    },
    {
      id: 'fuel',
      title: 'Fuel Level',
      value: 65,
      unit: '%',
      status: 'normal',
      icon: Battery,
      trend: 'down'
    },
    {
      id: 'wind',
      title: 'Wind Speed',
      value: 8.3,
      unit: 'kts',
      status: 'normal',
      icon: Wind,
      trend: 'up'
    },
    {
      id: 'crew',
      title: 'Crew On Board',
      value: 6,
      unit: 'people',
      status: 'normal',
      icon: Users,
      trend: 'stable'
    }
  ]);

  const quickActions: QuickAction[] = [
    {
      id: 'anchor',
      label: 'Drop Anchor',
      icon: Anchor,
      variant: 'default',
      action: () => toast({ title: 'Anchor deployed', description: 'Anchor has been dropped successfully' })
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: AlertTriangle,
      variant: 'destructive',
      action: () => toast({ title: 'Emergency alert sent', description: 'Coast guard has been notified', variant: 'destructive' })
    },
    {
      id: 'camera',
      label: 'Scan QR',
      icon: Camera,
      variant: 'outline',
      action: () => toast({ title: 'Camera opened', description: 'Ready to scan QR codes' })
    },
    {
      id: 'location',
      label: 'Share Location',
      icon: MapPin,
      variant: 'secondary',
      action: () => toast({ title: 'Location shared', description: 'Current position sent to crew' })
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'hsl(var(--destructive))';
      case 'warning':
        return 'hsl(var(--warning))';
      default:
        return 'hsl(var(--primary))';
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      case 'down':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setNotifications(prev => prev + 1);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Status Bar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border/40 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Signal className="h-4 w-4" />
              <span className="text-xs font-medium">LTE</span>
            </div>
            <div className="flex items-center gap-1">
              <Wifi className="h-4 w-4" />
              <Badge variant={connectionStatus === 'online' ? 'default' : 'destructive'} className="text-xs">
                {connectionStatus}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0">
                  {notifications > 9 ? '9+' : notifications}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Battery className="h-4 w-4" />
              <span className="text-xs font-medium">{batteryLevel}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {widgets.map((widget) => {
                const IconComponent = widget.icon;
                return (
                  <Card key={widget.id} className="relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                        {getTrendIcon(widget.trend)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold" style={{ color: getStatusColor(widget.status) }}>
                          {widget.value}
                          {widget.unit && <span className="text-sm font-normal ml-1">{widget.unit}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{widget.title}</p>
                      </div>
                      {widget.status !== 'normal' && (
                        <div className="absolute top-2 right-2">
                          <div className={`w-2 h-2 rounded-full ${
                            widget.status === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                          } animate-pulse`} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Engine Performance</span>
                    <span className="text-green-600">Optimal</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Navigation Systems</span>
                    <span className="text-green-600">Active</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Communication</span>
                    <span className="text-yellow-600">Limited</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controls" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    className="h-20 flex-col gap-2"
                    onClick={action.action}
                  >
                    <IconComponent className="h-6 w-6" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Recent Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Engine check completed</span>
                  <span className="text-muted-foreground ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span>Weather update received</span>
                  <span className="text-muted-foreground ml-auto">5 min ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <span>Position logged</span>
                  <span className="text-muted-foreground ml-auto">10 min ago</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Engine Temperature High</p>
                    <p className="text-xs text-muted-foreground">Monitor engine cooling system</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Warning</Badge>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Weather Update</p>
                    <p className="text-xs text-muted-foreground">Strong winds expected in 2 hours</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Info</Badge>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">System Check Complete</p>
                    <p className="text-xs text-muted-foreground">All systems operating normally</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Success</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedMobileDashboard;