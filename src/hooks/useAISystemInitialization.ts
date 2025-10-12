/**
 * AI System Initialization Hook
 * Ensures AI providers system is always properly set up and functional
 */

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AITableAutoSetup } from '@/services/aiTableAutoSetup';
import { startupHealthService } from '@/services/startupHealthService';
import { debugConsole } from '@/services/debugConsole';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface InitializationState {
  isInitializing: boolean;
  isInitialized: boolean;
  hasError: boolean;
  errorMessage?: string;
  setupResult?: any;
  healthCheckComplete?: boolean;
  healthReport?: any;
}

export function useAISystemInitialization() {
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const [state, setState] = useState<InitializationState>({
    isInitializing: false,
    isInitialized: false,
    hasError: false,
    healthCheckComplete: false
  });

  const initializeSystem = async () => {
    setState(prev => ({ ...prev, isInitializing: true, hasError: false }));

    try {
      debugConsole.info('AI_INIT', '🚀 Starting AI system initialization...');
      
      // Ensure AI tables are set up
      const setupResult = await AITableAutoSetup.ensureSetup();
      
      if (setupResult.success) {
        debugConsole.success('AI_INIT', '✅ AI system setup completed');
        
        // Verify that provider configurations are properly loaded
        const { data: loadedProviders } = await supabase
          .from('ai_providers_with_keys')
          .select('id, name, config, is_active')
          .eq('is_active', true);
        
        if (loadedProviders && loadedProviders.length > 0) {
          debugConsole.success('AI_INIT', `✅ Verified ${loadedProviders.length} provider configurations loaded`, {
            providers: loadedProviders.map(p => ({
              name: p.name,
              has_config: !!(p.config),
              config_size: typeof p.config === 'string' ? p.config.length : JSON.stringify(p.config || {}).length
            }))
          });
        }
        
        setState(prev => ({
          ...prev,
          isInitializing: false,
          isInitialized: true,
          hasError: false,
          setupResult
        }));

        // Show success message only if table was created
        if (setupResult.providersCount !== undefined) {
          toast({
            title: '✅ AI System Ready',
            description: `Initialized with ${setupResult.providersCount} providers`,
            duration: 5000
          });
        }

        // DO NOT run health check here - let useStartupHealthCheck handle it
        // This prevents duplicate executions from multiple sources
        debugConsole.info('AI_INIT', '✅ AI initialization complete, health check will be handled by startup service');
        
      } else {
        debugConsole.warn('AI_INIT', '⚠️ AI system initialization incomplete', { message: setupResult.message });
        setState({
          isInitializing: false,
          isInitialized: false,
          hasError: true,
          errorMessage: setupResult.message,
          setupResult,
          healthCheckComplete: false
        });

        // Show appropriate error message
        if (setupResult.error === 'TABLE_MISSING_MANUAL_SETUP_REQUIRED') {
          toast({
            title: '🚨 Manual Database Setup Required',
            description: 'AI providers table missing. Check URGENT_DATABASE_FIX.md for instructions.',
            variant: 'destructive',
            duration: 15000
          });
        } else {
          toast({
            title: '⚠️ AI System Setup Issue',
            description: setupResult.message,
            variant: 'destructive',
            duration: 10000
          });
        }
      }
    } catch (error: any) {
      debugConsole.error('AI_INIT', '❌ AI system initialization failed', { error: error.message });
      setState({
        isInitializing: false,
        isInitialized: false,
        hasError: true,
        errorMessage: error.message,
        healthCheckComplete: false
      });

      toast({
        title: '❌ Initialization Failed',
        description: 'AI provider system could not be initialized',
        variant: 'destructive',
        duration: 10000
      });
    }
  };

  const retryInitialization = async () => {
    await initializeSystem();
  };

  const resetInitialization = () => {
    AITableAutoSetup.resetSetupState();
    setState({
      isInitializing: false,
      isInitialized: false,
      hasError: false,
      healthCheckComplete: false
    });
  };

  useEffect(() => {
    // IMPORTANT: Only initialize AI system AFTER user is authenticated
    if (!isAuthenticated || authLoading) {
      debugConsole.info('SYSTEM', '⏳ Waiting for AI system to be ready', {
        enabled: true,
        loading: authLoading,
        aiInitializing: state.isInitializing,
        aiInitialized: state.isInitialized
      });
      return;
    }
    
    // User is authenticated, safe to initialize AI system
    initializeSystem();
  }, [isAuthenticated, authLoading]); // Run when auth state changes

  return {
    ...state,
    retryInitialization,
    resetInitialization
  };
}