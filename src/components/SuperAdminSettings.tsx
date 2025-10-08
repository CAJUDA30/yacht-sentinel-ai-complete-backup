import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Database, 
  Brain, 
  Shield, 
  BarChart3,
  Users,
  Wrench,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { SuperAdminAIPanel } from '@/components/SuperAdminAIPanel';
import { AIModelConfiguration } from '@/components/AIModelConfiguration';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import AIProvidersPanel from '@/components/admin/AIProvidersPanel';
import AIConfigSummary from '@/components/admin/AIConfigSummary';
import SecretsManager from '@/components/admin/SecretsManager';
import AIConfigurationManager from '@/components/admin/AIConfigurationManager';

export const SuperAdminSettings = () => {
  const { settings, loading } = useAppSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SuperAdmin Panel
          </h1>
          <p className="text-muted-foreground">
            Advanced system configuration and AI management
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Shield className="h-4 w-4 mr-2" />
          SuperAdmin Access
        </Badge>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold text-blue-600">Operational</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Models</p>
                <p className="text-2xl font-bold text-green-600">{settings.ai.enabledModels.length}</p>
              </div>
              <Brain className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Cost</p>
                <p className="text-2xl font-bold text-amber-600">${settings.ai.costLimitPerDay}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consensus</p>
                <p className="text-2xl font-bold text-purple-600">{(settings.ai.consensusThreshold * 100).toFixed(0)}%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs defaultValue="ai-config" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="ai-config" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Config</span>
          </TabsTrigger>
          <TabsTrigger value="ai-panel" className="flex items-center space-x-2">
            <Wrench className="h-4 w-4" />
            <span>AI Control</span>
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Models</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Database</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Modules</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Configuration Manager */}
        <TabsContent value="ai-config" className="space-y-6">
          <AIConfigurationManager />
        </TabsContent>

        {/* AI Control Panel */}
        <TabsContent value="ai-panel" className="space-y-6">
          <SuperAdminAIPanel />
          <AIProvidersPanel />
        </TabsContent>

        {/* AI Models Configuration */}
        <TabsContent value="models">
          <AIModelConfiguration />
        </TabsContent>

        {/* Database Management */}
        <TabsContent value="database" className="space-y-6">
          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Connection Status</p>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Connected</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Database Size</p>
                  <p className="font-medium">2.3 GB</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Storage Usage</p>
                <Progress value={23} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">23% of 10 GB used</p>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="mr-2">
                  <Database className="h-4 w-4 mr-2" />
                  View Tables
                </Button>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Active Connections</span>
                  <Badge>12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Queries/Second</span>
                  <Badge>45</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cache Hit Rate</span>
                  <Badge variant="outline">94%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Management */}
        <TabsContent value="modules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Crew Module</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Integration</span>
                  <Badge>Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated</span>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Maintenance Module</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Integration</span>
                  <Badge>Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated</span>
                  <span className="text-sm text-muted-foreground">1 hour ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Inventory Module</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Integration</span>
                  <Badge>Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated</span>
                  <span className="text-sm text-muted-foreground">30 minutes ago</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Analytics Module</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>AI Integration</span>
                  <Badge>Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated</span>
                  <span className="text-sm text-muted-foreground">15 minutes ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Management */}
        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">RLS Enabled</p>
                  <p className="text-sm text-muted-foreground">Row Level Security</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">SSL/TLS</p>
                  <p className="text-sm text-muted-foreground">Encrypted Connections</p>
                </div>
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-medium">API Rate Limits</p>
                  <p className="text-sm text-muted-foreground">Review Needed</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Recent Security Events</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm">Admin login from new location</span>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm">AI model configuration updated</span>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
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