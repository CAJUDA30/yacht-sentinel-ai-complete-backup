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
    // Enhanced error logging with comprehensive object handling
    let errorMessage = 'Unknown error';
    let errorDetails: any = {};
    
    // Handle different error types more comprehensively
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error === null || error === undefined) {
      errorMessage = 'Null or undefined error';
    } else if (error && typeof error === 'object') {
      // Try multiple approaches to extract meaningful error message
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.statusText) {
        errorMessage = error.statusText;
      } else if (error.toString && error.toString() !== '[object Object]') {
        errorMessage = error.toString();
      } else {
        // Fallback: extract meaningful information from object properties
        const meaningfulProps = [];
        if (error.status) meaningfulProps.push(`Status: ${error.status}`);
        if (error.code) meaningfulProps.push(`Code: ${error.code}`);
        if (error.type) meaningfulProps.push(`Type: ${error.type}`);
        if (error.name) meaningfulProps.push(`Name: ${error.name}`);
        
        errorMessage = meaningfulProps.length > 0 
          ? meaningfulProps.join(', ')
          : 'Complex error object - check details';
      }
      
      // Build comprehensive error details
      errorDetails = {
        errorType: error.constructor?.name || typeof error,
        errorCode: error.code,
        errorStatus: error.status,
        errorName: error.name,
        hasMessage: !!error.message,
        hasStack: !!error.stack,
        objectKeys: Object.keys(error)
      };
      
      // Add stack trace for debugging (truncated)
      if (error.stack && typeof error.stack === 'string') {
        errorDetails.stackPreview = error.stack.split('\n').slice(0, 3).join('\n');
      }
      
      // Special handling for specific error types
      if (error.name === 'AbortError') {
        errorMessage = 'Connection test timed out';
      } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        errorMessage = 'Network connection failed - please check endpoint URL';
      } else if (error.name === 'SyntaxError') {
        errorMessage = 'Invalid response format received from API';
      }
    } else {
      // Handle primitive types
      errorMessage = String(error);
      errorDetails = { originalType: typeof error, convertedValue: String(error) };
    }
    
    // Log with enhanced context
    this.error('PROVIDER_ERROR', `${context || 'Unknown'}: ${errorMessage}`, {
      error: errorDetails,
      context,
      errorMessageLength: errorMessage.length,
      originalErrorType: typeof error,
      timestamp: new Date().toISOString()
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

// Provider connection testing utilities with enhanced error prevention
export const testProviderConnection = async (
  provider: any,
  apiKey?: string
): Promise<{ success: boolean; latency?: number; error?: string; details?: any }> => {
  const providerId = provider.id;
  const providerName = provider.name;

  debugConsole.logProviderTest(providerId, providerName, 'START', 'Starting connection test');

  const startTime = Date.now();
  
  // Enhanced parameter validation to prevent fetch errors
  try {
    // Validate provider object
    if (!provider || typeof provider !== 'object') {
      throw new Error('Invalid provider object - must be a valid object');
    }

    // Validate and sanitize API endpoint
    const endpoint = provider.api_endpoint || provider.config?.api_endpoint;
    if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
      throw new Error('API endpoint is required and must be a valid non-empty string');
    }

    // Validate endpoint format
    try {
      const url = new URL(endpoint.trim());
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('API endpoint must use HTTP or HTTPS protocol');
      }
    } catch (urlError) {
      throw new Error(`Invalid API endpoint URL format: ${endpoint}`);
    }

    // Enhanced API key validation
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      throw new Error('API key is required and must be a valid non-empty string');
    }

    // Import and use sanitization function with provider context
    const { sanitizeApiKeyForHeaders } = await import('@/utils/encryption');
    const sanitizationResult = sanitizeApiKeyForHeaders(apiKey, provider.provider_type);
    
    if (!sanitizationResult.isValid || !sanitizationResult.sanitized) {
      throw new Error(`API key validation failed: ${sanitizationResult.error}`);
    }

    const sanitizedApiKey = sanitizationResult.sanitized;

    debugConsole.logProviderTest(providerId, providerName, 'VALIDATION', 'Enhanced validation passed', {
      endpoint: endpoint.trim(),
      provider_type: provider.provider_type,
      authMethod: provider.configuration?.auth_method,
      apiKeyLength: sanitizedApiKey.length,
      apiKeyPrefix: sanitizedApiKey.substring(0, 4),
      sanitizationApplied: true
    });

    // Create a single AbortController for the entire operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort('Connection test timeout after 15 seconds');
    }, 15000);
    
    try {
      // Provider-specific connection testing with sanitized parameters
      const connectionResult = await testProviderConnectionByType(
        {
          ...provider,
          api_endpoint: endpoint.trim() // Use validated endpoint
        }, 
        sanitizedApiKey, // Use sanitized API key
        controller
      );
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (connectionResult.success) {
        debugConsole.logProviderSuccess(providerId, providerName, 'CONNECTION_TEST', {
          latency: `${latency}ms`,
          provider_type: provider.provider_type,
          response: connectionResult.details,
          sanitizationApplied: true
        });
      } else {
        debugConsole.logProviderError(providerId, providerName, {
          error: connectionResult.error,
          provider_type: provider.provider_type,
          latency: `${latency}ms`,
          sanitizationApplied: true
        }, 'CONNECTION_TEST');
      }

      return {
        success: connectionResult.success,
        latency,
        error: connectionResult.error,
        details: connectionResult.details
      };

    } catch (connectionError: any) {
      clearTimeout(timeoutId);
      throw connectionError;
    }

  } catch (error: any) {
    const latency = Date.now() - startTime;
    
    // Enhanced error classification and messaging
    let errorMessage = error.message || 'Unknown error occurred';
    let errorContext = 'VALIDATION_ERROR';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Connection test timed out after 15 seconds';
      errorContext = 'TIMEOUT_ERROR';
    } else if (error.message?.includes('fetch')) {
      errorMessage = `Network error during connection test: ${error.message}`;
      errorContext = 'NETWORK_ERROR';
    } else if (error.message?.includes('Invalid value')) {
      errorMessage = 'Invalid request parameters detected - API key or headers contain illegal characters';
      errorContext = 'PARAMETER_ERROR';
    } else if (error.message?.includes('API key')) {
      errorMessage = `API key validation error: ${error.message}`;
      errorContext = 'API_KEY_ERROR';
    }
    
    debugConsole.logProviderError(providerId, providerName, {
      originalError: error.message,
      classifiedError: errorMessage,
      errorType: error.constructor?.name,
      context: errorContext,
      preventionApplied: true
    }, 'CONNECTION_TEST');

    return {
      success: false,
      latency,
      error: errorMessage,
      details: {
        originalError: error.message,
        errorType: error.constructor?.name,
        context: errorContext,
        troubleshooting: 'Check API key format and endpoint URL validity'
      }
    };
  }
};

// Provider-specific connection testing function
async function testProviderConnectionByType(
  provider: any,
  apiKey: string,
  controller: AbortController
): Promise<{ success: boolean; error?: string; details?: any }> {
  const { provider_type, api_endpoint } = provider;
  const providerId = provider.id;
  const providerName = provider.name;

  debugConsole.logProviderTest(providerId, providerName, 'TYPE_SPECIFIC_TEST', `Testing ${provider_type} provider`, {
    provider_type,
    endpoint: api_endpoint
  });

  switch (provider_type) {
    case 'google':
    case 'gemini':
      return await testGoogleGeminiConnection(provider, apiKey, controller);
    
    case 'grok':
    case 'xai':
      return await testGrokConnection(provider, apiKey, controller);
    
    case 'openai':
      return await testOpenAIConnection(provider, apiKey, controller);
    
    case 'anthropic':
      return await testAnthropicConnection(provider, apiKey, controller);
    
    case 'azure':
      return await testAzureConnection(provider, apiKey, controller);
    
    default:
      // Generic test for unknown providers
      return await testGenericConnection(provider, apiKey, controller);
  }
}

// Google Gemini connection test
async function testGoogleGeminiConnection(
  provider: any,
  apiKey: string,
  controller: AbortController
): Promise<{ success: boolean; error?: string; details?: any }> {
  const providerId = provider.id;
  const providerName = provider.name;
  const baseUrl = provider.api_endpoint;

  try {
    debugConsole.logProviderTest(providerId, providerName, 'GOOGLE_TEST', 'Testing Google Gemini connection', {
      baseUrl,
      method: 'Query parameter authentication'
    });

    // Google Gemini uses query parameters for API key, not Authorization header
    const testUrl = `${baseUrl}/models?key=${apiKey}`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
      signal: controller.signal
    });

    debugConsole.logProviderTest(providerId, providerName, 'GOOGLE_RESPONSE', `Google API response: ${response.status}`, {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      // Parse Google-specific error messages
      try {
        const errorObj = JSON.parse(errorText);
        if (errorObj.error?.message) {
          errorMessage = errorObj.error.message;
        }
      } catch {
        // Use raw error text if not JSON
        if (errorText) errorMessage = errorText;
      }
      
      // Provide helpful Google-specific error guidance
      if (response.status === 403) {
        errorMessage += '. Check that your API key is valid and has Generative AI API enabled.';
      } else if (response.status === 404) {
        errorMessage += '. Verify the API endpoint URL is correct for Google Gemini.';
      }
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    
    debugConsole.logProviderTest(providerId, providerName, 'GOOGLE_SUCCESS', 'Google Gemini connection successful', {
      models_found: responseData.models?.length || 0
    });

    return {
      success: true,
      details: responseData
    };
  } catch (error: any) {
    debugConsole.logProviderTest(providerId, providerName, 'GOOGLE_ERROR', 'Google Gemini connection failed', {
      error: error.message
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Grok/X.AI connection test - comprehensive enhanced version
async function testGrokConnection(
  provider: any,
  apiKey: string,
  controller: AbortController
): Promise<{ success: boolean; error?: string; details?: any }> {
  const providerId = provider.id;
  const providerName = provider.name;
  const baseUrl = provider.api_endpoint;

  try {
    debugConsole.logProviderTest(providerId, providerName, 'GROK_TEST', 'Testing Grok connection', {
      baseUrl,
      method: 'Bearer token authentication',
      apiKeyLength: apiKey?.length,
      apiKeyPrefix: apiKey?.substring(0, 4)
    });

    // PROFESSIONAL: Basic API key validation (length and type only)
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Grok API key is missing or invalid - must be a valid string');
    }
    
    if (apiKey.length < 20) {
      throw new Error('Invalid Grok API key format - key appears too short (minimum 20 characters)');
    }
    
    // PROFESSIONAL: Log API key info for debugging without strict format validation
    debugConsole.logProviderTest(providerId, providerName, 'GROK_API_KEY', 'API key validated', {
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 4),
      keyFormat: apiKey.startsWith('xai-') ? 'modern' : 
                 apiKey.length === 129 ? 'legacy' : 'custom',
      note: 'Multiple API key formats supported'
    });

    // Phase 1: Discover available models for better test selection
    let availableModel = 'grok-beta'; // Conservative fallback
    let availableModels: string[] = [];
    let modelsEndpointWorking = false;
    
    try {
      debugConsole.logProviderTest(providerId, providerName, 'GROK_MODELS', 'Fetching available models for optimal testing', {
        endpoint: `${baseUrl}/models`,
        purpose: 'Model discovery and validation'
      });
      
      // Validate headers before fetch call to prevent "Invalid value" errors
      const { validateHttpHeaders } = await import('@/utils/encryption');
      const proposedHeaders = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'YachtSentinel-AI/1.0'
      };
      
      const headerValidation = validateHttpHeaders(proposedHeaders);
      if (!headerValidation.valid) {
        throw new Error(`Invalid headers detected: ${headerValidation.errors.join(', ')}`);
      }
      
      const modelsResponse = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: headerValidation.sanitized,
        signal: controller.signal
      });
      
      debugConsole.logProviderTest(providerId, providerName, 'GROK_MODELS_RESPONSE', 'Models endpoint response received', {
        status: modelsResponse.status,
        statusText: modelsResponse.statusText,
        ok: modelsResponse.ok,
        contentType: modelsResponse.headers.get('content-type')
      });
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        
        if (modelsData.data && Array.isArray(modelsData.data)) {
          availableModels = modelsData.data
            .filter((model: any) => model.object === 'model' && model.id)
            .map((model: any) => model.id)
            .filter(Boolean);
          
          modelsEndpointWorking = true;
          
          debugConsole.logProviderTest(providerId, providerName, 'GROK_MODELS_SUCCESS', 'Model discovery successful', {
            totalModels: availableModels.length,
            models: availableModels,
            dataStructure: 'OpenAI-compatible format'
          });
          
          // Intelligent model selection for testing
          const preferredModels = [
            'grok-beta',           // Most stable
            'grok-2-mini',         // Fast and efficient
            'grok-2-1212',         // Latest version
            'grok-2-latest',       // Latest available
            'grok-2',              // Standard version
            'grok-code-fast-1'     // Code-specific
          ];
          
          const testModel = preferredModels.find(model => availableModels.includes(model)) || availableModels[0];
          
          if (testModel) {
            availableModel = testModel;
            debugConsole.logProviderTest(providerId, providerName, 'GROK_MODEL_SELECTED', 'Optimal model selected for testing', {
              selectedModel: testModel,
              selectionReason: preferredModels.includes(testModel) ? 'preferred_model' : 'first_available',
              allAvailable: availableModels
            });
          } else {
            debugConsole.logProviderTest(providerId, providerName, 'GROK_MODEL_FALLBACK', 'Using fallback model', {
              fallbackModel: availableModel,
              reason: 'No models found in response'
            });
          }
        } else {
          debugConsole.logProviderTest(providerId, providerName, 'GROK_MODELS_FORMAT_ERROR', 'Unexpected models response format', {
            hasData: !!modelsData.data,
            dataType: typeof modelsData.data,
            isArray: Array.isArray(modelsData.data),
            responseKeys: Object.keys(modelsData)
          });
        }
      } else {
        const errorText = await modelsResponse.text();
        let errorDetails: any = { status: modelsResponse.status, rawError: errorText };
        
        try {
          const errorObj = JSON.parse(errorText);
          errorDetails.parsedError = errorObj;
        } catch {
          errorDetails.parseError = 'Not JSON format';
        }
        
        debugConsole.logProviderTest(providerId, providerName, 'GROK_MODELS_ERROR', 'Models endpoint failed', errorDetails);
        
        // Handle specific error cases
        if (modelsResponse.status === 401) {
          throw new Error('Grok API authentication failed - invalid API key. Please verify your key at console.x.ai');
        } else if (modelsResponse.status === 403) {
          throw new Error('Grok API access forbidden - check API key permissions and billing status at console.x.ai');
        } else if (modelsResponse.status >= 500) {
          debugConsole.logProviderTest(providerId, providerName, 'GROK_SERVER_ERROR', 'Server error - will attempt chat test anyway', {
            status: modelsResponse.status,
            fallbackModel: availableModel
          });
          // Don't throw here - server errors on models endpoint might not affect chat
        } else {
          throw new Error(`Grok API error (${modelsResponse.status}): ${errorText}`);
        }
      }
    } catch (modelError: any) {
      if (modelError.name === 'AbortError') {
        throw new Error('Grok API request timed out - check network connection and endpoint URL');
      }
      
      debugConsole.logProviderTest(providerId, providerName, 'GROK_MODELS_EXCEPTION', 'Model discovery encountered exception', {
        error: modelError.message,
        errorType: modelError.constructor?.name,
        fallbackModel: availableModel,
        willContinueWithChatTest: true
      });
      
      // Only re-throw authentication/permission errors
      if (modelError.message.includes('authentication') || 
          modelError.message.includes('forbidden') ||
          modelError.message.includes('API key')) {
        throw modelError;
      }
      
      // For other errors, continue with chat test using fallback model
    }
    
    // Phase 2: Test chat completions with selected model
    const testEndpoint = `${baseUrl}/chat/completions`;
    const testPayload = {
      messages: [
        { role: 'system', content: 'You are a helpful test assistant. Respond concisely.' },
        { role: 'user', content: 'Say "Connection test successful" and nothing else.' }
      ],
      model: availableModel,
      stream: false,
      temperature: 0.1,
      max_tokens: 10
    };

    debugConsole.logProviderTest(providerId, providerName, 'GROK_CHAT_TEST', 'Testing chat completions endpoint', {
      endpoint: testEndpoint,
      model: availableModel,
      payloadSize: JSON.stringify(testPayload).length,
      hasModelsList: modelsEndpointWorking
    });

    const chatStartTime = Date.now();
    
    // Validate headers for chat completions request
    const chatHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'YachtSentinel-AI/1.0'
    };
    
    const { validateHttpHeaders } = await import('@/utils/encryption');
    const chatHeaderValidation = validateHttpHeaders(chatHeaders);
    if (!chatHeaderValidation.valid) {
      throw new Error(`Invalid chat headers detected: ${chatHeaderValidation.errors.join(', ')}`);
    }
    
    const response = await fetch(testEndpoint, {
      method: 'POST',
      headers: chatHeaderValidation.sanitized,
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });
    
    const chatLatency = Date.now() - chatStartTime;

    debugConsole.logProviderTest(providerId, providerName, 'GROK_CHAT_RESPONSE', 'Chat completions response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      latency: `${chatLatency}ms`,
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorObj: any;
      
      try {
        errorObj = JSON.parse(errorText);
      } catch {
        errorObj = { message: errorText, raw: true };
      }
      
      debugConsole.logProviderTest(providerId, providerName, 'GROK_CHAT_ERROR', 'Chat completions failed', {
        status: response.status,
        errorObj,
        testedModel: availableModel,
        availableModels
      });
      
      // Enhanced error handling with actionable suggestions
      if (response.status === 403) {
        const suggestion = availableModels.length > 0 
          ? `Try using one of these available models: ${availableModels.join(', ')}`
          : 'Visit console.x.ai to check your API key model permissions and billing status';
        throw new Error(`Grok API Permission Error: Cannot access model '${availableModel}'. ${suggestion}`);
      } else if (response.status === 401) {
        throw new Error('Grok API authentication failed - check your API key at console.x.ai');
      } else if (response.status === 429) {
        throw new Error('Grok API rate limit exceeded - please try again later or upgrade your plan');
      } else if (response.status >= 500) {
        throw new Error(`Grok API server error (${response.status}) - service may be temporarily unavailable`);
      } else if (response.status === 400) {
        const badRequestMsg = errorObj.error?.message || errorObj.message || 'Bad request';
        throw new Error(`Grok API bad request (${response.status}): ${badRequestMsg}`);
      } else {
        throw new Error(`Grok API error (${response.status}): ${errorObj.error?.message || errorObj.message || errorText}`);
      }
    }

    const responseData = await response.json();
    
    // Validate response structure according to OpenAI format
    if (!responseData.choices || !Array.isArray(responseData.choices) || responseData.choices.length === 0) {
      debugConsole.logProviderTest(providerId, providerName, 'GROK_RESPONSE_INVALID', 'Invalid response structure', {
        hasChoices: !!responseData.choices,
        choicesType: typeof responseData.choices,
        choicesLength: Array.isArray(responseData.choices) ? responseData.choices.length : 'N/A',
        responseKeys: Object.keys(responseData)
      });
      throw new Error('Invalid Grok API response format - missing or empty choices array');
    }
    
    const firstChoice = responseData.choices[0];
    if (!firstChoice.message) {
      throw new Error('Invalid Grok API response format - missing message in first choice');
    }
    
    debugConsole.logProviderTest(providerId, providerName, 'GROK_SUCCESS', 'Grok connection test completed successfully', {
      model: availableModel,
      latency: `${chatLatency}ms`,
      usage: responseData.usage,
      responseId: responseData.id,
      finishReason: firstChoice.finish_reason,
      messageContent: firstChoice.message.content?.substring(0, 50) + '...',
      modelsDiscovered: availableModels.length,
      testSummary: {
        modelsEndpointWorking,
        chatEndpointWorking: true,
        totalLatency: chatLatency,
        modelUsed: availableModel
      }
    });
    
    return {
      success: true,
      details: {
        ...responseData,
        availableModels,
        testedModel: availableModel,
        modelsEndpointWorking,
        latency: chatLatency,
        testMetrics: {
          totalModelsAvailable: availableModels.length,
          endpointsWorking: {
            models: modelsEndpointWorking,
            chat: true
          }
        }
      }
    };
  } catch (error: any) {
    debugConsole.logProviderTest(providerId, providerName, 'GROK_ERROR', 'Grok connection test failed', {
      error: error.message,
      errorType: error.constructor?.name,
      isAbortError: error.name === 'AbortError',
      isTimeoutError: error.message?.includes('timeout'),
      isNetworkError: error.message?.includes('fetch') || error.message?.includes('network'),
      troubleshooting: {
        checkApiKey: 'Verify API key at console.x.ai',
        checkEndpoint: 'Ensure endpoint is https://api.x.ai/v1',
        checkBilling: 'Verify billing status and usage limits',
        checkModels: 'Check model availability and permissions'
      }
    });
    
    return {
      success: false,
      error: error.message || 'Unknown Grok connection error'
    };
  }
}

// OpenAI connection test
async function testOpenAIConnection(
  provider: any,
  apiKey: string,
  controller: AbortController
): Promise<{ success: boolean; error?: string; details?: any }> {
  const providerId = provider.id;
  const providerName = provider.name;
  const baseUrl = provider.api_endpoint;

  try {
    debugConsole.logProviderTest(providerId, providerName, 'OPENAI_TEST', 'Testing OpenAI connection');

    // Test models endpoint first
    const modelsResponse = await fetch(`${baseUrl}/models`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
      signal: controller.signal
    });

    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      throw new Error(`HTTP ${modelsResponse.status}: ${errorText}`);
    }

    const responseData = await modelsResponse.json();
    
    return {
      success: true,
      details: responseData
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Anthropic connection test
async function testAnthropicConnection(
  provider: any,
  apiKey: string,
  controller: AbortController
): Promise<{ success: boolean; error?: string; details?: any }> {
  const providerId = provider.id;
  const providerName = provider.name;
  const baseUrl = provider.api_endpoint;

  try {
    debugConsole.logProviderTest(providerId, providerName, 'ANTHROPIC_TEST', 'Testing Anthropic connection');

    // Anthropic uses x-api-key header
    const testEndpoint = `${baseUrl}/messages`;
    const testPayload = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: 'Test'
      }]
    };

    const response = await fetch(testEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    return {
      success: true,
      details: responseData
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Azure OpenAI connection test
async function testAzureConnection(
  provider: any,
  apiKey: string,
  controller: AbortController
): Promise<{ success: boolean; error?: string; details?: any }> {
  const providerId = provider.id;
  const providerName = provider.name;
  const baseUrl = provider.api_endpoint;

  try {
    debugConsole.logProviderTest(providerId, providerName, 'AZURE_TEST', 'Testing Azure OpenAI connection');

    // Azure uses api-key header
    const response = await fetch(`${baseUrl}/models?api-version=2023-05-15`, {
      headers: {
        'Accept': 'application/json',
        'api-key': apiKey,
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    return {
      success: true,
      details: responseData
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Generic connection test for unknown providers
async function testGenericConnection(
  provider: any,
  apiKey: string,
  controller: AbortController
): Promise<{ success: boolean; error?: string; details?: any }> {
  const providerId = provider.id;
  const providerName = provider.name;
  const baseUrl = provider.api_endpoint;

  try {
    debugConsole.logProviderTest(providerId, providerName, 'GENERIC_TEST', 'Testing generic provider connection');

    // Try standard Bearer token authentication
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    return {
      success: true,
      details: responseData
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

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
// Systematic provider-specific model detection
export const detectAvailableModels = async (
  provider: any,
  apiKey?: string,
  detailed: boolean = true
): Promise<string[]> => {
  const providerId = provider.id;
  const providerName = provider.name;
  const { provider_type } = provider;

  debugConsole.info('MODEL_DETECTION', 'Starting systematic model detection', {
    provider_type,
    endpoint: provider.api_endpoint,
    has_api_key: !!apiKey,
    detailed_mode: detailed
  }, providerId, providerName);

  // Use provider-specific model detection
  switch (provider_type) {
    case 'google':
    case 'gemini':
      return await detectGoogleGeminiModels(provider, apiKey, detailed);
    
    case 'grok':
    case 'xai':
      return await detectXAIModels(provider, apiKey, detailed);
    
    case 'openai':
      return await detectOpenAIModels(provider, apiKey);
    
    case 'anthropic':
      return await detectAnthropicModels(provider, apiKey);
    
    case 'azure':
      return await detectAzureModels(provider, apiKey);
    
    default:
      return await detectGenericModels(provider, apiKey);
  }
};

// Google Gemini model detection with query parameter authentication
async function detectGoogleGeminiModels(
  provider: any,
  apiKey?: string,
  detailed: boolean = true
): Promise<string[]> {
  const providerId = provider.id;
  const providerName = provider.name;

  if (!apiKey) {
    throw new Error('Google Gemini API key is required for model discovery');
  }

  try {
    // Use the user-configured API endpoint (e.g., https://generativelanguage.googleapis.com/v1beta)
    // Google Gemini uses query parameters for authentication
    const modelsEndpoint = `${provider.api_endpoint}/models?key=${apiKey}`;
    
    debugConsole.info('MODEL_DETECTION', 'Calling Google Gemini models endpoint', {
      endpoint: modelsEndpoint.replace(apiKey, 'API_KEY_HIDDEN'),
      configured_endpoint: provider.api_endpoint,
      method: 'GET',
      auth_method: 'query_parameter'
    }, providerId, providerName);

    const response = await fetch(modelsEndpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
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
      
      debugConsole.error('MODEL_DETECTION', `Google Gemini API call failed (${response.status})`, {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails,
        suggestion: response.status === 401 
          ? 'Check API key validity and ensure Generative AI API is enabled' 
          : response.status === 403
            ? 'Verify API key has access to Generative AI models'
            : 'Check endpoint accessibility and network connectivity'
      }, providerId, providerName);
      
      throw new Error(`Google Gemini API Error (${response.status}): ${errorDetails.error?.message || errorDetails.message || errorText}`);
    }

    const data = await response.json();
    let models: string[] = [];
    
    // Parse Google Gemini response format
    if (data.models && Array.isArray(data.models)) {
      models = data.models
        .filter((model: any) => model.name && model.supportedGenerationMethods)
        .map((model: any) => {
          // Extract model ID from full name (e.g., "models/gemini-1.5-flash" -> "gemini-1.5-flash")
          return model.name.replace('models/', '');
        })
        .filter(Boolean);
      
      debugConsole.success('MODEL_DETECTION', 'Successfully detected Google Gemini models', {
        total_models: models.length,
        sample_models: models.slice(0, 5),
        response_structure: 'Google Gemini format'
      }, providerId, providerName);
    } else {
      debugConsole.warn('MODEL_DETECTION', 'Unexpected response format from Google Gemini API', {
        response_keys: Object.keys(data),
        has_models_array: !!data.models
      }, providerId, providerName);
    }

    if (models.length === 0) {
      throw new Error('Google Gemini API returned no models. Please verify your API key has access to Generative AI models.');
    }

    return models;
    
  } catch (error: any) {
    debugConsole.error('MODEL_DETECTION', `Google Gemini model detection failed: ${error.message}`, {
      error: error.message,
      provider_type: provider.provider_type
    }, providerId, providerName);
    
    throw error;
  }
}

// X.AI/Grok model detection with Bearer token authentication
async function detectXAIModels(
  provider: any,
  apiKey?: string,
  detailed: boolean = true
): Promise<string[]> {
  const providerId = provider.id;
  const providerName = provider.name;

  if (!apiKey) {
    throw new Error('X.AI API key is required for model discovery');
  }

  try {
    // Use enhanced language-models endpoint for detailed info when available
    let modelsEndpoint = detailed 
      ? `${provider.api_endpoint}/language-models`  // Full model info with pricing, modalities
      : `${provider.api_endpoint}/models`;          // Basic model info
      
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    debugConsole.info('MODEL_DETECTION', `Calling X.AI ${detailed ? 'language-models' : 'models'} endpoint`, {
      endpoint: modelsEndpoint,
      method: 'GET',
      auth_method: 'bearer_token',
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
      
      debugConsole.error('MODEL_DETECTION', `X.AI API call failed (${response.status})`, {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails,
        suggestion: response.status === 401 
          ? 'Check API key validity at https://console.x.ai' 
          : response.status === 403
            ? 'Verify API key has model access permissions'
            : 'Check endpoint accessibility and network connectivity'
      }, providerId, providerName);
      
      throw new Error(`X.AI API Error (${response.status}): ${errorDetails.message || errorText}`);
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

    if (models.length === 0) {
      throw new Error('X.AI API returned no models. Please verify your API key has access to models.');
    }

    return models;
    
  } catch (error: any) {
    debugConsole.error('MODEL_DETECTION', `X.AI model detection failed: ${error.message}`, {
      error: error.message,
      provider_type: provider.provider_type
    }, providerId, providerName);
    
    throw error;
  }
}

// OpenAI model detection
async function detectOpenAIModels(
  provider: any,
  apiKey?: string
): Promise<string[]> {
  const providerId = provider.id;
  const providerName = provider.name;

  if (!apiKey) {
    throw new Error('OpenAI API key is required for model discovery');
  }

  try {
    const modelsEndpoint = `${provider.api_endpoint}/models`;
    
    const response = await fetch(modelsEndpoint, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const models = data.data
      ?.filter((model: any) => model.object === 'model')
      ?.map((model: any) => model.id)
      ?.filter(Boolean) || [];

    debugConsole.success('MODEL_DETECTION', `Detected ${models.length} OpenAI models`, {
      total_models: models.length,
      sample_models: models.slice(0, 5)
    }, providerId, providerName);

    return models;
    
  } catch (error: any) {
    debugConsole.error('MODEL_DETECTION', `OpenAI model detection failed: ${error.message}`, {
      error: error.message
    }, providerId, providerName);
    
    throw error;
  }
}

// Anthropic model detection
async function detectAnthropicModels(
  provider: any,
  apiKey?: string
): Promise<string[]> {
  // Anthropic doesn't have a public models endpoint, return known models
  const knownModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ];

  debugConsole.success('MODEL_DETECTION', `Using known Anthropic models`, {
    total_models: knownModels.length,
    models: knownModels
  }, provider.id, provider.name);

  return knownModels;
}

// Azure OpenAI model detection
async function detectAzureModels(
  provider: any,
  apiKey?: string
): Promise<string[]> {
  const providerId = provider.id;
  const providerName = provider.name;

  if (!apiKey) {
    throw new Error('Azure OpenAI API key is required for model discovery');
  }

  try {
    const modelsEndpoint = `${provider.api_endpoint}/models?api-version=2023-05-15`;
    
    const response = await fetch(modelsEndpoint, {
      headers: {
        'Accept': 'application/json',
        'api-key': apiKey,
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const models = data.data
      ?.filter((model: any) => model.object === 'model')
      ?.map((model: any) => model.id)
      ?.filter(Boolean) || [];

    debugConsole.success('MODEL_DETECTION', `Detected ${models.length} Azure OpenAI models`, {
      total_models: models.length,
      sample_models: models.slice(0, 5)
    }, providerId, providerName);

    return models;
    
  } catch (error: any) {
    debugConsole.error('MODEL_DETECTION', `Azure OpenAI model detection failed: ${error.message}`, {
      error: error.message
    }, providerId, providerName);
    
    throw error;
  }
}

// Generic model detection for custom providers
async function detectGenericModels(
  provider: any,
  apiKey?: string
): Promise<string[]> {
  const providerId = provider.id;
  const providerName = provider.name;

  if (!apiKey) {
    throw new Error('API key is required for model discovery');
  }

  try {
    const modelsEndpoint = `${provider.api_endpoint}/models`;
    
    const response = await fetch(modelsEndpoint, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'YachtSentinel-AI/1.0'
      },
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const models = data.data
      ?.filter((model: any) => model.object === 'model')
      ?.map((model: any) => model.id)
      ?.filter(Boolean) || [];

    debugConsole.success('MODEL_DETECTION', `Detected ${models.length} models from generic provider`, {
      total_models: models.length,
      sample_models: models.slice(0, 5)
    }, providerId, providerName);

    return models;
    
  } catch (error: any) {
    debugConsole.error('MODEL_DETECTION', `Generic model detection failed: ${error.message}`, {
      error: error.message
    }, providerId, providerName);
    
    throw error;
  }
}

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