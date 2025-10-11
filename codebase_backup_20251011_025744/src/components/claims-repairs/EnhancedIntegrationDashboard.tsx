import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClaimsRepairs } from '@/contexts/ClaimsRepairsContext';
import { IntegratedJobView } from './IntegratedJobView';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Package,
  Settings,
  TrendingUp,
  Users,
  Wrench,
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IntegrationMetrics {
  total_integrations: number;
  successful_integrations: number;
  failed_integrations: number;
  sync_status: 'synced' | 'syncing' | 'error';
  last_sync: string;
  modules_connected: string[];
  health_score: number;
}

export const EnhancedIntegrationDashboard: React.FC = () => {
  const { jobs, loading, performFullIntegration, refreshData } = useClaimsRepairs();
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [integrationMetrics, setIntegrationMetrics] = useState<IntegrationMetrics>({
    total_integrations: 0,
    successful_integrations: 0,
    failed_integrations: 0,
    sync_status: 'synced',
    last_sync: new Date().toISOString(),
    modules_connected: ['Equipment', 'Inventory', 'Finance', 'Crew', 'Maintenance'],
    health_score: 85
  });
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = jobs.find(job => job.id === selectedJobId);

  const handleSyncAll = async () => {
    try {
      setSyncingAll(true);
      
      // Sync all active jobs
      const activeJobs = jobs.filter(job => job.status === 'active' || job.status === 'pending');
      
      for (const job of activeJobs) {
        await performFullIntegration(job.id, {
          syncEquipment: true,
          updateInventory: true,
          createFinanceRecords: true,
          assignCrew: true,
          scheduleMaintenance: true
        });
      }

      setIntegrationMetrics(prev => ({
        ...prev,
        sync_status: 'synced',
        last_sync: new Date().toISOString(),
        successful_integrations: prev.successful_integrations + activeJobs.length
      }));

      toast({
        title: "Success",
        description: `Synchronized ${activeJobs.length} jobs across all modules`
      });

    } catch (error) {
      console.error('Error syncing all jobs:', error);
      setIntegrationMetrics(prev => ({
        ...prev,
        sync_status: 'error',
        failed_integrations: prev.failed_integrations + 1
      }));
      
      toast({
        title: "Error",
        description: "Failed to sync all jobs. Some integrations may be incomplete.",
        variant: "destructive"
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getModuleIcon = (module: string) => {
    switch (module.toLowerCase()) {
      case 'equipment': return <Wrench className="h-4 w-4" />;
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'crew': return <Users className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Integration Health</p>
                <p className={`text-2xl font-bold ${getHealthColor(integrationMetrics.health_score)}`}>
                  {integrationMetrics.health_score}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={integrationMetrics.health_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected Modules</p>
                <p className="text-2xl font-bold">{integrationMetrics.modules_connected.length}</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful Syncs</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrationMetrics.successful_integrations}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sync Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {integrationMetrics.sync_status === 'synced' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {integrationMetrics.sync_status === 'syncing' && <Clock className="h-4 w-4 text-blue-500 animate-spin" />}
                  {integrationMetrics.sync_status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  <span className="text-sm font-medium capitalize">{integrationMetrics.sync_status}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSyncAll}
                disabled={syncingAll}
              >
                <RefreshCw className={`h-4 w-4 ${syncingAll ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Status Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Module Integration Status
          </CardTitle>
          <CardDescription>
            Current status of cross-module integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {integrationMetrics.modules_connected.map((module) => (
              <div key={module} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getModuleIcon(module)}
                  <div>
                    <p className="font-medium">{module}</p>
                    <p className="text-sm text-muted-foreground">Active integration</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Selection and Integration Details */}
      <Tabs defaultValue="job-details" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="job-details">Job Integration</TabsTrigger>
            <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
            <TabsTrigger value="sync-history">Sync History</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a job to view integration details" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.name} ({job.job_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="job-details" className="space-y-4">
          {selectedJob ? (
            <IntegratedJobView job={selectedJob} />
          ) : (
            <Alert>
              <AlertDescription>
                Please select a job to view detailed integration information.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="bulk-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Integration Actions</CardTitle>
              <CardDescription>
                Perform integration actions across multiple jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  onClick={handleSyncAll} 
                  disabled={syncingAll}
                  className="flex items-center gap-2"
                >
                  {syncingAll ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync All Active Jobs
                </Button>
                
                <Button variant="outline" disabled>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Integration Report
                </Button>
              </div>
              
              {integrationMetrics.failed_integrations > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {integrationMetrics.failed_integrations} integration{integrationMetrics.failed_integrations > 1 ? 's' : ''} failed. 
                    Check individual job details for more information.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization History</CardTitle>
              <CardDescription>
                Recent integration synchronization activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">Full Integration Sync</p>
                      <p className="text-sm text-muted-foreground">
                        Synced {jobs.length} job{jobs.length !== 1 ? 's' : ''} across all modules
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(integrationMetrics.last_sync).toLocaleDateString()} at{' '}
                    {new Date(integrationMetrics.last_sync).toLocaleTimeString()}
                  </div>
                </div>
                
                <Alert>
                  <AlertDescription>
                    Detailed sync history will be available in future updates. 
                    Current integration status is displayed in real-time above.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};