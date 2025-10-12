import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Settings,
  Activity,
  Server,
  Database,
  Cpu,
  Wifi
} from 'lucide-react';
import { systemHealthService, SystemHealthStatus } from '@/services/systemHealthService';
import { startupHealthService } from '@/services/startupHealthService';
import { comprehensiveHealthCheck } from '@/services/comprehensiveHealthCheck';
import { debugConsole } from '@/services/debugConsole';
import { ComprehensiveVerification } from '@/components/ComprehensiveVerification';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const AppStatusDashboard = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useSupabaseAuth();

  // Subscribe to system health updates
  useEffect(() => {
    const unsubscribe = systemHealthService.subscribe((health) => {
      setSystemHealth(health);
    });

    // CRITICAL: Only perform health checks if user is authenticated
    if (user) {
      debugConsole.info('APP_STATUS', '🔐 User authenticated - retrieving system health status');
      
      // Get initial health status
      const currentHealth = systemHealthService.getHealthStatus();
      if (currentHealth) {
        setSystemHealth(currentHealth);
      } else {
        // Trigger initial health check (only when authenticated)
        debugConsole.info('APP_STATUS', '🏥 No existing health status - triggering initial check');
        systemHealthService.performHealthCheck(true);
      }
    } else {
      debugConsole.info('APP_STATUS', '🔒 User not authenticated - skipping health check initialization');
      setSystemHealth(null);
    }

    return unsubscribe;
  }, [user]);

  const refreshStatus = async () => {
    if (isRefreshing) return;
    
    // CRITICAL: Only allow health checks if user is authenticated
    if (!user) {
      debugConsole.warn('APP_STATUS', '🔒 Cannot perform health check - user not authenticated');
      toast({
        title: 'Authentication Required',
        description: 'Please log in to perform system health checks',
        variant: 'destructive'
      });
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      debugConsole.info('APP_STATUS', 'Manual comprehensive health check triggered from dashboard');
      
      // Run comprehensive health check that verifies everything
      const result = await comprehensiveHealthCheck.runFullHealthCheck(false);
      
      if (result.success) {
        debugConsole.success('APP_STATUS', 'Comprehensive health check completed', {
          overall_status: result.report.overall,
          issues_count: result.issues.length,
          ai_providers: result.report.aiProviders,
          processors: result.report.processors,
          infrastructure: result.report.infrastructure
        });
        
        toast({
          title: "✅ System Status Updated",
          description: result.issues.length === 0 
            ? `All systems verified and operational (${Math.round(result.report.duration / 1000)}s)`
            : `Found ${result.issues.length} issues during verification`,
          variant: result.issues.length === 0 ? 'default' : 'destructive',
          duration: 6000
        });
      } else {
        debugConsole.error('APP_STATUS', 'Comprehensive health check failed', {
          issues: result.issues
        });
        
        toast({
          title: "❌ Status Update Failed",
          description: "Could not verify all system components",
          variant: "destructive",
          duration: 5000
        });
      }
      
    } catch (error: any) {
      debugConsole.error('APP_STATUS', 'Failed to refresh status', { error: error.message });
      toast({
        title: "Status Update Failed",
        description: "Could not refresh system status.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getOverallStatusInfo = () => {
    if (!systemHealth) {
      return {
        status: 'unknown',
        label: 'Loading...',
        color: 'text-gray-600',
        icon: <Activity className="h-4 w-4 text-gray-500 animate-spin" />
      };
    }

    switch (systemHealth.overall) {
      case 'healthy':
        return {
          status: 'healthy',
          label: 'ALL SYSTEMS OPERATIONAL',
          color: 'text-green-600 dark:text-green-400',
          icon: <CheckCircle className="h-4 w-4 text-green-500" />
        };
      case 'warning':
        return {
          status: 'warning',
          label: 'SYSTEM WARNINGS',
          color: 'text-yellow-600 dark:text-yellow-400',
          icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
        };
      case 'critical':
        return {
          status: 'critical',
          label: 'CRITICAL ISSUES',
          color: 'text-red-600 dark:text-red-400',
          icon: <XCircle className="h-4 w-4 text-red-500" />
        };
      case 'offline':
        return {
          status: 'offline',
          label: 'SYSTEM OFFLINE',
          color: 'text-red-600 dark:text-red-400',
          icon: <XCircle className="h-4 w-4 text-red-500" />
        };
      default:
        return {
          status: 'unknown',
          label: 'UNKNOWN STATUS',
          color: 'text-gray-600 dark:text-gray-400',
          icon: <AlertTriangle className="h-4 w-4 text-gray-500" />
        };
    }
  };

  const getFeatureStatus = () => {
    if (!systemHealth) {
      return {
        'AI Providers': { status: 'unknown', coverage: '0/0' },
        'Document Processors': { status: 'unknown', coverage: '0/0' },
        'Database': { status: 'unknown', coverage: 'Unknown' },
        'Realtime Sync': { status: 'unknown', coverage: 'Unknown' },
        'System Monitoring': { status: 'unknown', coverage: 'Unknown' },
        'Health Checks': { status: 'unknown', coverage: 'Unknown' }
      };
    }

    return {
      'AI Providers': {
        status: systemHealth.aiProviders.unhealthy === 0 ? 'operational' : 
                systemHealth.aiProviders.unhealthy > systemHealth.aiProviders.total * 0.5 ? 'down' : 'degraded',
        coverage: `${systemHealth.aiProviders.healthy}/${systemHealth.aiProviders.total}`
      },
      'Document Processors': {
        status: systemHealth.processors.unhealthy === 0 ? 'operational' : 
                systemHealth.processors.unhealthy > systemHealth.processors.total * 0.5 ? 'down' : 'degraded',
        coverage: `${systemHealth.processors.healthy}/${systemHealth.processors.total}`
      },
      'Database': {
        status: systemHealth.database.status === 'healthy' ? 'operational' : 
                systemHealth.database.status === 'warning' ? 'degraded' : 'down',
        coverage: systemHealth.database.responseTime ? `${systemHealth.database.responseTime}ms` : 'Unknown'
      },
      'Realtime Sync': {
        status: systemHealth.realtime.status === 'healthy' ? 'operational' : 
                systemHealth.realtime.status === 'warning' ? 'degraded' : 'down',
        coverage: systemHealth.realtime.connected ? 'Connected' : 'Disconnected'
      },
      'System Monitoring': {
        status: 'operational',
        coverage: `${systemHealth.uptime.toFixed(1)}% uptime`
      },
      'Health Checks': {
        status: systemHealth.issues.length === 0 ? 'operational' : 
                systemHealth.issues.filter(i => i.priority === 'critical').length > 0 ? 'degraded' : 'degraded',
        coverage: `${systemHealth.issues.length} issues`
      }
    };
  };

  const getPerformanceMetrics = () => {
    if (!systemHealth) {
      return {
        'Database Response': 'Unknown',
        'System Uptime': 'Unknown',
        'Health Check Status': 'Unknown',
        'Real-time Updates': 'Unknown'
      };
    }

    return {
      'Database Response': systemHealth.database.responseTime 
        ? `${systemHealth.database.responseTime}ms`
        : 'Unknown',
      'System Uptime': `${systemHealth.uptime.toFixed(2)}%`,
      'Health Check Status': systemHealth.issues.length === 0 
        ? 'All Clear'
        : `${systemHealth.issues.length} Issues`,
      'Real-time Updates': systemHealth.realtime.connected 
        ? 'Connected'
        : 'Disconnected'
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 dark:text-green-400';
      case 'degraded': return 'text-yellow-600 dark:text-yellow-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const statusInfo = getOverallStatusInfo();
  const features = getFeatureStatus();
  const performance = getPerformanceMetrics();
  const criticalIssues = systemHealth?.issues.filter(i => i.priority === 'critical' || i.priority === 'high') || [];

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>System Status Dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.label}</span>
              </Badge>
              <Button 
                onClick={refreshStatus} 
                disabled={isRefreshing}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Last updated: {systemHealth ? systemHealth.lastChecked.toLocaleString() : 'Never'}
          </p>
          
          {/* System Overview Cards */}
          {systemHealth && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Cpu className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-sm font-medium">AI Providers</div>
                <div className={getStatusColor(
                  systemHealth.aiProviders.unhealthy === 0 ? 'operational' : 
                  systemHealth.aiProviders.unhealthy > systemHealth.aiProviders.total * 0.5 ? 'down' : 'degraded'
                )}>
                  {systemHealth.aiProviders.healthy}/{systemHealth.aiProviders.total}
                </div>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Server className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-sm font-medium">Processors</div>
                <div className={getStatusColor(
                  systemHealth.processors.unhealthy === 0 ? 'operational' : 
                  systemHealth.processors.unhealthy > systemHealth.processors.total * 0.5 ? 'down' : 'degraded'
                )}>
                  {systemHealth.processors.healthy}/{systemHealth.processors.total}
                </div>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-sm font-medium">Database</div>
                <div className={getStatusColor(
                  systemHealth.database.status === 'healthy' ? 'operational' : 
                  systemHealth.database.status === 'warning' ? 'degraded' : 'down'
                )}>
                  {systemHealth.database.status}
                </div>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Wifi className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-sm font-medium">Realtime</div>
                <div className={getStatusColor(
                  systemHealth.realtime.status === 'healthy' ? 'operational' : 
                  systemHealth.realtime.status === 'warning' ? 'degraded' : 'down'
                )}>
                  {systemHealth.realtime.status}
                </div>
              </div>
            </div>
          )}
          
          {/* Current Issues */}
          {systemHealth && systemHealth.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Current Issues ({systemHealth.issues.length}):
              </h4>
              {systemHealth.issues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {getIssueIcon(issue.type)}
                    <div>
                      <p className="text-sm font-medium">{issue.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.component} • {issue.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={issue.priority === 'critical' ? 'destructive' : 
                            issue.priority === 'high' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {issue.priority}
                  </Badge>
                </div>
              ))}
              {systemHealth.issues.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  +{systemHealth.issues.length - 5} more issues
                </div>
              )}
            </div>
          )}
          
          {/* All Clear Message */}
          {systemHealth && systemHealth.issues.length === 0 && (
            <div className="flex items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="text-lg font-medium text-green-700 dark:text-green-300">
                  All Systems Operational
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  No issues detected • Uptime: {systemHealth.uptime.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Status */}
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Feature Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(features).map(([feature, data]) => (
              <div key={feature} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{feature}</p>
                  <p className="text-xs text-muted-foreground">Coverage: {data.coverage}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(data.status)}
                >
                  {data.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(performance).map(([metric, value]) => (
              <div key={metric} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">{metric}</p>
                <Badge variant="outline" className="text-green-600">
                  {value}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Verification */}
      <ComprehensiveVerification />

      {/* Quick Actions */}
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-auto py-3 flex flex-col items-center"
              onClick={() => window.location.href = '/admin/settings'}
            >
              <Settings className="h-4 w-4 mb-1" />
              <span className="text-xs">Settings</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-auto py-3 flex flex-col items-center"
              onClick={refreshStatus}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mb-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-auto py-3 flex flex-col items-center"
              onClick={() => comprehensiveHealthCheck.runFullHealthCheck()}
            >
              <CheckCircle className="h-4 w-4 mb-1" />
              <span className="text-xs">Test All</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-auto py-3 flex flex-col items-center"
              onClick={() => window.location.href = '/admin/logs'}
            >
              <AlertTriangle className="h-4 w-4 mb-1" />
              <span className="text-xs">Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};