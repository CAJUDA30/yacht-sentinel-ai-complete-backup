import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Brain, Settings, Activity, Users, Shield, Zap, BarChart3, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAIConsensus, type AIModel, type ConsensusRule, type AgentWorkflow } from '@/hooks/useAIConsensus';
import { toast } from 'sonner';

interface AIConsensusManagerProps {
  module?: string;
  className?: string;
}

export const AIConsensusManager: React.FC<AIConsensusManagerProps> = ({ 
  module = 'global',
  className = '' 
}) => {
  const {
    isProcessing,
    models,
    consensusRules,
    workflows,
    loadModels,
    loadConsensusRules,
    loadWorkflows,
    processWithConsensus,
    updateModelConfig,
    updateConsensusRule
  } = useAIConsensus();

  const [testPrompt, setTestPrompt] = useState('Analyze current inventory levels and suggest optimizations');
  const [testResults, setTestResults] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<string>('');

  useEffect(() => {
    loadModels();
    loadConsensusRules(module);
    loadWorkflows(module);
  }, [module, loadModels, loadConsensusRules, loadWorkflows]);

  const handleTestConsensus = async () => {
    try {
      const result = await processWithConsensus({
        content: testPrompt,
        module,
        action_type: 'suggest',
        context: 'Testing consensus system',
        session_id: `test-${Date.now()}`
      });
      setTestResults(result);
      toast.success('Consensus test completed');
    } catch (error) {
      toast.error('Failed to test consensus');
      console.error('Test error:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-emerald-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-emerald-100 text-emerald-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModelToggle = async (modelId: string, isActive: boolean) => {
    try {
      await updateModelConfig(modelId, { is_active: isActive });
      toast.success(`Model ${isActive ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update model');
    }
  };

  const handleRuleUpdate = async (ruleId: string, field: string, value: any) => {
    try {
      await updateConsensusRule(ruleId, { [field]: value });
      toast.success('Rule updated successfully');
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Consensus Manager</h2>
        <Badge variant="outline">{module}</Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="consensus">Consensus Rules</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Models</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{models.filter(m => m.is_active).length}</div>
                <p className="text-xs text-muted-foreground">of {models.length} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consensus Rules</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consensusRules.length}</div>
                <p className="text-xs text-muted-foreground">configured rules</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.filter(w => w.is_active).length}</div>
                <p className="text-xs text-muted-foreground">intelligent agents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(models.reduce((acc, m) => acc + m.avg_latency_ms, 0) / models.length || 0)}ms
                </div>
                <p className="text-xs text-muted-foreground">consensus time</p>
              </CardContent>
            </Card>
          </div>

          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Latest Consensus Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Confidence Score:</span>
                  <span className={`font-bold ${getConfidenceColor(testResults.confidence)}`}>
                    {(testResults.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Algorithm Used:</span>
                  <Badge variant="outline">{testResults.consensus_metadata?.algorithm_used}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Models Participating:</span>
                  <div className="flex gap-1">
                    {testResults.consensus_metadata?.models_used?.map((model: string) => (
                      <Badge key={model} variant="secondary" className="text-xs">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Execution Decision:</span>
                  <Badge className={getRiskColor(testResults.consensus_metadata?.risk_assessment)}>
                    {testResults.consensus_metadata?.execution_decision}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Consensus Output:</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {testResults.consensus}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4">
            {models.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {model.model_name}
                        <Badge variant="outline">{model.provider}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Priority: {model.priority} | Success Rate: {model.success_rate}%
                      </CardDescription>
                    </div>
                    <Switch
                      checked={model.is_active}
                      onCheckedChange={(checked) => handleModelToggle(model.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label>Capabilities</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.capabilities.map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Avg Latency</Label>
                      <p className="font-mono">{model.avg_latency_ms}ms</p>
                    </div>
                    <div>
                      <Label>Cost per Token</Label>
                      <p className="font-mono">${model.cost_per_token.toFixed(6)}</p>
                    </div>
                    <div>
                      <Label>Model ID</Label>
                      <p className="font-mono text-xs">{model.model_id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consensus" className="space-y-4">
          <div className="grid gap-4">
            {consensusRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {rule.module} - {rule.action_type}
                        <Badge className={getRiskColor(rule.risk_level)}>
                          {rule.risk_level}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Algorithm: {rule.consensus_algorithm} | Min Models: {rule.minimum_models_required}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => handleRuleUpdate(rule.id, 'is_active', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Agreement Threshold: {(rule.required_agreement_threshold * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[rule.required_agreement_threshold * 100]}
                        onValueChange={([value]) => 
                          handleRuleUpdate(rule.id, 'required_agreement_threshold', value / 100)
                        }
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auto Execute: {(rule.auto_execute_threshold * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[rule.auto_execute_threshold * 100]}
                        onValueChange={([value]) => 
                          handleRuleUpdate(rule.id, 'auto_execute_threshold', value / 100)
                        }
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Human Approval: {(rule.human_approval_threshold * 100).toFixed(0)}%</Label>
                      <Slider
                        value={[rule.human_approval_threshold * 100]}
                        onValueChange={([value]) => 
                          handleRuleUpdate(rule.id, 'human_approval_threshold', value / 100)
                        }
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Model Weights</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {Object.entries(rule.model_weights).map(([provider, weight]) => (
                        <div key={provider} className="flex justify-between p-2 bg-muted rounded">
                          <span className="capitalize">{provider}:</span>
                          <span className="font-mono">{(weight as number).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{workflow.workflow_name}</CardTitle>
                      <CardDescription>
                        {workflow.module} - {workflow.trigger_type}
                      </CardDescription>
                    </div>
                    <Badge variant={workflow.is_active ? "default" : "secondary"}>
                      {workflow.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Workflow Steps</Label>
                      <div className="mt-2 space-y-2">
                        {workflow.workflow_steps.map((step, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{step.step}</p>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Model Chain</Label>
                      <div className="mt-2 space-y-2">
                        {workflow.model_chain.map((chain, index) => (
                          <div key={index} className="p-2 bg-muted rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{chain.purpose}</Badge>
                              <Badge variant={chain.parallel ? "default" : "secondary"}>
                                {chain.parallel ? "Parallel" : "Sequential"}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              {chain.models.map((model) => (
                                <Badge key={model} variant="secondary" className="text-xs">
                                  {model}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test AI Consensus System</CardTitle>
              <CardDescription>
                Test how the AI models work together to reach consensus on decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-prompt">Test Prompt</Label>
                <Textarea
                  id="test-prompt"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder="Enter a prompt to test the consensus system..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleTestConsensus}
                  disabled={isProcessing || !testPrompt.trim()}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Test Consensus'}
                </Button>
                
                <Select value={selectedRule} onValueChange={setSelectedRule}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select rule override" />
                  </SelectTrigger>
                  <SelectContent>
                    {consensusRules.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.module} - {rule.action_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};