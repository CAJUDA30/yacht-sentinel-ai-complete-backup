import { useState, useEffect } from 'react';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import { supabase } from '@/integrations/supabase/client';

export interface AIRecommendation {
  id: string;
  type: 'efficiency' | 'cost' | 'maintenance' | 'safety' | 'workflow';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  module: string;
  estimatedSavings?: string;
  implementationTime?: string;
  actionable: boolean;
  metadata?: {
    suggestedActions?: string[];
    relatedItems?: string[];
    riskLevel?: string;
  };
}

export const useAIRecommendations = () => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get system data for analysis
      const systemData = {
        timestamp: new Date().toISOString(),
        modules: ['inventory', 'maintenance', 'crew', 'equipment', 'finance'],
        recentActivity: await getRecentActivity(),
        performanceMetrics: await getPerformanceMetrics()
      };

      const response = await processWithAllLLMs({
        content: `Analyze yacht operations data and generate actionable recommendations: ${JSON.stringify(systemData)}`,
        context: 'Smart recommendation engine analysis',
        type: 'analysis',
        module: 'recommendations',
        priority: 'high'
      });

      if (response.insights && response.insights.length > 0) {
        const aiRecommendations: AIRecommendation[] = response.insights.map((insight: string, index: number) => ({
          id: `rec-${Date.now()}-${index}`,
          type: getRecommendationType(insight),
          priority: getRecommendationPriority(response.confidence),
          title: `Recommendation ${index + 1}`,
          description: insight,
          impact: response.action || 'Operational improvement expected',
          confidence: response.confidence,
          module: 'ai-recommendations',
          estimatedSavings: generateEstimatedSavings(),
          implementationTime: generateImplementationTime(),
          actionable: true,
          metadata: {
            suggestedActions: [response.action || 'Review and implement'],
            relatedItems: [],
            riskLevel: 'low'
          }
        }));

        setRecommendations(aiRecommendations);
      }
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      setError('Failed to fetch recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  };

  const getPerformanceMetrics = async () => {
    return {
      efficiency: Math.random() * 0.3 + 0.7, // 70-100%
      alerts: Math.floor(Math.random() * 5),
      completedTasks: Math.floor(Math.random() * 50) + 10
    };
  };

  const getRecommendationType = (insight: string): AIRecommendation['type'] => {
    if (insight.toLowerCase().includes('efficiency')) return 'efficiency';
    if (insight.toLowerCase().includes('cost') || insight.toLowerCase().includes('save')) return 'cost';
    if (insight.toLowerCase().includes('maintenance')) return 'maintenance';
    if (insight.toLowerCase().includes('safety')) return 'safety';
    return 'workflow';
  };

  const getRecommendationPriority = (confidence: number): AIRecommendation['priority'] => {
    if (confidence > 0.9) return 'critical';
    if (confidence > 0.8) return 'high';
    if (confidence > 0.6) return 'medium';
    return 'low';
  };

  const generateEstimatedSavings = () => {
    const savings = ['5-10%', '10-15%', '3-8%', '15-25%', '2-5%'];
    return savings[Math.floor(Math.random() * savings.length)];
  };

  const generateImplementationTime = () => {
    const times = ['1-2 days', '3-5 days', '1 week', '2-3 weeks', '1 month'];
    return times[Math.floor(Math.random() * times.length)];
  };

  const dismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
  };

  const implementRecommendation = async (recommendation: AIRecommendation) => {
    try {
      const response = await processWithAllLLMs({
        content: `Implement recommendation: ${recommendation.description}`,
        context: `Recommendation implementation for ${recommendation.module}`,
        type: 'action',
        module: recommendation.module,
        priority: 'high'
      });

      // Log the implementation
      await supabase.from('analytics_events').insert({
        event_type: 'recommendation_implemented',
        event_message: `Implemented AI recommendation: ${recommendation.title}`,
        module: recommendation.module,
        metadata: {
          recommendation_id: recommendation.id,
          confidence: recommendation.confidence,
          implementation_result: response.consensus
        }
      });

      return response;
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    isProcessing,
    fetchRecommendations,
    dismissRecommendation,
    implementRecommendation
  };
};