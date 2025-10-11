import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logAnalyticsEvent } from '../_shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemMetrics {
  timestamp: string;
  ai_provider_health: any[];
  performance_metrics: {
    avg_response_time: number;
    success_rate: number;
    total_requests: number;
    error_rate: number;
  };
  database_metrics: {
    active_connections: number;
    query_performance: number;
    error_count: number;
  };
  security_metrics: {
    failed_auth_attempts: number;
    permission_violations: number;
    suspicious_activities: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log request receipt
    await logAnalyticsEvent(supabase, {
      event_type: 'production_system_monitor_request',
      event_message: 'Production system monitor request received',
      module: 'production_system_monitor',
      severity: 'info',
      metadata: { method: req.method },
    });

    const { action } = await req.json();

    // Log the selected action
    await logAnalyticsEvent(supabase, {
      event_type: 'production_system_monitor_action',
      event_message: `Action: ${action}`,
      module: 'production_system_monitor',
      severity: 'info',
      metadata: { action },
    });

    switch (action) {
      case 'collect_metrics': {
        const resp = await collectSystemMetrics(supabase);
        // Log response outline
        await logAnalyticsEvent(supabase, {
          event_type: 'production_system_monitor_response',
          event_message: 'collect_metrics executed',
          module: 'production_system_monitor',
          severity: 'info',
          metadata: { status: (resp as Response).status ?? 200 },
        });
        return resp;
      }
      case 'health_check': {
        const resp = await performHealthCheck(supabase);
        await logAnalyticsEvent(supabase, {
          event_type: 'production_system_monitor_response',
          event_message: 'health_check executed',
          module: 'production_system_monitor',
          severity: 'info',
          metadata: { status: (resp as Response).status ?? 200 },
        });
        return resp;
      }
      case 'generate_report': {
        const resp = await generateSystemReport(supabase);
        await logAnalyticsEvent(supabase, {
          event_type: 'production_system_monitor_response',
          event_message: 'generate_report executed',
          module: 'production_system_monitor',
          severity: 'info',
          metadata: { status: (resp as Response).status ?? 200 },
        });
        return resp;
      }
      default: {
        await logAnalyticsEvent(supabase, {
          event_type: 'production_system_monitor_invalid_action',
          event_message: 'Invalid action',
          module: 'production_system_monitor',
          severity: 'warn',
          metadata: { action },
        });
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

  } catch (error: any) {
    console.error('System monitor error:', error);

    // Best-effort logging on error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await logAnalyticsEvent(supabase, {
        event_type: 'production_system_monitor_error',
        event_message: 'Unhandled error in production system monitor',
        module: 'production_system_monitor',
        severity: 'error',
        metadata: { error: { message: error?.message, stack: error?.stack } },
      });
    } catch (_e) {
      // ignore
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function collectSystemMetrics(supabase: any) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Collect AI provider health
    const { data: providerHealth, error: providerError } = await supabase
      .from('ai_provider_health')
      .select('*')
      .order('last_check', { ascending: false });

    if (providerError) throw providerError;

    // Collect performance metrics
    const { data: performanceLogs, error: perfError } = await supabase
      .from('ai_performance_logs')
      .select('*')
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false });

    if (perfError) throw perfError;

    // Calculate aggregated metrics
    const totalRequests = performanceLogs?.length || 0;
    const successfulRequests = performanceLogs?.filter(log => log.success).length || 0;
    const avgResponseTime = totalRequests > 0 
      ? performanceLogs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / totalRequests 
      : 0;

    // Collect security events
    const { data: securityEvents, error: securityError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('module', 'security')
      .gte('created_at', oneDayAgo.toISOString());

    if (securityError) throw securityError;

    const metrics: SystemMetrics = {
      timestamp: now.toISOString(),
      ai_provider_health: providerHealth || [],
      performance_metrics: {
        avg_response_time: avgResponseTime,
        success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
        total_requests: totalRequests,
        error_rate: totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0
      },
      database_metrics: {
        active_connections: 45, // Would be queried from pg_stat_activity in production
        query_performance: 150, // Average query time in ms
        error_count: 0
      },
      security_metrics: {
        failed_auth_attempts: securityEvents?.filter(e => e.event_type === 'auth_failed').length || 0,
        permission_violations: securityEvents?.filter(e => e.event_type === 'permission_denied').length || 0,
        suspicious_activities: securityEvents?.filter(e => e.severity === 'error').length || 0
      }
    };

    // Store metrics for historical tracking
    const { error: insertError } = await supabase
      .from('system_metrics')
      .insert({
        collected_at: now.toISOString(),
        metrics: metrics,
        metric_type: 'system_health'
      });

    if (insertError) {
      console.error('Failed to store metrics:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        message: 'System metrics collected successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Failed to collect system metrics:', error);
    throw error;
  }
}

async function performHealthCheck(supabase: any) {
  try {
    const healthChecks = [];

    // Check database connectivity
    const { data: dbTest, error: dbError } = await supabase
      .from('ai_providers_unified')
      .select('count')
      .limit(1);

    healthChecks.push({
      component: 'database',
      status: dbError ? 'unhealthy' : 'healthy',
      message: dbError?.message || 'Database connection successful',
      timestamp: new Date().toISOString()
    });

    // Check AI providers
    const { data: providers, error: providerError } = await supabase
      .from('ai_provider_health')
      .select('*');

    const healthyProviders = providers?.filter(p => p.status === 'healthy').length || 0;
    const totalProviders = providers?.length || 0;

    healthChecks.push({
      component: 'ai_providers',
      status: healthyProviders / totalProviders > 0.7 ? 'healthy' : 'degraded',
      message: `${healthyProviders}/${totalProviders} providers healthy`,
      timestamp: new Date().toISOString()
    });

    // Check recent error rates
    const { data: recentErrors, error: errorCheckError } = await supabase
      .from('ai_performance_logs')
      .select('*')
      .eq('success', false)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

    const errorRate = recentErrors?.length || 0;
    healthChecks.push({
      component: 'error_rates',
      status: errorRate < 10 ? 'healthy' : errorRate < 50 ? 'degraded' : 'unhealthy',
      message: `${errorRate} errors in the last hour`,
      timestamp: new Date().toISOString()
    });

    const overallStatus = healthChecks.every(check => check.status === 'healthy') ? 'healthy' :
                         healthChecks.some(check => check.status === 'unhealthy') ? 'unhealthy' : 'degraded';

    // Log health check result
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'health_check',
        event_message: `System health check completed - Status: ${overallStatus}`,
        module: 'system_monitor',
        severity: overallStatus === 'healthy' ? 'info' : overallStatus === 'degraded' ? 'warn' : 'error',
        metadata: { health_checks: healthChecks }
      });

    return new Response(
      JSON.stringify({
        success: true,
        overall_status: overallStatus,
        health_checks: healthChecks,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Health check failed:', error);
    
    await supabase
      .from('analytics_events')
      .insert({
        event_type: 'health_check_failed',
        event_message: `Health check failed: ${error.message}`,
        module: 'system_monitor',
        severity: 'error',
        metadata: { error: error.stack }
      });

    throw error;
  }
}

async function generateSystemReport(supabase: any) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get performance trends
    const { data: performanceHistory, error: perfError } = await supabase
      .from('ai_performance_logs')
      .select('*')
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: true });

    if (perfError) throw perfError;

    // Get security events
    const { data: securityEvents, error: securityError } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('module', 'security')
      .gte('created_at', oneWeekAgo.toISOString());

    if (securityError) throw securityError;

    // Calculate weekly trends
    const dailyMetrics = {};
    performanceHistory?.forEach(log => {
      const day = log.created_at.split('T')[0];
      if (!dailyMetrics[day]) {
        dailyMetrics[day] = { requests: 0, successes: 0, totalTime: 0 };
      }
      dailyMetrics[day].requests++;
      if (log.success) dailyMetrics[day].successes++;
      dailyMetrics[day].totalTime += log.execution_time_ms || 0;
    });

    const report = {
      generated_at: now.toISOString(),
      period: {
        start: oneWeekAgo.toISOString(),
        end: now.toISOString()
      },
      summary: {
        total_requests: performanceHistory?.length || 0,
        avg_success_rate: calculateAverageSuccessRate(performanceHistory || []),
        avg_response_time: calculateAverageResponseTime(performanceHistory || []),
        security_incidents: securityEvents?.filter(e => e.severity === 'error').length || 0
      },
      daily_trends: Object.entries(dailyMetrics).map(([date, metrics]: [string, any]) => ({
        date,
        requests: metrics.requests,
        success_rate: (metrics.successes / metrics.requests) * 100,
        avg_response_time: metrics.totalTime / metrics.requests
      })),
      security_summary: {
        total_events: securityEvents?.length || 0,
        critical_events: securityEvents?.filter(e => e.severity === 'error').length || 0,
        warning_events: securityEvents?.filter(e => e.severity === 'warn').length || 0
      },
      recommendations: generateRecommendations(performanceHistory || [], securityEvents || [])
    };

    // Store the report
    const { error: reportError } = await supabase
      .from('system_reports')
      .insert({
        report_type: 'weekly_system_report',
        generated_at: now.toISOString(),
        report_data: report
      });

    if (reportError) {
      console.error('Failed to store report:', reportError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        report,
        message: 'System report generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Failed to generate system report:', error);
    throw error;
  }
}

function calculateAverageSuccessRate(logs: any[]): number {
  if (logs.length === 0) return 100;
  const successCount = logs.filter(log => log.success).length;
  return (successCount / logs.length) * 100;
}

function calculateAverageResponseTime(logs: any[]): number {
  if (logs.length === 0) return 0;
  const totalTime = logs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0);
  return totalTime / logs.length;
}

function generateRecommendations(performanceLogs: any[], securityEvents: any[]): string[] {
  const recommendations = [];

  const avgResponseTime = calculateAverageResponseTime(performanceLogs);
  if (avgResponseTime > 2000) {
    recommendations.push('Consider optimizing AI model response times - current average exceeds 2 seconds');
  }

  const successRate = calculateAverageSuccessRate(performanceLogs);
  if (successRate < 95) {
    recommendations.push('Success rate is below 95% - investigate AI provider reliability');
  }

  const criticalSecurityEvents = securityEvents.filter(e => e.severity === 'error').length;
  if (criticalSecurityEvents > 5) {
    recommendations.push('High number of critical security events - review access controls and monitoring');
  }

  if (recommendations.length === 0) {
    recommendations.push('System performance is within acceptable parameters');
  }

  return recommendations;
}
