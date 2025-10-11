import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { YachtieOrchestrator, OrchestrationResult } from '@/services/YachtieOrchestrator';

export interface UseYachtieOrchestratorReturn {
  // Core orchestration methods
  processSmartScan: (content: string | Blob, context?: any) => Promise<OrchestrationResult>;
  classifyDocument: (text: string, context?: any) => Promise<OrchestrationResult>;
  analyzeData: (data: object, context?: any) => Promise<OrchestrationResult>;
  searchKnowledge: (query: string, context?: any) => Promise<OrchestrationResult>;
  makeDecision: (analysis: any, context?: any) => Promise<OrchestrationResult>;

  // Behavior analytics
  behaviorPatterns: any;
  loadingPatterns: boolean;
  refreshPatterns: () => void;

  // Proactive suggestions
  suggestions: any[];
  loadingSuggestions: boolean;
  respondToSuggestion: (id: string, action: 'accepted' | 'dismissed') => Promise<void>;

  // Knowledge library
  addToLibrary: (title: string, content: any, type: string, metadata?: any) => Promise<any>;
  searchLibrary: (query: string, type?: string) => Promise<any[]>;

  // Model performance
  modelMetrics: any[];
  orchestrationRules: any[];
  loadingMetrics: boolean;

  // State
  isProcessing: boolean;
  lastResult: OrchestrationResult | null;
  error: string | null;
}

export function useYachtieOrchestrator(): UseYachtieOrchestratorReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<OrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const orchestrator = YachtieOrchestrator.getInstance();

  // Behavior patterns query
  const { 
    data: behaviorPatterns, 
    isLoading: loadingPatterns,
    refetch: refreshPatterns
  } = useQuery({
    queryKey: ['behavior-patterns'],
    queryFn: () => orchestrator.getUserBehaviorPatterns(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Proactive suggestions query
  const { 
    data: suggestions = [], 
    isLoading: loadingSuggestions 
  } = useQuery({
    queryKey: ['proactive-suggestions'],
    queryFn: () => orchestrator.getProactiveSuggestions(),
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Model performance metrics query
  const { 
    data: modelMetrics = [], 
    isLoading: loadingMetrics 
  } = useQuery({
    queryKey: ['model-metrics'],
    queryFn: () => orchestrator.getModelPerformanceMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Orchestration rules query
  const { data: orchestrationRules = [] } = useQuery({
    queryKey: ['orchestration-rules'],
    queryFn: () => orchestrator.getOrchestrationRules(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Core orchestration methods with error handling and state management
  const processSmartScan = useCallback(async (content: string | Blob, context?: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await orchestrator.processSmartScan(content, context);
      setLastResult(result);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['behavior-patterns'] });
      queryClient.invalidateQueries({ queryKey: ['proactive-suggestions'] });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Smart scan failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [orchestrator, queryClient]);

  const classifyDocument = useCallback(async (text: string, context?: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await orchestrator.classifyDocument(text, context);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Document classification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [orchestrator]);

  const analyzeData = useCallback(async (data: object, context?: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await orchestrator.analyzeData(data, context);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Data analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [orchestrator]);

  const searchKnowledge = useCallback(async (query: string, context?: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await orchestrator.searchKnowledge(query, context);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Knowledge search failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [orchestrator]);

  const makeDecision = useCallback(async (analysis: any, context?: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await orchestrator.makeDecision(analysis, context);
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Decision making failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [orchestrator]);

  // Suggestion response mutation
  const respondToSuggestionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accepted' | 'dismissed' }) =>
      orchestrator.respondToSuggestion(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proactive-suggestions'] });
    },
  });

  const respondToSuggestion = useCallback(async (id: string, action: 'accepted' | 'dismissed') => {
    await respondToSuggestionMutation.mutateAsync({ id, action });
  }, [respondToSuggestionMutation]);

  // Knowledge library mutations
  const addToLibraryMutation = useMutation({
    mutationFn: ({ title, content, type, metadata }: any) =>
      orchestrator.addToKnowledgeLibrary(title, content, type, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-library'] });
    },
  });

  const addToLibrary = useCallback(async (title: string, content: any, type: string, metadata?: any) => {
    return await addToLibraryMutation.mutateAsync({ title, content, type, metadata });
  }, [addToLibraryMutation]);

  const searchLibrary = useCallback(async (query: string, type?: string) => {
    try {
      return await orchestrator.searchKnowledgeLibrary(query, type);
    } catch (err) {
      console.error('Library search failed:', err);
      return [];
    }
  }, [orchestrator]);

  return {
    // Core orchestration methods
    processSmartScan,
    classifyDocument,
    analyzeData,
    searchKnowledge,
    makeDecision,

    // Behavior analytics
    behaviorPatterns,
    loadingPatterns,
    refreshPatterns: () => refreshPatterns(),

    // Proactive suggestions
    suggestions,
    loadingSuggestions,
    respondToSuggestion,

    // Knowledge library
    addToLibrary,
    searchLibrary,

    // Model performance
    modelMetrics,
    orchestrationRules,
    loadingMetrics,

    // State
    isProcessing,
    lastResult,
    error,
  };
}