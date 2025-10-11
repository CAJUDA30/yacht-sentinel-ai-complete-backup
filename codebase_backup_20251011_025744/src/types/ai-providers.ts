export interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  auth_method: 'api_key' | 'oauth' | 'service_account';
  is_active: boolean;
  is_primary: boolean;
  config: AIProviderConfig;
  capabilities: AICapability[];
  supported_languages: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  cost_tracking_enabled: boolean;
  health_check_endpoint?: string;
  documentation_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AIProviderConfig {
  endpoints: {
    chat?: string;
    completion?: string;
    models?: string;
    embeddings?: string;
    vision?: string;
    test?: string;
  };
  auth: {
    header_name: string;
    secret_name?: string;
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
    fine_tuning: boolean;
  };
}

export type AICapability = 
  | 'text_generation'
  | 'chat_completion' 
  | 'vision'
  | 'ocr'
  | 'translation'
  | 'embeddings'
  | 'function_calling'
  | 'code_generation'
  | 'image_generation'
  | 'audio_transcription'
  | 'sentiment_analysis';

export interface AIModel {
  id: string;
  provider_id: string;
  model_id: string;
  model_name: string;
  model_type: string;
  priority: number;
  is_active: boolean;
  max_context_length: number;
  cost_per_1k_tokens: number;
  supports_vision: boolean;
  supports_function_calling: boolean;
  parameters: Record<string, any>;
  rate_limits: {
    per_minute: number;
    per_hour: number;
    per_day?: number;
  };
  specialization: string[];
  response_time_avg_ms: number;
  success_rate: number;
  last_health_check?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderTemplate {
  name: string;
  provider_type: string;
  description: string;
  base_url: string;
  documentation_url: string;
  logo?: string;
  config: Partial<AIProviderConfig>;
  capabilities: AICapability[];
  setup_steps: string[];
  credentials_required: {
    name: string;
    type: 'api_key' | 'oauth' | 'service_account';
    description: string;
    secret_name: string;
  }[];
}

export interface ProviderTestResult {
  success: boolean;
  latency_ms?: number;
  error?: string;
  details?: Record<string, any>;
  models_discovered?: number;
  timestamp: string;
}

export interface ModelDiscoveryResult {
  models: AIModel[];
  total_discovered: number;
  latency_ms: number;
  errors: string[];
}

export interface AIConfiguration {
  providers: AIProvider[];
  models: AIModel[];
  active_provider_count: number;
  total_model_count: number;
  health_status: 'healthy' | 'degraded' | 'error';
  last_updated: string;
}