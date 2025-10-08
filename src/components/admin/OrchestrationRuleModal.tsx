import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Save, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrchestrationEngine } from '@/hooks/useOrchestrationEngine';
import { useAIProviderManagement } from '@/hooks/useAIProviderManagement';
import { OrchestrationRule, OrchestrationCondition } from '@/types/orchestration';

interface Props {
  open: boolean;
  rule?: OrchestrationRule | null;
  onClose: () => void;
  onSaved: () => void;
}

const TASK_TYPES = [
  'text_generation',
  'chat_completion',
  'vision',
  'code_generation',
  'translation',
  'summarization',
  'sentiment_analysis',
  'ocr',
  'function_calling'
];

const CONDITION_FIELDS = [
  'task_type',
  'content_length',
  'priority',
  'module',
  'user_role',
  'cost_budget',
  'latency_requirement',
  'language',
  'output_format'
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' }
];

export const OrchestrationRuleModal: React.FC<Props> = ({ open, rule, onClose, onSaved }) => {
  const { toast } = useToast();
  const { createRule, updateRule, testRouting } = useOrchestrationEngine();
  const { models } = useAIProviderManagement();

  const [formData, setFormData] = useState({
    name: '',
    task_type: '',
    priority: 50,
    is_active: true,
    conditions: [] as OrchestrationCondition[],
    primary_model_id: '',
    fallback_models: [] as string[],
    performance_threshold: 0.8,
    cost_threshold: 0,
    latency_threshold: 0
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        task_type: rule.task_type,
        priority: rule.priority,
        is_active: rule.is_active,
        conditions: rule.conditions || [],
        primary_model_id: rule.primary_model_id,
        fallback_models: rule.fallback_models || [],
        performance_threshold: rule.performance_threshold,
        cost_threshold: rule.cost_threshold || 0,
        latency_threshold: rule.latency_threshold || 0
      });
    } else {
      setFormData({
        name: '',
        task_type: '',
        priority: 50,
        is_active: true,
        conditions: [],
        primary_model_id: '',
        fallback_models: [],
        performance_threshold: 0.8,
        cost_threshold: 0,
        latency_threshold: 0
      });
    }
  }, [rule]);

  const handleSave = async () => {
    try {
      if (rule) {
        await updateRule.mutateAsync({
          ruleId: rule.id,
          updates: formData
        });
        toast({
          title: 'Rule updated',
          description: 'Orchestration rule has been updated successfully'
        });
      } else {
        await createRule.mutateAsync(formData);
        toast({
          title: 'Rule created',
          description: 'New orchestration rule has been created successfully'
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: String(error),
        variant: 'destructive'
      });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testRouting.mutateAsync({
        task_type: formData.task_type,
        content: 'Test content for routing decision',
        priority: 'medium'
      });
      setTestResult(result);
      toast({
        title: 'Routing test completed',
        description: `Would route to: ${result.selected_model}`
      });
    } catch (error) {
      toast({
        title: 'Test failed',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          field: 'task_type',
          operator: 'equals',
          value: '',
          logic: 'and'
        }
      ]
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: keyof OrchestrationCondition, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const toggleFallbackModel = (modelId: string) => {
    setFormData(prev => ({
      ...prev,
      fallback_models: prev.fallback_models.includes(modelId)
        ? prev.fallback_models.filter(id => id !== modelId)
        : [...prev.fallback_models, modelId]
    }));
  };

  const availableModels = models.data?.filter(m => m.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Orchestration Rule' : 'Create Orchestration Rule'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[600px] pr-4">
          <div className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="High priority vision tasks"
                    />
                  </div>
                  <div>
                    <Label htmlFor="task_type">Task Type</Label>
                    <Select
                      value={formData.task_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority (1-100)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min={1}
                      max={100}
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Conditions
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Condition
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, 'field', value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_FIELDS.map(field => (
                          <SelectItem key={field} value={field}>
                            {field.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1"
                    />

                    {index > 0 && (
                      <Select
                        value={condition.logic || 'and'}
                        onValueChange={(value) => updateCondition(index, 'logic', value)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="and">AND</SelectItem>
                          <SelectItem value="or">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCondition(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {formData.conditions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No conditions set. This rule will apply to all tasks of the specified type.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Model Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primary_model">Primary Model</Label>
                  <Select
                    value={formData.primary_model_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, primary_model_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.model_name} ({model.model_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Fallback Models</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableModels
                      .filter(model => model.id !== formData.primary_model_id)
                      .map(model => (
                        <div
                          key={model.id}
                          className={`p-2 border rounded cursor-pointer transition-colors ${
                            formData.fallback_models.includes(model.id)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleFallbackModel(model.id)}
                        >
                          <div className="text-sm font-medium">{model.model_name}</div>
                          <div className="text-xs text-muted-foreground">{model.model_id}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="performance_threshold">Success Rate (%)</Label>
                    <Input
                      id="performance_threshold"
                      type="number"
                      min={0}
                      max={1}
                      step={0.01}
                      value={formData.performance_threshold}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        performance_threshold: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost_threshold">Max Cost ($)</Label>
                    <Input
                      id="cost_threshold"
                      type="number"
                      min={0}
                      step={0.001}
                      value={formData.cost_threshold}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        cost_threshold: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="latency_threshold">Max Latency (ms)</Label>
                    <Input
                      id="latency_threshold"
                      type="number"
                      min={0}
                      value={formData.latency_threshold}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        latency_threshold: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Section */}
            {formData.task_type && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Routing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={handleTest}
                      disabled={testing}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      {testing ? 'Testing...' : 'Test Rule'}
                    </Button>
                    
                    {testResult && (
                      <div className="flex items-center gap-2">
                        <Badge>Selected: {testResult.selected_model}</Badge>
                        <Badge variant="outline">
                          Decision time: {testResult.routing_decision?.decision_time_ms}ms
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {testResult && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Routing Decision</h4>
                      <p className="text-sm text-muted-foreground">
                        {testResult.routing_decision?.reason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {rule ? 'Update existing rule' : 'Create new orchestration rule'}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || !formData.task_type || !formData.primary_model_id}
            >
              <Save className="w-4 h-4 mr-2" />
              {rule ? 'Update' : 'Create'} Rule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};