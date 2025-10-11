import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface KnowledgeItem {
  id: string;
  content_text: string;
  module: string;
  knowledge_type: string;
  confidence_score: number;
  yacht_id?: string;
  is_shared: boolean;
  created_at: string;
  metadata?: {
    title?: string;
    source?: string;
    [key: string]: any;
  };
  similarity_score?: number;
  relevance?: number;
}

export interface KnowledgeSearchOptions {
  query: string;
  module?: string;
  knowledge_type?: string;
  yacht_id?: string;
  similarity_threshold?: number;
  max_results?: number;
  include_shared?: boolean;
}

export interface KnowledgeAddOptions {
  title: string;
  content: string;
  knowledge_type: 'manual' | 'procedure' | 'specification' | 'maintenance_guide' | 'safety_document' | 'other';
  module: string;
  yacht_id?: string;
  is_shared?: boolean;
  metadata?: Record<string, any>;
}

export interface KnowledgeStats {
  total_knowledge: number;
  user_knowledge: number;
  shared_knowledge: number;
  accessible_knowledge: number;
  module_breakdown: Record<string, number>;
}

export function useProductionKnowledgeLibrary() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const { toast } = useToast();

  const searchKnowledge = useCallback(async (options: KnowledgeSearchOptions) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('production-knowledge-library', {
        body: options
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data.results || []);
      
      if (data.results.length === 0) {
        toast({
          title: "No Results",
          description: `No knowledge found for "${options.query}"`,
          variant: "default"
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${data.results.length} relevant items`,
        });
      }

      return data.results || [];

    } catch (error) {
      console.error('Knowledge search error:', error);
      toast({
        title: "Search Error",
        description: error.message || 'Failed to search knowledge library',
        variant: "destructive"
      });
      setSearchResults([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addKnowledge = useCallback(async (options: KnowledgeAddOptions) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('production-knowledge-library', {
        body: {
          action: 'add',
          ...options
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to add knowledge');
      }

      toast({
        title: "Knowledge Added",
        description: `"${options.title}" has been added to the library`,
      });

      return data.knowledge_id;

    } catch (error) {
      console.error('Add knowledge error:', error);
      toast({
        title: "Add Error",
        description: error.message || 'Failed to add to knowledge library',
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateKnowledge = useCallback(async (id: string, updates: Partial<KnowledgeAddOptions>) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('production-knowledge-library', {
        body: {
          action: 'update',
          id,
          ...updates
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to update knowledge');
      }

      toast({
        title: "Knowledge Updated",
        description: "The knowledge item has been updated",
      });

      // Refresh search results if they contain this item
      setSearchResults(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));

      return true;

    } catch (error) {
      console.error('Update knowledge error:', error);
      toast({
        title: "Update Error",
        description: error.message || 'Failed to update knowledge',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteKnowledge = useCallback(async (id: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('production-knowledge-library', {
        body: {
          action: 'delete',
          id
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete knowledge');
      }

      toast({
        title: "Knowledge Deleted",
        description: "The knowledge item has been removed",
      });

      // Remove from search results
      setSearchResults(prev => prev.filter(item => item.id !== id));

      return true;

    } catch (error) {
      console.error('Delete knowledge error:', error);
      toast({
        title: "Delete Error",
        description: error.message || 'Failed to delete knowledge',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const bulkIndexDocuments = useCallback(async (documents: Array<{ 
    title: string; 
    content: string; 
    module: string; 
    knowledge_type: string 
  }>) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('production-knowledge-library', {
        body: {
          action: 'bulk_index',
          documents
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Bulk indexing failed');
      }

      const { successful, failed, total } = data.summary;

      toast({
        title: "Bulk Indexing Complete",
        description: `${successful}/${total} documents indexed successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        variant: failed > 0 ? "destructive" : "default"
      });

      return data.results;

    } catch (error) {
      console.error('Bulk index error:', error);
      toast({
        title: "Bulk Index Error",
        description: error.message || 'Failed to bulk index documents',
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('production-knowledge-library', {
        body: { action: 'stats' }
      });

      if (error) throw error;

      if (data.success) {
        setStats(data.stats);
        return data.stats;
      }

      return null;

    } catch (error) {
      console.error('Get stats error:', error);
      return null;
    }
  }, []);

  const semanticSearch = useCallback(async (
    query: string, 
    options: Omit<KnowledgeSearchOptions, 'query'> = {}
  ) => {
    return searchKnowledge({ query, ...options });
  }, [searchKnowledge]);

  const searchByModule = useCallback(async (module: string, query: string) => {
    return searchKnowledge({ query, module });
  }, [searchKnowledge]);

  const searchByType = useCallback(async (knowledge_type: string, query: string) => {
    return searchKnowledge({ query, knowledge_type });
  }, [searchKnowledge]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    // State
    isLoading,
    searchResults,
    stats,

    // Core functions
    searchKnowledge,
    addKnowledge,
    updateKnowledge,
    deleteKnowledge,

    // Utility functions
    semanticSearch,
    searchByModule,
    searchByType,
    bulkIndexDocuments,
    getStats,
    clearResults,

    // Computed values
    hasResults: searchResults.length > 0,
    resultCount: searchResults.length
  };
}