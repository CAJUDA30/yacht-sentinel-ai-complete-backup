import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Save,
  TestTube,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Zap,
  Eye,
  Cpu,
  Globe,
  Brain
} from 'lucide-react';

interface AIModel {
  id?: string;
  name: string;
  provider: string;
  model: string;
  apiKey?: string;
  apiSecretName?: string;
  endpoint?: string;
  enabled: boolean;
  priority: number;
  maxTokens?: number;
  temperature?: number;
  capabilities: {
    reasoning: boolean;
    vision: boolean;
    function_calling: boolean;
    multimodal: boolean;
    realtime: boolean;
  };
  status?: 'active' | 'inactive' | 'error' | 'testing';
}

interface DiscoveredModel {
  id: string;
  name: string;
  capabilities: {
    reasoning: boolean;
    vision: boolean;
    function_calling: boolean;
    multimodal: boolean;
    realtime: boolean;
  };
  maxTokens: number;
  pricing?: { input: number; output: number };
}

interface AIModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  model?: AIModel;
  onSave: (model: AIModel) => Promise<void>;
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions' },
  { value: 'xai', label: 'xAI (Grok)', endpoint: 'https://api.x.ai/v1/chat/completions' },
  { value: 'deepseek', label: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions' },
  { value: 'google', label: 'Google (Gemini)', endpoint: 'https://generativelanguage.googleapis.com/v1/models' },
  { value: 'anthropic', label: 'Anthropic (Claude)', endpoint: 'https://api.anthropic.com/v1/messages' }
];

export const AIModelConfigModal: React.FC<AIModelConfigModalProps> = ({
  isOpen,
  onClose,
  model,
  onSave
}) => {
const [formData, setFormData] = useState<AIModel>({
  name: '',
  provider: '',
  model: '',
  apiKey: '',
  apiSecretName: '',
  endpoint: '',
  enabled: true,
  priority: 50,
  maxTokens: 4096,
  temperature: 0.7,
  capabilities: {
    reasoning: false,
    vision: false,
    function_calling: false,
    multimodal: false,
    realtime: false
  }
});

  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredModel[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData(model);
    } else {
      // Reset form for new model
setFormData({
  name: '',
  provider: '',
  model: '',
  apiKey: '',
  apiSecretName: '',
  endpoint: '',
  enabled: true,
  priority: 50,
  maxTokens: 4096,
  temperature: 0.7,
  capabilities: {
    reasoning: false,
    vision: false,
    function_calling: false,
    multimodal: false,
    realtime: false
  }
});
    }
    setDiscoveredModels([]);
    setTestResult(null);
  }, [model, isOpen]);

  const handleProviderChange = (provider: string) => {
    const providerConfig = PROVIDERS.find(p => p.value === provider);
    setFormData(prev => ({
      ...prev,
      provider,
      endpoint: providerConfig?.endpoint || '',
      model: '' // Reset model when provider changes
    }));
    setDiscoveredModels([]);
  };

  const discoverModels = async () => {
if (!formData.provider || (!formData.apiKey && !formData.apiSecretName)) {
  toast({
    title: "Missing Information",
    description: "Select a provider and enter a Supabase Secret Name or API key.",
    variant: "destructive"
  });
  return;
}

    setIsDiscovering(true);
    try {
const { data, error } = await supabase.functions.invoke('discover-ai-models', {
  body: {
    provider: formData.provider,
    apiKey: formData.apiKey || undefined,
    secretName: formData.apiSecretName || undefined,
  }
});

      if (error) throw error;

      if (data.success) {
        setDiscoveredModels(data.models);
        toast({
          title: "Models Discovered",
          description: `Found ${data.models.length} available models for ${formData.provider}`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Model discovery failed:', error);
      toast({
        title: "Discovery Failed",
        description: error.message || "Failed to discover models",
        variant: "destructive"
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const testConnection = async () => {
if (!formData.provider || !formData.model || (!formData.apiKey && !formData.apiSecretName)) {
  toast({
    title: "Missing Information",
    description: "Provide provider, model, and a Supabase Secret Name or API key.",
    variant: "destructive"
  });
  return;
}

    setIsTestingConnection(true);
    setTestResult(null);

    try {
const { data, error } = await supabase.functions.invoke('test-ai-model', {
  body: {
    model: {
      provider: formData.provider,
      model: formData.model,
      apiKey: formData.apiKey || undefined,
      secretName: formData.apiSecretName || undefined,
      endpoint: formData.endpoint
    },
    prompt: "Hello! Please respond with 'Connection successful' to confirm you're working correctly."
  }
});

      if (error) throw error;

      setTestResult({
        success: data.success,
        message: data.success ? data.response : data.error
      });

      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.success ? "Model is responding correctly" : data.error,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setTestResult({
        success: false,
        message: error.message || "Connection test failed"
      });
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.provider || !formData.model) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSaving(false);
    }
  };

  const selectDiscoveredModel = (discoveredModel: DiscoveredModel) => {
    setFormData(prev => ({
      ...prev,
      model: discoveredModel.id,
      name: discoveredModel.name,
      maxTokens: discoveredModel.maxTokens,
      capabilities: discoveredModel.capabilities
    }));
  };

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'reasoning': return <Brain className="w-3 h-3" />;
      case 'vision': return <Eye className="w-3 h-3" />;
      case 'function_calling': return <Cpu className="w-3 h-3" />;
      case 'multimodal': return <Globe className="w-3 h-3" />;
      case 'realtime': return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {model ? 'Edit AI Model' : 'Add New AI Model'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="models">Discover Models</TabsTrigger>
            <TabsTrigger value="test">Test Connection</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Model Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., GPT-4 Turbo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={formData.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model ID</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g., gpt-4.1-2025-04-14"
                />
              </div>

<div className="space-y-2">
  <Label htmlFor="apiSecretName">Supabase Secret Name</Label>
  <Input
    id="apiSecretName"
    value={formData.apiSecretName || ''}
    onChange={(e) => setFormData(prev => ({ ...prev, apiSecretName: e.target.value }))}
    placeholder="e.g., OPENAI_API_KEY"
  />
</div>

<div className="space-y-2">
  <Label htmlFor="apiKey">API Key (optional)</Label>
  <Input
    id="apiKey"
    type="password"
    value={formData.apiKey || ''}
    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
    placeholder="Enter API key (for testing)"
  />
</div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="endpoint">API Endpoint (Optional)</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="Custom endpoint URL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority (1-100)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 50 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (0-2)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enabled">Enable this model</Label>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Model Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(formData.capabilities).map(([capability, enabled]) => (
                  <div key={capability} className="flex items-center space-x-2">
                    <Switch
                      id={capability}
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({
                          ...prev,
                          capabilities: { ...prev.capabilities, [capability]: checked }
                        }))
                      }
                    />
                    <Label htmlFor={capability} className="flex items-center space-x-1">
                      {getCapabilityIcon(capability)}
                      <span className="capitalize">{capability.replace('_', ' ')}</span>
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Discover Available Models</h3>
                <p className="text-sm text-muted-foreground">
                  Fetch the latest models from your selected provider
                </p>
              </div>
              <Button 
onClick={discoverModels} 
                disabled={isDiscovering || !formData.provider || (!formData.apiSecretName && !formData.apiKey)}
              >
                {isDiscovering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Discover Models
                  </>
                )}
              </Button>
            </div>

            {discoveredModels.length > 0 && (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {discoveredModels.map((discoveredModel) => (
                  <Card 
                    key={discoveredModel.id} 
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      formData.model === discoveredModel.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => selectDiscoveredModel(discoveredModel)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{discoveredModel.name}</h4>
                          <p className="text-sm text-muted-foreground">{discoveredModel.id}</p>
                          <div className="flex gap-1 mt-1">
                            {Object.entries(discoveredModel.capabilities)
                              .filter(([_, enabled]) => enabled)
                              .map(([capability]) => (
                                <Badge key={capability} variant="secondary" className="text-xs">
                                  {getCapabilityIcon(capability)}
                                  <span className="ml-1 capitalize">{capability.replace('_', ' ')}</span>
                                </Badge>
                              ))
                            }
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Max: {discoveredModel.maxTokens} tokens</div>
                          {discoveredModel.pricing && (
                            <div>
                              ${discoveredModel.pricing.input}/${discoveredModel.pricing.output} per 1K tokens
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Test Connection</h3>
              <p className="text-sm text-muted-foreground">
                Verify that your model configuration is working correctly
              </p>
            </div>

            <Button 
onClick={testConnection}
              disabled={isTestingConnection || !formData.provider || !formData.model || (!formData.apiSecretName && !formData.apiKey)}
              className="w-full"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {testResult && (
              <Card className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Model
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};