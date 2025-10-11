import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserAction, BehaviorPattern, ProactiveSuggestion, BehaviorAnalytics } from '@/types/behavior-analytics';

export const useBehaviorAnalytics = () => {
  const queryClient = useQueryClient();
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Track user action
  const trackAction = useMutation({
    mutationFn: async (action: Omit<UserAction, 'id' | 'timestamp' | 'session_id'>) => {
      const { data, error } = await supabase.functions.invoke('behavior-analytics-processor', {
        body: {
          action: 'track_action',
          data: {
            ...action,
            session_id: sessionId,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate analytics queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['behavior-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['proactive-suggestions'] });
    }
  });

  // Get behavior analytics
  const analytics = useQuery({
    queryKey: ['behavior-analytics'],
    queryFn: async (): Promise<BehaviorAnalytics> => {
      const { data, error } = await supabase.functions.invoke('behavior-analytics-processor', {
        body: {
          action: 'get_analytics',
          data: {}
        }
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get proactive suggestions
  const suggestions = useQuery({
    queryKey: ['proactive-suggestions'],
    queryFn: async (): Promise<ProactiveSuggestion[]> => {
      const { data, error } = await supabase.functions.invoke('behavior-analytics-processor', {
        body: {
          action: 'get_suggestions',
          data: {}
        }
      });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Dismiss suggestion
  const dismissSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data, error } = await supabase.functions.invoke('behavior-analytics-processor', {
        body: {
          action: 'dismiss_suggestion',
          data: { suggestion_id: suggestionId }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proactive-suggestions'] });
    }
  });

  // Act on suggestion
  const actOnSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data, error } = await supabase.functions.invoke('behavior-analytics-processor', {
        body: {
          action: 'act_on_suggestion',
          data: { suggestion_id: suggestionId }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proactive-suggestions'] });
    }
  });

  // Helper functions for common tracking
  const trackModuleVisit = useCallback((module: string, context?: Record<string, any>) => {
    trackAction.mutate({
      action_type: 'module_visit',
      module,
      context: context || {},
      user_id: '', // Will be filled by auth context
      metadata: {
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    });
  }, [trackAction]);

  const trackFeatureUsage = useCallback((feature: string, module: string, context?: Record<string, any>) => {
    trackAction.mutate({
      action_type: 'feature_usage',
      module,
      context: { feature, ...context },
      user_id: '',
      metadata: {
        timestamp: Date.now(),
        user_agent: navigator.userAgent.substring(0, 100)
      }
    });
  }, [trackAction]);

  const trackSearch = useCallback((query: string, module: string, results_count?: number) => {
    trackAction.mutate({
      action_type: 'search',
      module,
      context: { query, results_count },
      user_id: '',
      metadata: {
        query_length: query.length,
        timestamp: Date.now()
      }
    });
  }, [trackAction]);

  const trackScanUsage = useCallback((scanType: string, module: string, confidence?: number, success?: boolean) => {
    trackAction.mutate({
      action_type: 'smart_scan',
      module,
      context: { scanType, confidence, success },
      user_id: '',
      metadata: {
        scan_timestamp: Date.now(),
        device_type: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'mobile' : 'desktop'
      }
    });
  }, [trackAction]);

  return {
    // Queries
    analytics: analytics.data,
    suggestions: suggestions.data || [],
    isLoading: analytics.isLoading || suggestions.isLoading,
    
    // Mutations
    trackAction: trackAction.mutate,
    dismissSuggestion: dismissSuggestion.mutate,
    actOnSuggestion: actOnSuggestion.mutate,
    
    // Helper functions
    trackModuleVisit,
    trackFeatureUsage,
    trackSearch,
    trackScanUsage,
    
    // State
    sessionId,
    
    // Loading states
    isTrackingAction: trackAction.isPending,
    isDismissingSuggestion: dismissSuggestion.isPending,
    isActingOnSuggestion: actOnSuggestion.isPending,
  };
};