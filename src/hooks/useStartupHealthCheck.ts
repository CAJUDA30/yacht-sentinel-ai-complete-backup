/**
 * Startup Health Check Hook
 * Automatically performs health checks when user logs in or app starts
 */

import { useEffect, useRef } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAISystemInitialization } from '@/hooks/useAISystemInitialization';
import { startupHealthService } from '@/services/startupHealthService';
import { debugConsole } from '@/services/debugConsole';
import { useQueryClient } from '@tanstack/react-query';

interface UseStartupHealthCheckOptions {
  enabled?: boolean;
  delay?: number; // Delay in ms before running health check
  runOnLogin?: boolean;
  runOnAppStart?: boolean;
  nonBlocking?: boolean; // If true, don't wait for health checks to complete
}

// Global state to prevent multiple concurrent health checks
let globalHealthCheckInProgress = false;
let globalHealthCheckInitialized = false;

export function useStartupHealthCheck(options: UseStartupHealthCheckOptions = {}) {
  const {
    enabled = true,
    delay = 15000, // 15 second delay to avoid blocking initial page load
    runOnLogin = true,
    runOnAppStart = true,
    nonBlocking = true // Default to non-blocking for better UX
  } = options;

  const { user, session, loading } = useSupabaseAuth();
  const { isInitialized: aiInitialized, isInitializing: aiInitializing } = useAISystemInitialization();
  const queryClient = useQueryClient();
  const hasRunForSession = useRef<string | null>(null);
  const hasRunOnAppStart = useRef(false);
  const isHealthCheckInitialized = useRef(false);

  // Set query client for the startup health service
  useEffect(() => {
    startupHealthService.setQueryClient(queryClient);
  }, [queryClient]);

  // Wait for AI system to be fully ready, then run startup health check with proper sequencing
  useEffect(() => {
    if (!enabled || loading || aiInitializing || !aiInitialized) {
      debugConsole.info('SYSTEM', '⏳ Waiting for AI system to be ready', {
        enabled,
        loading,
        aiInitializing,
        aiInitialized
      });
      return;
    }
    
    if (runOnAppStart && !hasRunOnAppStart.current && !globalHealthCheckInitialized) {
      hasRunOnAppStart.current = true;
      isHealthCheckInitialized.current = true;
      globalHealthCheckInitialized = true;
      
      debugConsole.info('SYSTEM', '🚀 AI system fully ready - scheduling comprehensive health check', {
        delay_ms: delay,
        user_authenticated: !!user,
        ai_initialized: aiInitialized,
        sequence: 'providers_initialized → api_keys_ready → starting_health_check → processors_verification'
      });

      const timeoutId = setTimeout(async () => {
        if (globalHealthCheckInProgress) {
          debugConsole.warn('SYSTEM', 'Health check already in progress, skipping');
          return;
        }
        
        globalHealthCheckInProgress = true;
        
        try {
          debugConsole.info('SYSTEM', '🔍 Starting comprehensive startup health check sequence');
          debugConsole.info('SYSTEM', '📋 Sequence: validate_api_keys → test_connections → verify_processors → populate_models');
          
          // First run the AI provider health checks
          const healthReport = await startupHealthService.performStartupHealthCheck();
          
          debugConsole.success('SYSTEM', '✅ AI provider health checks completed', {
            healthy_providers: healthReport.healthyProviders,
            total_providers: healthReport.totalProviders,
            healthy_models: healthReport.healthyModels,
            total_models: healthReport.totalModels
          });
          
          // Then trigger the comprehensive system health check (which includes processors)
          debugConsole.info('SYSTEM', '🔧 Triggering comprehensive system health verification...');
          const { systemHealthService } = await import('@/services/systemHealthService');
          const systemHealth = await systemHealthService.performHealthCheck(true);
          
          debugConsole.success('SYSTEM', '✅ Comprehensive health check completed', {
            overall_status: systemHealth.overall,
            ai_providers: `${systemHealth.aiProviders.healthy}/${systemHealth.aiProviders.total}`,
            processors: `${systemHealth.processors.healthy}/${systemHealth.processors.total}`,
            database: systemHealth.database.status,
            realtime: systemHealth.realtime.status,
            issues: systemHealth.issues.length
          });
          
        } catch (error: any) {
          debugConsole.error('SYSTEM', 'Comprehensive health check failed', {
            error: error.message
          });
        } finally {
          globalHealthCheckInProgress = false;
        }
      }, delay);

      return () => {
        clearTimeout(timeoutId);
        debugConsole.info('SYSTEM', 'Startup health check timeout cleared');
      };
    }
  }, [enabled, loading, aiInitializing, aiInitialized, runOnAppStart, delay, user]);

  // Handle login-specific health checks (only after AI system is ready)
  useEffect(() => {
    if (!enabled || loading || aiInitializing || !aiInitialized || !runOnLogin) return;

    // Run on user login (only once per session)
    if (user && session && hasRunForSession.current !== session.access_token) {
      hasRunForSession.current = session.access_token;
      
      debugConsole.info('SYSTEM', '👤 User authenticated - scheduling comprehensive login health check', {
        user_email: user.email,
        delay_ms: delay,
        note: 'Login health check will refresh models and verify all systems'
      });

      const timeoutId = setTimeout(async () => {
        if (globalHealthCheckInProgress) {
          debugConsole.warn('SYSTEM', 'Health check already in progress, skipping login check');
          return;
        }
        
        globalHealthCheckInProgress = true;
        
        try {
          debugConsole.info('SYSTEM', '🔍 Performing comprehensive login health check', {
            user_email: user.email
          });
          
          // Run both AI provider and system health checks
          const healthReport = await startupHealthService.performStartupHealthCheck(true);
          const { systemHealthService } = await import('@/services/systemHealthService');
          await systemHealthService.performHealthCheck(true);
          
          debugConsole.info('SYSTEM', '✅ Login health check completed', {
            user_email: user.email,
            models_validated: healthReport.totalModels
          });
        } catch (error: any) {
          debugConsole.error('SYSTEM', 'Login health check failed', {
            error: error.message,
            user_email: user.email
          });
        } finally {
          globalHealthCheckInProgress = false;
        }
      }, delay);

      return () => clearTimeout(timeoutId);
    }

    // Reset on logout
    if (!user && !session && hasRunForSession.current) {
      hasRunForSession.current = null;
      globalHealthCheckInProgress = false;
      debugConsole.info('SYSTEM', '👋 User logged out - resetting health check state');
    }
  }, [enabled, aiInitialized, runOnLogin, user, session, delay]);

  return {
    triggerManualHealthCheck: async () => {
      try {
        // Run both AI provider and system health checks
        const healthReport = await startupHealthService.performStartupHealthCheck();
        const { systemHealthService } = await import('@/services/systemHealthService');
        await systemHealthService.performHealthCheck();
        return healthReport;
      } catch (error: any) {
        debugConsole.error('SYSTEM', 'Manual health check failed', { error: error.message });
        throw error;
      }
    },
    getLastReport: () => startupHealthService.getLastReport()
  };
}