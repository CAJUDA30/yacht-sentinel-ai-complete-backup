import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOperationsData } from '@/hooks/useOperationsData';
import {
  Activity,
  AlertTriangle,
  Battery,
  Fuel,
  Navigation,
  Ship,
  Users,
  Wrench,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Waves,
  Thermometer,
  Wind,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Radio,
  Anchor
} from 'lucide-react';

// Import types from the hook
import type { YachtStatus, SystemAlert } from '@/hooks/useOperationsData';

const RealTimeOperationsDashboard: React.FC = () => {
  const { yachts, alerts, fleetMetrics, loading, lastUpdate, refreshData, acknowledgeAlert } = useOperationsData();
  const [selectedYacht, setSelectedYacht] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success text-success-foreground';
      case 'maintenance': return 'bg-warning text-warning-foreground';
      case 'transit': return 'bg-info text-info-foreground';
      case 'offline': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getSeverityColor = (severity: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSystemStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const FleetOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Ship className="h-4 w-4" />
            Fleet Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fleetMetrics.totalYachts}</div>
          <div className="text-xs text-muted-foreground">
            {fleetMetrics.activeYachts} Online
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">
            {fleetMetrics.activeAlerts}
          </div>
          <div className="text-xs text-muted-foreground">
            {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} High Priority
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total Crew
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {fleetMetrics.totalCrew}
          </div>
          <div className="text-xs text-muted-foreground">
            {yachts.reduce((sum, y) => sum + y.guests, 0)} Guests
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">
            {fleetMetrics.maintenanceAlerts}
          </div>
          <div className="text-xs text-muted-foreground">
            Overdue Items
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const YachtCard = ({ yacht }: { yacht: YachtStatus }) => (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedYacht === yacht.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => setSelectedYacht(yacht.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ship className="h-5 w-5" />
            {yacht.name}
          </CardTitle>
          <Badge className={getStatusColor(yacht.status)}>
            {yacht.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {yacht.location.name || 'At Sea'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Systems Status */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            {getSystemStatusIcon(yacht.systems.engines)}
            <span>Engines</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            <span>{Math.round(yacht.systems.fuel)}% Fuel</span>
          </div>
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4" />
            <span>{Math.round(yacht.systems.battery)}% Battery</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            <span>Navigation OK</span>
          </div>
        </div>

        {/* Crew & Guests */}
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {yacht.crew} Crew
          </span>
          <span>{yacht.guests} Guests</span>
        </div>

        {/* Weather */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Thermometer className="h-3 w-3" />
            {yacht.weather.temperature}°C
          </span>
          <span className="flex items-center gap-1">
            <Wind className="h-3 w-3" />
            {yacht.weather.windSpeed} kts
          </span>
          <span className="flex items-center gap-1">
            <Waves className="h-3 w-3" />
            0.5m
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const AlertsList = () => (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {alerts.map((alert) => (
          <Alert 
            key={alert.id} 
            className={`${alert.severity === 'critical' || alert.severity === 'high' ? 'border-destructive' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getSeverityColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <span className="text-sm font-medium">Yacht {alert.yachtId}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="font-medium">{alert.title}</div>
                <AlertDescription className="text-sm">
                  {alert.description}
                </AlertDescription>
              </div>
              <div className="flex gap-1">
                {!alert.acknowledged && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </ScrollArea>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Operations</h1>
          <p className="text-muted-foreground">
            Monitor your entire fleet in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm">Live</span>
          </div>
        </div>
      </div>

      {/* Fleet Overview */}
      <FleetOverview />

      <Tabs defaultValue="fleet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fleet">Fleet View</TabsTrigger>
          <TabsTrigger value="alerts">Alert Center</TabsTrigger>
          <TabsTrigger value="analytics">Live Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {yachts.map((yacht) => (
              <YachtCard key={yacht.id} yacht={yacht} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System Alerts
              </CardTitle>
              <CardDescription>
                Monitor and manage all fleet alerts in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fuel Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Live fuel analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Real-time performance metrics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeOperationsDashboard;