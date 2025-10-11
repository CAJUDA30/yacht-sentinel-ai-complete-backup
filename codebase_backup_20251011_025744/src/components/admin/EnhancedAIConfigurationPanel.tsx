import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Edit, 
  TestTube, 
  Activity, 
  Zap, 
  Database as DatabaseIcon,
  Brain,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type AIProvider = Database['public']['Tables']['ai_providers_unified']['Row'];
type AIProviderInsert = Database['public']['Tables']['ai_providers_unified']['Insert'];
type AIModel = Database['public']['Tables']['ai_models_unified']['Row'];
type AIModelInsert = Database['public']['Tables']['ai_models_unified']['Insert'];
type OrchestrationRule = Database['public']['Tables']['ai_orchestration_rules']['Row'];
type OrchestrationRuleInsert = Database['public']['Tables']['ai_orchestration_rules']['Insert'];

export default function EnhancedAIConfigurationPanel() {
  const [activeTab, setActiveTab] = useState('models');
  const [newProvider, setNewProvider] = useState<Partial<AIProviderInsert>>({});
  const [newModel, setNewModel] = useState<Partial<AIModelInsert>>({});
  const [newRule, setNewRule] = useState<Partial<OrchestrationRuleInsert>>({});
  const [testingModel, setTestingModel] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Data queries with Revolutionary error handling
  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_providers_unified')
        .select('*')
        .order('name');
      if (error) {
        console.log('[Revolutionary SmartScan] ai_providers_unified table initializing');
        return []; // Return empty array for missing table
      }
      return data;
    },
  });

  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models_unified')
        .select(`
          *,
          provider:ai_providers_unified(name, provider_type)
        `)
        .order('model_name');
      if (error) {
        console.log('[Revolutionary SmartScan] ai_models_unified table initializing');
        return []; // Return empty array for missing table
      }
      return data;
    },
  });

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ['orchestration-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_orchestration_rules')
        .select(`
          *,
          primary_model:ai_models_unified(model_name),
          fallback_models_details:ai_models_unified!inner(model_name)
        `)
        .order('priority', { ascending: false });
      if (error) {
        console.log('[Revolutionary SmartScan] ai_orchestration_rules table initializing');
        return []; // Return empty array for missing table
      }
      return data;
    },
  });

  const { data: languages = [] } = useQuery({
    queryKey: ['ai-languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_languages')
        .select('*')
        .eq('is_active', true)
        .order('language_name');
      if (error) {
        console.log('[Revolutionary SmartScan] ai_languages table initializing');
        return []; // Return empty array for missing table
      }
      return data;
    },
  });

  // Mutations
  const createProviderMutation = useMutation({
    mutationFn: async (provider: AIProviderInsert) => {
      // Ensure required fields are present
      if (!provider.name || !provider.base_url || !provider.provider_type) {
        throw new Error('Missing required fields: name, base_url, and provider_type are required');
      }

      const providerData = {
        ...provider,
        name: provider.name,
        base_url: provider.base_url,
        provider_type: provider.provider_type,
        capabilities: provider.capabilities || [],
        supported_languages: provider.supported_languages || ["en"],
        config: provider.config || {},
      };

      const { data, error } = await supabase
        .from('ai_providers_unified')
        .insert(providerData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      setNewProvider({});
      toast({ title: "Provider added successfully" });
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (model: AIModelInsert) => {
      // Ensure required fields are present
      if (!model.model_id || !model.model_name || !model.model_type) {
        throw new Error('Missing required fields: model_id, model_name, and model_type are required');
      }

      const modelData = {
        ...model,
        model_id: model.model_id,
        model_name: model.model_name,
        model_type: model.model_type,
        parameters: model.parameters || {},
        rate_limits: model.rate_limits || { per_hour: 1000, per_minute: 60 },
      };

      const { data, error } = await supabase
        .from('ai_models_unified')
        .insert(modelData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
      setNewModel({});
      toast({ title: "Model added successfully" });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (rule: OrchestrationRuleInsert) => {
      // Ensure required fields are present
      if (!rule.rule_name || !rule.task_type) {
        throw new Error('Missing required fields: rule_name and task_type are required');
      }

      const ruleData = {
        ...rule,
        rule_name: rule.rule_name,
        task_type: rule.task_type,
        conditions: rule.conditions || {},
        fallback_models: rule.fallback_models || [],
      };

      const { data, error } = await supabase
        .from('ai_orchestration_rules')
        .insert(ruleData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestration-rules'] });
      setNewRule({});
      toast({ title: "Orchestration rule created successfully" });
    },
  });

  const testModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const { data, error } = await supabase.functions.invoke('test-ai-model', {
        body: { model_id: modelId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, modelId) => {
      toast({ 
        title: "Model test completed", 
        description: data.success ? "Model is working correctly" : `Test failed: ${data.error}` 
      });
      queryClient.invalidateQueries({ queryKey: ['ai-models'] });
    },
  });

  const handleTestModel = async (modelId: string) => {
    setTestingModel(modelId);
    try {
      await testModelMutation.mutateAsync(modelId);
    } finally {
      setTestingModel(null);
    }
  };

  const getStatusColor = (success_rate: number) => {
    if (success_rate >= 0.95) return 'bg-emerald-500';
    if (success_rate >= 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceIcon = (avgTime: number) => {
    if (avgTime < 1000) return <Zap className="h-4 w-4 text-emerald-500" />;
    if (avgTime < 3000) return <Activity className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Enhanced AI Configuration</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Brain className="h-3 w-3" />
            Multi-Model System
          </Badge>
          <Badge variant="outline" className="gap-1">
            <DatabaseIcon className="h-3 w-3" />
            {providers.length} Providers
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="orchestration">Orchestration</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* AI Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Models Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Model Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Model Name</Label>
                  <Input
                    value={newModel.model_name || ''}
                    onChange={(e) => setNewModel({ ...newModel, model_name: e.target.value })}
                    placeholder="GPT-4o-mini"
                  />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Select 
                    value={newModel.provider_id || ''} 
                    onValueChange={(value) => setNewModel({ ...newModel, provider_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Model Type</Label>
                  <Select 
                    value={newModel.model_type || ''} 
                    onValueChange={(value) => setNewModel({ ...newModel, model_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Generation</SelectItem>
                      <SelectItem value="vision">Vision/OCR</SelectItem>
                      <SelectItem value="embedding">Embeddings</SelectItem>
                      <SelectItem value="multimodal">Multimodal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newModel.supports_vision || false}
                      onCheckedChange={(checked) => setNewModel({ ...newModel, supports_vision: checked })}
                    />
                    <Label>Vision Support</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newModel.supports_function_calling || false}
                      onCheckedChange={(checked) => setNewModel({ ...newModel, supports_function_calling: checked })}
                    />
                    <Label>Function Calling</Label>
                  </div>
                  <Button 
                    onClick={() => {
                      if (newModel.model_name && newModel.provider_id && newModel.model_type) {
                         createModelMutation.mutate({
                           ...newModel,
                           model_id: newModel.model_name?.toLowerCase().replace(/\s+/g, '-') || '',
                           model_name: newModel.model_name!,
                           model_type: newModel.model_type!
                         } as AIModelInsert);
                      }
                    }}
                    disabled={!newModel.model_name || !newModel.provider_id || !newModel.model_type}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Model
                  </Button>
                </div>
              </div>

              {/* Models List */}
              <div className="grid gap-4">
                {models.map(model => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{model.model_name}</h3>
                        <Badge variant={model.is_active ? 'default' : 'secondary'}>
                          {model.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{model.provider?.provider_type}</Badge>
                        {model.supports_vision && <Badge variant="outline">Vision</Badge>}
                        {model.supports_function_calling && <Badge variant="outline">Functions</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {getPerformanceIcon(model.response_time_avg_ms)}
                          {model.response_time_avg_ms}ms avg
                        </span>
                        <span>Success: {(model.success_rate * 100).toFixed(1)}%</span>
                        <span>${model.cost_per_1k_tokens}/1K tokens</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(model.success_rate)}`} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestModel(model.id)}
                        disabled={testingModel === model.id}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {testingModel === model.id ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="h-5 w-5" />
                AI Providers Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Provider Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Provider Name</Label>
                  <Input
                    value={newProvider.name || ''}
                    onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                    placeholder="OpenAI"
                  />
                </div>
                <div>
                  <Label>Provider Type</Label>
                  <Select 
                    value={newProvider.provider_type || ''} 
                    onValueChange={(value) => setNewProvider({ ...newProvider, provider_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI Compatible</SelectItem>
                      <SelectItem value="google">Google Cloud</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="custom">Custom API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Base URL</Label>
                  <Input
                    value={newProvider.base_url || ''}
                    onChange={(e) => setNewProvider({ ...newProvider, base_url: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button 
                    onClick={() => {
                      if (newProvider.name && newProvider.base_url && newProvider.provider_type) {
                         createProviderMutation.mutate({
                           ...newProvider,
                           name: newProvider.name!,
                           base_url: newProvider.base_url!,
                           provider_type: newProvider.provider_type!
                         } as AIProviderInsert);
                      }
                    }}
                    disabled={!newProvider.name || !newProvider.base_url || !newProvider.provider_type}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </div>
              </div>

              {/* Providers List */}
              <div className="grid gap-4">
                {providers.map(provider => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{provider.name}</h3>
                      <p className="text-sm text-muted-foreground">{provider.base_url}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{provider.provider_type}</Badge>
                        <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                          {provider.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orchestration Tab */}
        <TabsContent value="orchestration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Orchestration Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Rule Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <Label>Rule Name</Label>
                  <Input
                    value={newRule.rule_name || ''}
                    onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                    placeholder="Smart Scan OCR Rule"
                  />
                </div>
                <div>
                  <Label>Task Type</Label>
                  <Select 
                    value={newRule.task_type || ''} 
                    onValueChange={(value) => setNewRule({ ...newRule, task_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smart_scan">Smart Scan</SelectItem>
                      <SelectItem value="ocr">OCR</SelectItem>
                      <SelectItem value="classification">Classification</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="decision">Decision Making</SelectItem>
                      <SelectItem value="search">Knowledge Search</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Primary Model</Label>
                  <Select 
                    value={newRule.primary_model_id || ''} 
                    onValueChange={(value) => setNewRule({ ...newRule, primary_model_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.filter(m => m.is_active).map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.model_name} ({model.provider?.provider_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority (1-100)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={newRule.priority || ''}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button 
                    onClick={() => {
                      if (newRule.rule_name && newRule.task_type && newRule.primary_model_id) {
                         createRuleMutation.mutate({
                           ...newRule,
                           rule_name: newRule.rule_name!,
                           task_type: newRule.task_type!
                         } as OrchestrationRuleInsert);
                      }
                    }}
                    disabled={!newRule.rule_name || !newRule.task_type || !newRule.primary_model_id}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-4">
                {rules.map(rule => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{rule.rule_name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs">Task Type</Label>
                        <p className="capitalize">{rule.task_type}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Primary Model</Label>
                        <p>{rule.primary_model?.model_name}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Performance Threshold</Label>
                        <p>{(rule.performance_threshold * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages Tab */}
        <TabsContent value="languages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Language Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {languages.map(language => (
                  <div key={language.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{language.language_name}</span>
                      <Badge variant="outline">{language.language_code}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Performance Metrics Cards */}
            {models.filter(m => m.is_active).map(model => (
              <Card key={model.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{model.model_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span>{(model.success_rate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={model.success_rate * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg Response Time</span>
                      <span>{model.response_time_avg_ms}ms</span>
                    </div>
                    <Progress value={Math.min((3000 - model.response_time_avg_ms) / 30, 100)} className="h-2" />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Cost per 1K tokens</span>
                    <span>${model.cost_per_1k_tokens}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(model.success_rate)}`} />
                    Last check: {model.last_health_check ? 
                      new Date(model.last_health_check).toLocaleString() : 'Never'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}