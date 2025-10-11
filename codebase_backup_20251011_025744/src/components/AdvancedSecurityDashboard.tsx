import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle,
  UserCheck,
  Activity,
  Wifi,
  Camera,
  Key,
  Fingerprint,
  Scan,
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import { useLLMAnalytics } from '@/hooks/useLLMAnalytics';

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'access' | 'intrusion' | 'system' | 'perimeter' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  status: 'active' | 'investigating' | 'resolved';
  aiConfidence: number;
}

interface AccessControl {
  id: string;
  zone: string;
  accessLevel: number;
  activeUsers: number;
  securityStatus: 'secure' | 'warning' | 'breach';
  lastAccess: string;
  biometricEnabled: boolean;
}

interface SecurityMetrics {
  threatLevel: number;
  activeSensors: number;
  totalSensors: number;
  networkSecurity: number;
  accessControlStatus: number;
  biometricSessions: number;
  unauthorizedAttempts: number;
}

const AdvancedSecurityDashboard: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threatLevel: 15,
    activeSensors: 47,
    totalSensors: 50,
    networkSecurity: 92,
    accessControlStatus: 98,
    biometricSessions: 12,
    unauthorizedAttempts: 3
  });

  const { analytics, refreshAnalytics } = useLLMAnalytics('advanced-security', { 
    securityEvents, 
    accessControls, 
    metrics 
  });

  // Initialize security data
  useEffect(() => {
    const initializeSecurityData = () => {
      // Sample security events
      const events: SecurityEvent[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          type: 'access',
          severity: 'low',
          location: 'Bridge Access',
          description: 'Authorized crew member entered bridge',
          status: 'resolved',
          aiConfidence: 0.95
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: 'perimeter',
          severity: 'medium',
          location: 'Port Side Deck',
          description: 'Motion detected near restricted area',
          status: 'investigating',
          aiConfidence: 0.78
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'network',
          severity: 'high',
          location: 'Network Core',
          description: 'Unusual network traffic pattern detected',
          status: 'active',
          aiConfidence: 0.92
        }
      ];

      // Sample access control zones
      const zones: AccessControl[] = [
        {
          id: '1',
          zone: 'Bridge',
          accessLevel: 5,
          activeUsers: 2,
          securityStatus: 'secure',
          lastAccess: '2 minutes ago',
          biometricEnabled: true
        },
        {
          id: '2',
          zone: 'Engine Room',
          accessLevel: 4,
          activeUsers: 1,
          securityStatus: 'secure',
          lastAccess: '15 minutes ago',
          biometricEnabled: true
        },
        {
          id: '3',
          zone: 'Guest Areas',
          accessLevel: 2,
          activeUsers: 8,
          securityStatus: 'secure',
          lastAccess: '1 minute ago',
          biometricEnabled: false
        },
        {
          id: '4',
          zone: 'Security Office',
          accessLevel: 5,
          activeUsers: 1,
          securityStatus: 'warning',
          lastAccess: '5 minutes ago',
          biometricEnabled: true
        }
      ];

      setSecurityEvents(events);
      setAccessControls(zones);
    };

    initializeSecurityData();
  }, []);

  // Real-time security monitoring simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        threatLevel: Math.max(0, Math.min(100, prev.threatLevel + (Math.random() - 0.5) * 10)),
        activeSensors: Math.max(40, Math.min(50, prev.activeSensors + Math.floor((Math.random() - 0.5) * 3))),
        networkSecurity: Math.max(80, Math.min(100, prev.networkSecurity + (Math.random() - 0.5) * 5)),
        biometricSessions: Math.max(0, prev.biometricSessions + Math.floor((Math.random() - 0.3) * 2))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // AI Security Analysis
  useEffect(() => {
    const performSecurityAnalysis = async () => {
      const response = await processWithAllLLMs({
        content: `Analyze security events and provide threat assessment: ${JSON.stringify(securityEvents)} with metrics: ${JSON.stringify(metrics)}`,
        context: 'Advanced security analysis and threat detection',
        type: 'security-analysis',
        module: 'advanced-security'
      });

      // Add AI-generated security event if threat level is high
      if (metrics.threatLevel > 70 && Math.random() > 0.7) {
        const newEvent: SecurityEvent = {
          id: `ai-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'system',
          severity: 'medium',
          location: 'AI Security Monitor',
          description: 'AI detected unusual pattern requiring attention',
          status: 'active',
          aiConfidence: response.confidence || 0.85
        };

        setSecurityEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      }
    };

    performSecurityAnalysis();
  }, [metrics.threatLevel, processWithAllLLMs]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'investigating': return <RefreshCw className="h-4 w-4 text-yellow-500" />;
      case 'active': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSecurityStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'breach': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Security Command Center
          </CardTitle>
          <CardDescription>
            AI-powered comprehensive security monitoring and threat detection
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Security Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-5 w-5 ${metrics.threatLevel > 50 ? 'text-red-500' : 'text-green-500'}`} />
              <span className="font-medium">Threat Level</span>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{metrics.threatLevel}%</div>
              <Progress value={metrics.threatLevel} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Active Sensors</span>
            </div>
            <div className="text-2xl font-bold">
              {metrics.activeSensors}/{metrics.totalSensors}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round((metrics.activeSensors / metrics.totalSensors) * 100)}% operational
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Network Security</span>
            </div>
            <div className="text-2xl font-bold">{metrics.networkSecurity}%</div>
            <div className="text-sm text-muted-foreground">
              {metrics.networkSecurity > 90 ? 'Excellent' : 'Good'} protection
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Fingerprint className="h-5 w-5 text-green-500" />
              <span className="font-medium">Biometric Sessions</span>
            </div>
            <div className="text-2xl font-bold">{metrics.biometricSessions}</div>
            <div className="text-sm text-muted-foreground">
              Active authenticated users
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Security Events</span>
                <Button size="sm" variant="outline" onClick={refreshAnalytics}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(event.status)}
                        <span className="font-medium">{event.type.toUpperCase()}</span>
                        <Badge className={`text-white ${getSeverityColor(event.severity)}`}>
                          {event.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <p className="text-sm mb-2">{event.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {Math.round(event.aiConfidence * 100)}% AI confidence
                        </Badge>
                        <Badge 
                          variant={event.status === 'resolved' ? 'default' : 'destructive'}
                        >
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Zones</CardTitle>
              <CardDescription>Real-time access monitoring and control</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accessControls.map((zone) => (
                  <Card key={zone.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{zone.zone}</h4>
                        <div className="flex items-center gap-2">
                          {zone.biometricEnabled && (
                            <Fingerprint className="h-4 w-4 text-green-500" />
                          )}
                          <Lock className="h-4 w-4" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Security Level</span>
                          <span className="font-medium">Level {zone.accessLevel}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Active Users</span>
                          <span className="font-medium">{zone.activeUsers}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Status</span>
                          <span className={`font-medium ${getSecurityStatusColor(zone.securityStatus)}`}>
                            {zone.securityStatus.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Last Access</span>
                          <span className="text-muted-foreground">{zone.lastAccess}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Key className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Monitor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  CCTV Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="aspect-video bg-muted rounded flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div className="text-sm text-muted-foreground">Camera {i + 1}</div>
                        <div className="text-xs text-green-600">● LIVE</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Perimeter Sensors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Port Side', 'Starboard Side', 'Bow', 'Stern'].map((location, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        <span className="font-medium">{location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={i === 1 ? 'destructive' : 'default'}>
                          {i === 1 ? 'Alert' : 'Normal'}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {analytics && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    AI Security Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.insights && (
                    <div className="space-y-4">
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Security Status:</strong> {analytics.insights.consensus}
                        </AlertDescription>
                      </Alert>
                      
                      {analytics.insights.recommendations && (
                        <div>
                          <h4 className="font-medium mb-2">Security Recommendations</h4>
                          <div className="space-y-2">
                            {analytics.insights.recommendations.map((rec: string, index: number) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {analytics.predictions && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Threat Prediction</h4>
                      <p className="text-sm">{analytics.predictions.consensus}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSecurityDashboard;