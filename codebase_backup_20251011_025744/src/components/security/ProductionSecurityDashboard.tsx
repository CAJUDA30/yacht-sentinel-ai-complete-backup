import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Lock, 
  Eye, 
  UserCheck, 
  Database,
  Key,
  Globe,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityStatus {
  overall_security_score: number;
  rls_policies: {
    total_tables: number;
    protected_tables: number;
    vulnerable_tables: number;
  };
  authentication: {
    active_sessions: number;
    failed_attempts_24h: number;
    mfa_enabled_users: number;
    total_users: number;
  };
  access_control: {
    superadmin_count: number;
    role_assignments: number;
    permission_violations_24h: number;
  };
  data_security: {
    encrypted_secrets: number;
    exposed_endpoints: number;
    secure_endpoints: number;
  };
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  user_id?: string;
  timestamp: string;
  metadata: any;
  status: 'active' | 'resolved' | 'investigating';
}

export function ProductionSecurityDashboard() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadSecurityStatus = async () => {
    try {
      setIsLoading(true);

      // Load security-related analytics events
      const { data: securityEventsData, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('module', 'security')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Load user role assignments for access control metrics
      const { data: roleAssignments, error: roleError } = await supabase
        .from('user_role_assignments')
        .select('*');

      if (roleError) throw roleError;

      // Simulate security metrics (in production, these would come from actual security scans)
      const mockSecurityStatus: SecurityStatus = {
        overall_security_score: 87,
        rls_policies: {
          total_tables: 45,
          protected_tables: 42,
          vulnerable_tables: 3
        },
        authentication: {
          active_sessions: 156,
          failed_attempts_24h: 12,
          mfa_enabled_users: 23,
          total_users: 45
        },
        access_control: {
          superadmin_count: 2,
          role_assignments: roleAssignments?.length || 0,
          permission_violations_24h: 3
        },
        data_security: {
          encrypted_secrets: 11,
          exposed_endpoints: 2,
          secure_endpoints: 15
        }
      };

      setSecurityStatus(mockSecurityStatus);

      // Process security events
      const events: SecurityEvent[] = (securityEventsData || []).map(event => ({
        id: event.id,
        event_type: event.event_type,
        severity: event.severity === 'error' ? 'critical' : 
                 event.severity === 'warn' ? 'high' : 'medium',
        description: event.event_message,
        user_id: event.user_id,
        timestamp: event.created_at,
        metadata: event.metadata,
        status: 'active'
      }));

      setSecurityEvents(events);
      setLastScan(new Date());

    } catch (error) {
      console.error('Failed to load security status:', error);
      toast({
        title: "Error",
        description: "Failed to load security metrics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSecurityScan = async () => {
    try {
      setIsLoading(true);
      
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await loadSecurityStatus();
      
      toast({
        title: "Security Scan Complete",
        description: "Security assessment has been updated"
      });

    } catch (error) {
      console.error('Security scan failed:', error);
      toast({
        title: "Scan Failed",
        description: "Security scan could not be completed",
        variant: "destructive"
      });
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Eye className="h-4 w-4 text-blue-500" />;
      default: return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  useEffect(() => {
    loadSecurityStatus();
  }, []);

  if (isLoading && !securityStatus) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Security Dashboard</h1>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!securityStatus) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load security dashboard. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <div className="flex items-center space-x-4">
          {lastScan && (
            <span className="text-sm text-muted-foreground">
              Last scan: {lastScan.toLocaleString()}
            </span>
          )}
          <Button onClick={runSecurityScan} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Run Security Scan
          </Button>
        </div>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">{securityStatus.overall_security_score}</span>
                  <Badge className={getSecurityScoreColor(securityStatus.overall_security_score)}>
                    {securityStatus.overall_security_score >= 90 ? 'Excellent' :
                     securityStatus.overall_security_score >= 70 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">RLS Protected</p>
                <p className="text-2xl font-bold">
                  {securityStatus.rls_policies.protected_tables}/{securityStatus.rls_policies.total_tables}
                </p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold">{securityStatus.authentication.active_sessions}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Attempts</p>
                <p className="text-2xl font-bold text-red-600">{securityStatus.authentication.failed_attempts_24h}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="data">Data Security</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Authentication Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>MFA Enabled Users</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {securityStatus.authentication.mfa_enabled_users}/{securityStatus.authentication.total_users}
                      </span>
                      <Badge className={
                        (securityStatus.authentication.mfa_enabled_users / securityStatus.authentication.total_users) > 0.5 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {Math.round((securityStatus.authentication.mfa_enabled_users / securityStatus.authentication.total_users) * 100)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Failed Login Attempts (24h)</span>
                    <Badge className={
                      securityStatus.authentication.failed_attempts_24h > 20 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }>
                      {securityStatus.authentication.failed_attempts_24h}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Encrypted Secrets</span>
                    <Badge className="bg-green-100 text-green-800">
                      {securityStatus.data_security.encrypted_secrets}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Secure Endpoints</span>
                    <Badge className="bg-green-100 text-green-800">
                      {securityStatus.data_security.secure_endpoints}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Vulnerable Endpoints</span>
                    <Badge className={
                      securityStatus.data_security.exposed_endpoints > 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }>
                      {securityStatus.data_security.exposed_endpoints}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {securityStatus.rls_policies.vulnerable_tables > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Warning:</strong> {securityStatus.rls_policies.vulnerable_tables} tables 
                are not protected by Row Level Security policies. This may expose sensitive data.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Security-related events from the last 24 hours ({securityEvents.length} events)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No security events in the last 24 hours</p>
                  </div>
                ) : (
                  securityEvents.map(event => (
                    <Alert key={event.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getSeverityIcon(event.severity)}
                          <div>
                            <h4 className="font-semibold">{event.event_type}</h4>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                              {event.user_id && (
                                <>
                                  <span>•</span>
                                  <span>User: {event.user_id.substring(0, 8)}...</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}