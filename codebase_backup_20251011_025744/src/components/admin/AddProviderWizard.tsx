import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Check, AlertCircle, ExternalLink, Sparkles, Zap, Eye, Code2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PROVIDER_TEMPLATES, getAvailableTemplates } from '@/data/provider-templates';
import { ProviderTemplate, AIProvider, AIProviderConfig } from '@/types/ai-providers';

interface Props {
  open: boolean;
  onClose: () => void;
  onProviderAdded: () => void;
}

export const AddProviderWizard: React.FC<Props> = ({ open, onClose, onProviderAdded }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(null);
  const [providerData, setProviderData] = useState({
    name: '',
    base_url: '',
    secret_name: '',
    is_primary: false,
    config: {} as AIProviderConfig
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const templates = getAvailableTemplates();

  const handleTemplateSelect = (template: ProviderTemplate) => {
    setSelectedTemplate(template);
    setProviderData({
      name: template.name,
      base_url: template.base_url,
      secret_name: template.credentials_required[0]?.secret_name || '',
      is_primary: false,
      config: template.config as AIProviderConfig
    });
    setStep(2);
  };

  const handleConfigUpdate = (field: string, value: any) => {
    setProviderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigDeepUpdate = (path: string[], value: any) => {
    setProviderData(prev => {
      const newConfig = { ...prev.config };
      let current = newConfig as any;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      
      return { ...prev, config: newConfig };
    });
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('unified-ai-provider', {
        body: {
          action: 'test_provider',
          provider: {
            ...providerData,
            provider_type: selectedTemplate?.provider_type,
            capabilities: selectedTemplate?.capabilities || []
          }
        }
      });
      
      if (error) throw error;
      setTestResult(data);
      
      if (data.success) {
        toast({ 
          title: 'Connection successful!', 
          description: `Latency: ${data.latency_ms}ms` 
        });
      } else {
        toast({ 
          title: 'Connection failed', 
          description: data.error || 'Unknown error',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      setTestResult({ success: false, error: String(error) });
      toast({ 
        title: 'Test failed', 
        description: String(error),
        variant: 'destructive' 
      });
    } finally {
      setTesting(false);
    }
  };

  const discoverModels = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('unified-ai-provider', {
        body: {
          action: 'discover_models',
          provider: {
            ...providerData,
            provider_type: selectedTemplate?.provider_type,
            capabilities: selectedTemplate?.capabilities || []
          }
        }
      });
      
      if (error) throw error;
      
      toast({ 
        title: 'Models discovered', 
        description: `Found ${data.models_discovered} models` 
      });
      
      return data.models || [];
    } catch (error) {
      toast({ 
        title: 'Model discovery failed', 
        description: String(error),
        variant: 'destructive' 
      });
      return [];
    }
  };

  const createProvider = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('unified-ai-provider', {
        body: {
          action: 'create_provider',
          provider: {
            name: providerData.name,
            provider_type: selectedTemplate?.provider_type,
            base_url: providerData.base_url,
            auth_method: 'api_key',
            is_active: true,
            is_primary: providerData.is_primary,
            config: providerData.config,
            capabilities: selectedTemplate?.capabilities || [],
            supported_languages: ['en'],
            rate_limit_per_minute: 60,
            rate_limit_per_day: 10000,
            cost_tracking_enabled: true
          }
        }
      });
      
      if (error) throw error;
      
      toast({ 
        title: 'Provider created successfully!', 
        description: `${providerData.name} is now ready to use` 
      });
      
      onProviderAdded();
      onClose();
    } catch (error) {
      toast({ 
        title: 'Failed to create provider', 
        description: String(error),
        variant: 'destructive' 
      });
    }
  };

  const CapabilityBadge = ({ capability }: { capability: string }) => {
    const icons = {
      text_generation: <Sparkles className="w-3 h-3" />,
      vision: <Eye className="w-3 h-3" />,
      code_generation: <Code2 className="w-3 h-3" />,
      function_calling: <Zap className="w-3 h-3" />
    };

    return (
      <Badge variant="outline" className="gap-1">
        {icons[capability as keyof typeof icons]}
        {capability.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add AI Provider</DialogTitle>
        </DialogHeader>

        <Tabs value={`step-${step}`} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="step-1">Select Template</TabsTrigger>
            <TabsTrigger value="step-2" disabled={!selectedTemplate}>Configure</TabsTrigger>
            <TabsTrigger value="step-3" disabled={!selectedTemplate}>Test & Discover</TabsTrigger>
            <TabsTrigger value="step-4" disabled={!testResult?.success}>Review & Create</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="step-1" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.provider_type} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span>{template.name}</span>
                        <ChevronRight className="w-4 h-4" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.capabilities.slice(0, 4).map((cap) => (
                          <CapabilityBadge key={cap} capability={cap} />
                        ))}
                      </div>
                      {template.documentation_url && (
                        <a 
                          href={template.documentation_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Documentation <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="step-2" className="space-y-6">
              {selectedTemplate && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="provider-name">Provider Name</Label>
                        <Input
                          id="provider-name"
                          value={providerData.name}
                          onChange={(e) => handleConfigUpdate('name', e.target.value)}
                          placeholder="My OpenAI Provider"
                        />
                      </div>
                      <div>
                        <Label htmlFor="base-url">Base URL</Label>
                        <Input
                          id="base-url"
                          value={providerData.base_url}
                          onChange={(e) => handleConfigUpdate('base_url', e.target.value)}
                          placeholder="https://api.openai.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secret-name">Secret Name</Label>
                        <Input
                          id="secret-name"
                          value={providerData.secret_name}
                          onChange={(e) => handleConfigUpdate('secret_name', e.target.value)}
                          placeholder="OPENAI_API_KEY"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={providerData.is_primary}
                          onCheckedChange={(checked) => handleConfigUpdate('is_primary', checked)}
                        />
                        <Label>Set as primary provider</Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Chat Endpoint</Label>
                        <Input
                          value={providerData.config.endpoints?.chat || ''}
                          onChange={(e) => handleConfigDeepUpdate(['endpoints', 'chat'], e.target.value)}
                          placeholder="/v1/chat/completions"
                        />
                      </div>
                      <div>
                        <Label>Models Endpoint</Label>
                        <Input
                          value={providerData.config.endpoints?.models || ''}
                          onChange={(e) => handleConfigDeepUpdate(['endpoints', 'models'], e.target.value)}
                          placeholder="/v1/models"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setStep(3)}>
                      Next: Test Connection
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="step-3" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Button 
                      onClick={testConnection}
                      disabled={testing}
                    >
                      {testing ? 'Testing...' : 'Test Connection'}
                    </Button>
                    
                    {testResult && (
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Connected</span>
                            <Badge variant="outline">{testResult.latency_ms}ms</Badge>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">Failed</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {testResult?.success && (
                    <Button variant="outline" onClick={discoverModels}>
                      Discover Available Models
                    </Button>
                  )}

                  {testResult && !testResult.success && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                      <p className="text-sm text-destructive">
                        {testResult.error}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(4)}
                  disabled={!testResult?.success}
                >
                  Next: Review
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="step-4" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Create</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Provider Name</Label>
                      <p className="text-sm text-muted-foreground">{providerData.name}</p>
                    </div>
                    <div>
                      <Label>Base URL</Label>
                      <p className="text-sm text-muted-foreground">{providerData.base_url}</p>
                    </div>
                    <div>
                      <Label>Capabilities</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTemplate?.capabilities.map((cap) => (
                          <CapabilityBadge key={cap} capability={cap} />
                        ))}
                      </div>
                    </div>
                    {providerData.is_primary && (
                      <Badge variant="default">Primary Provider</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button onClick={createProvider}>
                  Create Provider
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};