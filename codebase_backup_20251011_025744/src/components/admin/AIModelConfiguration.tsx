import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Cpu, 
  Settings, 
  TrendingUp, 
  Target,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Zap,
  Clock,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAIProviderManagement } from '@/hooks/useAIProviderManagement';

interface Model {
  id: string;
  provider_id: string;
  model_id: string;
  model_name: string;
  model_type: string;
  priority: number;
  is_active: boolean;
  max_context_length: number;
  cost_per_1k_tokens: number;
  supports_vision: boolean;
  supports_function_calling: boolean;
  parameters: any;
  rate_limits: any;
  specialization: string[];
  response_time_avg_ms: number;
  success_rate: number;
  provider_name?: string;
}

export const AIModelConfiguration: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [activeTab, setActiveTab] = useState('registry');
  const { toast } = useToast();
  const { models: providerModels } = useAIProviderManagement();

  const loadModels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_models_unified')
        .select(`
          *,
          ai_providers_unified!inner(name)
        `)
        .order('priority', { ascending: false });

      if (error) {
        console.log('[Revolutionary SmartScan] ai_models_unified table initializing - using default models');
        setModels([]);
        setLoading(false);
        return;
      }

      const modelsWithProvider = (data || []).map(model => ({
        ...model,
        provider_name: (model as any).ai_providers_unified?.name
      }));

      setModels(modelsWithProvider);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast({
        title: 'Failed to load models',
        description: 'Unable to fetch model configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateModelConfig = async (modelId: string, updates: Partial<Model>) => {
    try {
      const model = models.find(m => m.id === modelId);
      const { error } = await supabase
        .from('ai_models_unified')
        .update(updates)
        .eq('id', modelId);

      if (error) throw error;

      // Log audit event
      await supabase.from('analytics_events').insert({
        event_type: 'ai_model_config_update',
        event_message: `Updated configuration for model ${model?.model_name}`,
        module: 'ai-models',
        severity: 'info',
        user_id: (await supabase.auth.getUser()).data.user?.id,
        metadata: { 
          model_id: modelId, 
          model_name: model?.model_name,
          updates: updates 
        }
      });

      toast({
        title: 'Model updated',
        description: 'Configuration saved successfully'
      });

      // Invalidate cache and reload
      if (providerModels?.refetch) {
        providerModels.refetch();
      }
      loadModels();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Unable to update model',
        variant: 'destructive'
      });
    }
  };

  const ModelCard = ({ model }: { model: Model }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{model.model_name}</CardTitle>
            <p className="text-xs text-muted-foreground">{model.provider_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={model.is_active ? 'default' : 'secondary'}>
              {model.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Priority: {model.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{model.response_time_avg_ms}ms avg</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>{(model.success_rate * 100).toFixed(1)}% success</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>${model.cost_per_1k_tokens}/1k tokens</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span>{model.max_context_length.toLocaleString()} context</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {model.supports_vision && (
            <Badge variant="outline" className="text-xs">Vision</Badge>
          )}
          {model.supports_function_calling && (
            <Badge variant="outline" className="text-xs">Functions</Badge>
          )}
          {model.specialization?.slice(0, 2).map(spec => (
            <Badge key={spec} variant="outline" className="text-xs">{spec}</Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Switch
            checked={model.is_active}
            onCheckedChange={(checked) => updateModelConfig(model.id, { is_active: checked })}
          />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedModel(model);
                setShowModelConfig(true);
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ModelConfigDialog = () => {
    if (!selectedModel) return null;

    const [config, setConfig] = useState({
      priority: selectedModel.priority,
      parameters: selectedModel.parameters || {},
      rate_limits: selectedModel.rate_limits || { per_minute: 60, per_hour: 1000 }
    });

    const handleSave = () => {
      updateModelConfig(selectedModel.id, config);
      setShowModelConfig(false);
      setSelectedModel(null);
    };

    return (
      <Dialog open={showModelConfig} onOpenChange={setShowModelConfig}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure {selectedModel.model_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Priority (1-100)</Label>
              <Slider
                value={[config.priority]}
                onValueChange={([value]) => setConfig({ ...config, priority: value })}
                max={100}
                min={1}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Higher priority models are preferred for task routing
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rate Limit (per minute)</Label>
                <Input
                  type="number"
                  value={config.rate_limits.per_minute}
                  onChange={(e) => setConfig({
                    ...config,
                    rate_limits: { ...config.rate_limits, per_minute: parseInt(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label>Rate Limit (per hour)</Label>
                <Input
                  type="number"
                  value={config.rate_limits.per_hour}
                  onChange={(e) => setConfig({
                    ...config,
                    rate_limits: { ...config.rate_limits, per_hour: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Temperature</Label>
              <Slider
                value={[config.parameters.temperature || 0.7]}
                onValueChange={([value]) => setConfig({
                  ...config,
                  parameters: { ...config.parameters, temperature: value }
                })}
                max={2}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={config.parameters.max_tokens || selectedModel.max_context_length}
                onChange={(e) => setConfig({
                  ...config,
                  parameters: { ...config.parameters, max_tokens: parseInt(e.target.value) }
                })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModelConfig(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Model Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Manage AI models, priorities, and performance tuning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadModels} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              const activeModels = models.filter(m => m.is_active);
              Promise.all(activeModels.map(m => 
                updateModelConfig(m.id, { is_active: false })
              ));
            }}
          >
            Bulk Deactivate
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registry">Model Registry</TabsTrigger>
          <TabsTrigger value="performance">Performance Tuning</TabsTrigger>
          <TabsTrigger value="routing">Task Routing</TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 rounded-lg p-3 border">
                  <div className="text-2xl font-bold">
                    {models.reduce((sum, m) => sum + m.response_time_avg_ms, 0) / models.length || 0}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border">
                  <div className="text-2xl font-bold">
                    {((models.reduce((sum, m) => sum + m.success_rate, 0) / models.length || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 border">
                  <div className="text-2xl font-bold">
                    ${models.reduce((sum, m) => sum + m.cost_per_1k_tokens, 0).toFixed(4)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Cost/1k Tokens</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Routing Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how tasks are routed to different models based on requirements
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Default Text Generation</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.filter(m => m.is_active).map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vision Tasks</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.filter(m => m.is_active && m.supports_vision).map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ModelConfigDialog />
    </div>
  );
};