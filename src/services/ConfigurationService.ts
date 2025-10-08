/**
 * SmartScan Configuration Service
 * Manages configuration state across the entire application with real-time synchronization
 */

import { supabase } from '@/integrations/supabase/client';

// Configuration interfaces
export interface SmartScanConfiguration {
  id?: string;
  // API Configuration
  geminiApiKey?: string;
  googleCloudProjectId?: string;
  documentAiApiKey?: string;
  vertexAiLocation?: string;
  processorId?: string;
  openaiApiKey?: string;
  
  // Processing Settings
  confidenceThreshold: number;
  maxRetries: number;
  timeoutDuration: number;
  enableBatchProcessing: boolean;
  batchSize: number;
  enableCaching: boolean;
  cacheExpiration: number;
  
  // AI Model Settings
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
  enableChainOfThought: boolean;
  accuracyLevel: 'standard' | 'high' | 'maximum';
  
  // Security Settings
  enableEncryption: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
  enableAuditLogging: boolean;
  
  // Module Settings
  moduleConfigurations: ModuleConfiguration[];
  
  // Metadata
  isConfigured: boolean;
  setupCompleted: boolean;
  lastUpdated: Date;
  version: string;
}

export interface ModuleConfiguration {
  module: string;
  enabled: boolean;
  autofillEnabled: boolean;
  confidenceThreshold: number;
  features: string[];
}

export interface ConfigurationValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completionPercentage: number;
}

// Configuration change listener type
type ConfigurationListener = (config: SmartScanConfiguration) => void;

class ConfigurationService {
  private static instance: ConfigurationService;
  private configuration: SmartScanConfiguration;
  private listeners: Set<ConfigurationListener> = new Set();
  private isInitialized = false;
  
  private constructor() {
    this.configuration = this.getDefaultConfiguration();
    this.initializeConfiguration();
  }

  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  /**
   * Get default configuration values
   */
  private getDefaultConfiguration(): SmartScanConfiguration {
    return {
      // Processing Settings
      confidenceThreshold: 0.85,
      maxRetries: 3,
      timeoutDuration: 30,
      enableBatchProcessing: true,
      batchSize: 10,
      enableCaching: true,
      cacheExpiration: 24,
      
      // AI Model Settings
      primaryModel: 'gemini-1.5-pro',
      fallbackModel: 'gemini-1.5-flash',
      temperature: 0.1,
      maxTokens: 4096,
      enableChainOfThought: true,
      accuracyLevel: 'high',
      
      // Security Settings
      enableEncryption: true,
      dataRetentionDays: 90,
      anonymizeData: true,
      enableAuditLogging: true,
      
      // Module Settings
      moduleConfigurations: [
        {
          module: 'equipment',
          enabled: true,
          autofillEnabled: true,
          confidenceThreshold: 0.8,
          features: ['text_detection', 'object_detection', 'barcode_scanning']
        },
        {
          module: 'documents',
          enabled: true,
          autofillEnabled: true,
          confidenceThreshold: 0.9,
          features: ['document_text_detection', 'layout_parsing', 'form_extraction']
        },
        {
          module: 'inventory',
          enabled: true,
          autofillEnabled: false,
          confidenceThreshold: 0.85,
          features: ['text_detection', 'barcode_scanning']
        },
        {
          module: 'maintenance',
          enabled: true,
          autofillEnabled: true,
          confidenceThreshold: 0.8,
          features: ['text_detection', 'damage_detection', 'wear_analysis']
        },
        {
          module: 'compliance',
          enabled: true,
          autofillEnabled: true,
          confidenceThreshold: 0.95,
          features: ['document_text_detection', 'certification_parsing', 'date_extraction']
        }
      ],
      
      // Metadata
      isConfigured: false,
      setupCompleted: false,
      lastUpdated: new Date(),
      version: '1.0.0'
    };
  }

  /**
   * Initialize configuration from localStorage and environment
   */
  private async initializeConfiguration(): Promise<void> {
    try {
      // Load from localStorage
      const localConfig = localStorage.getItem('smartscan_config');
      const setupCompleted = localStorage.getItem('smartscan_setup_completed') === 'true';
      
      if (localConfig) {
        const parsedConfig = JSON.parse(localConfig);
        this.configuration = {
          ...this.configuration,
          ...parsedConfig,
          setupCompleted,
          lastUpdated: new Date(parsedConfig.lastUpdated || new Date())
        };
      }
      
      // Check environment variables for API keys
      this.configuration.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      this.configuration.googleCloudProjectId = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID;
      
      // Determine if fully configured
      this.configuration.isConfigured = this.validateConfiguration().isValid;
      
      // Try to sync with backend if configured
      if (this.configuration.isConfigured) {
        await this.syncWithBackend();
      }
      
      this.isInitialized = true;
      this.notifyListeners();
      
    } catch (error) {
      console.error('Failed to initialize configuration:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): SmartScanConfiguration {
    return { ...this.configuration };
  }

  /**
   * Update configuration
   */
  public async updateConfiguration(
    updates: Partial<SmartScanConfiguration>,
    saveToBackend = true
  ): Promise<void> {
    try {
      // Update configuration
      this.configuration = {
        ...this.configuration,
        ...updates,
        lastUpdated: new Date()
      };
      
      // Validate updated configuration
      const validation = this.validateConfiguration();
      this.configuration.isConfigured = validation.isValid;
      
      // Save to localStorage
      await this.saveToLocalStorage();
      
      // Save to backend if configured and requested
      if (saveToBackend && this.configuration.isConfigured) {
        await this.saveToBackend();
      }
      
      // Notify listeners
      this.notifyListeners();
      
      // Update related app components
      await this.propagateConfigurationChanges();
      
    } catch (error) {
      console.error('Failed to update configuration:', error);
      throw error;
    }
  }

  /**
   * Validate configuration completeness and correctness
   */
  public validateConfiguration(): ConfigurationValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check API configuration
    if (!this.configuration.geminiApiKey) {
      errors.push('Gemini API key is required');
    }
    
    if (!this.configuration.googleCloudProjectId) {
      errors.push('Google Cloud Project ID is required');
    }
    
    // Check processing settings
    if (this.configuration.confidenceThreshold < 0.5 || this.configuration.confidenceThreshold > 1) {
      errors.push('Confidence threshold must be between 0.5 and 1.0');
    }
    
    if (this.configuration.maxRetries < 1 || this.configuration.maxRetries > 10) {
      warnings.push('Max retries should be between 1 and 10');
    }
    
    // Check module configurations
    if (this.configuration.moduleConfigurations.length === 0) {
      warnings.push('No module configurations defined');
    }
    
    // Calculate completion percentage
    const requiredFields = ['geminiApiKey', 'googleCloudProjectId', 'setupCompleted'];
    const completedFields = requiredFields.filter(field => {
      const value = this.configuration[field as keyof SmartScanConfiguration];
      return value !== undefined && value !== null && value !== '';
    });
    
    const completionPercentage = (completedFields.length / requiredFields.length) * 100;
    
    return {
      isValid: errors.length === 0 && completionPercentage === 100,
      errors,
      warnings,
      completionPercentage
    };
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(listener: ConfigurationListener): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current configuration
    if (this.isInitialized) {
      listener(this.getConfiguration());
    }
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Mark setup as completed
   */
  public async completeSetup(): Promise<void> {
    await this.updateConfiguration({
      setupCompleted: true,
      isConfigured: this.validateConfiguration().isValid
    });
    
    localStorage.setItem('smartscan_setup_completed', 'true');
  }

  /**
   * Reset configuration to defaults
   */
  public async resetConfiguration(): Promise<void> {
    this.configuration = this.getDefaultConfiguration();
    await this.saveToLocalStorage();
    localStorage.removeItem('smartscan_setup_completed');
    this.notifyListeners();
  }

  /**
   * Get module-specific configuration
   */
  public getModuleConfiguration(moduleName: string): ModuleConfiguration | null {
    return this.configuration.moduleConfigurations.find(
      config => config.module === moduleName
    ) || null;
  }

  /**
   * Update module-specific configuration
   */
  public async updateModuleConfiguration(
    moduleName: string, 
    updates: Partial<ModuleConfiguration>
  ): Promise<void> {
    const moduleConfigurations = [...this.configuration.moduleConfigurations];
    const index = moduleConfigurations.findIndex(config => config.module === moduleName);
    
    if (index >= 0) {
      moduleConfigurations[index] = { ...moduleConfigurations[index], ...updates };
    } else {
      moduleConfigurations.push({
        module: moduleName,
        enabled: true,
        autofillEnabled: true,
        confidenceThreshold: 0.85,
        features: [],
        ...updates
      });
    }
    
    await this.updateConfiguration({ moduleConfigurations });
  }

  /**
   * Save configuration to localStorage
   */
  private async saveToLocalStorage(): Promise<void> {
    try {
      const configToSave = {
        ...this.configuration,
        // Don't save sensitive API keys to localStorage
        geminiApiKey: undefined,
        documentAiApiKey: undefined,
        openaiApiKey: undefined
      };
      
      localStorage.setItem('smartscan_config', JSON.stringify(configToSave));
    } catch (error) {
      console.error('Failed to save configuration to localStorage:', error);
    }
  }

  /**
   * Save configuration to backend
   */
  private async saveToBackend(): Promise<void> {
    try {
      // Save to Supabase settings table
      const { error } = await supabase
        .from('smartscan_settings')
        .upsert({
          module: 'global',
          autofill_enabled: true,
          ocr_provider: 'google_vision',
          confidence_threshold: this.configuration.confidenceThreshold,
          features: this.configuration.moduleConfigurations.map(m => m.module)
        }, {
          onConflict: 'module'
        });
      
      if (error) {
        console.error('Failed to save to backend:', error);
      }
      
    } catch (error) {
      console.error('Backend save error:', error);
    }
  }

  /**
   * Sync configuration with backend
   */
  private async syncWithBackend(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('smartscan_settings')
        .select('*')
        .eq('module', 'global')
        .single();
      
      if (error || !data) {
        return; // No backend configuration found
      }
      
      // Merge backend configuration with local
      this.configuration = {
        ...this.configuration,
        confidenceThreshold: data.confidence_threshold || this.configuration.confidenceThreshold,
        lastUpdated: new Date()
      };
      
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  }

  /**
   * Propagate configuration changes to related app components
   */
  private async propagateConfigurationChanges(): Promise<void> {
    try {
      // Update vision configuration for all modules
      for (const moduleConfig of this.configuration.moduleConfigurations) {
        await this.updateVisionConfiguration(moduleConfig);
      }
      
      // Trigger custom events for other components
      window.dispatchEvent(new CustomEvent('smartscan:config-updated', {
        detail: this.getConfiguration()
      }));
      
    } catch (error) {
      console.error('Failed to propagate configuration changes:', error);
    }
  }

  /**
   * Update vision configuration for a specific module
   */
  private async updateVisionConfiguration(moduleConfig: ModuleConfiguration): Promise<void> {
    try {
      const { error } = await supabase
        .from('smartscan_settings')
        .upsert({
          module: moduleConfig.module,
          autofill_enabled: moduleConfig.autofillEnabled,
          ocr_provider: 'google_vision',
          confidence_threshold: moduleConfig.confidenceThreshold,
          features: moduleConfig.features
        }, {
          onConflict: 'module'
        });
      
      if (error) {
        console.error(`Failed to update vision config for ${moduleConfig.module}:`, error);
      }
      
    } catch (error) {
      console.error(`Vision config update error for ${moduleConfig.module}:`, error);
    }
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    const config = this.getConfiguration();
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('Configuration listener error:', error);
      }
    });
  }

  /**
   * Test configuration connectivity
   */
  public async testConfiguration(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Test Gemini API
      if (this.configuration.geminiApiKey) {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          headers: {
            'x-goog-api-key': this.configuration.geminiApiKey
          }
        });
        
        if (!response.ok) {
          errors.push(`Gemini API test failed: ${response.status}`);
        }
      }
      
      // Test Supabase connectivity
      const { error: supabaseError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (supabaseError) {
        errors.push(`Supabase test failed: ${supabaseError.message}`);
      }
      
    } catch (error: any) {
      errors.push(`Configuration test error: ${error.message}`);
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const configurationService = ConfigurationService.getInstance();

// Export hook for React components
export function useSmartScanConfiguration() {
  const [configuration, setConfiguration] = React.useState<SmartScanConfiguration | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const unsubscribe = configurationService.subscribe((config) => {
      setConfiguration(config);
      setIsLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return {
    configuration,
    isLoading,
    updateConfiguration: configurationService.updateConfiguration.bind(configurationService),
    validateConfiguration: configurationService.validateConfiguration.bind(configurationService),
    completeSetup: configurationService.completeSetup.bind(configurationService),
    testConfiguration: configurationService.testConfiguration.bind(configurationService)
  };
}

// No React import needed - this is a service file
