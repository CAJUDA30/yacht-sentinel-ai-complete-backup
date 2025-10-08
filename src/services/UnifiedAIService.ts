/**
 * UNIFIED AI SERVICE
 * Standardized AI initialization and authentication for all components
 * Prevents duplicate authentication patterns and console spam
 */

import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import SmartScanService, { SmartScanResult, SmartScanRequest } from './SmartScanService';

interface AIServiceConfig {
  processorId: string;
  serviceName: string;
  enableLogging?: boolean;
}

interface AuthenticatedSession {
  user: {
    id: string;
    email: string;
  };
  token: string;
}

class UnifiedAIService {
  private static instance: UnifiedAIService;
  private static isInitialized = false;
  private authenticatedSession: AuthenticatedSession | null = null;
  private configs: Map<string, AIServiceConfig> = new Map();
  private smartScanService: SmartScanService;
  
  // Standard processor configuration
  private static readonly DEFAULT_PROCESSOR = '8708cd1d9cd87cc1';
  private static readonly DEFAULT_CONFIG: AIServiceConfig = {
    processorId: UnifiedAIService.DEFAULT_PROCESSOR,
    serviceName: 'Custom Extractor',
    enableLogging: false
  };

  private constructor() {
    if (UnifiedAIService.instance) {
      return UnifiedAIService.instance;
    }
    this.smartScanService = new SmartScanService();
    UnifiedAIService.instance = this;
  }

  public static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService();
    }
    return UnifiedAIService.instance;
  }

  /**
   * Initialize AI service with standardized authentication
   * Call this once per component that needs AI services
   */
  public async initialize(serviceName: string, customConfig?: Partial<AIServiceConfig>): Promise<boolean> {
    const config: AIServiceConfig = {
      ...UnifiedAIService.DEFAULT_CONFIG,
      serviceName,
      ...customConfig
    };

    // Prevent duplicate initializations
    if (this.configs.has(serviceName)) {
      if (config.enableLogging) {
        console.log(`[UnifiedAI] ${serviceName}: Already initialized`);
      }
      return true;
    }

    try {
      // Single authentication check
      if (!this.authenticatedSession) {
        const session = await this.authenticateUser();
        if (!session) {
          console.warn(`[UnifiedAI] ${serviceName}: Authentication required`);
          return false;
        }
        this.authenticatedSession = session;
      }

      // Register service configuration
      this.configs.set(serviceName, config);

      // Single initialization log
      if (!UnifiedAIService.isInitialized) {
        console.log(`[UnifiedAI] System initialized with processor ${config.processorId}`);
        UnifiedAIService.isInitialized = true;
      }

      if (config.enableLogging) {
        console.log(`[UnifiedAI] ${serviceName}: Ready with ${config.serviceName} (${config.processorId})`);
      }

      return true;
    } catch (error) {
      console.error(`[UnifiedAI] ${serviceName}: Initialization failed:`, error);
      return false;
    }
  }

  /**
   * Get authenticated session for AI processing
   */
  public getAuthenticatedSession(): AuthenticatedSession | null {
    return this.authenticatedSession;
  }

  /**
   * Get processor configuration for a service
   */
  public getProcessorConfig(serviceName: string): AIServiceConfig | null {
    return this.configs.get(serviceName) || null;
  }

  /**
   * Check if a service is initialized
   */
  public isServiceInitialized(serviceName: string): boolean {
    return this.configs.has(serviceName);
  }

  /**
   * Get all registered services
   */
  public getRegisteredServices(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Standard authentication method used by all AI services
   */
  private async authenticateUser(): Promise<AuthenticatedSession | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token || !session?.user) {
        return null;
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email || 'unknown'
        },
        token: session.access_token
      };
    } catch (error) {
      console.error('[UnifiedAI] Authentication error:', error);
      return null;
    }
  }

  /**
   * Refresh authentication if needed
   */
  public async refreshAuthentication(): Promise<boolean> {
    try {
      this.authenticatedSession = null;
      const session = await this.authenticateUser();
      if (session) {
        this.authenticatedSession = session;
        return true;
      }
      return false;
    } catch (error) {
      console.error('[UnifiedAI] Authentication refresh failed:', error);
      return false;
    }
  }

  /**
   * Standard Document AI scanning through unified service
   */
  public async scanDocument(request: SmartScanRequest): Promise<SmartScanResult> {
    if (!this.authenticatedSession) {
      throw new Error('UnifiedAI service not initialized. Call initialize() first.');
    }

    console.log('[UnifiedAI] Processing document scan request');
    return await this.smartScanService.scanDocument(request);
  }

  /**
   * Reset all services (useful for testing)
   */
  public reset(): void {
    this.configs.clear();
    this.authenticatedSession = null;
    UnifiedAIService.isInitialized = false;
  }
}

// Export singleton instance
export const unifiedAIService = UnifiedAIService.getInstance();

// Export types
export type { AIServiceConfig, AuthenticatedSession };