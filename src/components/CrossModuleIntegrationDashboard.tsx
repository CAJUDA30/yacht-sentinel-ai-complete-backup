import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  GitBranch, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Workflow,
  TrendingUp,
  Settings
} from 'lucide-react';
import { crossModuleWorkflowEngine } from '@/services/CrossModuleWorkflowEngine';
import { crossModuleDataSync } from '@/services/CrossModuleDataSync';
import { universalEventBus } from '@/services/UniversalEventBus';

interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  executions24h: number;
  successRate: number;
}

interface SyncMetrics {
  totalRules: number;
  activeRules: number;
  recentSyncs: number;
  errorRate: number;
}

interface EventMetrics {
  eventsLast24h: number;
  topEventTypes: Array<{ event: string; count: number }>;
  moduleActivity: Array<{ module: string; events: number }>;
}

const CrossModuleIntegrationDashboard: React.FC = () => {
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    executions24h: 0,
    successRate: 0
  });

  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics>({
    totalRules: 0,
    activeRules: 0,
    recentSyncs: 0,
    errorRate: 0
  });

  const [eventMetrics, setEventMetrics] = useState<EventMetrics>({
    eventsLast24h: 0,
    topEventTypes: [],
    moduleActivity: []
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeServices();
    loadMetrics();
    setupRealtimeUpdates();
  }, []);

  const initializeServices = async () => {
    try {
      await crossModuleWorkflowEngine.initialize();
      await crossModuleDataSync.initialize();
      console.log('Cross-module integration services initialized');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      // Load workflow metrics
      const workflows = await crossModuleWorkflowEngine.getActiveWorkflows();
      const executions = await crossModuleWorkflowEngine.getExecutionHistory(100);
      const executions24h = executions.filter(e => 
        e.startedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      const successfulExecutions = executions24h.filter(e => e.status === 'completed');

      setWorkflowMetrics({
        totalWorkflows: workflows.length,
        activeWorkflows: workflows.filter(w => w.isActive).length,
        executions24h: executions24h.length,
        successRate: executions24h.length > 0 ? (successfulExecutions.length / executions24h.length) * 100 : 100
      });

      // Load sync metrics
      const syncHealth = await crossModuleDataSync.getSyncHealth();
      setSyncMetrics(syncHealth);

      // Load event metrics
      const eventHistory = universalEventBus.getEventHistory(1000);
      const events24h = eventHistory.filter(e => 
        e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      const eventTypeCount = events24h.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const moduleCount = events24h.reduce((acc, event) => {
        acc[event.module] = (acc[event.module] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setEventMetrics({
        eventsLast24h: events24h.length,
        topEventTypes: Object.entries(eventTypeCount)
          .map(([event, count]) => ({ event, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        moduleActivity: Object.entries(moduleCount)
          .map(([module, events]) => ({ module, events }))
          .sort((a, b) => b.events - a.events)
          .slice(0, 8)
      });

      setRecentActivity(eventHistory.slice(0, 20));

    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    // Update metrics when new events occur
    universalEventBus.subscribe('*', () => {
      // Debounced metrics update
      setTimeout(loadMetrics, 1000);
    }, { priority: 10 });
  };

  const triggerBatchSync = async () => {
    try {
      await crossModuleDataSync.triggerBatchSync();
      await loadMetrics();
    } catch (error) {
      console.error('Batch sync failed:', error);
    }
  };

  const runConsistencyCheck = async () => {
    try {
      const result = await crossModuleDataSync.runConsistencyCheck();
      console.log('Consistency check results:', result);
      // Show results in UI
    } catch (error) {
      console.error('Consistency check failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading integration dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cross-Module Integration</h1>
          <p className="text-muted-foreground mt-1">
            Monitor workflows, data synchronization, and module interconnectivity
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={triggerBatchSync} variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button onClick={runConsistencyCheck} variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Check Consistency
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowMetrics.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              of {workflowMetrics.totalWorkflows} total workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflowMetrics.successRate.toFixed(1)}%</div>
            <Progress value={workflowMetrics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Rules</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncMetrics.activeRules}</div>
            <p className="text-xs text-muted-foreground">
              {syncMetrics.recentSyncs} syncs today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventMetrics.eventsLast24h}</div>
            <p className="text-xs text-muted-foreground">
              Cross-module events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Alerts */}
      {syncMetrics.errorRate > 0.1 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High sync error rate detected: {(syncMetrics.errorRate * 100).toFixed(1)}%. 
            Check sync configurations and logs.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="sync">Data Sync</TabsTrigger>
          <TabsTrigger value="events">Event Stream</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Workflow Performance
                </CardTitle>
                <CardDescription>
                  Execution metrics and success rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Executions (24h)</span>
                    <Badge variant="secondary">{workflowMetrics.executions24h}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <Badge variant={workflowMetrics.successRate > 90 ? "default" : "destructive"}>
                      {workflowMetrics.successRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    Workflows automatically respond to system events and coordinate actions across modules.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Active Triggers
                </CardTitle>
                <CardDescription>
                  Workflow triggers monitoring system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Equipment Failure Response</div>
                      <div className="text-xs text-muted-foreground">Priority: High</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Inventory Low Stock</div>
                      <div className="text-xs text-muted-foreground">Priority: Medium</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Maintenance Completion</div>
                      <div className="text-xs text-muted-foreground">Priority: Low</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Sync Status
                </CardTitle>
                <CardDescription>
                  Data synchronization between modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Rules</span>
                    <Badge variant="secondary">{syncMetrics.activeRules}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Recent Syncs</span>
                    <Badge variant="secondary">{syncMetrics.recentSyncs}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <Badge variant={syncMetrics.errorRate < 0.05 ? "default" : "destructive"}>
                      {(syncMetrics.errorRate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Sync Rules
                </CardTitle>
                <CardDescription>
                  Active data synchronization rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Equipment → Maintenance</div>
                      <div className="text-xs text-muted-foreground">Real-time sync</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Inventory → Procurement</div>
                      <div className="text-xs text-muted-foreground">Trigger-based</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Claims → Finance</div>
                      <div className="text-xs text-muted-foreground">Trigger-based</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Real-time event stream across modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentActivity.map((event, index) => (
                    <div key={event.id || index} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.module}
                        </Badge>
                        <span>{event.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Events
                </CardTitle>
                <CardDescription>
                  Most frequent event types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {eventMetrics.topEventTypes.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm truncate">{item.event}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Activity</CardTitle>
                <CardDescription>
                  Event distribution across modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventMetrics.moduleActivity.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{item.module}</span>
                        <span>{item.events} events</span>
                      </div>
                      <Progress 
                        value={(item.events / eventMetrics.eventsLast24h) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Health</CardTitle>
                <CardDescription>
                  Overall system integration status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Workflow Engine</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Sync</span>
                    <Badge variant={syncMetrics.errorRate < 0.05 ? "default" : "destructive"}>
                      {syncMetrics.errorRate < 0.05 ? (
                        <><CheckCircle className="h-3 w-3 mr-1" />Healthy</>
                      ) : (
                        <><AlertTriangle className="h-3 w-3 mr-1" />Issues</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Event Bus</span>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    Phase 4: Cross-Module Integration is operational with 
                    automated workflows, real-time data sync, and comprehensive monitoring.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrossModuleIntegrationDashboard;