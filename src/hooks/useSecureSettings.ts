import { useState, useEffect } from 'react';
import { SettingsService, SETTINGS_REGISTRY } from '@/lib/settings';
import { useSupabaseAuth } from './useSupabaseAuth';

// =============================================
// SECURE SETTINGS HOOK - PHASE 1
// Centralized settings management with security
// =============================================

export interface UseSecureSettingsReturn {
  getSetting: <T = any>(key: string) => Promise<T>;
  setSetting: (key: string, value: any) => Promise<boolean>;
  getSettings: (keys: string[]) => Promise<Record<string, any>>;
  clearCache: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useSecureSettings(): UseSecureSettingsReturn {
  const { user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSetting = async <T = any>(key: string): Promise<T> => {
    if (!SETTINGS_REGISTRY[key]) {
      setError(`Unknown setting: ${key}`);
      return SETTINGS_REGISTRY[key]?.defaultValue as T;
    }

    setIsLoading(true);
    setError(null);

    try {
      const value = await SettingsService.get<T>(key, user?.id);
      return value;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get setting';
      setError(message);
      return SETTINGS_REGISTRY[key]?.defaultValue as T;
    } finally {
      setIsLoading(false);
    }
  };

  const setSetting = async (key: string, value: any): Promise<boolean> => {
    const definition = SETTINGS_REGISTRY[key];
    if (!definition) {
      setError(`Unknown setting: ${key}`);
      return false;
    }

    // Check permissions
    if (definition.adminOnly && !user) {
      setError('Admin access required');
      return false;
    }

    if (definition.category === 'user' && !user) {
      setError('User must be logged in');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await SettingsService.set(key, value, user?.id);
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set setting';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getSettings = async (keys: string[]): Promise<Record<string, any>> => {
    setIsLoading(true);
    setError(null);

    try {
      const settings = await SettingsService.getMany(keys, user?.id);
      return settings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get settings';
      setError(message);
      // Return defaults on error
      const defaults: Record<string, any> = {};
      keys.forEach(key => {
        defaults[key] = SETTINGS_REGISTRY[key]?.defaultValue;
      });
      return defaults;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = () => {
    SettingsService.clearCache();
  };

  return {
    getSetting,
    setSetting,
    getSettings,
    clearCache,
    isLoading,
    error
  };
}

// =============================================
// SETTINGS CATEGORY HOOKS
// =============================================

export function useUserSettings() {
  const settings = useSecureSettings();
  const userKeys = Object.keys(SETTINGS_REGISTRY).filter(key => 
    SETTINGS_REGISTRY[key].category === 'user'
  );

  const getUserSettings = () => settings.getSettings(userKeys);
  
  return {
    ...settings,
    getUserSettings
  };
}

export function useSystemSettings() {
  const settings = useSecureSettings();
  const systemKeys = Object.keys(SETTINGS_REGISTRY).filter(key => 
    SETTINGS_REGISTRY[key].adminOnly
  );

  const getSystemSettings = () => settings.getSettings(systemKeys);
  
  return {
    ...settings,
    getSystemSettings
  };
}

export function useAISettings() {
  const settings = useSecureSettings();
  const aiKeys = Object.keys(SETTINGS_REGISTRY).filter(key => 
    SETTINGS_REGISTRY[key].category === 'ai'
  );

  const getAISettings = () => settings.getSettings(aiKeys);
  
  return {
    ...settings,
    getAISettings
  };
}