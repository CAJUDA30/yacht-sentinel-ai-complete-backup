/**
 * UNIFIED YACHT SENTINEL CORE
 * Single source of truth for all yacht management operations
 * Consolidates all services into one cohesive system
 */

// Use the single source of truth Supabase client
import { supabase } from '@/integrations/supabase/client';
import { safeQuery } from './DatabaseHealthChecker';

// Core configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Core interfaces
export interface YachtData {
  id: string;
  yacht_name: string;
  yacht_type: string;
  owner_id: string;
  specifications?: {
    length_overall?: number;
    beam?: number;
    draft?: number;
    year_built?: number;
    builder?: string;
  };
  registration?: {
    flag_state?: string;
    registration_number?: string;
    imo_number?: string;
    call_sign?: string;
  };
  status: 'active' | 'maintenance' | 'inactive';
}

export interface CrewMember {
  id: string;
  yacht_id: string;
  first_name: string;
  last_name: string;
  position: string;
  email: string;
  certifications: any;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  yacht_id: string;
  name: string;
  category?: string;
  description?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  yacht_id: string;
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentScanResult {
  success: boolean;
  document_type: string;
  extracted_data: Record<string, any>;
  confidence: number;
  suggestions: string[];
  auto_populate_data?: Record<string, any>;
}

/**
 * UNIFIED YACHT SENTINEL CORE CLASS
 * Central hub for all yacht management operations
 */
export class UnifiedYachtSentinelCore {
  private static instance: UnifiedYachtSentinelCore;
  private userId: string | null = null;
  private currentYachtId: string | null = null;
  
  constructor() {
    if (UnifiedYachtSentinelCore.instance) {
      return UnifiedYachtSentinelCore.instance;
    }
    UnifiedYachtSentinelCore.instance = this;
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
        console.log('[YachtSentinel] Authenticated user:', this.userId);
      }
    } catch (error) {
      console.error('[YachtSentinel] Auth initialization error:', error);
    }
  }

  /**
   * YACHT MANAGEMENT WITH ENHANCED ERROR HANDLING
   */
  async getYachts(): Promise<any[]> {
    try {
      if (!this.userId) {
        console.warn('[YachtSentinel] No authenticated user, returning empty yacht list');
        return [];
      }

      // Use safe query to handle missing tables gracefully
      const result = await safeQuery(
        'yacht_profiles',
        async () => {
          return await supabase
            .from('yacht_profiles')
            .select('*')
            .eq('owner_id', this.userId!);
        },
        []
      );

      if (!result.tableExists) {
        console.warn('[YachtSentinel] yacht_profiles table does not exist');
      }

      return result.data;
    } catch (error: any) {
      console.error('[YachtSentinel] Unexpected error in getYachts:', error);
      return [];
    }
  }

  async createYacht(yachtData: any): Promise<any> {
    try {
      if (!this.userId) {
        throw new Error('Authentication required to create yacht');
      }

      const newYacht = {
        ...yachtData,
        owner_id: this.userId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('yacht_profiles')
        .insert([newYacht])
        .select()
        .single();

      if (error) {
        if (error.message?.includes('relation "yacht_profiles" does not exist')) {
          throw new Error('Yacht profiles table is not available. Please contact support.');
        }
        throw new Error(`Failed to create yacht: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('[YachtSentinel] Error in createYacht:', error);
      throw error;
    }
  }

  async setCurrentYacht(yachtId: string): Promise<void> {
    this.currentYachtId = yachtId;
    console.log('[YachtSentinel] Current yacht set to:', yachtId);
  }

  /**
   * CREW MANAGEMENT WITH ENHANCED ERROR HANDLING
   */
  async getCrew(): Promise<CrewMember[]> {
    try {
      if (!this.currentYachtId) {
        console.warn('[YachtSentinel] No yacht selected, returning empty crew list');
        return [];
      }

      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .eq('yacht_id', this.currentYachtId);

      if (error) {
        if (error.message?.includes('relation "crew_members" does not exist')) {
          console.warn('[YachtSentinel] crew_members table does not exist, returning empty list');
          return [];
        }
        
        console.error('[YachtSentinel] Error fetching crew:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('[YachtSentinel] Unexpected error in getCrew:', error);
      return [];
    }
  }

  async addCrewMember(crewData: Partial<CrewMember>): Promise<CrewMember> {
    if (!this.currentYachtId) {
      throw new Error('No yacht selected');
    }

    const newCrewMember = {
      ...crewData,
      yacht_id: this.currentYachtId,
      status: 'active' as const,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('crew_members')
      .insert([newCrewMember])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add crew member: ${error.message}`);
    }

    return data;
  }

  /**
   * EQUIPMENT MANAGEMENT
   */
  async getEquipment(): Promise<Equipment[]> {
    if (!this.currentYachtId) {
      throw new Error('No yacht selected');
    }

    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('yacht_id', this.currentYachtId);

    if (error) {
      console.error('[YachtSentinel] Error fetching equipment:', error);
      return [];
    }

    return data || [];
  }

  async addEquipment(equipmentData: Partial<Equipment>): Promise<Equipment> {
    if (!this.currentYachtId) {
      throw new Error('No yacht selected');
    }

    const newEquipment = {
      ...equipmentData,
      yacht_id: this.currentYachtId,
      name: (equipmentData as any).equipment_name || equipmentData.name || 'Unknown Equipment',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('equipment')
      .insert([newEquipment])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add equipment: ${error.message}`);
    }

    return data;
  }

  /**
   * INVENTORY MANAGEMENT
   */
  async getInventory(): Promise<InventoryItem[]> {
    if (!this.currentYachtId) {
      throw new Error('No yacht selected');
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('yacht_id', this.currentYachtId);

    if (error) {
      console.error('[YachtSentinel] Error fetching inventory:', error);
      return [];
    }

    return data || [];
  }

  async addInventoryItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    if (!this.currentYachtId) {
      throw new Error('No yacht selected');
    }

    const newItem = {
      ...itemData,
      yacht_id: this.currentYachtId,
      name: (itemData as any).item_name || itemData.name || 'Unknown Item',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([newItem])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add inventory item: ${error.message}`);
    }

    return data;
  }

  /**
   * DOCUMENT SCANNING AND AI PROCESSING
   */
  async scanDocument(imageData: string, documentType: string = 'auto_detect'): Promise<DocumentScanResult> {
    try {
      console.log('[YachtSentinel] Processing document scan...');

      // Call document AI edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/document-ai-working`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        throw new Error(`Document processing failed: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        document_type: documentType,
        extracted_data: result.outputs?.documentAI || {},
        confidence: 0.85,
        suggestions: ['Document processed successfully'],
        auto_populate_data: this.prepareAutoPopulateData(result.outputs?.documentAI || {}, documentType)
      };

    } catch (error: any) {
      console.error('[YachtSentinel] Document scan error:', error);
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
   * MAINTENANCE SCHEDULING
   */
  async getMaintenanceSchedule(): Promise<any[]> {
    if (!this.currentYachtId) {
      throw new Error('No yacht selected');
    }

    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('yacht_id', this.currentYachtId)
      .not('next_maintenance_date', 'is', null)
      .order('next_maintenance_date', { ascending: true });

    if (error) {
      console.error('[YachtSentinel] Error fetching maintenance schedule:', error);
      return [];
    }

    return data || [];
  }

  async scheduleMaintenanceTask(equipmentId: string, maintenanceDate: string, description: string): Promise<void> {
    const { error } = await supabase
      .from('equipment')
      .update({
        next_maintenance_date: maintenanceDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', equipmentId);

    if (error) {
      throw new Error(`Failed to schedule maintenance: ${error.message}`);
    }
  }

  /**
   * REAL-TIME UPDATES
   */
  subscribeToYachtUpdates(callback: (payload: any) => void): () => void {
    if (!this.currentYachtId) {
      throw new Error('No yacht selected');
    }

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

  /**
   * SYSTEM STATUS AND HEALTH
   */
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    const services = {
      database: false,
      authentication: false,
      document_ai: false
    };

    try {
      // Test database connection with proper auth check
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Use a less restrictive table for connection test
        const { error: dbError } = await supabase.from('user_roles').select('count').limit(1);
        services.database = !dbError;
      } else {
        // No authenticated user, mark as not connected to avoid RLS issues
        services.database = false;
      }

      // Test authentication (reuse the session already retrieved above)
      services.authentication = !!session;

      // Test document AI
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/document-ai-working`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'status' })
        });
        services.document_ai = response.ok;
      } catch (fetchError) {
        console.warn('[YachtSentinel] Document AI service unavailable, continuing without it');
        services.document_ai = false;
      }

    } catch (error) {
      console.error('[YachtSentinel] System status check error:', error);
    }

    const allHealthy = Object.values(services).every(Boolean);
    const status = allHealthy ? 'healthy' : services.database ? 'degraded' : 'error';

    return {
      status,
      services,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const yachtSentinel = new UnifiedYachtSentinelCore();
export default UnifiedYachtSentinelCore;