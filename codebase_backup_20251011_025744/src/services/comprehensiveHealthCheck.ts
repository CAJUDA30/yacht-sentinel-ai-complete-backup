import { debugConsole } from '@/services/debugConsole';
import { systemHealthService } from '@/services/systemHealthService';
import { startupHealthService } from '@/services/startupHealthService';
import { toast } from '@/components/ui/use-toast';

/**
 * Comprehensive Health Check Service
 * Coordinates all health checks to ensure complete system verification
 */
export class ComprehensiveHealthCheckService {
  private static instance: ComprehensiveHealthCheckService;
  private isRunning = false;

  static getInstance(): ComprehensiveHealthCheckService {
    if (!ComprehensiveHealthCheckService.instance) {
      ComprehensiveHealthCheckService.instance = new ComprehensiveHealthCheckService();
    }
    return ComprehensiveHealthCheckService.instance;
  }

  /**
   * Run complete health verification of all systems
   */
  public async runFullHealthCheck(showToasts: boolean = true): Promise<{
    success: boolean;
    report: any;
    issues: string[];
  }> {
    if (this.isRunning) {
      debugConsole.warn('COMPREHENSIVE_HEALTH', 'Full health check already in progress');
      return { success: false, report: null, issues: ['Health check already running'] };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const issues: string[] = [];

    try {
      if (showToasts) {
        toast({
          title: '🔍 Full System Health Check',
          description: 'Running comprehensive verification of all systems...',
          duration: 5000
        });
      }

      debugConsole.info('COMPREHENSIVE_HEALTH', '🚀 Starting full system health verification');

      // Step 1: AI Providers and Models
      debugConsole.info('COMPREHENSIVE_HEALTH', '📋 Step 1: Verifying AI providers and models...');
      let aiReport;
      try {
        aiReport = await startupHealthService.performStartupHealthCheck();
        debugConsole.success('COMPREHENSIVE_HEALTH', '✅ AI providers verified', {
          providers: `${aiReport.healthyProviders}/${aiReport.totalProviders}`,
          models: `${aiReport.healthyModels}/${aiReport.totalModels}`
        });

        if (aiReport.unhealthyProviders > 0) {
          issues.push(`${aiReport.unhealthyProviders} AI providers are not healthy`);
        }
        if (aiReport.unhealthyModels > 0) {
          issues.push(`${aiReport.unhealthyModels} AI models are not responding`);
        }
      } catch (error: any) {
        debugConsole.error('COMPREHENSIVE_HEALTH', '❌ AI provider verification failed', { error: error.message });
        issues.push(`AI provider verification failed: ${error.message}`);
      }

      // Step 2: Document Processors
      debugConsole.info('COMPREHENSIVE_HEALTH', '🔧 Step 2: Verifying document processors...');
      let processorVerified = false;
      try {
        // Force processor verification through system health service
        await systemHealthService.performHealthCheck(true);
        const currentHealth = systemHealthService.getHealthStatus();
        
        if (currentHealth?.processors) {
          debugConsole.success('COMPREHENSIVE_HEALTH', '✅ Document processors verified', {
            processors: `${currentHealth.processors.healthy}/${currentHealth.processors.total}`
          });
          
          if (currentHealth.processors.unhealthy > 0) {
            issues.push(`${currentHealth.processors.unhealthy} document processors are not healthy`);
          }
          processorVerified = true;
        } else {
          issues.push('Could not verify document processor status');
        }
      } catch (error: any) {
        debugConsole.error('COMPREHENSIVE_HEALTH', '❌ Document processor verification failed', { error: error.message });
        issues.push(`Document processor verification failed: ${error.message}`);
      }

      // Step 3: Database and Infrastructure
      debugConsole.info('COMPREHENSIVE_HEALTH', '🗄️ Step 3: Verifying database and infrastructure...');
      const systemHealth = await systemHealthService.performHealthCheck(true);
      
      if (systemHealth.database.status !== 'healthy') {
        issues.push(`Database is ${systemHealth.database.status}: ${systemHealth.database.error || 'Unknown issue'}`);
      }
      
      if (systemHealth.realtime.status !== 'healthy') {
        issues.push(`Realtime services are ${systemHealth.realtime.status}: ${systemHealth.realtime.error || 'Unknown issue'}`);
      }

      // Step 4: Generate final report
      const duration = Date.now() - startTime;
      const overallSuccess = issues.length === 0;
      
      const finalReport = {
        timestamp: new Date().toISOString(),
        duration,
        overall: overallSuccess ? 'healthy' : 'issues_detected',
        aiProviders: aiReport ? {
          total: aiReport.totalProviders,
          healthy: aiReport.healthyProviders,
          models: aiReport.totalModels,
          healthyModels: aiReport.healthyModels
        } : null,
        processors: processorVerified ? {
          total: systemHealth.processors.total,
          healthy: systemHealth.processors.healthy
        } : null,
        infrastructure: {
          database: systemHealth.database.status,
          realtime: systemHealth.realtime.status,
          uptime: systemHealth.uptime
        },
        issues,
        issueCount: issues.length
      };

      debugConsole.success('COMPREHENSIVE_HEALTH', `🎯 Full health check completed in ${duration}ms`, {
        overall_status: overallSuccess ? 'healthy' : 'issues_detected',
        issues_found: issues.length,
        ai_providers: finalReport.aiProviders,
        processors: finalReport.processors,
        infrastructure: finalReport.infrastructure
      });

      if (showToasts) {
        if (overallSuccess) {
          toast({
            title: '✅ All Systems Verified',
            description: `Complete health check passed in ${Math.round(duration / 1000)}s. All systems operational!`,
            duration: 5000
          });
        } else {
          toast({
            title: '⚠️ Issues Detected',
            description: `Found ${issues.length} issues during health check. Check system status for details.`,
            variant: 'destructive',
            duration: 8000
          });
        }
      }

      return {
        success: overallSuccess,
        report: finalReport,
        issues
      };

    } catch (error: any) {
      debugConsole.error('COMPREHENSIVE_HEALTH', '💥 Comprehensive health check failed', { error: error.message });
      
      if (showToasts) {
        toast({
          title: '❌ Health Check Failed',
          description: 'Unable to complete comprehensive system verification',
          variant: 'destructive',
          duration: 5000
        });
      }

      return {
        success: false,
        report: null,
        issues: [`Health check failed: ${error.message}`]
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Quick health check for specific components
   */
  public async quickCheck(components: ('ai' | 'processors' | 'database' | 'realtime')[]): Promise<{
    success: boolean;
    results: Record<string, any>;
  }> {
    const results: Record<string, any> = {};

    try {
      if (components.includes('ai')) {
        const aiReport = await startupHealthService.performStartupHealthCheck(true);
        results.ai = {
          status: aiReport.overallHealth,
          providers: `${aiReport.healthyProviders}/${aiReport.totalProviders}`,
          models: `${aiReport.healthyModels}/${aiReport.totalModels}`
        };
      }

      if (components.includes('processors') || components.includes('database') || components.includes('realtime')) {
        const systemHealth = await systemHealthService.performHealthCheck(true);
        
        if (components.includes('processors')) {
          results.processors = {
            status: systemHealth.processors.unhealthy === 0 ? 'healthy' : 'issues',
            count: `${systemHealth.processors.healthy}/${systemHealth.processors.total}`
          };
        }
        
        if (components.includes('database')) {
          results.database = {
            status: systemHealth.database.status,
            responseTime: systemHealth.database.responseTime
          };
        }
        
        if (components.includes('realtime')) {
          results.realtime = {
            status: systemHealth.realtime.status,
            connected: systemHealth.realtime.connected
          };
        }
      }

      return { success: true, results };
    } catch (error: any) {
      debugConsole.error('COMPREHENSIVE_HEALTH', 'Quick check failed', { error: error.message });
      return { success: false, results: {} };
    }
  }

  /**
   * Get current health status from all services
   */
  public getCurrentStatus(): {
    systemHealth: any;
    aiHealth: any;
    lastUpdated: Date | null;
  } {
    const systemHealth = systemHealthService.getHealthStatus();
    const aiHealth = startupHealthService.getLastReport();
    
    return {
      systemHealth,
      aiHealth,
      lastUpdated: systemHealth?.lastChecked || null
    };
  }
}

export const comprehensiveHealthCheck = ComprehensiveHealthCheckService.getInstance();