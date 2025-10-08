/**
 * UNIFIED YACHT SENTINEL CONTEXT
 * Single context to replace all scattered contexts
 * Provides centralized state management for the entire app
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { yachtSentinel, YachtData, CrewMember, Equipment, InventoryItem } from '../services/UnifiedYachtSentinelCore';

// State interface
interface UnifiedState {
  // Authentication
  user: any | null;
  isAuthenticated: boolean;
  
  // Yacht management
  yachts: YachtData[];
  currentYacht: YachtData | null;
  currentYachtId: string | null;
  
  // Crew
  crew: CrewMember[];
  
  // Equipment
  equipment: Equipment[];
  
  // Inventory
  inventory: InventoryItem[];
  
  // System status
  systemStatus: {
    status: 'healthy' | 'degraded' | 'error';
    services: Record<string, boolean>;
    timestamp: string;
  };
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Real-time
  realtimeConnected: boolean;
}

// Action types
type UnifiedAction =
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_YACHTS'; payload: YachtData[] }
  | { type: 'SET_CURRENT_YACHT'; payload: YachtData }
  | { type: 'SET_CREW'; payload: CrewMember[] }
  | { type: 'SET_EQUIPMENT'; payload: Equipment[] }
  | { type: 'SET_INVENTORY'; payload: InventoryItem[] }
  | { type: 'SET_SYSTEM_STATUS'; payload: UnifiedState['systemStatus'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_REALTIME_STATUS'; payload: boolean }
  | { type: 'ADD_YACHT'; payload: YachtData }
  | { type: 'ADD_CREW_MEMBER'; payload: CrewMember }
  | { type: 'ADD_EQUIPMENT'; payload: Equipment }
  | { type: 'ADD_INVENTORY_ITEM'; payload: InventoryItem };

// Initial state
const initialState: UnifiedState = {
  user: null,
  isAuthenticated: false,
  yachts: [],
  currentYacht: null,
  currentYachtId: null,
  crew: [],
  equipment: [],
  inventory: [],
  systemStatus: {
    status: 'healthy',
    services: {},
    timestamp: new Date().toISOString()
  },
  loading: false,
  error: null,
  realtimeConnected: false
};

// Reducer
function unifiedReducer(state: UnifiedState, action: UnifiedAction): UnifiedState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload
      };
      
    case 'SET_YACHTS':
      return {
        ...state,
        yachts: action.payload
      };
      
    case 'SET_CURRENT_YACHT':
      return {
        ...state,
        currentYacht: action.payload,
        currentYachtId: action.payload.id
      };
      
    case 'SET_CREW':
      return {
        ...state,
        crew: action.payload
      };
      
    case 'SET_EQUIPMENT':
      return {
        ...state,
        equipment: action.payload
      };
      
    case 'SET_INVENTORY':
      return {
        ...state,
        inventory: action.payload
      };
      
    case 'SET_SYSTEM_STATUS':
      return {
        ...state,
        systemStatus: action.payload
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
      
    case 'SET_REALTIME_STATUS':
      return {
        ...state,
        realtimeConnected: action.payload
      };
      
    case 'ADD_YACHT':
      return {
        ...state,
        yachts: [...state.yachts, action.payload]
      };
      
    case 'ADD_CREW_MEMBER':
      return {
        ...state,
        crew: [...state.crew, action.payload]
      };
      
    case 'ADD_EQUIPMENT':
      return {
        ...state,
        equipment: [...state.equipment, action.payload]
      };
      
    case 'ADD_INVENTORY_ITEM':
      return {
        ...state,
        inventory: [...state.inventory, action.payload]
      };
      
    default:
      return state;
  }
}

// Context
const UnifiedYachtSentinelContext = createContext<{
  state: UnifiedState;
  dispatch: React.Dispatch<UnifiedAction>;
  actions: {
    // Authentication
    checkAuth: () => Promise<void>;
    
    // Yacht management
    loadYachts: () => Promise<void>;
    selectYacht: (yacht: YachtData) => Promise<void>;
    createYacht: (yachtData: Partial<YachtData>) => Promise<void>;
    
    // Crew management
    loadCrew: () => Promise<void>;
    addCrewMember: (crewData: Partial<CrewMember>) => Promise<void>;
    
    // Equipment management
    loadEquipment: () => Promise<void>;
    addEquipment: (equipmentData: Partial<Equipment>) => Promise<void>;
    
    // Inventory management
    loadInventory: () => Promise<void>;
    addInventoryItem: (itemData: Partial<InventoryItem>) => Promise<void>;
    
    // Document scanning
    scanDocument: (imageData: string, documentType?: string) => Promise<any>;
    
    // System management
    checkSystemStatus: () => Promise<void>;
    
    // Utilities
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
  };
} | null>(null);

// Provider component
export const UnifiedYachtSentinelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(unifiedReducer, initialState);

  // Actions
  const actions = {
    async checkAuth() {
      try {
        // Use static import instead of dynamic import to avoid conflicts
        if (!supabase) {
          console.warn('[UnifiedContext] Supabase client not available');
          dispatch({ type: 'SET_ERROR', payload: 'Authentication service unavailable' });
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[UnifiedContext] Auth session error:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Authentication session invalid' });
          return;
        }
        
        dispatch({ type: 'SET_USER', payload: session?.user || null });
      } catch (error) {
        console.error('[UnifiedContext] Auth check error:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Authentication check failed' });
      }
    },

    async loadYachts() {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const yachts = await yachtSentinel.getYachts();
        dispatch({ type: 'SET_YACHTS', payload: yachts });
        
        // Auto-select first yacht if none selected
        if (yachts.length > 0 && !state.currentYacht) {
          await actions.selectYacht(yachts[0]);
        }
      } catch (error: any) {
        console.error('[UnifiedContext] Load yachts error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    async selectYacht(yacht: YachtData) {
      try {
        dispatch({ type: 'SET_CURRENT_YACHT', payload: yacht });
        await yachtSentinel.setCurrentYacht(yacht.id);
        
        // Load yacht-specific data
        await Promise.all([
          actions.loadCrew(),
          actions.loadEquipment(),
          actions.loadInventory()
        ]);
        
        console.log('[UnifiedContext] Yacht selected:', yacht.yacht_name);
      } catch (error: any) {
        console.error('[UnifiedContext] Select yacht error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    },

    async createYacht(yachtData: Partial<YachtData>) {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const newYacht = await yachtSentinel.createYacht(yachtData);
        dispatch({ type: 'ADD_YACHT', payload: newYacht });
        await actions.selectYacht(newYacht);
      } catch (error: any) {
        console.error('[UnifiedContext] Create yacht error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    async loadCrew() {
      try {
        const crew = await yachtSentinel.getCrew();
        dispatch({ type: 'SET_CREW', payload: crew });
      } catch (error: any) {
        console.error('[UnifiedContext] Load crew error:', error);
        // Don't set error for optional data loading
      }
    },

    async addCrewMember(crewData: Partial<CrewMember>) {
      try {
        const newCrewMember = await yachtSentinel.addCrewMember(crewData);
        dispatch({ type: 'ADD_CREW_MEMBER', payload: newCrewMember });
      } catch (error: any) {
        console.error('[UnifiedContext] Add crew member error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    },

    async loadEquipment() {
      try {
        const equipment = await yachtSentinel.getEquipment();
        dispatch({ type: 'SET_EQUIPMENT', payload: equipment });
      } catch (error: any) {
        console.error('[UnifiedContext] Load equipment error:', error);
        // Don't set error for optional data loading
      }
    },

    async addEquipment(equipmentData: Partial<Equipment>) {
      try {
        const newEquipment = await yachtSentinel.addEquipment(equipmentData);
        dispatch({ type: 'ADD_EQUIPMENT', payload: newEquipment });
      } catch (error: any) {
        console.error('[UnifiedContext] Add equipment error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    },

    async loadInventory() {
      try {
        const inventory = await yachtSentinel.getInventory();
        dispatch({ type: 'SET_INVENTORY', payload: inventory });
      } catch (error: any) {
        console.error('[UnifiedContext] Load inventory error:', error);
        // Don't set error for optional data loading
      }
    },

    async addInventoryItem(itemData: Partial<InventoryItem>) {
      try {
        const newItem = await yachtSentinel.addInventoryItem(itemData);
        dispatch({ type: 'ADD_INVENTORY_ITEM', payload: newItem });
      } catch (error: any) {
        console.error('[UnifiedContext] Add inventory item error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    },

    async scanDocument(imageData: string, documentType = 'auto_detect') {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const result = await yachtSentinel.scanDocument(imageData, documentType);
        return result;
      } catch (error: any) {
        console.error('[UnifiedContext] Document scan error:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    async checkSystemStatus() {
      try {
        const status = await yachtSentinel.getSystemStatus();
        dispatch({ type: 'SET_SYSTEM_STATUS', payload: status });
      } catch (error: any) {
        // Only log connection errors once to reduce console noise
        if (!error.message?.includes('Failed to fetch')) {
          console.error('[UnifiedContext] System status check error:', error);
        }
        // Set degraded status when system checks fail
        dispatch({ 
          type: 'SET_SYSTEM_STATUS', 
          payload: {
            status: 'degraded' as const,
            services: { database: true, authentication: false, document_ai: false },
            timestamp: new Date().toISOString()
          }
        });
      }
    },

    setError(error: string | null) {
      dispatch({ type: 'SET_ERROR', payload: error });
    },

    setLoading(loading: boolean) {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }
  };

  // Initialize on mount
  useEffect(() => {
    actions.checkAuth();
    actions.checkSystemStatus();
    
    // Set up periodic system status checks
    const statusInterval = setInterval(() => {
      actions.checkSystemStatus();
    }, 30000); // Every 30 seconds

    return () => clearInterval(statusInterval);
  }, []);

  // Load yachts when user is authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      actions.loadYachts();
    }
  }, [state.isAuthenticated, state.user]);

  // Set up real-time subscriptions when yacht is selected
  useEffect(() => {
    if (state.currentYachtId) {
      const unsubscribe = yachtSentinel.subscribeToYachtUpdates((payload) => {
        console.log('[UnifiedContext] Real-time update:', payload);
        
        // Refresh relevant data based on the change
        if (payload.table === 'equipment') {
          actions.loadEquipment();
        } else if (payload.table === 'inventory_items') {
          actions.loadInventory();
        }
      });

      dispatch({ type: 'SET_REALTIME_STATUS', payload: true });

      return () => {
        unsubscribe();
        dispatch({ type: 'SET_REALTIME_STATUS', payload: false });
      };
    }
  }, [state.currentYachtId]);

  return (
    <UnifiedYachtSentinelContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </UnifiedYachtSentinelContext.Provider>
  );
};

// Hook to use the context
export const useUnifiedYachtSentinel = () => {
  const context = useContext(UnifiedYachtSentinelContext);
  if (!context) {
    throw new Error('useUnifiedYachtSentinel must be used within UnifiedYachtSentinelProvider');
  }
  return context;
};

export default UnifiedYachtSentinelContext;