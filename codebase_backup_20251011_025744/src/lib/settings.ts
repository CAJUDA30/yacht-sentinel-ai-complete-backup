import { supabase } from "@/integrations/supabase/client";

// =============================================
// CENTRALIZED SETTINGS MANAGEMENT - PHASE 1 COMPLETE
// Now using dedicated user_settings and system_settings tables
// =============================================

export type SettingCategory = 'user' | 'system' | 'ai' | 'security' | 'module';

export interface SettingDefinition {
  key: string;
  category: SettingCategory;
  defaultValue: any;
  description: string;
  adminOnly: boolean;
  encrypted: boolean;
  validation?: (value: any) => boolean;
}

// =============================================
// SETTINGS REGISTRY
// =============================================

export const SETTINGS_REGISTRY: Record<string, SettingDefinition> = {
  // User Settings
  'user.theme': {
    key: 'user.theme',
    category: 'user',
    defaultValue: 'system',
    description: 'Application theme preference',
    adminOnly: false,
    encrypted: false,
    validation: (value) => ['light', 'dark', 'system'].includes(value)
  },
  'user.language': {
    key: 'user.language',
    category: 'user',
    defaultValue: 'en',
    description: 'User interface language',
    adminOnly: false,
    encrypted: false
  },
  'user.timezone': {
    key: 'user.timezone',
    category: 'user',
    defaultValue: 'UTC',
    description: 'User timezone',
    adminOnly: false,
    encrypted: false
  },
  'user.notifications.email': {
    key: 'user.notifications.email',
    category: 'user',
    defaultValue: true,
    description: 'Email notifications enabled',
    adminOnly: false,
    encrypted: false
  },
  'user.notifications.push': {
    key: 'user.notifications.push',
    category: 'user',
    defaultValue: true,
    description: 'Push notifications enabled',
    adminOnly: false,
    encrypted: false
  },
  'user.privacy.profileVisible': {
    key: 'user.privacy.profileVisible',
    category: 'user',
    defaultValue: true,
    description: 'Profile visibility to other users',
    adminOnly: false,
    encrypted: false
  },

  // System Settings (Admin Only)
  'system.maintenance': {
    key: 'system.maintenance',
    category: 'system',
    defaultValue: false,
    description: 'Maintenance mode enabled',
    adminOnly: true,
    encrypted: false
  },
  'system.registration': {
    key: 'system.registration',
    category: 'system',
    defaultValue: true,
    description: 'User registration enabled',
    adminOnly: true,
    encrypted: false
  },
  'system.maxFileSize': {
    key: 'system.maxFileSize',
    category: 'system',
    defaultValue: 10,
    description: 'Maximum file upload size (MB)',
    adminOnly: true,
    encrypted: false,
    validation: (value) => typeof value === 'number' && value > 0 && value <= 100
  },
  'system.sessionTimeout': {
    key: 'system.sessionTimeout',
    category: 'system',
    defaultValue: 30,
    description: 'Session timeout (minutes)',
    adminOnly: true,
    encrypted: false,
    validation: (value) => typeof value === 'number' && value >= 5 && value <= 1440
  },

  // AI Settings (Admin Only)
  'ai.defaultProvider': {
    key: 'ai.defaultProvider',
    category: 'ai',
    defaultValue: 'openai',
    description: 'Default AI provider',
    adminOnly: true,
    encrypted: false
  },
  'ai.maxTokens': {
    key: 'ai.maxTokens',
    category: 'ai',
    defaultValue: 4096,
    description: 'Maximum tokens per AI request',
    adminOnly: true,
    encrypted: false,
    validation: (value) => typeof value === 'number' && value > 0 && value <= 32000
  },
  'ai.temperature': {
    key: 'ai.temperature',
    category: 'ai',
    defaultValue: 0.7,
    description: 'AI model temperature',
    adminOnly: true,
    encrypted: false,
    validation: (value) => typeof value === 'number' && value >= 0 && value <= 2
  },

  // Security Settings (Admin Only)
  'security.rateLimiting': {
    key: 'security.rateLimiting',
    category: 'security',
    defaultValue: true,
    description: 'Rate limiting enabled',
    adminOnly: true,
    encrypted: false
  },
  'security.maxLoginAttempts': {
    key: 'security.maxLoginAttempts',
    category: 'security',
    defaultValue: 5,
    description: 'Maximum login attempts before lockout',
    adminOnly: true,
    encrypted: false,
    validation: (value) => typeof value === 'number' && value > 0 && value <= 20
  },
  'security.requireMFA': {
    key: 'security.requireMFA',
    category: 'security',
    defaultValue: false,
    description: 'Require multi-factor authentication',
    adminOnly: true,
    encrypted: false
  }
};

// =============================================
// SETTINGS SERVICE - PHASE 1 COMPLETE
// Using dedicated database tables with proper caching
// =============================================

export class SettingsService {
  private static cache = new Map<string, any>();
  private static cacheExpiry = new Map<string, number>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Get setting value with caching using proper database tables
  static async get<T = any>(key: string, userId?: string): Promise<T> {
    const cacheKey = userId ? `${userId}:${key}` : key;
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cached !== undefined && expiry && Date.now() < expiry) {
      return cached;
    }

    const definition = SETTINGS_REGISTRY[key];
    if (!definition) {
      console.warn(`Unknown setting: ${key}, using null`);
      return null as T;
    }

    try {
      let value: T;

      if (definition.category === 'user' && userId) {
        // Get user setting from user_settings table
        const { data, error } = await supabase
          .from('user_settings')
          .select('value')
          .eq('user_id', userId)
          .eq('key', key)
          .maybeSingle();

        if (error || !data?.value) {
          value = definition.defaultValue;
        } else {
          // Parse JSON value from database
          value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        }
      } else if (definition.adminOnly) {
        // Get system setting from system_settings table
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (error || !data?.value) {
          value = definition.defaultValue;
        } else {
          // Parse JSON value from database
          value = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        }
      } else {
        value = definition.defaultValue;
      }

      // Cache the result
      this.cache.set(cacheKey, value);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      return value;
    } catch (error) {
      console.warn(`Failed to get setting ${key}:`, error);
      return definition.defaultValue;
    }
  }

  // Set setting value using proper database tables
  static async set(key: string, value: any, userId?: string): Promise<boolean> {
    const definition = SETTINGS_REGISTRY[key];
    if (!definition) {
      console.warn(`Unknown setting: ${key}`);
      return false;
    }

    // Validate value
    if (definition.validation && !definition.validation(value)) {
      console.warn(`Invalid value for setting ${key}`);
      return false;
    }

    try {
      if (definition.category === 'user' && userId) {
        // Store user setting in user_settings table
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: userId,
            key: key,
            value: JSON.stringify(value), // Store as JSON string
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error(`Failed to save user setting ${key}:`, error);
          return false;
        }
      } else if (definition.adminOnly) {
        // Store system setting in system_settings table
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key: key,
            value: JSON.stringify(value), // Store as JSON string
            updated_by: userId,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error(`Failed to save system setting ${key}:`, error);
          return false;
        }
      }

      // Clear cache
      const cacheKey = userId ? `${userId}:${key}` : key;
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      
      return true;
    } catch (error) {
      console.error(`Failed to set setting ${key}:`, error);
      return false;
    }
  }

  // Get multiple settings efficiently
  static async getMany(keys: string[], userId?: string): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    // For now, get them one by one - can optimize later
    for (const key of keys) {
      try {
        results[key] = await this.get(key, userId);
      } catch (error) {
        console.warn(`Failed to get setting ${key}:`, error);
        results[key] = SETTINGS_REGISTRY[key]?.defaultValue;
      }
    }

    return results;
  }

  // Clear all caches
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Get settings by category
  static getSettingsByCategory(category: SettingCategory): SettingDefinition[] {
    return Object.values(SETTINGS_REGISTRY).filter(
      setting => setting.category === category
    );
  }

  // Export user settings for backup
  static async exportUserSettings(userId: string): Promise<Record<string, any>> {
    const userKeys = Object.keys(SETTINGS_REGISTRY).filter(key => 
      SETTINGS_REGISTRY[key].category === 'user'
    );
    
    return await this.getMany(userKeys, userId);
  }

  // Import user settings from backup
  static async importUserSettings(userId: string, settings: Record<string, any>): Promise<boolean> {
    let allSuccessful = true;
    
    for (const [key, value] of Object.entries(settings)) {
      if (SETTINGS_REGISTRY[key]?.category === 'user') {
        const success = await this.set(key, value, userId);
        if (!success) allSuccessful = false;
      }
    }

    return allSuccessful;
  }
}

// =============================================
// SETTINGS HOOKS
// =============================================

export const getUserSettingKeys = (): string[] => {
  return Object.keys(SETTINGS_REGISTRY).filter(key => 
    SETTINGS_REGISTRY[key].category === 'user'
  );
};

export const getSystemSettingKeys = (): string[] => {
  return Object.keys(SETTINGS_REGISTRY).filter(key => 
    SETTINGS_REGISTRY[key].adminOnly
  );
};

export const getAISettingKeys = (): string[] => {
  return Object.keys(SETTINGS_REGISTRY).filter(key => 
    SETTINGS_REGISTRY[key].category === 'ai'
  );
};

export const getSecuritySettingKeys = (): string[] => {
  return Object.keys(SETTINGS_REGISTRY).filter(key => 
    SETTINGS_REGISTRY[key].category === 'security'
  );
};