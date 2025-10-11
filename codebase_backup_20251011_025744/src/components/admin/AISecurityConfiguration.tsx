import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Settings,
  Database,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SecretsManager from './SecretsManager';

interface SecurityConfig {
  encryption_enabled: boolean;
  rate_limiting_enabled: boolean;
  audit_logging: boolean;
  access_control: boolean;
  api_key_rotation: boolean;
}

interface ConfigItem {
  key: string;
  value: any;
  description: string;
  category: 'system' | 'ai' | 'security';
  is_sensitive: boolean;
}

export const AISecurityConfiguration: React.FC = () => {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    encryption_enabled: true,
    rate_limiting_enabled: true,
    audit_logging: true,
    access_control: true,
    api_key_rotation: false
  });
  const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddConfig, setShowAddConfig] = useState(false);
  const [newConfigItem, setNewConfigItem] = useState({
    key: '',
    value: '',
    description: '',
    category: 'system' as const,
    is_sensitive: false
  });
  const { toast } = useToast();

  const loadSecurityConfig = async () => {
    setLoading(true);
    try {
      // Load system configuration
      const { data: configData, error: configError } = await supabase
        .from('ai_system_config')
        .select('*')
        .in('config_key', ['security_config', 'encryption_settings', 'audit_settings']);

      if (configError) throw configError;

      // Load all configuration items for display
      const { data: allConfigs } = await supabase
        .from('ai_system_config')
        .select('*')
        .order('config_key');

      if (allConfigs) {
        const items: ConfigItem[] = allConfigs.map(config => ({
          key: config.config_key,
          value: config.config_value,
          description: getConfigDescription(config.config_key),
          category: getConfigCategory(config.config_key),
          is_sensitive: isSensitiveConfig(config.config_key)
        }));
        setConfigItems(items);
      }

      // Process security-specific config
      const securitySettings = configData?.find(c => c.config_key === 'security_config')?.config_value;
      if (securitySettings && typeof securitySettings === 'object') {
        setSecurityConfig(prev => ({ ...prev, ...securitySettings as Partial<SecurityConfig> }));
      }
    } catch (error) {
      console.error('Failed to load security config:', error);
      toast({
        title: 'Failed to load configuration',
        description: 'Unable to fetch security settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSecurityConfig = async (updates: Partial<SecurityConfig>) => {
    try {
      const newConfig = { ...securityConfig, ...updates };
      
      const { error } = await supabase
        .from('ai_system_config')
        .upsert({
          config_key: 'security_config',
          config_value: newConfig
        }, { onConflict: 'config_key' });

      if (error) throw error;

      setSecurityConfig(newConfig);
      toast({
        title: 'Security configuration updated',
        description: 'Changes have been saved successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Unable to update security configuration',
        variant: 'destructive'
      });
    }
  };

  const addConfigItem = async () => {
    if (!newConfigItem.key || !newConfigItem.value) {
      toast({
        title: 'Missing information',
        description: 'Please provide both key and value',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_system_config')
        .insert({
          config_key: newConfigItem.key,
          config_value: newConfigItem.value
        });

      if (error) throw error;

      toast({
        title: 'Configuration added',
        description: `${newConfigItem.key} has been added`
      });

      setShowAddConfig(false);
      setNewConfigItem({
        key: '',
        value: '',
        description: '',
        category: 'system',
        is_sensitive: false
      });
      loadSecurityConfig();
    } catch (error: any) {
      toast({
        title: 'Failed to add configuration',
        description: error.message || 'Unable to add configuration item',
        variant: 'destructive'
      });
    }
  };

  const getConfigDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'security_config': 'Core security settings and policies',
      'encryption_settings': 'Data encryption and key management',
      'audit_settings': 'Audit logging and compliance configuration',
      'rate_limits': 'API rate limiting configuration',
      'feature_flags': 'System feature toggles and flags'
    };
    return descriptions[key] || 'Configuration setting';
  };

  const getConfigCategory = (key: string): 'system' | 'ai' | 'security' => {
    if (key.includes('security') || key.includes('audit') || key.includes('encryption')) {
      return 'security';
    }
    if (key.includes('ai') || key.includes('model') || key.includes('provider')) {
      return 'ai';
    }
    return 'system';
  };

  const isSensitiveConfig = (key: string): boolean => {
    return key.includes('key') || key.includes('secret') || key.includes('password') || key.includes('token');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'ai': return <Database className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'text-red-600 bg-red-50';
      case 'ai': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  useEffect(() => {
    loadSecurityConfig();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Security & Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Manage security settings, secrets, and system configuration
          </p>
        </div>
        <Button variant="outline" onClick={loadSecurityConfig} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList>
          <TabsTrigger value="security">Security Policies</TabsTrigger>
          <TabsTrigger value="secrets">Secrets Management</TabsTrigger>
          <TabsTrigger value="configuration">System Configuration</TabsTrigger>
          <TabsTrigger value="audit">Audit & Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Data Encryption</Label>
                      <p className="text-sm text-muted-foreground">Encrypt sensitive data at rest and in transit</p>
                    </div>
                    <Switch
                      checked={securityConfig.encryption_enabled}
                      onCheckedChange={(checked) => updateSecurityConfig({ encryption_enabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Rate Limiting</Label>
                      <p className="text-sm text-muted-foreground">Protect APIs with rate limiting</p>
                    </div>
                    <Switch
                      checked={securityConfig.rate_limiting_enabled}
                      onCheckedChange={(checked) => updateSecurityConfig({ rate_limiting_enabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">Log all administrative actions</p>
                    </div>
                    <Switch
                      checked={securityConfig.audit_logging}
                      onCheckedChange={(checked) => updateSecurityConfig({ audit_logging: checked })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Access Control</Label>
                      <p className="text-sm text-muted-foreground">Enforce role-based access control</p>
                    </div>
                    <Switch
                      checked={securityConfig.access_control}
                      onCheckedChange={(checked) => updateSecurityConfig({ access_control: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">API Key Rotation</Label>
                      <p className="text-sm text-muted-foreground">Automatically rotate API keys</p>
                    </div>
                    <Switch
                      checked={securityConfig.api_key_rotation}
                      onCheckedChange={(checked) => updateSecurityConfig({ api_key_rotation: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Security Score</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <div className="text-xs text-muted-foreground">Excellent security posture</div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Encrypted Secrets</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-xs text-muted-foreground">API keys secured</div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-sm">Audit Events</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">247</div>
                  <div className="text-xs text-muted-foreground">Events logged today</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="secrets" className="space-y-4">
          <SecretsManager />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </div>
                <Dialog open={showAddConfig} onOpenChange={setShowAddConfig}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Config
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Configuration Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Configuration Key</Label>
                        <Input
                          value={newConfigItem.key}
                          onChange={(e) => setNewConfigItem({ ...newConfigItem, key: e.target.value })}
                          placeholder="feature_flags"
                        />
                      </div>
                      <div>
                        <Label>Value (JSON)</Label>
                        <Input
                          value={newConfigItem.value}
                          onChange={(e) => setNewConfigItem({ ...newConfigItem, value: e.target.value })}
                          placeholder='{"enabled": true}'
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddConfig(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addConfigItem}>
                          Add Configuration
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {configItems.map((item) => (
                    <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className={`p-1 rounded ${getCategoryColor(item.category)}`}>
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{item.key}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          {item.is_sensitive && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Sensitive
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                        <div className="bg-muted p-2 rounded text-xs font-mono overflow-auto">
                          {item.is_sensitive ? '••••••••' : JSON.stringify(item.value, null, 2)}
                        </div>
                      </div>
                      {item.is_sensitive && (
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Audit & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card/50 rounded-lg p-3 border">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-sm text-muted-foreground">Audit Events Today</div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-3 border">
                    <div className="text-2xl font-bold">23</div>
                    <div className="text-sm text-muted-foreground">Admin Actions</div>
                  </div>
                  <div className="bg-card/50 rounded-lg p-3 border">
                    <div className="text-2xl font-bold">99.8%</div>
                    <div className="text-sm text-muted-foreground">Compliance Score</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Recent Audit Events</h4>
                  <div className="space-y-2">
                    {[
                      { action: 'Provider Added', user: 'admin@example.com', time: '2 minutes ago' },
                      { action: 'Secret Updated', user: 'admin@example.com', time: '5 minutes ago' },
                      { action: 'Security Config Changed', user: 'admin@example.com', time: '10 minutes ago' }
                    ].map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border">
                        <div>
                          <span className="font-medium text-sm">{event.action}</span>
                          <span className="text-xs text-muted-foreground ml-2">by {event.user}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                      </div>
                    ))}
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