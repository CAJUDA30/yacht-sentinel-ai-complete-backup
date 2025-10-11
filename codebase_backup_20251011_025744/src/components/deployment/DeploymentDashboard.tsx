import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Rocket,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Activity,
  Monitor,
  Database,
  Cloud,
  Settings,
  PlayCircle,
  StopCircle,
  RotateCcw,
  ExternalLink,
  FileText,
  Users,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';

interface Deployment {
  id: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  commit: string;
  status: 'success' | 'failed' | 'in-progress' | 'pending';
  deployedAt: Date;
  deployedBy: string;
  duration: number;
  url: string;
  buildLogs: string[];
  healthStatus: 'healthy' | 'degraded' | 'down';
}

interface Environment {
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'deploying';
  lastDeployed: Date;
  version: string;
  uptime: number;
  healthChecks: {
    api: boolean;
    database: boolean;
    cdn: boolean;
    ssl: boolean;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    memoryUsage: number;
  };
}

const DeploymentDashboard = () => {
  const { toast } = useToast();
  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: 'prod-001',
      environment: 'production',
      version: 'v2.1.0',
      commit: 'a1b2c3d',
      status: 'success',
      deployedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      deployedBy: 'admin@yachtexcel.com',
      duration: 285,
      url: 'https://yachtexcel.com',
      buildLogs: ['✓ Dependencies installed', '✓ TypeScript compiled', '✓ Assets optimized', '✓ Deployment complete'],
      healthStatus: 'healthy'
    },
    {
      id: 'stage-002',
      environment: 'staging',
      version: 'v2.1.1-beta',
      commit: 'e4f5g6h',
      status: 'success',
      deployedAt: new Date(Date.now() - 30 * 60 * 1000),
      deployedBy: 'dev@yachtexcel.com',
      duration: 195,
      url: 'https://staging.yachtexcel.com',
      buildLogs: ['✓ Dependencies installed', '✓ TypeScript compiled', '✓ Tests passed', '✓ Deployment complete'],
      healthStatus: 'healthy'
    },
    {
      id: 'dev-003',
      environment: 'development',
      version: 'v2.2.0-dev',
      commit: 'i7j8k9l',
      status: 'in-progress',
      deployedAt: new Date(),
      deployedBy: 'dev@yachtexcel.com',
      duration: 0,
      url: 'https://dev.yachtexcel.com',
      buildLogs: ['✓ Dependencies installed', '⏳ Compiling TypeScript...'],
      healthStatus: 'degraded'
    }
  ]);

  const [environments, setEnvironments] = useState<Environment[]>([
    {
      name: 'Production',
      url: 'https://yachtexcel.com',
      status: 'active',
      lastDeployed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      version: 'v2.1.0',
      uptime: 99.9,
      healthChecks: {
        api: true,
        database: true,
        cdn: true,
        ssl: true
      },
      metrics: {
        responseTime: 185,
        errorRate: 0.1,
        throughput: 250,
        memoryUsage: 45
      }
    },
    {
      name: 'Staging',
      url: 'https://staging.yachtexcel.com',
      status: 'active',
      lastDeployed: new Date(Date.now() - 30 * 60 * 1000),
      version: 'v2.1.1-beta',
      uptime: 99.5,
      healthChecks: {
        api: true,
        database: true,
        cdn: true,
        ssl: true
      },
      metrics: {
        responseTime: 220,
        errorRate: 0.2,
        throughput: 85,
        memoryUsage: 38
      }
    },
    {
      name: 'Development',
      url: 'https://dev.yachtexcel.com',
      status: 'deploying',
      lastDeployed: new Date(),
      version: 'v2.2.0-dev',
      uptime: 95.2,
      healthChecks: {
        api: false,
        database: true,
        cdn: true,
        ssl: true
      },
      metrics: {
        responseTime: 340,
        errorRate: 1.5,
        throughput: 45,
        memoryUsage: 52
      }
    }
  ]);

  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('production');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
      case 'active': return 'hsl(var(--success))';
      case 'failed':
      case 'down': return 'hsl(var(--destructive))';
      case 'in-progress':
      case 'deploying':
      case 'degraded': return 'hsl(var(--warning))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'healthy':
      case 'active': return CheckCircle;
      case 'failed':
      case 'down': return XCircle;
      case 'in-progress':
      case 'deploying':
      case 'degraded': return AlertTriangle;
      default: return Clock;
    }
  };

  const handleDeploy = (environment: string) => {
    toast({
      title: `Deploying to ${environment}`,
      description: 'Deployment started. This may take a few minutes.'
    });
    
    // Simulate deployment
    const newDeployment: Deployment = {
      id: `${environment}-${Date.now()}`,
      environment: environment as any,
      version: 'v2.1.1',
      commit: 'new123',
      status: 'in-progress',
      deployedAt: new Date(),
      deployedBy: 'admin@yachtexcel.com',
      duration: 0,
      url: `https://${environment === 'production' ? '' : environment + '.'}yachtexcel.com`,
      buildLogs: ['⏳ Starting deployment...'],
      healthStatus: 'degraded'
    };
    
    setDeployments(prev => [newDeployment, ...prev]);
  };

  const handleRollback = (deploymentId: string) => {
    toast({
      title: 'Rolling back deployment',
      description: 'Reverting to previous stable version'
    });
  };

  const totalDeployments = deployments.length;
  const successfulDeployments = deployments.filter(d => d.status === 'success').length;
  const successRate = Math.round((successfulDeployments / totalDeployments) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rocket className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">Deployment Dashboard</h2>
            <p className="text-muted-foreground">
              {totalDeployments} deployments • {successRate}% success rate
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <GitBranch className="h-4 w-4 mr-2" />
            View Git History
          </Button>
          <Button size="sm" onClick={() => handleDeploy('staging')}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Deploy to Staging
          </Button>
        </div>
      </div>

      <Tabs defaultValue="environments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="environments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {environments.map((env) => {
              const StatusIcon = getStatusIcon(env.status);
              
              return (
                <Card key={env.name} className={`cursor-pointer transition-colors ${
                  selectedEnvironment === env.name.toLowerCase() ? 'border-primary' : ''
                }`} onClick={() => setSelectedEnvironment(env.name.toLowerCase())}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {env.name}
                      </div>
                      <Badge variant="outline" style={{ color: getStatusColor(env.status) }}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {env.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Version</span>
                        <span className="font-medium">{env.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">{env.uptime}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Response Time</span>
                        <span className="font-medium">{env.metrics.responseTime}ms</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Health Checks</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(env.healthChecks).map(([check, status]) => (
                          <div key={check} className="flex items-center gap-1 text-xs">
                            <div className={`w-2 h-2 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="capitalize">{check}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visit
                      </Button>
                      <Button size="sm" className="flex-1" onClick={(e) => {
                        e.stopPropagation();
                        handleDeploy(env.name.toLowerCase());
                      }}>
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Deploy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Environment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Environment Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">185ms</p>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">99.9%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">250</p>
                  <p className="text-sm text-muted-foreground">Requests/min</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">0.1%</p>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Recent Deployments</span>
              <Badge variant="secondary">{deployments.length}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {deployments.map((deployment) => {
                const StatusIcon = getStatusIcon(deployment.status);
                
                return (
                  <Card key={deployment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-muted">
                          <StatusIcon className="h-4 w-4" style={{ color: getStatusColor(deployment.status) }} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{deployment.version}</h4>
                              <Badge variant="outline" className="text-xs">
                                {deployment.environment}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                #{deployment.commit}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" style={{ color: getStatusColor(deployment.status) }}>
                                {deployment.status}
                              </Badge>
                              {deployment.status === 'success' && (
                                <Button variant="ghost" size="sm" onClick={() => handleRollback(deployment.id)}>
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {deployment.deployedBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {deployment.deployedAt.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {deployment.duration > 0 ? `${deployment.duration}s` : 'In progress'}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            {deployment.buildLogs.map((log, index) => (
                              <div key={index} className="text-xs font-mono bg-muted/30 p-2 rounded">
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {/* Monitoring Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{successRate}%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">3.2min</p>
                    <p className="text-sm text-muted-foreground">Avg Deploy Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{deployments.filter(d => d.status === 'in-progress').length}</p>
                    <p className="text-sm text-muted-foreground">Active Deploys</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Rocket className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{deployments.filter(d => 
                      d.deployedAt.toDateString() === new Date().toDateString()
                    ).length}</p>
                    <p className="text-sm text-muted-foreground">Today's Deploys</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {environments.map((env) => (
                  <div key={env.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{env.name}</span>
                      <Badge variant={env.uptime > 99 ? 'default' : 'secondary'}>
                        {env.uptime}% uptime
                      </Badge>
                    </div>
                    <Progress value={env.uptime} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Deployment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Auto-deployment</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Deploy to staging on push</p>
                      <p className="text-sm text-muted-foreground">Automatically deploy to staging when code is pushed to main branch</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Production deployment approval</p>
                      <p className="text-sm text-muted-foreground">Require manual approval for production deployments</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Deployment notifications</p>
                      <p className="text-sm text-muted-foreground">Get notified about deployment status changes</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Health check alerts</p>
                      <p className="text-sm text-muted-foreground">Receive alerts when health checks fail</p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline">
                  Configure Webhooks
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeploymentDashboard;