import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plug, 
  Database, 
  Globe, 
  Smartphone,
  Cloud,
  Zap,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Link,
  Key,
  Shield,
  Activity,
  Webhook
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Integration {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'webhook' | 'database' | 'service' | 'iot';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  endpoint?: string;
  authentication: 'none' | 'api_key' | 'oauth' | 'basic';
  lastSync?: Date;
  dataFlows: string[];
  configuration: Record<string, any>;
  health: number;
  usage: {
    requests: number;
    errors: number;
    latency: number;
  };
}

interface ApiEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  description: string;
  parameters: { name: string; type: string; required: boolean }[];
  responses: { code: number; description: string }[];
  authenticated: boolean;
  rateLimit?: number;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  lastDelivery?: Date;
  deliveryStatus: 'success' | 'failed' | 'pending';
}

export default function SystemIntegrationHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const { toast } = useToast();

  const loadIntegrationData = async () => {
    try {
      setIsLoading(true);

      // Mock integrations data
      const mockIntegrations: Integration[] = [
        {
          id: 'supabase',
          name: 'Supabase Database',
          description: 'Primary database and authentication service',
          type: 'database',
          status: 'connected',
          endpoint: 'https://vdjsfupbjtbkpuvwffbn.supabase.co',
          authentication: 'api_key',
          lastSync: new Date(Date.now() - 1000 * 60 * 5),
          dataFlows: ['Authentication', 'Data Storage', 'Real-time Updates'],
          configuration: {
            project_id: 'vdjsfupbjtbkpuvwffbn',
            region: 'us-east-1',
            version: 'v1'
          },
          health: 98,
          usage: {
            requests: 15420,
            errors: 12,
            latency: 45
          }
        },
        {
          id: 'openai',
          name: 'OpenAI API',
          description: 'AI language model for intelligent features',
          type: 'api',
          status: 'connected',
          endpoint: 'https://api.openai.com/v1',
          authentication: 'api_key',
          lastSync: new Date(Date.now() - 1000 * 60 * 2),
          dataFlows: ['Text Generation', 'Analysis', 'Recommendations'],
          configuration: {
            model: 'gpt-4',
            max_tokens: 2000,
            temperature: 0.7
          },
          health: 95,
          usage: {
            requests: 2847,
            errors: 3,
            latency: 890
          }
        },
        {
          id: 'weather',
          name: 'Weather Service',
          description: 'Maritime weather data integration',
          type: 'api',
          status: 'connected',
          endpoint: 'https://api.windy.com/api',
          authentication: 'api_key',
          lastSync: new Date(Date.now() - 1000 * 60 * 15),
          dataFlows: ['Weather Data', 'Marine Forecasts', 'Alerts'],
          configuration: {
            update_interval: 900,
            data_types: ['wind', 'waves', 'precipitation'],
            coverage: 'global'
          },
          health: 92,
          usage: {
            requests: 432,
            errors: 1,
            latency: 235
          }
        },
        {
          id: 'iot_sensors',
          name: 'IoT Sensor Network',
          description: 'Yacht sensors and monitoring devices',
          type: 'iot',
          status: 'connected',
          authentication: 'none',
          lastSync: new Date(Date.now() - 1000 * 30),
          dataFlows: ['Sensor Data', 'Equipment Status', 'Environmental Monitoring'],
          configuration: {
            protocol: 'MQTT',
            devices: 24,
            update_frequency: 30
          },
          health: 87,
          usage: {
            requests: 8640,
            errors: 45,
            latency: 120
          }
        }
      ];

      // Mock API endpoints
      const mockApiEndpoints: ApiEndpoint[] = [
        {
          id: 'get_equipment',
          name: 'Get Equipment List',
          method: 'GET',
          endpoint: '/api/equipment',
          description: 'Retrieve list of all equipment with status',
          parameters: [
            { name: 'status', type: 'string', required: false },
            { name: 'category', type: 'string', required: false },
            { name: 'limit', type: 'number', required: false }
          ],
          responses: [
            { code: 200, description: 'Successfully retrieved equipment list' },
            { code: 401, description: 'Unauthorized access' },
            { code: 500, description: 'Internal server error' }
          ],
          authenticated: true,
          rateLimit: 100
        },
        {
          id: 'create_audit',
          name: 'Create Audit Instance',
          method: 'POST',
          endpoint: '/api/audits',
          description: 'Create a new audit instance',
          parameters: [
            { name: 'template_id', type: 'string', required: true },
            { name: 'scheduled_date', type: 'date', required: true },
            { name: 'assigned_to', type: 'string', required: false }
          ],
          responses: [
            { code: 201, description: 'Audit created successfully' },
            { code: 400, description: 'Invalid request data' },
            { code: 401, description: 'Unauthorized access' }
          ],
          authenticated: true,
          rateLimit: 50
        }
      ];

      // Mock webhooks
      const mockWebhooks: WebhookConfig[] = [
        {
          id: 'audit_completion',
          name: 'Audit Completion Webhook',
          url: 'https://external-system.com/webhooks/audit-complete',
          events: ['audit.completed', 'audit.failed'],
          secret: '***hidden***',
          active: true,
          lastDelivery: new Date(Date.now() - 1000 * 60 * 30),
          deliveryStatus: 'success'
        },
        {
          id: 'maintenance_alerts',
          name: 'Maintenance Alert Webhook',
          url: 'https://maintenance-system.com/alerts',
          events: ['maintenance.due', 'equipment.failure'],
          active: true,
          lastDelivery: new Date(Date.now() - 1000 * 60 * 60 * 2),
          deliveryStatus: 'success'
        }
      ];

      setIntegrations(mockIntegrations);
      setApiEndpoints(mockApiEndpoints);
      setWebhooks(mockWebhooks);

    } catch (error) {
      console.error('Error loading integration data:', error);
      toast({
        title: "Error Loading Integrations",
        description: "Failed to load integration data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const handleTestConnection = (integrationId: string) => {
    toast({
      title: "Testing Connection",
      description: "Testing connection to integration service...",
    });
    
    // Simulate connection test
    setTimeout(() => {
      toast({
        title: "Connection Test Successful",
        description: "Integration is working properly.",
      });
    }, 2000);
  };

  const handleToggleIntegration = (integrationId: string, enabled: boolean) => {
    setIntegrations(integrations.map(int => 
      int.id === integrationId 
        ? { ...int, status: enabled ? 'connected' : 'disconnected' }
        : int
    ));
    
    toast({
      title: enabled ? "Integration Enabled" : "Integration Disabled",
      description: `${integrations.find(i => i.id === integrationId)?.name} has been ${enabled ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleWebhookTest = (webhookId: string) => {
    toast({
      title: "Testing Webhook",
      description: "Sending test payload to webhook endpoint...",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'disconnected':
        return 'text-gray-500';
      case 'error':
        return 'text-red-500';
      case 'configuring':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'configuring':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Globe className="h-4 w-4" />;
      case 'webhook':
        return <Webhook className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'service':
        return <Cloud className="h-4 w-4" />;
      case 'iot':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Plug className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Integration Hub</h1>
          <p className="text-muted-foreground">
            Manage external integrations, APIs, and data flows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadIntegrationData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Integration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
            <div className="text-xs text-muted-foreground">
              {integrations.filter(i => i.status === 'connected').length} active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.reduce((sum, int) => sum + int.usage.requests, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Last 24 hours
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(integrations.reduce((sum, int) => sum + int.health, 0) / integrations.length)}%
            </div>
            <div className="text-xs text-muted-foreground">
              System health score
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooks.length}</div>
            <div className="text-xs text-muted-foreground">
              {webhooks.filter(w => w.active).length} active
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(integration.type)}
                      <span>{integration.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(integration.status)}
                      <Switch
                        checked={integration.status === 'connected'}
                        onCheckedChange={(enabled) => handleToggleIntegration(integration.id, enabled)}
                      />
                    </div>
                  </CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div className="capitalize">{integration.type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Health:</span>
                        <div>{integration.health}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Requests:</span>
                        <div>{integration.usage.requests.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Latency:</span>
                        <div>{integration.usage.latency}ms</div>
                      </div>
                    </div>

                    {integration.lastSync && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span className="ml-2">{integration.lastSync.toLocaleString()}</span>
                      </div>
                    )}

                    <div>
                      <span className="text-sm text-muted-foreground">Data Flows:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {integration.dataFlows.map((flow, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {flow}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleTestConnection(integration.id)}>
                        <Zap className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Available API endpoints for external integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint) => (
                  <div key={endpoint.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{endpoint.method}</Badge>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {endpoint.endpoint}
                          </code>
                          {endpoint.authenticated && (
                            <Badge variant="secondary">
                              <Key className="h-3 w-3 mr-1" />
                              Auth Required
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">{endpoint.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {endpoint.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Parameters:</span>
                            <div className="mt-1 space-y-1">
                              {endpoint.parameters.map((param, idx) => (
                                <div key={idx} className="text-xs">
                                  <code>{param.name}</code> ({param.type})
                                  {param.required && <span className="text-red-500">*</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Responses:</span>
                            <div className="mt-1 space-y-1">
                              {endpoint.responses.map((response, idx) => (
                                <div key={idx} className="text-xs">
                                  <Badge variant="outline" className="text-xs mr-1">
                                    {response.code}
                                  </Badge>
                                  {response.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline">
                          <Link className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>Manage outgoing webhooks for real-time notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{webhook.name}</h4>
                          <Switch
                            checked={webhook.active}
                            onCheckedChange={(active) => {
                              setWebhooks(webhooks.map(w => 
                                w.id === webhook.id ? { ...w, active } : w
                              ));
                            }}
                          />
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">URL:</span>
                            <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">
                              {webhook.url}
                            </code>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Events:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {webhook.events.map((event, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {webhook.lastDelivery && (
                            <div>
                              <span className="text-muted-foreground">Last Delivery:</span>
                              <span className="ml-2">{webhook.lastDelivery.toLocaleString()}</span>
                              <Badge 
                                variant={webhook.deliveryStatus === 'success' ? 'default' : 'destructive'}
                                className="ml-2 text-xs"
                              >
                                {webhook.deliveryStatus}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" onClick={() => handleWebhookTest(webhook.id)}>
                          <Zap className="h-4 w-4 mr-2" />
                          Test
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Integration Health</CardTitle>
                <CardDescription>Real-time health monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(integration.type)}
                        <span className="text-sm">{integration.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${integration.health}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium w-12">{integration.health}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Statistics</CardTitle>
                <CardDescription>API usage and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Requests (24h)</span>
                    <span className="font-medium">
                      {integrations.reduce((sum, int) => sum + int.usage.requests, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Errors</span>
                    <span className="font-medium">
                      {integrations.reduce((sum, int) => sum + int.usage.errors, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Latency</span>
                    <span className="font-medium">
                      {Math.round(integrations.reduce((sum, int) => sum + int.usage.latency, 0) / integrations.length)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium text-green-500">
                      {Math.round((1 - integrations.reduce((sum, int) => sum + int.usage.errors, 0) / 
                        integrations.reduce((sum, int) => sum + int.usage.requests, 0)) * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}