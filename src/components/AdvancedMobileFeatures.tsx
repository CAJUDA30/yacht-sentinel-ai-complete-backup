import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  Battery, 
  Volume2,
  Camera,
  Mic,
  Navigation,
  Compass,
  MapPin,
  Vibrate,
  Bell,
  Settings,
  Zap,
  Eye,
  Accessibility
} from 'lucide-react';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';

interface MobileFeature {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  aiOptimized: boolean;
  batteryImpact: 'low' | 'medium' | 'high';
  category: 'navigation' | 'communication' | 'sensors' | 'accessibility' | 'performance';
}

interface DeviceCapability {
  feature: string;
  available: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  aiEnhanced: boolean;
}

const AdvancedMobileFeatures: React.FC = () => {
  const isMobile = useIsMobile();
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  
  const [features, setFeatures] = useState<MobileFeature[]>([
    {
      id: 'geolocation',
      name: 'Enhanced GPS',
      description: 'AI-powered location accuracy with predictive positioning',
      icon: MapPin,
      enabled: true,
      aiOptimized: true,
      batteryImpact: 'medium',
      category: 'navigation'
    },
    {
      id: 'compass',
      name: 'Smart Compass',
      description: 'Magnetic compass with AI-corrected readings',
      icon: Compass,
      enabled: true,
      aiOptimized: true,
      batteryImpact: 'low',
      category: 'navigation'
    },
    {
      id: 'camera',
      name: 'AI Vision Scanner',
      description: 'Computer vision for equipment inspection and documentation',
      icon: Camera,
      enabled: false,
      aiOptimized: true,
      batteryImpact: 'high',
      category: 'sensors'
    },
    {
      id: 'microphone',
      name: 'Voice Commands',
      description: 'Hands-free yacht control with AI speech recognition',
      icon: Mic,
      enabled: false,
      aiOptimized: true,
      batteryImpact: 'medium',
      category: 'communication'
    },
    {
      id: 'vibration',
      name: 'Haptic Alerts',
      description: 'Tactile feedback for critical notifications',
      icon: Vibrate,
      enabled: true,
      aiOptimized: false,
      batteryImpact: 'low',
      category: 'communication'
    },
    {
      id: 'notifications',
      name: 'Smart Notifications',
      description: 'AI-prioritized alerts based on urgency and context',
      icon: Bell,
      enabled: true,
      aiOptimized: true,
      batteryImpact: 'low',
      category: 'communication'
    },
    {
      id: 'offline-mode',
      name: 'Offline Intelligence',
      description: 'AI-powered offline capabilities with data sync',
      icon: Wifi,
      enabled: true,
      aiOptimized: true,
      batteryImpact: 'medium',
      category: 'performance'
    },
    {
      id: 'accessibility',
      name: 'Adaptive Interface',
      description: 'AI-adjusted UI for different conditions and users',
      icon: Accessibility,
      enabled: false,
      aiOptimized: true,
      batteryImpact: 'low',
      category: 'accessibility'
    }
  ]);

  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapability[]>([]);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });

  // Check device capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities: DeviceCapability[] = [];

      // Geolocation
      capabilities.push({
        feature: 'Geolocation',
        available: 'geolocation' in navigator,
        permission: 'unknown',
        aiEnhanced: true
      });

      // Camera
      capabilities.push({
        feature: 'Camera',
        available: 'mediaDevices' in navigator,
        permission: 'unknown',
        aiEnhanced: true
      });

      // Microphone
      capabilities.push({
        feature: 'Microphone',
        available: 'mediaDevices' in navigator,
        permission: 'unknown',
        aiEnhanced: true
      });

      // Device Orientation
      capabilities.push({
        feature: 'Device Orientation',
        available: 'DeviceOrientationEvent' in window,
        permission: 'unknown',
        aiEnhanced: true
      });

      // Vibration
      capabilities.push({
        feature: 'Vibration',
        available: 'vibrate' in navigator,
        permission: 'granted',
        aiEnhanced: false
      });

      // Push Notifications
      capabilities.push({
        feature: 'Push Notifications',
        available: 'Notification' in window,
        permission: Notification.permission as any,
        aiEnhanced: true
      });

      setDeviceCapabilities(capabilities);
    };

    checkCapabilities();
  }, []);

  // Monitor battery if available
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
  }, []);

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Device orientation (if available)
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0
      });
    };

    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  const toggleFeature = async (featureId: string) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, enabled: !feature.enabled }
        : feature
    ));

    // AI optimization for enabled features
    const feature = features.find(f => f.id === featureId);
    if (feature && !feature.enabled) {
      await processWithAllLLMs({
        content: `Optimize mobile feature: ${feature.name} for yacht management system`,
        context: `Mobile feature optimization for ${feature.category}`,
        type: 'mobile-optimization',
        module: 'mobile'
      });
    }
  };

  const requestPermission = async (feature: string) => {
    switch (feature) {
      case 'Geolocation':
        try {
          await navigator.geolocation.getCurrentPosition(() => {});
          updateCapabilityPermission(feature, 'granted');
        } catch {
          updateCapabilityPermission(feature, 'denied');
        }
        break;
      
      case 'Camera':
      case 'Microphone':
        try {
          const constraints = feature === 'Camera' ? { video: true } : { audio: true };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          stream.getTracks().forEach(track => track.stop());
          updateCapabilityPermission(feature, 'granted');
        } catch {
          updateCapabilityPermission(feature, 'denied');
        }
        break;
      
      case 'Push Notifications':
        const permission = await Notification.requestPermission();
        updateCapabilityPermission(feature, permission as any);
        break;
    }
  };

  const updateCapabilityPermission = (feature: string, permission: string) => {
    setDeviceCapabilities(prev => prev.map(cap =>
      cap.feature === feature 
        ? { ...cap, permission: permission as any }
        : cap
    ));
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Advanced Mobile Features
          </CardTitle>
          <CardDescription>
            AI-enhanced mobile capabilities for maritime operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Battery className={`h-4 w-4 ${getBatteryColor(batteryLevel)}`} />
              <span className="text-sm">Battery: {batteryLevel}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-sm">Network: {networkStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="text-sm">{isMobile ? 'Mobile' : 'Desktop'} Device</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="features" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="features">Smart Features</TabsTrigger>
          <TabsTrigger value="capabilities">Device Info</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
        </TabsList>

        <TabsContent value="features">
          <div className="grid gap-4">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-5 w-5" />
                        <div>
                          <CardTitle className="text-base">{feature.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {feature.aiOptimized && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            <Zap className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        <Switch
                          checked={feature.enabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{feature.category}</Badge>
                        <Badge className={getImpactColor(feature.batteryImpact)}>
                          {feature.batteryImpact} battery impact
                        </Badge>
                      </div>
                      {feature.enabled && (
                        <span className="text-sm text-green-600">Active</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="capabilities">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Capabilities</CardTitle>
                <CardDescription>
                  Available hardware features and their permission status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceCapabilities.map((capability, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${capability.available ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <span className="font-medium">{capability.feature}</span>
                          {capability.aiEnhanced && (
                            <Badge variant="outline" className="ml-2">
                              <Eye className="h-3 w-3 mr-1" />
                              AI Enhanced
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={capability.permission === 'granted' ? 'default' : 'secondary'}>
                          {capability.permission}
                        </Badge>
                        {capability.available && capability.permission !== 'granted' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => requestPermission(capability.feature)}
                          >
                            Request
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sensors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Orientation</CardTitle>
                <CardDescription>
                  Real-time device orientation data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Alpha (Z-axis):</span>
                    <span className="font-mono">{deviceOrientation.alpha.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Beta (X-axis):</span>
                    <span className="font-mono">{deviceOrientation.beta.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gamma (Y-axis):</span>
                    <span className="font-mono">{deviceOrientation.gamma.toFixed(1)}°</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Mobile-specific performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Connection Type:</span>
                    <span>{(navigator as any).connection?.effectiveType || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory (approx):</span>
                    <span>{(navigator as any).deviceMemory || 'Unknown'} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cores:</span>
                    <span>{navigator.hardwareConcurrency || 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedMobileFeatures;