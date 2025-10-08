import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { workflowAutomationService, WorkflowExecution } from '@/services/workflowAutomationService';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight,
  Zap,
  Activity,
  TrendingUp,
  Settings
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkflowStats {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  active_workflows: number;
  success_rate: number;
}

export const WorkflowAutomationDashboard: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
    active_workflows: 0,
    success_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      const executionData = await workflowAutomationService.getWorkflowExecutions();
      setExecutions(executionData);

      // Calculate stats
      const successful = executionData.filter(e => e.status === 'completed').length;
      const failed = executionData.filter(e => e.status === 'failed').length;
      const total = executionData.length;
      
      setStats({
        total_executions: total,
        successful_executions: successful,
        failed_executions: failed,
        active_workflows: executionData.filter(e => e.status === 'running').length,
        success_rate: total > 0 ? (successful / total) * 100 : 0
      });
    } catch (error) {
      console.error('Error loading workflow data:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkflowTemplates = async () => {
    try {
      await Promise.all([
        workflowAutomationService.createEquipmentFailureWorkflow(),
        workflowAutomationService.createLowInventoryWorkflow(),
        workflowAutomationService.createRepairCompletionWorkflow()
      ]);

      toast({
        title: "Success",
        description: "Workflow templates created successfully"
      });

      loadWorkflowData();
    } catch (error) {
      console.error('Error creating workflow templates:', error);
      toast({
        title: "Error",
        description: "Failed to create workflow templates",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'running':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{stats.total_executions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={stats.success_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold">{stats.active_workflows}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Executions</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed_executions}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="templates">Workflow Templates</TabsTrigger>
          <TabsTrigger value="settings">Automation Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Workflow Executions
              </CardTitle>
              <CardDescription>
                Latest automated workflow executions across all modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No workflow executions found. Create some workflow templates to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(execution.status)}
                        <div>
                          <p className="font-medium">
                            {execution.metadata?.workflow_name || 'Automated Workflow'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Workflow Automation • System Generated
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(execution.started_at).toLocaleDateString()} at {new Date(execution.started_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                        {execution.error_message && (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Workflow Templates
              </CardTitle>
              <CardDescription>
                Pre-configured automation workflows for common scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-2 border-dashed">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Zap className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                      <h3 className="font-semibold mb-2">Equipment Failure Response</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Automatically create repair jobs, assign crew, and send notifications when equipment fails
                      </p>
                      <div className="space-y-2">
                        <Badge variant="outline">Equipment → Claims</Badge>
                        <Badge variant="outline">Auto-assign crew</Badge>
                        <Badge variant="outline">Critical notifications</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="font-semibold mb-2">Low Inventory Auto-Procurement</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Trigger procurement requests and financial transactions for critical stock levels
                      </p>
                      <div className="space-y-2">
                        <Badge variant="outline">Inventory → Finance</Badge>
                        <Badge variant="outline">Auto-procurement</Badge>
                        <Badge variant="outline">Stock alerts</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-dashed">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                      <h3 className="font-semibold mb-2">Repair Completion Follow-up</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Update inventory, create financial records, and schedule follow-up maintenance
                      </p>
                      <div className="space-y-2">
                        <Badge variant="outline">Multi-module sync</Badge>
                        <Badge variant="outline">Inventory updates</Badge>
                        <Badge variant="outline">Auto-scheduling</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={createWorkflowTemplates}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Initialize Workflow Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure workflow automation behavior and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Workflow automation settings will be available in the next release. 
                  Current templates are active and processing events automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};