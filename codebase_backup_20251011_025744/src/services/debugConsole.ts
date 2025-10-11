/**
 * Debug Console Service
 * Provides multi-level logging for AI provider debugging and issue identification
 * Required by project specifications for all AI provider implementations
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SUCCESS = 4
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  providerId?: string;
  providerName?: string;
}

class DebugConsoleService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private addLog(level: LogLevel, category: string, message: string, data?: any, providerId?: string, providerName?: string): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      providerId,
      providerName
    };

    this.logs.unshift(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));

    // Respect environment-based console filtering - OPERATIONAL DEBUG MODE
    const consoleLevel = import.meta.env.VITE_CONSOLE_LEVEL || 'info';
    const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    const isQuietMode = import.meta.env.VITE_DISABLE_AUTH_LOGS === 'true';
    
    // Show operational debugging while filtering pure noise
    const shouldSkipConsoleOutput = () => {
      // NEVER filter errors or warnings
      if (level === LogLevel.ERROR || level === LogLevel.WARN) return false;
      
      // Check message content for operational issues
      const msgStr = `[${category}] ${message}`;
      if (msgStr.includes('❌') ||
          msgStr.includes('ERROR') ||
          msgStr.includes('CRITICAL') ||
          msgStr.includes('Failed') ||
          msgStr.includes('failed') ||
          msgStr.includes('Error') ||
          msgStr.includes('error') ||
          msgStr.includes('connection') ||
          msgStr.includes('network') ||
          msgStr.includes('database') ||
          msgStr.includes('auth') ||
          msgStr.includes('API') ||
          msgStr.includes('response') ||
          msgStr.includes('timeout') ||
          msgStr.includes('rejected')) {
        return false; // Show operational issues
      }
      
      // Show operational system messages
      if (msgStr.includes('[SYSTEM]') ||
          msgStr.includes('[AI_INIT]') ||
          msgStr.includes('[PROVIDER') ||
          msgStr.includes('[CONNECTION') ||
          msgStr.includes('[DATABASE')) {
        return false; // Show operational debugging
      }
      
      // Honor console level settings
      if (consoleLevel === 'error') {
        if (level === LogLevel.DEBUG || level === LogLevel.INFO || level === LogLevel.SUCCESS) {
          return true;
        }
      }
      
      // Skip debug logs unless in debug mode
      if (level === LogLevel.DEBUG && !debugMode) return true;
      
      // In quiet mode, filter only pure success spam with positive indicators
      if (isQuietMode && level === LogLevel.SUCCESS) {
        if (msgStr.includes('✅') &&
            (msgStr.includes('monitoring active') ||
             msgStr.includes('fully operational') ||
             msgStr.includes('completed successfully'))) {
          return true; // Filter only obvious success spam
        }
      }
      
      return false; // Show everything else
    };
    
    // Only log to browser console if not filtered
    if (!shouldSkipConsoleOutput()) {
      const consoleMessage = `[${category}] ${message}`;
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(consoleMessage, data);
          break;
        case LogLevel.INFO:
          console.info(consoleMessage, data);
          break;
        case LogLevel.WARN:
          console.warn(consoleMessage, data);
          break;
        case LogLevel.ERROR:
          console.error(consoleMessage, data);
          break;
        case LogLevel.SUCCESS:
          console.log(`✅ ${consoleMessage}`, data);
          break;
      }
    }
  }

  // Public logging methods
  debug(category: string, message: string, data?: any, providerId?: string, providerName?: string): void {
    this.addLog(LogLevel.DEBUG, category, message, data, providerId, providerName);
  }

  info(category: string, message: string, data?: any, providerId?: string, providerName?: string): void {
    this.addLog(LogLevel.INFO, category, message, data, providerId, providerName);
  }

  warn(category: string, message: string, data?: any, providerId?: string, providerName?: string): void {
    this.addLog(LogLevel.WARN, category, message, data, providerId, providerName);
  }

  error(category: string, message: string, data?: any, providerId?: string, providerName?: string): void {
    this.addLog(LogLevel.ERROR, category, message, data, providerId, providerName);
  }

  success(category: string, message: string, data?: any, providerId?: string, providerName?: string): void {
    this.addLog(LogLevel.SUCCESS, category, message, data, providerId, providerName);
  }

  // Provider-specific logging
  logProviderTest(providerId: string, providerName: string, stage: string, message: string, data?: any): void {
    this.info('CONNECTION_TEST', `[${stage}] ${message}`, data, providerId, providerName);
  }

  logProviderError(providerId: string, providerName: string, error: any, context?: string): void {
    this.error('PROVIDER_ERROR', `${context || 'Unknown'}: ${error.message || error}`, {
      error: error.stack || error,
      context
    }, providerId, providerName);
  }

  logProviderSuccess(providerId: string, providerName: string, operation: string, data?: any): void {
    this.success('PROVIDER_SUCCESS', `${operation} completed successfully`, data, providerId, providerName);
  }

  // Console management
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByProvider(providerId: string): LogEntry[] {
    return this.logs.filter(log => log.providerId === providerId);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  clearProviderLogs(providerId: string): void {
    this.logs = this.logs.filter(log => log.providerId !== providerId);
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  // Subscription for real-time updates
  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Export logs
  exportLogs(providerId?: string): string {
    const logsToExport = providerId ? this.getLogsByProvider(providerId) : this.logs;
    return JSON.stringify(logsToExport, null, 2);
  }
}

// Create singleton instance
export const debugConsole = new DebugConsoleService();

// Provider connection testing utilities
export const testProviderConnection = async (
  provider: any,
  apiKey?: string
): Promise<{ success: boolean; latency?: number; error?: string; details?: any }> => {
  const providerId = provider.id;
  const providerName = provider.name;

  debugConsole.logProviderTest(providerId, providerName, 'START', 'Starting connection test');

  const startTime = Date.now();
  
  // Create a single AbortController for the entire operation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort('Connection test timeout');
  }, 15000); // Increased timeout for model discovery + test
  
  try {
    // Validate required fields
    if (!provider.api_endpoint) {
      clearTimeout(timeoutId);
      throw new Error('API endpoint is required');
    }

    debugConsole.logProviderTest(providerId, providerName, 'VALIDATION', 'Basic validation passed', {
      endpoint: provider.api_endpoint,
      authMethod: provider.configuration?.auth_method
    });

    // Prepare test request based on provider type
    let testEndpoint = provider.api_endpoint;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YachtSentinel-AI/1.0'
    };

    // Add authentication headers
    if (apiKey) {
      if (provider.provider_type === 'grok' || provider.provider_type === 'xai') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    let testPayload: any = {};
    
    // Provider-specific test payloads
    if (provider.provider_type === 'grok' || provider.provider_type === 'xai') {
      testEndpoint = `${provider.api_endpoint}/chat/completions`;
      
      // First, try to get available models to use for testing
      let availableModel = 'grok-beta'; // Safe fallback model that most API keys should have access to
      
      try {
        debugConsole.logProviderTest(providerId, providerName, 'MODEL_DISCOVERY', 'Checking available models for testing', {
          endpoint: `${provider.api_endpoint}/models`
        });
        
        const modelsResponse = await fetch(`${provider.api_endpoint}/models`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          signal: controller.signal
        });
        
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          const availableModels = modelsData.data
            ?.filter((model: any) => model.object === 'model')
            ?.map((model: any) => model.id) || [];
          
          // Use the first available model, or prefer safer models
          const preferredModels = ['grok-beta', 'grok-2-mini', 'grok-2-latest'];
          const testModel = preferredModels.find(model => availableModels.includes(model)) || availableModels[0];
          
          if (testModel) {
            availableModel = testModel;
            debugConsole.logProviderTest(providerId, providerName, 'MODEL_DISCOVERY', `Selected model for testing: ${testModel}`, {
              available_models: availableModels,
              selected_model: testModel
            });
          }
        } else {
          debugConsole.logProviderTest(providerId, providerName, 'MODEL_DISCOVERY', 'Failed to fetch models, using fallback', {
            status: modelsResponse.status,
            fallback_model: availableModel
          });
        }
      } catch (modelError: any) {
        debugConsole.logProviderTest(providerId, providerName, 'MODEL_DISCOVERY', 'Model discovery failed, using fallback', {
          error: modelError.message,
          fallback_model: availableModel
        });
      }
      
      testPayload = {
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Testing. Just say hi and hello world and nothing else.' }
        ],
        model: availableModel,
        stream: false,
        temperature: 0,
        max_tokens: 10
      };
      
      debugConsole.logProviderTest(providerId, providerName, 'MODEL_SELECTION', `Using model: ${availableModel}`, {
        final_model: availableModel,
        reasoning: 'Selected based on API key permissions'
      });
    }

    debugConsole.logProviderTest(providerId, providerName, 'REQUEST_PREP', 'Request prepared', {
      endpoint: testEndpoint,
      headers: Object.keys(headers)
    });

    // Make test request using the same controller
    const response = await fetch(testEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    debugConsole.logProviderTest(providerId, providerName, 'RESPONSE', `Received response: ${response.status}`, {
      status: response.status,
      statusText: response.statusText,
      latency: `${latency}ms`
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
      } catch {
        errorObj = { message: errorText };
      }
      
      // Enhanced handling for X.AI API permission errors
      if (response.status === 403 && (provider.provider_type === 'grok' || provider.provider_type === 'xai')) {
        const modelUsed = testPayload?.model || 'unknown';
        const apiKeyPrefix = apiKey ? `${apiKey.substring(0, 8)}...` : 'missing';
        
        debugConsole.logProviderError(providerId, providerName, {
          error: 'API_KEY_PERMISSIONS',
          message: `API key lacks permissions for model '${modelUsed}'`,
          suggestion: 'Visit https://console.x.ai → API Keys → Edit your key → Enable model permissions',
          api_key_prefix: apiKeyPrefix,
          model_attempted: modelUsed,
          status: response.status,
          next_steps: [
            '1. Log into console.x.ai',
            '2. Navigate to API Keys section', 
            '3. Edit your API key',
            '4. Enable permissions for the required models',
            '5. Retry the connection test'
          ]
        }, 'CONNECTION_TEST');
        
        throw new Error(`X.AI API Key Permission Error: Your API key cannot access the '${modelUsed}' model. Please visit console.x.ai to update your API key permissions.`);
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    debugConsole.logProviderSuccess(providerId, providerName, 'CONNECTION_TEST', {
      latency: `${latency}ms`,
      response: responseData
    });

    return {
      success: true,
      latency,
      details: responseData
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    
    debugConsole.logProviderError(providerId, providerName, error, 'CONNECTION_TEST');

    return {
      success: false,
      latency,
      error: error.message || 'Unknown error occurred',
      details: error
    };
  }
};

// Helper function to generate X.AI API key permission guidance
export const getXAIPermissionGuidance = (modelName?: string) => {
  return {
    title: 'X.AI API Key Permissions Required',
    description: `Your API key needs permission to access ${modelName ? `the '${modelName}' model` : 'the requested models'}.`,
    steps: [
      '1. Visit https://console.x.ai',
      '2. Navigate to "API Keys" in the sidebar',
      '3. Find and click "Edit" on your API key',
      '4. In the permissions section, enable access to the required models',
      '5. Save the changes and retry your connection'
    ],
    learnMore: 'https://docs.x.ai/docs/quickstart#authentication',
    commonModels: ['grok-beta', 'grok-2-mini', 'grok-2-latest', 'grok-vision-beta']
  };
};

// Generate curl command for manual testing
export const generateCurlCommand = (
  provider: any,
  apiKey?: string,
  customPayload?: any,
  endpointType: 'models' | 'chat' = 'chat'
): string => {
  const baseEndpoint = provider.api_endpoint;
  
  // Generate curl for models endpoint (based on X.AI official documentation)
  if (endpointType === 'models') {
    const modelsEndpoint = `${baseEndpoint}/models`;
    const sanitizedKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'YOUR_API_KEY';
    
    return `curl "${modelsEndpoint}" \\
  -H "Accept: application/json" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${sanitizedKey}"`;
  }
  
  // Generate curl for chat completions endpoint
  let payload = customPayload;

  // Provider-specific endpoints and payloads
  if (provider.provider_type === 'grok' || provider.provider_type === 'xai') {
    const fullEndpoint = `${baseEndpoint}/chat/completions`;
    payload = payload || {
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Testing. Just say hi and hello world and nothing else.' }
      ],
      model: 'grok-2-latest',
      stream: false,
      temperature: 0
    };

    return `curl ${fullEndpoint} \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer ${apiKey}" \\
    -d '${JSON.stringify(payload, null, 2)}'`;
  }

  return `curl ${baseEndpoint} -H "Content-Type: application/json"`;
};

// Detect available models from API response
// Enhanced with X.AI Enterprise API full specification support
export const detectAvailableModels = async (
  provider: any,
  apiKey?: string,
  detailed: boolean = true
): Promise<string[]> => {
  const providerId = provider.id;
  const providerName = provider.name;

  debugConsole.info('MODEL_DETECTION', 'Starting enhanced model detection with X.AI Enterprise API', {
    provider_type: provider.provider_type,
    endpoint: provider.api_endpoint,
    has_api_key: !!apiKey,
    api_spec: 'X.AI Enterprise REST API',
    detailed_mode: detailed
  }, providerId, providerName);

  try {
    // Use enhanced language-models endpoint for detailed info when available
    let modelsEndpoint = detailed && (provider.provider_type === 'grok' || provider.provider_type === 'xai') 
      ? `${provider.api_endpoint}/language-models`  // Full model info with pricing, modalities
      : `${provider.api_endpoint}/models`;          // Basic model info
      
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // X.AI requires Authorization header with Bearer token
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      debugConsole.warn('MODEL_DETECTION', 'No API key provided - request will likely fail', {
        note: 'X.AI Enterprise API requires authentication for all endpoints'
      }, providerId, providerName);
    }

    debugConsole.info('MODEL_DETECTION', `Calling X.AI ${detailed ? 'language-models' : 'models'} endpoint`, {
      endpoint: modelsEndpoint,
      headers: Object.keys(headers),
      method: 'GET',
      enhanced_features: detailed
    }, providerId, providerName);

    const response = await fetch(modelsEndpoint, {
      headers,
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { message: errorText };
      }
      
      debugConsole.error('MODEL_DETECTION', `X.AI API call failed (${response.status}) - No fallback models available`, {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails,
        suggestion: response.status === 401 
          ? 'Check API key validity at https://console.x.ai' 
          : response.status === 403
            ? 'Verify API key has model access permissions'
            : 'Check endpoint accessibility and network connectivity',
        note: 'System configured to show only real API data - no fallback models'
      }, providerId, providerName);
      
      throw new Error(`X.AI API Error (${response.status}): ${errorDetails.message || errorText}. Please check your API key and connection.`);
    }

    const data = await response.json();
    let models: string[] = [];
    let modelDetails: any[] = [];
    
    // Parse response based on endpoint type
    if (detailed && data.models && Array.isArray(data.models)) {
      // Enhanced /v1/language-models response with full details
      modelDetails = data.models.filter((model: any) => model.object === 'model');
      models = modelDetails.map((model: any) => model.id).filter(Boolean);
      
      debugConsole.success('MODEL_DETECTION', 'Parsed models using enhanced language-models endpoint', {
        total_models: modelDetails.length,
        models_with_pricing: modelDetails.filter(m => m.prompt_text_token_price).length,
        models_with_vision: modelDetails.filter(m => m.input_modalities?.includes('image')).length,
        sample_models: models.slice(0, 5)
      }, providerId, providerName);
      
      // Store detailed model info for later use
      if (providerId && modelDetails.length > 0) {
        localStorage.setItem(`model_details_${providerId}`, JSON.stringify(modelDetails));
      }
      
    } else if (data.object === 'list' && data.data && Array.isArray(data.data)) {
      // Standard /v1/models response format
      models = data.data
        .filter((model: any) => model.object === 'model')
        .map((model: any) => model.id)
        .filter(Boolean);
        
      debugConsole.success('MODEL_DETECTION', 'Parsed models using standard models endpoint', {
        total_response_items: data.data.length,
        valid_models: models.length,
        response_structure: 'standard X.AI list format'
      }, providerId, providerName);
    } else {
      debugConsole.warn('MODEL_DETECTION', 'Unexpected response format from X.AI API', {
        response_keys: Object.keys(data),
        response_type: typeof data,
        has_models_array: !!data.models,
        has_data_array: !!data.data
      }, providerId, providerName);
    }

    debugConsole.success('MODEL_DETECTION', `Successfully detected ${models.length} models from X.AI Enterprise API`, {
      models: models.slice(0, 10),
      total_count: models.length,
      provider_type: provider.provider_type,
      api_response_valid: models.length > 0,
      enhanced_details: detailed && modelDetails.length > 0
    }, providerId, providerName);

    if (models.length === 0) {
      debugConsole.error('MODEL_DETECTION', 'X.AI API returned no models - No fallback models available', {
        response_type: 'valid but empty',
        note: 'System configured to show only real API data - no fallback models'
      }, providerId, providerName);
      
      throw new Error('X.AI API returned no models. Please verify your API key has access to models.');
    }

    return models;
    
  } catch (error: any) {
    debugConsole.error('MODEL_DETECTION', `X.AI Enterprise API model detection failed: ${error.message}`, {
      error: error.message,
      provider_type: provider.provider_type,
      suggestion: 'Check network connectivity, API key permissions, and endpoint accessibility',
      note: 'No fallback models will be provided - real API data only'
    }, providerId, providerName);
    
    // Re-throw the error instead of returning empty array to ensure UI shows proper error message
    throw new Error(`Model detection failed: ${error.message}. Please check your API connection and try again.`);
  }
};

// Get detailed model information from X.AI Enterprise API
export const getModelDetails = async (
  provider: any,
  modelId: string,
  apiKey?: string
): Promise<any | null> => {
  const providerId = provider.id;
  const providerName = provider.name;

  if (!modelId || !(provider.provider_type === 'grok' || provider.provider_type === 'xai')) {
    return null;
  }

  try {
    const detailsEndpoint = `${provider.api_endpoint}/language-models/${modelId}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const response = await fetch(detailsEndpoint, {
      headers,
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    if (response.ok) {
      const modelDetails = await response.json();
      
      debugConsole.success('MODEL_DETAILS', `Retrieved detailed info for ${modelId}`, {
        model_id: modelDetails.id,
        version: modelDetails.version,
        input_modalities: modelDetails.input_modalities,
        output_modalities: modelDetails.output_modalities,
        has_pricing: !!(modelDetails.prompt_text_token_price),
        aliases: modelDetails.aliases
      }, providerId, providerName);
      
      return modelDetails;
    }
  } catch (error: any) {
    debugConsole.warn('MODEL_DETAILS', `Failed to get details for ${modelId}: ${error.message}`, {
      model_id: modelId,
      error: error.message
    }, providerId, providerName);
  }
  
  return null;
};

// Enhanced connection test with multiple endpoint validation
export const validateProviderEndpoints = async (
  provider: any,
  apiKey?: string
): Promise<{
  models_endpoint: boolean;
  language_models_endpoint: boolean;
  api_key_endpoint: boolean;
  chat_endpoint: boolean;
  overall_health: 'healthy' | 'partial' | 'unhealthy';
  details: Record<string, any>;
}> => {
  const results = {
    models_endpoint: false,
    language_models_endpoint: false,
    api_key_endpoint: false,
    chat_endpoint: false,
    overall_health: 'unhealthy' as 'healthy' | 'partial' | 'unhealthy',
    details: {} as Record<string, any>
  };

  if (!apiKey) {
    return results;
  }

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  // Test API key endpoint
  try {
    const apiKeyResponse = await fetch(`${provider.api_endpoint}/api-key`, {
      headers,
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (apiKeyResponse.ok) {
      const apiKeyData = await apiKeyResponse.json();
      results.api_key_endpoint = true;
      results.details.api_key_info = {
        name: apiKeyData.name,
        permissions: apiKeyData.acls,
        blocked: apiKeyData.api_key_blocked,
        disabled: apiKeyData.api_key_disabled
      };
    }
  } catch (error) {
    results.details.api_key_error = error.message;
  }

  // Test models endpoint
  try {
    const modelsResponse = await fetch(`${provider.api_endpoint}/models`, {
      headers,
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      results.models_endpoint = true;
      results.details.models_count = modelsData.data?.length || 0;
    }
  } catch (error) {
    results.details.models_error = error.message;
  }

  // Test language-models endpoint (enhanced)
  try {
    const langModelsResponse = await fetch(`${provider.api_endpoint}/language-models`, {
      headers,
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (langModelsResponse.ok) {
      const langModelsData = await langModelsResponse.json();
      results.language_models_endpoint = true;
      results.details.language_models_count = langModelsData.models?.length || 0;
      results.details.models_with_pricing = langModelsData.models?.filter((m: any) => m.prompt_text_token_price).length || 0;
    }
  } catch (error) {
    results.details.language_models_error = error.message;
  }

  // Test chat endpoint with minimal request
  try {
    const chatResponse = await fetch(`${provider.api_endpoint}/chat/completions`, {
      headers: { ...headers, 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi' }],
        model: 'grok-4-0709',
        max_tokens: 1
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    results.chat_endpoint = chatResponse.ok || chatResponse.status === 422; // 422 is acceptable (validation error)
    results.details.chat_status = chatResponse.status;
  } catch (error) {
    results.details.chat_error = error.message;
  }

  // Calculate overall health
  const healthyEndpoints = [results.models_endpoint, results.api_key_endpoint, results.chat_endpoint].filter(Boolean).length;
  
  if (healthyEndpoints >= 3) {
    results.overall_health = 'healthy';
  } else if (healthyEndpoints >= 1) {
    results.overall_health = 'partial';
  }

  return results;
};