import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  DollarSign,
  Clock,
  Zap,
  Mail,
  MessageSquare,
  Truck,
  CreditCard,
  Receipt,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useExternalAPIs,
  useAPILogs,
  useAPIAnalytics,
  useExpensya,
  useStripe,
  useShippo,
  useSendGrid,
  useWhatsApp,
  type APIService,
  type YachtAPIConfig
} from '@/hooks/useExternalAPIs';

interface ExternalAPIManagerProps {
  yachtId: string;
}

const ExternalAPIManager: React.FC<ExternalAPIManagerProps> = ({ yachtId }) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Main hooks
  const { 
    services, 
    configs, 
    loading, 
    configureService, 
    toggleService, 
    refetch 
  } = useExternalAPIs(yachtId);
  
  const { logs, summary: logSummary } = useAPILogs(yachtId, selectedService || undefined);
  const { analytics, totalUsage } = useAPIAnalytics(yachtId);

  // Service-specific hooks
  const expensya = useExpensya(yachtId);
  const stripe = useStripe(yachtId);
  const shippo = useShippo(yachtId);
  const sendgrid = useSendGrid(yachtId);
  const whatsapp = useWhatsApp(yachtId);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'expensya': return Receipt;
      case 'stripe': return CreditCard;
      case 'shippo': return Truck;
      case 'sendgrid': return Mail;
      case 'whatsapp_business': return MessageSquare;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getServiceConfig = (serviceName: string): YachtAPIConfig | undefined => {
    return configs.find(c => c.service_name === serviceName);
  };

  const handleServiceConfiguration = async (serviceName: string, formData: any) => {
    const result = await configureService(
      serviceName,
      formData.apiKey,
      formData.customConfig,
      formData.testMode
    );
    
    if (result) {
      await refetch();
    }
  };

  const handleTestConnection = async (serviceName: string) => {
    try {
      // Test API connection based on service
      let testResult;
      switch (serviceName) {
        case 'expensya':
          testResult = await expensya.syncExpenseReports();
          break;
        case 'stripe':
          // Test with a minimal customer creation
          testResult = await stripe.createCustomer('test@example.com', 'Test Customer');
          break;
        default:
          toast({
            title: "Test Not Available",
            description: "Connection test not implemented for this service",
            variant: "destructive",
          });
          return;
      }

      if (testResult?.success) {
        toast({
          title: "Connection Successful",
          description: `${serviceName} API connection is working`,
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${serviceName}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">External API Management</h2>
          <p className="text-muted-foreground">
            Configure and monitor third-party service integrations
          </p>
        </div>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Services</p>
              <p className="text-2xl font-bold">
                {configs.filter(c => c.is_enabled).length}/{services.length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">API Calls (30d)</p>
              <p className="text-2xl font-bold">{totalUsage.calls.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">{(totalUsage.successRate * 100).toFixed(1)}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold">${totalUsage.cost.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="logs">API Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4">
            {services.map((service) => {
              const Icon = getServiceIcon(service.service_name);
              const config = getServiceConfig(service.service_name);
              const isConfigured = !!config;
              const isEnabled = config?.is_enabled ?? false;
              
              return (
                <Card key={service.service_name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6" />
                        <div>
                          <CardTitle>{service.display_name}</CardTitle>
                          <CardDescription>{service.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={isConfigured ? 'default' : 'secondary'}
                          className={isConfigured ? 'bg-green-500' : ''}
                        >
                          {isConfigured ? 'Configured' : 'Not Configured'}
                        </Badge>
                        <Badge className={getStatusColor(service.health_status)}>
                          {service.health_status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Configuration Form */}
                      <ServiceConfigurationForm
                        service={service}
                        config={config}
                        onConfigure={(formData) => handleServiceConfiguration(service.service_name, formData)}
                        showCredentials={showCredentials[service.service_name]}
                        onToggleCredentials={() => setShowCredentials(prev => ({
                          ...prev,
                          [service.service_name]: !prev[service.service_name]
                        }))}
                      />

                      {/* Service Controls */}
                      {isConfigured && (
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(enabled) => toggleService(service.service_name, enabled)}
                            />
                            <Label>Enable Service</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConnection(service.service_name)}
                            >
                              Test Connection
                            </Button>
                            {config?.last_used_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last used: {new Date(config.last_used_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* API Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Call Logs</CardTitle>
              <CardDescription>
                Recent API calls and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Log Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{logSummary.total}</p>
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{logSummary.successful}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{logSummary.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{logSummary.avgResponseTime.toFixed(0)}ms</p>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Logs List */}
              <div className="space-y-2">
                {logs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.response_status >= 200 && log.response_status < 300 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{log.service_name}.{log.endpoint}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.method} • Status {log.response_status} • {log.response_time_ms}ms
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(log.created_at).toLocaleTimeString()}</p>
                      {log.error_message && (
                        <p className="text-xs text-red-500">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {logs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No API calls found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                API usage trends and cost analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Usage by Service */}
                <div>
                  <h4 className="font-medium mb-4">Usage by Service (Last 30 Days)</h4>
                  <div className="space-y-3">
                    {services.map((service) => {
                      const serviceAnalytics = analytics.filter(a => a.service_name === service.service_name);
                      const serviceCalls = serviceAnalytics.reduce((sum, day) => sum + day.total_calls, 0);
                      const serviceCost = serviceAnalytics.reduce((sum, day) => sum + day.total_cost, 0);
                      const maxCalls = Math.max(...analytics.map(a => a.total_calls), 1);
                      
                      return (
                        <div key={service.service_name} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{service.display_name}</span>
                            <span className="text-sm text-muted-foreground">
                              {serviceCalls} calls • ${serviceCost.toFixed(2)}
                            </span>
                          </div>
                          <Progress value={(serviceCalls / maxCalls) * 100} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Cost Breakdown */}
                <div>
                  <h4 className="font-medium mb-4">Cost Breakdown</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total API Costs</p>
                      <p className="text-2xl font-bold">${totalUsage.cost.toFixed(2)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Average Cost per Call</p>
                      <p className="text-2xl font-bold">
                        ${totalUsage.calls > 0 ? (totalUsage.cost / totalUsage.calls).toFixed(4) : '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Settings</CardTitle>
              <CardDescription>
                Configure global API integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Security Notice</AlertTitle>
                  <AlertDescription>
                    API keys are encrypted and stored securely. Test mode is recommended for development.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Default Request Timeout</Label>
                    <Input type="number" defaultValue="30" suffix="seconds" />
                  </div>
                  <div>
                    <Label>Retry Attempts</Label>
                    <Input type="number" defaultValue="3" />
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure rate limits to prevent API quota exhaustion
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Requests per Minute</Label>
                      <Input type="number" defaultValue="100" />
                    </div>
                    <div>
                      <Label>Daily Request Limit</Label>
                      <Input type="number" defaultValue="10000" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Service Configuration Form Component
interface ServiceConfigurationFormProps {
  service: APIService;
  config?: YachtAPIConfig;
  onConfigure: (data: any) => void;
  showCredentials: boolean;
  onToggleCredentials: () => void;
}

const ServiceConfigurationForm: React.FC<ServiceConfigurationFormProps> = ({
  service,
  config,
  onConfigure,
  showCredentials,
  onToggleCredentials
}) => {
  const [formData, setFormData] = useState({
    apiKey: '',
    testMode: true,
    customConfig: {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigure(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${service.service_name}-api-key`}>API Key</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleCredentials}
          >
            {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <Input
          id={`${service.service_name}-api-key`}
          type={showCredentials ? 'text' : 'password'}
          placeholder={config ? 'API key configured' : 'Enter API key'}
          value={formData.apiKey}
          onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
          required={!config}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id={`${service.service_name}-test-mode`}
          checked={formData.testMode}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, testMode: checked }))}
        />
        <Label htmlFor={`${service.service_name}-test-mode`}>Test Mode</Label>
      </div>

      <Button type="submit" className="w-full">
        {config ? 'Update Configuration' : 'Configure Service'}
      </Button>
    </form>
  );
};

export default ExternalAPIManager;