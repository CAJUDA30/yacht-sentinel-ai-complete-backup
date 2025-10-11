import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Server, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  Zap,
  TrendingUp,
  Settings,
  PlayCircle,
  RefreshCw,
  FileText,
  HardDrive,
  Globe,
  Monitor
} from 'lucide-react';
import { useProductionReadiness } from '@/hooks/useProductionReadiness';
import { ProductionDeploymentManager } from './production/ProductionDeploymentManager';
import { SystemHealthMonitor } from './production/SystemHealthMonitor';
import { ProductionMetricsDashboard } from './production/ProductionMetricsDashboard';

export const ProductionReadinessDashboard: React.FC = () => {
  const {
    metrics,
    deploymentConfigs,
    alerts,
    backupStatus,
    loadTestResults,
    selectedEnvironment,
    setSelectedEnvironment,
    isLoadingMetrics,
    runLoadTest,
    generateComplianceReport,
    resolveAlert,
    triggerBackup,
    checkSystemHealth,
    isRunningLoadTest,
    isGeneratingReport,
    isTriggeringBackup,
    isCheckingHealth
  } = useProductionReadiness();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'degraded': return 'secondary';
      case 'down': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoadingMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Production Readiness</h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => checkSystemHealth()}
            disabled={isCheckingHealth}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            Health Check
          </Button>
          <Button
            onClick={() => setSelectedEnvironment(
              selectedEnvironment === 'production' ? 'staging' : 'production'
            )}
            variant="outline"
          >
            <Globe className="h-4 w-4 mr-2" />
            {selectedEnvironment}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold">{metrics.uptime_percentage.toFixed(2)}%</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
              <Progress value={metrics.uptime_percentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">{metrics.avg_response_time_ms}ms</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Requests (24h)</p>
                  <p className="text-2xl font-bold">{metrics.total_requests_24h.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-2xl font-bold">{metrics.error_rate_percentage.toFixed(2)}%</p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${metrics.error_rate_percentage > 5 ? 'text-red-500' : 'text-yellow-500'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cost/Hour</p>
                  <p className="text-2xl font-bold">${metrics.cost_per_hour.toFixed(2)}</p>
                </div>
                <Database className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Alerts */}
      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts ({alerts.filter(a => !a.resolved).length} active)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(a => !a.resolved).slice(0, 5).map((alert) => (
                <Alert key={alert.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <AlertDescription>{alert.message}</AlertDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                    variant="outline"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health Monitor</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <ProductionMetricsDashboard />
        </TabsContent>

        {/* Health Monitor Tab */}
        <TabsContent value="health" className="space-y-6">
          <SystemHealthMonitor />
        </TabsContent>


        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <ProductionDeploymentManager />
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <ProductionMetricsDashboard />
        </TabsContent>


        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Backup & Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button
                  onClick={() => triggerBackup('full')}
                  disabled={isTriggeringBackup}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Full Backup
                </Button>
                <Button
                  onClick={() => triggerBackup('incremental')}
                  disabled={isTriggeringBackup}
                  variant="outline"
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Incremental
                </Button>
              </div>

              {backupStatus.length > 0 && (
                <div className="space-y-4">
                  {backupStatus.map((backup) => (
                    <Card key={backup.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{backup.backup_type} Backup</h5>
                          <Badge variant={backup.status === 'active' ? 'default' : 'secondary'}>
                            {backup.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Schedule:</span>
                            <div>{backup.schedule}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Backup:</span>
                            <div>{new Date(backup.last_backup).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Retention:</span>
                            <div>{backup.retention_days} days</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button
                  onClick={() => generateComplianceReport('gdpr')}
                  disabled={isGeneratingReport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  GDPR Report
                </Button>
                <Button
                  onClick={() => generateComplianceReport('iso27001')}
                  disabled={isGeneratingReport}
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  ISO 27001
                </Button>
                <Button
                  onClick={() => generateComplianceReport('sox')}
                  disabled={isGeneratingReport}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  SOX Report
                </Button>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Generate compliance reports to ensure regulatory adherence.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

