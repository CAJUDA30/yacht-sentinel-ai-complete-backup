import React, { useState, useEffect } from 'react';
import { useAIModels } from '@/hooks/useAIModels';
import { modelDiscoveryService, type ModelDiscoveryResult } from '@/services/modelDiscoveryService';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  Building2, 
  Plus, 
  Settings, 
  RefreshCw, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Zap,
  Cpu,
  TestTube,
  WifiOff,
  Wifi,
  Star,
  ChevronRight,
  Target,
  Workflow,
  Globe,
  Search,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Check,
  ArrowRight,
  Database,
  Rocket,
  Timer,
  TrendingUp,
  Lock,
  Unlock
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface WizardProviderSetupProps {
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

// Apple-grade provider templates with enhanced configurations
const PROVIDER_TEMPLATES: Record<string, Partial<EnhancedProviderConfig> & { 
  icon: any; 
  color: string; 
  gradient: string;
  description_full: string;
  pros: string[];
  pricing: string;
  models_count: number;
}> = {
  grok: {
    name: 'Grok by xAI',
    provider_type: 'grok',
    api_endpoint: 'https://api.x.ai/v1',
    auth_method: 'api_key',
    capabilities: ['text_generation', 'chat_completion', 'vision', 'function_calling'],
    specialization: 'general',
    rate_limit: 10000,
    timeout: 30000,
    max_retries: 3,
    temperature: 0.1,
    max_tokens: 131072,
    priority: 1,
    environment: 'production',
    icon: Rocket,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-600',
    description_full: 'xAI\'s cutting-edge model with real-time web access and enhanced reasoning capabilities',
    pros: ['Real-time web access', 'Advanced reasoning', 'Large context window', 'Vision capabilities'],
    pricing: '$2.00 per 1M tokens',
    models_count: 4
  },
  openai: {
    name: 'OpenAI',
    provider_type: 'openai',
    api_endpoint: 'https://api.openai.com/v1',
    auth_method: 'api_key',
    capabilities: ['text_generation', 'vision', 'function_calling', 'code_generation'],
    specialization: 'general',
    rate_limit: 10000,
    timeout: 30000,
    max_retries: 3,
    temperature: 0.7,
    max_tokens: 128000,
    priority: 2,
    environment: 'production',
    icon: Brain,
    color: 'text-green-600',
    gradient: 'from-green-500 to-blue-600',
    description_full: 'Industry-leading AI models with multimodal capabilities and function calling',
    pros: ['Most reliable', 'Multimodal support', 'Function calling', 'Large ecosystem'],
    pricing: '$10.00 per 1M tokens',
    models_count: 8
  },
  anthropic: {
    name: 'Anthropic Claude',
    provider_type: 'anthropic',
    api_endpoint: 'https://api.anthropic.com',
    auth_method: 'api_key',
    capabilities: ['text_generation', 'analysis', 'long_context', 'safety'],
    specialization: 'document_analysis',
    rate_limit: 4000,
    timeout: 30000,
    max_retries: 3,
    temperature: 0.3,
    max_tokens: 200000,
    priority: 3,
    environment: 'production',
    icon: Shield,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-600',
    description_full: 'Safety-focused AI with exceptional reasoning and massive context windows',
    pros: ['Largest context window', 'Safety-focused', 'Excellent reasoning', 'Document analysis'],
    pricing: '$15.00 per 1M tokens',
    models_count: 6
  },
  google: {
    name: 'Google Gemini',
    provider_type: 'google',
    api_endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    auth_method: 'api_key',
    capabilities: ['text_generation', 'vision', 'multimodal', 'code_generation'],
    specialization: 'general',
    rate_limit: 15000,
    timeout: 30000,
    max_retries: 3,
    temperature: 0.4,
    max_tokens: 1000000,
    priority: 4,
    environment: 'production',
    icon: Globe,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-purple-600',
    description_full: 'Google\'s flagship multimodal AI with massive context and coding expertise',
    pros: ['Massive context', 'Multimodal', 'Fast processing', 'Free tier available'],
    pricing: '$7.00 per 1M tokens',
    models_count: 5
  }
};



export const WizardProviderSetup: React.FC<WizardProviderSetupProps> = ({ 
  isOpen, 
  onClose, 
  onProviderCreate 
}) => {
  const { toast } = useToast();
  const { getAvailableModelsGrouped, isLoading: isLoadingModels } = useAIModels();
  const [wizardStep, setWizardStep] = useState(0); // Start with provider selection
  const [connectionTested, setConnectionTested] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<any[]>([]);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [configurationProgress, setConfigurationProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Get available models from database
  const AVAILABLE_MODELS = getAvailableModelsGrouped();
  
  const [provider, setProvider] = useState<EnhancedProviderConfig>({
    name: '',
    provider_type: 'grok',
    api_endpoint: 'https://api.x.ai/v1',
    auth_method: 'api_key',
    api_key: '',
    capabilities: ['text_generation', 'chat_completion', 'mapping', 'data_extraction'],
    description: '',
    is_active: true,
    specialization: 'mapping',
    selected_model: '',
    selected_models: [],
    rate_limit: 10000,
    timeout: 30000,
    max_retries: 3,
    temperature: 0.1,
    max_tokens: 4000,
    priority: 1,
    tags: [],
    environment: 'production'
  });

  const validateApiKey = (apiKey: string): boolean => {
    if (!apiKey || apiKey.length === 0) return false;
    const safePattern = /^[\x20-\x7E]+$/;
    return safePattern.test(apiKey.trim());
  };

  // Apple-grade smooth animations and real-time updates
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
    setProvider(prev => ({
      ...prev,
      ...template,
      name: template.name || '',
      provider_type: template.provider_type || 'grok',
      api_endpoint: template.api_endpoint || '',
      auth_method: template.auth_method || 'api_key',
      capabilities: template.capabilities || [],
      specialization: template.specialization || 'general',
      rate_limit: template.rate_limit || 10000,
      timeout: template.timeout || 30000,
      max_retries: template.max_retries || 3,
      temperature: template.temperature || 0.1,
      max_tokens: template.max_tokens || 4000,
      priority: template.priority || 1,
      environment: template.environment || 'production'
    }));
    setWizardStep(1);
    
    // Smooth notification
    toast({
      title: `✨ ${template.name} Selected`,
      description: `Ready to configure your ${template.name} provider`,
      duration: 3000
    });
  };

  const testConnection = async () => {
    if (!provider.api_key.trim()) {
      toast({
        title: '🔑 API Key Required',
        description: 'Please enter your API key to test the connection',
        variant: 'destructive'
      });
      return false;
    }

    const startTime = performance.now();
    try {
      // Use the enhanced testProviderConnection function that handles all provider types
      const testProvider = {
        id: 'test-provider',
        name: provider.name || 'Test Provider',
        provider_type: provider.provider_type,
        api_endpoint: provider.api_endpoint,
        configuration: {
          auth_method: provider.auth_method
        }
      };
      
      // Import the enhanced testProviderConnection function
      const { testProviderConnection } = await import('@/services/debugConsole');
      const result = await testProviderConnection(testProvider, provider.api_key.trim());
      
      const latency = Math.round(performance.now() - startTime);
      setConnectionLatency(result.latency || latency);
      
      if (result.success) {
        setConnectionTested(true);
        
        // Success notification with performance metrics
        toast({
          title: '✨ Connection Successful',
          description: `API endpoint reachable • ${result.latency || latency}ms latency • Ready for model discovery`,
          duration: 4000
        });
        
        // Auto-advance to next step
        setTimeout(() => setWizardStep(2), 1500);
        return true;
      } else {
        toast({
          title: '❌ Connection Failed',
          description: result.error || 'Unable to reach API endpoint',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error: any) {
      setConnectionLatency(null);
      
      // Always show real error - no development mode bypass
      toast({
        title: '❌ Connection Failed',
        description: `Unable to reach API endpoint: ${error.message}`,
        variant: 'destructive'
      });
      return false;
    }
  };

  const discoverModels = async () => {
    if (!connectionTested || !provider.api_key) {
      toast({
        title: '🔌 Connection Required',
        description: 'Please test the connection first before discovering models',
        variant: 'destructive'
      });
      return;
    }

    setIsDiscovering(true);
    try {
      // Real-time model discovery with progress feedback
      const result: ModelDiscoveryResult = await modelDiscoveryService.discoverModels(
        provider.provider_type, 
        provider.api_key
      );

      if (result.success && result.models.length > 0) {
        setDiscoveredModels(result.models);
        
        // Auto-select intelligent defaults based on provider type
        const defaultModels = result.models
          .filter(model => {
            const id = model.id.toLowerCase();
            if (provider.provider_type === 'grok') return id.includes('grok-beta') || id.includes('grok-2');
            if (provider.provider_type === 'openai') return id.includes('gpt-4') && !id.includes('vision');
            if (provider.provider_type === 'anthropic') return id.includes('claude-3-5');
            return true;
          })
          .slice(0, 2)
          .map(m => m.id);
          
        setProvider(prev => ({
          ...prev,
          selected_models: defaultModels,
          selected_model: defaultModels[0] || result.models[0]?.id
        }));
        
        // Save discovered models to database for future use
        await saveDiscoveredModelsToDatabase(result.models);
        
        toast({
          title: `🚀 Discovered ${result.models.length} Models`,
          description: `Found ${result.models.length} available models • ${defaultModels.length} pre-selected • Ready for configuration`,
          duration: 6000
        });
        
        // Auto-advance to model selection
        setTimeout(() => setWizardStep(3), 2000);
      } else {
        toast({
          title: '📋 No Models Found',
          description: result.error || 'No models could be discovered from this provider',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: '⚠️ Discovery Failed',
        description: `Model discovery failed: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const saveDiscoveredModelsToDatabase = async (models: any[]) => {
    try {
      // Skip database saving for now - will be handled during provider creation
      console.log(`Discovered ${models.length} models for future integration`);
    } catch (error) {
      console.warn('Error saving discovered models:', error);
    }
  };

  const toggleModelSelection = (modelId: string) => {
    setProvider(prev => ({
      ...prev,
      selected_models: prev.selected_models.includes(modelId)
        ? prev.selected_models.filter(id => id !== modelId)
        : [...prev.selected_models, modelId],
      selected_model: modelId // Update primary model
    }));
  };

  const handleCreateProvider = async () => {
    try {
      setIsCreating(true);
      
      // Generate unique provider ID to fix undefined issue
      const providerId = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create unified provider data structure compatible with ProviderConfigurationModal
      const providerData = {
        id: providerId,
        name: provider.name,
        provider_type: provider.provider_type,
        api_endpoint: provider.api_endpoint,
        auth_method: provider.auth_method,
        capabilities: provider.capabilities,
        is_active: provider.is_active,
        configuration: {
          // Core configuration
          api_key: provider.api_key, // Store API key for unified system
          auth_method: provider.auth_method,
          capabilities: provider.capabilities,
          specialization: provider.specialization,
          selected_models: provider.selected_models,
          discovered_models: discoveredModels.map(m => m.id || m), // Ensure string format
          
          // Model configuration
          selected_model: provider.selected_model,
          model_limits: {},
          custom_headers: {},
          timeout: provider.timeout,
          max_tokens: provider.max_tokens,
          temperature: provider.temperature,
          
          // Unified system metadata
          last_model_detection: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          wizard_created: true, // Mark as created by wizard
          
          // Wizard data for synchronization with ProviderConfigurationModal
          wizard_data: {
            initial_models: provider.selected_models,
            setup_date: new Date().toISOString(),
            setup_user: 'current_user', // Could be enhanced with actual user ID
            template_used: selectedTemplate,
            connection_tested: connectionTested,
            connection_latency: connectionLatency,
            specialization: provider.specialization,
            environment: provider.environment,
            wizard_version: '3.0_unified'
          }
        },
        
        // Legacy config structure for backward compatibility
        config: {
          id: providerId,
          api_endpoint: provider.api_endpoint,
          endpoints: {
            chat: provider.api_endpoint + '/chat/completions',
            test: provider.api_endpoint + '/models'
          },
          auth: {
            header_name: 'Authorization',
            token_prefix: 'Bearer',
            secret_name: provider.api_key
          },
          defaults: {
            temperature: provider.temperature || 0.1,
            max_tokens: provider.max_tokens || 2000,
            timeout: provider.timeout || 60000,
            max_retries: provider.max_retries || 3,
            model: provider.selected_model
          },
          enhanced: {
            specialization: provider.specialization,
            description: provider.description,
            wizard_completed: true,
            created_at: new Date().toISOString()
          },
          // Include selected models in legacy format
          selected_models: provider.selected_models,
          discovered_models: discoveredModels
        },
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('🎨 Creating unified provider with structure:', {
        id: providerId,
        name: provider.name,
        provider_type: provider.provider_type,
        has_configuration: !!providerData.configuration,
        has_wizard_data: !!providerData.configuration.wizard_data,
        selected_models_count: provider.selected_models.length,
        discovered_models_count: discoveredModels.length,
        wizard_created: providerData.configuration.wizard_created,
        compatibility: 'ProviderConfigurationModal_ready'
      });

      await onProviderCreate(providerData);
      
      // Store enhanced configuration for persistence and debugging
      localStorage.setItem(`unified_provider_${providerId}`, JSON.stringify({
        id: providerId,
        ...providerData,
        debug_info: {
          created_via: 'WizardProviderSetup',
          unified_structure: true,
          config_modal_compatible: true,
          wizard_sync_enabled: true
        }
      }));
      
      toast({
        title: '🚀 Unified Provider Created Successfully',
        description: `${provider.name} is ready with ${provider.selected_models.length} models and full synchronization support`,
        duration: 6000
      });

      // Navigate to visual mapping if mapping specialization
      if (provider.specialization === 'mapping') {
        const shouldConfigureMapping = window.confirm(
          'Provider created successfully! Would you like to configure document mapping now in the Visual Mapping page?'
        );
        
        if (shouldConfigureMapping) {
          localStorage.setItem('pending_mapping_provider', JSON.stringify({
            id: providerId,
            name: provider.name,
            type: provider.provider_type,
            model: provider.selected_model
          }));
          
          toast({
            title: 'Navigate to Visual Mapping',
            description: 'Go to the Visual Mapping page to configure document processing',
            duration: 7000
          });
        }
      }

      // Reset and close
      resetForm();
      onClose();
      
    } catch (error: any) {
      toast({
        title: 'Failed to Create Provider',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setProvider({
      name: '',
      provider_type: 'grok',
      api_endpoint: 'https://api.x.ai/v1',
      auth_method: 'api_key',
      api_key: '',
      capabilities: ['text_generation', 'chat_completion', 'mapping', 'data_extraction'],
      description: '',
      is_active: true,
      specialization: 'mapping',
      selected_model: 'grok-4-fast-reasoning',
      selected_models: ['grok-4-fast-reasoning']
    });
    setWizardStep(1);
    setConnectionTested(false);
  };

  const wizardSteps = [
    { step: 1, label: 'Connection', icon: Wifi, completed: connectionTested },
    { step: 2, label: 'Configuration', icon: Settings, completed: false },
    { step: 3, label: 'Models', icon: Brain, completed: false },
    { step: 4, label: 'Finalize', icon: CheckCircle2, completed: false }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Enhanced AI Provider Setup Wizard
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-600 mt-2">
              Step-by-step configuration for AI providers with yacht document mapping capabilities.
            </DialogDescription>
            
            {/* Progress Steps */}
            <div className="mt-6 flex items-center justify-between">
              {wizardSteps.map((stepItem, index) => {
                const isActive = wizardStep === stepItem.step;
                const isCompleted = stepItem.completed;
                const Icon = stepItem.icon;
                
                return (
                  <div key={stepItem.step} className="flex items-center">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-blue-100 text-blue-700' : 
                      isCompleted ? 'bg-green-100 text-green-700' : 
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-blue-500 text-white' :
                        isCompleted ? 'bg-green-500 text-white' :
                        'bg-neutral-300 text-neutral-600'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepItem.step}
                      </div>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{stepItem.label}</span>
                    </div>
                    {index < wizardSteps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-neutral-400 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </DialogHeader>
        
          {/* Step Content */}
          <div className="space-y-6">
            {/* Step 1: Connection */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wifi className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">Step 1: Connection Setup</h3>
                  <p className="text-neutral-600">Configure API connection and test connectivity</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Provider Name</Label>
                      <Input
                        value={provider.name}
                        onChange={(e) => setProvider(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Grok Yacht Mapper"
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Provider Type</Label>
                      <Select
                        value={provider.provider_type}
                        onValueChange={(value: any) => setProvider(prev => ({ 
                          ...prev, 
                          provider_type: value,
                          api_endpoint: value === 'grok' ? 'https://api.x.ai/v1' : prev.api_endpoint
                        }))}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grok">Grok AI (X.AI)</SelectItem>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">API Endpoint</Label>
                    <Input
                      value={provider.api_endpoint}
                      onChange={(e) => setProvider(prev => ({ ...prev, api_endpoint: e.target.value }))}
                      className="h-12 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">API Key</Label>
                    <Input
                      type="password"
                      value={provider.api_key}
                      onChange={(e) => setProvider(prev => ({ ...prev, api_key: e.target.value }))}
                      placeholder="Enter your API key"
                      className="h-12 rounded-xl"
                    />
                    {provider.api_key && !validateApiKey(provider.api_key) && (
                      <p className="text-xs text-red-600">
                        ⚠️ API key contains invalid characters
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      onClick={testConnection}
                      disabled={!provider.api_key || !provider.name}
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                    {connectionTested && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Connection verified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" disabled>Previous</Button>
                  <Button 
                    onClick={() => setWizardStep(2)}
                    disabled={!provider.name || !provider.api_key}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next: Configuration
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">Step 2: Provider Configuration</h3>
                  <p className="text-neutral-600">Set up specialization and capabilities</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Specialization</Label>
                    <Select
                      value={provider.specialization}
                      onValueChange={(value: any) => setProvider(prev => ({ ...prev, specialization: value }))}
                    >
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mapping">Document Mapping & Field Extraction</SelectItem>
                        <SelectItem value="general">General Purpose AI Assistant</SelectItem>
                        <SelectItem value="document_analysis">Document Analysis & Processing</SelectItem>
                        <SelectItem value="data_extraction">Data Extraction & Validation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      value={provider.description}
                      onChange={(e) => setProvider(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this provider's capabilities..."
                      className="min-h-[80px] rounded-xl"
                    />
                  </div>

                  {provider.specialization === 'mapping' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Yacht Document Mapping</h4>
                          <p className="text-sm text-blue-700">
                            This provider will be specialized for extracting yacht information from certificates of registry, 
                            survey reports, and insurance documents. Document mapping will be configured in the Visual Mapping page.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setWizardStep(1)}>
                    <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                    Previous
                  </Button>
                  <Button 
                    onClick={() => setWizardStep(3)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Next: Model Selection
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Enhanced Multi-Model Selection */}
            {wizardStep === 3 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                    Multi-Model Discovery & Selection
                  </h3>
                  <p className="text-gray-600 text-lg">Discover and select multiple models for your provider</p>
                </div>

                {/* Model Discovery Section */}
                <div className="p-6 bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm border border-white/20 shadow-lg rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Search className="w-5 h-5 text-purple-600" />
                        Model Discovery
                      </h4>
                      <p className="text-gray-600">
                        {discoveredModels.length > 0 
                          ? `Found ${discoveredModels.length} models • ${provider.selected_models.length} selected`
                          : 'Discover all available models from your API provider'
                        }
                      </p>
                    </div>
                    <Button
                      onClick={discoverModels}
                      disabled={!connectionTested || isDiscovering}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl h-12 px-6 shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      {isDiscovering ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Discovering...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Discover Models
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Display discovered models or fallback to database models */}
                  {discoveredModels.length > 0 ? (
                    <>
                      {/* Search Bar */}
                      <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          placeholder="Search models by name, type, or capabilities..."
                          className="pl-12 h-12 rounded-xl border-0 bg-white/60 backdrop-blur-sm shadow-sm text-lg"
                        />
                      </div>

                      {/* Apple-style Models Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                        {discoveredModels
                          .filter(model => 
                            model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
                            model.id.toLowerCase().includes(modelSearchQuery.toLowerCase())
                          )
                          .map((model) => {
                            const isSelected = provider.selected_models.includes(model.id);
                            return (
                              <div
                                key={model.id}
                                onClick={() => toggleModelSelection(model.id)}
                                className={`group p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                  isSelected
                                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 shadow-xl scale-105 ring-2 ring-blue-200'
                                    : 'border-gray-200 bg-white/80 hover:border-purple-300 hover:shadow-lg hover:scale-102'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        model.model_type === 'vision' ? 'bg-purple-500' :
                                        model.model_type === 'chat' ? 'bg-green-500' :
                                        'bg-blue-500'
                                      }`} />
                                      <h5 className="font-bold text-sm text-gray-900">{model.name}</h5>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        model.model_type === 'vision' ? 'bg-purple-100 text-purple-700' :
                                        model.model_type === 'chat' ? 'bg-green-100 text-green-700' :
                                        'bg-blue-100 text-blue-700'
                                      }`}>
                                        {model.model_type}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{model.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        ⚡ {model.context_length?.toLocaleString() || 'N/A'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        💰 ${(model.cost_per_1k_tokens * 1000).toFixed(3)}/1M
                                      </span>
                                    </div>
                                  </div>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isSelected 
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-110 shadow-lg' 
                                      : 'bg-gray-200 group-hover:bg-gray-300'
                                  }`}>
                                    {isSelected ? (
                                      <CheckCircle2 className="w-4 h-4 text-white" />
                                    ) : (
                                      <Plus className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </>
                  ) : (
                    /* Fallback to database models */
                    <div className="space-y-3">
                      {isLoadingModels ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                          <span className="text-neutral-600">Loading available models...</span>
                        </div>
                      ) : AVAILABLE_MODELS[provider.provider_type]?.length > 0 ? (
                        AVAILABLE_MODELS[provider.provider_type].map((model) => (
                          <div
                            key={model.id}
                            onClick={() => toggleModelSelection(model.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              provider.selected_models.includes(model.id)
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-neutral-200 bg-white hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-sm mb-1">{model.name}</h5>
                                <p className="text-xs text-neutral-600 mb-2">{model.description}</p>
                                <div className="flex items-center gap-4 text-xs text-neutral-500">
                                  <span>Context: {model.context_length.toLocaleString()} tokens</span>
                                  <span>Cost: ${(model.cost_per_1k_tokens * 1000).toFixed(3)}/1M tokens</span>
                                </div>
                              </div>
                              {provider.selected_models.includes(model.id) && (
                                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                          <h4 className="font-semibold text-neutral-900 mb-2">No Models Available</h4>
                          <p className="text-sm text-neutral-600 mb-4">
                            No models found for {provider.provider_type}. Try discovering models from the API.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selection Summary */}
                  {provider.selected_models.length > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-bold text-green-900">
                          {provider.selected_models.length} Model{provider.selected_models.length > 1 ? 's' : ''} Selected
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        Multi-model setup allows different models for different tasks, document types, and complexity levels.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setWizardStep(2)} className="rounded-xl h-12 px-8">
                    <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                    Previous
                  </Button>
                  <Button 
                    onClick={() => setWizardStep(4)}
                    disabled={provider.selected_models.length === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 px-8 shadow-lg"
                  >
                    Next: Finalize
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Finalize */}
            {wizardStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">Step 4: Review & Create</h3>
                  <p className="text-neutral-600">Review your configuration and create the provider</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-neutral-50 rounded-xl">
                    <h4 className="font-semibold mb-3">Provider Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Name:</strong> {provider.name}</div>
                      <div><strong>Type:</strong> {provider.provider_type}</div>
                      <div><strong>Specialization:</strong> {provider.specialization}</div>
                      <div><strong>Models:</strong> {provider.selected_models.length} selected ({provider.selected_models.join(', ')})</div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Ready to Create</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your provider is configured and ready to be created. After creation, you can configure document mapping in the Visual Mapping page.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setWizardStep(3)}>
                    <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                    Previous
                  </Button>
                  <Button 
                    onClick={handleCreateProvider}
                    disabled={isCreating}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating Provider...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Create Provider
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};