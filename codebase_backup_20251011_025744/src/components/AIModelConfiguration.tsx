import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AIModelConfigModal } from './AIModelConfigModal';
import {
  Brain,
  Plus,
  Trash2,
  TestTube,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit3,
  Zap,
  Globe,
  Cpu,
  Eye
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
  lastTested?: string;
  status?: 'active' | 'inactive' | 'error' | 'testing';
}

interface TestResult {
  success: boolean;
  response?: string;
  error?: string;
  latency?: number;
  model: string;
}

export const AIModelConfiguration = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | undefined>(undefined);

  // Update model status after test - will be implemented once types are updated
  const updateModelStatus = async (modelId: string, status: string, errorMessage?: string) => {
    // TODO: Update model status in database once schema is updated
    console.log('Model test completed:', { modelId, status, errorMessage });
    // Refresh models list to show updated status
    loadModels();
  };

  // Helper function to determine API key source
  const getTestApiKey = (provider: string): string => {
    // In production, these are handled by the edge function with Supabase secrets
    // Return a placeholder to indicate key configuration is needed
    return `${provider.toUpperCase()}_API_KEY`;
  };

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const { data: dbModels, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error loading AI models:', error);
        return;
      }

      if (dbModels && dbModels.length > 0) {
        const convertedModels = dbModels.map(model => {
          const parameters = (model.parameters as Record<string, any>) || {};
          const capabilities = Array.isArray(model.capabilities) ? model.capabilities as string[] : [];
          
return {
  id: model.id,
  name: model.model_name,
  provider: model.provider,
  model: model.model_id,
  apiKey: '',
  apiSecretName: (model as any).api_secret_name || undefined,
  enabled: model.is_active,
  priority: model.priority,
  maxTokens: parameters.max_tokens || 4096,
  temperature: parameters.temperature || 0.7,
  capabilities: {
    reasoning: capabilities.includes('reasoning'),
    vision: capabilities.includes('vision'),
    function_calling: capabilities.includes('function_calling'),
    multimodal: capabilities.includes('multimodal'),
    realtime: capabilities.includes('realtime')
  },
  lastTested: undefined,
  status: model.is_active ? 'active' as const : 'inactive' as const,
  endpoint: model.api_endpoint
};
        }) as AIModel[];
        setModels(convertedModels);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI model configurations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (model?: AIModel) => {
    setEditingModel(model);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingModel(undefined);
  };

  const handleSaveModel = async (modelData: AIModel) => {
    try {
      if (editingModel?.id) {
const { error } = await supabase
  .from('ai_models')
  .update({
    model_name: modelData.name,
    provider: modelData.provider,
    model_id: modelData.model,
    api_endpoint: modelData.endpoint,
    api_secret_name: modelData.apiSecretName || null,
    is_active: modelData.enabled,
    priority: modelData.priority,
    parameters: {
      max_tokens: modelData.maxTokens,
      temperature: modelData.temperature
    },
    capabilities: Object.entries(modelData.capabilities)
      .filter(([_, enabled]) => enabled)
      .map(([capability]) => capability)
  })
  .eq('id', editingModel.id);

        if (error) throw error;
        toast({ title: "Model Updated", description: "AI model configuration updated successfully." });
      } else {
        const { error } = await supabase
          .from('ai_models')
          .insert({
            model_name: modelData.name,
            provider: modelData.provider,
            model_id: modelData.model,
            api_endpoint: modelData.endpoint,
            api_secret_name: modelData.apiSecretName || null,
            is_active: modelData.enabled,
            priority: modelData.priority,
            parameters: {
              max_tokens: modelData.maxTokens,
              temperature: modelData.temperature
            },
            capabilities: Object.entries(modelData.capabilities)
              .filter(([_, enabled]) => enabled)
              .map(([capability]) => capability)
          });

        if (error) throw error;
        toast({ title: "Model Added", description: "New AI model added successfully." });
      }
      loadModels(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save model configuration",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteModel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadModels();
      toast({ title: "Model Deleted", description: "AI model removed successfully." });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete model",
        variant: "destructive"
      });
    }
  };

  const testModel = async (model: AIModel) => {
    // API keys are resolved securely in the edge function via Supabase secrets
    setTestingModel(model.id || '');
    const startTime = Date.now();
    try {
const { data, error } = await supabase.functions.invoke('test-ai-model', {
  body: {
    model: {
      provider: model.provider,
      model: model.model,
      endpoint: model.endpoint,
      secretName: model.apiSecretName || undefined,
    },
    prompt: 'Are you connected to YachtExcel? Please respond with "Connection successful" to confirm.'
  }
});

      const latency = Date.now() - startTime;
      if (error) throw error;

      const result: TestResult = {
        success: true,
        response: data?.response || 'Test completed successfully',
        latency,
        model: model.name
      };

      setTestResults(prev => ({ ...prev, [model.id || '']: result }));
      toast({ title: 'Test Successful', description: `${model.name} responded in ${latency}ms` });
    } catch (error: any) {
      const result: TestResult = {
        success: false,
        error: error.message || 'Test failed',
        model: model.name
      };

      setTestResults(prev => ({ ...prev, [model.id || '']: result }));
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to test model',
        variant: 'destructive'
      });
    } finally {
      setTestingModel(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'testing': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'reasoning': return <Brain className="h-3 w-3" />;
      case 'vision': return <Eye className="h-3 w-3" />;
      case 'function_calling': return <Zap className="h-3 w-3" />;
      case 'multimodal': return <Cpu className="h-3 w-3" />;
      case 'realtime': return <Globe className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Model Configuration</h2>
          <p className="text-muted-foreground">
            Configure and test AI models for consensus processing
          </p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Model
        </Button>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(testingModel === model.id ? 'testing' : model.status || 'inactive')}
                      <div>
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {model.provider} • {model.model}
                        </p>
                      </div>
                      {model.enabled && <Badge variant="default">Enabled</Badge>}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => openModal(model)}
                       >
                         <Edit3 className="w-4 h-4 mr-1" />
                         Configure
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => testModel(model)}
                         disabled={testingModel === model.id}
                       >
                        {testingModel === model.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Model</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{model.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteModel(model.id!)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(model.capabilities)
                      .filter(([_, enabled]) => enabled)
                      .map(([capability]) => (
                        <Badge key={capability} variant="secondary" className="text-xs">
                          {getCapabilityIcon(capability)}
                          <span className="ml-1 capitalize">{capability.replace('_', ' ')}</span>
                        </Badge>
                      ))
                    }
                  </div>
                  
                  {testResults[model.id!] && (
                    <div className={`mt-3 p-3 rounded-lg border ${
                      testResults[model.id!].success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        {testResults[model.id!].success ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1 text-sm">
                          <div className="font-medium">
                            {testResults[model.id!].success ? 'Test Successful' : 'Test Failed'}
                            {testResults[model.id!].latency && ` (${testResults[model.id!].latency}ms)`}
                          </div>
                          <div className="text-muted-foreground mt-1">
                            {testResults[model.id!].success ? testResults[model.id!].response : testResults[model.id!].error}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {models.length === 0 && !loading && (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No AI models configured</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first AI model to start using consensus processing
                </p>
                <Button onClick={() => openModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Model
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {models.filter(model => model.enabled).map((model) => (
                  <div key={model.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">{model.provider}</div>
                    </div>
                     <Button
                       onClick={() => testModel(model)}
                       disabled={testingModel === model.id}
                     >
                      {testingModel === model.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      Test
                    </Button>
                  </div>
                ))}
                
                {models.filter(model => model.enabled).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No enabled models available for testing</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AIModelConfigModal
        isOpen={isModalOpen}
        onClose={closeModal}
        model={editingModel}
        onSave={handleSaveModel}
      />
    </div>
  );
};