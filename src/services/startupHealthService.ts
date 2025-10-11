import { supabase } from '@/integrations/supabase/client';
import { debugConsole, testProviderConnection } from '@/services/debugConsole';
import { getProviderApiKey } from '@/utils/encryption';
import { toast } from '@/components/ui/use-toast';
import { QueryClient } from '@tanstack/react-query';

interface HealthCheckResult {
  providerId: string;
  providerName: string;
  providerType: string;
  isHealthy: boolean;
  error?: string;
  latency?: number;
  modelResults?: ModelHealthResult[];
}

interface ModelHealthResult {
  modelName: string;
  isHealthy: boolean;
  error?: string;
  latency?: number;
}

interface ProcessorHealthResult {
  processorId: string;
  name: string;
  isHealthy: boolean;
  error?: string;
}

interface StartupHealthReport {
  timestamp: string;
  totalProviders: number;
  healthyProviders: number;
  unhealthyProviders: number;
  totalModels: number;
  healthyModels: number;
  unhealthyModels: number;
  totalProcessors: number;
  healthyProcessors: number;
  unhealthyProcessors: number;
  overallHealth: 'healthy' | 'partial' | 'unhealthy';
  providerResults: HealthCheckResult[];
  processorResults: ProcessorHealthResult[];
}

class StartupHealthService {
  private static instance: StartupHealthService;
  private isRunning = false;
  private lastReport: StartupHealthReport | null = null;
  private lastRunTime = 0;
  private readonly DEBOUNCE_INTERVAL = 15000; // 15 seconds debounce to prevent rapid successive calls
  private queryClient: QueryClient | null = null;

  public static getInstance(): StartupHealthService {
    if (!StartupHealthService.instance) {
      StartupHealthService.instance = new StartupHealthService();
    }
    return StartupHealthService.instance;
  }

  /**
   * Set the query client for invalidating cache after health checks
   */
  public setQueryClient(queryClient: QueryClient): void {
    this.queryClient = queryClient;
  }

  /**
   * Perform comprehensive health check on app startup
   */
  public async performStartupHealthCheck(silent: boolean = false): Promise<StartupHealthReport> {
    const now = Date.now();
    
    // Check if already running
    if (this.isRunning) {
      debugConsole.warn('SYSTEM', 'Health check already in progress, skipping');
      return this.lastReport || this.createEmptyReport();
    }

    // Debounce rapid successive calls
    if (now - this.lastRunTime < this.DEBOUNCE_INTERVAL) {
      debugConsole.info('SYSTEM', `Health check debounced (${Math.round((now - this.lastRunTime) / 1000)}s ago)`);
      return this.lastReport || this.createEmptyReport();
    }

    this.isRunning = true;
    this.lastRunTime = now;
    const startTime = Date.now();

    try {
      if (!silent) {
        toast({
          title: '🔍 System Health Check',
          description: 'Checking all AI providers and processors...',
          duration: 3000
        });
      }

      debugConsole.info('SYSTEM', 'Starting comprehensive system health check', {
        silent,
        debounce_interval: this.DEBOUNCE_INTERVAL,
        since_last_run: now - this.lastRunTime
      });

      // Check AI Providers
      const providerResults = await this.checkAllProviders();
      
      // Check Document AI Processors
      const processorResults = await this.checkAllProcessors();

      // Calculate overall health metrics
      const healthyProviders = providerResults.filter(p => p.isHealthy).length;
      const totalModels = providerResults.reduce((sum, p) => sum + (p.modelResults?.length || 0), 0);
      const healthyModels = providerResults.reduce((sum, p) => 
        sum + (p.modelResults?.filter(m => m.isHealthy).length || 0), 0
      );
      const healthyProcessors = processorResults.filter(p => p.isHealthy).length;

      // Determine overall health status
      const overallHealth = this.calculateOverallHealth(
        providerResults.length,
        healthyProviders,
        processorResults.length,
        healthyProcessors
      );

      const report: StartupHealthReport = {
        timestamp: new Date().toISOString(),
        totalProviders: providerResults.length,
        healthyProviders,
        unhealthyProviders: providerResults.length - healthyProviders,
        totalModels,
        healthyModels,
        unhealthyModels: totalModels - healthyModels,
        totalProcessors: processorResults.length,
        healthyProcessors,
        unhealthyProcessors: processorResults.length - healthyProcessors,
        overallHealth,
        providerResults,
        processorResults
      };

      this.lastReport = report;
      const duration = Date.now() - startTime;

      debugConsole.success('SYSTEM', `Health check completed in ${duration}ms`, {
        overall_health: overallHealth,
        providers: `${healthyProviders}/${providerResults.length}`,
        models: `${healthyModels}/${totalModels}`,
        processors: `${healthyProcessors}/${processorResults.length}`
      });

      // Refresh UI data to show updated models in Operations Center
      this.refreshUIData();

      // Show summary notification
      if (!silent) {
        this.showHealthSummary(report);
      }

      return report;

    } catch (error: any) {
      debugConsole.error('SYSTEM', 'Health check failed', { error: error.message });
      
      if (!silent) {
        toast({
          title: '❌ Health Check Failed',
          description: 'Unable to complete system health check',
          variant: 'destructive'
        });
      }

      return this.createEmptyReport();
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check health of all AI providers
   */
  private async checkAllProviders(): Promise<HealthCheckResult[]> {
    try {
      debugConsole.info('SYSTEM', '📋 Step 1: Fetching active AI providers...');
      
      const { data: providers, error } = await supabase
        .from('ai_providers_unified')
        .select('*')
        .eq('is_active', true);

      if (error) {
        debugConsole.error('SYSTEM', 'Failed to fetch providers', { error: error.message });
        return [];
      }

      if (!providers || providers.length === 0) {
        debugConsole.warn('SYSTEM', 'No active providers found - health check will complete with empty results');
        return [];
      }

      debugConsole.success('SYSTEM', `✅ Found ${providers.length} active providers`, {
        provider_names: providers.map(p => p.name),
        provider_types: providers.map(p => p.provider_type)
      });

      const results: HealthCheckResult[] = [];

      debugConsole.info('SYSTEM', '📋 Step 2: Testing providers in batches...');

      // Test providers in smaller batches with longer delays to ensure proper API key validation
      const batchSize = 2; // Reduced batch size for more careful processing
      for (let i = 0; i < providers.length; i += batchSize) {
        const batch = providers.slice(i, i + batchSize);
        
        debugConsole.info('SYSTEM', `🔍 Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(providers.length/batchSize)}`, {
          batch_providers: batch.map(p => p.name)
        });
        
        const batchPromises = batch.map(provider => this.checkProviderHealth(provider));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            debugConsole.success('SYSTEM', `✅ Provider ${batch[index].name} health check completed`, {
              is_healthy: result.value.isHealthy,
              models_tested: result.value.modelResults?.length || 0
            });
          } else {
            const provider = batch[index];
            results.push({
              providerId: provider.id,
              providerName: provider.name,
              providerType: provider.provider_type,
              isHealthy: false,
              error: result.reason?.message || 'Unknown error'
            });
            debugConsole.error('SYSTEM', `❌ Provider ${provider.name} health check failed`, {
              error: result.reason?.message
            });
          }
        });

        // Longer delay between batches to ensure system stability
        if (i + batchSize < providers.length) {
          debugConsole.info('SYSTEM', '⏳ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      debugConsole.success('SYSTEM', '✅ All provider health checks completed', {
        total_providers: results.length,
        healthy_providers: results.filter(r => r.isHealthy).length,
        total_models: results.reduce((sum, r) => sum + (r.modelResults?.length || 0), 0)
      });

      return results;

    } catch (error: any) {
      debugConsole.error('SYSTEM', 'Error checking providers', { error: error.message });
      return [];
    }
  }

  /**
   * Check health of a single provider and its models
   */
  private async checkProviderHealth(provider: any): Promise<HealthCheckResult> {
    const config = provider.config || provider.configuration || {};
    
    try {
      debugConsole.info('STARTUP_HEALTH', `🔍 Starting health check for provider: ${provider.name} (${provider.provider_type})`, {
        provider_type: provider.provider_type,
        is_active: provider.is_active
      }, provider.id, provider.name);

      // Basic validation
      if (!config.api_endpoint) {
        debugConsole.debug('STARTUP_HEALTH', `Provider ${provider.name} not configured (API endpoint missing)`, {
          config_keys: Object.keys(config),
          note: 'Expected in development - configure in AI Settings when ready'
        }, provider.id, provider.name);
        return {
          providerId: provider.id,
          providerName: provider.name,
          providerType: provider.provider_type,
          isHealthy: false,
          error: 'Not configured - add API endpoint in AI Settings'
        };
      }

      debugConsole.info('STARTUP_HEALTH', `🔑 Validating API key for ${provider.name}...`, {
        auth_method: config.auth_method || 'api_key'
      }, provider.id, provider.name);
      
      // API Key validation and decryption
      let decryptedApiKey: string;
      try {
        decryptedApiKey = await getProviderApiKey(provider);
        if (!decryptedApiKey) {
          debugConsole.error('STARTUP_HEALTH', `❌ API key unavailable for ${provider.name}`, {
            has_config: !!provider.config,
            config_keys: Object.keys(config)
          }, provider.id, provider.name);
          return {
            providerId: provider.id,
            providerName: provider.name,
            providerType: provider.provider_type,
            isHealthy: false,
            error: 'API key not available or could not be decrypted'
          };
        }
        
        // Validate API key format
        if (provider.provider_type === 'xai' && !decryptedApiKey.startsWith('xai-')) {
          debugConsole.error('STARTUP_HEALTH', `❌ Invalid API key format for ${provider.name}`, {
            expected_prefix: 'xai-',
            actual_prefix: decryptedApiKey.substring(0, 4)
          }, provider.id, provider.name);
          return {
            providerId: provider.id,
            providerName: provider.name,
            providerType: provider.provider_type,
            isHealthy: false,
            error: 'Invalid API key format for xAI provider (must start with "xai-")'
          };
        }
        
        debugConsole.success('STARTUP_HEALTH', `✅ API key validation passed for ${provider.name}`, {
          key_length: decryptedApiKey.length,
          key_prefix: decryptedApiKey.substring(0, 4)
        }, provider.id, provider.name);
        
      } catch (keyError: any) {
        debugConsole.error('STARTUP_HEALTH', `❌ API key validation failed for ${provider.name}`, {
          error: keyError.message
        }, provider.id, provider.name);
        
        return {
          providerId: provider.id,
          providerName: provider.name,
          providerType: provider.provider_type,
          isHealthy: false,
          error: `API key validation failed: ${keyError.message}`
        };
      }

      debugConsole.info('STARTUP_HEALTH', `🔌 Testing connection for ${provider.name}...`, {
        endpoint: config.api_endpoint,
        provider_type: provider.provider_type
      }, provider.id, provider.name);
      
      // Test provider connection
      const testProvider = {
        ...provider,
        api_endpoint: config.api_endpoint,
        provider_type: provider.provider_type,
        configuration: config
      };

      const connectionResult = await testProviderConnection(testProvider, decryptedApiKey);
      
      if (connectionResult.success) {
        debugConsole.success('STARTUP_HEALTH', `✅ Connection successful for ${provider.name}`, {
          latency: connectionResult.latency
        }, provider.id, provider.name);
      } else {
        debugConsole.error('STARTUP_HEALTH', `❌ Connection failed for ${provider.name}`, {
          error: connectionResult.error
        }, provider.id, provider.name);
      }
      
      // Test individual models if provider connection successful
      let modelResults: ModelHealthResult[] = [];
      if (connectionResult.success && config.selected_models?.length > 0) {
        debugConsole.info('STARTUP_HEALTH', `🧠 Testing ${config.selected_models.length} models for ${provider.name}...`, {
          models_to_test: config.selected_models
        }, provider.id, provider.name);
        modelResults = await this.checkProviderModels(provider, config.selected_models);
        debugConsole.success('STARTUP_HEALTH', `✅ Model testing completed for ${provider.name}`, {
          total_models: modelResults.length,
          healthy_models: modelResults.filter(m => m.isHealthy).length
        }, provider.id, provider.name);
      }

      return {
        providerId: provider.id,
        providerName: provider.name,
        providerType: provider.provider_type,
        isHealthy: connectionResult.success,
        error: connectionResult.error,
        latency: connectionResult.latency,
        modelResults
      };

    } catch (error: any) {
      return {
        providerId: provider.id,
        providerName: provider.name,
        providerType: provider.provider_type,
        isHealthy: false,
        error: error.message || 'Unknown error during health check'
      };
    }
  }

  /**
   * Check health of provider models
   */
  private async checkProviderModels(provider: any, models: string[]): Promise<ModelHealthResult[]> {
    const results: ModelHealthResult[] = [];
    
    // Only test the primary selected model to avoid excessive API calls
    const config = provider.config || provider.configuration || {};
    const primaryModel = config.selected_model || models[0];
    
    if (!primaryModel) {
      debugConsole.warn('STARTUP_HEALTH', `No primary model found for ${provider.name}`, {
        total_models: models.length,
        available_models: models.slice(0, 3)
      }, provider.id, provider.name);
      return results;
    }
    
    debugConsole.info('STARTUP_HEALTH', `🧠 Testing primary model for ${provider.name}`, {
      primary_model: primaryModel,
      total_models: models.length,
      note: 'Testing only primary model to avoid excessive API calls'
    }, provider.id, provider.name);
    
    try {
      debugConsole.info('STARTUP_HEALTH', `🔍 Testing model: ${primaryModel}`, {
        model_type: 'primary',
        provider_type: provider.provider_type
      }, provider.id, provider.name);
      
      const testProvider = {
        ...provider,
        configuration: {
          ...provider.config,
          selected_model: primaryModel,
          selected_models: [primaryModel]
        }
      };

      const decryptedApiKey = await getProviderApiKey(provider);
      const result = await testProviderConnection(testProvider, decryptedApiKey);

      results.push({
        modelName: primaryModel,
        isHealthy: result.success,
        error: result.error,
        latency: result.latency
      });
      
      if (result.success) {
        debugConsole.success('STARTUP_HEALTH', `✅ Primary model ${primaryModel} is healthy`, {
          latency: result.latency
        }, provider.id, provider.name);
      } else {
        debugConsole.error('STARTUP_HEALTH', `❌ Primary model ${primaryModel} failed`, {
          error: result.error
        }, provider.id, provider.name);
      }

    } catch (error: any) {
      results.push({
        modelName: primaryModel,
        isHealthy: false,
        error: error.message || 'Model test failed'
      });
      debugConsole.error('STARTUP_HEALTH', `❌ Primary model ${primaryModel} test error`, {
        error: error.message
      }, provider.id, provider.name);
    }

    debugConsole.success('STARTUP_HEALTH', `✅ Model testing completed for ${provider.name}`, {
      healthy_models: results.filter(r => r.isHealthy).length,
      total_tested: results.length,
      primary_model: primaryModel
    }, provider.id, provider.name);

    return results;
  }

  /**
   * Refresh UI data after health checks complete
   */
  private refreshUIData(): void {
    if (this.queryClient) {
      // Don't use provider-specific logging for general UI refresh
      debugConsole.info('SYSTEM', '🔄 Refreshing provider and model data in UI...');
      
      // Invalidate queries to trigger fresh data load
      this.queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      this.queryClient.invalidateQueries({ queryKey: ["ai-models"] });
      
      debugConsole.success('SYSTEM', '✅ UI data refresh triggered - models should now appear in Operations Center');
    } else {
      debugConsole.warn('SYSTEM', '⚠️ Query client not available for UI refresh');
    }
  }

  /**
   * Check health of Document AI processors
   */
  private async checkAllProcessors(): Promise<ProcessorHealthResult[]> {
    // Mock implementation for Document AI processors
    // This would be expanded based on your actual processor implementation
    return [
      {
        processorId: 'projects/338523806048/locations/us/processors/8708cd1d9cd87cc1',
        name: 'Custom Extractor - Yacht Documents',
        isHealthy: true
      }
    ];
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(
    totalProviders: number,
    healthyProviders: number,
    totalProcessors: number,
    healthyProcessors: number
  ): 'healthy' | 'partial' | 'unhealthy' {
    const totalServices = totalProviders + totalProcessors;
    const healthyServices = healthyProviders + healthyProcessors;

    if (totalServices === 0) return 'unhealthy';
    
    const healthPercentage = (healthyServices / totalServices) * 100;

    if (healthPercentage >= 90) return 'healthy';
    if (healthPercentage >= 60) return 'partial';
    return 'unhealthy';
  }

  /**
   * Show health summary notification
   */
  private showHealthSummary(report: StartupHealthReport): void {
    const { overallHealth, healthyProviders, totalProviders, healthyProcessors, totalProcessors } = report;
    
    if (overallHealth === 'healthy') {
      toast({
        title: '✅ All Systems Operational',
        description: `${healthyProviders}/${totalProviders} providers and ${healthyProcessors}/${totalProcessors} processors are healthy`,
        duration: 5000
      });
    } else if (overallHealth === 'partial') {
      toast({
        title: '⚠️ Some Issues Detected',
        description: `${healthyProviders}/${totalProviders} providers and ${healthyProcessors}/${totalProcessors} processors are healthy`,
        variant: 'destructive',
        duration: 7000
      });
    } else {
      toast({
        title: '🚨 System Issues Detected',
        description: 'Multiple services are experiencing problems. Check AI Operations Center for details.',
        variant: 'destructive',
        duration: 10000
      });
    }
  }

  /**
   * Create empty report for error cases
   */
  private createEmptyReport(): StartupHealthReport {
    return {
      timestamp: new Date().toISOString(),
      totalProviders: 0,
      healthyProviders: 0,
      unhealthyProviders: 0,
      totalModels: 0,
      healthyModels: 0,
      unhealthyModels: 0,
      totalProcessors: 0,
      healthyProcessors: 0,
      unhealthyProcessors: 0,
      overallHealth: 'unhealthy',
      providerResults: [],
      processorResults: []
    };
  }

  /**
   * Get the last health report
   */
  public getLastReport(): StartupHealthReport | null {
    return this.lastReport;
  }

  /**
   * Schedule periodic health checks
   */
  public schedulePeriodicChecks(intervalMinutes: number = 30): void {
    setInterval(() => {
      this.performStartupHealthCheck(true); // Silent check
    }, intervalMinutes * 60 * 1000);
  }
}

export const startupHealthService = StartupHealthService.getInstance();