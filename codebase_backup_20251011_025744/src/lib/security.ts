import { supabase } from "@/integrations/supabase/client";

// =============================================
// RATE LIMITING CONFIGURATION
// =============================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return { allowed: true };
    }

    if (entry.count >= this.config.maxRequests) {
      return { allowed: false, resetTime: entry.resetTime };
    }

    entry.count++;
    return { allowed: true };
  }

  reset(identifier: string): void {
    rateLimitStore.delete(identifier);
  }
}

// =============================================
// AUTHENTICATION SECURITY
// =============================================

export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
  skipSuccessfulRequests: true
});

export const apiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

// =============================================
// CSRF PROTECTION
// =============================================

export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  // In a real implementation, you'd store and validate against server-side tokens
  // For now, we'll implement a basic validation
  return token && sessionToken && token.length === 64;
};

// =============================================
// SESSION MANAGEMENT
// =============================================

export interface SessionInfo {
  userId: string;
  email: string;
  lastActivity: number;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  static isSessionValid(lastActivity: number): boolean {
    return Date.now() - lastActivity < this.SESSION_TIMEOUT;
  }

  static shouldRefreshToken(lastActivity: number): boolean {
    return Date.now() - lastActivity > this.REFRESH_THRESHOLD;
  }

  static async logSecurityEvent(
    eventType: string,
    userId: string | null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        event_message: `Security event: ${eventType}`,
        user_id: userId,
        module: 'security',
        severity: metadata.severity || 'warn',
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          ip_address: metadata.ipAddress,
          user_agent: metadata.userAgent
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  static async trackFailedLogin(email: string, ipAddress?: string): Promise<void> {
    await this.logSecurityEvent('auth_login_failed', null, {
      email,
      ipAddress,
      severity: 'error'
    });
  }

  static async trackSuccessfulLogin(userId: string, ipAddress?: string): Promise<void> {
    await this.logSecurityEvent('auth_login_success', userId, {
      ipAddress,
      severity: 'info'
    });
  }

  static async trackSuspiciousActivity(
    userId: string | null,
    activity: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logSecurityEvent('suspicious_activity', userId, {
      activity,
      severity: 'warn',
      ...metadata
    });
  }
}

// =============================================
// INPUT SANITIZATION
// =============================================

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeSQL = (input: string): string => {
  // Remove potentially dangerous SQL keywords and characters
  return input
    .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UNION|UPDATE)\b)/gi, '')
    .replace(/['"`;\\]/g, '');
};

// =============================================
// PASSWORD SECURITY
// =============================================

export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  if (/12345|abcd|qwert/i.test(password)) {
    score -= 1;
    feedback.push('Avoid common sequences');
  }

  return { score: Math.max(0, score), feedback };
};

// =============================================
// SECURITY HEADERS
// =============================================

export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "media-src 'self'"
    ].join('; '),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
};

// =============================================
// AUDIT LOGGING
// =============================================

export interface AuditLog {
  action: string;
  resource: string;
  resourceId?: string;
  userId: string;
  metadata?: Record<string, any>;
}

export const logAuditEvent = async (auditLog: AuditLog): Promise<void> => {
  try {
    await supabase.from('analytics_events').insert({
      event_type: 'audit_log',
      event_message: `${auditLog.action} on ${auditLog.resource}`,
      user_id: auditLog.userId,
      module: 'audit',
      severity: 'info',
      metadata: {
        action: auditLog.action,
        resource: auditLog.resource,
        resource_id: auditLog.resourceId,
        timestamp: new Date().toISOString(),
        ...auditLog.metadata
      }
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};