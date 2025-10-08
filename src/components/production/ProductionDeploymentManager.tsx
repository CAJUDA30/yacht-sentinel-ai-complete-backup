import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  Settings, 
  GitBranch, 
  Clock, 
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Pause,
  RotateCcw,
  Monitor,
  Shield,
  Database
} from 'lucide-react';
import { useProductionReadiness } from '@/hooks/useProductionReadiness';

interface DeploymentStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

export const ProductionDeploymentManager: React.FC = () => {
  const { deploymentConfigs, updateDeploymentConfig, isUpdatingConfig } = useProductionReadiness();
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  
  const [deploymentSteps] = useState<DeploymentStep[]>([
    { id: '1', name: 'Pre-deployment validation', status: 'pending' },
    { id: '2', name: 'Build and test', status: 'pending' },
    { id: '3', name: 'Security scanning', status: 'pending' },
    { id: '4', name: 'Database migrations', status: 'pending' },
    { id: '5', name: 'Service deployment', status: 'pending' },
    { id: '6', name: 'Health checks', status: 'pending' },
    { id: '7', name: 'Rollout verification', status: 'pending' }
  ]);

  const [newConfig, setNewConfig] = useState({
    name: '',
    environment: 'staging' as const,
    auto_scaling: true,
    min_instances: 1,
    max_instances: 5,
    target_cpu_utilization: 70,
    health_check_interval: 30,
    failover_enabled: true,
    monitoring_enabled: true,
    logging_level: 'info' as const
  });

  const handleDeploy = async (configId: string) => {
    setIsDeploying(true);
    setDeploymentProgress(0);
    
    // Simulate deployment process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setDeploymentProgress(i);
    }
    
    setIsDeploying(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <PlayCircle className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Rocket className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-semibold">Production Deployment Manager</h3>
      </div>

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          {/* Active Deployment */}
          {isDeploying && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 animate-pulse" />
                  Deployment in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={deploymentProgress} />
                  <div className="grid gap-2">
                    {deploymentSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2 text-sm">
                        {getStatusIcon(step.status)}
                        <span className={step.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                          {step.name}
                        </span>
                        {step.duration && (
                          <Badge variant="outline" className="ml-auto">
                            {step.duration}s
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deployment Configurations */}
          <div className="grid gap-4">
            {deploymentConfigs.map((config) => (
              <Card key={config.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{config.name}</h4>
                        <Badge variant={config.environment === 'production' ? 'default' : 'secondary'}>
                          {config.environment}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {config.min_instances}-{config.max_instances} instances • 
                        {config.auto_scaling ? ' Auto-scaling' : ' Manual'} • 
                        {config.failover_enabled ? ' Failover enabled' : ' No failover'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedConfig(config.id)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeploy(config.id)}
                        disabled={isDeploying}
                      >
                        <Rocket className="h-3 w-3 mr-1" />
                        Deploy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Deployment Configuration</CardTitle>
              <CardDescription>
                Set up a new deployment configuration for your environment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="config-name">Configuration Name</Label>
                  <Input
                    id="config-name"
                    placeholder="e.g., Production US East"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    value={newConfig.environment}
                    onValueChange={(value: any) => setNewConfig(prev => ({ ...prev, environment: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-instances">Minimum Instances</Label>
                  <Input
                    id="min-instances"
                    type="number"
                    min={1}
                    value={newConfig.min_instances}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, min_instances: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-instances">Maximum Instances</Label>
                  <Input
                    id="max-instances"
                    type="number"
                    min={1}
                    value={newConfig.max_instances}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, max_instances: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpu-target">CPU Target (%)</Label>
                  <Input
                    id="cpu-target"
                    type="number"
                    min={10}
                    max={100}
                    value={newConfig.target_cpu_utilization}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, target_cpu_utilization: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="health-interval">Health Check Interval (seconds)</Label>
                  <Input
                    id="health-interval"
                    type="number"
                    min={10}
                    value={newConfig.health_check_interval}
                    onChange={(e) => setNewConfig(prev => ({ ...prev, health_check_interval: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Scaling</Label>
                    <div className="text-sm text-muted-foreground">
                      Automatically scale instances based on demand
                    </div>
                  </div>
                  <Switch
                    checked={newConfig.auto_scaling}
                    onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, auto_scaling: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Failover Protection</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable automatic failover to backup regions
                    </div>
                  </div>
                  <Switch
                    checked={newConfig.failover_enabled}
                    onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, failover_enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enhanced Monitoring</Label>
                    <div className="text-sm text-muted-foreground">
                      Enable detailed performance monitoring
                    </div>
                  </div>
                  <Switch
                    checked={newConfig.monitoring_enabled}
                    onCheckedChange={(checked) => setNewConfig(prev => ({ ...prev, monitoring_enabled: checked }))}
                  />
                </div>
              </div>

              <Button
                onClick={() => updateDeploymentConfig({
                  ...newConfig,
                  id: `config-${Date.now()}`,
                  backup_providers: [],
                  rate_limiting: {
                    requests_per_minute: 1000,
                    requests_per_hour: 50000,
                    requests_per_day: 1000000,
                    burst_allowance: 100,
                    throttle_response: 'queue'
                  },
                  security_config: {
                    api_key_rotation_days: 90,
                    encryption_at_rest: true,
                    encryption_in_transit: true,
                    audit_logging: true,
                    access_control: 'rbac',
                    ip_whitelist: [],
                    geo_blocking: [],
                    ddos_protection: true
                  },
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as any)}
                disabled={isUpdatingConfig}
                className="w-full"
              >
                {isUpdatingConfig ? 'Creating...' : 'Create Configuration'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>
                Recent deployment activities and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: '1',
                    version: 'v2.4.1',
                    environment: 'production',
                    status: 'completed',
                    timestamp: new Date(Date.now() - 3600000),
                    duration: '4m 32s'
                  },
                  {
                    id: '2',
                    version: 'v2.4.0',
                    environment: 'staging',
                    status: 'completed',
                    timestamp: new Date(Date.now() - 7200000),
                    duration: '3m 15s'
                  },
                  {
                    id: '3',
                    version: 'v2.3.9',
                    environment: 'production',
                    status: 'failed',
                    timestamp: new Date(Date.now() - 86400000),
                    duration: '2m 45s'
                  }
                ].map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <div className="font-medium">{deployment.version}</div>
                        <div className="text-sm text-muted-foreground">
                          {deployment.environment} • {deployment.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={deployment.status === 'completed' ? 'default' : deployment.status === 'failed' ? 'destructive' : 'secondary'}>
                        {deployment.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{deployment.duration}</span>
                      <Button size="sm" variant="outline">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Rollback
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};