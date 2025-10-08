import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Anchor, 
  Ship, 
  Route,
  Clock,
  Target,
  Zap,
  Satellite,
  Map,
  Activity
} from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TrackingData {
  position: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading: number;
    speed: number;
  };
  navigation: {
    course: number;
    destination: string;
    eta: string;
    distanceToDestination: number;
  };
  movement: {
    isMoving: boolean;
    averageSpeed: number;
    maxSpeed: number;
    totalDistance: number;
  };
  environmental: {
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    visibility: number;
  };
}

const RealTimeTracker: React.FC = () => {
  const { rawPosition, formatLocationForDisplay } = useLocation();
  const { isConnected } = useRealtime();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [autoSave, setAutoSave] = useState(true);

  // Initialize tracking data
  useEffect(() => {
    if (rawPosition) {
      const mockTrackingData: TrackingData = {
        position: {
          latitude: rawPosition.latitude,
          longitude: rawPosition.longitude,
          accuracy: rawPosition.accuracy || 5,
          heading: 245,
          speed: 12.5
        },
        navigation: {
          course: 245,
          destination: 'Monaco Harbour',
          eta: '14:30',
          distanceToDestination: 8.2
        },
        movement: {
          isMoving: true,
          averageSpeed: 11.8,
          maxSpeed: 15.2,
          totalDistance: 47.3
        },
        environmental: {
          windSpeed: 12,
          windDirection: 280,
          waveHeight: 1.2,
          visibility: 8
        }
      };
      setTrackingData(mockTrackingData);
    }
  }, [rawPosition]);

  // Real-time position updates
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newPosition = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading || 0,
              speed: position.coords.speed || 0,
              timestamp: new Date().toISOString()
            };

            // Update tracking data
            if (trackingData) {
              setTrackingData(prev => prev ? {
                ...prev,
                position: {
                  ...newPosition,
                  heading: newPosition.heading,
                  speed: newPosition.speed * 1.944 // Convert m/s to knots
                }
              } : null);
            }

            // Save to history
            setTrackingHistory(prev => [...prev.slice(-99), newPosition]);

            // Auto-save to database
            if (autoSave && isConnected) {
              try {
                await supabase.from('yacht_positions').insert({
                  latitude: newPosition.latitude,
                  longitude: newPosition.longitude,
                  speed_knots: newPosition.speed * 1.944,
                  heading_degrees: newPosition.heading,
                  recorded_at: newPosition.timestamp
                });
              } catch (error) {
                console.error('Failed to save position:', error);
              }
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast({
              title: "Location Error",
              description: "Failed to get current position",
              variant: "destructive",
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
          }
        );
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isTracking, trackingData, autoSave, isConnected, toast]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
    toast({
      title: isTracking ? "Tracking Stopped" : "Tracking Started",
      description: isTracking ? "Real-time tracking has been disabled" : "Real-time tracking is now active",
    });
  };

  const exportTrackingData = async () => {
    try {
      const dataStr = JSON.stringify(trackingHistory, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yacht-tracking-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "Tracking data has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export tracking data",
        variant: "destructive",
      });
    }
  };

  if (!trackingData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Location Required</h3>
          <p className="text-sm text-muted-foreground">
            Enable location services to start real-time tracking
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tracking Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Real-Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Switch
                  id="tracking"
                  checked={isTracking}
                  onCheckedChange={toggleTracking}
                />
                <Label htmlFor="tracking">Active Tracking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-save"
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
                <Label htmlFor="auto-save">Auto Save</Label>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={isTracking ? "default" : "outline"} className="mb-2">
                {isTracking ? "Active" : "Inactive"}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {trackingHistory.length} positions logged
              </div>
            </div>
          </div>
          <Button onClick={exportTrackingData} variant="outline" className="w-full">
            Export Tracking Data
          </Button>
        </CardContent>
      </Card>

      {/* Current Position */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Position
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <div className="font-mono text-sm">{trackingData.position.latitude.toFixed(6)}°</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <div className="font-mono text-sm">{trackingData.position.longitude.toFixed(6)}°</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Speed</Label>
              <div className="font-semibold">{trackingData.position.speed.toFixed(1)} kts</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Heading</Label>
              <div className="font-semibold">{trackingData.position.heading}°</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Accuracy:</span>
            <Badge variant="outline">{trackingData.position.accuracy.toFixed(1)}m</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-muted-foreground">Destination</Label>
              <div className="font-semibold">{trackingData.navigation.destination}</div>
            </div>
            <div className="text-right">
              <Label className="text-xs text-muted-foreground">ETA</Label>
              <div className="font-semibold">{trackingData.navigation.eta}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Course</Label>
              <div className="font-semibold">{trackingData.navigation.course}°</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Distance</Label>
              <div className="font-semibold">{trackingData.navigation.distanceToDestination} nm</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movement Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Movement Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Avg Speed</Label>
              <div className="font-semibold">{trackingData.movement.averageSpeed} kts</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max Speed</Label>
              <div className="font-semibold">{trackingData.movement.maxSpeed} kts</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Total Distance</Label>
              <div className="font-semibold">{trackingData.movement.totalDistance} nm</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Badge variant={trackingData.movement.isMoving ? "default" : "outline"}>
                {trackingData.movement.isMoving ? "Moving" : "Stationary"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Environmental
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Wind Speed</Label>
              <div className="font-semibold">{trackingData.environmental.windSpeed} kts</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Wind Direction</Label>
              <div className="font-semibold">{trackingData.environmental.windDirection}°</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Wave Height</Label>
              <div className="font-semibold">{trackingData.environmental.waveHeight}m</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Visibility</Label>
              <div className="font-semibold">{trackingData.environmental.visibility} nm</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeTracker;