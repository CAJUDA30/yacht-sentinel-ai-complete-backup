import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Puzzle, 
  Zap, 
  Globe,
  Code,
  BarChart3,
  Webhook,
  Key,
  Package,
  Users,
  Settings,
  Plus,
  CheckCircle,
  AlertTriangle,
  Activity,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: string;
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  type: 'api' | 'webhook' | 'oauth' | 'custom';
  usage: {
    requests: number;
    success_rate: number;
    avg_response_time: number;
  };
  config: {
    endpoint?: string;
    version: string;
    rate_limit: string;
  };
  lastSync: string;
  description: string;
}

interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  usage: number;
  avg_response_time: number;
  error_rate: number;
  version: string;
  authentication: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
  last_delivery: string;
  success_rate: number;
  retry_attempts: number;
}

export default function AdvancedIntegrationEcosystem() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadIntegrationData();
  }, []);

  const loadIntegrationData = () => {
    // Mock Integrations
    const mockIntegrations: Integration[] = [
      {
        id: '1',
        name: 'Stripe Payment Processing',
        category: 'payments',
        provider: 'Stripe',
        status: 'active',
        type: 'api',
        usage: {
          requests: 15420,
          success_rate: 99.8,
          avg_response_time: 145
        },
        config: {
          endpoint: 'https://api.stripe.com/v1',
          version: 'v1',
          rate_limit: '100 req/sec'
        },
        lastSync: '2024-01-15 12:45:00',
        description: 'Process payments and manage customer billing'
      },
      {
        id: '2',
        name: 'Weather API Integration',
        category: 'weather',
        provider: 'OpenWeatherMap',
        status: 'active',
        type: 'api',
        usage: {
          requests: 8920,
          success_rate: 99.2,
          avg_response_time: 89
        },
        config: {
          endpoint: 'https://api.openweathermap.org/data/2.5',
          version: '2.5',
          rate_limit: '1000 req/hour'
        },
        lastSync: '2024-01-15 12:30:00',
        description: 'Real-time weather data for yacht operations'
      },
      {
        id: '3',
        name: 'DocuSign E-Signatures',
        category: 'documents',
        provider: 'DocuSign',
        status: 'active',
        type: 'oauth',
        usage: {
          requests: 3240,
          success_rate: 98.9,
          avg_response_time: 234
        },
        config: {
          version: 'v2.1',
          rate_limit: '1000 req/hour'
        },
        lastSync: '2024-01-15 11:15:00',
        description: 'Digital document signing and contract management'
      },
      {
        id: '4',
        name: 'Marine Traffic API',
        category: 'maritime',
        provider: 'MarineTraffic',
        status: 'active',
        type: 'api',
        usage: {
          requests: 12100,
          success_rate: 99.5,
          avg_response_time: 167
        },
        config: {
          endpoint: 'https://services.marinetraffic.com/api',
          version: 'v1',
          rate_limit: '500 req/hour'
        },
        lastSync: '2024-01-15 12:20:00',
        description: 'Vessel tracking and maritime intelligence'
      },
      {
        id: '5',
        name: 'Slack Notifications',
        category: 'communication',
        provider: 'Slack',
        status: 'error',
        type: 'webhook',
        usage: {
          requests: 5670,
          success_rate: 87.3,
          avg_response_time: 78
        },
        config: {
          version: 'v1',
          rate_limit: '1 req/sec'
        },
        lastSync: '2024-01-15 10:45:00',
        description: 'Team notifications and alerts'
      }
    ];

    // Mock API Endpoints
    const mockEndpoints: APIEndpoint[] = [
      {
        path: '/api/v1/yachts',
        method: 'GET',
        usage: 24500,
        avg_response_time: 89,
        error_rate: 0.2,
        version: 'v1',
        authentication: 'Bearer Token'
      },
      {
        path: '/api/v1/bookings',
        method: 'POST',
        usage: 18200,
        avg_response_time: 156,
        error_rate: 0.5,
        version: 'v1',
        authentication: 'API Key'
      },
      {
        path: '/api/v1/crew',
        method: 'GET',
        usage: 12300,
        avg_response_time: 67,
        error_rate: 0.1,
        version: 'v1',
        authentication: 'OAuth 2.0'
      },
      {
        path: '/api/v1/maintenance',
        method: 'PUT',
        usage: 8920,
        avg_response_time: 134,
        error_rate: 0.3,
        version: 'v1',
        authentication: 'Bearer Token'
      }
    ];

    // Mock Webhooks
    const mockWebhooks: WebhookConfig[] = [
      {
        id: '1',
        name: 'Booking Status Updates',
        url: 'https://partner.com/webhooks/bookings',
        events: ['booking.created', 'booking.updated', 'booking.cancelled'],
        status: 'active',
        last_delivery: '2024-01-15 12:35:00',
        success_rate: 98.7,
        retry_attempts: 3
      },
      {
        id: '2',
        name: 'Payment Notifications',
        url: 'https://billing.system.com/webhooks/payments',
        events: ['payment.succeeded', 'payment.failed', 'payment.refunded'],
        status: 'active',
        last_delivery: '2024-01-15 12:40:00',
        success_rate: 99.2,
        retry_attempts: 3
      },
      {
        id: '3',
        name: 'Maintenance Alerts',
        url: 'https://maintenance.app.com/alerts',
        events: ['maintenance.due', 'maintenance.completed', 'maintenance.overdue'],
        status: 'failed',
        last_delivery: '2024-01-15 08:20:00',
        success_rate: 78.5,
        retry_attempts: 5
      }
    ];

    setIntegrations(mockIntegrations);
    setApiEndpoints(mockEndpoints);
    setWebhooks(mockWebhooks);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Code className="w-4 h-4" />;
      case 'webhook':
        return <Webhook className="w-4 h-4" />;
      case 'oauth':
        return <Key className="w-4 h-4" />;
      case 'custom':
        return <Settings className="w-4 h-4" />;
      default:
        return <Puzzle className="w-4 h-4" />;
    }
  };

  const filteredIntegrations = selectedCategory === 'all' 
    ? integrations 
    : integrations.filter(integration => integration.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(integrations.map(i => i.category)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Advanced Integration Ecosystem</h2>
          <p className="text-muted-foreground">Third-party integrations and API management</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Integrations</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">
                  {integrations.reduce((sum, i) => sum + i.usage.requests, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(integrations.reduce((sum, i) => sum + i.usage.success_rate, 0) / integrations.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api">API Management</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid gap-4">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(integration.type)}
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{integration.provider} • {integration.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {integration.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{integration.usage.requests.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Requests</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{integration.usage.success_rate}%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{integration.usage.avg_response_time}ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                  </div>
                  
                  {integration.config.endpoint && (
                    <div className="space-y-2">
                      <Label>Endpoint Configuration</Label>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <code className="text-sm">{integration.config.endpoint}</code>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Version: {integration.config.version} • Rate Limit: {integration.config.rate_limit}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Last sync: {integration.lastSync}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints Performance</CardTitle>
              <CardDescription>Monitor and manage your API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {endpoint.method}
                      </Badge>
                      <div>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                        <div className="text-xs text-muted-foreground">
                          {endpoint.authentication} • {endpoint.version}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-semibold">{endpoint.usage.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">requests</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{endpoint.avg_response_time}ms</div>
                        <div className="text-xs text-muted-foreground">avg time</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${endpoint.error_rate < 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {endpoint.error_rate}%
                        </div>
                        <div className="text-xs text-muted-foreground">error rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{webhook.name}</CardTitle>
                      <CardDescription>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{webhook.url}</code>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(webhook.status)}>
                      {webhook.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{webhook.success_rate}%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{webhook.retry_attempts}</div>
                      <div className="text-sm text-muted-foreground">Max Retries</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Last Delivery</div>
                      <div className="text-xs text-muted-foreground">{webhook.last_delivery}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Events</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {webhook.events.map((event, idx) => (
                        <Badge key={idx} variant="secondary">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integration Marketplace</CardTitle>
              <CardDescription>Discover and install new integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Featured Integrations:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• QuickBooks Online - Financial management</li>
                    <li>• Salesforce CRM - Customer relationship management</li>
                    <li>• HubSpot Marketing - Marketing automation</li>
                    <li>• Zapier - Workflow automation</li>
                    <li>• Microsoft Teams - Team collaboration</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Maritime Specific:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• AIS Vessel Tracking - Real-time vessel positions</li>
                    <li>• Port Authority APIs - Port information and schedules</li>
                    <li>• Marine Weather Services - Weather forecasting</li>
                    <li>• Customs & Immigration - Regulatory compliance</li>
                    <li>• Fuel Price APIs - Real-time fuel pricing</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button>
                  <Globe className="w-4 h-4 mr-2" />
                  Browse Marketplace
                </Button>
                <Button variant="outline">
                  <Code className="w-4 h-4 mr-2" />
                  Custom Integration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}