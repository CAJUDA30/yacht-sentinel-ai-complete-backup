import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  PlugZap, 
  Settings2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Loader2,
  Brain,
  Camera,
  FileText,
  ScanLine,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ServiceConfigurationModal from './ServiceConfigurationModal';

interface AIProvider {
  id: string;
  name: string;
  base_url: string;
  is_active: boolean;
  secret_name: string | null;
  secret_configured: boolean;
  status: string;
  last_checked_at: string | null;
  models_count: number;
  models_endpoint: string | null;
  updated_at: string | null;
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

interface SecretStatus {
  name: string;
  configured: boolean;
  preview: string;
  last4: string;
  length: number;
}

const AI_SERVICES = [
  { 
    key: 'google_vision', 
    name: 'Google Vision OCR', 
    icon: Camera, 
    description: 'Text detection and document analysis',
    secretName: 'GOOGLE_VISION_API_KEY'
  },
  { 
    key: 'google_gemini', 
    name: 'Google Gemini', 
    icon: Brain, 
    description: 'Large language model for natural language processing',
    secretName: 'GEMINI_API_KEY'
  },
  { 
    key: 'openai_gpt', 
    name: 'OpenAI GPT', 
    icon: Brain, 
    description: 'GPT models for text generation and analysis',
    secretName: 'OPENAI_API_KEY'
  },
  { 
    key: 'universal_scan', 
    name: 'Universal SmartScan', 
    icon: ScanLine, 
    description: 'Multi-modal document processing and extraction',
    secretName: null
  },
  { 
    key: 'document_ai', 
    name: 'Document AI', 
    icon: FileText, 
    description: 'Specialized document understanding and parsing',
    secretName: null
  }
];

const STATUS_VARIANTS = {
  'healthy': 'default' as const,
  'connected': 'default' as const,
  'degraded': 'outline' as const,
  'warning': 'outline' as const,
  'error': 'destructive' as const,
  'down': 'destructive' as const,
  'unknown': 'secondary' as const,
};

const AIConfigurationManager: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [services, setServices] = useState<AIServiceConfig[]>([]);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [newLLM, setNewLLM] = useState({ providerName: "", baseUrl: "", modelListEndpoint: "", secretName: "", authType: "bearer" as "bearer" | "header" });
  const [creating, setCreating] = useState(false);
  const [testModels, setTestModels] = useState<Array<{ model_id: string; model_name?: string }>>([]);
  const [lastProviderId, setLastProviderId] = useState<string | null>(null);
const { toast } = useToast();

const [isConfigOpen, setIsConfigOpen] = useState(false);
const [selectedService, setSelectedService] = useState<typeof AI_SERVICES[number] | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load providers and configuration summary
      const [configRes, secretsRes] = await Promise.all([
        supabase.functions.invoke('ai-admin', { body: { action: 'get_config_summary' } }),
        supabase.functions.invoke('ai-admin', { body: { action: 'secrets_status' } })
      ]);

      if (!configRes.error && configRes.data) {
        setProviders(configRes.data.providers || []);
        // Convert configs to service format
        const serviceConfigs = AI_SERVICES.map(service => {
          const config = (configRes.data.configs || []).find((c: any) => 
            c.module === service.key || 
            (service.key === 'google_vision' && c.module === 'vision') ||
            (service.key === 'google_gemini' && c.module === 'gemini') ||
            (service.key === 'openai_gpt' && c.module === 'openai')
          );
          
          const provider = (configRes.data.providers || []).find((p: any) => p.id === config?.provider_id);
          
          return {
            id: config?.id || `${service.key}_default`,
            service: service.key,
            provider_id: config?.provider_id || null,
            model_id: config?.model_id || null,
            enabled: config?.active ?? false,
            config: config?.params || {},
            status: provider?.status || 'unknown',
            last_test: provider?.last_checked_at || null
          };
        });
        setServices(serviceConfigs);
      }

      if (!secretsRes.error && secretsRes.data) {
        setSecrets(secretsRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load AI configuration data:', error);
      toast({ 
        title: 'Load Error', 
        description: 'Failed to load AI configuration data', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  loadData();

  const channel = supabase
    .channel('ai-config-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_configs' }, () => {
      loadData();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_providers' }, () => {
      loadData();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_health' }, () => {
      loadData();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const validateNewLLM = (): boolean => {
    if (!newLLM.providerName.trim()) {
      toast({ title: 'Validation Error', description: 'Provider name is required', variant: 'destructive' });
      return false;
    }
    try {
      if (newLLM.baseUrl.trim()) new URL(newLLM.baseUrl.trim());
      if (newLLM.modelListEndpoint.trim()) new URL(newLLM.modelListEndpoint.trim());
    } catch (e) {
      toast({ title: 'Invalid URL', description: 'Please enter valid URLs', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleCreateLLM = async () => {
    if (!validateNewLLM()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-admin', {
        body: {
          action: 'create_provider',
          providerName: newLLM.providerName.trim(),
          baseUrl: newLLM.baseUrl.trim(),
          authType: newLLM.authType,
          modelListEndpoint: newLLM.modelListEndpoint.trim() || null,
          headersTemplate: { authHeaderName: 'Authorization' }
        }
      });
      if (error) throw error;
      const providerId = data?.providerId as string | undefined;
      if (!providerId) throw new Error('Failed to create provider');
      setLastProviderId(providerId);

      if (newLLM.secretName.trim()) {
        const credRes = await supabase.functions.invoke('ai-admin', {
          body: { action: 'update_credentials', providerId, secretName: newLLM.secretName.trim() }
        });
        if (credRes.error) throw credRes.error;
      }

      await loadData();
      toast({ title: 'Provider created', description: `${newLLM.providerName} added.` });
    } catch (e: any) {
      toast({ title: 'Create failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleTestLLM = async () => {
    try {
      const providerId = lastProviderId;
      if (!providerId) {
        await handleCreateLLM();
      }
      const pid = lastProviderId;
      if (!pid) return;
      const modelsRes = await supabase.functions.invoke('ai-admin', { body: { action: 'fetch_models', providerId: pid, forceRefresh: true } });
      if (modelsRes.error) throw modelsRes.error;
      const models = (modelsRes.data?.models || []) as Array<{ model_id: string; model_name?: string }>;
      setTestModels(models);

      const testRes = await supabase.functions.invoke('ai-admin', { body: { action: 'test_connection', providerId: pid } });
      if (testRes.error) throw testRes.error;
      const ok = !!testRes.data?.connected;
      toast({ title: ok ? 'Integration OK' : 'Integration Failed', description: ok ? 'Connection succeeded' : (testRes.data?.details || 'Failed'), variant: ok ? 'default' : 'destructive' });
    } catch (e: any) {
      toast({ title: 'Test failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    }
  };

  const toggleSecretReveal = async (secretName: string) => {
    const isRevealed = !!revealedSecrets[secretName];
    if (isRevealed) {
      setRevealedSecrets(prev => ({ ...prev, [secretName]: '' }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-admin', { 
        body: { action: 'reveal_secret', secretName, reveal: true } 
      });
      
      if (error) throw error;
      
      setRevealedSecrets(prev => ({ 
        ...prev, 
        [secretName]: data?.value || ''
      }));
    } catch (error) {
      toast({ 
        title: 'Reveal Error', 
        description: `Failed to reveal ${secretName}`, 
        variant: 'destructive' 
      });
    }
  };

  const testServiceConnection = async (serviceKey: string) => {
    setTesting(prev => ({ ...prev, [serviceKey]: true }));
    try {
      const service = services.find(s => s.service === serviceKey);
      if (!service?.provider_id) {
        toast({ title: 'Test Error', description: 'No provider configured for this service', variant: 'destructive' });
        return;
      }
      const def = AI_SERVICES.find(s => s.key === serviceKey);
      const needsSecret = !!def?.secretName;
      const secretOk = !needsSecret || !!secrets.find(sec => sec.name === def?.secretName && sec.configured);
      if (!secretOk) {
        toast({ title: 'API Key Missing', description: 'Please configure the required API key before testing.', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-admin', { 
        body: { action: 'test_connection', providerId: service.provider_id } 
      });
      if (error) throw error;

      if (data?.connected) {
        toast({ title: 'Connection Success', description: `${serviceKey} connected successfully (${data.latency}ms)` });
      } else {
        toast({ title: 'Connection Failed', description: data?.details || 'Connection test failed', variant: 'destructive' });
      }
      await loadData();
    } catch (error) {
      toast({ title: 'Test Error', description: `Failed to test ${serviceKey}`, variant: 'destructive' });
    } finally {
      setTesting(prev => ({ ...prev, [serviceKey]: false }));
    }
  };

  // Handlers for configuration modal and persistence
  const openConfigure = (serviceKey: string) => {
    const svc = AI_SERVICES.find(s => s.key === serviceKey) || null;
    setSelectedService(svc);
    setIsConfigOpen(true);
  };

  const handleSaveService = async (serviceKey: string, config: Partial<AIServiceConfig>) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-admin', {
        body: {
          action: 'update_service_config',
          serviceKey,
          enabled: config.enabled,
          provider_id: config.provider_id,
          model_id: config.model_id,
          config: config.config
        }
      });
      if (error) throw error;
      toast({
        title: 'Configuration Updated',
        description: `${serviceKey} configuration has been updated`
      });
      await loadData();
      setIsConfigOpen(false);
    } catch (e: any) {
      toast({
        title: 'Update Failed',
        description: e?.message ?? 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  const toggleServiceEnabled = async (serviceKey: string, enabled: boolean) => {
    try {
      const service = services.find(s => s.service === serviceKey);
      if (!service) return;

      const { error } = await supabase.functions.invoke('ai-admin', { 
        body: {
          action: 'update_service_config',
          serviceKey,
          enabled,
          provider_id: service.provider_id,
          model_id: service.model_id,
          config: service.config
        }
      });
      if (error) throw error;

      setServices(prev => prev.map(s =>
        s.service === serviceKey ? { ...s, enabled } : s
      ));

      toast({
        title: enabled ? 'Service Enabled' : 'Service Disabled',
        description: `${serviceKey} has been ${enabled ? 'enabled' : 'disabled'}`
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: 'Update Error',
        description: error?.message ?? `Failed to update ${serviceKey}`,
        variant: 'destructive'
      });
    }
  };

  const secretsByService = useMemo(() => {
    const map: Record<string, SecretStatus | undefined> = {};
    AI_SERVICES.forEach(service => {
      if (service.secretName) {
        map[service.key] = secrets.find(s => s.name === service.secretName);
      }
    });
    return map;
  }, [secrets]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading AI configuration...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Configuration Manager</h2>
                <p className="text-sm text-muted-foreground">
                  Centralized configuration for all AI services and models
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={loadData} disabled={loading} aria-label="Refresh AI configuration">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>AI Services</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center space-x-2">
            <PlugZap className="h-4 w-4" />
            <span>Providers</span>
          </TabsTrigger>
          <TabsTrigger value="secrets" className="flex items-center space-x-2">
            <Settings2 className="h-4 w-4" />
            <span>Secrets</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Services Tab */}
        <TabsContent value="services" className="space-y-4" role="region" aria-label="AI Services">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {AI_SERVICES.map((service) => {
              const config = services.find(s => s.service === service.key);
              const secret = secretsByService[service.key];
              const ServiceIcon = service.icon;
              
              return (
                <Card key={service.key} className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <ServiceIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={STATUS_VARIANTS[config?.status as keyof typeof STATUS_VARIANTS] || 'secondary'}>
                          {config?.status || 'Not Configured'}
                        </Badge>
                        <Switch
                          checked={config?.enabled || false}
                          onCheckedChange={(enabled) => toggleServiceEnabled(service.key, enabled)}
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Secret Status */}
                    {service.secretName && (
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {secret?.configured ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                          <span className="text-sm font-medium">API Key</span>
                          <Badge variant={secret?.configured ? 'default' : 'destructive'}>
                            {secret?.configured ? 'Configured' : 'Missing'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            readOnly
                            value={revealedSecrets[service.secretName] || secret?.preview || ''}
                            className="w-32 text-xs font-mono"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSecretReveal(service.secretName)}
                            disabled={!secret?.configured}
                          >
                            {revealedSecrets[service.secretName] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Configuration Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Provider</Label>
                        <p className="font-mono text-xs">
                          {config?.provider_id ? 
                            providers.find(p => p.id === config.provider_id)?.name || 'Unknown' : 
                            'Not Assigned'
                          }
                        </p>
                      </div>
                      <div>
                        <Label>Model</Label>
                        <p className="font-mono text-xs">{config?.model_id || 'Default'}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testServiceConnection(service.key)}
                          disabled={testing[service.key] || !config?.enabled}
                        >
                          {testing[service.key] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Activity className="h-4 w-4 mr-2" />
                          )}
                          Test Connection
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openConfigure(service.key)}>
                          <Settings2 className="h-4 w-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                      {config?.last_test && (
                        <p className="text-xs text-muted-foreground">
                          Last tested: {new Date(config.last_test).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Add New LLM Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="llm-name">Provider Name</Label>
                  <Input id="llm-name" value={newLLM.providerName} onChange={(e) => setNewLLM({ ...newLLM, providerName: e.target.value })} placeholder="e.g., Hugging Face Inference" />
                </div>
                <div>
                  <Label htmlFor="llm-secret">Secret Name</Label>
                  <Input id="llm-secret" value={newLLM.secretName} onChange={(e) => setNewLLM({ ...newLLM, secretName: e.target.value })} placeholder="e.g., HUGGINGFACE_API_KEY" />
                </div>
                <div>
                  <Label htmlFor="llm-base">Base URL</Label>
                  <Input id="llm-base" value={newLLM.baseUrl} onChange={(e) => setNewLLM({ ...newLLM, baseUrl: e.target.value })} placeholder="https://api.example.com" />
                </div>
                <div>
                  <Label htmlFor="llm-models">Models Endpoint</Label>
                  <Input id="llm-models" value={newLLM.modelListEndpoint} onChange={(e) => setNewLLM({ ...newLLM, modelListEndpoint: e.target.value })} placeholder="https://api.example.com/models" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleCreateLLM} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create & Save
                </Button>
                <Button variant="outline" onClick={handleTestLLM} disabled={creating}>Test Integration</Button>
              </div>
              {testModels.length > 0 && (
                <div className="text-sm text-muted-foreground">Discovered models: {testModels.length}</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{provider.name}</span>
                    <Badge variant={STATUS_VARIANTS[provider.status as keyof typeof STATUS_VARIANTS]}>
                      {provider.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <Label>Models</Label>
                      <p className="font-semibold">{provider.models_count}</p>
                    </div>
                    <div>
                      <Label>Active</Label>
                      <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                        {provider.is_active ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Secret Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={provider.secret_configured ? 'default' : 'destructive'}>
                        {provider.secret_configured ? 'Configured' : 'Missing'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {provider.secret_name || 'No secret required'}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    {provider.last_checked_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(provider.last_checked_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Secrets Tab */}
        <TabsContent value="secrets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {secrets.map((secret) => (
                    <div key={secret.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {secret.configured ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium">{secret.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {secret.configured ? `${secret.length} characters` : 'Not configured'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={secret.configured ? 'default' : 'destructive'}>
                          {secret.configured ? 'Active' : 'Missing'}
                        </Badge>
                        <Input
                          readOnly
                          value={revealedSecrets[secret.name] || secret.preview}
                          className="w-40 font-mono text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSecretReveal(secret.name)}
                          disabled={!secret.configured}
                        >
                          {revealedSecrets[secret.name] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.service} className="flex items-center justify-between">
                      <span className="text-sm">{service.service}</span>
                      <Badge variant={STATUS_VARIANTS[service.status as keyof typeof STATUS_VARIANTS]}>
                        {service.enabled ? service.status : 'Disabled'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PlugZap className="h-5 w-5 text-blue-500" />
                  <span>Provider Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providers.slice(0, 5).map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between">
                      <span className="text-sm">{provider.name}</span>
                      <Badge variant={STATUS_VARIANTS[provider.status as keyof typeof STATUS_VARIANTS]}>
                        {provider.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings2 className="h-5 w-5 text-purple-500" />
                  <span>Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Services Enabled</span>
                    <Badge variant="outline">
                      {services.filter(s => s.enabled).length}/{services.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Secrets Configured</span>
                    <Badge variant="outline">
                      {secrets.filter(s => s.configured).length}/{secrets.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Providers Active</span>
                    <Badge variant="outline">
                      {providers.filter(p => p.is_active).length}/{providers.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <ServiceConfigurationModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        service={selectedService}
        serviceConfig={selectedService ? (services.find(s => s.service === selectedService.key) || null) : null}
        providers={providers}
        onSave={handleSaveService}
        onTest={async (serviceKey) => { await testServiceConnection(serviceKey); }}
      />
    </div>
  );
};

export default AIConfigurationManager;