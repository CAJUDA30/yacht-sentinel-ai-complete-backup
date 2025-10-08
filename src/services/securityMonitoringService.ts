import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  event_type: string;
  event_message: string;
  user_id?: string;
  module: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  metadata?: {
    ip_address?: string;
    user_agent?: string;
    location?: string;
    risk_score?: number;
    source?: string;
    action?: string;
    resource?: string;
    timestamp?: string;
    status?: 'active' | 'resolved' | 'investigating';
    [key: string]: any;
  };
}

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private eventQueue: SecurityEvent[] = [];
  private isProcessing = false;

  private constructor() {
    // Start processing queue
    this.startQueueProcessor();
  }

  public static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService();
    }
    return SecurityMonitoringService.instance;
  }

  /**
   * Log a security event
   */
  public async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Add to queue for batch processing
    this.eventQueue.push({
      ...event,
      metadata: {
        ...event.metadata,
        timestamp: new Date().toISOString(),
        ip_address: event.metadata?.ip_address || await this.getClientIP(),
        user_agent: event.metadata?.user_agent || navigator.userAgent
      }
    });

    // If it's a critical event, process immediately
    if (event.severity === 'critical') {
      await this.processQueue();
    }
  }

  /**
   * Log login attempt
   */
  public async logLoginAttempt(success: boolean, userId?: string, metadata?: any): Promise<void> {
    await this.logSecurityEvent({
      event_type: success ? 'login_success' : 'login_failure',
      event_message: success ? 'User logged in successfully' : 'Failed login attempt',
      user_id: userId,
      module: 'authentication',
      severity: success ? 'info' : 'warn',
      metadata: {
        ...metadata,
        success,
        risk_score: success ? 10 : 75
      }
    });
  }

  /**
   * Log unauthorized access attempt
   */
  public async logUnauthorizedAccess(resource: string, userId?: string, metadata?: any): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'unauthorized_access',
      event_message: `Unauthorized access attempt to ${resource}`,
      user_id: userId,
      module: 'authorization',
      severity: 'error',
      metadata: {
        ...metadata,
        resource,
        risk_score: 85
      }
    });
  }

  /**
   * Log data access
   */
  public async logDataAccess(action: string, resource: string, userId?: string, metadata?: any): Promise<void> {
    const riskScore = this.calculateRiskScore(action, resource, metadata);
    
    await this.logSecurityEvent({
      event_type: 'data_access',
      event_message: `User ${action} ${resource}`,
      user_id: userId,
      module: 'data_access',
      severity: riskScore > 70 ? 'warn' : 'info',
      metadata: {
        ...metadata,
        action,
        resource,
        risk_score: riskScore
      }
    });
  }

  /**
   * Log security policy violation
   */
  public async logPolicyViolation(policy: string, violation: string, userId?: string, metadata?: any): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'policy_violation',
      event_message: `Policy violation: ${policy} - ${violation}`,
      user_id: userId,
      module: 'policy',
      severity: 'error',
      metadata: {
        ...metadata,
        policy,
        violation,
        risk_score: 90
      }
    });
  }

  /**
   * Log API rate limit exceeded
   */
  public async logRateLimitExceeded(endpoint: string, userId?: string, metadata?: any): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'rate_limit_exceeded',
      event_message: `Rate limit exceeded for endpoint: ${endpoint}`,
      user_id: userId,
      module: 'api_security',
      severity: 'warn',
      metadata: {
        ...metadata,
        endpoint,
        risk_score: 60
      }
    });
  }

  /**
   * Log suspicious activity
   */
  public async logSuspiciousActivity(activity: string, userId?: string, metadata?: any): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'suspicious_activity',
      event_message: `Suspicious activity detected: ${activity}`,
      user_id: userId,
      module: 'threat_detection',
      severity: 'critical',
      metadata: {
        ...metadata,
        activity,
        risk_score: 95
      }
    });
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        this.processQueue();
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Process the event queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Insert events into database
      const { error } = await supabase
        .from('analytics_events')
        .insert(
          events.map(event => ({
            event_type: event.event_type,
            event_message: event.event_message,
            user_id: event.user_id,
            module: event.module,
            severity: event.severity,
            metadata: event.metadata
          }))
        );

      if (error) {
        console.error('Failed to log security events:', error);
        // Put events back in queue for retry
        this.eventQueue.unshift(...events);
      } else {
        console.log(`Successfully logged ${events.length} security events`);
      }
    } catch (error) {
      console.error('Error processing security event queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Calculate risk score based on action and context
   */
  private calculateRiskScore(action: string, resource: string, metadata?: any): number {
    let score = 20; // Base score

    // Action-based scoring
    switch (action.toLowerCase()) {
      case 'delete':
        score += 40;
        break;
      case 'update':
        score += 30;
        break;
      case 'create':
        score += 20;
        break;
      case 'view':
        score += 10;
        break;
    }

    // Resource-based scoring
    if (resource.includes('financial') || resource.includes('payment')) {
      score += 30;
    }
    if (resource.includes('user') || resource.includes('profile')) {
      score += 20;
    }
    if (resource.includes('admin') || resource.includes('system')) {
      score += 40;
    }

    // Time-based scoring (unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 15;
    }

    // Location-based scoring (if available)
    if (metadata?.unusual_location) {
      score += 25;
    }

    // Multiple rapid actions
    if (metadata?.rapid_actions) {
      score += 20;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Get client IP address (simplified for demo)
   */
  private async getClientIP(): Promise<string> {
    try {
      // In a real implementation, you'd get this from the request headers
      // or use a service to detect the client IP
      return '192.168.1.100'; // Placeholder
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get security metrics for dashboard
   */
  public async getSecurityMetrics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const startTime = new Date();
    switch (timeframe) {
      case 'hour':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case 'day':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case 'week':
        startTime.setDate(startTime.getDate() - 7);
        break;
    }

    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('module', 'security')
      .gte('created_at', startTime.toISOString());

    if (error) {
      console.error('Failed to fetch security metrics:', error);
      return null;
    }

    // Calculate metrics
    const totalEvents = events?.length || 0;
    const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0;
    const errorEvents = events?.filter(e => e.severity === 'error').length || 0;
    const warnEvents = events?.filter(e => e.severity === 'warn').length || 0;

    const avgRiskScore = events?.length ? 
      events.reduce((sum, event) => sum + ((event.metadata as any)?.risk_score || 0), 0) / events.length : 0;

    return {
      timeframe,
      total_events: totalEvents,
      critical_events: criticalEvents,
      error_events: errorEvents,
      warn_events: warnEvents,
      average_risk_score: Math.round(avgRiskScore),
      security_score: Math.max(0, 100 - (criticalEvents * 10 + errorEvents * 5 + warnEvents * 2))
    };
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitoringService.getInstance();

// Hook for React components
export const useSecurityMonitoring = () => {
  return {
    logSecurityEvent: securityMonitor.logSecurityEvent.bind(securityMonitor),
    logLoginAttempt: securityMonitor.logLoginAttempt.bind(securityMonitor),
    logUnauthorizedAccess: securityMonitor.logUnauthorizedAccess.bind(securityMonitor),
    logDataAccess: securityMonitor.logDataAccess.bind(securityMonitor),
    logPolicyViolation: securityMonitor.logPolicyViolation.bind(securityMonitor),
    logRateLimitExceeded: securityMonitor.logRateLimitExceeded.bind(securityMonitor),
    logSuspiciousActivity: securityMonitor.logSuspiciousActivity.bind(securityMonitor),
    getSecurityMetrics: securityMonitor.getSecurityMetrics.bind(securityMonitor)
  };
};