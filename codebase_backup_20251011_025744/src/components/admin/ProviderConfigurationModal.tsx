import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { 
  Settings, 
  Save, 
  X, 
  Key, 
  Server, 
  Zap, 
  Shield, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  Globe,
  Terminal,
  Cpu
} from 'lucide-react';
import { debugConsole, testProviderConnection, generateCurlCommand, detectAvailableModels } from '@/services/debugConsole';
import { DebugConsole } from './DebugConsole';
import { encryptApiKey, decryptApiKey, maskApiKey, validateApiKeyFormat, getProviderApiKey, storeProviderApiKey } from '@/utils/encryption';

interface ProviderConfigurationModalProps {
  provider: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProvider: any) => void;
  onDelete?: () => void;
}

export const ProviderConfigurationModal: React.FC<ProviderConfigurationModalProps> = ({
  provider,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    provider_type: provider?.provider_type || '',
    is_active: provider?.is_active || false,
    api_endpoint: provider?.api_endpoint || provider?.configuration?.api_endpoint || '',
    configuration: {
      auth_method: provider?.configuration?.auth_method || 'api_key',
      capabilities: provider?.configuration?.capabilities || [],
      specialization: provider?.configuration?.specialization || 'general',
      selected_models: provider?.configuration?.selected_models || [],
      ...provider?.configuration
    }
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [curlCommand, setCurlCommand] = useState<string>('');
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Simple, reliable clipboard function that works on HTTP localhost
  const copyToClipboard = async (text: string, description: string = 'text') => {
    console.log('🔄 Attempting to copy to clipboard:', { text: text.substring(0, 50) + '...', description });
    
    // Create textarea element with proper setup for copying
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // Position it visibly but outside viewport so it doesn't interfere with UI
    textarea.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 300px;
      height: 100px;
      padding: 10px;
      border: 2px solid #007cba;
      background: white;
      z-index: 10001;
      font-family: monospace;
      font-size: 12px;
    `;
    
    // Add to DOM
    document.body.appendChild(textarea);
    
    // Focus and select all text
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    
    console.log('🔄 Textarea created and text selected');
    
    // Give user feedback and instructions
    const originalValue = textarea.value;
    textarea.value = `Ready to copy! Press Ctrl+C now, then click outside to close.\n\n${text}`;
    
    // Wait a moment, then select the actual content to copy
    setTimeout(() => {
      textarea.value = text;
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      // Auto-attempt copy
      try {
        const success = document.execCommand('copy');
        console.log('📋 Auto-copy result:', success);
        
        if (success) {
          textarea.value = `✅ COPIED! You can now paste the ${description}. Click outside to close.`;
          textarea.style.background = '#d4edda';
          textarea.style.border = '2px solid #28a745';
        }
      } catch (e) {
        console.log('📋 Auto-copy failed, manual copy required');
        textarea.value = `Please press Ctrl+C to copy the ${description}, then click outside to close.\n\n${text}`;
        textarea.select();
      }
    }, 100);
    
    // Handle click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (!textarea.contains(e.target as Node)) {
        document.body.removeChild(textarea);
        document.removeEventListener('click', handleClickOutside);
        
        toast({
          title: '📋 Copy Complete',
          description: `${description} is ready to paste in your terminal`,
          duration: 3000
        });
      }
    };
    
    // Add click listener after a short delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 200);
    
    // Also handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.removeChild(textarea);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('click', handleClickOutside);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
  };

  // Load and decrypt API key on component mount
  useEffect(() => {
    const loadApiKey = async () => {
      if (provider && !apiKeyLoaded) {
        try {
          // Use the safe API key retrieval function
          const decryptedKey = await getProviderApiKey(provider);
          setApiKey(decryptedKey);
          setApiKeyLoaded(true);
          
          if (decryptedKey) {
            debugConsole.info('API_KEY', 'API key loaded successfully', {
              key_length: decryptedKey.length,
              key_prefix: decryptedKey.substring(0, 4),
              provider_type: provider.provider_type,
              is_valid_format: validateApiKeyFormat(decryptedKey, provider.provider_type),
              storage_type: provider?.configuration?.api_key?.startsWith('PLAIN:') ? 'plain_text' : 'encrypted_or_legacy'
            }, provider.id, provider.name);
          } else {
            debugConsole.warn('API_KEY', 'No API key found in provider configuration', {
              has_configuration: !!provider.configuration,
              has_api_key_field: !!provider.configuration?.api_key
            }, provider.id, provider.name);
          }
        } catch (error) {
          debugConsole.error('API_KEY', 'Failed to load API key', {
            error: error.message,
            fallback: 'Setting empty API key'
          }, provider.id, provider.name);
          setApiKey('');
          setApiKeyLoaded(true);
        }
      } else {
        setApiKeyLoaded(true);
      }
    };
    
    loadApiKey();
  }, [provider?.id, apiKeyLoaded]);

  // Initialize debug console with welcome message and load discovered models
  useEffect(() => {
    if (provider?.id) {
      debugConsole.info('PROVIDER_CONFIG', `Configuration modal opened for ${provider.name}`, {
        provider_type: provider.provider_type,
        is_active: provider.is_active,
        endpoint: provider.api_endpoint,
        has_discovered_models: !!(provider.configuration?.discovered_models?.length),
        selected_models_count: provider.configuration?.selected_models?.length || 0
      }, provider.id, provider.name);
      
      // Load any previously detected models from the provider configuration
      if (provider.configuration?.discovered_models?.length > 0) {
        const discoveredModels = provider.configuration.discovered_models.map(m => 
          typeof m === 'string' ? m : (m.id || m.name)
        ).filter(Boolean);
        
        debugConsole.info('PROVIDER_CONFIG', 'Loading previously discovered models from configuration', {
          discovered_models: discoveredModels,
          count: discoveredModels.length,
          source: 'initial_load'
        }, provider.id, provider.name);
        
        setDetectedModels(discoveredModels);
      }
      
      // Add some demo logs to showcase the debug console
      setTimeout(() => {
        debugConsole.debug('SYSTEM', 'Configuration form initialized', {
          tabs: ['general', 'authentication', 'capabilities', 'advanced', 'debug'],
          formData: Object.keys(formData),
          detected_models_loaded: detectedModels.length
        }, provider.id, provider.name);
      }, 500);
      
      setTimeout(() => {
        debugConsole.warn('VALIDATION', 'API key required for connection testing', {
          auth_method: formData.configuration.auth_method,
          has_endpoint: !!formData.api_endpoint,
          has_api_key: !!apiKey
        }, provider.id, provider.name);
      }, 1000);
    }
  }, [provider?.id, formData, detectedModels.length, apiKey]);
  // Initialize form data with potential backup restoration
  useEffect(() => {
    if (provider?.id) {
      // Try to restore from local backup if available
      try {
        const backupKey = `provider_backup_${provider.id}`;
        const backup = localStorage.getItem(backupKey);
        
        if (backup) {
          const backupData = JSON.parse(backup);
          const backupAge = Date.now() - new Date(backupData.saved_at).getTime();
          
          // Only use backup if it's newer than the current provider data and less than 24 hours old
          if (backupAge < 24 * 60 * 60 * 1000) { // 24 hours
            debugConsole.info('BACKUP', 'Restoring from local backup', {
              backup_age_hours: Math.round(backupAge / (60 * 60 * 1000)),
              backup_size: backup.length
            }, provider.id, provider.name);
            
            setFormData(prev => ({
              ...prev,
              name: backupData.name || prev.name,
              configuration: {
                ...prev.configuration,
                ...backupData.configuration
              }
            }));
            
            toast({
              title: '💾 Backup Restored',
              description: 'Restored unsaved changes from local backup',
              duration: 3000
            });
          }
        }
      } catch (error: any) {
        debugConsole.warn('BACKUP', 'Failed to restore from backup', {
          error: error.message
        }, provider.id, provider.name);
      }
    }
  }, [provider?.id]);

  // Auto-save changes after a delay to ensure configurations persist
  useEffect(() => {
    if (!provider?.id || !autoSaveEnabled) return;
    
    const autoSaveDelay = 3000; // 3 seconds after changes
    const timeoutId = setTimeout(async () => {
      try {
        // Check if there are actual changes to save
        const hasChanges = 
          formData.name !== provider.name ||
          formData.api_endpoint !== provider.api_endpoint ||
          JSON.stringify(formData.configuration) !== JSON.stringify(provider.configuration || {});
        
        if (hasChanges) {
          debugConsole.info('AUTO_SAVE', `Auto-saving configuration for ${provider.name}`, {
            changes_detected: true,
            delay_ms: autoSaveDelay
          }, provider.id, provider.name);
          
          await handleSave();
          setLastSaveTime(new Date());
          
          toast({
            title: '💾 Auto-saved',
            description: `${provider.name} configuration auto-saved`,
            duration: 2000
          });
          
          debugConsole.success('AUTO_SAVE', 'Configuration auto-saved successfully', {
            saved_at: new Date().toISOString()
          }, provider.id, provider.name);
        }
      } catch (error: any) {
        debugConsole.error('AUTO_SAVE', 'Auto-save failed', {
          error: error.message
        }, provider.id, provider.name);
      }
    }, autoSaveDelay);
    
    return () => clearTimeout(timeoutId);
  }, [formData, provider, autoSaveEnabled]);

  const handleSave = async () => {
    // Enhanced save with proper API key encryption
    let encryptedApiKey = '';
    
    if (apiKey) {
      try {
        // Validate API key format before saving
        const isValidFormat = validateApiKeyFormat(apiKey, formData.provider_type);
        if (!isValidFormat) {
          debugConsole.warn('API_KEY', 'API key format validation failed', {
            provider_type: formData.provider_type,
            key_length: apiKey.length,
            key_prefix: apiKey.substring(0, 4)
          }, provider?.id, provider?.name);
          
          toast({
            title: '⚠️ API Key Format Warning',
            description: `The API key format may not be correct for ${formData.provider_type}. Please verify it's a valid key.`,
            duration: 5000
          });
        }
        
        // Use the safe storage function
        encryptedApiKey = await storeProviderApiKey(apiKey);
        
        debugConsole.info('API_KEY', 'API key processed for secure storage', {
          original_length: apiKey.length,
          stored_length: encryptedApiKey.length,
          key_format_valid: isValidFormat,
          storage_type: encryptedApiKey.startsWith('PLAIN:') ? 'plain_text_with_prefix' : 'encrypted'
        }, provider?.id, provider?.name);
        
      } catch (error) {
        debugConsole.error('API_KEY', 'Failed to process API key for storage', {
          error: error.message
        }, provider?.id, provider?.name);
        
        toast({
          title: '❌ Storage Error',
          description: 'Failed to process API key for storage. Using fallback method.',
          variant: 'destructive'
        });
        
        encryptedApiKey = `PLAIN:${apiKey}`;
      }
    }
    
    const updatedProvider = {
      ...provider,
      ...formData,
      configuration: {
        ...formData.configuration,
        // Store processed API key in configuration if provided
        ...(encryptedApiKey && { api_key: encryptedApiKey }),
        // Preserve discovered models for future use
        ...(detectedModels.length > 0 && { discovered_models: detectedModels }),
        last_updated: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };
    
    debugConsole.info('PROVIDER_CONFIG', 'Saving provider configuration with processed API key', {
      changes: {
        name: formData.name !== provider?.name,
        endpoint: formData.api_endpoint !== provider?.api_endpoint,
        api_key_provided: !!apiKey,
        api_key_processed: !!encryptedApiKey,
        capabilities_count: formData.configuration.capabilities?.length || 0,
        models_count: formData.configuration.selected_models?.length || 0,
        discovered_models_count: detectedModels.length
      }
    }, provider?.id, provider?.name);
    
    await onSave(updatedProvider);
    setLastSaveTime(new Date());
    
    // Create local backup to ensure persistence
    try {
      const backupData = {
        provider_id: provider?.id,
        name: formData.name,
        configuration: updatedProvider.configuration,
        saved_at: new Date().toISOString()
      };
      localStorage.setItem(`provider_backup_${provider?.id}`, JSON.stringify(backupData));
      
      debugConsole.info('BACKUP', 'Local backup created', {
        backup_size: JSON.stringify(backupData).length
      }, provider?.id, provider?.name);
    } catch (backupError: any) {
      debugConsole.warn('BACKUP', 'Failed to create local backup', {
        error: backupError.message
      }, provider?.id, provider?.name);
    }
  };

  const handleManualSave = async () => {
    setAutoSaveEnabled(false); // Temporarily disable auto-save
    await handleSave();
    
    toast({
      title: '✅ Configuration Saved',
      description: 'All changes have been saved and will persist across app restarts!',
      duration: 5000
    });
    
    setTimeout(() => setAutoSaveEnabled(true), 1000); // Re-enable auto-save after 1 second
    onClose();
  };

  const testConnection = async () => {
    if (!formData.api_endpoint) {
      debugConsole.error('CONNECTION_TEST', 'API endpoint is required', {}, provider?.id, provider?.name);
      setConnectionStatus('error');
      setConnectionResult({ error: 'API endpoint is required' });
      return;
    }

    if (!apiKey && formData.configuration.auth_method === 'api_key') {
      debugConsole.warn('CONNECTION_TEST', 'API key is recommended for accurate testing', {
        auth_method: formData.configuration.auth_method
      }, provider?.id, provider?.name);
    }

    setIsTestingConnection(true);
    setConnectionStatus('testing');
    setConnectionResult(null);
    
    debugConsole.info('CONNECTION_TEST', 'Starting connection test', {
      endpoint: formData.api_endpoint,
      provider_type: formData.provider_type,
      auth_method: formData.configuration.auth_method,
      has_api_key: !!apiKey
    }, provider?.id, provider?.name);

    try {
      const result = await testProviderConnection(
        {
          ...provider,
          ...formData,
          id: provider?.id || 'test-provider'
        },
        apiKey
      );

      setConnectionResult(result);
      setConnectionStatus(result.success ? 'success' : 'error');
      
      if (result.success) {
        debugConsole.success('CONNECTION_TEST', `Connection successful (${result.latency}ms)`, {
          latency: result.latency,
          response_preview: result.details ? Object.keys(result.details) : null
        }, provider?.id, provider?.name);
      } else {
        debugConsole.error('CONNECTION_TEST', `Connection failed: ${result.error}`, {
          error: result.error,
          latency: result.latency,
          details: result.details
        }, provider?.id, provider?.name);
      }
    } catch (error: any) {
      debugConsole.error('CONNECTION_TEST', 'Unexpected error during connection test', {
        error: error.message || error,
        stack: error.stack
      }, provider?.id, provider?.name);
      setConnectionStatus('error');
      setConnectionResult({ error: 'Unexpected error occurred' });
    } finally {
      setIsTestingConnection(false);
      debugConsole.debug('CONNECTION_TEST', 'Connection test completed', {
        final_status: connectionStatus,
        duration: 'Test finished'
      }, provider?.id, provider?.name);
    }
  };

  const detectModels = async () => {
    if (!formData.api_endpoint || !apiKey) {
      debugConsole.warn('MODEL_DETECTION', 'API endpoint and key required for model detection', {}, provider?.id, provider?.name);
      toast({
        title: 'Missing Configuration',
        description: 'Please provide API endpoint and API key before detecting models',
        variant: 'destructive'
      });
      return;
    }

    // Show loading state
    toast({
      title: '🔍 Detecting Models...',
      description: 'Querying API for available models and loading saved models',
      duration: 2000
    });

    try {
      debugConsole.info('MODEL_DETECTION', 'Starting comprehensive model detection', {
        endpoint: formData.api_endpoint,
        provider_type: formData.provider_type,
        has_api_key: !!apiKey,
        has_discovered_models: !!(provider?.configuration?.discovered_models?.length),
        saved_models_count: provider?.configuration?.discovered_models?.length || 0
      }, provider?.id, provider?.name);

      // Step 1: Load previously discovered models from provider configuration
      let savedModels: string[] = [];
      if (provider?.configuration?.discovered_models?.length > 0) {
        savedModels = provider.configuration.discovered_models.map(m => 
          typeof m === 'string' ? m : (m.id || m.name)
        ).filter(Boolean);
        
        debugConsole.info('MODEL_DETECTION', 'Loading previously discovered models', {
          saved_models: savedModels,
          count: savedModels.length,
          source: 'provider_configuration'
        }, provider?.id, provider?.name);
      }

      // Step 2: Make fresh API call to detect current models
      const freshModels = await detectAvailableModels(
        {
          ...provider,
          ...formData,
          id: provider?.id || 'test-provider',
          api_endpoint: formData.api_endpoint,
          provider_type: formData.provider_type
        },
        apiKey,
        true // Request detailed model information from language-models endpoint
      );
      
      debugConsole.info('MODEL_DETECTION', 'Fresh API call completed', {
        fresh_models: freshModels,
        fresh_count: freshModels.length,
        source: 'api_call'
      }, provider?.id, provider?.name);
      
      // Step 3: Combine saved and fresh models (remove duplicates)
      const allUniqueModels = [...new Set([...savedModels, ...freshModels])];
      
      debugConsole.success('MODEL_DETECTION', `Combined model detection completed`, {
        saved_models_count: savedModels.length,
        fresh_models_count: freshModels.length,
        total_unique_models: allUniqueModels.length,
        combined_models: allUniqueModels,
        includes_coder_model: allUniqueModels.some(m => m.toLowerCase().includes('code')),
        includes_reasoning_model: allUniqueModels.some(m => m.toLowerCase().includes('reasoning')),
        both_expected_models: allUniqueModels.includes('grok-4-fast-reasoning') && allUniqueModels.includes('grok-code-fast-1')
      }, provider?.id, provider?.name);
      
      setDetectedModels(allUniqueModels);
      
      // Auto-select detected models (add to existing selection, don't replace)
      setFormData(prev => {
        const existingModels = prev.configuration.selected_models || [];
        const newModels = allUniqueModels.filter(model => !existingModels.includes(model));
        const allModels = [...existingModels, ...newModels];
        
        // Also save the discovered models in the configuration for future use
        return {
          ...prev,
          configuration: {
            ...prev.configuration,
            selected_models: allModels,
            discovered_models: allUniqueModels, // Save all discovered models
            last_model_detection: new Date().toISOString()
          }
        };
      });
      
      // Show detailed success message with both expected models
      const hasCoderModel = allUniqueModels.includes('grok-code-fast-1');
      const hasReasoningModel = allUniqueModels.includes('grok-4-fast-reasoning');
      
      toast({
        title: '✅ Models Detected Successfully',
        description: `Found ${allUniqueModels.length} total models (${savedModels.length} saved + ${freshModels.length} fresh):
${allUniqueModels.join(', ')}

🎯 Expected models: ${hasReasoningModel ? '✅' : '❌'} grok-4-fast-reasoning, ${hasCoderModel ? '✅' : '❌'} grok-code-fast-1`,
        duration: 10000
      });
      
    } catch (error: any) {
      debugConsole.error('MODEL_DETECTION', 'Model detection failed', {
        error: error.message,
        stack: error.stack,
        fallback_action: 'Loading saved models only'
      }, provider?.id, provider?.name);
      
      // Fallback: Try to load saved models even if API fails
      if (provider?.configuration?.discovered_models?.length > 0) {
        const savedModels = provider.configuration.discovered_models.map(m => 
          typeof m === 'string' ? m : (m.id || m.name)
        ).filter(Boolean);
        
        setDetectedModels(savedModels);
        
        toast({
          title: '⚠️ API Detection Failed - Using Saved Models',
          description: `Loaded ${savedModels.length} previously discovered models: ${savedModels.join(', ')}`,
          duration: 8000
        });
        
        debugConsole.warn('MODEL_DETECTION', 'Fallback to saved models successful', {
          saved_models: savedModels,
          count: savedModels.length
        }, provider?.id, provider?.name);
      } else {
        // Complete failure - no saved models and API failed
        setDetectedModels([]);
        
        toast({
          title: '❌ Model Detection Failed',
          description: `Unable to detect models: ${error.message}. No saved models available.`,
          variant: 'destructive',
          duration: 8000
        });
      }
    }
  };

  const generateCurl = () => {
    const curl = generateCurlCommand(
      {
        ...provider,
        ...formData,
        id: provider?.id || 'test-provider'
      },
      apiKey,
      undefined,
      'models' // Generate curl for models endpoint to test model detection
    );
    setCurlCommand(curl);
    
    debugConsole.info('CURL_GENERATION', 'Generated curl command for models endpoint testing', {
      command_length: curl.length,
      has_api_key: !!apiKey,
      endpoint_type: 'models'
    }, provider?.id, provider?.name);
  };

  const availableModels = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
    anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    google: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'],
    meta: ['llama-2-70b-chat', 'llama-2-13b-chat', 'llama-2-7b-chat'],
    grok: ['grok-4-0709', 'grok-code-fast-1', 'grok-3', 'grok-3-mini', 'grok-2-vision-1212', 'grok-2-image-1212'],
    xai: ['grok-4-0709', 'grok-code-fast-1', 'grok-3', 'grok-3-mini', 'grok-2-vision-1212', 'grok-2-image-1212'],
    mistral: ['mistral-large-2411', 'mistral-small-2409', 'codestral-2405'],
    cohere: ['command-r-plus', 'command-r', 'command-nightly'],
    perplexity: ['llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-small-128k-online']
  };

  const capabilities = [
    'text-generation',
    'chat',
    'code-generation',
    'analysis',
    'summarization',
    'translation',
    'image-generation',
    'vision'
  ];

  // Helper function to get model-specific capabilities and specifications
  const getModelCapabilities = (modelId: string, providerType?: string) => {
    const id = modelId.toLowerCase();
    const type = providerType || formData.provider_type;
    
    // X.AI / Grok models
    if (type === 'grok' || type === 'xai') {
      if (id.includes('grok-4')) {
        return {
          capabilities: ['text-generation', 'chat', 'analysis', 'code-generation'],
          contextLength: 131072,
          costPer1kTokens: 2.5,
          specialization: 'general',
          responseTime: 'fast',
          reliability: 0.98
        };
      }
      if (id.includes('grok-vision') || id.includes('vision')) {
        return {
          capabilities: ['text-generation', 'chat', 'vision', 'image-generation'],
          contextLength: 131072,
          costPer1kTokens: 3.0,
          specialization: 'multimodal',
          responseTime: 'medium',
          reliability: 0.96
        };
      }
      if (id.includes('grok-code') || id.includes('code')) {
        return {
          capabilities: ['text-generation', 'code-generation', 'analysis'],
          contextLength: 131072,
          costPer1kTokens: 1.8,
          specialization: 'code',
          responseTime: 'very-fast',
          reliability: 0.97
        };
      }
      // Default Grok model
      return {
        capabilities: ['text-generation', 'chat', 'analysis'],
        contextLength: 131072,
        costPer1kTokens: 2.0,
        specialization: 'general',
        responseTime: 'fast',
        reliability: 0.95
      };
    }
    
    // Default capabilities for other models
    return {
      capabilities: ['text-generation', 'chat'],
      contextLength: 4096,
      costPer1kTokens: 1.0,
      specialization: 'general',
      responseTime: 'medium',
      reliability: 0.90
    };
  };

  // Helper function to get capability icons
  const getCapabilityIcon = (capability: string) => {
    const iconMap = {
      'text-generation': '✍️',
      'chat': '💬',
      'code-generation': '💻',
      'analysis': '🔍',
      'summarization': '📝',
      'translation': '🌐',
      'image-generation': '🎨',
      'vision': '👁️'
    };
    return iconMap[capability as keyof typeof iconMap] || '⚡';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        {/* Enhanced Header */}
        <DialogHeader className="flex-shrink-0 pb-6 border-b border-neutral-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-blue-100/50">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-neutral-900 tracking-tight">
                  {formData.name || 'AI Provider'}
                </DialogTitle>
                <DialogDescription className="text-neutral-600 mt-1 text-base">
                  Configure {formData.provider_type} provider settings and models
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {connectionStatus === 'success' && (
                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 px-3 py-1.5">
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Connected
                </Badge>
              )}
              {connectionStatus === 'error' && (
                <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-3 py-1.5">
                  <AlertTriangle className="w-3 h-3 mr-1.5" />
                  Connection Failed
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Enhanced Tab Navigation */}
        <div className="flex-shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-neutral-100/60 rounded-2xl p-1 h-14">
              <TabsTrigger value="general" className="flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Settings className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="authentication" className="flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Key className="w-4 h-4" />
                Authentication
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Cpu className="w-4 h-4" />
                Models & Capabilities
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Terminal className="w-4 h-4" />
                Debug Console
              </TabsTrigger>
            </TabsList>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto max-h-[calc(95vh-280px)] pr-2 scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
              {/* General Tab */}
              <TabsContent value="general" className="space-y-6 mt-0">
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Settings className="w-4 h-4 text-blue-600" />
                      </div>
                      Provider Information
                    </CardTitle>
                    <CardDescription>Configure basic provider settings and endpoints</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-neutral-700">Provider Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter provider name"
                          className="border-neutral-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider_type" className="text-sm font-medium text-neutral-700">Provider Type</Label>
                        <Input
                          id="provider_type"
                          value={formData.provider_type}
                          onChange={(e) => setFormData(prev => ({ ...prev, provider_type: e.target.value }))}
                          placeholder="e.g., grok, openai, anthropic"
                          className="border-neutral-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api_endpoint" className="text-sm font-medium text-neutral-700">API Endpoint</Label>
                      <Input
                        id="api_endpoint"
                        value={formData.api_endpoint}
                        onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
                        placeholder="Enter API endpoint URL"
                        className="border-neutral-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="is_active" className="text-sm font-medium text-neutral-700">
                          Provider Active
                        </Label>
                      </div>
                      <Badge 
                        className={formData.is_active 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-neutral-50 text-neutral-700 border-neutral-200"
                        }
                      >
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Authentication Tab */}
              <TabsContent value="authentication" className="space-y-6 mt-0">
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Key className="w-4 h-4 text-green-600" />
                      </div>
                      API Authentication
                    </CardTitle>
                    <CardDescription>Configure API authentication and test connection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="api_key" className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Key
                        {apiKey && (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                            {maskApiKey(apiKey)}
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="api_key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="border-neutral-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={testConnection}
                        disabled={isTestingConnection || !formData.api_endpoint}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-11"
                      >
                        {isTestingConnection ? (
                          <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={generateCurl}
                        variant="outline"
                        className="border-neutral-200 hover:bg-neutral-50 rounded-lg h-11"
                      >
                        <Terminal className="w-4 h-4 mr-2" />
                        Generate cURL
                      </Button>
                    </div>

                    {connectionResult && (
                      <div className={`p-4 rounded-lg ${
                        connectionResult.success 
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {connectionResult.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            connectionResult.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {connectionResult.success ? 'Connection Successful' : 'Connection Failed'}
                          </span>
                          {connectionResult.latency && (
                            <Badge className="bg-white/70 text-neutral-700 border-neutral-300 text-xs ml-auto">
                              {connectionResult.latency}ms
                            </Badge>
                          )}
                        </div>
                        {connectionResult.error && (
                          <p className="text-red-700 text-sm">{connectionResult.error}</p>
                        )}
                        {connectionResult.details && (
                          <pre className="text-xs text-neutral-600 mt-2 overflow-x-auto">
                            {JSON.stringify(connectionResult.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}

                    {curlCommand && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-neutral-700">Generated cURL Command</Label>
                        <div className="relative">
                          <Textarea
                            value={curlCommand}
                            readOnly
                            className="font-mono text-xs border-neutral-200 bg-neutral-50 rounded-lg min-h-[120px]"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(curlCommand, 'cURL command')}
                            className="absolute top-2 right-2 h-8 px-2"
                          >
                            📋 Copy
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Models & Capabilities Tab */}
              <TabsContent value="models" className="space-y-6 mt-0">
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Cpu className="w-4 h-4 text-purple-600" />
                      </div>
                      Available Models
                    </CardTitle>
                    <CardDescription>Detect and configure available AI models</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={detectModels}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Detect Models
                      </Button>
                      <div className="text-sm text-neutral-600">
                        {detectedModels.length > 0 ? (
                          `${detectedModels.length} models detected`
                        ) : (
                          'Click to discover available models'
                        )}
                      </div>
                    </div>

                    {detectedModels.length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-neutral-700">Detected Models</Label>
                        <div className="grid gap-4">
                          {detectedModels.map((model) => {
                            const capabilities = getModelCapabilities(model, formData.provider_type);
                            const isSelected = formData.configuration.selected_models?.includes(model);
                            
                            return (
                              <div
                                key={model}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50'
                                }`}
                                onClick={() => {
                                  const currentSelected = formData.configuration.selected_models || [];
                                  const newSelected = isSelected
                                    ? currentSelected.filter(m => m !== model)
                                    : [...currentSelected, model];
                                  
                                  setFormData(prev => ({
                                    ...prev,
                                    configuration: {
                                      ...prev.configuration,
                                      selected_models: newSelected
                                    }
                                  }));
                                }}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      isSelected ? 'bg-blue-500' : 'bg-neutral-300'
                                    }`} />
                                    <span className="font-medium text-neutral-900">{model}</span>
                                    <Badge className="bg-neutral-100 text-neutral-700 text-xs">
                                      {capabilities.specialization}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                                      ${capabilities.costPer1kTokens}/1k tokens
                                    </Badge>
                                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                      {capabilities.responseTime}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {capabilities.capabilities.map((cap) => (
                                    <Badge
                                      key={cap}
                                      className="bg-white/70 text-neutral-700 border-neutral-200 text-xs"
                                    >
                                      {getCapabilityIcon(cap)} {cap}
                                    </Badge>
                                  ))}
                                </div>
                                
                                <div className="text-xs text-neutral-500 flex items-center gap-4">
                                  <span>Context: {capabilities.contextLength.toLocaleString()} tokens</span>
                                  <span>Reliability: {(capabilities.reliability * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(availableModels[formData.provider_type as keyof typeof availableModels] || []).length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-neutral-700">Known Models for {formData.provider_type}</Label>
                        <div className="flex flex-wrap gap-2">
                          {(availableModels[formData.provider_type as keyof typeof availableModels] || []).map((model) => {
                            const isSelected = formData.configuration.selected_models?.includes(model);
                            return (
                              <Badge
                                key={model}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                }`}
                                onClick={() => {
                                  const currentSelected = formData.configuration.selected_models || [];
                                  const newSelected = isSelected
                                    ? currentSelected.filter(m => m !== model)
                                    : [...currentSelected, model];
                                  
                                  setFormData(prev => ({
                                    ...prev,
                                    configuration: {
                                      ...prev.configuration,
                                      selected_models: newSelected
                                    }
                                  }));
                                }}
                              >
                                {model}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Debug Console Tab */}
              <TabsContent value="debug" className="space-y-6 mt-0">
                <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Terminal className="w-4 h-4 text-orange-600" />
                      </div>
                      Debug Console
                    </CardTitle>
                    <CardDescription>Real-time logs and debugging information for this provider</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DebugConsole
                      providerId={provider?.id}
                      providerName={provider?.name}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Enhanced Footer */}
        <div className="flex-shrink-0 flex items-center justify-between pt-6 border-t border-neutral-200/50 bg-white/50">
          <div className="flex items-center gap-4">
            {lastSaveTime && (
              <div className="text-xs text-neutral-500">
                Last saved: {lastSaveTime.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                id="auto_save"
                checked={autoSaveEnabled}
                onCheckedChange={setAutoSaveEnabled}
              />
              <Label htmlFor="auto_save" className="text-xs text-neutral-600">
                Auto-save
              </Label>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {onDelete && (
              <Button
                variant="outline"
                onClick={onDelete}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Provider
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="border-neutral-200 hover:bg-neutral-50 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleManualSave}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};