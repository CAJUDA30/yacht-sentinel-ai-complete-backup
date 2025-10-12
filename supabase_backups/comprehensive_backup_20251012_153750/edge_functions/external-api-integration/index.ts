import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface APIRequest {
  service: 'expensya' | 'stripe' | 'shippo' | 'sendgrid' | 'whatsapp_business';
  action: string;
  yacht_id: string;
  data?: any;
  options?: {
    test_mode?: boolean;
    retry_count?: number;
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const requestData: APIRequest = await req.json();
    console.log(`🔌 External API: ${requestData.service}.${requestData.action} for yacht ${requestData.yacht_id}`);

    // Get API configuration
    const config = await getAPIConfig(requestData.yacht_id, requestData.service);
    if (!config) {
      throw new Error(`No API configuration found for ${requestData.service}`);
    }

    // Route to appropriate service handler
    let result;
    switch (requestData.service) {
      case 'expensya':
        result = await handleExpensya(requestData, config);
        break;
      case 'stripe':
        result = await handleStripe(requestData, config);
        break;
      case 'shippo':
        result = await handleShippo(requestData, config);
        break;
      case 'sendgrid':
        result = await handleSendGrid(requestData, config);
        break;
      case 'whatsapp_business':
        result = await handleWhatsApp(requestData, config);
        break;
      default:
        throw new Error(`Unsupported service: ${requestData.service}`);
    }

    // Log API call
    await logAPICall(requestData, result, Date.now() - startTime);

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      service_response: result.service_response,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 API Integration error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'API integration failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getAPIConfig(yachtId: string, serviceName: string): Promise<any> {
  const { data, error } = await supabase
    .from('yacht_api_configs')
    .select('*')
    .eq('yacht_id', yachtId)
    .eq('service_name', serviceName)
    .eq('is_enabled', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    yacht_id: yachtId,
    api_key: data.api_key_encrypted, // In production, decrypt this
    custom_config: data.custom_config,
    test_mode: data.test_mode
  };
}

async function handleExpensya(request: APIRequest, config: any): Promise<any> {
  const headers = {
    'Authorization': `Bearer ${config.api_key}`,
    'Content-Type': 'application/json'
  };

  switch (request.action) {
    case 'sync_expense_reports':
      const response = await fetch('https://api.expensya.com/v2/expense-reports', {
        headers: headers
      });
      
      if (!response.ok) throw new Error(`Expensya API error: ${response.status}`);
      
      const reports = await response.json();
      
      // Sync to database
      for (const report of reports.data || []) {
        await supabase.from('expensya_expense_reports').upsert({
          yacht_id: config.yacht_id,
          expensya_report_id: report.id,
          report_title: report.title,
          report_status: report.status,
          total_amount: report.total_amount,
          currency: report.currency,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        });
      }
      
      return { data: { reports_synced: reports.data?.length || 0 }, service_response: reports };

    default:
      throw new Error(`Unsupported Expensya action: ${request.action}`);
  }
}

async function handleStripe(request: APIRequest, config: any): Promise<any> {
  const headers = {
    'Authorization': `Bearer ${config.api_key}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  switch (request.action) {
    case 'create_payment_intent':
      const body = new URLSearchParams({
        amount: request.data.amount.toString(),
        currency: request.data.currency || 'usd',
        description: request.data.description || ''
      });

      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: headers,
        body: body
      });

      if (!response.ok) throw new Error(`Stripe API error: ${response.status}`);
      
      const result = await response.json();
      
      // Store transaction
      await supabase.from('stripe_transactions').insert({
        yacht_id: config.yacht_id,
        stripe_payment_intent_id: result.id,
        amount: result.amount / 100,
        currency: result.currency,
        status: result.status,
        description: result.description
      });

      return { data: result, service_response: result };

    default:
      throw new Error(`Unsupported Stripe action: ${request.action}`);
  }
}

async function handleShippo(request: APIRequest, config: any): Promise<any> {
  const headers = {
    'Authorization': `ShippoToken ${config.api_key}`,
    'Content-Type': 'application/json'
  };

  switch (request.action) {
    case 'create_shipment':
      const response = await fetch('https://api.goshippo.com/shipments/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          address_from: request.data.from_address,
          address_to: request.data.to_address,
          parcels: request.data.packages
        })
      });

      if (!response.ok) throw new Error(`Shippo API error: ${response.status}`);
      
      const result = await response.json();
      
      // Store shipment
      await supabase.from('shippo_shipments').insert({
        yacht_id: config.yacht_id,
        shippo_shipment_id: result.object_id,
        from_address: request.data.from_address,
        to_address: request.data.to_address,
        packages: request.data.packages,
        shipment_status: 'created'
      });

      return { data: result, service_response: result };

    default:
      throw new Error(`Unsupported Shippo action: ${request.action}`);
  }
}

async function handleSendGrid(request: APIRequest, config: any): Promise<any> {
  const headers = {
    'Authorization': `Bearer ${config.api_key}`,
    'Content-Type': 'application/json'
  };

  switch (request.action) {
    case 'send_email':
      const emailData = {
        personalizations: [{
          to: [{ email: request.data.to_email }],
          subject: request.data.subject
        }],
        from: { email: request.data.from_email },
        content: [{ type: 'text/html', value: request.data.html_content }]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(emailData)
      });

      if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`);
      
      const messageId = response.headers.get('X-Message-Id');
      
      // Log email
      await supabase.from('sendgrid_email_logs').insert({
        yacht_id: config.yacht_id,
        sendgrid_message_id: messageId,
        email_type: request.data.email_type || 'transactional',
        recipient_email: request.data.to_email,
        subject: request.data.subject,
        status: 'sent'
      });

      return { data: { message_id: messageId }, service_response: { status: 'sent' } };

    default:
      throw new Error(`Unsupported SendGrid action: ${request.action}`);
  }
}

async function handleWhatsApp(request: APIRequest, config: any): Promise<any> {
  const headers = {
    'Authorization': `Bearer ${config.api_key}`,
    'Content-Type': 'application/json'
  };

  switch (request.action) {
    case 'send_message':
      const messageData = {
        messaging_product: 'whatsapp',
        to: request.data.phone_number,
        type: 'text',
        text: { body: request.data.content }
      };

      const response = await fetch(`https://graph.facebook.com/v18.0/${config.custom_config.phone_number_id}/messages`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(messageData)
      });

      if (!response.ok) throw new Error(`WhatsApp API error: ${response.status}`);
      
      const result = await response.json();
      
      // Store message (simplified)
      await supabase.from('whatsapp_messages').insert({
        yacht_id: config.yacht_id,
        whatsapp_message_id: result.messages[0].id,
        direction: 'outbound',
        message_type: 'text',
        content: request.data.content,
        status: 'sent'
      });

      return { data: result, service_response: result };

    default:
      throw new Error(`Unsupported WhatsApp action: ${request.action}`);
  }
}

async function logAPICall(request: APIRequest, result: any, responseTime: number): Promise<void> {
  try {
    await supabase.from('api_call_logs').insert({
      yacht_id: request.yacht_id,
      service_name: request.service,
      endpoint: request.action,
      method: 'POST',
      request_data: request.data,
      response_data: result.data,
      response_status: result.error ? 500 : 200,
      response_time_ms: responseTime,
      error_message: result.error
    });
  } catch (error) {
    console.error('Failed to log API call:', error);
  }
}