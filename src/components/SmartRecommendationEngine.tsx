import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Lightbulb, 
  Brain, 
  Target, 
  TrendingUp,
  Star,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  Clock,
  Zap,
  Users,
  Wrench,
  Navigation,
  Shield,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';

interface SmartRecommendation {
  id: string;
  category: 'maintenance' | 'crew' | 'navigation' | 'safety' | 'cost' | 'efficiency';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  estimatedSavings?: string;
  timeToImplement: string;
  priority: number;
  aiReasoning: string;
  modelConsensus: string[];
  timestamp: Date;
  status: 'pending' | 'accepted' | 'implemented' | 'rejected';
  feedback?: 'helpful' | 'not-helpful';
  implementation?: {
    steps: string[];
    resources: string[];
    timeline: string;
  };
}

export const SmartRecommendationEngine: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sample recommendations
  useEffect(() => {
    const sampleRecommendations: SmartRecommendation[] = [
      {
        id: '1',
        category: 'maintenance',
        title: 'Optimize Engine Maintenance Schedule',
        description: 'AI analysis suggests adjusting engine maintenance intervals from 500 to 650 hours based on usage patterns and oil analysis data.',
        impact: 'high',
        confidence: 0.91,
        estimatedSavings: '$12,000 annually',
        timeToImplement: '2 weeks',
        priority: 9,
        aiReasoning: 'Historical data shows engines operate efficiently up to 650 hours with current oil grades and operating conditions.',
        modelConsensus: ['GPT-4.1', 'Grok', 'DeepSeek'],
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'pending',
        implementation: {
          steps: [
            'Review current oil analysis reports',
            'Update maintenance scheduling system',
            'Train crew on new intervals',
            'Monitor performance for first quarter'
          ],
          resources: ['Maintenance team', 'Oil analysis lab', 'Scheduling software'],
          timeline: '2 weeks planning + 1 month implementation'
        }
      },
      {
        id: '2',
        category: 'crew',
        title: 'Implement Dynamic Shift Rotations',
        description: 'Crew efficiency data indicates 23% productivity increase with flexible 6-hour rotations during peak operation periods.',
        impact: 'medium',
        confidence: 0.84,
        estimatedSavings: '23% efficiency gain',
        timeToImplement: '1 week',
        priority: 7,
        aiReasoning: 'Task completion rates and crew satisfaction scores peak with optimized rotation schedules.',
        modelConsensus: ['GPT-4.1', 'Grok'],
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: 'pending',
        implementation: {
          steps: [
            'Analyze current crew schedules',
            'Design flexible rotation system',
            'Test with pilot group',
            'Roll out gradually'
          ],
          resources: ['HR team', 'Crew scheduling software', 'Performance tracking tools'],
          timeline: '1 week design + 2 weeks testing'
        }
      },
      {
        id: '3',
        category: 'navigation',
        title: 'Weather-Optimized Route Planning',
        description: 'Implementing AI-powered weather routing could reduce fuel consumption by 15% and improve arrival time accuracy by 35%.',
        impact: 'high',
        confidence: 0.87,
        estimatedSavings: '15% fuel reduction',
        timeToImplement: '3 weeks',
        priority: 8,
        aiReasoning: 'Weather pattern analysis shows consistent optimization opportunities for current route profiles.',
        modelConsensus: ['GPT-4.1', 'Grok', 'DeepSeek'],
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        status: 'accepted',
        implementation: {
          steps: [
            'Integrate weather API',
            'Configure route optimization algorithms',
            'Train navigation team',
            'Monitor fuel consumption improvements'
          ],
          resources: ['Navigation software', 'Weather data subscription', 'Training materials'],
          timeline: '3 weeks development + 1 week training'
        }
      },
      {
        id: '4',
        category: 'safety',
        title: 'Predictive Safety Alert System',
        description: 'Install IoT sensors for predictive safety monitoring. AI models predict 89% accuracy in preventing safety incidents.',
        impact: 'critical',
        confidence: 0.89,
        estimatedSavings: 'Prevents 89% of incidents',
        timeToImplement: '4 weeks',
        priority: 10,
        aiReasoning: 'Safety incident patterns show clear predictive indicators that can be monitored with current technology.',
        modelConsensus: ['GPT-4.1', 'Grok', 'DeepSeek'],
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        status: 'pending'
      },
      {
        id: '5',
        category: 'cost',
        title: 'Smart Inventory Optimization',
        description: 'AI-driven inventory management could reduce spare parts costs by 28% while maintaining 99.5% availability.',
        impact: 'medium',
        confidence: 0.82,
        estimatedSavings: '$18,000 annually',
        timeToImplement: '2 weeks',
        priority: 6,
        aiReasoning: 'Inventory usage patterns show significant over-stocking in non-critical parts with predictable demand.',
        modelConsensus: ['GPT-4.1', 'Grok'],
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
        status: 'implemented'
      }
    ];

    setRecommendations(sampleRecommendations);
  }, []);

  const generateRecommendations = async () => {
    setIsGenerating(true);
    try {
      // Simulate getting current system data
      const systemData = {
        modules: ['maintenance', 'crew', 'navigation', 'safety', 'inventory'],
        performance: {
          efficiency: 87,
          costs: 'medium',
          incidents: 2,
          satisfaction: 91
        },
        lastMonth: {
          fuelUsage: '15% above optimal',
          maintenance: '3 scheduled, 1 emergency',
          crewRotations: '14 shifts completed'
        }
      };

      const response = await processWithAllLLMs({
        content: `Generate smart recommendations for yacht operations optimization: ${JSON.stringify(systemData)}`,
        context: 'Comprehensive operational improvement analysis',
        type: 'recommendation',
        module: 'smart-recommendations',
        priority: 'high'
      });

      if (response.recommendations && response.recommendations.length > 0) {
        const newRecommendations: SmartRecommendation[] = response.recommendations.slice(0, 3).map((rec: string, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          category: ['efficiency', 'cost', 'maintenance'][index] as any,
          title: `AI Recommendation #${index + 1}`,
          description: rec,
          impact: 'medium' as const,
          confidence: response.confidence,
          timeToImplement: '1-2 weeks',
          priority: 7 + index,
          aiReasoning: `Multi-AI analysis identified this optimization opportunity with ${Math.round(response.confidence * 100)}% confidence.`,
          modelConsensus: ['Multi-AI Consensus'],
          timestamp: new Date(),
          status: 'pending' as const
        }));

        setRecommendations(prev => [...newRecommendations, ...prev]);
        
        toast({
          title: "New Recommendations Generated",
          description: `${newRecommendations.length} AI-powered recommendations added`,
        });
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate new recommendations.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateRecommendationStatus = (id: string, status: SmartRecommendation['status']) => {
    setRecommendations(prev => 
      prev.map(rec => rec.id === id ? { ...rec, status } : rec)
    );
    
    const rec = recommendations.find(r => r.id === id);
    if (rec) {
      toast({
        title: `Recommendation ${status}`,
        description: rec.title,
      });
    }
  };

  const provideFeedback = (id: string, feedback: 'helpful' | 'not-helpful') => {
    setRecommendations(prev => 
      prev.map(rec => rec.id === id ? { ...rec, feedback } : rec)
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'crew': return <Users className="h-4 w-4" />;
      case 'navigation': return <Navigation className="h-4 w-4" />;
      case 'safety': return <Shield className="h-4 w-4" />;
      case 'cost': return <DollarSign className="h-4 w-4" />;
      case 'efficiency': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'text-green-500';
      case 'accepted': return 'text-blue-500';
      case 'rejected': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory);

  const sortedRecommendations = filteredRecommendations.sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            Smart Recommendation Engine
          </h2>
          <p className="text-muted-foreground">AI-powered insights and optimization suggestions</p>
        </div>
        <Button 
          onClick={generateRecommendations} 
          disabled={isGenerating}
        >
          <Brain className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
          Generate Recommendations
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: recommendations.length },
          { key: 'maintenance', label: 'Maintenance', count: recommendations.filter(r => r.category === 'maintenance').length },
          { key: 'crew', label: 'Crew', count: recommendations.filter(r => r.category === 'crew').length },
          { key: 'navigation', label: 'Navigation', count: recommendations.filter(r => r.category === 'navigation').length },
          { key: 'safety', label: 'Safety', count: recommendations.filter(r => r.category === 'safety').length },
          { key: 'cost', label: 'Cost', count: recommendations.filter(r => r.category === 'cost').length },
          { key: 'efficiency', label: 'Efficiency', count: recommendations.filter(r => r.category === 'efficiency').length }
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={selectedCategory === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(filter.key)}
            className="flex items-center gap-2"
          >
            {filter.key !== 'all' && getCategoryIcon(filter.key)}
            {filter.label}
            {filter.count > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {filter.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Recommendations List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {sortedRecommendations.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No recommendations available</p>
                <p className="text-sm text-muted-foreground">Generate new recommendations to get started</p>
              </CardContent>
            </Card>
          ) : (
            sortedRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className="shadow-neumorphic">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getCategoryIcon(recommendation.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{recommendation.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getImpactColor(recommendation.impact) as any}>
                            {recommendation.impact} impact
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {recommendation.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs">{recommendation.priority}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${getStatusColor(recommendation.status)}`}>
                        {recommendation.status.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(recommendation.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">{recommendation.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {recommendation.estimatedSavings && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Estimated Savings</p>
                          <p className="text-sm text-muted-foreground">{recommendation.estimatedSavings}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Time to Implement</p>
                        <p className="text-sm text-muted-foreground">{recommendation.timeToImplement}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">AI Models</p>
                        <p className="text-sm text-muted-foreground">
                          {recommendation.modelConsensus.length} models
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">AI Reasoning:</p>
                    <p className="text-sm text-muted-foreground">{recommendation.aiReasoning}</p>
                  </div>

                  {recommendation.implementation && (
                    <Tabs defaultValue="steps" className="mb-4">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="steps">Implementation Steps</TabsTrigger>
                        <TabsTrigger value="resources">Required Resources</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      </TabsList>
                      <TabsContent value="steps" className="mt-3">
                        <div className="space-y-2">
                          {recommendation.implementation.steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                                {index + 1}
                              </div>
                              <span className="text-sm">{step}</span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="resources" className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {recommendation.implementation.resources.map((resource, index) => (
                            <Badge key={index} variant="outline">{resource}</Badge>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="timeline" className="mt-3">
                        <p className="text-sm">{recommendation.implementation.timeline}</p>
                      </TabsContent>
                    </Tabs>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {recommendation.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {recommendation.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateRecommendationStatus(recommendation.id, 'accepted')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateRecommendationStatus(recommendation.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {recommendation.status === 'accepted' && (
                        <Button 
                          size="sm"
                          onClick={() => updateRecommendationStatus(recommendation.id, 'implemented')}
                        >
                          Mark Implemented
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => provideFeedback(recommendation.id, 'helpful')}
                        className={recommendation.feedback === 'helpful' ? 'text-green-500' : ''}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => provideFeedback(recommendation.id, 'not-helpful')}
                        className={recommendation.feedback === 'not-helpful' ? 'text-red-500' : ''}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};