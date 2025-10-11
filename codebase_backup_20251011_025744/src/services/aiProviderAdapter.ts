/**
 * AI Provider Database Adapter
 * Handles schema differences between local and production databases
 */

import { supabase } from '@/integrations/supabase/client';

export class AIProviderAdapter {
  /**
   * Detect which column exists (config vs configuration)
   */
  static async detectSchema(): Promise<{ useConfigColumn: boolean; useConfigurationColumn: boolean }> {
    try {
      // Try with config column first
      const testData = {
        name: `schema_test_${Date.now()}`,
        provider_type: 'test',
        config: { test: true }
      };
      
      const { data, error } = await supabase
        .from('ai_providers_unified')
        .insert([testData])
        .select()
        .single();
        
      if (!error && data) {
        // Clean up
        await supabase.from('ai_providers_unified').delete().eq('id', data.id);
        return { useConfigColumn: true, useConfigurationColumn: false };
      }
      
      // If config column failed, try configuration column
      if (error?.message?.includes('config') || error?.code === 'PGRST204') {
        const configurationTestData = {
          name: `schema_test_${Date.now()}`,
          provider_type: 'test',
          configuration: { test: true }
        };
        
        const { data: configData, error: configError } = await supabase
          .from('ai_providers_unified')
          .insert([configurationTestData])
          .select()
          .single();
          
        if (!configError && configData) {
          // Clean up
          await supabase.from('ai_providers_unified').delete().eq('id', configData.id);
          return { useConfigColumn: false, useConfigurationColumn: true };
        }
      }
      
      return { useConfigColumn: false, useConfigurationColumn: false };
    } catch (error) {
      console.error('Schema detection failed:', error);
      return { useConfigColumn: false, useConfigurationColumn: false };
    }
  }

  /**
   * Insert provider with schema adaptation
   */
  static async insertProvider(providerData: any): Promise<{ data: any; error: any }> {
    const { useConfigColumn, useConfigurationColumn } = await this.detectSchema();
    
    if (useConfigColumn) {
      // Use config column
      return await supabase
        .from('ai_providers_unified')
        .insert([{
          ...providerData,
          config: providerData.config
        }])
        .select();
    } else if (useConfigurationColumn) {
      // Use configuration column
      return await supabase
        .from('ai_providers_unified')
        .insert([{
          ...providerData,
          configuration: providerData.config // Map config to configuration
        }])
        .select();
    } else {
      // No compatible schema found
      return {
        data: null,
        error: {
          code: 'SCHEMA_INCOMPATIBLE',
          message: 'No compatible schema found. Table may need to be created or migrated.'
        }
      };
    }
  }

  /**
   * Get all providers with schema adaptation
   */
  static async getProviders(): Promise<{ data: any[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ai_providers_unified')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        return { data: [], error };
      }
      
      // Normalize data - map configuration to config if needed
      const normalizedData = (data || []).map(item => ({
        ...item,
        config: item.config || (item as any).configuration || {}
      }));
      
      return { data: normalizedData, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  /**
   * Update provider with schema adaptation
   */
  static async updateProvider(id: string, updates: any): Promise<{ data: any; error: any }> {
    const { useConfigColumn, useConfigurationColumn } = await this.detectSchema();
    
    const updateData = { ...updates };
    
    if (useConfigurationColumn && updates.config) {
      // Map config to configuration
      updateData.configuration = updates.config;
      delete updateData.config;
    }
    
    return await supabase
      .from('ai_providers_unified')
      .update(updateData)
      .eq('id', id)
      .select();
  }
}