-- External API Integrations Schema
-- Comprehensive management of third-party service integrations

-- API service configurations and credentials
CREATE TABLE IF NOT EXISTS public.api_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT UNIQUE NOT NULL CHECK (service_name IN (
    'expensya', 'stripe', 'shippo', 'sendgrid', 'whatsapp_business', 
    'google_vision', 'openai', 'anthropic', 'xai', 'gemini'
  )),
  display_name TEXT NOT NULL,
  description TEXT,
  api_version TEXT DEFAULT 'v1',
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('api_key', 'oauth2', 'bearer_token', 'basic_auth')),
  rate_limits JSONB DEFAULT '{}', -- Rate limiting configuration
  retry_config JSONB DEFAULT '{}', -- Retry policy configuration
  webhook_config JSONB DEFAULT '{}', -- Webhook endpoint configuration
  is_active BOOLEAN DEFAULT true,
  health_check_url TEXT,
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Yacht-specific API configurations
CREATE TABLE IF NOT EXISTS public.yacht_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  service_name TEXT NOT NULL REFERENCES api_services(service_name),
  api_key_encrypted TEXT, -- Encrypted API credentials
  oauth_tokens JSONB, -- OAuth tokens (encrypted)
  custom_config JSONB DEFAULT '{}', -- Service-specific configuration
  is_enabled BOOLEAN DEFAULT true,
  test_mode BOOLEAN DEFAULT false,
  usage_limits JSONB DEFAULT '{}', -- Usage quotas and billing limits
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(yacht_id, service_name)
);

-- API call logs and monitoring
CREATE TABLE IF NOT EXISTS public.api_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  service_name TEXT NOT NULL REFERENCES api_services(service_name),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  request_id TEXT, -- Unique request identifier
  user_id UUID REFERENCES auth.users(id),
  request_data JSONB,
  response_data JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  billing_units DECIMAL DEFAULT 0, -- For usage tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook event handling
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID,
  service_name TEXT NOT NULL REFERENCES api_services(service_name),
  event_type TEXT NOT NULL,
  event_id TEXT, -- External service event ID
  payload JSONB NOT NULL,
  signature TEXT, -- Webhook signature for verification
  processed BOOLEAN DEFAULT false,
  processing_attempts INTEGER DEFAULT 0,
  last_processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Expensya integration tables
CREATE TABLE IF NOT EXISTS public.expensya_expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  expensya_report_id TEXT UNIQUE NOT NULL,
  report_title TEXT NOT NULL,
  report_status TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  submission_date DATE,
  approval_date DATE,
  expense_items JSONB DEFAULT '[]',
  receipt_urls JSONB DEFAULT '[]',
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe integration tables
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  billing_address JSONB,
  payment_methods JSONB DEFAULT '[]',
  subscription_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stripe_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  invoice_id UUID, -- Link to internal invoicing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shippo integration tables
CREATE TABLE IF NOT EXISTS public.shippo_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  shippo_shipment_id TEXT UNIQUE NOT NULL,
  tracking_number TEXT,
  carrier TEXT,
  service_level TEXT,
  from_address JSONB NOT NULL,
  to_address JSONB NOT NULL,
  packages JSONB NOT NULL,
  shipment_status TEXT DEFAULT 'pending',
  estimated_delivery DATE,
  actual_delivery DATE,
  shipping_cost DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  label_url TEXT,
  tracking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SendGrid integration tables
CREATE TABLE IF NOT EXISTS public.sendgrid_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  sendgrid_campaign_id TEXT UNIQUE,
  template_id TEXT,
  subject TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_lists JSONB DEFAULT '[]',
  content_html TEXT,
  content_text TEXT,
  send_status TEXT DEFAULT 'draft' CHECK (send_status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivery_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sendgrid_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  sendgrid_message_id TEXT UNIQUE NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('transactional', 'marketing', 'alert', 'notification')),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  template_id TEXT,
  status TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Business integration tables
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  conversation_status TEXT DEFAULT 'active' CHECK (conversation_status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  yacht_id UUID NOT NULL,
  whatsapp_message_id TEXT UNIQUE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'document', 'location', 'template')),
  content TEXT,
  media_url TEXT,
  template_name TEXT,
  template_params JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API usage analytics and billing
CREATE TABLE IF NOT EXISTS public.api_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  service_name TEXT NOT NULL REFERENCES api_services(service_name),
  usage_date DATE NOT NULL,
  total_calls INTEGER DEFAULT 0,
  successful_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  billing_units_used DECIMAL DEFAULT 0,
  quota_used_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(yacht_id, service_name, usage_date)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_yacht_api_configs_yacht ON yacht_api_configs(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_api_configs_service ON yacht_api_configs(service_name);
CREATE INDEX IF NOT EXISTS idx_yacht_api_configs_enabled ON yacht_api_configs(is_enabled) WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS idx_api_call_logs_yacht ON api_call_logs(yacht_id);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_service ON api_call_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_created ON api_call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_status ON api_call_logs(response_status);

CREATE INDEX IF NOT EXISTS idx_webhook_events_service ON webhook_events(service_name);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expensya_reports_yacht ON expensya_expense_reports(yacht_id);
CREATE INDEX IF NOT EXISTS idx_expensya_reports_status ON expensya_expense_reports(report_status);
CREATE INDEX IF NOT EXISTS idx_expensya_reports_sync ON expensya_expense_reports(sync_status);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_yacht ON stripe_customers(yacht_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_yacht ON stripe_transactions(yacht_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_status ON stripe_transactions(status);

CREATE INDEX IF NOT EXISTS idx_shippo_shipments_yacht ON shippo_shipments(yacht_id);
CREATE INDEX IF NOT EXISTS idx_shippo_shipments_status ON shippo_shipments(shipment_status);
CREATE INDEX IF NOT EXISTS idx_shippo_tracking ON shippo_shipments(tracking_number);

CREATE INDEX IF NOT EXISTS idx_sendgrid_campaigns_yacht ON sendgrid_email_campaigns(yacht_id);
CREATE INDEX IF NOT EXISTS idx_sendgrid_logs_yacht ON sendgrid_email_logs(yacht_id);
CREATE INDEX IF NOT EXISTS idx_sendgrid_logs_email ON sendgrid_email_logs(recipient_email);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_yacht ON whatsapp_conversations(yacht_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_analytics_yacht_date ON api_usage_analytics(yacht_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_service ON api_usage_analytics(service_name);

-- Enable Row Level Security
ALTER TABLE yacht_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expensya_expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippo_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sendgrid_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sendgrid_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (yacht-based access control)
CREATE POLICY "Users can manage their yacht's API configs" ON yacht_api_configs
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their yacht's API logs" ON api_call_logs
  FOR SELECT USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's webhook events" ON webhook_events
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's Expensya data" ON expensya_expense_reports
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's Stripe data" ON stripe_customers
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's transactions" ON stripe_transactions
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's shipments" ON shippo_shipments
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's email campaigns" ON sendgrid_email_campaigns
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's email logs" ON sendgrid_email_logs
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's WhatsApp conversations" ON whatsapp_conversations
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's WhatsApp messages" ON whatsapp_messages
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their yacht's usage analytics" ON api_usage_analytics
  FOR SELECT USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

-- Insert default API service configurations
INSERT INTO api_services (service_name, display_name, description, base_url, auth_type, rate_limits) VALUES
(
  'expensya',
  'Expensya Expense Management',
  'Automated expense report processing and receipt management',
  'https://api.expensya.com',
  'api_key',
  '{"requests_per_minute": 100, "requests_per_day": 5000}'
),
(
  'stripe',
  'Stripe Payment Processing',
  'Payment processing, subscriptions, and billing management',
  'https://api.stripe.com',
  'bearer_token',
  '{"requests_per_second": 25, "requests_per_hour": 1000}'
),
(
  'shippo',
  'Shippo Shipping & Logistics',
  'Shipping label generation, tracking, and logistics management',
  'https://api.goshippo.com',
  'bearer_token',
  '{"requests_per_minute": 120, "requests_per_day": 10000}'
),
(
  'sendgrid',
  'SendGrid Email Service',
  'Transactional and marketing email delivery',
  'https://api.sendgrid.com',
  'bearer_token',
  '{"emails_per_day": 100000, "requests_per_minute": 600}'
),
(
  'whatsapp_business',
  'WhatsApp Business API',
  'WhatsApp messaging for customer communication',
  'https://graph.facebook.com',
  'bearer_token',
  '{"messages_per_second": 20, "messages_per_day": 100000}'
)
ON CONFLICT (service_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  base_url = EXCLUDED.base_url,
  auth_type = EXCLUDED.auth_type,
  rate_limits = EXCLUDED.rate_limits,
  updated_at = NOW();

-- Grant permissions
GRANT SELECT ON api_services TO authenticated;
GRANT ALL ON yacht_api_configs TO authenticated;
GRANT ALL ON api_call_logs TO authenticated;
GRANT ALL ON webhook_events TO authenticated;
GRANT ALL ON expensya_expense_reports TO authenticated;
GRANT ALL ON stripe_customers TO authenticated;
GRANT ALL ON stripe_transactions TO authenticated;
GRANT ALL ON shippo_shipments TO authenticated;
GRANT ALL ON sendgrid_email_campaigns TO authenticated;
GRANT ALL ON sendgrid_email_logs TO authenticated;
GRANT ALL ON whatsapp_conversations TO authenticated;
GRANT ALL ON whatsapp_messages TO authenticated;
GRANT SELECT ON api_usage_analytics TO authenticated;

COMMENT ON TABLE api_services IS 'Configuration and metadata for external API services';
COMMENT ON TABLE yacht_api_configs IS 'Yacht-specific API credentials and configurations';
COMMENT ON TABLE api_call_logs IS 'Comprehensive logging of all external API calls';
COMMENT ON TABLE webhook_events IS 'Incoming webhook events from external services';
COMMENT ON TABLE expensya_expense_reports IS 'Synchronized expense reports from Expensya';
COMMENT ON TABLE stripe_customers IS 'Stripe customer profiles linked to yachts';
COMMENT ON TABLE stripe_transactions IS 'Payment transactions processed through Stripe';
COMMENT ON TABLE shippo_shipments IS 'Shipping and logistics data from Shippo';
COMMENT ON TABLE sendgrid_email_campaigns IS 'Email marketing campaigns via SendGrid';
COMMENT ON TABLE sendgrid_email_logs IS 'Email delivery logs and analytics';
COMMENT ON TABLE whatsapp_conversations IS 'WhatsApp Business conversation threads';
COMMENT ON TABLE whatsapp_messages IS 'Individual WhatsApp messages and status';
COMMENT ON TABLE api_usage_analytics IS 'API usage tracking and billing analytics';