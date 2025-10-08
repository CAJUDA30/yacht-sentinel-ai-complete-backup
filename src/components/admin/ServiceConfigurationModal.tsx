import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings2,
  Activity,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  TestTube,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIProvider {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
  secret_name: string | null;
  secret_configured: boolean;
  status: string;
  models_count: number;
}

interface AIServiceConfig {
  id: string;
  service: string;
  provider_id: string | null;
  model_id: string | null;
  enabled: boolean;
  config: any;
  status: string;
  last_test: string | null;
}

interface ServiceConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    key: string;
    name: string;
    icon: React.ComponentType<any>;
    description: string;
    secretName?: string;
  } | null;
  serviceConfig: AIServiceConfig | null;
  providers: AIProvider[];
  onSave: (serviceKey: string, config: Partial<AIServiceConfig>) => Promise<void>;
  onTest: (serviceKey: string) => Promise<void>;
}

export const ServiceConfigurationModal: React.FC<ServiceConfigurationModalProps> = ({
  isOpen,
  onClose,
  service,
  serviceConfig,
  providers,
  onSave,
  onTest,
}) => {
  const [config, setConfig] = useState<Partial<AIServiceConfig>>({});
  const [secretValue, setSecretValue] = useState('');
  const [revealSecret, setRevealSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();
  const [models, setModels] = useState<Array<{ model_id: string; model_name?: string }>>([]);

  useEffect(() => {
    if (serviceConfig) {
      setConfig({
        enabled: serviceConfig.enabled,
        provider_id: serviceConfig.provider_id,
        model_id: serviceConfig.model_id,
        config: serviceConfig.config || {},
      });
    } else {
      setConfig({
        enabled: false,
        provider_id: null,
        model_id: null,
        config: {},
      });
    }
    setSecretValue('');
    setRevealSecret(false);
  }, [serviceConfig, isOpen]);

  const handleSave = async () => {
    if (!service) return;

    setSaving(true);
    try {
      await onSave(service.key, config);
      onClose();
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!service) return;

    setTesting(true);
    try {
      await onTest(service.key);
    } finally {
      setTesting(false);
    }
  };

  const loadSecret = async () => {
    if (!service?.secretName) return;

    try {
      const { data, error } = await supabase.functions.invoke('ai-admin', {
        body: { action: 'reveal_secret', secretName: service.secretName, reveal: true }
      });

      if (error) throw error;
      setSecretValue(data?.value || '');
    } catch (error) {
      toast({
        title: 'Failed to load secret',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const selectedProvider = providers.find(p => p.id === config.provider_id);
  const ServiceIcon = service?.icon;

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {ServiceIcon && (
              <div className="p-2 bg-muted rounded-lg">
                <ServiceIcon className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">{service.name} Configuration</h3>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="provider">Provider</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] w-full">
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Service Settings</span>
                    <Switch
                      checked={config.enabled || false}
                      onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Service Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={config.enabled ? 'default' : 'secondary'}>
                          {config.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {serviceConfig?.status && (
                          <Badge variant="outline">{serviceConfig.status}</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Last Test</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {serviceConfig?.last_test
                          ? new Date(serviceConfig.last_test).toLocaleString()
                          : 'Never tested'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>Configuration Parameters</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(config.config || {}).length > 0 ? (
                        Object.entries(config.config || {}).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="font-mono text-sm">{key}</span>
                            <Input
                              value={String(value)}
                              onChange={(e) => setConfig({
                                ...config,
                                config: { ...config.config, [key]: e.target.value }
                              })}
                              className="w-48"
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No custom parameters configured</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="provider" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Provider Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>AI Provider</Label>
                    <Select
                      value={config.provider_id || ''}
                      onValueChange={(value) => setConfig({ ...config, provider_id: value || null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{provider.name}</span>
                              <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                                {provider.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProvider && (
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Provider Details</span>
                        <Badge variant={selectedProvider.secret_configured ? 'default' : 'destructive'}>
                          {selectedProvider.secret_configured ? 'Configured' : 'Missing Secret'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <Label>Base URL</Label>
                          <p className="font-mono text-xs">{selectedProvider.base_url}</p>
                        </div>
                        <div>
                          <Label>Models Available</Label>
                          <p>{selectedProvider.models_count}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Model ID</Label>
                    <Input
                      value={config.model_id || ''}
                      onChange={(e) => setConfig({ ...config, model_id: e.target.value || null })}
                      placeholder="default, gpt-4, etc."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings2 className="h-5 w-5" />
                    <span>API Key Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {service.secretName ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Secret Name</Label>
                          <p className="font-mono text-sm">{service.secretName}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (revealSecret) {
                              setRevealSecret(false);
                              setSecretValue('');
                            } else {
                              loadSecret();
                              setRevealSecret(true);
                            }
                          }}
                        >
                          {revealSecret ? (
                            <><EyeOff className="h-4 w-4 mr-2" />Hide</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-2" />Reveal</>
                          )}
                        </Button>
                      </div>

                      {revealSecret && (
                        <div>
                          <Label>Current Value</Label>
                          <Input
                            readOnly
                            value={secretValue}
                            className="font-mono"
                            type="password"
                          />
                        </div>
                      )}

                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-800 dark:text-amber-200">Security Notice</p>
                            <p className="text-amber-700 dark:text-amber-300">
                              API keys are stored securely in Supabase Edge Function secrets. 
                              Changes to secrets require redeployment of edge functions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="font-medium">No API Key Required</p>
                      <p className="text-sm text-muted-foreground">
                        This service doesn't require external API authentication.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TestTube className="h-5 w-5" />
                    <span>Connection Testing</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Test Service Connection</p>
                      <p className="text-sm text-muted-foreground">
                        Verify that the service is properly configured and accessible
                      </p>
                    </div>
                    <Button
                      onClick={handleTest}
                      disabled={testing || !config.enabled}
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Activity className="h-4 w-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <Label>Test Requirements</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        {config.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-sm">Service enabled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {config.provider_id ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-sm">Provider assigned</span>
                      </div>
                      {service.secretName && (
                        <div className="flex items-center space-x-2">
                          {selectedProvider?.secret_configured ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          <span className="text-sm">API key configured</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {serviceConfig?.last_test && (
                    <div className="p-3 bg-muted rounded-lg">
                      <Label>Last Test Result</Label>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm">
                          {new Date(serviceConfig.last_test).toLocaleString()}
                        </span>
                        <Badge variant={serviceConfig.status === 'healthy' ? 'default' : 'destructive'}>
                          {serviceConfig.status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleTest}
              variant="outline"
              disabled={testing || !config.enabled}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceConfigurationModal;