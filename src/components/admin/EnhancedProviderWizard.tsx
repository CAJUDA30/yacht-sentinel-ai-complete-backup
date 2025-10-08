import React, { useState, useEffect } from 'react';
import { useAIModels } from '@/hooks/useAIModels';
import { modelDiscoveryService, type ModelDiscoveryResult } from '@/services/modelDiscoveryService';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, Building2, Plus, Settings, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Activity, Zap, Cpu,
  TestTube, WifiOff, Wifi, Star, ChevronRight, Target, Workflow, Globe, Search, Shield, Eye, EyeOff,
  Sparkles, Loader2, Check, ArrowRight, Database, Rocket, Timer, TrendingUp, Lock, Unlock, Gauge,
  BarChart3, Layers, Play
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface EnhancedProviderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderCreate: (provider: any) => Promise<void>;
}

interface EnhancedProviderConfig {
  name: string;
  provider_type: 'grok' | 'openai' | 'anthropic' | 'azure' | 'google' | 'custom';
  api_endpoint: string;
  auth_method: 'api_key' | 'oauth' | 'service_account';
  api_key: string;
  capabilities: string[];
  description: string;
  is_active: boolean;
  specialization: 'mapping' | 'general' | 'document_analysis' | 'data_extraction';
  selected_model: string;
  selected_models: string[];
  rate_limit?: number;
  timeout?: number;
  max_retries?: number;
  temperature?: number;
  max_tokens?: number;
  priority?: number;
  tags?: string[];
  environment?: 'production' | 'staging' | 'development';
}

// Apple-grade provider templates
const PROVIDER_TEMPLATES: Record<string, Partial<EnhancedProviderConfig> & { 
  icon: any; color: string; gradient: string; description_full: string; pros: string[]; pricing: string; models_count: number;
}> = {
  grok: {
    name: 'Grok by xAI', provider_type: 'grok', api_endpoint: 'https://api.x.ai/v1', auth_method: 'api_key',
    capabilities: ['text_generation', 'chat_completion', 'vision', 'function_calling'], specialization: 'general',
    rate_limit: 10000, timeout: 30000, max_retries: 3, temperature: 0.1, max_tokens: 131072, priority: 1,
    environment: 'production', icon: Rocket, color: 'text-purple-600', gradient: 'from-purple-500 to-pink-600',
    description_full: 'xAI\'s cutting-edge model with real-time web access and enhanced reasoning capabilities',
    pros: ['Real-time web access', 'Advanced reasoning', 'Large context window', 'Vision capabilities'],
    pricing: '$2.00 per 1M tokens', models_count: 4
  },
  openai: {
    name: 'OpenAI', provider_type: 'openai', api_endpoint: 'https://api.openai.com/v1', auth_method: 'api_key',
    capabilities: ['text_generation', 'vision', 'function_calling', 'code_generation'], specialization: 'general',
    rate_limit: 10000, timeout: 30000, max_retries: 3, temperature: 0.7, max_tokens: 128000, priority: 2,
    environment: 'production', icon: Brain, color: 'text-green-600', gradient: 'from-green-500 to-blue-600',
    description_full: 'Industry-leading AI models with multimodal capabilities and function calling',
    pros: ['Most reliable', 'Multimodal support', 'Function calling', 'Large ecosystem'],
    pricing: '$10.00 per 1M tokens', models_count: 8
  },
  anthropic: {
    name: 'Anthropic Claude', provider_type: 'anthropic', api_endpoint: 'https://api.anthropic.com', auth_method: 'api_key',
    capabilities: ['text_generation', 'analysis', 'long_context', 'safety'], specialization: 'document_analysis',
    rate_limit: 4000, timeout: 30000, max_retries: 3, temperature: 0.3, max_tokens: 200000, priority: 3,
    environment: 'production', icon: Shield, color: 'text-orange-600', gradient: 'from-orange-500 to-red-600',
    description_full: 'Safety-focused AI with exceptional reasoning and massive context windows',
    pros: ['Largest context window', 'Safety-focused', 'Excellent reasoning', 'Document analysis'],
    pricing: '$15.00 per 1M tokens', models_count: 6
  },
  google: {
    name: 'Google Gemini', provider_type: 'google', api_endpoint: 'https://generativelanguage.googleapis.com/v1', auth_method: 'api_key',
    capabilities: ['text_generation', 'vision', 'multimodal', 'code_generation'], specialization: 'general',
    rate_limit: 15000, timeout: 30000, max_retries: 3, temperature: 0.4, max_tokens: 1000000, priority: 4,
    environment: 'production', icon: Globe, color: 'text-blue-600', gradient: 'from-blue-500 to-purple-600',
    description_full: 'Google\'s flagship multimodal AI with massive context and coding expertise',
    pros: ['Massive context', 'Multimodal', 'Fast processing', 'Free tier available'],
    pricing: '$7.00 per 1M tokens', models_count: 5
  }
};

export const EnhancedProviderWizard: React.FC<EnhancedProviderWizardProps> = ({ 
  isOpen, onClose, onProviderCreate 
}) => {
  const { toast } = useToast();
  const { getAvailableModelsGrouped } = useAIModels();
  const [wizardStep, setWizardStep] = useState(0);
  const [connectionTested, setConnectionTested] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<any[]>([]);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [configurationProgress, setConfigurationProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const [provider, setProvider] = useState<EnhancedProviderConfig>({
    name: '', provider_type: 'grok', api_endpoint: '', auth_method: 'api_key', api_key: '',
    capabilities: [], description: '', is_active: true, specialization: 'general',
    selected_model: '', selected_models: [], rate_limit: 10000, timeout: 30000, max_retries: 3,
    temperature: 0.1, max_tokens: 4000, priority: 1, tags: [], environment: 'production'
  });

  useEffect(() => {
    const calculateProgress = () => {
      let progress = 0;
      if (selectedTemplate) progress += 20;
      if (provider.name && provider.api_key) progress += 20;
      if (connectionTested) progress += 30;
      if (discoveredModels.length > 0) progress += 20;
      if (provider.selected_models.length > 0) progress += 10;
      setConfigurationProgress(progress);
    };
    calculateProgress();
  }, [selectedTemplate, provider, connectionTested, discoveredModels]);

  const selectTemplate = (templateKey: string) => {
    const template = PROVIDER_TEMPLATES[templateKey];
    setSelectedTemplate(templateKey);
    setProvider(prev => ({ ...prev, ...template }));
    setWizardStep(1);
    toast({ title: `✨ ${template.name} Selected`, description: `Ready to configure your ${template.name} provider`, duration: 3000 });
  };

  const testConnection = async () => {
    if (!provider.api_key.trim()) {
      toast({ title: '🔑 API Key Required', description: 'Please enter your API key to test the connection', variant: 'destructive' });
      return false;
    }

    setIsTesting(true);
    const startTime = performance.now();
    
    try {
      // Use the proper testProviderConnection function from debugConsole
      const testProvider = {
        id: 'test-provider',
        name: provider.name || 'Test Provider',
        provider_type: provider.provider_type,
        api_endpoint: provider.api_endpoint,
        configuration: {
          auth_method: provider.auth_method,
          selected_model: 'grok-2-latest', // Use a fallback model for testing
          selected_models: ['grok-2-latest']
        }
      };
      
      // Import the testProviderConnection function
      const { testProviderConnection } = await import('@/services/debugConsole');
      const result = await testProviderConnection(testProvider, provider.api_key.trim());
      
      const latency = Math.round(performance.now() - startTime);
      setConnectionLatency(latency);
      
      if (result.success) {
        setConnectionTested(true);
        toast({ 
          title: '✨ Connection Successful', 
          description: `API endpoint reachable • ${result.latency || latency}ms latency • Ready for model discovery`, 
          duration: 4000 
        });
        return true;
      } else {
        toast({ 
          title: '❌ Connection Failed', 
          description: `${result.error || 'Unknown error occurred'}`, 
          variant: 'destructive' 
        });
        return false;
      }
    } catch (error: any) {
      setConnectionLatency(null);
      if (window.location.hostname === 'localhost') {
        setConnectionTested(true);
        toast({ title: '🛠️ Development Mode', description: 'Connection test bypassed for local development', duration: 4000 });
        return true;
      }
      toast({ title: '❌ Connection Failed', description: `Unable to reach API endpoint: ${error.message}`, variant: 'destructive' });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const discoverModels = async () => {
    if (!connectionTested || !provider.api_key) {
      toast({ title: '🔌 Connection Required', description: 'Please test the connection first', variant: 'destructive' });
      return;
    }

    setIsDiscovering(true);
    try {
      // Use the real detectAvailableModels function
      const { detectAvailableModels } = await import('@/services/debugConsole');
      
      const testProvider = {
        id: 'test-provider',
        name: provider.name || 'Test Provider',
        provider_type: provider.provider_type,
        api_endpoint: provider.api_endpoint
      };
      
      const modelIds = await detectAvailableModels(testProvider, provider.api_key);
      
      // Convert model IDs to model objects with metadata
      const models = modelIds.map(modelId => ({
        id: modelId,
        name: modelId,
        description: `${modelId.charAt(0).toUpperCase() + modelId.slice(1)} model by ${provider.provider_type}`,
        capabilities: getModelCapabilities(modelId),
        context_length: getModelContextLength(modelId),
        cost_per_1k_tokens: getModelCost(modelId)
      }));
      
      setDiscoveredModels(models);
      
      // Auto-select default models based on provider type and latest available models
      const defaultModels = models.filter(model => {
        const id = model.id.toLowerCase();
        if (provider.provider_type === 'grok') {
          // Prefer latest flagship models
          return id.includes('grok-4') || id.includes('grok-3') || id.includes('grok-code-fast');
        }
        if (provider.provider_type === 'openai') return id.includes('gpt-4') && !id.includes('vision');
        if (provider.provider_type === 'anthropic') return id.includes('claude-3');
        return true;
      }).slice(0, 3).map(m => m.id); // Select up to 3 models
        
      setProvider(prev => ({ 
        ...prev, 
        selected_models: defaultModels, 
        selected_model: defaultModels[0] || models[0]?.id 
      }));
      
      toast({ 
        title: `🚀 Discovered ${models.length} Models`, 
        description: `Found ${models.length} available models from API • ${defaultModels.length} pre-selected`, 
        duration: 6000 
      });
      
    } catch (error: any) {
      // Clear any existing models and show clear error message
      setDiscoveredModels([]);
      
      toast({ 
        title: '⚠️ Model Discovery Failed', 
        description: `Unable to discover models: ${error.message}. Please check your API connection and try again.`, 
        variant: 'destructive',
        duration: 8000
      });
    } finally {
      setIsDiscovering(false);
    }
  };
  
  // Helper functions for model metadata
  const getModelCapabilities = (modelId: string) => {
    const id = modelId.toLowerCase();
    if (id.includes('vision')) return ['text', 'vision', 'multimodal'];
    if (id.includes('grok')) return ['text', 'reasoning', 'real-time'];
    if (id.includes('claude')) return ['text', 'reasoning', 'analysis'];
    if (id.includes('gpt')) return ['text', 'code', 'reasoning'];
    return ['text'];
  };
  
  const getModelContextLength = (modelId: string) => {
    const id = modelId.toLowerCase();
    if (id.includes('grok')) return 131072;
    if (id.includes('claude-3-5')) return 200000;
    if (id.includes('gpt-4')) return 128000;
    return 4096;
  };
  
  const getModelCost = (modelId: string) => {
    const id = modelId.toLowerCase();
    if (id.includes('grok')) return 2.0;
    if (id.includes('claude-3-5')) return 3.0;
    if (id.includes('gpt-4')) return 10.0;
    return 1.0;
  };
  


  const toggleModelSelection = (modelId: string) => {
    setProvider(prev => ({
      ...prev,
      selected_models: prev.selected_models.includes(modelId) ? prev.selected_models.filter(id => id !== modelId) : [...prev.selected_models, modelId],
      selected_model: modelId
    }));
  };

  const handleCreateProvider = async () => {
    try {
      setIsCreating(true);
      const providerId = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const providerData = {
        id: providerId, name: provider.name, provider_type: provider.provider_type, auth_method: provider.auth_method,
        capabilities: provider.capabilities, is_active: provider.is_active,
        configuration: {
          api_endpoint: provider.api_endpoint, 
          api_key: provider.api_key, // CRITICAL: Save the API key!
          rate_limit: provider.rate_limit, timeout: provider.timeout,
          max_retries: provider.max_retries, temperature: provider.temperature, max_tokens: provider.max_tokens,
          priority: provider.priority, environment: provider.environment, specialization: provider.specialization,
          selected_models: provider.selected_models, 
          selected_model: provider.selected_model, // Save primary model
          tags: provider.tags, 
          description: provider.description, // Save description
          discovered_models: discoveredModels, // Save discovered models
          connection_tested: connectionTested,
          connection_latency: connectionLatency,
          created_at: new Date().toISOString(),
          wizard_version: '2.0'
        }
      };

      await onProviderCreate(providerData);
      toast({ title: '🎉 Provider Created Successfully', description: `${provider.name} is ready for use with ${provider.selected_models.length} models`, duration: 5000 });
      resetWizard();
      onClose();
    } catch (error: any) {
      toast({ title: '❌ Failed to Create Provider', description: error.message || 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const resetWizard = () => {
    setWizardStep(0); setSelectedTemplate(null); setConnectionTested(false); setDiscoveredModels([]);
    setConfigurationProgress(0); setConnectionLatency(null);
    setProvider({
      name: '', provider_type: 'grok', api_endpoint: '', auth_method: 'api_key', api_key: '',
      capabilities: [], description: '', is_active: true, specialization: 'general', selected_model: '',
      selected_models: [], rate_limit: 10000, timeout: 30000, max_retries: 3, temperature: 0.1,
      max_tokens: 4000, priority: 1, tags: [], environment: 'production'
    });
  };

  const canProceedToNextStep = () => {
    switch (wizardStep) {
      case 0: return !!selectedTemplate;
      case 1: return provider.api_key.trim().length > 0;
      case 2: return connectionTested;
      case 3: return provider.selected_models.length > 0;
      default: return false;
    }
  };

  const handleNextStep = () => {
    if (wizardStep === 1 && !connectionTested) {
      testConnection();
    } else if (wizardStep === 2 && discoveredModels.length === 0) {
      discoverModels();
    } else {
      setWizardStep(wizardStep + 1);
    }
  };

  const wizardSteps = [
    { step: 0, label: 'Provider', icon: Building2, completed: !!selectedTemplate },
    { step: 1, label: 'Connection', icon: Wifi, completed: connectionTested },
    { step: 2, label: 'Discovery', icon: Search, completed: discoveredModels.length > 0 },
    { step: 3, label: 'Models', icon: Brain, completed: provider.selected_models.length > 0 },
    { step: 4, label: 'Finalize', icon: CheckCircle2, completed: false }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden rounded-3xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white/60 to-purple-50/80 rounded-3xl" />
          <div className="relative z-10 p-8">
            <DialogHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      AI Provider Setup
                    </DialogTitle>
                    <DialogDescription className="text-lg text-gray-600 mt-1">
                      Connect and configure your AI provider with Apple-grade precision
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
                    Step {wizardStep + 1} of 5
                  </Badge>
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-700 ease-out" style={{ width: `${configurationProgress}%` }} />
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="mt-8 flex items-center justify-between px-4">
              {wizardSteps.map((step, index) => {
                const isActive = wizardStep === step.step;
                const isCompleted = step.completed;
                const isPast = wizardStep > step.step;
                const Icon = step.icon;
                
                return (
                  <div key={step.step} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isCompleted || isPast ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg scale-110'
                            : isActive ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                        {isCompleted || isPast ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={`text-sm font-medium mt-2 transition-all duration-300 ${
                        isActive ? 'text-blue-600' : isCompleted || isPast ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < wizardSteps.length - 1 && (
                      <div className={`w-20 h-0.5 mx-4 transition-all duration-500 ${
                        isPast ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Step Content */}
            <div className="mt-8 max-h-[60vh] overflow-y-auto scrollbar-hidden">
              {renderStepContent()}
            </div>

            {/* Apple-style Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-100">
              <Button variant="ghost" onClick={() => wizardStep > 0 ? setWizardStep(wizardStep - 1) : onClose()} className="text-gray-600 hover:text-gray-900 transition-colors">
                {wizardStep > 0 ? 'Previous' : 'Cancel'}
              </Button>
              
              <div className="flex gap-3">
                {wizardStep < 4 ? (
                  <Button onClick={() => handleNextStep()} disabled={!canProceedToNextStep()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2.5 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleCreateProvider} disabled={isCreating || provider.selected_models.length === 0}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-2.5 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100">
                    {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Provider'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  function renderStepContent() {
    switch (wizardStep) {
      case 0: return renderProviderSelection();
      case 1: return renderConnectionSetup();
      case 2: return renderModelDiscovery();
      case 3: return renderModelSelection();
      case 4: return renderFinalization();
      default: return null;
    }
  }

  function renderProviderSelection() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Choose Your AI Provider</h3>
          <p className="text-gray-600 text-lg">Select from our curated collection of premium AI providers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(PROVIDER_TEMPLATES).map(([key, template]) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate === key;
            
            return (
              <Card key={key} className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:scale-105 ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-lg'
                }`} onClick={() => selectTemplate(key)}>
                <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-10`} />
                <CardContent className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${template.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xl font-bold text-gray-900">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">{template.models_count} models</Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{template.description_full}</p>
                      
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {template.pros.slice(0, 3).map((pro, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{pro}</Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Starting at</span>
                          <span className="font-semibold text-gray-900">{template.pricing}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  function renderConnectionSetup() {
    const template = selectedTemplate ? PROVIDER_TEMPLATES[selectedTemplate] : null;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Setup Connection</h3>
          <p className="text-gray-600 text-lg">Configure your API credentials for {template?.name}</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Provider Name</Label>
                <Input value={provider.name} onChange={(e) => setProvider(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter a custom name for this provider" className="h-12 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">API Endpoint</Label>
                <Input value={provider.api_endpoint} onChange={(e) => setProvider(prev => ({ ...prev, api_endpoint: e.target.value }))}
                  placeholder="https://api.example.com/v1" className="h-12 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">API Key</Label>
                <div className="relative">
                  <Input type={showApiKey ? "text" : "password"} value={provider.api_key}
                    onChange={(e) => setProvider(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="Enter your API key" className="h-12 rounded-xl pr-12" />
                  <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={testConnection} disabled={!provider.api_key.trim() || isTesting}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">
                  {isTesting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testing Connection...</> : 
                    <><TestTube className="w-4 h-4 mr-2" />Test Connection</>}
                </Button>
                
                {connectionTested && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Connection successful!</span>
                      {connectionLatency && <Badge variant="outline" className="text-xs">{connectionLatency}ms</Badge>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function renderModelDiscovery() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Discover Models</h3>
          <p className="text-gray-600 text-lg">Find all available models from your provider</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                <Brain className="w-12 h-12 text-purple-600" />
              </div>
              
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Ready to Discover Models</h4>
                <p className="text-gray-600">We'll scan your provider's API to find all available models and automatically select the best ones for your use case.</p>
              </div>

              <Button onClick={discoverModels} disabled={!connectionTested || isDiscovering}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl">
                {isDiscovering ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Discovering Models...</> : 
                  <><Search className="w-4 h-4 mr-2" />Discover Models</>}
              </Button>

              {discoveredModels.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Found {discoveredModels.length} models!</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function renderModelSelection() {
    const filteredModels = discoveredModels.filter(model => 
      model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Select Models</h3>
          <p className="text-gray-600 text-lg">Choose which models to enable for your provider</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search models..." value={modelSearchQuery} onChange={(e) => setModelSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl" />
            </div>
            <Badge variant="outline" className="px-3 py-2">{provider.selected_models.length} selected</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {filteredModels.map((model) => {
              const isSelected = provider.selected_models.includes(model.id);
              const isPrimary = provider.selected_model === model.id;
              
              return (
                <Card key={model.id} className={`transition-all duration-200 cursor-pointer hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`} onClick={() => toggleModelSelection(model.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{model.name}</h4>
                            {isPrimary && <Badge variant="default" className="text-xs">Primary</Badge>}
                          </div>
                          <div className="flex gap-1">
                            {model.capabilities?.slice(0, 3).map((cap: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">{cap}</Badge>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Context: {(model.context_length || 0).toLocaleString()}</span>
                          <span>Cost: ${model.cost_per_1k_tokens || 0}/1K tokens</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderFinalization() {
    const template = selectedTemplate ? PROVIDER_TEMPLATES[selectedTemplate] : null;

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Review & Create</h3>
          <p className="text-gray-600 text-lg">Review your configuration and create the provider</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Configuration Summary</h4>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium">{provider.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{template?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Models Selected:</span>
                <span className="font-medium">{provider.selected_models.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Primary Model:</span>
                <span className="font-medium">{provider.selected_model || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <Badge variant="outline">{provider.environment}</Badge>
              </div>
              {connectionLatency && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection Latency:</span>
                  <Badge variant="outline">{connectionLatency}ms</Badge>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-semibold text-green-900">Ready to Create</h4>
            </div>
            <p className="text-green-700 text-sm">
              Your provider configuration is complete and ready to be created. The provider will be immediately available for use in your applications.
            </p>
          </Card>
        </div>
      </div>
    );
  }
};