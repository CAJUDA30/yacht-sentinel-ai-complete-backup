import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Brain, 
  Eye, 
  Mic, 
  Hand,
  Headphones,
  Camera,
  Gamepad2,
  Activity,
  Zap,
  Monitor,
  Volume2,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Clock,
  Users,
  Target,
  Lightbulb,
  Waves,
  Radio
} from 'lucide-react';

interface NeuralInterface {
  id: string;
  name: string;
  type: 'voice' | 'gesture' | 'neural' | 'eye' | 'brain' | 'haptic';
  status: 'active' | 'inactive' | 'calibrating' | 'error';
  accuracy: number;
  responseTime: number;
  batteryLevel: number;
  users: number;
  lastCalibration: string;
  features: string[];
  enabled: boolean;
}

interface AROverlay {
  id: string;
  name: string;
  type: 'navigation' | 'monitoring' | 'maintenance' | 'social' | 'entertainment';
  status: 'active' | 'inactive';
  users: number;
  cpuUsage: number;
  memoryUsage: number;
  renderFPS: number;
  enabled: boolean;
}

interface VREnvironment {
  id: string;
  name: string;
  purpose: 'training' | 'planning' | 'entertainment' | 'maintenance' | 'collaboration';
  status: 'active' | 'inactive' | 'loading';
  participants: number;
  maxParticipants: number;
  sessionTime: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  enabled: boolean;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  interface: string;
  action: string;
  timestamp: string;
  duration: number;
  accuracy: number;
}

export default function NeuralInterfaceSystem() {
  const [interfaces, setInterfaces] = useState<NeuralInterface[]>([]);
  const [arOverlays, setArOverlays] = useState<AROverlay[]>([]);
  const [vrEnvironments, setVrEnvironments] = useState<VREnvironment[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [globalSensitivity, setGlobalSensitivity] = useState([75]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNeuralInterfaces();
    loadAROverlays();
    loadVREnvironments();
    loadUserActivities();
  }, []);

  const loadNeuralInterfaces = async () => {
    setIsLoading(true);
    try {
      // Mock neural interface data
      const mockInterfaces: NeuralInterface[] = [
        {
          id: 'voice-001',
          name: 'Advanced Voice Control',
          type: 'voice',
          status: 'active',
          accuracy: 97.8,
          responseTime: 0.3,
          batteryLevel: 100,
          users: 12,
          lastCalibration: '2024-01-20T10:30:00Z',
          enabled: true,
          features: [
            'Multi-language support',
            'Noise cancellation',
            'Context awareness',
            'Natural language processing',
            'Voice biometrics'
          ]
        },
        {
          id: 'gesture-002',
          name: 'Gesture Recognition System',
          type: 'gesture',
          status: 'active',
          accuracy: 94.5,
          responseTime: 0.1,
          batteryLevel: 87,
          users: 8,
          lastCalibration: '2024-01-20T09:15:00Z',
          enabled: true,
          features: [
            'Hand tracking',
            'Gesture library',
            'Custom gestures',
            'Air touch interface',
            'Multi-hand support'
          ]
        },
        {
          id: 'neural-003',
          name: 'Neural Activity Monitor',
          type: 'neural',
          status: 'calibrating',
          accuracy: 89.2,
          responseTime: 0.05,
          batteryLevel: 92,
          users: 3,
          lastCalibration: '2024-01-20T14:45:00Z',
          enabled: true,
          features: [
            'EEG monitoring',
            'Thought patterns',
            'Stress detection',
            'Focus tracking',
            'Mental state analysis'
          ]
        },
        {
          id: 'eye-004',
          name: 'Eye Tracking Interface',
          type: 'eye',
          status: 'active',
          accuracy: 96.1,
          responseTime: 0.08,
          batteryLevel: 95,
          users: 15,
          lastCalibration: '2024-01-20T11:20:00Z',
          enabled: true,
          features: [
            'Gaze tracking',
            'Blink detection',
            'Eye gestures',
            'Focus measurement',
            'Fatigue detection'
          ]
        },
        {
          id: 'haptic-005',
          name: 'Haptic Feedback System',
          type: 'haptic',
          status: 'active',
          accuracy: 98.9,
          responseTime: 0.02,
          batteryLevel: 78,
          users: 6,
          lastCalibration: '2024-01-20T08:45:00Z',
          enabled: true,
          features: [
            'Force feedback',
            'Texture simulation',
            'Temperature control',
            'Vibration patterns',
            'Spatial awareness'
          ]
        }
      ];

      setInterfaces(mockInterfaces);
    } catch (error) {
      console.error('Failed to load neural interfaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAROverlays = async () => {
    try {
      // Mock AR overlay data
      const mockOverlays: AROverlay[] = [
        {
          id: 'ar-nav-001',
          name: 'Navigation Overlay',
          type: 'navigation',
          status: 'active',
          users: 5,
          cpuUsage: 34,
          memoryUsage: 28,
          renderFPS: 60,
          enabled: true
        },
        {
          id: 'ar-mon-002',
          name: 'System Monitoring HUD',
          type: 'monitoring',
          status: 'active',
          users: 8,
          cpuUsage: 42,
          memoryUsage: 35,
          renderFPS: 30,
          enabled: true
        },
        {
          id: 'ar-main-003',
          name: 'Maintenance Assistant',
          type: 'maintenance',
          status: 'inactive',
          users: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          renderFPS: 0,
          enabled: false
        }
      ];

      setArOverlays(mockOverlays);
    } catch (error) {
      console.error('Failed to load AR overlays:', error);
    }
  };

  const loadVREnvironments = async () => {
    try {
      // Mock VR environment data
      const mockVR: VREnvironment[] = [
        {
          id: 'vr-training-001',
          name: 'Emergency Training Simulator',
          purpose: 'training',
          status: 'active',
          participants: 4,
          maxParticipants: 8,
          sessionTime: '45 minutes',
          quality: 'high',
          enabled: true
        },
        {
          id: 'vr-planning-002',
          name: 'Route Planning Environment',
          purpose: 'planning',
          status: 'inactive',
          participants: 0,
          maxParticipants: 12,
          sessionTime: '0 minutes',
          quality: 'ultra',
          enabled: false
        },
        {
          id: 'vr-collab-003',
          name: 'Virtual Collaboration Space',
          purpose: 'collaboration',
          status: 'active',
          participants: 6,
          maxParticipants: 16,
          sessionTime: '28 minutes',
          quality: 'high',
          enabled: true
        }
      ];

      setVrEnvironments(mockVR);
    } catch (error) {
      console.error('Failed to load VR environments:', error);
    }
  };

  const loadUserActivities = async () => {
    try {
      // Mock user activity data
      const mockActivities: UserActivity[] = [
        {
          id: 'activity-001',
          userId: 'user-123',
          userName: 'Captain Rodriguez',
          interface: 'Voice Control',
          action: 'Navigation command executed',
          timestamp: '2024-01-20T14:45:23Z',
          duration: 2.3,
          accuracy: 98.5
        },
        {
          id: 'activity-002',
          userId: 'user-456',
          userName: 'Engineer Thompson',
          interface: 'Gesture Recognition',
          action: 'System panel accessed',
          timestamp: '2024-01-20T14:42:17Z',
          duration: 1.8,
          accuracy: 94.2
        },
        {
          id: 'activity-003',
          userId: 'user-789',
          userName: 'First Officer Chen',
          interface: 'Eye Tracking',
          action: 'Chart navigation performed',
          timestamp: '2024-01-20T14:38:45Z',
          duration: 15.7,
          accuracy: 96.8
        },
        {
          id: 'activity-004',
          userId: 'user-321',
          userName: 'Safety Officer Martinez',
          interface: 'Neural Monitor',
          action: 'Stress level assessment',
          timestamp: '2024-01-20T14:35:12Z',
          duration: 8.2,
          accuracy: 91.3
        }
      ];

      setUserActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load user activities:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'calibrating':
      case 'loading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case 'voice':
        return <Mic className="w-5 h-5" />;
      case 'gesture':
        return <Hand className="w-5 h-5" />;
      case 'neural':
        return <Brain className="w-5 h-5" />;
      case 'eye':
        return <Eye className="w-5 h-5" />;
      case 'brain':
        return <Brain className="w-5 h-5" />;
      case 'haptic':
        return <Waves className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getOverlayIcon = (type: string) => {
    switch (type) {
      case 'navigation':
        return <Target className="w-5 h-5" />;
      case 'monitoring':
        return <Monitor className="w-5 h-5" />;
      case 'maintenance':
        return <Settings className="w-5 h-5" />;
      case 'social':
        return <Users className="w-5 h-5" />;
      case 'entertainment':
        return <Gamepad2 className="w-5 h-5" />;
      default:
        return <Camera className="w-5 h-5" />;
    }
  };

  const getVRIcon = (purpose: string) => {
    switch (purpose) {
      case 'training':
        return <Target className="w-5 h-5" />;
      case 'planning':
        return <Lightbulb className="w-5 h-5" />;
      case 'entertainment':
        return <Gamepad2 className="w-5 h-5" />;
      case 'maintenance':
        return <Settings className="w-5 h-5" />;
      case 'collaboration':
        return <Users className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const toggleInterface = (interfaceId: string) => {
    setInterfaces(prev => 
      prev.map(iface => 
        iface.id === interfaceId 
          ? { ...iface, enabled: !iface.enabled, status: !iface.enabled ? 'active' : 'inactive' }
          : iface
      )
    );
  };

  const toggleAROverlay = (overlayId: string) => {
    setArOverlays(prev => 
      prev.map(overlay => 
        overlay.id === overlayId 
          ? { ...overlay, enabled: !overlay.enabled, status: !overlay.enabled ? 'active' : 'inactive' }
          : overlay
      )
    );
  };

  const toggleVREnvironment = (vrId: string) => {
    setVrEnvironments(prev => 
      prev.map(vr => 
        vr.id === vrId 
          ? { ...vr, enabled: !vr.enabled, status: !vr.enabled ? 'active' : 'inactive' }
          : vr
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading neural interface system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Neural Interface & AR/VR System</h2>
          <p className="text-muted-foreground">Next-generation user interfaces with neural and immersive technology</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Brain className="w-4 h-4 mr-1" />
            Neural Active
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Eye className="w-4 h-4 mr-1" />
            {interfaces.filter(i => i.status === 'active').length} Interfaces
          </Badge>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Neural Interfaces</p>
                <p className="text-2xl font-bold">{interfaces.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">AR Overlays</p>
                <p className="text-2xl font-bold">{arOverlays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">VR Environments</p>
                <p className="text-2xl font-bold">{vrEnvironments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{interfaces.reduce((sum, i) => sum + i.users, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">
                  {(interfaces.reduce((sum, i) => sum + i.accuracy, 0) / interfaces.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="interfaces" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="interfaces">Neural Interfaces</TabsTrigger>
          <TabsTrigger value="ar">AR Overlays</TabsTrigger>
          <TabsTrigger value="vr">VR Environments</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="interfaces" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {interfaces.map((iface) => (
              <Card key={iface.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        {getInterfaceIcon(iface.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{iface.name}</CardTitle>
                        <CardDescription className="capitalize">{iface.type} Interface</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(iface.status)} variant="outline">
                      {iface.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{iface.accuracy}%</div>
                      <div className="text-xs text-blue-700">Accuracy</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{iface.responseTime}s</div>
                      <div className="text-xs text-green-700">Response Time</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Battery Level
                      </span>
                      <span className="font-medium">{iface.batteryLevel}%</span>
                    </div>
                    <Progress value={iface.batteryLevel} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Active Users</span>
                      <div className="font-medium">{iface.users}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Calibration</span>
                      <div className="font-medium text-xs">{new Date(iface.lastCalibration).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Features</h4>
                    <ul className="space-y-1">
                      {iface.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-xs text-muted-foreground">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3 mr-1" />
                        Calibrate
                      </Button>
                    </div>
                    <Switch
                      checked={iface.enabled}
                      onCheckedChange={() => toggleInterface(iface.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ar" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {arOverlays.map((overlay) => (
              <Card key={overlay.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getOverlayIcon(overlay.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{overlay.name}</CardTitle>
                        <CardDescription className="capitalize">{overlay.type} Overlay</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(overlay.status)} variant="outline">
                      {overlay.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{overlay.users}</div>
                      <div className="text-xs text-green-700">Active Users</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{overlay.renderFPS}</div>
                      <div className="text-xs text-purple-700">Render FPS</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span className="font-medium">{overlay.cpuUsage}%</span>
                      </div>
                      <Progress value={overlay.cpuUsage} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span className="font-medium">{overlay.memoryUsage}%</span>
                      </div>
                      <Progress value={overlay.memoryUsage} className="h-2" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                    <Switch
                      checked={overlay.enabled}
                      onCheckedChange={() => toggleAROverlay(overlay.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vr" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {vrEnvironments.map((vr) => (
              <Card key={vr.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        {getVRIcon(vr.purpose)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{vr.name}</CardTitle>
                        <CardDescription className="capitalize">{vr.purpose} Environment</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(vr.status)} variant="outline">
                      {vr.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{vr.participants}/{vr.maxParticipants}</div>
                      <div className="text-xs text-blue-700">Participants</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-600 capitalize">{vr.quality}</div>
                      <div className="text-xs text-orange-700">Quality</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Occupancy</span>
                      <span className="font-medium">{((vr.participants / vr.maxParticipants) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(vr.participants / vr.maxParticipants) * 100} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Session Time</span>
                      <div className="font-medium">{vr.sessionTime}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Purpose</span>
                      <div className="font-medium capitalize">{vr.purpose}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="w-3 h-3 mr-1" />
                        Join
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3 mr-1" />
                        Setup
                      </Button>
                    </div>
                    <Switch
                      checked={vr.enabled}
                      onCheckedChange={() => toggleVREnvironment(vr.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Neural interface usage and interaction logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium">{activity.userName}</div>
                        <div className="text-sm text-muted-foreground">{activity.action}</div>
                        <div className="text-xs text-muted-foreground">
                          via {activity.interface} • {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{activity.accuracy}% accuracy</div>
                      <div className="text-xs text-muted-foreground">{activity.duration}s duration</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Sensitivity Settings</CardTitle>
                <CardDescription>Adjust interface sensitivity and responsiveness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Global Sensitivity</span>
                      <span className="text-sm text-muted-foreground">{globalSensitivity[0]}%</span>
                    </div>
                    <Slider
                      value={globalSensitivity}
                      onValueChange={setGlobalSensitivity}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Voice Threshold</span>
                      <Slider defaultValue={[70]} max={100} step={1} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Gesture Precision</span>
                      <Slider defaultValue={[85]} max={100} step={1} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Neural Sensitivity</span>
                      <Slider defaultValue={[60]} max={100} step={1} />
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Eye Tracking Speed</span>
                      <Slider defaultValue={[75]} max={100} step={1} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Neural interface system performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">98.7%</div>
                    <div className="text-sm text-green-700">System Uptime</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0.15s</div>
                    <div className="text-sm text-blue-700">Avg Response</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing Power</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span className="font-medium">54%</span>
                    </div>
                    <Progress value={54} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Network Latency</span>
                      <span className="font-medium">23ms</span>
                    </div>
                    <Progress value={23} className="h-2" />
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