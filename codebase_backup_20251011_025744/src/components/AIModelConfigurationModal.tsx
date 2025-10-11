import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, TestTube, Eye, EyeOff, Settings, Zap } from 'lucide-react';

interface AIProvider {
  id: string;
  name: string;
  base_url: string;
  auth_type: string;
  auth_header_name?: string;
  models_endpoint: string;
  discovery_url?: string;
  test_endpoint?: string;
  request_format: any;
  response_format: any;
  supported_capabilities: string[];
  is_active: boolean;
}

interface AIModel {
  id?: string;
  provider: string;
  model_id: string;
  model_name: string;
  description?: string;
  capabilities: string[];
  is_active: boolean;
  priority: number;
  parameters: any;
  api_endpoint?: string;
  last_tested_at?: string;
  connection_status?: string;
  last_error?: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  test_prompt: string;
}

interface AIModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  model?: AIModel | null;
  providers: AIProvider[];
  onSave: () => void;
}

export const AIModelConfigurationModal: React.FC<AIModelConfigModalProps> = ({
  isOpen,
  onClose,
  model,
  providers,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<AIModel>>({
    provider: '',
    model_id: '',
    model_name: '',
    description: '',
    capabilities: [],
    is_active: true,
    priority: 50,
    temperature: 0.7,
    max_tokens: 4096,
    system_prompt: 'You are a helpful AI assistant for yacht management.',
    test_prompt: 'Hello! Please respond briefly to confirm you are connected to YachtExcel.',
    parameters: {}
  });
  
  const [availableModels, setAvailableModels] = useState<Array<{id: string; name: string; description?: string}>>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (model) {
      setFormData({
        ...model,
        capabilities: Array.isArray(model.capabilities) ? model.capabilities : []
      });
    } else {
      setFormData({
        provider: '',
        model_id: '',
        model_name: '',
        description: '',
        capabilities: [],
        is_active: true,
        priority: 50,
        temperature: 0.7,
        max_tokens: 4096,
        system_prompt: 'You are a helpful AI assistant for yacht management.',
        test_prompt: 'Hello! Please respond briefly to confirm you are connected to YachtExcel.',
        parameters: {}
      });
    }
  }, [model]);

  const selectedProvider = providers.find(p => p.id === formData.provider);

  const discoverModels = async () => {
    if (!selectedProvider || !apiKey) {
      toast({
        title: 'Error',
        description: 'Please select a provider and enter an API key',
        variant: 'destructive'
      });
      return;
    }

    setLoadingModels(true);
    try {
      const { data, error } = await supabase.functions.invoke('discover-ai-models', {
        body: {
          provider: selectedProvider.name.toLowerCase(),
          apiKey: apiKey
        }
      });

      if (error) throw error;

      if (data?.success && data.models) {
        setAvailableModels(data.models);
        toast({
          title: 'Models Discovered',
          description: `Found ${data.models.length} models for ${selectedProvider.name}`
        });
      }
    } catch (error: any) {
      toast({
        title: 'Discovery Failed',
        description: error.message || 'Failed to discover models',
        variant: 'destructive'
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const testConnection = async () => {
    if (!formData.model_id || !selectedProvider || !apiKey) {
      toast({
        title: 'Error',
        description: 'Please select a model and enter an API key',
        variant: 'destructive'
      });
      return;
    }

    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-ai-model', {
        body: {
          model: {
            provider: selectedProvider.name.toLowerCase(),
            model_name: formData.model_id,
            endpoint: selectedProvider.test_endpoint
          },
          apiKey: apiKey,
          prompt: formData.test_prompt || 'Hello! Please respond briefly to confirm you are connected to YachtExcel.'
        }
      });

      if (error) throw error;

      toast({
        title: 'Connection Successful',
        description: `${formData.model_name || formData.model_id} is working correctly`
      });

      // Update form data with successful connection
      setFormData(prev => ({
        ...prev,
        connection_status: 'connected',
        last_tested_at: new Date().toISOString(),
        last_error: undefined
      }));

    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to model',
        variant: 'destructive'
      });

      setFormData(prev => ({
        ...prev,
        connection_status: 'error',
        last_error: error.message
      }));
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!formData.provider || !formData.model_id || !formData.model_name) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const modelData = {
        provider: formData.provider,
        model_id: formData.model_id,
        model_name: formData.model_name,
        description: formData.description || null,
        capabilities: formData.capabilities || [],
        is_active: formData.is_active ?? true,
        priority: formData.priority ?? 50,
        temperature: formData.temperature ?? 0.7,
        max_tokens: formData.max_tokens ?? 4096,
        system_prompt: formData.system_prompt || 'You are a helpful AI assistant for yacht management.',
        test_prompt: formData.test_prompt || 'Hello! Please respond briefly to confirm you are connected to YachtExcel.',
        api_endpoint: selectedProvider?.test_endpoint || selectedProvider?.base_url,
        connection_status: formData.connection_status || 'unknown',
        last_error: formData.last_error || null,
        last_tested_at: formData.last_tested_at || null,
        parameters: {
          temperature: formData.temperature,
          max_tokens: formData.max_tokens,
          system_prompt: formData.system_prompt,
          test_prompt: formData.test_prompt,
          ...formData.parameters
        }
      };

      let result;
      if (model?.id) {
        result = await supabase
          .from('ai_models')
          .update(modelData)
          .eq('id', model.id);
      } else {
        result = await supabase
          .from('ai_models')
          .insert(modelData);
      }

      if (result.error) throw result.error;

      toast({
        title: 'Success',
        description: model ? 'Model updated successfully' : 'Model created successfully'
      });

      onSave();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save model',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModelSelect = (modelId: string) => {
    const selectedModel = availableModels.find(m => m.id === modelId);
    if (selectedModel) {
      setFormData(prev => ({
        ...prev,
        model_id: selectedModel.id,
        model_name: selectedModel.name,
        description: selectedModel.description
      }));
    }
  };

  const availableCapabilities = ['text', 'vision', 'function_calling', 'reasoning', 'multimodal', 'audio', 'coding'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {model ? 'Edit AI Model' : 'Add AI Model'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
                <CardDescription>Set up the fundamental model settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider *</Label>
                    <Select value={formData.provider} onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.filter(p => p.is_active).map(provider => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[formData.priority || 50]}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value[0] }))}
                        max={100}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">{formData.priority}</span>
                    </div>
                  </div>
                </div>

                {selectedProvider && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key *</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your API key"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={discoverModels}
                          disabled={loadingModels || !apiKey}
                        >
                          {loadingModels ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                          Discover Models
                        </Button>
                      </div>
                    </div>

                    {availableModels.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="available-models">Available Models</Label>
                        <Select value={formData.model_id} onValueChange={handleModelSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableModels.map(model => (
                              <SelectItem key={model.id} value={model.id}>
                                <div>
                                  <div className="font-medium">{model.name}</div>
                                  {model.description && (
                                    <div className="text-sm text-muted-foreground">{model.description}</div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-id">Model ID *</Label>
                    <Input
                      id="model-id"
                      value={formData.model_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, model_id: e.target.value }))}
                      placeholder="e.g., gpt-4o, claude-3-sonnet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model-name">Display Name *</Label>
                    <Input
                      id="model-name"
                      value={formData.model_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
                      placeholder="e.g., GPT-4 Optimized"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this model's strengths and use cases"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Capabilities</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableCapabilities.map(capability => (
                      <Badge
                        key={capability}
                        variant={formData.capabilities?.includes(capability) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const capabilities = formData.capabilities || [];
                          const updated = capabilities.includes(capability)
                            ? capabilities.filter(c => c !== capability)
                            : [...capabilities, capability];
                          setFormData(prev => ({ ...prev, capabilities: updated }));
                        }}
                      >
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Parameters</CardTitle>
                <CardDescription>Configure how the model behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[formData.temperature || 0.7]}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, temperature: value[0] }))}
                        max={2}
                        min={0}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12">{formData.temperature}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Controls randomness. Lower = more focused, Higher = more creative</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      value={formData.max_tokens || 4096}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                      min={1}
                      max={32000}
                    />
                    <p className="text-xs text-muted-foreground">Maximum length of the response</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    id="system-prompt"
                    value={formData.system_prompt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                    placeholder="You are a helpful AI assistant for yacht management..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Instructions that define the model's role and behavior</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connection Testing</CardTitle>
                <CardDescription>Test your model configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-prompt">Test Prompt</Label>
                  <Textarea
                    id="test-prompt"
                    value={formData.test_prompt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, test_prompt: e.target.value }))}
                    placeholder="Hello! Please respond briefly to confirm you are connected to YachtExcel."
                    rows={3}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    onClick={testConnection}
                    disabled={testingConnection || !formData.model_id || !apiKey}
                    className="w-full"
                  >
                    {testingConnection ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>

                {formData.connection_status && (
                  <div className={`p-3 rounded-lg ${
                    formData.connection_status === 'connected' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      formData.connection_status === 'connected' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Status: {formData.connection_status === 'connected' ? 'Connected' : 'Connection Failed'}
                    </p>
                    {formData.last_error && (
                      <p className="text-sm text-red-600 mt-1">{formData.last_error}</p>
                    )}
                    {formData.last_tested_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last tested: {new Date(formData.last_tested_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Additional configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">Custom API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    value={formData.api_endpoint || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                    placeholder="Override default endpoint (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Model Information</Label>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Provider:</strong> {selectedProvider?.name || 'Not selected'}</p>
                    <p><strong>Base URL:</strong> {selectedProvider?.base_url || 'N/A'}</p>
                    <p><strong>Auth Type:</strong> {selectedProvider?.auth_type || 'N/A'}</p>
                    <p><strong>Supported Capabilities:</strong> {selectedProvider?.supported_capabilities?.join(', ') || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {model ? 'Update' : 'Create'} Model
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};