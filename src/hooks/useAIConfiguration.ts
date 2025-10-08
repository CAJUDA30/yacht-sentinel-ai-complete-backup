import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIProvider {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
  secret_name: string | null;
  secret_configured: boolean;
  status: string;
  last_checked_at: string | null;
  models_count: number;
  models_endpoint: string | null;
  updated_at: string | null;
}

interface AIServiceConfig {
  id: string;
  service: string;
  provider_id: string | null;
  model_id: string | null;
  enabled: boolean;
  config: any;
  status: string;
  last_test: string | null;
}

interface SecretStatus {
  name: string;
  configured: boolean;
  preview: string;
  last4: string;
  length: number;
}

export const useAIConfiguration = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [services, setServices] = useState<AIServiceConfig[]>([]);
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const [configRes, secretsRes] = await Promise.all([
        supabase.functions.invoke('ai-admin', { body: { action: 'get_config_summary' } }),
        supabase.functions.invoke('ai-admin', { body: { action: 'secrets_status' } })
      ]);

      if (!configRes.error && configRes.data) {
        setProviders(configRes.data.providers || []);
        // Process services from configs
        const processedServices = configRes.data.configs?.map((config: any) => ({
          id: config.id,
          service: config.module,
          provider_id: config.provider_id,
          model_id: config.model_id,
          enabled: config.active,
          config: config.params,
          status: configRes.data.providers?.find((p: any) => p.id === config.provider_id)?.status || 'unknown',
          last_test: configRes.data.providers?.find((p: any) => p.id === config.provider_id)?.last_checked_at
        })) || [];
        setServices(processedServices);
      }

      if (!secretsRes.error && secretsRes.data) {
        setSecrets(secretsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load AI configuration:', error);
      toast({
        title: 'Configuration Load Error',
        description: 'Failed to load AI configuration data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testServiceConnection = async (serviceKey: string) => {
    try {
      const service = services.find(s => s.service === serviceKey);
      if (!service?.provider_id) {
        throw new Error('No provider configured for this service');
      }

      const { data, error } = await supabase.functions.invoke('ai-admin', {
        body: { action: 'test_connection', providerId: service.provider_id }
      });

      if (error) throw error;

      if (data?.connected) {
        toast({
          title: 'Connection Success',
          description: `${serviceKey} connected successfully (${data.latency}ms)`
        });
        await loadConfiguration(); // Refresh data
        return { success: true, latency: data.latency };
      } else {
        throw new Error(data?.details || 'Connection test failed');
      }
    } catch (error) {
      toast({
        title: 'Connection Test Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updateServiceConfig = async (serviceKey: string, config: Partial<AIServiceConfig>) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-admin', {
        body: {
          action: 'update_service_config',
          serviceKey,
          enabled: config.enabled,
          provider_id: config.provider_id,
          model_id: config.model_id,
          config: config.config
        }
      });

      if (error) throw error;

      toast({
        title: 'Configuration Updated',
        description: `${serviceKey} configuration has been updated`
      });

      await loadConfiguration(); // Refresh data
      return { success: true };
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const revealSecret = async (secretName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-admin', {
        body: { action: 'reveal_secret', secretName, reveal: true }
      });

      if (error) throw error;

      return data?.value || '';
    } catch (error) {
      toast({
        title: 'Reveal Error',
        description: `Failed to reveal ${secretName}`,
        variant: 'destructive'
      });
      return '';
    }
  };

  const validateAllServices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-admin', {
        body: { action: 'validate_all_services' }
      });

      if (error) throw error;

      toast({
        title: 'Validation Complete',
        description: `Validated ${data?.results?.length || 0} services`
      });

      await loadConfiguration(); // Refresh data
      return data?.results || [];
    } catch (error) {
      toast({
        title: 'Validation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return [];
    }
  };

  useEffect(() => {
    loadConfiguration();

    // Set up real-time subscriptions for configuration changes
    const channel = supabase
      .channel('ai-config-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_configs' }, () => {
        loadConfiguration();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_providers' }, () => {
        loadConfiguration();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_health' }, () => {
        loadConfiguration();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    providers,
    services,
    secrets,
    loading,
    loadConfiguration,
    testServiceConnection,
    updateServiceConfig,
    revealSecret,
    validateAllServices
  };
};

export default useAIConfiguration;