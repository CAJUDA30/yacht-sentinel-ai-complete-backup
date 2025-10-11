/**
 * UnifiedSettingsManager - Consolidated Settings Management
 * 
 * Eliminates duplicate settings contexts and provides centralized
 * configuration management with Yachtie-powered validation and defaults.
 */

import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from "./YachtieIntegrationService";

export interface SettingDefinition {
  key: string;
  category: 'user' | 'system' | 'module' | 'security' | 'performance';
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue: any;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  description: string;
  userEditable: boolean;
  requiresRestart?: boolean;
  securityLevel: 'public' | 'protected' | 'private' | 'system';
}

export interface Setting {
  key: string;
  value: any;
  category: string;
  userId?: string;
  moduleId?: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface SettingsGroup {
  category: string;
  title: string;
  description: string;
  icon: string;
  settings: Setting[];
  order: number;
}

class UnifiedSettingsManager {
  private static instance: UnifiedSettingsManager;
  private settings = new Map<string, Setting>();
  private definitions = new Map<string, SettingDefinition>();
  private listeners = new Map<string, Set<(value: any) => void>>();
  private cache = new Map<string, { value: any; expiry: number }>();
  private readonly cacheTimeout = 60000; // 1 minute

  private constructor() {
    this.initializeDefaultSettings();
    this.loadUserSettings();
  }

  static getInstance(): UnifiedSettingsManager {
    if (!UnifiedSettingsManager.instance) {
      UnifiedSettingsManager.instance = new UnifiedSettingsManager();
    }
    return UnifiedSettingsManager.instance;
  }

  /**
   * Register a setting definition
   */
  registerSetting(definition: SettingDefinition): void {
    this.definitions.set(definition.key, definition);
    
    // Set default value if not already set
    if (!this.settings.has(definition.key)) {
      this.settings.set(definition.key, {
        key: definition.key,
        value: definition.defaultValue,
        category: definition.category,
        updatedAt: new Date()
      });
    }
  }

  /**
   * Get a setting value with type safety and caching
   */
  async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    try {
      // Check in-memory first
      const memorySetting = this.settings.get(key);
      if (memorySetting) {
        this.cache.set(key, { value: memorySetting.value, expiry: Date.now() + this.cacheTimeout });
        return memorySetting.value;
      }

      // Load from database
      const { data, error } = await supabase
        .from('ai_system_config')
        .select('config_value')
        .eq('config_key', key)
        .maybeSingle();

      if (!error && data) {
        const valueT = data.config_value as unknown as T;
        this.settings.set(key, {
          key,
          value: valueT as any,
          category: this.definitions.get(key)?.category || 'user',
          updatedAt: new Date()
        });
        
        this.cache.set(key, { value: valueT as any, expiry: Date.now() + this.cacheTimeout });
        return valueT;
      }

      // Return default if not found
      const definition = this.definitions.get(key);
      const finalDefault = defaultValue !== undefined ? defaultValue : definition?.defaultValue;
      
      if (finalDefault !== undefined) {
        this.cache.set(key, { value: finalDefault, expiry: Date.now() + this.cacheTimeout });
      }
      
      return finalDefault;

    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      const definition = this.definitions.get(key);
      return defaultValue !== undefined ? defaultValue : definition?.defaultValue;
    }
  }

  /**
   * Set a setting value with validation and persistence
   */
  async set(key: string, value: any, userId?: string): Promise<void> {
    const definition = this.definitions.get(key);
    
    // Validate the value
    if (definition) {
      const validationResult = await this.validateSetting(definition, value);
      if (!validationResult.valid) {
        throw new Error(`Invalid value for setting ${key}: ${validationResult.error}`);
      }
    }

    try {
      // Update database
      const { error } = await supabase
        .from('ai_system_config')
        .upsert({
          config_key: key,
          config_value: value,
          updated_by: userId
        });

      if (error) throw error;

      // Update in-memory
      this.settings.set(key, {
        key,
        value,
        category: definition?.category || 'user',
        userId,
        updatedAt: new Date(),
        updatedBy: userId
      });

      // Update cache
      this.cache.set(key, { value, expiry: Date.now() + this.cacheTimeout });

      // Notify listeners
      this.notifyListeners(key, value);

      // Log the change
      await this.logSettingChange(key, value, userId);

    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple settings by category or pattern
   */
  async getByCategory(category: string): Promise<SettingsGroup> {
    const categorySettings = Array.from(this.definitions.values())
      .filter(def => def.category === category);

    const settings: Setting[] = [];
    
    for (const def of categorySettings) {
      const value = await this.get(def.key);
      settings.push({
        key: def.key,
        value,
        category: def.category,
        updatedAt: new Date()
      });
    }

    return {
      category,
      title: this.getCategoryTitle(category),
      description: this.getCategoryDescription(category),
      icon: this.getCategoryIcon(category),
      settings,
      order: this.getCategoryOrder(category)
    };
  }

  /**
   * Get all settings organized by category
   */
  async getAllGrouped(): Promise<SettingsGroup[]> {
    const categories = new Set(Array.from(this.definitions.values()).map(def => def.category));
    const groups: SettingsGroup[] = [];

    for (const category of categories) {
      const group = await this.getByCategory(category);
      groups.push(group);
    }

    return groups.sort((a, b) => a.order - b.order);
  }

  /**
   * Watch for setting changes
   */
  watch(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Watch for category changes
   */
  watchCategory(category: string, callback: (settings: SettingsGroup) => void): () => void {
    const relevantKeys = Array.from(this.definitions.values())
      .filter(def => def.category === category)
      .map(def => def.key);

    const unsubscribeFunctions = relevantKeys.map(key => 
      this.watch(key, async () => {
        const group = await this.getByCategory(category);
        callback(group);
      })
    );

    return () => {
      unsubscribeFunctions.forEach(unsub => unsub());
    };
  }

  /**
   * Reset setting to default value
   */
  async reset(key: string, userId?: string): Promise<void> {
    const definition = this.definitions.get(key);
    if (!definition) {
      throw new Error(`Setting definition not found: ${key}`);
    }

    await this.set(key, definition.defaultValue, userId);
  }

  /**
   * Reset entire category to defaults
   */
  async resetCategory(category: string, userId?: string): Promise<void> {
    const categorySettings = Array.from(this.definitions.values())
      .filter(def => def.category === category);

    for (const setting of categorySettings) {
      await this.reset(setting.key, userId);
    }
  }

  /**
   * Export settings for backup
   */
  async exportSettings(categories?: string[]): Promise<any> {
    const settingsToExport = Array.from(this.settings.entries())
      .filter(([key, setting]) => {
        if (categories) {
          return categories.includes(setting.category);
        }
        return true;
      })
      .reduce((acc, [key, setting]) => {
        acc[key] = {
          value: setting.value,
          category: setting.category,
          updatedAt: setting.updatedAt
        };
        return acc;
      }, {} as Record<string, any>);

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      settings: settingsToExport
    };
  }

  /**
   * Import settings from backup
   */
  async importSettings(backup: any, userId?: string, overwrite: boolean = false): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const results = { imported: 0, skipped: 0, errors: [] };

    if (!backup.settings) {
      throw new Error('Invalid backup format');
    }

    for (const [key, settingData] of Object.entries(backup.settings)) {
      try {
        if (!overwrite && this.settings.has(key)) {
          results.skipped++;
          continue;
        }

        await this.set(key, (settingData as any).value, userId);
        results.imported++;
      } catch (error) {
        results.errors.push(`Failed to import ${key}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Validate settings with Yachtie
   */
  async validateAllSettings(): Promise<{
    valid: boolean;
    errors: Array<{ key: string; error: string }>;
    warnings: Array<{ key: string; warning: string }>;
  }> {
    const errors: Array<{ key: string; error: string }> = [];
    const warnings: Array<{ key: string; warning: string }> = [];

    for (const [key, setting] of this.settings.entries()) {
      const definition = this.definitions.get(key);
      if (!definition) continue;

      const validationResult = await this.validateSetting(definition, setting.value);
      if (!validationResult.valid) {
        errors.push({ key, error: validationResult.error });
      }

      // Check for potential security issues with Yachtie
      if (definition.securityLevel === 'private' && typeof setting.value === 'string' && setting.value.length > 10) {
        try {
          const securityCheck = await yachtieService.validate(setting.value, 'security_check');
          if (!securityCheck.success || securityCheck.confidence < 0.8) {
            warnings.push({ key, warning: 'Potential security concern in setting value' });
          }
        } catch (error) {
          // Ignore Yachtie validation errors for now
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateSetting(definition: SettingDefinition, value: any): Promise<{ valid: boolean; error?: string }> {
    const { validation } = definition;
    if (!validation) return { valid: true };

    // Required check
    if (validation.required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: 'Setting is required' };
    }

    // Type check
    if (value !== null && value !== undefined) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== definition.type && !(definition.type === 'object' && actualType === 'object')) {
        return { valid: false, error: `Expected ${definition.type}, got ${actualType}` };
      }
    }

    // Enum check
    if (validation.enum && !validation.enum.includes(value)) {
      return { valid: false, error: `Value must be one of: ${validation.enum.join(', ')}` };
    }

    // Range checks for numbers
    if (definition.type === 'number' && typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        return { valid: false, error: `Value must be at least ${validation.min}` };
      }
      if (validation.max !== undefined && value > validation.max) {
        return { valid: false, error: `Value must be at most ${validation.max}` };
      }
    }

    // Pattern check for strings
    if (definition.type === 'string' && validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return { valid: false, error: 'Value does not match required pattern' };
      }
    }

    return { valid: true };
  }

  private notifyListeners(key: string, value: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in setting listener for ${key}:`, error);
        }
      });
    }
  }

  private async logSettingChange(key: string, value: any, userId?: string): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'setting_changed',
        event_message: `Setting ${key} was updated`,
        module: 'settings_manager',
        severity: 'info',
        user_id: userId,
        metadata: {
          settingKey: key,
          category: this.definitions.get(key)?.category,
          valueType: typeof value
        }
      });
    } catch (error) {
      console.warn('Failed to log setting change:', error);
    }
  }

  private getCategoryTitle(category: string): string {
    const titles = {
      user: 'User Preferences',
      system: 'System Configuration',
      module: 'Module Settings',
      security: 'Security Settings',
      performance: 'Performance Settings'
    };
    return titles[category] || category;
  }

  private getCategoryDescription(category: string): string {
    const descriptions = {
      user: 'Personal preferences and interface settings',
      system: 'Core system configuration and behavior',
      module: 'Module-specific settings and features',
      security: 'Security policies and access controls',
      performance: 'Performance optimization and resource limits'
    };
    return descriptions[category] || '';
  }

  private getCategoryIcon(category: string): string {
    const icons = {
      user: 'User',
      system: 'Settings',
      module: 'Package',
      security: 'Shield',
      performance: 'Zap'
    };
    return icons[category] || 'Settings';
  }

  private getCategoryOrder(category: string): number {
    const order = {
      user: 1,
      module: 2,
      performance: 3,
      security: 4,
      system: 5
    };
    return order[category] || 99;
  }

  private initializeDefaultSettings(): void {
    // Register all default settings
    const defaultSettings: SettingDefinition[] = [
      {
        key: 'app.language',
        category: 'user',
        type: 'string',
        defaultValue: 'en',
        validation: { enum: ['en', 'es', 'fr', 'de', 'it'] },
        description: 'Application display language',
        userEditable: true,
        securityLevel: 'public'
      },
      {
        key: 'app.theme',
        category: 'user',
        type: 'string',
        defaultValue: 'light',
        validation: { enum: ['light', 'dark', 'auto'] },
        description: 'Application theme preference',
        userEditable: true,
        securityLevel: 'public'
      },
      {
        key: 'yachtie.multilingual_enabled',
        category: 'system',
        type: 'boolean',
        defaultValue: true,
        description: 'Enable Yachtie multilingual processing',
        userEditable: false,
        securityLevel: 'protected'
      },
      {
        key: 'yachtie.consensus_threshold',
        category: 'system',
        type: 'number',
        defaultValue: 0.7,
        validation: { min: 0.1, max: 1.0 },
        description: 'Minimum consensus agreement threshold',
        userEditable: false,
        securityLevel: 'protected'
      },
      {
        key: 'performance.cache_timeout',
        category: 'performance',
        type: 'number',
        defaultValue: 300000,
        validation: { min: 60000, max: 3600000 },
        description: 'Cache timeout in milliseconds',
        userEditable: false,
        securityLevel: 'system'
      }
    ];

    defaultSettings.forEach(setting => this.registerSetting(setting));
  }

  private async loadUserSettings(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ai_system_config')
        .select('*');

      if (!error && data) {
        data.forEach(setting => {
          this.settings.set(setting.config_key, {
            key: setting.config_key,
            value: setting.config_value,
            category: this.definitions.get(setting.config_key)?.category || 'user',
            updatedAt: new Date(setting.updated_at || Date.now()),
            updatedBy: setting.updated_by
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load user settings:', error);
    }
  }
}

// Export singleton instance
export const unifiedSettings = UnifiedSettingsManager.getInstance();

// Convenience functions
export const getSetting = <T = any>(key: string, defaultValue?: T) => 
  unifiedSettings.get(key, defaultValue);

export const setSetting = (key: string, value: any, userId?: string) => 
  unifiedSettings.set(key, value, userId);

export const watchSetting = (key: string, callback: (value: any) => void) => 
  unifiedSettings.watch(key, callback);