import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Cloud,
  Wind,
  Waves,
  Thermometer,
  Eye,
  Navigation,
  Phone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Anchor,
  Zap,
  LifeBuoy,
  Radio,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useSafety,
  useLocationRecommendations,
  useSafetyZones,
  useWeatherMonitoring,
  useSafetyEquipment,
  useEmergencyContacts,
  useRouteSafety
} from '@/hooks/useSafety';

interface SafetyDashboardProps {
  yachtId: string;
  currentLocation?: { lat: number; lng: number };
}

const SafetyDashboard: React.FC<SafetyDashboardProps> = ({ yachtId, currentLocation }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  // Safety hooks
  const safety = useSafety(yachtId);
  const recommendations = useLocationRecommendations(yachtId);
  const safetyZones = useSafetyZones(currentLocation);
  const weather = useWeatherMonitoring(currentLocation);
  const equipment = useSafetyEquipment(yachtId);
  const emergencyContacts = useEmergencyContacts(currentLocation);
  const routeSafety = useRouteSafety();

  // Auto-assess location safety when location changes
  useEffect(() => {
    if (currentLocation) {
      safety.assessLocationSafety(currentLocation);
    }
  }, [currentLocation]);

  const handleEmergency = async (emergencyType: string) => {
    if (!currentLocation) {
      toast({
        title: "Location Required",
        description: "Current location is required for emergency response",
        variant: "destructive",
      });
      return;
    }

    try {
      await safety.handleEmergency(currentLocation, emergencyType);
      toast({
        title: "Emergency Response Activated",
        description: "Emergency protocols have been initiated",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Emergency Response Failed",
        description: "Failed to activate emergency response",
        variant: "destructive",
      });
    }
  };

  const getSafetyStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getSafetyIcon = (score: number) => {
    if (score >= 80) return ShieldCheck;
    if (score >= 40) return ShieldAlert;
    return Shield;
  };

  const equipmentStatus = equipment.getEquipmentStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Safety Center</h2>
          <p className="text-muted-foreground">
            Comprehensive safety monitoring and emergency response
          </p>
        </div>
        
        {/* Emergency Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => handleEmergency('medical_emergency')}
            className="gap-2"
          >
            <LifeBuoy className="h-4 w-4" />
            Medical Emergency
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleEmergency('man_overboard')}
            className="gap-2"
          >
            <Radio className="h-4 w-4" />
            Man Overboard
          </Button>
        </div>
      </div>

      {/* Safety Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SafetyScoreCard
          title="Overall Safety"
          score={safety.currentAssessment?.overall_score || 0}
          riskLevel={safety.currentAssessment?.risk_level || 'unknown'}
          icon={getSafetyIcon(safety.currentAssessment?.overall_score || 0)}
        />

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Weather Risk</p>
              <p className="text-2xl font-bold">
                {safety.currentAssessment?.weather_risk || 'Unknown'}
              </p>
            </div>
            <Cloud className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Equipment Status</p>
              <p className="text-2xl font-bold">
                {equipmentStatus.operational}/{equipmentStatus.total}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold text-red-600">
                {recommendations.recommendations.filter(r => r.priority_level === 'urgent').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Active Recommendations */}
      {recommendations.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Active Safety Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.recommendations.slice(0, 3).map((rec) => (
                <RecommendationAlert
                  key={rec.id}
                  recommendation={rec}
                  onAcknowledge={() => recommendations.acknowledgeRecommendation(rec.id)}
                  onDismiss={() => recommendations.dismissRecommendation(rec.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="zones">Safety Zones</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CurrentLocationStatus
              location={currentLocation}
              assessment={safety.currentAssessment}
              nearbyZones={safetyZones.nearbyZones}
            />
            
            <QuickActions
              onRefreshSafety={() => currentLocation && safety.assessLocationSafety(currentLocation)}
              onCheckEquipment={() => safety.checkEquipment()}
              onUpdateWeather={() => currentLocation && safety.updateWeather(currentLocation)}
            />
          </div>
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-4">
          <WeatherConditionsCard
            weather={weather.currentWeather}
            loading={weather.loading}
            onRefresh={weather.refetch}
          />
        </TabsContent>

        {/* Safety Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <SafetyZonesCard
            zones={safetyZones.nearbyZones}
            loading={safetyZones.loading}
          />
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <SafetyEquipmentCard
            equipment={equipment.equipment}
            loading={equipment.loading}
            onUpdate={equipment.updateEquipment}
          />
        </TabsContent>

        {/* Emergency Tab */}
        <TabsContent value="emergency" className="space-y-4">
          <EmergencyContactsCard
            contacts={emergencyContacts.contacts}
            loading={emergencyContacts.loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Safety Score Card Component
const SafetyScoreCard: React.FC<{
  title: string;
  score: number;
  riskLevel: string;
  icon: React.ComponentType<any>;
}> = ({ title, score, riskLevel, icon: Icon }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}/100
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {riskLevel} risk
          </p>
        </div>
        <Icon className={`h-8 w-8 ${getScoreColor(score)}`} />
      </CardContent>
    </Card>
  );
};

// Recommendation Alert Component
const RecommendationAlert: React.FC<{
  recommendation: any;
  onAcknowledge: () => void;
  onDismiss: () => void;
}> = ({ recommendation, onAcknowledge, onDismiss }) => {
  const getVariant = (priority: string) => {
    if (priority === 'urgent') return 'destructive';
    if (priority === 'warning') return 'default';
    return 'default';
  };

  return (
    <Alert variant={getVariant(recommendation.priority_level)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{recommendation.recommendation_title}</AlertTitle>
      <AlertDescription>
        {recommendation.recommendation_description}
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={onAcknowledge}>
            Acknowledge
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Current Location Status Component
const CurrentLocationStatus: React.FC<{
  location?: { lat: number; lng: number };
  assessment: any;
  nearbyZones: any[];
}> = ({ location, assessment, nearbyZones }) => {
  const safeHarbors = nearbyZones.filter(z => ['safe_harbor', 'marina'].includes(z.zone_type));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Current Location Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {location && (
            <div>
              <p className="text-sm text-muted-foreground">Position</p>
              <p className="font-medium">
                {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
              </p>
            </div>
          )}
          
          {assessment && (
            <div>
              <p className="text-sm text-muted-foreground">Safety Assessment</p>
              <div className="flex items-center gap-2">
                <Progress value={assessment.overall_score} className="flex-1" />
                <span className="text-sm font-medium">{assessment.overall_score}%</span>
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Nearby Safe Harbors</p>
            <p className="font-medium">{safeHarbors.length} within 100nm</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Actions Component
const QuickActions: React.FC<{
  onRefreshSafety: () => void;
  onCheckEquipment: () => void;
  onUpdateWeather: () => void;
}> = ({ onRefreshSafety, onCheckEquipment, onUpdateWeather }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button onClick={onRefreshSafety} variant="outline" className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Safety Assessment
          </Button>
          <Button onClick={onCheckEquipment} variant="outline" className="w-full gap-2">
            <CheckCircle className="h-4 w-4" />
            Check Safety Equipment
          </Button>
          <Button onClick={onUpdateWeather} variant="outline" className="w-full gap-2">
            <Cloud className="h-4 w-4" />
            Update Weather Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Weather Conditions Card Component
const WeatherConditionsCard: React.FC<{
  weather: any;
  loading: boolean;
  onRefresh: () => void;
}> = ({ weather, loading, onRefresh }) => {
  if (loading) {
    return <div className="text-center py-8">Loading weather data...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather Conditions
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {weather ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="font-medium">{weather.temperature}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4" />
              <div>
                <p className="text-sm text-muted-foreground">Wind</p>
                <p className="font-medium">{weather.wind_speed} kts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4" />
              <div>
                <p className="text-sm text-muted-foreground">Waves</p>
                <p className="font-medium">{weather.wave_height || 'N/A'} m</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <div>
                <p className="text-sm text-muted-foreground">Visibility</p>
                <p className="font-medium">{weather.visibility} km</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No weather data available</p>
        )}
      </CardContent>
    </Card>
  );
};

// Safety Zones Card Component
const SafetyZonesCard: React.FC<{
  zones: any[];
  loading: boolean;
}> = ({ zones, loading }) => {
  if (loading) {
    return <div className="text-center py-8">Loading safety zones...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Anchor className="h-5 w-5" />
          Nearby Safety Zones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {zones.map((zone) => (
            <div key={zone.zone_id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <h4 className="font-medium">{zone.zone_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {zone.zone_type} • {zone.distance_km}km away
                </p>
              </div>
              <Badge variant="outline">{zone.zone_type}</Badge>
            </div>
          ))}
          
          {zones.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No safety zones found nearby
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Safety Equipment Card Component
const SafetyEquipmentCard: React.FC<{
  equipment: any[];
  loading: boolean;
  onUpdate: (id: string, updates: any) => void;
}> = ({ equipment, loading, onUpdate }) => {
  if (loading) {
    return <div className="text-center py-8">Loading safety equipment...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5" />
          Safety Equipment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {equipment.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <h4 className="font-medium">{item.equipment_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.equipment_type} • {item.location_on_vessel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.operational_status === 'active' ? 'default' : 'secondary'}>
                  {item.operational_status}
                </Badge>
                <Badge variant={item.condition_status === 'good' ? 'default' : 'destructive'}>
                  {item.condition_status}
                </Badge>
              </div>
            </div>
          ))}
          
          {equipment.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No safety equipment registered
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Emergency Contacts Card Component
const EmergencyContactsCard: React.FC<{
  contacts: any[];
  loading: boolean;
}> = ({ contacts, loading }) => {
  if (loading) {
    return <div className="text-center py-8">Loading emergency contacts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Emergency Contacts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.slice(0, 5).map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <h4 className="font-medium">{contact.contact_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {contact.organization} • {contact.contact_type}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{contact.phone_emergency}</p>
                <p className="text-sm text-muted-foreground">
                  Response: {contact.response_time_minutes}min
                </p>
              </div>
            </div>
          ))}
          
          {contacts.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No emergency contacts available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyDashboard;