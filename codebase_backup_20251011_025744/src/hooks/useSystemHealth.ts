import { useState, useEffect } from 'react';
import { systemHealthService, SystemHealthStatus } from '@/services/systemHealthService';
import { debugConsole } from '@/services/debugConsole';

interface UseSystemHealthOptions {
  autoRefreshInterval?: number; // in milliseconds, default 5 minutes
  triggerInitialCheck?: boolean;
}

interface UseSystemHealthReturn {
  health: SystemHealthStatus | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  overallStatus: 'healthy' | 'warning' | 'critical' | 'offline' | 'unknown';
  criticalIssues: number;
  hasIssues: boolean;
}

export function useSystemHealth(options: UseSystemHealthOptions = {}): UseSystemHealthReturn {
  const {
    autoRefreshInterval = 5 * 60 * 1000, // 5 minutes
    triggerInitialCheck = true
  } = options;

  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to health status updates
  useEffect(() => {
    const unsubscribe = systemHealthService.subscribe((newHealth) => {
      setHealth(newHealth);
      setIsLoading(false);
    });

    // Get initial health status
    const currentHealth = systemHealthService.getHealthStatus();
    if (currentHealth) {
      setHealth(currentHealth);
      setIsLoading(false);
    } else if (triggerInitialCheck) {
      // Trigger initial health check if none exists
      systemHealthService.performHealthCheck(true).then(() => {
        setIsLoading(false);
      }).catch((error) => {
        debugConsole.error('USE_SYSTEM_HEALTH', 'Initial health check failed', { error: error.message });
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return unsubscribe;
  }, [triggerInitialCheck]);

  // Auto-refresh health status
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      systemHealthService.performHealthCheck(true).catch((error) => {
        debugConsole.error('USE_SYSTEM_HEALTH', 'Auto-refresh health check failed', { error: error.message });
      });
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Manual refresh function
  const refresh = async (): Promise<void> => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await systemHealthService.performHealthCheck();
    } catch (error: any) {
      debugConsole.error('USE_SYSTEM_HEALTH', 'Manual refresh failed', { error: error.message });
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculated values
  const overallStatus = health?.overall || 'unknown';
  const criticalIssues = health?.issues.filter(i => i.priority === 'critical' || i.priority === 'high').length || 0;
  const hasIssues = (health?.issues.length || 0) > 0;
  const lastUpdated = health?.lastChecked || null;

  return {
    health,
    isLoading,
    lastUpdated,
    refresh,
    isRefreshing,
    overallStatus,
    criticalIssues,
    hasIssues
  };
}

/**
 * Hook for getting specific system component health
 */
export function useComponentHealth(component: 'aiProviders' | 'processors' | 'database' | 'realtime') {
  const { health } = useSystemHealth({ triggerInitialCheck: false });

  if (!health) {
    return { status: 'unknown', isHealthy: false, details: null };
  }

  switch (component) {
    case 'aiProviders':
      return {
        status: health.aiProviders.unhealthy === 0 ? 'healthy' : 
                health.aiProviders.unhealthy > health.aiProviders.total * 0.5 ? 'critical' : 'warning',
        isHealthy: health.aiProviders.unhealthy === 0,
        details: health.aiProviders
      };
    case 'processors':
      return {
        status: health.processors.unhealthy === 0 ? 'healthy' : 
                health.processors.unhealthy > health.processors.total * 0.5 ? 'critical' : 'warning',
        isHealthy: health.processors.unhealthy === 0,
        details: health.processors
      };
    case 'database':
      return {
        status: health.database.status,
        isHealthy: health.database.status === 'healthy',
        details: health.database
      };
    case 'realtime':
      return {
        status: health.realtime.status,
        isHealthy: health.realtime.status === 'healthy',
        details: health.realtime
      };
    default:
      return { status: 'unknown', isHealthy: false, details: null };
  }
}

/**
 * Hook for getting system uptime
 */
export function useSystemUptime() {
  const { health } = useSystemHealth({ triggerInitialCheck: false });
  return health?.uptime || 0;
}

/**
 * Hook for getting critical issues count
 */
export function useCriticalIssues() {
  const { health } = useSystemHealth({ triggerInitialCheck: false });
  return health?.issues.filter(i => i.priority === 'critical' || i.priority === 'high') || [];
}