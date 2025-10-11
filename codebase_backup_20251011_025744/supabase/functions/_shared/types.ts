/**
 * Type declarations for Supabase Edge Functions
 * This file provides type definitions to resolve TypeScript errors in Deno runtime
 */

// Global Deno namespace for Edge Functions runtime
declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
      toObject(): Record<string, string>;
    }
    
    interface ServeHandlerInfo {
      remoteAddr: { hostname: string; port: number; transport: string };
    }
    
    interface ServeOptions {
      port?: number;
      hostname?: string;
      signal?: AbortSignal;
    }
    
    function serve(
      handler: (request: Request, info?: ServeHandlerInfo) => Response | Promise<Response>,
      options?: ServeOptions
    ): Promise<void>;
  }
}

// Common interfaces for Edge Functions
export interface EdgeFunctionResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Methods': string;
}

// Standard CORS headers
export const corsHeaders: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};

// Common error response function
export function createErrorResponse(
  message: string, 
  status: number = 500,
  code?: string
): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        code: code || 'EDGE_FUNCTION_ERROR',
        timestamp: new Date().toISOString()
      }
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Success response function
export function createSuccessResponse(data: any, metadata?: Record<string, any>): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      metadata,
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

export {};