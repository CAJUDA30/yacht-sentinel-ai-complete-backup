import { ProviderTemplate } from '@/types/ai-providers';

export const PROVIDER_TEMPLATES: Record<string, ProviderTemplate> = {
  openai: {
    name: 'OpenAI',
    provider_type: 'openai',
    description: 'OpenAI GPT models including GPT-4, GPT-4o, and GPT-3.5',
    base_url: 'https://api.openai.com',
    documentation_url: 'https://platform.openai.com/docs/api-reference',
    logo: '/logos/openai.png',
    config: {
      endpoints: {
        chat: '/v1/chat/completions',
        models: '/v1/models',
        embeddings: '/v1/embeddings',
        test: '/v1/models'
      },
      auth: {
        header_name: 'Authorization',
        token_prefix: 'Bearer',
        secret_name: 'OPENAI_API_KEY'
      },
      defaults: {
        temperature: 0.7,
        max_tokens: 4096,
        timeout: 30000,
        max_retries: 3
      },
      features: {
        streaming: true,
        function_calling: true,
        vision: true,
        embeddings: true,
        fine_tuning: true
      }
    },
    capabilities: [
      'text_generation',
      'chat_completion',
      'vision',
      'embeddings',
      'function_calling',
      'code_generation'
    ],
    setup_steps: [
      'Create OpenAI account at https://platform.openai.com',
      'Generate API key from dashboard',
      'Add OPENAI_API_KEY to Yacht Excel secrets',
      'Test connection and discover models'
    ],
    credentials_required: [{
      name: 'API Key',
      type: 'api_key',
      description: 'Your OpenAI API key from platform.openai.com',
      secret_name: 'OPENAI_API_KEY'
    }]
  },

  google_vertex: {
    name: 'Google Vertex AI',
    provider_type: 'google_vertex',
    description: 'Google Gemini models via Vertex AI',
    base_url: 'https://us-central1-aiplatform.googleapis.com',
    documentation_url: 'https://cloud.google.com/vertex-ai/docs',
    logo: '/logos/google.png',
    config: {
      endpoints: {
        chat: '/v1/projects/{project_id}/locations/{location}/publishers/google/models/{model}:generateContent',
        models: '/v1/projects/{project_id}/locations/{location}/models',
        test: '/v1/projects/{project_id}/locations/{location}/publishers/google/models/gemini-pro:generateContent'
      },
      auth: {
        header_name: 'Authorization',
        token_prefix: 'Bearer',
        secret_name: 'GOOGLE_VERTEX_API_KEY'
      },
      defaults: {
        temperature: 0.2,
        max_tokens: 8192,
        timeout: 45000,
        max_retries: 3
      },
      features: {
        streaming: true,
        function_calling: true,
        vision: true,
        embeddings: true,
        fine_tuning: false
      }
    },
    capabilities: [
      'text_generation',
      'chat_completion',
      'vision',
      'embeddings',
      'function_calling',
      'code_generation'
    ],
    setup_steps: [
      'Create Google Cloud project',
      'Enable Vertex AI API',
      'Create service account or API key',
      'Add credentials to Yacht Excel secrets',
      'Configure project ID and location'
    ],
    credentials_required: [{
      name: 'Service Account Key',
      type: 'service_account',
      description: 'Google Cloud service account JSON key',
      secret_name: 'GOOGLE_VERTEX_SERVICE_ACCOUNT'
    }]
  },

  anthropic: {
    name: 'Anthropic Claude',
    provider_type: 'anthropic',
    description: 'Anthropic Claude models for advanced reasoning',
    base_url: 'https://api.anthropic.com',
    documentation_url: 'https://docs.anthropic.com/claude/reference',
    logo: '/logos/anthropic.png',
    config: {
      endpoints: {
        chat: '/v1/messages',
        models: '/v1/models',
        test: '/v1/messages'
      },
      auth: {
        header_name: 'x-api-key',
        secret_name: 'ANTHROPIC_API_KEY'
      },
      defaults: {
        temperature: 0.7,
        max_tokens: 4096,
        timeout: 60000,
        max_retries: 3
      },
      features: {
        streaming: true,
        function_calling: true,
        vision: true,
        embeddings: false,
        fine_tuning: false
      }
    },
    capabilities: [
      'text_generation',
      'chat_completion',
      'vision',
      'function_calling',
      'code_generation',
      'sentiment_analysis'
    ],
    setup_steps: [
      'Sign up for Anthropic Claude API',
      'Get API key from console',
      'Add ANTHROPIC_API_KEY to Yacht Excel secrets',
      'Test connection'
    ],
    credentials_required: [{
      name: 'API Key',
      type: 'api_key',
      description: 'Your Anthropic API key',
      secret_name: 'ANTHROPIC_API_KEY'
    }]
  },

  xai_grok: {
    name: 'xAI Grok',
    provider_type: 'xai',
    description: 'Grok models by xAI for real-time information and reasoning',
    base_url: 'https://api.x.ai/v1',
    documentation_url: 'https://docs.x.ai',
    logo: '/logos/xai.png',
    config: {
      endpoints: {
        chat: '/chat/completions',
        models: '/models',
        test: '/chat/completions'
      },
      auth: {
        header_name: 'Authorization',
        token_prefix: 'Bearer',
        secret_name: 'GROK_API_KEY'
      },
      defaults: {
        temperature: 0.3,
        max_tokens: 8192,
        timeout: 30000,
        max_retries: 3
      },
      features: {
        streaming: true,
        function_calling: true,
        vision: true,
        embeddings: false,
        fine_tuning: false
      }
    },
    capabilities: [
      'text_generation',
      'chat_completion',
      'vision',
      'function_calling',
      'code_generation',
      'translation',
      'sentiment_analysis'
    ],
    setup_steps: [
      'Get access to xAI Grok API at https://console.x.ai',
      'Generate API key with appropriate model permissions',
      'Add GROK_API_KEY to environment variables',
      'Test connection and discover available models'
    ],
    credentials_required: [{
      name: 'API Key',
      type: 'api_key',
      description: 'Your xAI Grok API key from console.x.ai',
      secret_name: 'GROK_API_KEY'
    }]
  },

  deepseek: {
    name: 'DeepSeek',
    provider_type: 'deepseek',
    description: 'DeepSeek models for technical reasoning and coding',
    base_url: 'https://api.deepseek.com',
    documentation_url: 'https://platform.deepseek.com/api-docs',
    logo: '/logos/deepseek.png',
    config: {
      endpoints: {
        chat: '/v1/chat/completions',
        models: '/v1/models',
        test: '/v1/chat/completions'
      },
      auth: {
        header_name: 'Authorization',
        token_prefix: 'Bearer',
        secret_name: 'DEEPSEEK_API_KEY'
      },
      defaults: {
        temperature: 0.1,
        max_tokens: 4096,
        timeout: 30000,
        max_retries: 3
      },
      features: {
        streaming: true,
        function_calling: true,
        vision: false,
        embeddings: false,
        fine_tuning: false
      }
    },
    capabilities: [
      'text_generation',
      'chat_completion',
      'function_calling',
      'code_generation'
    ],
    setup_steps: [
      'Create DeepSeek account',
      'Generate API key from dashboard',
      'Add DEEPSEEK_API_KEY to Yacht Excel secrets',
      'Test connection'
    ],
    credentials_required: [{
      name: 'API Key',
      type: 'api_key',
      description: 'Your DeepSeek API key',
      secret_name: 'DEEPSEEK_API_KEY'
    }]
  },

  custom: {
    name: 'Custom Provider',
    provider_type: 'custom',
    description: 'Add any OpenAI-compatible REST API',
    base_url: '',
    documentation_url: '',
    config: {
      endpoints: {
        chat: '/v1/chat/completions',
        models: '/v1/models',
        test: '/v1/chat/completions'
      },
      auth: {
        header_name: 'Authorization',
        token_prefix: 'Bearer'
      },
      defaults: {
        temperature: 0.7,
        max_tokens: 4096,
        timeout: 30000,
        max_retries: 3
      },
      features: {
        streaming: false,
        function_calling: false,
        vision: false,
        embeddings: false,
        fine_tuning: false
      }
    },
    capabilities: ['text_generation', 'chat_completion'],
    setup_steps: [
      'Prepare your API endpoint URL',
      'Get authentication credentials',
      'Configure endpoint paths',
      'Test connection'
    ],
    credentials_required: [{
      name: 'API Key',
      type: 'api_key',
      description: 'Authentication credentials for your custom API',
      secret_name: 'CUSTOM_API_KEY'
    }]
  }
};

export const getProviderTemplate = (providerType: string): ProviderTemplate | undefined => {
  return PROVIDER_TEMPLATES[providerType];
};

export const getAvailableTemplates = (): ProviderTemplate[] => {
  return Object.values(PROVIDER_TEMPLATES);
};
export const getProviderLogo = (providerType: string): string | undefined => {
  // Map provider_type to template key for logo lookup
  const typeMap: Record<string, string> = {
    'openai': 'openai',
    'anthropic': 'anthropic', 
    'xai': 'xai_grok',
    'grok': 'xai_grok',
    'google': 'google_vertex',
    'google_vertex': 'google_vertex',
    'deepseek': 'deepseek',
    'custom': 'custom'
  };
  
  const templateKey = typeMap[providerType?.toLowerCase()];
  return templateKey ? PROVIDER_TEMPLATES[templateKey]?.logo : undefined;
};
