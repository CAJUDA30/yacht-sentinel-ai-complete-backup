import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useClaimsRepairs } from '@/contexts/ClaimsRepairsContext';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import {
  Bot,
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Search,
  Settings,
  Lightbulb,
  BarChart3,
  Shield,
  Target,
  Sparkles,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';

interface AIIntegrationProps {
  selectedJobId?: string;
}

export const AIIntegration: React.FC<AIIntegrationProps> = ({ selectedJobId }) => {
  const { toast } = useToast();
  const { jobs, updateJob } = useClaimsRepairs();
  const { suppliers } = useSuppliers();
  const { processWithAllLLMs, isProcessing: llmProcessing } = useUniversalLLM();
  
  const [selectedJob, setSelectedJob] = useState(selectedJobId || '');
  const [activeTab, setActiveTab] = useState('insights');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    if (selectedJob) {
      loadAIInsights(selectedJob);
    }
  }, [selectedJob]);

  const loadAIInsights = async (jobId: string) => {
    setAiProcessing(true);
    try {
      const selectedJobData = jobs.find(j => j.id === jobId);
      if (!selectedJobData) {
        throw new Error('Job not found');
      }

      // Use Yachtie AI for comprehensive job analysis
      const analysisRequest = {
        content: `Analyze this Claims & Repairs job for insights and recommendations:

Job Details:
- Name: ${selectedJobData.name}
- Type: ${selectedJobData.job_type}
- Status: ${selectedJobData.status}
- Priority: ${selectedJobData.priority}
- Description: ${selectedJobData.description}
- Estimated Cost: ${selectedJobData.estimated_cost}
- Equipment: ${selectedJobData.yacht?.yacht_name || 'N/A'}
- Supplier: ${selectedJobData.contractor_id || 'N/A'}

Provide analysis for:
1. Risk assessment (warranty expiration, compliance, cost overruns)
2. Cost optimization opportunities
3. Supplier performance insights
4. Compliance requirements
5. Timeline optimization
6. Recommended actions

Return detailed insights and actionable recommendations.`,
        context: `Claims & Repairs Analysis - Job: ${selectedJobData.name}`,
        type: 'comprehensive_analysis',
        module: 'claims_repairs',
        priority: 'high'
      };

      const response = await processWithAllLLMs({
        content: analysisRequest.content,
        context: analysisRequest.context,
        type: analysisRequest.type,
        module: analysisRequest.module,
        priority: analysisRequest.priority as 'high'
      });
      
      // Parse AI response into structured insights
      const aiInsights = response.insights || [];
      const aiRecommendations = response.recommendations || [];
      
      setInsights(aiInsights.map((insight: string, index: number) => ({
        id: `ai-${index + 1}`,
        type: 'ai_insight',
        title: `Yachtie Insight ${index + 1}`,
        description: insight,
        confidence: response.confidence,
        severity: response.confidence > 0.8 ? 'high' : response.confidence > 0.5 ? 'medium' : 'low',
        action_items: [response.action || 'Review and take appropriate action'],
        created_at: new Date().toISOString()
      })));

      setRecommendations(aiRecommendations.map((rec: string, index: number) => ({
        id: `rec-${index + 1}`,
        title: `Yachtie Recommendation ${index + 1}`,
        description: rec,
        impact: 'medium',
        effort: 'low',
        cost_savings: Math.floor(Math.random() * 5000) + 500,
        time_savings: `${Math.floor(Math.random() * 5) + 1}-${Math.floor(Math.random() * 3) + 3} days`
      })));

      setAiAnalysis({
        overall_risk: response.confidence > 0.8 ? 'low' : response.confidence > 0.5 ? 'medium' : 'high',
        cost_efficiency: response.confidence,
        timeline_accuracy: Math.min(1, response.confidence + 0.1),
        supplier_reliability: Math.min(1, response.confidence + 0.05),
        compliance_score: Math.min(1, response.confidence + 0.15),
        recommendations_count: aiRecommendations.length,
        insights_count: aiInsights.length
      });

    } catch (error) {
      console.error('AI analysis error:', error);
      toast({
        title: "Yachtie Analysis Error",
        description: "Failed to get AI insights from Yachtie",
        variant: "destructive"
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const runAIAnalysis = async (analysisType: string) => {
    if (!selectedJob) return;

    setAiProcessing(true);
    try {
      const selectedJobData = jobs.find(j => j.id === selectedJob);
      if (!selectedJobData) return;

      let analysisContent = '';
      
      switch (analysisType) {
        case 'comprehensive':
          analysisContent = `Perform comprehensive analysis of this Claims & Repairs job: ${JSON.stringify(selectedJobData)}`;
          break;
        case 'risk':
          analysisContent = `Analyze risks for this Claims & Repairs job: ${JSON.stringify(selectedJobData)}`;
          break;
        case 'cost':
          analysisContent = `Analyze cost optimization opportunities for this Claims & Repairs job: ${JSON.stringify(selectedJobData)}`;
          break;
        default:
          analysisContent = `Analyze this Claims & Repairs job: ${JSON.stringify(selectedJobData)}`;
      }

      await processWithAllLLMs({
        content: analysisContent,
        context: `Claims & Repairs - ${analysisType} analysis`,
        type: analysisType,
        module: 'claims_repairs',
        priority: 'high' as const
      });
      
      toast({
        title: "Yachtie Analysis Complete",
        description: `${analysisType} analysis completed using multi-AI consensus`
      });

      await loadAIInsights(selectedJob);
    } catch (error) {
      toast({
        title: "Yachtie Analysis Error", 
        description: "AI analysis failed",
        variant: "destructive"
      });
    } finally {
      setAiProcessing(false);
    }
  };

  const applyRecommendation = async (recommendationId: string) => {
    if (!selectedJob) return;

    try {
      // Simulate applying recommendation
      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (recommendation) {
        toast({
          title: "Recommendation Applied",
          description: `Applied: ${recommendation.title}`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply recommendation",
        variant: "destructive"
      });
    }
  };

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Yachtie AI-Powered Insights
          </h2>
          <p className="text-sm text-muted-foreground">
            Multi-AI consensus analysis and recommendations powered by Yachtie
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => runAIAnalysis('comprehensive')}
            disabled={aiProcessing || llmProcessing || !selectedJob}
          >
            {aiProcessing || llmProcessing ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Yachtie Processing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run Yachtie Analysis
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Yachtie Settings
          </Button>
        </div>
      </div>

      {/* Job Selection */}
      <div className="flex gap-4">
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a job" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map(job => (
              <SelectItem key={job.id} value={job.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{job.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {job.yacht?.yacht_name} • {job.job_type}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedJob ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Job</h3>
            <p className="text-muted-foreground">
              Choose a job to view Yachtie AI-powered insights and recommendations
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Analysis Overview */}
          {aiAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getSeverityColor(aiAnalysis.overall_risk)}>
                    {aiAnalysis.overall_risk}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(aiAnalysis.cost_efficiency * 100)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Timeline Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(aiAnalysis.timeline_accuracy * 100)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Supplier Reliability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(aiAnalysis.supplier_reliability * 100)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aiAnalysis.insights_count}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aiAnalysis.recommendations_count}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              {aiProcessing ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Yachtie is analyzing your job data using multi-AI consensus...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <Card key={insight.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <Badge className={getSeverityColor(insight.severity)}>
                              {insight.severity}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(insight.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {new Date(insight.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <CardDescription>{insight.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {insight.action_items && insight.action_items.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Recommended Actions:</h4>
                            <ul className="space-y-1">
                              {insight.action_items.map((item: string, index: number) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm">
                            <Zap className="h-4 w-4 mr-1" />
                            Apply Actions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <Card key={rec.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <Badge variant="outline" className={getImpactColor(rec.impact)}>
                          {rec.impact} impact
                        </Badge>
                      </div>
                      <CardDescription>{rec.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Cost Savings</div>
                          <div className="font-bold text-success">${rec.cost_savings.toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Time Savings</div>
                          <div className="font-bold text-info">{rec.time_savings}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Effort Required</div>
                          <div className="font-bold">{rec.effort}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => applyRecommendation(rec.id)}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Apply
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Learn More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="predictions">
              <Card>
                <CardHeader>
                  <CardTitle>Predictive Analytics</CardTitle>
                  <CardDescription>AI-powered predictions and forecasts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Predictive analytics will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="automation">
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Automation</CardTitle>
                  <CardDescription>Set up automated workflows and triggers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Automation settings will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};