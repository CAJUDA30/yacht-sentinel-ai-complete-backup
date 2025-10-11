/**
 * YachtieContext - React Context for Yachtie AI Integration
 * 
 * Provides React components with access to Yachtie AI services
 * and maintains global state for AI operations.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { yachtieService, YachtieRequest, YachtieResponse } from '@/services/YachtieIntegrationService';
import { yachtieConsensus, ConsensusRequest, ConsensusResponse } from '@/services/YachtieConsensusEngine';

interface YachtieContextType {
  // Core Yachtie operations
  process: (request: YachtieRequest) => Promise<YachtieResponse>;
  translate: (text: string, targetLang: string, sourceLang?: string) => Promise<YachtieResponse>;
  validate: (text: string, type?: string) => Promise<YachtieResponse>;
  summarize: (text: string, maxLength?: number, language?: string) => Promise<YachtieResponse>;
  classify: (text: string, categories: string[], language?: string) => Promise<YachtieResponse>;
  extract: (text: string, schema: any, language?: string) => Promise<YachtieResponse>;
  
  // Consensus operations
  processConsensus: (request: ConsensusRequest) => Promise<ConsensusResponse>;
  
  // State management
  isProcessing: boolean;
  lastResponse: YachtieResponse | null;
  processingQueue: string[];
  
  // Statistics and monitoring
  stats: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    cacheHitRate: number;
  };
  
  // Real-time capabilities
  startRealtimeProcessing: () => void;
  stopRealtimeProcessing: () => void;
  isRealtimeActive: boolean;
  
  // Error handling
  lastError: string | null;
  clearError: () => void;
}

const YachtieContext = createContext<YachtieContextType | undefined>(undefined);

export const useYachtie = (): YachtieContextType => {
  const context = useContext(YachtieContext);
  if (!context) {
    throw new Error('useYachtie must be used within a YachtieProvider');
  }
  return context;
};

interface YachtieProviderProps {
  children: ReactNode;
}

export const YachtieProvider: React.FC<YachtieProviderProps> = ({ children }) => {
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<YachtieResponse | null>(null);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalRequests: 0,
    successRate: 1.0,
    averageResponseTime: 0,
    cacheHitRate: 0.85
  });

  // Core processing wrapper with state management
  const process = async (request: YachtieRequest): Promise<YachtieResponse> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    try {
      setIsProcessing(true);
      setProcessingQueue(prev => [...prev, requestId]);
      setLastError(null);
      
      const startTime = Date.now();
      const response = await yachtieService.process(request);
      
      // Update statistics
      setStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        successRate: (prev.successRate * prev.totalRequests + (response.success ? 1 : 0)) / (prev.totalRequests + 1),
        averageResponseTime: (prev.averageResponseTime * prev.totalRequests + (Date.now() - startTime)) / (prev.totalRequests + 1),
        cacheHitRate: yachtieService.getStats().cacheHitRate
      }));
      
      setLastResponse(response);
      
      if (!response.success && response.error) {
        setLastError(response.error);
      }
      
      return response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      
      return {
        success: false,
        result: null,
        confidence: 0,
        language: request.language || 'en',
        processingTime: 0,
        model: 'yachtie-multilingual-v1',
        error: errorMessage
      };
      
    } finally {
      setProcessingQueue(prev => prev.filter(id => id !== requestId));
      setIsProcessing(prev => processingQueue.length <= 1 ? false : prev);
    }
  };

  // Consensus processing wrapper
  const processConsensus = async (request: ConsensusRequest): Promise<ConsensusResponse> => {
    try {
      setIsProcessing(true);
      setLastError(null);
      
      const response = await yachtieConsensus.processConsensus(request);
      return response;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Consensus processing failed';
      setLastError(errorMessage);
      throw error;
      
    } finally {
      setIsProcessing(false);
    }
  };

  // Convenience methods
  const translate = async (text: string, targetLang: string, sourceLang?: string): Promise<YachtieResponse> => {
    return process({
      text,
      task: 'translate',
      language: sourceLang,
      targetLanguage: targetLang,
      context: 'yacht_management'
    });
  };

  const validate = async (text: string, type: string = 'general'): Promise<YachtieResponse> => {
    return process({
      text,
      task: 'validate',
      context: type,
      options: { sanitize: true, checkMalicious: true }
    });
  };

  const summarize = async (text: string, maxLength: number = 200, language?: string): Promise<YachtieResponse> => {
    return process({
      text,
      task: 'summarize',
      language,
      options: { maxLength, contextAware: true }
    });
  };

  const classify = async (text: string, categories: string[], language?: string): Promise<YachtieResponse> => {
    return process({
      text,
      task: 'classify',
      language,
      options: { categories }
    });
  };

  const extract = async (text: string, schema: any, language?: string): Promise<YachtieResponse> => {
    return process({
      text,
      task: 'extract',
      language,
      options: { schema, structured: true }
    });
  };

  // Real-time processing management
  const startRealtimeProcessing = () => {
    setIsRealtimeActive(true);
    // Initialize real-time connections, WebSocket handlers, etc.
    console.log('Yachtie real-time processing started');
  };

  const stopRealtimeProcessing = () => {
    setIsRealtimeActive(false);
    // Clean up real-time connections
    console.log('Yachtie real-time processing stopped');
  };

  // Error management
  const clearError = () => {
    setLastError(null);
  };

  // Initialize statistics on mount
  useEffect(() => {
    const initStats = () => {
      const serviceStats = yachtieService.getStats();
      setStats(prev => ({
        ...prev,
        cacheHitRate: serviceStats.cacheHitRate
      }));
    };

    initStats();
    
    // Update stats periodically
    const interval = setInterval(initStats, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Context value
  const contextValue: YachtieContextType = {
    // Core operations
    process,
    translate,
    validate,
    summarize,
    classify,
    extract,
    
    // Consensus operations
    processConsensus,
    
    // State
    isProcessing,
    lastResponse,
    processingQueue,
    stats,
    
    // Real-time
    startRealtimeProcessing,
    stopRealtimeProcessing,
    isRealtimeActive,
    
    // Error handling
    lastError,
    clearError
  };

  return (
    <YachtieContext.Provider value={contextValue}>
      {children}
    </YachtieContext.Provider>
  );
};

// Hook for accessing Yachtie in components
export const useYachtieTranslation = () => {
  const { translate, isProcessing } = useYachtie();
  return { translate, isTranslating: isProcessing };
};

export const useYachtieValidation = () => {
  const { validate, isProcessing } = useYachtie();
  return { validate, isValidating: isProcessing };
};

export const useYachtieConsensus = () => {
  const { processConsensus, isProcessing } = useYachtie();
  return { processConsensus, isProcessingConsensus: isProcessing };
};