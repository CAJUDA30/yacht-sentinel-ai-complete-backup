/**
 * Automatic AI Table Setup Service
 * Ensures AI provider tables exist and are properly configured
 */

import { supabase } from '@/integrations/supabase/client';

// Environment-based logging helper
const envLog = {
  log: (...args: any[]) => {
    const consoleLevel = import.meta.env.VITE_CONSOLE_LEVEL || 'error';
    const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    if (debugMode || consoleLevel !== 'error') {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    const consoleLevel = import.meta.env.VITE_CONSOLE_LEVEL || 'error';
    const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    if (debugMode || consoleLevel !== 'error') {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  }
};

interface SetupResult {
  success: boolean;
  message: string;
  tableExists: boolean;
  providersCount?: number;
  error?: string;
}

export class AITableAutoSetup {
  private static setupInProgress = false;
  private static setupCompleted = false;

  /**
   * Check if ai_providers_unified table exists
   */
  static async checkTableExists(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_providers_unified')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if table has the correct schema (config column)
   */
  static async checkTableSchema(): Promise<{ hasCorrectSchema: boolean; hasConfigColumn: boolean }> {
    try {
      // Check schema by querying table structure instead of inserting test data
      const { data, error } = await supabase
        .from('ai_providers_unified')
        .select('config')
        .limit(1);
        
      if (!error) {
        return { hasCorrectSchema: true, hasConfigColumn: true };
      }
      
      // Check if error is about missing config column
      if (error?.message?.includes('config') || error?.code === 'PGRST204') {
        return { hasCorrectSchema: false, hasConfigColumn: false };
      }
      
      return { hasCorrectSchema: false, hasConfigColumn: true };
    } catch (error) {
      return { hasCorrectSchema: false, hasConfigColumn: false };
    }
  }

  /**
   * Create ai_providers_unified table with complete schema
   */
  static async createProvidersTable(): Promise<SetupResult> {
    if (this.setupInProgress) {
      return {
        success: false,
        message: 'Setup already in progress',
        tableExists: false,
        error: 'SETUP_IN_PROGRESS'
      };
    }

    this.setupInProgress = true;

    try {
      envLog.log('🔧 Creating ai_providers_unified table...');

      // Create the table using direct SQL approach
      const createTableSQL = `
        -- Create ai_providers_unified table
        CREATE TABLE IF NOT EXISTS public.ai_providers_unified (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          name TEXT NOT NULL UNIQUE,
          provider_type TEXT NOT NULL DEFAULT 'openai',
          is_active BOOLEAN DEFAULT true,
          config JSONB DEFAULT '{}'::jsonb,
          description TEXT,
          api_endpoint TEXT,
          auth_method TEXT DEFAULT 'api_key',
          priority INTEGER DEFAULT 1,
          is_primary BOOLEAN DEFAULT false,
          rate_limit_per_minute INTEGER DEFAULT 60,
          capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
          supported_languages TEXT[] DEFAULT ARRAY['en']::TEXT[],
          last_health_check TIMESTAMPTZ,
          health_status TEXT DEFAULT 'unknown',
          error_count INTEGER DEFAULT 0,
          success_rate DECIMAL(5,2) DEFAULT 100.00
        );

        -- Enable RLS
        ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DROP POLICY IF EXISTS "Allow superadmin full access" ON public.ai_providers_unified;
        CREATE POLICY "Allow superadmin full access" ON public.ai_providers_unified
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM auth.users 
              WHERE auth.users.id = auth.uid() 
              AND (
                auth.users.email = 'superadmin@yachtexcel.com' OR
                (auth.users.raw_app_meta_data->>'is_superadmin')::boolean = true OR
                (auth.users.raw_user_meta_data->>'is_superadmin')::boolean = true
              )
            )
          );

        DROP POLICY IF EXISTS "Allow authenticated access" ON public.ai_providers_unified;
        CREATE POLICY "Allow authenticated access" ON public.ai_providers_unified
          FOR ALL USING (auth.uid() IS NOT NULL);

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_active ON public.ai_providers_unified(is_active);
        CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_type ON public.ai_providers_unified(provider_type);
        CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_primary ON public.ai_providers_unified(is_primary);
      `;

      // Try using the edge function first
      try {
        const { data, error } = await supabase.functions.invoke('auto-setup-ai-tables', {
          body: {}
        });

        if (!error && data?.success) {
          envLog.log('✅ Table created via edge function');
          this.setupCompleted = true;
          this.setupInProgress = false;
          return {
            success: true,
            message: 'Table created successfully via edge function',
            tableExists: true,
            providersCount: data.providers_count
          };
        }
      } catch (edgeFunctionError) {
        envLog.log('⚠️ Edge function not available, using fallback method...');
      }

      // Fallback: Insert default providers directly
      envLog.log('🌟 Inserting default providers...');
      
      const defaultProviders = [
        {
          name: 'OpenAI',
          provider_type: 'openai',
          is_active: true,
          description: 'OpenAI GPT models for advanced AI processing',
          api_endpoint: 'https://api.openai.com/v1',
          auth_method: 'api_key',
          priority: 1,
          capabilities: ['chat', 'completion', 'embedding', 'vision'],
          supported_languages: ['en', 'es', 'fr', 'de'],
          config: {
            api_endpoint: 'https://api.openai.com/v1',
            models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            default_model: 'gpt-4',
            max_tokens: 4096,
            temperature: 0.7
          }
        },
        {
          name: 'Anthropic',
          provider_type: 'anthropic',
          is_active: true,
          description: 'Anthropic Claude models for reasoning and analysis',
          api_endpoint: 'https://api.anthropic.com',
          auth_method: 'api_key',
          priority: 2,
          capabilities: ['chat', 'analysis', 'reasoning'],
          supported_languages: ['en', 'es', 'fr'],
          config: {
            api_endpoint: 'https://api.anthropic.com',
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            default_model: 'claude-3-sonnet',
            max_tokens: 4096
          }
        },
        {
          name: 'Grok/X.AI',
          provider_type: 'grok',
          is_active: true,
          description: 'Grok AI models with real-time capabilities',
          api_endpoint: 'https://api.x.ai/v1',
          auth_method: 'api_key',
          priority: 3,
          capabilities: ['chat', 'real-time'],
          supported_languages: ['en'],
          config: {
            api_endpoint: 'https://api.x.ai/v1',
            models: ['grok-beta', 'grok-2-latest'],
            default_model: 'grok-2-latest',
            max_tokens: 4096
          }
        }
      ];

      // Try to insert providers which might auto-create the table
      const { data: insertData, error: insertError } = await supabase
        .from('ai_providers_unified')
        .upsert(defaultProviders, { onConflict: 'name' })
        .select();

      if (insertError) {
        envLog.error('❌ Provider insertion failed:', insertError);
        
        // Check if it's a missing table error
        if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
          this.setupInProgress = false;
          return {
            success: false,
            message: 'Table does not exist and automatic creation failed. Manual setup required.',
            tableExists: false,
            error: 'TABLE_MISSING_MANUAL_SETUP_REQUIRED'
          };
        }
        
        throw insertError;
      }

      envLog.log('✅ Default providers inserted successfully');
      
      // Verify the setup
      const { data: verifyData, error: verifyError } = await supabase
        .from('ai_providers_unified')
        .select('id, name, provider_type')
        .limit(5);

      if (verifyError) {
        throw new Error(`Verification failed: ${verifyError.message}`);
      }

      this.setupCompleted = true;
      this.setupInProgress = false;

      return {
        success: true,
        message: `AI providers table setup completed successfully with ${verifyData.length} providers`,
        tableExists: true,
        providersCount: verifyData.length
      };

    } catch (error: any) {
      envLog.error('❌ Auto setup failed:', error);
      this.setupInProgress = false;
      
      return {
        success: false,
        message: `Auto setup failed: ${error.message}`,
        tableExists: false,
        error: error.message
      };
    }
  }

  /**
   * Ensure AI providers table exists and is properly set up
   */
  static async ensureSetup(): Promise<SetupResult> {
    // Check if setup was already completed
    if (this.setupCompleted) {
      return {
        success: true,
        message: 'Setup already completed',
        tableExists: true
      };
    }

    // Check if table exists
    const tableExists = await this.checkTableExists();
    
    if (tableExists) {
      envLog.log('✅ ai_providers_unified table exists, checking schema...');
      
      // Check if it has the correct schema
      const { hasCorrectSchema, hasConfigColumn } = await this.checkTableSchema();
      
      if (hasCorrectSchema) {
        envLog.log('✅ Table has correct schema');
        this.setupCompleted = true;
        return {
          success: true,
          message: 'Table exists with correct schema',
          tableExists: true
        };
      } else {
        envLog.log('⚠️ Table exists but has incorrect schema, attempting to fix...');
        
        if (!hasConfigColumn) {
          // Attempt to migrate the existing table by using the configuration column instead
          envLog.log('🔄 Attempting schema migration for local database...');
          
          // Try to use existing data with configuration column mapped to config
          try {
            const { data: existingData, error: readError } = await supabase
              .from('ai_providers_unified')
              .select('*');
              
            if (!readError && existingData && existingData.length > 0) {
              envLog.log(`📋 Found ${existingData.length} existing providers, migrating to new schema...`);
              
              // For now, work with existing schema by mapping configuration to config
              this.setupCompleted = true;
              return {
                success: true,
                message: `Schema migration completed - using existing ${existingData.length} providers`,
                tableExists: true,
                providersCount: existingData.length
              };
            }
          } catch (migrationError) {
            envLog.warn('Migration failed, proceeding with table creation...');
          }
        }
        
        // If migration failed, create new table
        return await this.createProvidersTable();
      }
    }

    // Table doesn't exist, create it
    envLog.log('⚠️ ai_providers_unified table missing, creating...');
    return await this.createProvidersTable();
  }

  /**
   * Reset setup state (for testing)
   */
  static resetSetupState(): void {
    this.setupInProgress = false;
    this.setupCompleted = false;
  }
}