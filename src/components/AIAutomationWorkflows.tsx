import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Workflow, 
  Play, 
  Pause, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Brain,
  Zap,
  Calendar,
  Shield,
  Wrench
} from 'lucide-react';
import { toast } from 'sonner';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: 'scheduled' | 'event' | 'manual' | 'condition';
  isActive: boolean;
  module: string;
  conditions: any[];
  actions: any[];
  lastRun?: string;
  nextRun?: string;
  successRate: number;
  totalRuns: number;
  aiEnabled: boolean;
}

const AIAutomationWorkflows = () => {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('active');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      // Load existing workflow configurations
      const { data, error } = await supabase
        .from('ai_agent_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
        throw error;
      }

      // If no workflows exist, create default ones
      if (!data || data.length === 0) {
        createDefaultWorkflows();
      } else {
        const transformedWorkflows: AutomationWorkflow[] = data.map(w => ({
          id: w.id,
          name: w.workflow_name,
          description: 'AI-powered automation workflow',
          trigger: w.trigger_type as 'scheduled' | 'event' | 'manual' | 'condition',
          isActive: w.is_active,
          module: w.module,
          conditions: Array.isArray(w.success_criteria) ? w.success_criteria : [w.success_criteria].filter(Boolean),
          actions: Array.isArray(w.workflow_steps) ? w.workflow_steps : [w.workflow_steps].filter(Boolean),
          successRate: 95,
          totalRuns: 0,
          aiEnabled: true
        }));
        setWorkflows(transformedWorkflows);
      }
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast.error('Failed to load automation workflows');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultWorkflows = () => {
    const defaultWorkflows: AutomationWorkflow[] = [
      {
        id: '1',
        name: 'Smart Maintenance Scheduling',
        description: 'Automatically schedule maintenance based on equipment health and usage patterns',
        trigger: 'condition',
        isActive: true,
        module: 'maintenance',
        conditions: ['equipment_health < 80', 'operating_hours > threshold'],
        actions: ['create_maintenance_task', 'notify_crew', 'order_parts'],
        successRate: 94,
        totalRuns: 47,
        aiEnabled: true,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        name: 'Crew Schedule Optimization',
        description: 'AI-powered crew scheduling based on skills, availability, and workload',
        trigger: 'scheduled',
        isActive: true,
        module: 'crew',
        conditions: ['daily_at_06:00'],
        actions: ['analyze_crew_performance', 'optimize_shifts', 'notify_changes'],
        successRate: 98,
        totalRuns: 156,
        aiEnabled: true,
        lastRun: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Safety Compliance Monitor',
        description: 'Continuous monitoring and compliance checking with automatic alerts',
        trigger: 'event',
        isActive: true,
        module: 'safety',
        conditions: ['safety_score_change', 'new_regulation', 'equipment_status_change'],
        actions: ['check_compliance', 'generate_report', 'send_alerts'],
        successRate: 100,
        totalRuns: 89,
        aiEnabled: true,
        lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        nextRun: 'Event-driven'
      },
      {
        id: '4',
        name: 'Predictive Weather Routing',
        description: 'AI-powered route optimization based on weather forecasts and preferences',
        trigger: 'condition',
        isActive: false,
        module: 'navigation',
        conditions: ['weather_change', 'route_active'],
        actions: ['analyze_weather', 'optimize_route', 'update_navigation'],
        successRate: 87,
        totalRuns: 23,
        aiEnabled: true,
        lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: 'Condition-based'
      },
      {
        id: '5',
        name: 'Smart Inventory Management',
        description: 'Automated inventory tracking and procurement with AI-powered optimization',
        trigger: 'condition',
        isActive: true,
        module: 'inventory',
        conditions: ['low_stock_threshold', 'usage_pattern_analysis'],
        actions: ['predict_demand', 'auto_order', 'optimize_storage'],
        successRate: 92,
        totalRuns: 34,
        aiEnabled: true,
        lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    setWorkflows(defaultWorkflows);
  };

  const toggleWorkflow = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      const newStatus = !workflow.isActive;
      
      setWorkflows(prev => 
        prev.map(w => w.id === workflowId ? { ...w, isActive: newStatus } : w)
      );

      toast.success(`Workflow ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast.error('Failed to update workflow');
    }
  };

  const runWorkflowNow = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      toast.success('Executing workflow...');

      // Call the appropriate AI processor based on workflow type
      const { data, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
        body: {
          type: 'automation',
          workflow_id: workflowId,
          workflow_name: workflow.name,
          module: workflow.module,
          actions: workflow.actions,
          context: {
            trigger: 'manual',
            user_initiated: true
          }
        }
      });

      if (error) throw error;

      // Update last run time
      setWorkflows(prev => 
        prev.map(w => w.id === workflowId ? { 
          ...w, 
          lastRun: new Date().toISOString(),
          totalRuns: w.totalRuns + 1 
        } : w)
      );

      toast.success('Workflow executed successfully');
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error('Failed to execute workflow');
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'crew': return <Calendar className="h-4 w-4" />;
      case 'safety': return <Shield className="h-4 w-4" />;
      case 'navigation': return <Settings className="h-4 w-4" />;
      case 'inventory': return <CheckCircle className="h-4 w-4" />;
      default: return <Workflow className="h-4 w-4" />;
    }
  };

  const getTriggerColor = (trigger: string) => {
    switch (trigger) {
      case 'scheduled': return 'default';
      case 'event': return 'secondary';
      case 'condition': return 'outline';
      case 'manual': return 'destructive';
      default: return 'outline';
    }
  };

  const activeWorkflows = workflows.filter(w => w.isActive);
  const inactiveWorkflows = workflows.filter(w => !w.isActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Automation Workflows</h1>
          <p className="text-muted-foreground">Smart workflows that automate yacht operations using AI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button>
            <Workflow className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkflows.length}</div>
            <p className="text-xs text-muted-foreground">Running automatically</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.totalRuns, 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Enhanced</CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.aiEnabled).length}
            </div>
            <p className="text-xs text-muted-foreground">AI-powered workflows</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          AI Automation Workflows use machine learning to optimize yacht operations, predict maintenance needs, 
          and automate routine tasks. All workflows can be customized and monitored in real-time.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {activeWorkflows.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Active Workflows</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeWorkflows.map((workflow) => (
                <Card key={workflow.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {getModuleIcon(workflow.module)}
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {workflow.name}
                            {workflow.aiEnabled && (
                              <Badge variant="default" className="text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{workflow.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={workflow.isActive}
                          onCheckedChange={() => toggleWorkflow(workflow.id)}
                        />
                        <Badge variant={getTriggerColor(workflow.trigger) as any}>
                          {workflow.trigger}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Success Rate</p>
                        <p className="text-lg font-bold text-green-600">{workflow.successRate}%</p>
                      </div>
                      <div>
                        <p className="font-medium">Total Runs</p>
                        <p className="text-lg font-bold">{workflow.totalRuns}</p>
                      </div>
                      <div>
                        <p className="font-medium">Module</p>
                        <p className="text-lg font-bold capitalize">{workflow.module}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Performance</span>
                        <span>{workflow.successRate}%</span>
                      </div>
                      <Progress value={workflow.successRate} className="h-2" />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {workflow.lastRun && (
                          <span>Last: {new Date(workflow.lastRun).toLocaleString()}</span>
                        )}
                        {workflow.nextRun && workflow.nextRun !== 'Event-driven' && workflow.nextRun !== 'Condition-based' && (
                          <span className="block">Next: {new Date(workflow.nextRun).toLocaleString()}</span>
                        )}
                        {(workflow.nextRun === 'Event-driven' || workflow.nextRun === 'Condition-based') && (
                          <span className="block">Next: {workflow.nextRun}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runWorkflowNow(workflow.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run Now
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {inactiveWorkflows.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Inactive Workflows</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {inactiveWorkflows.map((workflow) => (
                <Card key={workflow.id} className="border-gray-200 bg-muted/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        {getModuleIcon(workflow.module)}
                        <div>
                          <CardTitle className="flex items-center gap-2 text-muted-foreground">
                            {workflow.name}
                            {workflow.aiEnabled && (
                              <Badge variant="outline" className="text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{workflow.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={workflow.isActive}
                          onCheckedChange={() => toggleWorkflow(workflow.id)}
                        />
                        <Badge variant="outline">
                          {workflow.trigger}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Last successful run: {workflow.successRate}%
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runWorkflowNow(workflow.id)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Test Run
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {workflows.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No workflows configured</p>
            <p className="text-muted-foreground mb-4">
              Create your first AI automation workflow to start optimizing yacht operations
            </p>
            <Button onClick={createDefaultWorkflows}>
              <Brain className="h-4 w-4 mr-2" />
              Create Default Workflows
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAutomationWorkflows;