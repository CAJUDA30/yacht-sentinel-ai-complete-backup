import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useOffline } from '@/contexts/OfflineContext';
import { systemHealthService, SystemHealthStatus } from '@/services/systemHealthService';
import { comprehensiveHealthCheck } from '@/services/comprehensiveHealthCheck';
import { debugConsole } from '@/services/debugConsole';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'; // Added for authentication check
import { toast } from '@/components/ui/use-toast';

interface SystemStatus {
  connectivity: 'excellent' | 'good' | 'poor' | 'offline';
  battery: number;
  gps: 'active' | 'searching' | 'inactive';
  lastUpdate: string;
  systems: {
    navigation: 'online' | 'offline' | 'maintenance';
    engine: 'running' | 'idle' | 'maintenance';
    communications: 'active' | 'limited' | 'offline';
    power: 'normal' | 'backup' | 'critical';
  };
}

const SystemStatusIndicator: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isConnected, data } = useRealtime();
  const { isOnline, pendingSync } = useOffline();
  const { user } = useSupabaseAuth();

  // Subscribe to system health updates
  useEffect(() => {
    const unsubscribe = systemHealthService.subscribe((health) => {
      setSystemHealth(health);
    });

    // CRITICAL: Only perform health checks if user is authenticated
    if (user) {
      debugConsole.info('SYSTEM_STATUS', '🔐 User authenticated - retrieving system health status');
      
      // Get initial health status
      const currentHealth = systemHealthService.getHealthStatus();
      if (currentHealth) {
        setSystemHealth(currentHealth);
      } else {
        // Trigger initial health check if none exists (only when authenticated)
        debugConsole.info('SYSTEM_STATUS', '🏥 No existing health status - triggering initial check');
        systemHealthService.performHealthCheck(true);
      }
    } else {
      debugConsole.info('SYSTEM_STATUS', '🔒 User not authenticated - skipping health check initialization');
      setSystemHealth(null);
    }

    return unsubscribe;
  }, [user]);

  // Manual refresh function with comprehensive health check
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    // CRITICAL: Only allow health checks if user is authenticated
    if (!user) {
      debugConsole.warn('SYSTEM_STATUS', '🔒 Cannot perform health check - user not authenticated');
      toast({
        title: 'Authentication Required',
        description: 'Please log in to perform system health checks',
        variant: 'destructive'
      });
      return;
    }
    
    setIsRefreshing(true);
    try {
      debugConsole.info('SYSTEM_STATUS', 'Starting comprehensive health verification...');
      
      // Run comprehensive health check including processors
      const result = await comprehensiveHealthCheck.runFullHealthCheck(false);
      
      if (result.success) {
        debugConsole.success('SYSTEM_STATUS', 'Comprehensive health check completed successfully', {
          issues_found: result.issues.length,
          report: result.report
        });
        
        toast({
          title: '✅ Health Check Complete',
          description: result.issues.length === 0 
            ? 'All systems verified and operational'
            : `Found ${result.issues.length} issues - check system status`,
          variant: result.issues.length === 0 ? 'default' : 'destructive',
          duration: 5000
        });
      } else {
        debugConsole.error('SYSTEM_STATUS', 'Comprehensive health check failed', {
          issues: result.issues
        });
        
        toast({
          title: '❌ Health Check Failed',
          description: 'Unable to verify all systems',
          variant: 'destructive',
          duration: 5000
        });
      }
    } catch (error: any) {
      debugConsole.error('SYSTEM_STATUS', 'Failed to run comprehensive health check', { error: error.message });
      toast({
        title: 'Health Check Error',
        description: 'Unable to perform system verification',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get overall system status
  const getOverallStatus = () => {
    if (!systemHealth || !isOnline) return { status: 'offline', label: 'System Offline', color: 'text-red-500' };
    
    switch (systemHealth.overall) {
      case 'healthy':
        return { status: 'healthy', label: 'All Systems Operational', color: 'text-green-500' };
      case 'warning':
        return { status: 'warning', label: 'System Warnings', color: 'text-yellow-500' };
      case 'critical':
        return { status: 'critical', label: 'Critical Issues', color: 'text-red-500' };
      default:
        return { status: 'offline', label: 'System Offline', color: 'text-red-500' };
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    const overall = getOverallStatus();
    
    switch (overall.status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get connectivity icon
  const getConnectivityIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (!isConnected) return <Signal className="w-4 h-4 text-yellow-500" />;
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  // Get component status color
  const getComponentStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const overallStatus = getOverallStatus();
  const criticalIssues = systemHealth?.issues.filter(i => i.priority === 'critical' || i.priority === 'high').length || 0;

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          System Status
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0"
            title="Run comprehensive health check"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </h3>
        <div className="flex items-center space-x-2">
          {getConnectivityIcon()}
          <Battery className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Overall Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${overallStatus.color}`}>
            {overallStatus.label}
          </span>
        </div>
        
        {criticalIssues > 0 && (
          <Badge variant="destructive" className="text-xs">
            {criticalIssues} critical
          </Badge>
        )}
        
        {pendingSync.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {pendingSync.length} pending
          </Badge>
        )}
      </div>

      {/* System Components */}
      {systemHealth && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              AI Providers
            </span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getComponentStatusColor(
                systemHealth.aiProviders.unhealthy === 0 ? 'healthy' : 
                systemHealth.aiProviders.unhealthy > systemHealth.aiProviders.total * 0.5 ? 'critical' : 'warning'
              )}`} />
              <span className="text-xs">
                {systemHealth.aiProviders.healthy}/{systemHealth.aiProviders.total}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Server className="w-3 h-3" />
              Processors
            </span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getComponentStatusColor(
                systemHealth.processors.unhealthy === 0 ? 'healthy' : 
                systemHealth.processors.unhealthy > systemHealth.processors.total * 0.5 ? 'critical' : 'warning'
              )}`} />
              <span className="text-xs">
                {systemHealth.processors.healthy}/{systemHealth.processors.total}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Database className="w-3 h-3" />
              Database
            </span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getComponentStatusColor(systemHealth.database.status)}`} />
              <span className="text-xs capitalize">{systemHealth.database.status}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Realtime
            </span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getComponentStatusColor(systemHealth.realtime.status)}`} />
              <span className="text-xs capitalize">{systemHealth.realtime.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {systemHealth && (
        <div className="space-y-1 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">System Uptime</span>
            <span className={systemHealth.uptime > 99 ? 'text-green-500' : systemHealth.uptime > 95 ? 'text-yellow-500' : 'text-red-500'}>
              {systemHealth.uptime.toFixed(1)}%
            </span>
          </div>
          
          {systemHealth.database.responseTime && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">DB Response</span>
              <span className={systemHealth.database.responseTime < 500 ? 'text-green-500' : systemHealth.database.responseTime < 1000 ? 'text-yellow-500' : 'text-red-500'}>
                {systemHealth.database.responseTime}ms
              </span>
            </div>
          )}
        </div>
      )}

      {/* Critical Issues Alert */}
      {systemHealth && systemHealth.issues.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Recent Issues:</div>
          <div className="space-y-1">
            {systemHealth.issues.slice(0, 2).map((issue) => (
              <div key={issue.id} className="text-xs p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-red-700 dark:text-red-300 font-medium">{issue.component}</span>
                </div>
                <div className="text-red-600 dark:text-red-400 mt-1">{issue.message}</div>
              </div>
            ))}
            {systemHealth.issues.length > 2 && (
              <div className="text-xs text-muted-foreground text-center">
                +{systemHealth.issues.length - 2} more issues
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>
            Last update: {systemHealth ? systemHealth.lastChecked.toLocaleTimeString() : 'Never'}
          </span>
        </div>
        
        {isConnected && (
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-green-500" />
            <span className="text-green-500">Live</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SystemStatusIndicator;