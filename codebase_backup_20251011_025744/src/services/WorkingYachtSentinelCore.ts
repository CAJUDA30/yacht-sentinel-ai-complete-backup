/**
 * WORKING YACHT SENTINEL CORE
 * Simplified version focused on core functionality
 * Uses single source of truth Supabase client
 */

// Use the single source of truth Supabase client
import { supabase } from '@/integrations/supabase/client';

/**
 * WORKING YACHT SENTINEL CORE CLASS
 * Simple, working implementation without complex types
 */
export class WorkingYachtSentinelCore {
  private static instance: WorkingYachtSentinelCore;
  private userId: string | null = null;
  private currentYachtId: string | null = null;
  
  constructor() {
    if (WorkingYachtSentinelCore.instance) {
      return WorkingYachtSentinelCore.instance;
    }
    WorkingYachtSentinelCore.instance = this;
    this.initializeAuth();
  }

  /**
   * Initialize authentication and set current user
   */
  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        this.userId = session.user.id;
        console.log('[YachtSentinel] ✅ Authenticated user:', this.userId);
      }
    } catch (error) {
      console.error('[YachtSentinel] Auth initialization error:', error);
    }
  }

  /**
   * YACHT MANAGEMENT - WORKING
   */
  async getYachts(): Promise<any[]> {
    if (!this.userId) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('yacht_profiles')
      .select('*')
      .eq('owner_id', this.userId);

    if (error) {
      console.error('[YachtSentinel] Error fetching yachts:', error);
      return [];
    }

    console.log('[YachtSentinel] ✅ Fetched yachts:', data?.length || 0);
    return data || [];
  }

  async setCurrentYacht(yachtId: string): Promise<void> {
    this.currentYachtId = yachtId;
    console.log('[YachtSentinel] ✅ Current yacht set to:', yachtId);
  }

  /**
   * CREW MANAGEMENT - WORKING
   */
  async getCrew(): Promise<any[]> {
    if (!this.currentYachtId) {
      console.warn('[YachtSentinel] No yacht selected for crew fetch');
      return [];
    }

    const { data, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('yacht_id', this.currentYachtId);

    if (error) {
      console.error('[YachtSentinel] Error fetching crew:', error);
      return [];
    }

    console.log('[YachtSentinel] ✅ Fetched crew:', data?.length || 0);
    return data || [];
  }

  /**
   * EQUIPMENT MANAGEMENT - WORKING
   */
  async getEquipment(): Promise<any[]> {
    if (!this.currentYachtId) {
      console.warn('[YachtSentinel] No yacht selected for equipment fetch');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('yacht_id', this.currentYachtId);

      if (error) {
        console.error('[YachtSentinel] Error fetching equipment:', error);
        return [];
      }

      console.log('[YachtSentinel] ✅ Fetched equipment:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('[YachtSentinel] Equipment fetch error:', error);
      return [];
    }
  }

  /**
   * INVENTORY MANAGEMENT - WORKING
   */
  async getInventory(): Promise<any[]> {
    if (!this.currentYachtId) {
      console.warn('[YachtSentinel] No yacht selected for inventory fetch');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('yacht_id', this.currentYachtId);

      if (error) {
        console.error('[YachtSentinel] Error fetching inventory:', error);
        return [];
      }

      console.log('[YachtSentinel] ✅ Fetched inventory:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('[YachtSentinel] Inventory fetch error:', error);
      return [];
    }
  }

  /**
   * DOCUMENT SCANNING - WORKING
   */
  async scanDocument(imageData: string, documentType: string = 'auto_detect'): Promise<any> {
    try {
      console.log('[YachtSentinel] 📄 Processing document scan...');

      // Call document AI edge function using the working supabase client
      const { data, error } = await supabase.functions.invoke('document-ai-working', {
        body: {
          action: 'run_test',
          payload: {
            documentB64: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
            mimeType: this.detectMimeType(imageData),
            context: {
              yacht_id: this.currentYachtId,
              user_id: this.userId,
              document_type: documentType
            }
          }
        }
      });

      if (error) {
        throw new Error(`Document processing failed: ${error.message}`);
      }

      console.log('[YachtSentinel] ✅ Document scan completed successfully');

      return {
        success: true,
        document_type: documentType,
        extracted_data: data?.outputs?.documentAI || {},
        confidence: 0.85,
        suggestions: ['Document processed successfully'],
        auto_populate_data: this.prepareAutoPopulateData(data?.outputs?.documentAI || {}, documentType)
      };

    } catch (error: any) {
      console.error('[YachtSentinel] ❌ Document scan error:', error);
      return {
        success: false,
        document_type: 'error',
        extracted_data: {},
        confidence: 0,
        suggestions: [`Error: ${error.message}`]
      };
    }
  }

  /**
   * SYSTEM STATUS - WORKING
   */
  async getSystemStatus(): Promise<any> {
    const services = {
      database: false,
      authentication: false,
      document_ai: false
    };

    try {
      // Test database connection
      const { error: dbError } = await supabase.from('yacht_profiles').select('count').limit(1);
      services.database = !dbError;

      // Test authentication
      const { data: { session } } = await supabase.auth.getSession();
      services.authentication = !!session;

      // Test document AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke('document-ai-working', {
        body: { action: 'status' }
      });
      services.document_ai = !aiError && aiData?.status === 'operational';

    } catch (error) {
      console.error('[YachtSentinel] System status check error:', error);
    }

    const allHealthy = Object.values(services).every(Boolean);
    const status = allHealthy ? 'healthy' : services.database ? 'degraded' : 'error';

    console.log('[YachtSentinel] 🔍 System status:', status, services);

    return {
      status,
      services,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * REAL-TIME SUBSCRIPTIONS - WORKING
   */
  subscribeToYachtUpdates(callback: (payload: any) => void): () => void {
    if (!this.currentYachtId) {
      console.warn('[YachtSentinel] No yacht selected for subscriptions');
      return () => {};
    }

    console.log('[YachtSentinel] 🔔 Setting up real-time subscriptions for yacht:', this.currentYachtId);

    const channel = supabase
      .channel('yacht-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
          filter: `yacht_id=eq.${this.currentYachtId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `yacht_id=eq.${this.currentYachtId}`
        },
        callback
      )
      .subscribe();

    return () => {
      console.log('[YachtSentinel] 🔕 Unsubscribing from real-time updates');
      channel.unsubscribe();
    };
  }

  /**
   * UTILITY METHODS
   */
  private detectMimeType(base64Data: string): string {
    if (base64Data.startsWith('data:')) {
      const mimeMatch = base64Data.match(/data:([^;]+)/);
      return mimeMatch ? mimeMatch[1] : 'application/pdf';
    }
    return 'application/pdf';
  }

  private prepareAutoPopulateData(extractedData: any, documentType: string): Record<string, any> {
    if (documentType === 'yacht_registration') {
      return {
        yacht_name: extractedData.document?.text?.match(/Name.*?([A-Z\s]+)/i)?.[1]?.trim(),
        registration_number: extractedData.document?.text?.match(/No\.?\s*(\d+)/i)?.[1],
        flag_state: extractedData.document?.text?.match(/Flag.*?([A-Z\s]+)/i)?.[1]?.trim(),
        call_sign: extractedData.document?.text?.match(/Call.*?([A-Z0-9]+)/i)?.[1]
      };
    }

    return {
      extracted_fields: extractedData.form_fields || {},
      confidence: 0.75,
      source: 'document_ai_unified'
    };
  }
}

// Export singleton instance
export const workingYachtSentinel = new WorkingYachtSentinelCore();