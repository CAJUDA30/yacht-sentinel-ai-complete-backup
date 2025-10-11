import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserMemory {
  id: string;
  memory_type: 'ocr_interaction' | 'conversation' | 'preference' | 'workflow' | 'decision' | 'scan_result' | 'module_usage' | 'voice_command' | 'troubleshooting';
  title: string;
  content: any;
  importance_score: number;
  access_frequency: number;
  last_accessed_at: string;
  created_at: string;
  module?: string;
  tags: string[];
  metadata: any;
}

export interface MemorySearchResult {
  memory: UserMemory;
  similarity_score: number;
  relevance_context: string;
}

export interface PersonalizationProfile {
  id: string;
  communication_style: {
    tone: 'professional' | 'casual' | 'technical';
    verbosity: 'concise' | 'balanced' | 'detailed';
    language: string;
  };
  domain_expertise: Record<string, number>; // module -> expertise level (0-1)
  preferred_modules: string[];
  interaction_preferences: {
    preferred_input: 'voice' | 'text' | 'scan';
    auto_execute_threshold: number;
    notification_level: 'minimal' | 'standard' | 'detailed';
  };
  learning_history: Record<string, any>;
  safety_preferences: any;
  notification_preferences: any;
  privacy_settings: {
    share_anonymized: boolean;
    retain_conversations: boolean;
    memory_retention_days?: number;
  };
}

export interface YachtieRequest {
  event_type: 'ocr_scan' | 'voice_command' | 'chat' | 'analysis' | 'recommendation';
  content: string | any;
  context: {
    user_id: string;
    yacht_id?: string;
    session_id: string;
    module?: string;
    file_path?: string;
    file_type?: string;
    hint?: string;
  };
  options?: {
    use_memory?: boolean;
    memory_depth?: number;
    confidence_threshold?: number;
    auto_execute?: boolean;
  };
}

export interface YachtieResponse {
  success: boolean;
  event_type: string;
  routing_decision?: {
    target_module: string;
    confidence: number;
    reasoning: string;
    auto_executed?: boolean;
  };
  extracted_data?: any;
  recommendations?: string[];
  memory_used?: any[];
  processing_time_ms: number;
  session_id: string;
  error?: string;
}

export function useUserMemory() {
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);

  // Load user memories
  const loadMemories = useCallback(async (limit = 50, memoryType?: string, module?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('user_memories')
        .select('*')
        .order('importance_score', { ascending: false })
        .order('last_accessed_at', { ascending: false })
        .limit(limit);

      if (memoryType) {
        query = query.eq('memory_type', memoryType);
      }
      
      if (module) {
        query = query.eq('module', module);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Error loading memories:', error);
      toast.error('Failed to load memories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search memories semantically
  const searchMemories = useCallback(async (query: string, limit = 10) => {
    setIsLoading(true);
    try {
      // Call Supabase function for semantic search
      const { data, error } = await supabase.functions.invoke('memory-semantic-search', {
        body: { query, limit }
      });

      if (error) throw error;
      setSearchResults(data.results || []);
      return data.results || [];
    } catch (error) {
      console.error('Error searching memories:', error);
      toast.error('Failed to search memories');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Store new memory
  const storeMemory = useCallback(async (memory: Omit<UserMemory, 'id' | 'created_at' | 'access_frequency' | 'last_accessed_at'>) => {
    try {
      const { data, error } = await supabase
        .from('user_memories')
        .insert({
          ...memory,
          access_frequency: 0,
          last_accessed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Reload memories to update the list
      await loadMemories();
      return data;
    } catch (error) {
      console.error('Error storing memory:', error);
      toast.error('Failed to store memory');
      throw error;
    }
  }, [loadMemories]);

  // Update memory importance or access
  const updateMemory = useCallback(async (id: string, updates: Partial<UserMemory>) => {
    try {
      const { error } = await supabase
        .from('user_memories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setMemories(prev => prev.map(memory => 
        memory.id === id ? { ...memory, ...updates } : memory
      ));
    } catch (error) {
      console.error('Error updating memory:', error);
      toast.error('Failed to update memory');
    }
  }, []);

  // Delete memory
  const deleteMemory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setMemories(prev => prev.filter(memory => memory.id !== id));
      toast.success('Memory deleted');
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast.error('Failed to delete memory');
    }
  }, []);

  // Get memory analytics
  const getMemoryAnalytics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_memories')
        .select('memory_type, module, importance_score, access_frequency, created_at');

      if (error) throw error;

      const analytics = {
        total_memories: data.length,
        by_type: {} as Record<string, number>,
        by_module: {} as Record<string, number>,
        avg_importance: 0,
        most_accessed: [] as any[]
      };

      data.forEach(memory => {
        analytics.by_type[memory.memory_type] = (analytics.by_type[memory.memory_type] || 0) + 1;
        if (memory.module) {
          analytics.by_module[memory.module] = (analytics.by_module[memory.module] || 0) + 1;
        }
        analytics.avg_importance += memory.importance_score;
      });

      analytics.avg_importance /= data.length;
      analytics.most_accessed = data
        .sort((a, b) => b.access_frequency - a.access_frequency)
        .slice(0, 5);

      return analytics;
    } catch (error) {
      console.error('Error getting memory analytics:', error);
      return null;
    }
  }, []);

  return {
    memories,
    searchResults,
    isLoading,
    loadMemories,
    searchMemories,
    storeMemory,
    updateMemory,
    deleteMemory,
    getMemoryAnalytics
  };
}

export function usePersonalizationProfile() {
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user profile
  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_personalization_profiles')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore 'not found' errors
      setProfile(data || null);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load personalization profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<PersonalizationProfile>) => {
    try {
      const { data, error } = await supabase
        .from('user_personalization_profiles')
        .upsert({
          ...profile,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      toast.success('Profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  }, [profile]);

  // Update domain expertise based on usage
  const updateDomainExpertise = useCallback(async (module: string, increment = 0.1) => {
    if (!profile) return;

    const currentExpertise = profile.domain_expertise[module] || 0;
    const newExpertise = Math.min(currentExpertise + increment, 1.0);

    await updateProfile({
      domain_expertise: {
        ...profile.domain_expertise,
        [module]: newExpertise
      }
    });
  }, [profile, updateProfile]);

  // Track module usage
  const trackModuleUsage = useCallback(async (module: string) => {
    if (!profile) return;

    const preferredModules = profile.preferred_modules || [];
    if (!preferredModules.includes(module)) {
      preferredModules.push(module);
      
      // Keep only top 5 most used modules
      const sortedModules = preferredModules.slice(-5);
      
      await updateProfile({
        preferred_modules: sortedModules
      });
    }

    // Update domain expertise
    await updateDomainExpertise(module);
  }, [profile, updateProfile, updateDomainExpertise]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    loadProfile,
    updateProfile,
    updateDomainExpertise,
    trackModuleUsage
  };
}

export function useYachtieAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<YachtieResponse | null>(null);
  const { trackModuleUsage } = usePersonalizationProfile();

  // Process request with Yachtie
  const processWithYachtie = useCallback(async (request: YachtieRequest): Promise<YachtieResponse> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('yachtie-enhanced-orchestrator', {
        body: request
      });

      if (error) throw error;

      const response: YachtieResponse = data;
      setLastResponse(response);

      // Track module usage if successful routing
      if (response.success && response.routing_decision?.target_module) {
        await trackModuleUsage(response.routing_decision.target_module);
      }

      return response;
    } catch (error) {
      console.error('Yachtie processing error:', error);
      const errorResponse: YachtieResponse = {
        success: false,
        event_type: request.event_type,
        processing_time_ms: 0,
        session_id: request.context.session_id,
        error: error.message
      };
      setLastResponse(errorResponse);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [trackModuleUsage]);

  // Scan with OCR
  const scanWithOCR = useCallback(async (
    imageData: string,
    context: {
      module?: string;
      hint?: string;
      file_type?: string;
    },
    options?: {
      auto_execute?: boolean;
      confidence_threshold?: number;
    }
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const request: YachtieRequest = {
      event_type: 'ocr_scan',
      content: imageData,
      context: {
        user_id: user.id,
        session_id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...context
      },
      options: {
        use_memory: true,
        memory_depth: 5,
        ...options
      }
    };

    return await processWithYachtie(request);
  }, [processWithYachtie]);

  // Chat with Yachtie
  const chatWithYachtie = useCallback(async (
    message: string,
    context?: {
      module?: string;
      session_id?: string;
    }
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const request: YachtieRequest = {
      event_type: 'chat',
      content: message,
      context: {
        user_id: user.id,
        session_id: context?.session_id || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        module: context?.module
      },
      options: {
        use_memory: true,
        memory_depth: 10
      }
    };

    return await processWithYachtie(request);
  }, [processWithYachtie]);

  // Get recommendations
  const getRecommendations = useCallback(async (
    context: {
      module: string;
      data?: any;
    }
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const request: YachtieRequest = {
      event_type: 'recommendation',
      content: context.data || {},
      context: {
        user_id: user.id,
        session_id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        module: context.module
      },
      options: {
        use_memory: true,
        memory_depth: 8
      }
    };

    return await processWithYachtie(request);
  }, [processWithYachtie]);

  return {
    isProcessing,
    lastResponse,
    processWithYachtie,
    scanWithOCR,
    chatWithYachtie,
    getRecommendations
  };
}

export function useMemoryManagement() {
  const [compressionStatus, setCompressionStatus] = useState<'idle' | 'compressing' | 'completed'>('idle');

  // Compress old memories
  const compressMemories = useCallback(async (olderThanDays = 30) => {
    setCompressionStatus('compressing');
    try {
      const { data, error } = await supabase.functions.invoke('memory-compression', {
        body: { older_than_days: olderThanDays }
      });

      if (error) throw error;
      
      setCompressionStatus('completed');
      toast.success(`Compressed ${data.compressed_count} memories`);
      
      // Reset status after 3 seconds
      setTimeout(() => setCompressionStatus('idle'), 3000);
      
      return data;
    } catch (error) {
      console.error('Memory compression error:', error);
      toast.error('Failed to compress memories');
      setCompressionStatus('idle');
      throw error;
    }
  }, []);

  // Clean expired memories
  const cleanExpiredMemories = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('memory-cleanup');
      
      if (error) throw error;
      
      toast.success(`Cleaned up ${data.deleted_count} expired memories`);
      return data;
    } catch (error) {
      console.error('Memory cleanup error:', error);
      toast.error('Failed to clean up memories');
      throw error;
    }
  }, []);

  // Export user memories
  const exportMemories = useCallback(async (format: 'json' | 'csv' = 'json') => {
    try {
      const { data, error } = await supabase.functions.invoke('memory-export', {
        body: { format }
      });

      if (error) throw error;
      
      // Create and download file
      const blob = new Blob([data.content], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memories_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Memories exported successfully');
      return data;
    } catch (error) {
      console.error('Memory export error:', error);
      toast.error('Failed to export memories');
      throw error;
    }
  }, []);

  return {
    compressionStatus,
    compressMemories,
    cleanExpiredMemories,
    exportMemories
  };
}