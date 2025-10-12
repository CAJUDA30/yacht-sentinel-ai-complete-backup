import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================
// SECURITY MIDDLEWARE EDGE FUNCTION - PHASE 1
// Enhanced API security with rate limiting and validation
// =============================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth': { windowMs: 15 * 60 * 1000, maxRequests: 5 },     // 5 attempts per 15 min
  'api': { windowMs: 60 * 1000, maxRequests: 100 },         // 100 req per minute
  'upload': { windowMs: 60 * 1000, maxRequests: 10 },       // 10 uploads per minute
  'search': { windowMs: 60 * 1000, maxRequests: 50 }        // 50 searches per minute
};

function checkRateLimit(identifier: string, type: string): { allowed: boolean; resetTime?: number } {
  const config = RATE_LIMITS[type] || RATE_LIMITS['api'];
  const now = Date.now();
  const key = `${type}:${identifier}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true };
}

async function logSecurityEvent(
  eventType: string, 
  userId: string | null, 
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      event_message: `Security middleware: ${eventType}`,
      user_id: userId,
      module: 'security',
      severity: metadata.severity || 'warn',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'security_middleware'
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

function validateInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic SQL injection patterns
  const sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UNION|UPDATE)\b)/gi,
    /['"`;\\]/g,
    /(script|javascript|vbscript)/gi,
    /(<|>|&lt|&gt)/gi
  ];

  const checkValue = (value: string, path = '') => {
    sqlPatterns.forEach((pattern, index) => {
      if (pattern.test(value)) {
        errors.push(`Potentially dangerous content detected in ${path || 'input'} (pattern ${index + 1})`);
      }
    });
  };

  // Recursively check object values
  const checkObject = (obj: any, path = '') => {
    if (typeof obj === 'string') {
      checkValue(obj, path);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, val]) => {
        checkObject(val, path ? `${path}.${key}` : key);
      });
    }
  };

  checkObject(data);

  return { valid: errors.length === 0, errors };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const clientIP = req.headers.get('CF-Connecting-IP') || 
                     req.headers.get('X-Forwarded-For') || 
                     'unknown';

    // Parse request body
    const body = await req.json().catch(() => ({}));
    
    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (error) {
        console.warn('Failed to get user from token:', error);
      }
    }

    // Determine rate limit type based on action
    const rateLimitType = action === 'auth' ? 'auth' : 
                         action === 'upload' ? 'upload' :
                         action === 'search' ? 'search' : 'api';

    // Check rate limits
    const rateLimitResult = checkRateLimit(clientIP, rateLimitType);
    if (!rateLimitResult.allowed) {
      await logSecurityEvent('rate_limit_exceeded', userId, {
        ip_address: clientIP,
        rate_limit_type: rateLimitType,
        reset_time: rateLimitResult.resetTime,
        severity: 'warn'
      });

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime,
          message: `Too many requests. Try again at ${new Date(rateLimitResult.resetTime!).toLocaleTimeString()}`
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(((rateLimitResult.resetTime || Date.now()) - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Validate input for suspicious content
    const validation = validateInput(body);
    if (!validation.valid) {
      await logSecurityEvent('suspicious_input_detected', userId, {
        ip_address: clientIP,
        errors: validation.errors,
        input_sample: JSON.stringify(body).substring(0, 200),
        severity: 'error'
      });

      return new Response(
        JSON.stringify({
          error: 'Invalid input detected',
          details: validation.errors
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Process based on action
    switch (action) {
      case 'validate':
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Input validation passed',
            timestamp: new Date().toISOString()
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'security-status':
        // Return basic security status
        return new Response(
          JSON.stringify({
            rateLimitActive: true,
            inputValidationActive: true,
            auditLoggingActive: true,
            timestamp: new Date().toISOString()
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown action',
            availableActions: ['validate', 'security-status']
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('Security middleware error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Security middleware encountered an error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});