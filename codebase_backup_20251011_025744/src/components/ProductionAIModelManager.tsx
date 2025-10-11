import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AIModelConfigurationModal } from './AIModelConfigurationModal';
import {
  Brain, Plus, Settings, TestTube, Trash2, CheckCircle, AlertCircle, 
  Loader2, Edit3, Zap, Globe, Cpu, Eye, Server, Key, Plug, 
  Activity, Database, Shield, Clock, AlertTriangle, RefreshCw,
  Search, Download, Upload, MoreVertical
} from 'lucide-react';

// Type definitions matching actual database schema
interface AIProvider {
  id: string;
  name: string;
  base_url: string;
  auth_type: string;
  auth_header_name?: string;
  models_endpoint: string;
  request_format: any;
  response_format: any;
  supported_capabilities: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AIModel {
  id: string;
  provider: string;
  model_id: string;
  model_name: string;
  description?: string;
  capabilities: any;
  is_active: boolean;
  priority: number;
  parameters: any;
  api_endpoint?: string;
  last_tested_at?: string;
  connection_status?: string;
  last_error?: string;
  success_rate?: number;
  avg_latency_ms?: number;
  cost_per_token?: number;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  test_prompt: string;
  created_at: string;
  updated_at: string;
}

export const ProductionAIModelManager = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingModels, setTestingModels] = useState<Set<string>>(new Set());
  const [discoveringModels, setDiscoveringModels] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('models');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    await Promise.all([
      loadProviders(),
      loadModels()
    ]);
    setLoading(false);
  };

  const loadProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .order('name');

      if (error) throw error;
      
      if (data) {
        setProviders(data);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI providers',
        variant: 'destructive'
      });
    }
  };

  const loadModels = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;

      if (data) {
        setModels(data);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI models',
        variant: 'destructive'
      });
    }
  };

  const discoverModels = async (provider: AIProvider) => {
    setDiscoveringModels(prev => new Set(prev).add(provider.id));
    
    try {
      const { data, error } = await supabase.functions.invoke('discover-ai-models', {
        body: {
          provider: provider.name.toLowerCase(),
          baseUrl: provider.base_url,
          modelsEndpoint: provider.models_endpoint,
          requestFormat: provider.request_format
        }
      });

      if (error) throw error;

      if (data?.success && data.models) {
        // Save discovered models to database
        for (const model of data.models) {
          await saveDiscoveredModel(provider, model);
        }
        
        await loadModels();
        toast({
          title: 'Models Discovered',
          description: `Found ${data.models.length} models for ${provider.name}`
        });
      }
    } catch (error: any) {
      toast({
        title: 'Discovery Failed',
        description: error.message || 'Failed to discover models',
        variant: 'destructive'
      });
    } finally {
      setDiscoveringModels(prev => {
        const next = new Set(prev);
        next.delete(provider.id);
        return next;
      });
    }
  };

  const saveDiscoveredModel = async (provider: AIProvider, discoveredModel: any) => {
    try {
      const { error } = await supabase
        .from('ai_models')
        .upsert({
          provider: provider.id,
          model_id: discoveredModel.id,
          model_name: discoveredModel.name || discoveredModel.id,
          description: discoveredModel.description,
          capabilities: discoveredModel.capabilities || ['text'],
          is_active: false, // Start inactive until tested
          priority: 50,
          parameters: {
            max_tokens: 4096,
            temperature: 0.7
          },
          api_endpoint: `${provider.base_url}/chat/completions`
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save discovered model:', error);
    }
  };

  const testModelConnection = async (model: AIModel) => {
    setTestingModels(prev => new Set(prev).add(model.id));
    
    try {
      const provider = providers.find(p => p.id === model.provider);
      if (!provider) throw new Error('Provider not found');

      const { data, error } = await supabase.functions.invoke('test-ai-model', {
        body: {
          modelId: model.id,
          provider: provider.name.toLowerCase(),
          modelName: model.model_id,
          endpoint: model.api_endpoint || provider.base_url,
          prompt: 'Hello! Please respond briefly to confirm you are connected to YachtExcel.'
        }
      });

      if (error) throw error;

      // Update model status
      await updateModelStatus(model.id, 'connected', null, data?.latency);
      
      toast({
        title: 'Connection Successful',
        description: `${model.model_name} is working correctly`
      });

    } catch (error: any) {
      await updateModelStatus(model.id, 'error', error.message);
      
      toast({
        title: 'Connection Failed',
        description: error.message || 'Failed to connect to model',
        variant: 'destructive'
      });
    } finally {
      setTestingModels(prev => {
        const next = new Set(prev);
        next.delete(model.id);
        return next;
      });
    }
  };

  const updateModelStatus = async (modelId: string, status: string, error?: string, latency?: number) => {
    try {
      const updates: any = {
        connection_status: status,
        last_tested_at: new Date().toISOString()
      };

      if (error) updates.last_error = error;
      if (latency) updates.avg_latency_ms = latency;

      const { error: updateError } = await supabase
        .from('ai_models')
        .update(updates)
        .eq('id', modelId);

      if (updateError) throw updateError;
      
      await loadModels();
    } catch (error) {
      console.error('Failed to update model status:', error);
    }
  };

  const getStatusIcon = (status?: string, isLoading = false) => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'testing': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'text': return <Brain className="h-3 w-3" />;
      case 'vision': return <Eye className="h-3 w-3" />;
      case 'function_calling': return <Zap className="h-3 w-3" />;
      case 'multimodal': return <Cpu className="h-3 w-3" />;
      case 'audio': return <Globe className="h-3 w-3" />;
      default: return <Server className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading AI configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Production AI Model Manager
          </h2>
          <p className="text-muted-foreground">
            Configure, test, and monitor AI models with real-time connections
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsProviderModalOpen(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
          <Button onClick={() => setIsModelModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Models</p>
                <p className="text-2xl font-bold text-blue-600">
                  {models.filter(m => m.is_active && m.connection_status === 'connected').length}
                </p>
              </div>
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold text-green-600">
                  {models.filter(m => m.connection_status === 'connected').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold text-amber-600">
                  {Math.round(models.reduce((acc, m) => acc + (m.avg_latency_ms || 0), 0) / models.length || 0)}ms
                </p>
              </div>
              <Activity className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">
                  {models.filter(m => m.connection_status === 'error').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Models</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center space-x-2">
            <Server className="h-4 w-4" />
            <span>Providers</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4">
            {models.map(model => (
              <Card key={model.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(model.connection_status, testingModels.has(model.id))}
                        <div>
                          <h3 className="font-semibold">{model.model_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Provider: {providers.find(p => p.id === model.provider)?.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          {Array.isArray(model.capabilities) && model.capabilities.map((cap, idx) => (
                            <Badge key={idx} variant="secondary" className="flex items-center space-x-1">
                              {getCapabilityIcon(cap)}
                              <span className="text-xs">{cap}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {model.description && (
                        <p className="text-sm text-muted-foreground mt-2">{model.description}</p>
                      )}
                      
                      {model.last_error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-xs text-red-600">{model.last_error}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        {model.avg_latency_ms && (
                          <p className="text-muted-foreground">{model.avg_latency_ms}ms</p>
                        )}
                        {model.success_rate && (
                          <p className="text-muted-foreground">{model.success_rate}% success</p>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testModelConnection(model)}
                        disabled={testingModels.has(model.id)}
                      >
                        {testingModels.has(model.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedModel(model)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4">
            {providers.map(provider => (
              <Card key={provider.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Server className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-sm text-muted-foreground">{provider.base_url}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={provider.is_active ? "default" : "secondary"}>
                              {provider.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{provider.auth_type}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => discoverModels(provider)}
                        disabled={discoveringModels.has(provider.id)}
                      >
                        {discoveringModels.has(provider.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        Discover
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProvider(provider)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.filter(m => m.connection_status === 'connected').map(model => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{model.model_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {providers.find(p => p.id === model.provider)?.name}
                      </p>
                    </div>
                    <div className="flex space-x-6 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground">Latency</p>
                        <p className="font-medium">{model.avg_latency_ms || 0}ms</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium">{model.success_rate || 0}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Cost/Token</p>
                        <p className="font-medium">${model.cost_per_token || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Model Configuration Modal */}
      <AIModelConfigurationModal
        isOpen={isModelModalOpen || !!selectedModel}
        onClose={() => {
          setIsModelModalOpen(false);
          setSelectedModel(null);
        }}
        model={selectedModel}
        providers={providers}
        onSave={() => {
          loadModels();
          setIsModelModalOpen(false);
          setSelectedModel(null);
        }}
      />
    </div>
  );
};