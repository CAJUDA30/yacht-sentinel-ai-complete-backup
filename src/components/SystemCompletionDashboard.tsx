import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Rocket,
  Trophy,
  Star,
  Target,
  Zap
} from 'lucide-react';
import { systemCompletionService } from '@/services/SystemCompletionService';

interface CompletionData {
  overallStatus: 'complete' | 'incomplete';
  completionPercentage: number;
  phases: any[];
  modules: any[];
  recommendations: string[];
}

const SystemCompletionDashboard = () => {
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<string>('');

  useEffect(() => {
    loadCompletionData();
  }, []);

  const loadCompletionData = async () => {
    try {
      const data = await systemCompletionService.runSystemCompletionCheck();
      setCompletionData(data);
    } catch (error) {
      console.error('Failed to load completion data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const reportContent = await systemCompletionService.generateCompletionReport();
      setReport(reportContent);
      
      // Download the report
      const blob = new Blob([reportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yachtexcel-completion-report-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getModuleStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!completionData) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load completion data.</p>
        <Button onClick={loadCompletionData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const isSystemComplete = completionData.overallStatus === 'complete';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {isSystemComplete ? <Trophy className="h-8 w-8 text-yellow-500" /> : <Target className="h-8 w-8" />}
            System Completion Status
          </h1>
          <p className="text-muted-foreground">
            {isSystemComplete 
              ? 'Congratulations! Your yacht management system is complete and ready for production.'
              : 'Track the completion status of all system modules and phases.'
            }
          </p>
        </div>
        <Button onClick={generateReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overall Completion Status */}
      <Card className={isSystemComplete ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSystemComplete ? (
              <>
                <Rocket className="h-5 w-5 text-green-500" />
                System Complete! 🎉
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Development Progress
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isSystemComplete 
              ? 'All system modules are operational and ready for production deployment'
              : 'Overall system completion status across all modules and phases'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
              completionData.completionPercentage === 100 ? 'bg-green-500' :
              completionData.completionPercentage >= 80 ? 'bg-blue-500' :
              completionData.completionPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {completionData.completionPercentage}%
            </div>
            <div className="flex-1">
              <Progress value={completionData.completionPercentage} className="h-3 mb-2" />
              <p className="text-sm font-medium">
                {completionData.modules.filter(m => m.status === 'complete').length} of {completionData.modules.length} modules complete
              </p>
              <Badge variant={isSystemComplete ? 'default' : 'secondary'} className="mt-2">
                {completionData.overallStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Alert */}
      {isSystemComplete && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <Star className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            <strong>System Development Complete!</strong> All phases have been successfully implemented. 
            Your yacht management system is now fully operational with AI-powered features, cross-module integration, 
            and production-ready monitoring capabilities.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="phases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="phases">Development Phases</TabsTrigger>
          <TabsTrigger value="modules">System Modules</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-4">
          <div className="grid gap-4">
            {completionData.phases.map((phase, index) => (
              <Card key={index} className={phase.status === 'completed' ? 'border-green-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getPhaseIcon(phase.status)}
                      <div>
                        <h3 className="font-medium">Phase {phase.phase}: {phase.name}</h3>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                        {phase.completedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Completed: {new Date(phase.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                      {phase.status}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Included Modules:</p>
                    <div className="flex flex-wrap gap-1">
                      {phase.modules.map((module: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {module}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {completionData.modules.map((module, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      {getModuleStatusIcon(module.status)}
                      {module.name}
                    </span>
                    <Badge variant={module.status === 'complete' ? 'default' : 'destructive'} className="text-xs">
                      v{module.version}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.tests.map((test: any, testIndex: number) => (
                      <div key={testIndex} className="flex items-center gap-2 text-sm">
                        {test.status === 'passed' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : test.status === 'failed' ? (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-yellow-500" />
                        )}
                        <span className="flex-1">{test.name}</span>
                      </div>
                    ))}
                  </div>
                  {module.dependencies.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Dependencies:</p>
                      <div className="flex flex-wrap gap-1">
                        {module.dependencies.map((dep: string, depIndex: number) => (
                          <Badge key={depIndex} variant="outline" className="text-xs">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Recommendations</CardTitle>
              <CardDescription>
                Based on the current system status and completion analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completionData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
              
              {isSystemComplete && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    🚀 Ready for Production!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your YachtExcel system is now complete with all advanced features:
                  </p>
                  <ul className="text-sm text-green-700 dark:text-green-300 mt-2 ml-4 space-y-1">
                    <li>• AI-powered yacht management with multi-provider consensus</li>
                    <li>• Comprehensive inventory and equipment tracking</li>
                    <li>• Advanced claims, repairs, and audit systems</li>
                    <li>• Real-time cross-module integration and workflows</li>
                    <li>• Production-ready monitoring and health checks</li>
                    <li>• Multilingual support and conversational AI</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemCompletionDashboard;