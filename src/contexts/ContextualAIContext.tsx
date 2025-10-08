import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AIAssistant {
  id: string;
  name: string;
  module: string;
  personality: string;
  capabilities: string[];
  confidence: number;
}

interface AIResponse {
  id: string;
  content: string;
  confidence: number;
  suggestions: string[];
  actions: Array<{
    label: string;
    action: string;
    parameters?: any;
  }>;
  timestamp: string;
}

interface ContextualAIContextType {
  activeAssistant: AIAssistant | null;
  aiResponses: AIResponse[];
  isProcessing: boolean;
  setActiveAssistant: (assistant: AIAssistant | null) => void;
  askAI: (query: string, context?: any) => Promise<AIResponse>;
  getModuleAssistant: (module: string) => AIAssistant;
  clearHistory: () => void;
}

const ContextualAIContext = createContext<ContextualAIContextType | undefined>(undefined);

export const useContextualAI = () => {
  const context = useContext(ContextualAIContext);
  if (!context) {
    throw new Error('useContextualAI must be used within ContextualAIProvider');
  }
  return context;
};

// Predefined AI assistants for each module
const moduleAssistants: Record<string, AIAssistant> = {
  inventory: {
    id: 'inv-ai-001',
    name: 'StoreMaster AI',
    module: 'inventory',
    personality: 'Analytical and detail-oriented, focused on optimization',
    capabilities: ['stock_analysis', 'reorder_predictions', 'cost_optimization', 'barcode_scanning'],
    confidence: 0.95
  },
  crew: {
    id: 'crew-ai-001',
    name: 'CrewMate AI',
    module: 'crew',
    personality: 'Supportive and people-focused, emphasizes safety and wellbeing',
    capabilities: ['schedule_optimization', 'certification_tracking', 'performance_analysis', 'duty_planning'],
    confidence: 0.92
  },
  maintenance: {
    id: 'maint-ai-001',
    name: 'TechGuard AI',
    module: 'maintenance',
    personality: 'Proactive and systematic, prevents problems before they occur',
    capabilities: ['predictive_maintenance', 'fault_diagnosis', 'repair_scheduling', 'parts_management'],
    confidence: 0.97
  },
  finance: {
    id: 'fin-ai-001',
    name: 'FinanceWise AI',
    module: 'finance',
    personality: 'Strategic and cost-conscious, focused on optimization',
    capabilities: ['budget_analysis', 'cost_prediction', 'expense_optimization', 'financial_reporting'],
    confidence: 0.94
  },
  navigation: {
    id: 'nav-ai-001',
    name: 'Navigator AI',
    module: 'navigation',
    personality: 'Precise and safety-focused, ensures optimal routing',
    capabilities: ['route_optimization', 'weather_analysis', 'fuel_efficiency', 'risk_assessment'],
    confidence: 0.96
  },
  safety: {
    id: 'safe-ai-001',
    name: 'Guardian AI',
    module: 'safety',
    personality: 'Vigilant and protective, prioritizes crew and vessel safety',
    capabilities: ['risk_assessment', 'compliance_monitoring', 'emergency_protocols', 'safety_training'],
    confidence: 0.98
  }
};

export const ContextualAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAssistant, setActiveAssistant] = useState<AIAssistant | null>(null);
  const [aiResponses, setAIResponses] = useState<AIResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const getModuleAssistant = useCallback((module: string): AIAssistant => {
    return moduleAssistants[module] || moduleAssistants.inventory;
  }, []);

  const askAI = useCallback(async (query: string, context?: any): Promise<AIResponse> => {
    setIsProcessing(true);
    
    try {
      const assistant = activeAssistant || moduleAssistants.inventory;
      
      // Prepare the context for AI processing
      const aiContext = {
        module: assistant.module,
        assistant_personality: assistant.personality,
        capabilities: assistant.capabilities,
        user_query: query,
        page_context: context,
        timestamp: new Date().toISOString()
      };

      console.log('Sending AI request:', aiContext);

      // Call the multi-AI processor for consensus-based response
      const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          type: 'contextual_assistance',
          content: query,
          context: JSON.stringify(aiContext),
          module: assistant.module
        }
      });

      if (error) throw error;

      const response: AIResponse = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: data.consensus || 'I understand your question. Let me help you with that.',
        confidence: data.confidence || 0.8,
        suggestions: data.suggestions || [
          'Would you like me to analyze the current data?',
          'Should I provide recommendations?',
          'Do you need help with a specific task?'
        ],
        actions: data.actions || [],
        timestamp: new Date().toISOString()
      };

      setAIResponses(prev => [response, ...prev.slice(0, 19)]); // Keep last 20 responses
      
      return response;

    } catch (error) {
      console.error('AI processing error:', error);
      
      const fallbackResponse: AIResponse = {
        id: `ai-fallback-${Date.now()}`,
        content: 'I apologize, but I encountered an issue processing your request. However, I can still help you navigate and understand this module.',
        confidence: 0.6,
        suggestions: [
          'Try rephrasing your question',
          'Ask about specific features in this module',
          'Request help with common tasks'
        ],
        actions: [],
        timestamp: new Date().toISOString()
      };

      setAIResponses(prev => [fallbackResponse, ...prev.slice(0, 19)]);
      
      toast({
        title: "AI Assistant Notice",
        description: "Continuing with reduced functionality. Your question has been noted.",
        variant: "default",
      });

      return fallbackResponse;
    } finally {
      setIsProcessing(false);
    }
  }, [activeAssistant, toast]);

  const clearHistory = useCallback(() => {
    setAIResponses([]);
  }, []);

  return (
    <ContextualAIContext.Provider value={{
      activeAssistant,
      aiResponses,
      isProcessing,
      setActiveAssistant,
      askAI,
      getModuleAssistant,
      clearHistory
    }}>
      {children}
    </ContextualAIContext.Provider>
  );
};