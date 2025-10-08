import { supabase } from "@/integrations/supabase/client";

// =============================================
// SIMPLIFIED SETTINGS MANAGEMENT FOR PHASE 1
// Uses analytics_events temporarily until proper tables are created
// =============================================

export interface SimpleUserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisible: boolean;
    dataCollection: boolean;
    analytics: boolean;
  };
}

export interface SimpleSystemSettings {
  maintenance: boolean;
  registration: boolean;
  maxFileSize: number; // MB
  sessionTimeout: number; // minutes
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
}

// Default settings
export const DEFAULT_USER_SETTINGS: SimpleUserSettings = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    profileVisible: true,
    dataCollection: false,
    analytics: false
  }
};

export const DEFAULT_SYSTEM_SETTINGS: SimpleSystemSettings = {
  maintenance: false,
  registration: true,
  maxFileSize: 10,
  sessionTimeout: 30,
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 100,
    burstLimit: 20
  }
};

// Simple settings service using analytics_events
export class SimpleSettingsService {
  // Get user settings
  static async getUserSettings(userId: string): Promise<SimpleUserSettings> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('metadata')
        .eq('user_id', userId)
        .eq('event_type', 'user_settings')
        .eq('module', 'settings')
        .single();

      if (error || !data?.metadata) {
        return DEFAULT_USER_SETTINGS;
      }

      return { ...DEFAULT_USER_SETTINGS, ...(data.metadata as any) };
    } catch (error) {
      console.warn('Failed to get user settings:', error);
      return DEFAULT_USER_SETTINGS;
    }
  }

  // Set user settings
  static async setUserSettings(userId: string, settings: Partial<SimpleUserSettings>): Promise<void> {
    try {
      const currentSettings = await this.getUserSettings(userId);
      const updatedSettings = { ...currentSettings, ...settings };

      await supabase
        .from('analytics_events')
        .upsert({
          user_id: userId,
          event_type: 'user_settings',
          event_message: 'User settings updated',
          module: 'settings',
          severity: 'info',
          metadata: updatedSettings
        });
    } catch (error) {
      console.error('Failed to set user settings:', error);
      throw error;
    }
  }

  // Get system settings (admin only)
  static async getSystemSettings(): Promise<SimpleSystemSettings> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('metadata')
        .eq('event_type', 'system_settings')
        .eq('module', 'settings')
        .single();

      if (error || !data?.metadata) {
        return DEFAULT_SYSTEM_SETTINGS;
      }

      return { ...DEFAULT_SYSTEM_SETTINGS, ...(data.metadata as any) };
    } catch (error) {
      console.warn('Failed to get system settings:', error);
      return DEFAULT_SYSTEM_SETTINGS;
    }
  }

  // Set system settings (admin only)
  static async setSystemSettings(settings: Partial<SimpleSystemSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSystemSettings();
      const updatedSettings = { ...currentSettings, ...settings };

      await supabase
        .from('analytics_events')
        .upsert({
          event_type: 'system_settings',
          event_message: 'System settings updated',
          module: 'settings',
          severity: 'info',
          metadata: updatedSettings
        });
    } catch (error) {
      console.error('Failed to set system settings:', error);
      throw error;
    }
  }

  // Initialize system settings if they don't exist
  static async initializeSystemSettings(): Promise<void> {
    try {
      const { data } = await supabase
        .from('analytics_events')
        .select('id')
        .eq('event_type', 'system_settings')
        .eq('module', 'settings')
        .single();

      if (!data) {
        await this.setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
      }
    } catch (error) {
      // If no settings exist, create them
      await this.setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
    }
  }
}