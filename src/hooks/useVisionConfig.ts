
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type StatusResponse = {
  secretPresent: boolean;
  config: any;
  logs: any[];
};

type CheckUpdatesResponse = {
  ok: boolean;
  version: string;
  revision?: string;
  featuresAvailable: string[];
};

type TestResponse = {
  ok: boolean;
  status?: number;
  latency_ms?: number;
  summary?: string;
  error?: string;
};

type SmartScanSetting = {
  module: string;
  autofill_enabled: boolean;
  ocr_provider: string;
  confidence_threshold: number;
  features: string[];
};

export function useVisionStatus() {
  return useQuery({
    queryKey: ['vision-config', 'status'],
    queryFn: async (): Promise<StatusResponse> => {
      const { data, error } = await supabase.functions.invoke('vision-config', {
        body: { action: 'status' },
      });
      if (error) throw error;
      return data as StatusResponse;
    },
    meta: {
      onError: (err: any) => {
        console.error('Vision status error', err);
      },
    },
  });
}

export function useVisionConfigUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['vision-config', 'update'],
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('vision-config', {
        body: { action: 'config_update', payload },
      });
      if (error) throw error;
      return data;
    },
    meta: {
      onError: (err: any) => {
        console.error('Vision update error', err);
      },
      onSettled: async () => {
        await qc.invalidateQueries({ queryKey: ['vision-config'] });
      },
    },
  });
}

export function useVisionTestConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['vision-config', 'test'],
    mutationFn: async (sampleImageUrl?: string): Promise<TestResponse> => {
      const { data, error } = await supabase.functions.invoke('vision-config', {
        body: { action: 'test_connection', payload: { sampleImageUrl } },
      });
      if (error) throw error;
      return data as TestResponse;
    },
    meta: {
      onError: (err: any) => {
        console.error('Vision test connection error', err);
      },
      onSettled: async () => {
        await qc.invalidateQueries({ queryKey: ['vision-config'] });
      },
    },
  });
}

export function useVisionCheckUpdates() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['vision-config', 'check-updates'],
    mutationFn: async (): Promise<CheckUpdatesResponse> => {
      const { data, error } = await supabase.functions.invoke('vision-config', {
        body: { action: 'check_updates' },
      });
      if (error) throw error;
      return data as CheckUpdatesResponse;
    },
    meta: {
      onError: (err: any) => {
        console.error('Vision check updates error', err);
      },
      onSettled: async () => {
        await qc.invalidateQueries({ queryKey: ['vision-config'] });
      },
    },
  });
}

export function useSmartScanSettings() {
  return useQuery({
    queryKey: ['vision-config', 'smartscan-settings'],
    queryFn: async (): Promise<{ ok: boolean; settings: SmartScanSetting[] }> => {
      const { data, error } = await supabase.functions.invoke('vision-config', {
        body: { action: 'get_smartscan_settings' },
      });
      if (error) throw error;
      return data as any;
    },
    meta: {
      onError: (err: any) => {
        console.error('SmartScan settings error', err);
      },
    },
  });
}

export function useSaveSmartScanSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['vision-config', 'smartscan-save'],
    mutationFn: async (settings: SmartScanSetting[]) => {
      const { data, error } = await supabase.functions.invoke('vision-config', {
        body: { action: 'save_smartscan_settings', payload: { settings } },
      });
      if (error) throw error;
      return data;
    },
    meta: {
      onError: (err: any) => {
        console.error('SmartScan save error', err);
      },
      onSettled: async () => {
        await qc.invalidateQueries({ queryKey: ['vision-config'] });
        await qc.invalidateQueries({ queryKey: ['vision-config', 'smartscan-settings'] });
      },
    },
  });
}
