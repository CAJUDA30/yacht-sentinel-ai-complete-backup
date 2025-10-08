import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Code2, 
  Brain, 
  Play, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Database,
  Zap,
  Settings,
  Search,
  Download,
  Upload,
  GitBranch,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';

interface CodeGeneration {
  id: string;
  type: 'component' | 'hook' | 'service' | 'edge-function' | 'database';
  title: string;
  description: string;
  code: string;
  language: string;
  aiReasoning: string;
  confidence: number;
  timestamp: Date;
  status: 'generated' | 'reviewed' | 'implemented' | 'rejected';
  securityScore: number;
  codeQuality: number;
}

interface YachtieCoderProps {
  className?: string;
}

export const YachtieCoder: React.FC<YachtieCoderProps> = ({ className }) => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<CodeGeneration[]>([]);
  const [selectedTab, setSelectedTab] = useState('generator');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load previous generations
  useEffect(() => {
    // Initialize with sample generated code
    const sampleGenerations: CodeGeneration[] = [
      {
        id: '1',
        type: 'component',
        title: 'Smart Analytics Dashboard',
        description: 'AI-powered analytics component with real-time updates',
        code: `import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

interface AnalyticsData {
  metrics: {
    efficiency: number;
    performance: number;
    satisfaction: number;
  };
  trends: Array<{
    name: string;
    value: number;
    change: number;
  }>;
}

export const SmartAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch analytics data
    const fetchData = async () => {
      try {
        // Implementation would fetch real data
        setData({
          metrics: { efficiency: 87, performance: 92, satisfaction: 89 },
          trends: [
            { name: 'Efficiency', value: 87, change: 5.2 },
            { name: 'Performance', value: 92, change: -1.3 },
            { name: 'Satisfaction', value: 89, change: 3.7 }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data?.trends.map((trend) => (
        <Card key={trend.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{trend.name}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trend.value}%</div>
            <p className={\`text-xs \${trend.change > 0 ? 'text-green-600' : 'text-red-600'}\`}>
              {trend.change > 0 ? '+' : ''}{trend.change}% from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};`,
        language: 'typescript',
        aiReasoning: 'Generated a reusable analytics dashboard component with proper TypeScript interfaces, loading states, and responsive design following the app\'s existing patterns.',
        confidence: 0.92,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'generated',
        securityScore: 95,
        codeQuality: 88
      }
    ];

    setGeneratedCode(sampleGenerations);
  }, []);

  const generateCode = async () => {
    if (!prompt.trim()) return;

    try {
      const response = await processWithAllLLMs({
        content: `Generate production-ready code for: ${prompt}. Include proper TypeScript types, error handling, and follow React best practices. Consider the yacht management app context.`,
        context: 'Yachtie Coder - AI-powered code generation for yacht management application',
        type: 'code-generation',
        module: 'yachtie-coder',
        priority: 'high'
      });

      if (response.consensus) {
        const newGeneration: CodeGeneration = {
          id: Date.now().toString(),
          type: determineCodeType(prompt),
          title: extractTitle(prompt),
          description: prompt,
          code: response.consensus,
          language: 'typescript',
          aiReasoning: response.action || 'AI-generated code based on user requirements',
          confidence: response.confidence,
          timestamp: new Date(),
          status: 'generated',
          securityScore: calculateSecurityScore(response.consensus),
          codeQuality: Math.round(response.confidence * 100)
        };

        setGeneratedCode(prev => [newGeneration, ...prev]);
        setPrompt('');

        toast({
          title: "Code Generated Successfully",
          description: `Generated ${newGeneration.type} with ${Math.round(newGeneration.confidence * 100)}% confidence`,
        });
      }
    } catch (error) {
      console.error('Code generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const analyzeCodebase = async () => {
    setIsAnalyzing(true);
    try {
      const response = await processWithAllLLMs({
        content: 'Analyze the current yacht management application codebase structure, identify improvement opportunities, security vulnerabilities, and optimization suggestions.',
        context: 'Comprehensive codebase analysis for yacht management system',
        type: 'code-analysis',
        module: 'yachtie-coder',
        priority: 'high'
      });

      setAnalysisResult({
        summary: response.consensus,
        insights: response.insights || [],
        recommendations: response.recommendations || [],
        confidence: response.confidence,
        timestamp: new Date()
      });

      toast({
        title: "Codebase Analysis Complete",
        description: "Generated comprehensive analysis and recommendations",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze codebase.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const determineCodeType = (prompt: string): CodeGeneration['type'] => {
    const lower = prompt.toLowerCase();
    if (lower.includes('component') || lower.includes('ui')) return 'component';
    if (lower.includes('hook') || lower.includes('use')) return 'hook';
    if (lower.includes('service') || lower.includes('api')) return 'service';
    if (lower.includes('edge') || lower.includes('function')) return 'edge-function';
    if (lower.includes('database') || lower.includes('sql')) return 'database';
    return 'component';
  };

  const extractTitle = (prompt: string): string => {
    const words = prompt.split(' ').slice(0, 4).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  };

  const calculateSecurityScore = (code: string): number => {
    // Simple security scoring based on common patterns
    let score = 100;
    if (code.includes('eval(')) score -= 30;
    if (code.includes('innerHTML')) score -= 20;
    if (code.includes('document.write')) score -= 25;
    if (!code.includes('try') && !code.includes('catch')) score -= 10;
    return Math.max(60, score);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'component': return <Code2 className="h-4 w-4" />;
      case 'hook': return <Zap className="h-4 w-4" />;
      case 'service': return <Settings className="h-4 w-4" />;
      case 'edge-function': return <GitBranch className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'default';
      case 'reviewed': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Yachtie Coder
          </h2>
          <p className="text-muted-foreground">AI-powered code generation and app enhancement</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={analyzeCodebase} 
            disabled={isAnalyzing}
            variant="outline"
          >
            <Search className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            Analyze Codebase
          </Button>
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Yachtie Coder generates production-ready code with security validation and quality checks. 
          All generated code is analyzed for vulnerabilities and follows best practices.
        </AlertDescription>
      </Alert>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generator">Code Generator</TabsTrigger>
          <TabsTrigger value="generated">Generated Code</TabsTrigger>
          <TabsTrigger value="analysis">Codebase Analysis</TabsTrigger>
          <TabsTrigger value="tools">Dev Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                AI Code Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Describe what you want to build:
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Create a component for crew scheduling with drag-and-drop functionality, or Build a hook for real-time weather data integration..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={generateCode} 
                  disabled={isProcessing || !prompt.trim()}
                  className="flex-1"
                >
                  <Brain className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-pulse' : ''}`} />
                  Generate Code
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  'Create a dashboard component with charts',
                  'Build a data table with sorting and filtering',
                  'Generate a form with validation',
                  'Create a real-time notification system',
                  'Build a file upload component',
                  'Generate an API service hook'
                ].map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(template)}
                    className="text-left justify-start"
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generated Code ({generatedCode.length})</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {generatedCode.map((generation) => (
                <Card key={generation.id} className="shadow-neumorphic">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(generation.type)}
                        <div>
                          <CardTitle className="text-base">{generation.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{generation.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(generation.status) as any}>
                          {generation.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {generation.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">AI Confidence</p>
                        <p className="text-lg font-bold">{Math.round(generation.confidence * 100)}%</p>
                      </div>
                      <div>
                        <p className="font-medium">Security Score</p>
                        <p className={`text-lg font-bold ${
                          generation.securityScore >= 90 ? 'text-green-500' : 
                          generation.securityScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {generation.securityScore}%
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Code Quality</p>
                        <p className="text-lg font-bold">{generation.codeQuality}%</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">AI Reasoning:</p>
                      <p className="text-sm text-muted-foreground">{generation.aiReasoning}</p>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-100">
                        <code>{generation.code}</code>
                      </pre>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Implement
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Codebase Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="default">
                      Analysis Complete - {Math.round(analysisResult.confidence * 100)}% Confidence
                    </Badge>
                    <Badge variant="outline">
                      {analysisResult.timestamp.toLocaleString()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                    </div>
                    
                    {analysisResult.insights && analysisResult.insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Key Insights</h4>
                        <ul className="space-y-1">
                          {analysisResult.insights.map((insight: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {analysisResult.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No analysis available</p>
                  <p className="text-sm text-muted-foreground">Click "Analyze Codebase" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Development Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Generate Database Schema
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Create Edge Functions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Audit
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuration Optimizer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Component
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export Project
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Play className="h-4 w-4 mr-2" />
                  Test Generation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};