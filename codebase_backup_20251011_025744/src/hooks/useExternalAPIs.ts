import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface APIService {
  service_name: string;
  display_name: string;
  description: string;
  is_active: boolean;
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

export interface YachtAPIConfig {
  id: string;
  yacht_id: string;
  service_name: string;
  is_enabled: boolean;
  test_mode: boolean;
  last_used_at?: string;
}

export interface APICallLog {
  id: string;
  service_name: string;
  endpoint: string;
  method: string;
  response_status: number;
  response_time_ms: number;
  error_message?: string;
  created_at: string;
}

export interface UsageAnalytics {
  service_name: string;
  usage_date: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_cost: number;
}

// Hook for managing external API services
export function useExternalAPIs(yachtId?: string) {
  const [services, setServices] = useState<APIService[]>([]);
  const [configs, setConfigs] = useState<YachtAPIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('api_services')
        .select('*')
        .order('display_name');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      if (yachtId) {
        const { data: configsData, error: configsError } = await supabase
          .from('yacht_api_configs')
          .select('*')
          .eq('yacht_id', yachtId)
          .order('service_name');

        if (configsError) throw configsError;
        setConfigs(configsData || []);
      }
    } catch (error) {
      console.error('Failed to fetch API services:', error);
      toast({
        title: "Error",
        description: "Failed to load API services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [yachtId, toast]);

  const configureService = useCallback(async (
    serviceName: string, 
    apiKey: string, 
    customConfig?: any,
    testMode = false
  ) => {
    if (!yachtId) return null;

    try {
      const { data, error } = await supabase
        .from('yacht_api_configs')
        .upsert({
          yacht_id: yachtId,
          service_name: serviceName,
          api_key_encrypted: apiKey, // In production, encrypt this
          custom_config: customConfig || {},
          test_mode: testMode,
          is_enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      setConfigs(prev => {
        const existing = prev.find(c => c.service_name === serviceName);
        if (existing) {
          return prev.map(c => c.service_name === serviceName ? data : c);
        } else {
          return [...prev, data];
        }
      });

      toast({
        title: "Success",
        description: `${serviceName} configured successfully`,
      });

      return data;
    } catch (error) {
      console.error('Failed to configure service:', error);
      toast({
        title: "Error",
        description: "Failed to configure API service",
        variant: "destructive",
      });
      return null;
    }
  }, [yachtId, toast]);

  const toggleService = useCallback(async (serviceName: string, enabled: boolean) => {
    if (!yachtId) return;

    try {
      const { error } = await supabase
        .from('yacht_api_configs')
        .update({ is_enabled: enabled })
        .eq('yacht_id', yachtId)
        .eq('service_name', serviceName);

      if (error) throw error;

      setConfigs(prev => 
        prev.map(c => 
          c.service_name === serviceName 
            ? { ...c, is_enabled: enabled }
            : c
        )
      );

      toast({
        title: "Success",
        description: `${serviceName} ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Failed to toggle service:', error);
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive",
      });
    }
  }, [yachtId, toast]);

  const callAPI = useCallback(async (
    service: string,
    action: string,
    data?: any,
    options?: any
  ) => {
    if (!yachtId) return null;

    try {
      const { data: result, error } = await supabase.functions.invoke('external-api-integration', {
        body: {
          service,
          action,
          yacht_id: yachtId,
          data,
          options
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${service} API call completed`,
      });

      return result;
    } catch (error) {
      console.error('API call failed:', error);
      toast({
        title: "Error",
        description: `${service} API call failed: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  }, [yachtId, toast]);

  return {
    services,
    configs,
    loading,
    configureService,
    toggleService,
    callAPI,
    refetch: fetchServices
  };
}

// Hook for API call logs and monitoring
export function useAPILogs(yachtId?: string, serviceName?: string) {
  const [logs, setLogs] = useState<APICallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!yachtId) return;

    try {
      let query = supabase
        .from('api_call_logs')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (serviceName) {
        query = query.eq('service_name', serviceName);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch API logs:', error);
    } finally {
      setLoading(false);
    }
  }, [yachtId, serviceName]);

  const getLogSummary = useCallback(() => {
    const total = logs.length;
    const successful = logs.filter(log => log.response_status >= 200 && log.response_status < 300).length;
    const failed = total - successful;
    const avgResponseTime = total > 0 
      ? logs.reduce((sum, log) => sum + log.response_time_ms, 0) / total 
      : 0;

    return { total, successful, failed, avgResponseTime };
  }, [logs]);

  return {
    logs,
    loading,
    summary: getLogSummary(),
    refetch: fetchLogs
  };
}

// Hook for API usage analytics
export function useAPIAnalytics(yachtId?: string) {
  const [analytics, setAnalytics] = useState<UsageAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (days = 30) => {
    if (!yachtId) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('api_usage_analytics')
        .select('*')
        .eq('yacht_id', yachtId)
        .gte('usage_date', startDate.toISOString().split('T')[0])
        .order('usage_date', { ascending: false });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [yachtId]);

  const getTotalUsage = useCallback(() => {
    return analytics.reduce((totals, day) => ({
      calls: totals.calls + day.total_calls,
      cost: totals.cost + day.total_cost,
      successRate: analytics.length > 0 
        ? analytics.reduce((sum, day) => sum + (day.successful_calls / day.total_calls || 0), 0) / analytics.length 
        : 0
    }), { calls: 0, cost: 0, successRate: 0 });
  }, [analytics]);

  return {
    analytics,
    loading,
    totalUsage: getTotalUsage(),
    refetch: fetchAnalytics
  };
}

// Specific service hooks

// Expensya integration hook
export function useExpensya(yachtId?: string) {
  const { callAPI } = useExternalAPIs(yachtId);
  const { toast } = useToast();

  const syncExpenseReports = useCallback(async () => {
    const result = await callAPI('expensya', 'sync_expense_reports');
    if (result?.success) {
      toast({
        title: "Sync Complete",
        description: `Synced ${result.data.reports_synced} expense reports`,
      });
    }
    return result;
  }, [callAPI, toast]);

  const uploadReceipt = useCallback(async (file: File, expenseId: string) => {
    const result = await callAPI('expensya', 'upload_receipt', {
      receipt_file: file,
      expense_id: expenseId
    });
    return result;
  }, [callAPI]);

  return {
    syncExpenseReports,
    uploadReceipt
  };
}

// Stripe integration hook
export function useStripe(yachtId?: string) {
  const { callAPI } = useExternalAPIs(yachtId);

  const createPaymentIntent = useCallback(async (amount: number, currency = 'usd', description = '') => {
    const result = await callAPI('stripe', 'create_payment_intent', {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description
    });
    return result;
  }, [callAPI]);

  const createCustomer = useCallback(async (email: string, name?: string) => {
    const result = await callAPI('stripe', 'create_customer', {
      email,
      name,
      yacht_id: yachtId
    });
    return result;
  }, [callAPI, yachtId]);

  return {
    createPaymentIntent,
    createCustomer
  };
}

// Shippo integration hook
export function useShippo(yachtId?: string) {
  const { callAPI } = useExternalAPIs(yachtId);

  const createShipment = useCallback(async (
    fromAddress: any,
    toAddress: any,
    packages: any[]
  ) => {
    const result = await callAPI('shippo', 'create_shipment', {
      from_address: fromAddress,
      to_address: toAddress,
      packages,
      yacht_id: yachtId
    });
    return result;
  }, [callAPI, yachtId]);

  const trackShipment = useCallback(async (trackingNumber: string, carrier: string) => {
    const result = await callAPI('shippo', 'track_shipment', {
      tracking_number: trackingNumber,
      carrier
    });
    return result;
  }, [callAPI]);

  return {
    createShipment,
    trackShipment
  };
}

// SendGrid integration hook
export function useSendGrid(yachtId?: string) {
  const { callAPI } = useExternalAPIs(yachtId);

  const sendEmail = useCallback(async (
    toEmail: string,
    subject: string,
    htmlContent: string,
    fromEmail: string
  ) => {
    const result = await callAPI('sendgrid', 'send_email', {
      to_email: toEmail,
      subject,
      html_content: htmlContent,
      from_email: fromEmail,
      yacht_id: yachtId,
      email_type: 'transactional'
    });
    return result;
  }, [callAPI, yachtId]);

  const createCampaign = useCallback(async (
    campaignName: string,
    subject: string,
    htmlContent: string,
    senderEmail: string
  ) => {
    const result = await callAPI('sendgrid', 'create_campaign', {
      campaign_name: campaignName,
      subject,
      html_content: htmlContent,
      sender_email: senderEmail,
      yacht_id: yachtId
    });
    return result;
  }, [callAPI, yachtId]);

  return {
    sendEmail,
    createCampaign
  };
}

// WhatsApp integration hook
export function useWhatsApp(yachtId?: string) {
  const { callAPI } = useExternalAPIs(yachtId);

  const sendMessage = useCallback(async (
    phoneNumber: string,
    content: string,
    contactName?: string
  ) => {
    const result = await callAPI('whatsapp_business', 'send_message', {
      phone_number: phoneNumber,
      content,
      contact_name: contactName,
      yacht_id: yachtId,
      message_type: 'text'
    });
    return result;
  }, [callAPI, yachtId]);

  const sendTemplate = useCallback(async (
    phoneNumber: string,
    templateName: string,
    templateParams: string[],
    language = 'en'
  ) => {
    const result = await callAPI('whatsapp_business', 'send_template', {
      phone_number: phoneNumber,
      template_name: templateName,
      template_params: templateParams,
      language,
      yacht_id: yachtId
    });
    return result;
  }, [callAPI, yachtId]);

  return {
    sendMessage,
    sendTemplate
  };
}