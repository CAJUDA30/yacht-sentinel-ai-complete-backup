import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ErrorCategory {
  id: string;
  name: string;
  description: string;
  severity_level: 'critical' | 'high' | 'medium' | 'low';
  color: string;
  icon: string;
  auto_assign_rules: any[];
}

export interface EnhancedErrorLog {
  id: string;
  original_log_id?: string;
  error_hash: string;
  category_id?: string;
  category?: ErrorCategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  module?: string;
  source_table?: string;
  stack_trace?: string;
  error_code?: string;
  user_impact_score: number;
  business_impact_score: number;
  frequency_count: number;
  first_occurred_at: string;
  last_occurred_at: string;
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  estimated_resolution_time?: string;
  actual_resolution_time?: string;
  tags: string[];
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ErrorFilters {
  severity?: string;
  category?: string;
  status?: string;
  module?: string;
  search?: string;
  dateRange?: { start: string; end: string };
}

export interface ErrorAnalytics {
  totalErrors: number;
  criticalErrors: number;
  resolvedErrors: number;
  avgResolutionTime: string;
  errorRate: number;
  trendDirection: 'up' | 'down' | 'stable';
  topCategories: Array<{ name: string; count: number; color: string }>;
  errorsByTime: Array<{ time: string; count: number; criticalCount: number }>;
}

export function useEnhancedErrorLogs(initialFilters: ErrorFilters = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ErrorFilters>({
    severity: 'all',
    category: 'all',
    status: 'all',
    module: 'all',
    search: '',
    ...initialFilters,
  });

  // Fetch error categories
  const categoriesQuery = useQuery({
    queryKey: ['error-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_categories')
        .select('*')
        .order('severity_level', { ascending: false });
      
      if (error) throw error;
      return data as ErrorCategory[];
    },
  });

  // Fetch enhanced error logs
  const logsQuery = useQuery({
    queryKey: ['enhanced-error-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('enhanced_error_logs')
        .select(`
          *,
          category:error_categories(*)
        `)
        .order('last_occurred_at', { ascending: false });

      if (filters.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category_id', filters.category);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.module && filters.module !== 'all') {
        query = query.eq('module', filters.module);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data as EnhancedErrorLog[];
    },
  });

  // Error analytics
  const analyticsQuery = useQuery({
    queryKey: ['error-analytics', filters.dateRange],
    queryFn: async () => {
      const endDate = filters.dateRange?.end || new Date().toISOString();
      const startDate = filters.dateRange?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get basic metrics by querying the enhanced_error_logs table directly
      const { data: logs } = await supabase
        .from('enhanced_error_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const totalErrors = logs?.length || 0;
      const criticalErrors = logs?.filter(l => l.severity === 'critical').length || 0;
      const resolvedErrors = logs?.filter(l => l.status === 'resolved').length || 0;

      // Calculate average resolution time
      const resolvedLogs = logs?.filter(l => l.actual_resolution_time) || [];
      const avgResolutionTime = resolvedLogs.length > 0 
        ? `${Math.round(resolvedLogs.reduce((acc, log) => {
            const timeStr = String(log.actual_resolution_time || '0');
            const timeValue = parseFloat(timeStr.split(' ')[0] || '0') || 0;
            return acc + timeValue;
          }, 0) / resolvedLogs.length)} minutes`
        : '0 minutes';

      return {
        totalErrors,
        criticalErrors,
        resolvedErrors,
        avgResolutionTime,
        errorRate: totalErrors > 0 ? (criticalErrors / totalErrors) * 100 : 0,
        trendDirection: 'stable' as const,
        topCategories: [],
        errorsByTime: [],
      } as ErrorAnalytics;
    },
  });

  // Create/Update error log
  const upsertErrorMutation = useMutation({
    mutationFn: async (errorData: { error_hash: string; title: string } & Partial<EnhancedErrorLog>) => {
      const { data, error } = await supabase
        .from('enhanced_error_logs')
        .upsert(errorData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-analytics'] });
    },
  });

  // Update error status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNotes }: { 
      id: string; 
      status: EnhancedErrorLog['status']; 
      resolutionNotes?: string; 
    }) => {
      const { data, error } = await supabase
        .from('enhanced_error_logs')
        .update({
          status,
          resolution_notes: resolutionNotes,
          resolved_by: status === 'resolved' ? (await supabase.auth.getUser()).data.user?.id : null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-analytics'] });
    },
  });

  // Group similar errors
  const groupErrorsMutation = useMutation({
    mutationFn: async (errorIds: string[]) => {
      // This would implement error grouping logic
      // For now, we'll just mark them as related
      const { data, error } = await supabase
        .from('enhanced_error_logs')
        .update({ 
          tags: ['grouped'],
          metadata: { grouped_at: new Date().toISOString() }
        })
        .in('id', errorIds)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-error-logs'] });
    },
  });

  // Auto-categorize errors based on content
  const autoCategorizeError = useCallback(async (logEntry: any) => {
    const categories = categoriesQuery.data || [];
    const message = logEntry.event_message?.toLowerCase() || '';
    
    // Simple rule-based categorization
    let categoryId: string | undefined;
    
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) {
      categoryId = categories.find(c => c.name === 'Security')?.id;
    } else if (message.includes('timeout') || message.includes('slow') || message.includes('latency')) {
      categoryId = categories.find(c => c.name === 'Performance')?.id;
    } else if (message.includes('api') || message.includes('external') || message.includes('integration')) {
      categoryId = categories.find(c => c.name === 'Integration')?.id;
    } else if (message.includes('sql') || message.includes('database') || message.includes('connection')) {
      categoryId = categories.find(c => c.name === 'Database')?.id;
    } else if (message.includes('ai') || message.includes('model') || message.includes('consensus')) {
      categoryId = categories.find(c => c.name === 'AI/ML')?.id;
    }

    return categoryId;
  }, [categoriesQuery.data]);

  // Process raw logs into enhanced error logs
  const processRawLogMutation = useMutation({
    mutationFn: async (rawLog: any) => {
      const errorHash = `${rawLog.event_message}-${rawLog.module}`.slice(0, 50);
      const categoryId = await autoCategorizeError(rawLog);
      
      // Check if similar error already exists
      const { data: existingError } = await supabase
        .from('enhanced_error_logs')
        .select('*')
        .eq('error_hash', errorHash)
        .single();

      if (existingError) {
        // Update frequency and last occurrence
        return await supabase
          .from('enhanced_error_logs')
          .update({
            frequency_count: existingError.frequency_count + 1,
            last_occurred_at: new Date().toISOString(),
          })
          .eq('id', existingError.id)
          .select()
          .single();
      } else {
        // Create new enhanced error log
        return await supabase
          .from('enhanced_error_logs')
          .insert({
            original_log_id: rawLog.id,
            error_hash: errorHash,
            category_id: categoryId,
            severity: rawLog.severity || 'medium',
            title: rawLog.event_message?.slice(0, 100) || 'Unknown Error',
            description: rawLog.event_message,
            module: rawLog.module,
            source_table: 'analytics_events',
            metadata: rawLog.metadata || {},
          })
          .select()
          .single();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-error-logs'] });
      queryClient.invalidateQueries({ queryKey: ['error-analytics'] });
    },
  });

  const setFilter = useCallback((key: keyof ErrorFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      severity: 'all',
      category: 'all',
      status: 'all',
      module: 'all', 
      search: '',
    });
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('enhanced-error-logs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'enhanced_error_logs' 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['enhanced-error-logs'] });
        queryClient.invalidateQueries({ queryKey: ['error-analytics'] });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'analytics_events' 
      }, (payload) => {
        // Auto-process new error logs
        if (payload.eventType === 'INSERT' && payload.new?.severity === 'error') {
          processRawLogMutation.mutate(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [processRawLogMutation, queryClient]);

  return {
    // Data
    errorLogs: logsQuery.data || [],
    categories: categoriesQuery.data || [],
    analytics: analyticsQuery.data,
    
    // Loading states
    isLoading: logsQuery.isLoading || categoriesQuery.isLoading,
    analyticsLoading: analyticsQuery.isLoading,
    
    // Filters
    filters,
    setFilter,
    clearFilters,
    
    // Mutations
    upsertError: upsertErrorMutation,
    updateStatus: updateStatusMutation,
    groupErrors: groupErrorsMutation,
    processRawLog: processRawLogMutation,
    
    // Utils
    refetch: () => {
      logsQuery.refetch();
      analyticsQuery.refetch();
    },
  };
}