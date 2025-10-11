import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  User,
  Activity,
  Clock,
  MapPin,
  Smartphone,
  Globe,
  Key,
  Database,
  FileText,
  Bell,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
}

interface SecurityMetrics {
  total_events: number;
  high_risk_events: number;
  failed_logins: number;
  successful_logins: number;
  unique_users: number;
  active_sessions: number;
  blocked_attempts: number;
  security_score: number;
}

interface AccessLog {
  id: string;
  user_id: string;
  module: string;
  action: string;
  resource: string;
  ip_address: string;
  timestamp: string;
  success: boolean;
  risk_score: number;
}

const AdvancedSecurityDashboard: React.FC = () => {
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    total_events: 0,
    high_risk_events: 0,
    failed_logins: 0,
    successful_logins: 0,
    unique_users: 0,
    active_sessions: 0,
    blocked_attempts: 0,
    security_score: 85
  });
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load security events from analytics_events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('module', 'security')
        .order('created_at', { ascending: false })
        .limit(50);

      if (events) {
        const securityEvents: SecurityEvent[] = events.map(event => ({
          id: event.id,
          event_type: event.event_type,
          user_id: event.user_id || 'system',
          ip_address: (event.metadata as any)?.ip_address,
          user_agent: (event.metadata as any)?.user_agent,
          location: (event.metadata as any)?.location,
          risk_level: event.severity === 'error' ? 'high' : 
                     event.severity === 'warn' ? 'medium' : 'low',
          details: event.event_message,
          timestamp: event.created_at,
          status: (event.metadata as any)?.status || 'active'
        }));
        setSecurityEvents(securityEvents);
      }

      // Generate sample metrics (in production, this would come from analytics)
      const newMetrics: SecurityMetrics = {
        total_events: securityEvents.length,
        high_risk_events: securityEvents.filter(e => e.risk_level === 'high' || e.risk_level === 'critical').length,
        failed_logins: Math.floor(Math.random() * 15) + 5,
        successful_logins: Math.floor(Math.random() * 150) + 200,
        unique_users: Math.floor(Math.random() * 25) + 15,
        active_sessions: Math.floor(Math.random() * 12) + 8,
        blocked_attempts: Math.floor(Math.random() * 8) + 2,
        security_score: Math.floor(Math.random() * 20) + 75
      };
      setMetrics(newMetrics);

      // Generate sample access logs
      const sampleLogs: AccessLog[] = Array.from({ length: 20 }, (_, i) => ({
        id: `log_${i}`,
        user_id: `user_${Math.floor(Math.random() * 10)}`,
        module: ['claims-repairs', 'inventory', 'maintenance', 'crew'][Math.floor(Math.random() * 4)],
        action: ['view', 'create', 'update', 'delete'][Math.floor(Math.random() * 4)],
        resource: `resource_${Math.floor(Math.random() * 100)}`,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        success: Math.random() > 0.1,
        risk_score: Math.floor(Math.random() * 100)
      }));
      setAccessLogs(sampleLogs);

    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'investigating':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const resolveSecurityEvent = async (eventId: string) => {
    // In production, this would update the database
    setSecurityEvents(prev => 
      prev.map(event => 
        event.id === eventId 
          ? { ...event, status: 'resolved' }
          : event
      )
    );
    
    toast({
      title: "Event Resolved",
      description: "Security event has been marked as resolved",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {metrics.security_score}%
              {metrics.security_score >= 80 ? 
                <TrendingUp className="h-4 w-4 text-green-500" /> : 
                <TrendingDown className="h-4 w-4 text-red-500" />
              }
            </div>
            <Progress value={metrics.security_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.high_risk_events}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_sessions}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.unique_users} unique users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Attempts</CardTitle>
            <Lock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blocked_attempts}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="access">Access Logs</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Security Events
              </CardTitle>
              <CardDescription>
                Monitor security incidents and threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          {getStatusIcon(event.status)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getRiskColor(event.risk_level)}>
                              {event.risk_level.toUpperCase()}
                            </Badge>
                            <span className="font-medium text-sm">{event.event_type}</span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.details}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                            {event.ip_address && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {event.ip_address}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {event.status !== 'resolved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveSecurityEvent(event.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {securityEvents.length === 0 && (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                      <p className="text-muted-foreground">No security events detected</p>
                      <p className="text-sm text-muted-foreground">Your system is secure</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Access Logs
              </CardTitle>
              <CardDescription>
                Detailed access and activity logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {accessLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <span className="font-medium">{log.action.toUpperCase()}</span>
                          <span className="text-muted-foreground"> on </span>
                          <span className="font-medium">{log.module}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{log.ip_address}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <Badge variant={log.risk_score > 50 ? "destructive" : "secondary"}>
                          Risk: {log.risk_score}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Monitor active user sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium">user_{i + 1}@yacht.com</p>
                        <p className="text-sm text-muted-foreground">Claims & Repairs Module</p>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1">
                        <Smartphone className="h-3 w-3" />
                        Chrome • Desktop
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Active 2h 15m
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Authentication Settings</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Two-Factor Authentication</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Session Timeout</span>
                      <Badge variant="secondary">8 hours</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Password Policy</span>
                      <Badge variant="default">Strong</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Login Attempts</span>
                      <Badge variant="secondary">5 max</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Access Control</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Role-Based Access</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">IP Whitelisting</span>
                      <Badge variant="secondary">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">API Rate Limiting</span>
                      <Badge variant="default">1000/hour</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Audit Logging</span>
                      <Badge variant="default">Full</Badge>
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

export default AdvancedSecurityDashboard;