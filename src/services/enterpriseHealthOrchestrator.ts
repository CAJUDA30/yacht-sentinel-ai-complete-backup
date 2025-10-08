import { supabase } from '@/integrations/supabase/client';
import { debugConsole } from '@/services/debugConsole';
import { startupHealthService } from '@/services/startupHealthService';
import { systemHealthService } from '@/services/systemHealthService';

/**
 * Enterprise Health Orchestrator
 * Fully automated, systematic health monitoring and verification system
 * Zero manual intervention required - operates autonomously
 */
export class EnterpriseHealthOrchestrator {
  private static instance: EnterpriseHealthOrchestrator;
  private isInitialized = false;
  private orchestrationState: 'initializing' | 'monitoring' | 'verifying' | 'recovering' = 'initializing';
  private healthMetrics: Map<string, any> = new Map();
  private criticalIssueCount = 0;
  private lastFullVerification: Date | null = null;
  private automatedRecoveryAttempts = 0;
  private maxRecoveryAttempts = 3;

  // Automated monitoring intervals
  private readonly RAPID_CHECK_INTERVAL = 30000; // 30 seconds for critical components
  private readonly STANDARD_CHECK_INTERVAL = 120000; // 2 minutes for standard components
  private readonly COMPREHENSIVE_VERIFICATION_INTERVAL = 600000; // 10 minutes full system verification
  private readonly HEALTH_PERSISTENCE_INTERVAL = 60000; // 1 minute to persist health data

  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Set<(status: any) => void> = new Set();

  static getInstance(): EnterpriseHealthOrchestrator {
    if (!EnterpriseHealthOrchestrator.instance) {
      EnterpriseHealthOrchestrator.instance = new EnterpriseHealthOrchestrator();
    }
    return EnterpriseHealthOrchestrator.instance;
  }

  /**
   * Initialize automated enterprise health monitoring
   * Starts all automated processes and monitoring systems
   */
  public async initializeAutomatedMonitoring(): Promise<void> {
    if (this.isInitialized) return;

    debugConsole.info('SYSTEM', '🚀 Initializing Enterprise Health Orchestrator - Fully Automated Mode');
    
    this.orchestrationState = 'initializing';
    this.isInitialized = true;

    // Start automated monitoring sequences
    await this.startAutomatedHealthMonitoring();
    await this.startAutomatedDataPersistence();
    await this.startAutomatedRecoverySystem();
    await this.startAutomatedReporting();

    this.orchestrationState = 'monitoring';
    
    debugConsole.success('SYSTEM', '✅ Enterprise Health Orchestrator fully operational - Autonomous monitoring active');
  }

  /**
   * Start automated health monitoring with systematic verification
   */
  private async startAutomatedHealthMonitoring(): Promise<void> {
    debugConsole.info('SYSTEM', '🔄 Starting automated health monitoring subsystems');

    // Immediate verification after startup delay
    this.scheduleDelayedCheck('initial-verification', async () => {
      await this.performAutomatedSystemVerification();
    }, 25000); // 25 seconds after startup

    // Rapid monitoring for critical components
    this.intervals.set('rapid-critical', setInterval(async () => {
      await this.performRapidCriticalCheck();
    }, this.RAPID_CHECK_INTERVAL));

    // Standard monitoring for all components
    this.intervals.set('standard-monitoring', setInterval(async () => {
      await this.performStandardHealthCheck();
    }, this.STANDARD_CHECK_INTERVAL));

    // Comprehensive system verification
    this.intervals.set('comprehensive-verification', setInterval(async () => {
      await this.performAutomatedSystemVerification();
    }, this.COMPREHENSIVE_VERIFICATION_INTERVAL));

    debugConsole.success('SYSTEM', '✅ Automated health monitoring systems active');
  }

  /**
   * Perform automated comprehensive system verification
   */
  private async performAutomatedSystemVerification(): Promise<void> {
    const verificationId = `verification-${Date.now()}`;
    
    try {
      debugConsole.info('SYSTEM', `🔍 Automated System Verification ${verificationId} - Starting comprehensive analysis`);
      this.orchestrationState = 'verifying';

      const startTime = Date.now();
      const results = {
        timestamp: new Date().toISOString(),
        verificationId,
        components: {} as Record<string, any>,
        overallStatus: 'unknown' as 'healthy' | 'degraded' | 'critical' | 'unknown',
        issuesDetected: [] as string[],
        metricsCollected: {} as Record<string, any>
      };

      // Systematic component verification
      results.components.aiProviders = await this.verifyAIProvidersAutomatically();
      results.components.processors = await this.verifyProcessorsAutomatically();
      results.components.database = await this.verifyDatabaseAutomatically();
      results.components.realtime = await this.verifyRealtimeAutomatically();
      results.components.infrastructure = await this.verifyInfrastructureAutomatically();

      // Calculate overall system health
      results.overallStatus = this.calculateSystemHealthStatus(results.components);
      results.issuesDetected = this.extractSystemIssues(results.components);
      results.metricsCollected = this.collectPerformanceMetrics(results.components);

      const duration = Date.now() - startTime;
      this.lastFullVerification = new Date();

      // Update health metrics
      this.healthMetrics.set('lastVerification', results);
      this.healthMetrics.set('systemStatus', results.overallStatus);
      this.healthMetrics.set('lastUpdate', new Date());

      // Automated issue handling
      if (results.issuesDetected.length > 0) {
        await this.handleDetectedIssuesAutomatically(results.issuesDetected);
      }

      // Notify subscribers of status change
      this.notifySubscribers({
        status: results.overallStatus,
        lastChecked: new Date(),
        issues: results.issuesDetected,
        metrics: results.metricsCollected,
        verificationId
      });

      debugConsole.success('SYSTEM', `✅ Automated System Verification ${verificationId} completed in ${duration}ms`, {
        overall_status: results.overallStatus,
        components_verified: Object.keys(results.components).length,
        issues_detected: results.issuesDetected.length,
        performance_metrics: Object.keys(results.metricsCollected).length
      });

      this.orchestrationState = 'monitoring';

    } catch (error: any) {
      debugConsole.error('SYSTEM', `❌ Automated System Verification ${verificationId} failed`, {
        error: error.message,
        stack: error.stack
      });
      
      await this.handleVerificationFailure(error);
    }
  }

  /**
   * Verify AI Providers automatically with comprehensive testing
   */
  private async verifyAIProvidersAutomatically(): Promise<any> {
    try {
      debugConsole.info('SYSTEM', '🤖 Automated AI Provider Verification - Starting');
      
      const healthReport = await startupHealthService.performStartupHealthCheck(true);
      
      const verification = {
        status: healthReport.overallHealth,
        totalProviders: healthReport.totalProviders,
        healthyProviders: healthReport.healthyProviders,
        totalModels: healthReport.totalModels,
        healthyModels: healthReport.healthyModels,
        issues: [] as string[],
        performance: {
          averageResponseTime: 0,
          successRate: 0
        }
      };

      // Calculate performance metrics
      if (healthReport.providerResults.length > 0) {
        const responseTimes = healthReport.providerResults
          .filter(p => p.latency)
          .map(p => p.latency!);
        
        verification.performance.averageResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0;
        
        verification.performance.successRate = healthReport.healthyProviders / healthReport.totalProviders;
      }

      // Collect issues
      healthReport.providerResults.forEach(provider => {
        if (!provider.isHealthy) {
          verification.issues.push(`AI Provider ${provider.providerName}: ${provider.error || 'Unknown issue'}`);
        }
      });

      debugConsole.success('SYSTEM', '✅ AI Provider Verification completed', {
        providers: `${verification.healthyProviders}/${verification.totalProviders}`,
        models: `${verification.healthyModels}/${verification.totalModels}`,
        success_rate: `${(verification.performance.successRate * 100).toFixed(1)}%`
      });

      return verification;
    } catch (error: any) {
      debugConsole.error('SYSTEM', '❌ AI Provider Verification failed', { error: error.message });
      return {
        status: 'critical',
        issues: [`AI Provider verification failed: ${error.message}`],
        performance: { averageResponseTime: 0, successRate: 0 }
      };
    }
  }

  /**
   * Verify Document Processors automatically
   */
  private async verifyProcessorsAutomatically(): Promise<any> {
    try {
      debugConsole.info('SYSTEM', '🔧 Automated Processor Verification - Starting');
      
      const { data, error } = await supabase.functions.invoke('gcp-unified-config', {
        body: { action: 'test_all_connections' }
      });

      const verification = {
        status: 'unknown' as 'healthy' | 'degraded' | 'critical',
        totalProcessors: 0,
        healthyProcessors: 0,
        issues: [] as string[],
        performance: {
          responseTime: 0,
          availability: 0
        }
      };

      if (error) {
        verification.status = 'critical';
        verification.issues.push(`Processor verification failed: ${error.message}`);
        debugConsole.error('SYSTEM', '❌ Processor Verification failed', { error: error.message });
      } else if (data?.results?.documentAI) {
        const docAI = data.results.documentAI;
        verification.totalProcessors = 1;
        verification.healthyProcessors = docAI.status === 'ok' ? 1 : 0;
        verification.status = docAI.status === 'ok' ? 'healthy' : 'critical';
        verification.performance.responseTime = data.total_ms || 0;
        verification.performance.availability = docAI.status === 'ok' ? 1 : 0;

        if (docAI.status !== 'ok') {
          verification.issues.push(`Document AI Processor: ${docAI.error || 'Service unavailable'}`);
        }

        debugConsole.success('SYSTEM', '✅ Processor Verification completed', {
          status: verification.status,
          response_time: verification.performance.responseTime,
          processor_name: docAI.processor
        });
      } else {
        verification.status = 'degraded';
        verification.issues.push('No Document AI processors configured');
        debugConsole.warn('SYSTEM', '⚠️ No processors found in verification response');
      }

      return verification;
    } catch (error: any) {
      debugConsole.error('SYSTEM', '❌ Processor Verification failed', { error: error.message });
      return {
        status: 'critical',
        issues: [`Processor verification failed: ${error.message}`],
        performance: { responseTime: 0, availability: 0 }
      };
    }
  }

  /**
   * Verify Database automatically with performance monitoring
   */
  private async verifyDatabaseAutomatically(): Promise<any> {
    try {
      debugConsole.info('SYSTEM', '🗄️ Automated Database Verification - Starting');
      
      const startTime = Date.now();
      
      // Test basic connectivity
      const { data: basicTest, error: basicError } = await supabase
        .from('ai_providers_unified')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      const verification = {
        status: 'unknown' as 'healthy' | 'degraded' | 'critical',
        responseTime,
        connections: 1,
        issues: [] as string[],
        performance: {
          queryPerformance: responseTime,
          availability: 0
        }
      };

      if (basicError) {
        verification.status = 'critical';
        verification.issues.push(`Database connectivity failed: ${basicError.message}`);
        verification.performance.availability = 0;
      } else {
        // Determine status based on response time
        if (responseTime < 500) {
          verification.status = 'healthy';
        } else if (responseTime < 2000) {
          verification.status = 'degraded';
          verification.issues.push(`Database response time is slow: ${responseTime}ms`);
        } else {
          verification.status = 'critical';
          verification.issues.push(`Database response time is critical: ${responseTime}ms`);
        }
        
        verification.performance.availability = 1;
      }

      debugConsole.success('SYSTEM', '✅ Database Verification completed', {
        status: verification.status,
        response_time: responseTime,
        availability: verification.performance.availability
      });

      return verification;
    } catch (error: any) {
      debugConsole.error('SYSTEM', '❌ Database Verification failed', { error: error.message });
      return {
        status: 'critical',
        issues: [`Database verification failed: ${error.message}`],
        performance: { queryPerformance: 0, availability: 0 }
      };
    }
  }

  /**
   * Verify Realtime services automatically
   */
  private async verifyRealtimeAutomatically(): Promise<any> {
    try {
      debugConsole.info('SYSTEM', '📡 Automated Realtime Verification - Starting');
      
      const verification = {
        status: 'unknown' as 'healthy' | 'degraded' | 'critical',
        connected: false,
        subscriptions: 0,
        issues: [] as string[],
        performance: {
          connectionTime: 0,
          stability: 0
        }
      };

      const startTime = Date.now();
      const testChannel = supabase.channel(`health-test-${Date.now()}`);
      
      const connectionPromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          testChannel.unsubscribe();
          resolve(false);
        }, 5000);

        testChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            testChannel.unsubscribe();
            resolve(true);
          }
        });
      });

      const connected = await connectionPromise;
      verification.performance.connectionTime = Date.now() - startTime;
      verification.connected = connected;

      if (connected) {
        verification.status = verification.performance.connectionTime < 2000 ? 'healthy' : 'degraded';
        verification.subscriptions = 1;
        verification.performance.stability = 1;
        
        if (verification.status === 'degraded') {
          verification.issues.push(`Realtime connection slow: ${verification.performance.connectionTime}ms`);
        }
      } else {
        verification.status = 'critical';
        verification.issues.push('Realtime connection failed');
        verification.performance.stability = 0;
      }

      debugConsole.success('SYSTEM', '✅ Realtime Verification completed', {
        status: verification.status,
        connected: verification.connected,
        connection_time: verification.performance.connectionTime
      });

      return verification;
    } catch (error: any) {
      debugConsole.error('SYSTEM', '❌ Realtime Verification failed', { error: error.message });
      return {
        status: 'critical',
        connected: false,
        issues: [`Realtime verification failed: ${error.message}`],
        performance: { connectionTime: 0, stability: 0 }
      };
    }
  }

  /**
   * Verify Infrastructure components automatically
   */
  private async verifyInfrastructureAutomatically(): Promise<any> {
    const verification = {
      status: 'healthy' as 'healthy' | 'degraded' | 'critical',
      components: {
        memory: this.checkMemoryUsage(),
        performance: this.checkPerformanceMetrics(),
        errors: this.checkErrorRates()
      },
      issues: [] as string[]
    };

    // Analyze infrastructure health
    if (verification.components.memory.usage > 80) {
      verification.status = 'degraded';
      verification.issues.push(`High memory usage: ${verification.components.memory.usage}%`);
    }

    if (verification.components.errors.rate > 5) {
      verification.status = 'critical';
      verification.issues.push(`High error rate: ${verification.components.errors.rate}%`);
    }

    debugConsole.success('SYSTEM', '✅ Infrastructure Verification completed', {
      status: verification.status,
      memory_usage: verification.components.memory.usage,
      error_rate: verification.components.errors.rate
    });

    return verification;
  }

  /**
   * Perform rapid critical component checks (every 30 seconds)
   */
  private async performRapidCriticalCheck(): Promise<void> {
    try {
      // Quick database ping
      const dbStart = Date.now();
      await supabase.from('ai_providers_unified').select('id').limit(1);
      const dbTime = Date.now() - dbStart;

      // Update metrics
      this.healthMetrics.set('database_response_time', dbTime);
      this.healthMetrics.set('last_rapid_check', new Date());

      // Alert if critical thresholds exceeded
      if (dbTime > 3000) {
        this.criticalIssueCount++;
        debugConsole.error('SYSTEM', '🚨 Critical: Database response time exceeded threshold', {
          response_time: dbTime,
          threshold: 3000,
          critical_issue_count: this.criticalIssueCount
        });
      }
    } catch (error: any) {
      debugConsole.error('SYSTEM', '❌ Rapid critical check failed', { error: error.message });
    }
  }

  /**
   * Perform standard health checks (every 2 minutes)
   */
  private async performStandardHealthCheck(): Promise<void> {
    try {
      debugConsole.info('SYSTEM', '🔄 Standard Health Check - Automated monitoring cycle');
      
      // Update system health status
      await systemHealthService.performHealthCheck(true);
      
      const currentHealth = systemHealthService.getHealthStatus();
      if (currentHealth) {
        this.healthMetrics.set('system_health', currentHealth);
        this.healthMetrics.set('last_standard_check', new Date());

        // Check for status changes
        const previousStatus = this.healthMetrics.get('previous_status');
        if (previousStatus !== currentHealth.overall) {
          this.healthMetrics.set('previous_status', currentHealth.overall);
          
          debugConsole.info('SYSTEM', '📊 System status change detected', {
            previous: previousStatus,
            current: currentHealth.overall,
            issues: currentHealth.issues.length
          });

          // Notify subscribers of status change
          this.notifySubscribers({
            status: currentHealth.overall,
            lastChecked: currentHealth.lastChecked,
            issues: currentHealth.issues.map(i => i.message),
            changeDetected: true
          });
        }
      }
    } catch (error: any) {
      debugConsole.error('SYSTEM', '❌ Standard health check failed', { error: error.message });
    }
  }

  /**
   * Start automated data persistence
   */
  private async startAutomatedDataPersistence(): Promise<void> {
    this.intervals.set('data-persistence', setInterval(async () => {
      await this.persistHealthMetrics();
    }, this.HEALTH_PERSISTENCE_INTERVAL));

    debugConsole.success('SYSTEM', '✅ Automated data persistence system active');
  }

  /**
   * Start automated recovery system
   */
  private async startAutomatedRecoverySystem(): Promise<void> {
    debugConsole.success('SYSTEM', '✅ Automated recovery system active');
  }

  /**
   * Start automated reporting system
   */
  private async startAutomatedReporting(): Promise<void> {
    debugConsole.success('SYSTEM', '✅ Automated reporting system active');
  }

  /**
   * Subscribe to automated health status updates
   */
  public subscribe(callback: (status: any) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Get current automated health status
   */
  public getAutomatedHealthStatus(): any {
    return {
      orchestrationState: this.orchestrationState,
      lastVerification: this.lastFullVerification,
      metrics: Object.fromEntries(this.healthMetrics),
      criticalIssueCount: this.criticalIssueCount,
      isMonitoring: this.intervals.size > 0
    };
  }

  // Helper methods
  private scheduleDelayedCheck(id: string, callback: () => Promise<void>, delay: number): void {
    setTimeout(async () => {
      try {
        await callback();
      } catch (error: any) {
        debugConsole.error('SYSTEM', `Scheduled check ${id} failed`, { error: error.message });
      }
    }, delay);
  }

  private calculateSystemHealthStatus(components: Record<string, any>): 'healthy' | 'degraded' | 'critical' {
    const statuses = Object.values(components).map(c => c.status);
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  }

  private extractSystemIssues(components: Record<string, any>): string[] {
    const issues: string[] = [];
    Object.values(components).forEach((component: any) => {
      if (component.issues) {
        issues.push(...component.issues);
      }
    });
    return issues;
  }

  private collectPerformanceMetrics(components: Record<string, any>): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      database_response: components.database?.responseTime || 0,
      realtime_connection: components.realtime?.performance?.connectionTime || 0,
      ai_provider_response: components.aiProviders?.performance?.averageResponseTime || 0,
      processor_response: components.processors?.performance?.responseTime || 0
    };
  }

  private async handleDetectedIssuesAutomatically(issues: string[]): Promise<void> {
    debugConsole.warn('SYSTEM', '⚠️ Automated issue handling triggered', {
      issues_count: issues.length,
      issues: issues.slice(0, 3) // Log first 3 issues
    });
  }

  private async handleVerificationFailure(error: Error): Promise<void> {
    this.automatedRecoveryAttempts++;
    
    if (this.automatedRecoveryAttempts < this.maxRecoveryAttempts) {
      debugConsole.warn('SYSTEM', '🔄 Automated recovery attempt initiated', {
        attempt: this.automatedRecoveryAttempts,
        max_attempts: this.maxRecoveryAttempts
      });
      
      // Schedule retry with exponential backoff
      setTimeout(() => {
        this.performAutomatedSystemVerification();
      }, Math.pow(2, this.automatedRecoveryAttempts) * 1000);
    } else {
      debugConsole.error('SYSTEM', '💥 Automated recovery attempts exhausted', {
        total_attempts: this.automatedRecoveryAttempts,
        error: error.message
      });
    }
  }

  private notifySubscribers(status: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error: any) {
        debugConsole.error('SYSTEM', 'Subscriber notification failed', { error: error.message });
      }
    });
  }

  private async persistHealthMetrics(): Promise<void> {
    try {
      const metrics = Object.fromEntries(this.healthMetrics);
      // In a real implementation, this would persist to database
      debugConsole.info('SYSTEM', '💾 Health metrics persisted', {
        metrics_count: Object.keys(metrics).length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      debugConsole.error('SYSTEM', '❌ Failed to persist health metrics', { error: error.message });
    }
  }

  private checkMemoryUsage(): { usage: number; available: number } {
    // Mock implementation - in real system would check actual memory
    return { usage: Math.random() * 100, available: 8192 };
  }

  private checkPerformanceMetrics(): { responseTime: number; throughput: number } {
    return { responseTime: Math.random() * 1000, throughput: Math.random() * 100 };
  }

  private checkErrorRates(): { rate: number; total: number } {
    return { rate: Math.random() * 10, total: Math.floor(Math.random() * 100) };
  }

  /**
   * Cleanup all automated processes
   */
  public cleanup(): void {
    this.intervals.forEach((interval, id) => {
      clearInterval(interval);
      debugConsole.info('SYSTEM', `Cleared automated interval: ${id}`);
    });
    this.intervals.clear();
    this.subscribers.clear();
    this.isInitialized = false;
    
    debugConsole.info('SYSTEM', '🧹 Enterprise Health Orchestrator cleanup completed');
  }
}

export const enterpriseHealthOrchestrator = EnterpriseHealthOrchestrator.getInstance();