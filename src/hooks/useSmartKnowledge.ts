import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SmartKnowledgeItem, KnowledgeSearch, KnowledgeSearchResult } from '@/types/behavior-analytics';

export const useSmartKnowledge = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Get all knowledge items
  const knowledgeItems = useQuery({
    queryKey: ['smart-knowledge'],
    queryFn: async (): Promise<SmartKnowledgeItem[]> => {
      const { data, error } = await supabase.functions.invoke('smart-knowledge-processor', {
        body: {
          action: 'get_all',
          data: {}
        }
      });

      if (error) throw error;
      return data || [];
    }
  });

  // Search knowledge items
  const searchResults = useQuery({
    queryKey: ['knowledge-search', searchQuery],
    queryFn: async (): Promise<KnowledgeSearchResult[]> => {
      if (!searchQuery.trim()) return [];
      
      const { data, error } = await supabase.functions.invoke('smart-knowledge-processor', {
        body: {
          action: 'search',
          data: {
            query: searchQuery,
            max_results: 10,
            similarity_threshold: 0.7
          } as KnowledgeSearch
        }
      });

      if (error) throw error;
      return data || [];
    },
    enabled: searchQuery.trim().length > 2
  });

  // Add knowledge item
  const addKnowledgeItem = useMutation({
    mutationFn: async (item: Omit<SmartKnowledgeItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.functions.invoke('smart-knowledge-processor', {
        body: {
          action: 'add_item',
          data: item
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-knowledge'] });
    }
  });

  // Update knowledge item
  const updateKnowledgeItem = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SmartKnowledgeItem> }) => {
      const { data, error } = await supabase.functions.invoke('smart-knowledge-processor', {
        body: {
          action: 'update_item',
          data: { id, updates }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-knowledge'] });
    }
  });

  // Delete knowledge item
  const deleteKnowledgeItem = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('smart-knowledge-processor', {
        body: {
          action: 'delete_item',
          data: { id }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-knowledge'] });
    }
  });

  // Process scan result into knowledge
  const processScanToKnowledge = useMutation({
    mutationFn: async (scanResult: any) => {
      const { data, error } = await supabase.functions.invoke('smart-knowledge-processor', {
        body: {
          action: 'process_scan',
          data: { scan_result: scanResult }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-knowledge'] });
    }
  });

  // Get contextual suggestions
  const getContextualKnowledge = useMutation({
    mutationFn: async ({ module, context }: { module: string; context: Record<string, any> }) => {
      const { data, error } = await supabase.functions.invoke('smart-knowledge-processor', {
        body: {
          action: 'get_contextual',
          data: { module, context }
        }
      });

      if (error) throw error;
      return data || [];
    }
  });

  // Sync knowledge across fleet
  const syncFleetKnowledge = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-knowledge-processor', {
        body: {
          action: 'sync_fleet',
          data: {}
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-knowledge'] });
    }
  });

  return {
    // Data
    knowledgeItems: knowledgeItems.data || [],
    searchResults: searchResults.data || [],
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Loading states
    isLoading: knowledgeItems.isLoading,
    isSearching: searchResults.isLoading,
    
    // Mutations
    addKnowledgeItem: addKnowledgeItem.mutate,
    updateKnowledgeItem: updateKnowledgeItem.mutate,
    deleteKnowledgeItem: deleteKnowledgeItem.mutate,
    processScanToKnowledge: processScanToKnowledge.mutate,
    getContextualKnowledge: getContextualKnowledge.mutate,
    syncFleetKnowledge: syncFleetKnowledge.mutate,
    
    // Loading states for mutations
    isAdding: addKnowledgeItem.isPending,
    isUpdating: updateKnowledgeItem.isPending,
    isDeleting: deleteKnowledgeItem.isPending,
    isProcessingScan: processScanToKnowledge.isPending,
    isGettingContextual: getContextualKnowledge.isPending,
    isSyncing: syncFleetKnowledge.isPending,
  };
};