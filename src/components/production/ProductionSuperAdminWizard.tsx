import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Settings, 
  Zap, 
  Shield, 
  Database,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIProvider {
  id?: string;
  name: string;
  provider_type: string;
  base_url: string;
  is_active: boolean;
  is_primary: boolean;
  config: {
    endpoints: {
      chat?: string;
      models?: string;
      test?: string;
    };
    auth: {
      header_name: string;
      secret_name: string;
      token_prefix?: string;
    };
    defaults: {
      temperature: number;
      max_tokens: number;
      timeout: number;
      max_retries: number;
    };
    features: {
      streaming: boolean;
      function_calling: boolean;
      vision: boolean;
      embeddings: boolean;
    };
  };
  capabilities: string[];
  supported_languages: string[];
}

interface TestResult {
  provider: string;
  success: boolean;
  latency_ms?: number;
  error?: string;
  models_discovered?: number;
}

const PROVIDER_TEMPLATES: Record<string, Partial<AIProvider>> = {
  openai: {
    name: 'OpenAI',
    provider_type: 'openai',
    base_url: 'https://api.openai.com/v1',
    config: {
      endpoints: {
        chat: '/chat/completions',
        models: '/models',
        test: '/models'
      },
      auth: {
        header_name: 'Authorization',
        secret_name: 'OPENAI_API_KEY',
        token_prefix: 'Bearer'
      },
      defaults: {
        temperature: 0.7,
        max_tokens: 4000,
        timeout: 30000,
        max_retries: 3
      },
      features: {
        streaming: true,
        function_calling: true,
        vision: true,
        embeddings: true
      }
    },
    capabilities: ['text_generation', 'chat_completion', 'vision', 'embeddings', 'function_calling'],
    supported_languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']
  },
  google_vision: {
    name: 'Google Vision API',
    provider_type: 'google_vision',
    base_url: 'https://vision.googleapis.com/v1',
    config: {
      endpoints: {
        test: '/images:annotate'
      },
      auth: {
        header_name: 'Authorization',
        secret_name: 'GOOGLE_VISION_API_KEY',
        token_prefix: 'Bearer'
      },
      defaults: {
        temperature: 0,
        max_tokens: 0,
        timeout: 20000,
        max_retries: 2
      },
      features: {
        streaming: false,
        function_calling: false,
        vision: true,
        embeddings: false
      }
    },
    capabilities: ['vision', 'ocr', 'object_detection'],
    supported_languages: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh']
  },
  grok: {
    name: 'Grok (xAI)',
    provider_type: 'grok',
    base_url: 'https://api.x.ai/v1',
    config: {
      endpoints: {
        chat: '/chat/completions',
        models: '/models',
        test: '/models'
      },
      auth: {
        header_name: 'Authorization',
        secret_name: 'GROK_API_KEY',
        token_prefix: 'Bearer'
      },
      defaults: {
        temperature: 0.3,
        max_tokens: 4000,
        timeout: 30000,
        max_retries: 3
      },
      features: {
        streaming: true,
        function_calling: false,
        vision: false,
        embeddings: false
      }
    },
    capabilities: ['text_generation', 'chat_completion', 'reasoning'],
    supported_languages: ['en']
  },
  deepseek: {
    name: 'DeepSeek',
    provider_type: 'deepseek',
    base_url: 'https://api.deepseek.com/v1',
    config: {
      endpoints: {
        chat: '/chat/completions',
        models: '/models',
        test: '/models'
      },
      auth: {
        header_name: 'Authorization',
        secret_name: 'DEEPSEEK_API_KEY',
        token_prefix: 'Bearer'
      },
      defaults: {
        temperature: 0.1,
        max_tokens: 4000,
        timeout: 30000,
        max_retries: 3
      },
      features: {
        streaming: true,
        function_calling: true,
        vision: false,
        embeddings: false
      }
    },
    capabilities: ['text_generation', 'chat_completion', 'code_generation'],
    supported_languages: ['en', 'zh']
  }
};

export function ProductionSuperAdminWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customProvider, setCustomProvider] = useState<AIProvider | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingProviders();
  }, []);

  useEffect(() => {
    // Calculate overall progress
    const totalSteps = 4;
    const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
    setOverallProgress(progress);
  }, [currentStep]);

  const loadExistingProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_providers_with_keys')
        .select('*')
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setProviders((data || []).map(p => ({
        ...p,
        config: typeof p.config === 'string' ? JSON.parse(p.config) : p.config,
        capabilities: Array.isArray(p.capabilities) ? p.capabilities.filter(c => typeof c === 'string') as string[] : [],
        supported_languages: Array.isArray(p.supported_languages) ? p.supported_languages.filter(l => typeof l === 'string') as string[] : []
      })));
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast({
        title: "Error",
        description: "Failed to load existing providers",
        variant: "destructive"
      });
    }
  };

  const addProviderFromTemplate = () => {
    if (!selectedTemplate) return;
    
    const template = PROVIDER_TEMPLATES[selectedTemplate];
    if (!template) return;

    const newProvider: AIProvider = {
      ...template,
      is_active: true,
      is_primary: providers.length === 0,
    } as AIProvider;

    setCustomProvider(newProvider);
    setSelectedTemplate('');
  };

  const saveProvider = async (provider: AIProvider) => {
    try {
      setIsLoading(true);

      // First, save the API key secret if provided
      const secretName = provider.config.auth.secret_name;
      if (secretValues[secretName]) {
        const { error: secretError } = await supabase.functions.invoke('edge-control', {
          body: {
            action: 'set_secret',
            secret_name: secretName,
            secret_value: secretValues[secretName]
          }
        });

        if (secretError) {
          console.error('Secret save error:', secretError);
          // Continue anyway - secret might already exist
        }
      }

      // Save provider to database
      const { data, error } = await supabase
        .from('ai_providers_unified')
        .upsert({
          ...provider,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProviders(prev => {
        const exists = prev.find(p => p.id === data.id);
        if (exists) {
        return prev.map(p => p.id === data.id ? {
          ...data,
          config: typeof data.config === 'string' ? JSON.parse(data.config) : data.config,
          capabilities: Array.isArray(data.capabilities) ? data.capabilities.filter(c => typeof c === 'string') as string[] : [],
          supported_languages: Array.isArray(data.supported_languages) ? data.supported_languages.filter(l => typeof l === 'string') as string[] : []
        } : p);
        } else {
          return [...prev, {
            ...data,
            config: typeof data.config === 'string' ? JSON.parse(data.config) : data.config,
            capabilities: Array.isArray(data.capabilities) ? data.capabilities.filter(c => typeof c === 'string') as string[] : [],
            supported_languages: Array.isArray(data.supported_languages) ? data.supported_languages.filter(l => typeof l === 'string') as string[] : []
          }];
        }
      });

      setCustomProvider(null);
      
      toast({
        title: "Success",
        description: `${provider.name} provider saved successfully`,
      });

    } catch (error) {
      console.error('Failed to save provider:', error);
      toast({
        title: "Error",
        description: `Failed to save ${provider.name}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testProvider = async (provider: AIProvider) => {
    try {
      setIsLoading(true);
      setTestResults(prev => ({ ...prev, [provider.provider_type]: { provider: provider.name, success: false } }));

      const { data, error } = await supabase.functions.invoke('production-multi-ai-processor', {
        body: {
          task_type: 'analysis',
          content: 'Test connection - please respond with "Connection successful"',
          options: {
            providers: [provider.provider_type],
            max_cost_usd: 0.01
          }
        }
      });

      if (error) throw error;

      const result: TestResult = {
        provider: provider.name,
        success: data.success && data.model_results?.some((r: any) => r.success),
        latency_ms: data.total_processing_time_ms,
        models_discovered: data.model_results?.length || 0
      };

      if (!result.success && data.model_results?.[0]?.error) {
        result.error = data.model_results[0].error;
      }

      setTestResults(prev => ({ ...prev, [provider.provider_type]: result }));

      if (result.success) {
        toast({
          title: "Test Successful",
          description: `${provider.name} is working correctly (${result.latency_ms}ms)`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || `${provider.name} test failed`,
          variant: "destructive"
        });
      }

    } catch (error) {
      const failedResult: TestResult = {
        provider: provider.name,
        success: false,
        error: error.message
      };
      
      setTestResults(prev => ({ ...prev, [provider.provider_type]: failedResult }));
      
      toast({
        title: "Test Error",
        description: `Failed to test ${provider.name}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testAllProviders = async () => {
    setIsLoading(true);
    try {
      for (const provider of providers.filter(p => p.is_active)) {
        await testProvider(provider);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    try {
      setIsLoading(true);

      // Final validation
      const activeProviders = providers.filter(p => p.is_active);
      if (activeProviders.length === 0) {
        throw new Error('At least one active provider is required');
      }

      const primaryProviders = activeProviders.filter(p => p.is_primary);
      if (primaryProviders.length === 0) {
        // Set first active provider as primary
        const firstProvider = activeProviders[0];
        await supabase
          .from('ai_providers_unified')
          .update({ is_primary: true })
          .eq('id', firstProvider.id);
      }

      // Log completion
      await supabase.from('analytics_events').insert({
        event_type: 'wizard_completed',
        event_message: 'Production AI setup wizard completed',
        metadata: {
          providers_configured: activeProviders.length,
          primary_provider: primaryProviders[0]?.name || activeProviders[0]?.name,
          test_results: JSON.stringify(testResults)
        } as any,
        severity: 'info'
      });

      toast({
        title: "Setup Complete!",
        description: `Production AI system configured with ${activeProviders.length} providers`,
      });

      setCurrentStep(4);

    } catch (error) {
      console.error('Setup completion error:', error);
      toast({
        title: "Setup Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSecret = (secretName: string) => {
    setShowSecrets(prev => ({ ...prev, [secretName]: !prev[secretName] }));
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Add AI Providers</h3>
        <p className="text-muted-foreground mb-4">
          Configure AI providers for your yacht management system. Each provider offers different capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PROVIDER_TEMPLATES).map(([key, template]) => (
          <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTemplate(key)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <Badge variant={selectedTemplate === key ? "default" : "outline"}>
                  {template.capabilities?.length || 0} capabilities
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {template.capabilities?.join(', ')}
              </p>
              <div className="flex gap-2">
                {template.config?.features?.vision && <Badge variant="secondary" className="text-xs">Vision</Badge>}
                {template.config?.features?.streaming && <Badge variant="secondary" className="text-xs">Streaming</Badge>}
                {template.config?.features?.function_calling && <Badge variant="secondary" className="text-xs">Functions</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Click "Add Provider" to configure {PROVIDER_TEMPLATES[selectedTemplate].name}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button 
          onClick={addProviderFromTemplate} 
          disabled={!selectedTemplate}
          className="flex-1"
        >
          <Settings className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(2)}
          disabled={providers.length === 0}
        >
          Next Step
        </Button>
      </div>

      {/* Existing Providers */}
      {providers.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-3">Configured Providers</h4>
          <div className="space-y-2">
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={provider.is_active ? "default" : "secondary"}>
                    {provider.name}
                  </Badge>
                  {provider.is_primary && <Badge variant="outline">Primary</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider(provider)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Test
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Configure API Keys</h3>
        <p className="text-muted-foreground mb-4">
          Enter your API keys for each provider. These will be stored securely.
        </p>
      </div>

      <div className="space-y-4">
        {providers.filter(p => p.is_active).map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {provider.name} API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type={showSecrets[provider.config.auth.secret_name] ? "text" : "password"}
                    placeholder={`Enter ${provider.name} API key`}
                    value={secretValues[provider.config.auth.secret_name] || ''}
                    onChange={(e) => setSecretValues(prev => ({
                      ...prev,
                      [provider.config.auth.secret_name]: e.target.value
                    }))}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleSecret(provider.config.auth.secret_name)}
                >
                  {showSecrets[provider.config.auth.secret_name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Secret name: {provider.config.auth.secret_name}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Previous
        </Button>
        <Button 
          onClick={() => setCurrentStep(3)} 
          disabled={!providers.some(p => p.is_active && secretValues[p.config.auth.secret_name])}
          className="flex-1"
        >
          Continue to Testing
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Test Connections</h3>
        <p className="text-muted-foreground mb-4">
          Verify that all providers are working correctly with real API calls.
        </p>
      </div>

      <div className="grid gap-4">
        {providers.filter(p => p.is_active).map((provider) => {
          const result = testResults[provider.provider_type];
          return (
            <Card key={provider.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {result?.success === true && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {result?.success === false && <XCircle className="w-5 h-5 text-destructive" />}
                      {result === undefined && <AlertCircle className="w-5 h-5 text-muted-foreground" />}
                      <span className="font-medium">{provider.name}</span>
                    </div>
                    {result?.latency_ms && (
                      <Badge variant="outline" className="text-xs">
                        {result.latency_ms}ms
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider(provider)}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test'}
                  </Button>
                </div>
                {result?.error && (
                  <Alert className="mt-3" variant="destructive">
                    <AlertDescription className="text-xs">
                      {result.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          Previous
        </Button>
        <Button 
          onClick={testAllProviders} 
          disabled={isLoading}
          variant="outline"
          className="flex-1"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          Test All
        </Button>
        <Button 
          onClick={completeSetup}
          disabled={!Object.values(testResults).some(r => r.success)}
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Setup Complete!</h3>
        <p className="text-muted-foreground">
          Your production AI system is now configured and ready to use.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Active Providers</div>
              <div className="text-muted-foreground">{providers.filter(p => p.is_active).length}</div>
            </div>
            <div>
              <div className="font-medium">Primary Provider</div>
              <div className="text-muted-foreground">{providers.find(p => p.is_primary)?.name || 'None'}</div>
            </div>
            <div>
              <div className="font-medium">Successful Tests</div>
              <div className="text-muted-foreground">{Object.values(testResults).filter(r => r.success).length}</div>
            </div>
            <div>
              <div className="font-medium">Total Capabilities</div>
              <div className="text-muted-foreground">
                {Array.from(new Set(providers.flatMap(p => p.capabilities))).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => setCurrentStep(1)} variant="outline">
        Configure More Providers
      </Button>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Production AI Setup Wizard
        </CardTitle>
        <CardDescription>
          Configure your production AI providers with real API integrations
        </CardDescription>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Setup Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step Indicators */}
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  getStepStatus(step) === 'completed' ? 'bg-green-500 text-white' :
                  getStepStatus(step) === 'current' ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {getStepStatus(step) === 'completed' ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                <span className="text-xs mt-1">
                  {step === 1 && 'Providers'}
                  {step === 2 && 'API Keys'}
                  {step === 3 && 'Testing'}
                  {step === 4 && 'Complete'}
                </span>
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </CardContent>

      {/* Custom Provider Modal */}
      {customProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Configure {customProvider.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Provider Name</Label>
                  <Input
                    value={customProvider.name}
                    onChange={(e) => setCustomProvider(prev => prev ? {...prev, name: e.target.value} : null)}
                  />
                </div>
                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={customProvider.base_url}
                    onChange={(e) => setCustomProvider(prev => prev ? {...prev, base_url: e.target.value} : null)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={customProvider.is_active}
                  onCheckedChange={(checked) => setCustomProvider(prev => prev ? {...prev, is_active: checked} : null)}
                />
                <Label>Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={customProvider.is_primary}
                  onCheckedChange={(checked) => setCustomProvider(prev => prev ? {...prev, is_primary: checked} : null)}
                />
                <Label>Primary Provider</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => saveProvider(customProvider)} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Provider
                </Button>
                <Button variant="outline" onClick={() => setCustomProvider(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}
