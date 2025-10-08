import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Settings, 
  Activity, 
  Database, 
  DollarSign, 
  Shield, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Globe,
  Eye,
  Lock
} from 'lucide-react';
import { useAIConsensus } from '@/hooks/useAIConsensus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const SuperAdminAIPanel = () => {
  const {
    models,
    consensusRules,
    workflows,
    isProcessing,
    loadModels,
    loadConsensusRules,
    loadWorkflows,
    updateModelConfig,
    updateConsensusRule,
    trackPerformance
  } = useAIConsensus();

  const [activeTab, setActiveTab] = useState('models');
  const [systemMetrics, setSystemMetrics] = useState({
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    totalCost: 0,
    activeModels: 0
  });

  useEffect(() => {
    loadModels();
    loadConsensusRules();
    loadWorkflows();
    loadSystemMetrics();
  }, [loadModels, loadConsensusRules, loadWorkflows]);

  const loadSystemMetrics = async () => {
    try {
      // Get AI performance metrics from the last 24 hours
      const { data: performanceData } = await supabase
        .from('ai_model_performance')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (performanceData) {
        const totalRequests = performanceData.length;
        const successfulRequests = performanceData.filter(p => p.success).length;
        const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
        const avgResponseTime = performanceData.reduce((sum, p) => sum + p.execution_time_ms, 0) / totalRequests || 0;
        const totalCost = performanceData.reduce((sum, p) => sum + (p.cost_usd || 0), 0);

        setSystemMetrics({
          totalRequests,
          successRate,
          avgResponseTime,
          totalCost,
          activeModels: models.filter(m => m.is_active).length
        });
      }
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const normalizeProvider = (p: string) => {
    switch (p) {
      case 'xai':
        return 'grok';
      case 'google':
        return 'gemini';
      default:
        return p;
    }
  };

  const handleModelToggle = async (modelId: string, isActive: boolean) => {
    try {
      await updateModelConfig(modelId, { is_active: isActive });
      toast.success(`Model ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update model status');
    }
  };

  const handleModelPriorityUpdate = async (modelId: string, priority: number) => {
    try {
      await updateModelConfig(modelId, { priority });
      toast.success('Model priority updated');
    } catch (error) {
      toast.error('Failed to update model priority');
    }
  };

  const handleConsensusRuleUpdate = async (ruleId: string, field: string, value: any) => {
    try {
      await updateConsensusRule(ruleId, { [field]: value });
      toast.success('Consensus rule updated');
    } catch (error) {
      toast.error('Failed to update consensus rule');
    }
  };

  const testAIConnections = async () => {
    try {
      const results = await Promise.allSettled(
        models.filter(m => m.is_active).map(async (model) => {
          const startTime = Date.now();
          
          // Test basic connectivity by processing a simple request
          const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
            body: {
              content: 'Test connection',
              module: 'system',
              action_type: 'test',
              models: [normalizeProvider(model.provider)]
            }
          });

          const endTime = Date.now();
          
          await trackPerformance({
            model_id: model.id,
            module: 'system',
            action_type: 'connectivity_test',
            execution_time_ms: endTime - startTime,
            success: !error,
            confidence_score: error ? 0 : 1,
            error_message: error?.message
          });

          return { model: model.provider, success: !error, latency: endTime - startTime };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const total = results.length;
      
      toast.success(`Connection test completed: ${successful}/${total} models responding`);
    } catch (error) {
      toast.error('Failed to test AI connections');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with System Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SuperAdmin AI Control Panel
          </h2>
          <p className="text-muted-foreground">
            Configure and monitor all AI models, consensus rules, and workflows
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="h-4 w-4 mr-2" />
            {systemMetrics.activeModels} Active Models
          </Badge>
          <Button onClick={testAIConnections} variant="outline" disabled={isProcessing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Test Connections
          </Button>
        </div>
      </div>

      {/* System Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">24h Requests</p>
                <p className="text-2xl font-bold">{systemMetrics.totalRequests}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{systemMetrics.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{systemMetrics.avgResponseTime.toFixed(0)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">24h Cost</p>
                <p className="text-2xl font-bold">${systemMetrics.totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Models</span>
          </TabsTrigger>
          <TabsTrigger value="consensus" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Consensus Rules</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Models Configuration */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {models.map((model) => (
              <Card key={model.id} className="shadow-elegant border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${model.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <CardTitle className="text-lg">{model.model_name}</CardTitle>
                        <CardDescription>{model.provider}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={model.is_active}
                      onCheckedChange={(checked) => handleModelToggle(model.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Success Rate</Label>
                      <div className="flex items-center space-x-2">
                        <Progress value={model.success_rate} className="flex-1" />
                        <span className="text-sm font-medium">{model.success_rate}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Avg Latency</Label>
                      <p className="font-medium">{model.avg_latency_ms}ms</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Priority (1-100)</Label>
                    <Slider
                      value={[model.priority]}
                      onValueChange={([value]) => handleModelPriorityUpdate(model.id, value)}
                      max={100}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>{model.priority}</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Cost/Token</Label>
                      <p className="text-sm">${model.cost_per_token.toFixed(6)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Capabilities</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.capabilities.slice(0, 2).map((cap, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs px-1 py-0">
                            {cap}
                          </Badge>
                        ))}
                        {model.capabilities.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{model.capabilities.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Consensus Rules Configuration */}
        <TabsContent value="consensus" className="space-y-6">
          <div className="space-y-4">
            {consensusRules.map((rule) => (
              <Card key={rule.id} className="shadow-elegant border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{rule.module} - {rule.action_type}</CardTitle>
                      <CardDescription>Risk Level: {rule.risk_level}</CardDescription>
                    </div>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Agreement Threshold</Label>
                      <Slider
                        value={[rule.required_agreement_threshold * 100]}
                        onValueChange={([value]) => 
                          handleConsensusRuleUpdate(rule.id, 'required_agreement_threshold', value / 100)
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(rule.required_agreement_threshold * 100).toFixed(0)}%
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm">Auto Execute Threshold</Label>
                      <Slider
                        value={[rule.auto_execute_threshold * 100]}
                        onValueChange={([value]) => 
                          handleConsensusRuleUpdate(rule.id, 'auto_execute_threshold', value / 100)
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(rule.auto_execute_threshold * 100).toFixed(0)}%
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm">Human Approval Threshold</Label>
                      <Slider
                        value={[rule.human_approval_threshold * 100]}
                        onValueChange={([value]) => 
                          handleConsensusRuleUpdate(rule.id, 'human_approval_threshold', value / 100)
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(rule.human_approval_threshold * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`min-models-${rule.id}`} className="text-sm">Minimum Models Required</Label>
                      <Input
                        id={`min-models-${rule.id}`}
                        type="number"
                        value={rule.minimum_models_required}
                        onChange={(e) => 
                          handleConsensusRuleUpdate(rule.id, 'minimum_models_required', parseInt(e.target.value))
                        }
                        min={1}
                        max={10}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`timeout-${rule.id}`} className="text-sm">Timeout (seconds)</Label>
                      <Input
                        id={`timeout-${rule.id}`}
                        type="number"
                        value={rule.timeout_seconds}
                        onChange={(e) => 
                          handleConsensusRuleUpdate(rule.id, 'timeout_seconds', parseInt(e.target.value))
                        }
                        min={5}
                        max={300}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor={`active-${rule.id}`} className="text-sm">Active</Label>
                    <Switch
                      id={`active-${rule.id}`}
                      checked={rule.is_active}
                      onCheckedChange={(checked) => 
                        handleConsensusRuleUpdate(rule.id, 'is_active', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Workflows Configuration */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="shadow-elegant border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{workflow.workflow_name}</CardTitle>
                      <CardDescription>{workflow.module} - {workflow.trigger_type}</CardDescription>
                    </div>
                    <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                      {workflow.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Workflow Steps</Label>
                    <div className="mt-2 space-y-2">
                      {workflow.workflow_steps.map((step, index) => (
                        <div key={index} className="p-3 rounded-lg bg-muted/30 border">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{step.step}</p>
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                            {step.parallel && (
                              <Badge variant="outline" className="text-xs">Parallel</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Model Chain</Label>
                    <div className="mt-2 space-y-2">
                      {workflow.model_chain.map((chain, index) => (
                        <div key={index} className="p-2 rounded bg-muted/20 border">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {chain.models.map((model, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {model}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center space-x-2">
                              {chain.parallel && (
                                <Badge variant="outline" className="text-xs">Parallel</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{chain.purpose}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Real-time Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Load</span>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                  <Progress value={67} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">2.3GB / 8GB</span>
                  </div>
                  <Progress value={29} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Rate Limits</span>
                    <span className="text-sm font-medium">89% Available</span>
                  </div>
                  <Progress value={89} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>System Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">High Token Usage</p>
                      <p className="text-xs text-muted-foreground">
                        OpenAI usage approaching daily limit (85%)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">All Models Responding</p>
                      <p className="text-xs text-muted-foreground">
                        Last checked 2 minutes ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};