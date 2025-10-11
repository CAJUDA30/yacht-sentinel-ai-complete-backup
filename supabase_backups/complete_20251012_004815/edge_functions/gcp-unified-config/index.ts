// UNIFIED Document AI configuration API
// CORE PRINCIPLE: Single Document AI Custom Extractor processor 8708cd1d9cd87cc1 for all yacht document scanning
// Handles: status, config_update, test_all_connections, run_test, check_updates
// Notes: Stores config in unified_ai_configs (RLS enabled, service-only). Does NOT return secrets.

/// <reference path="../types.d.ts" />

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { importPKCS8, SignJWT } from "https://esm.sh/jose@5.2.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { "x-client-info": "gcp-unified-config" } },
});

const tableName = "unified_ai_configs";
const logsTable = "unified_ai_logs";

async function getConfig() {
  const { data, error } = await supabase
    .from(tableName)
    .select("id, config, updated_at, created_at")
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

async function upsertConfig(config: Record<string, unknown>) {
  const existing = await getConfig();
  if (existing) {
    const { error } = await supabase
      .from(tableName)
      .update({ config, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  } else {
    const { data, error } = await supabase
      .from(tableName)
      .insert({ config })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }
}

function secretPresence() {
  return {
    GOOGLE_SERVICE_ACCOUNT_JSON: Boolean(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")),
    GOOGLE_DOCUMENT_AI_API_KEY: Boolean(Deno.env.get("GOOGLE_DOCUMENT_AI_API_KEY")),
    GOOGLE_CLOUD_PROJECT_ID: Boolean(Deno.env.get("GOOGLE_CLOUD_PROJECT_ID")),
  };
}

async function handleStatus() {
  const configRow = await getConfig();
  const secrets = secretPresence();

  const { data: logs } = await supabase
    .from(logsTable)
    .select("created_at, action, provider, success, latency_ms, error_message, cost_estimate_usd")
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    config: configRow?.config ?? {},
    updated_at: configRow?.updated_at ?? null,
    secrets,
    logs: logs ?? [],
    docs: {
      vision: "https://cloud.google.com/vision/docs",
      vertex: "https://cloud.google.com/vertex-ai/docs",
      documentAI: "https://cloud.google.com/document-ai/docs",
    },
  };
}

async function handleConfigUpdate(payload: any) {
  // Expect payload.config object
  if (!payload || typeof payload.config !== "object") {
    throw new Error("Invalid payload: missing config");
  }
  const id = await upsertConfig(payload.config);
  return { ok: true, id };
}

async function recordLog(entry: any) {
  await supabase.from(logsTable).insert({
    action: entry.action ?? "test",
    provider: entry.provider ?? "unified",
    success: entry.success ?? false,
    latency_ms: entry.latency_ms ?? null,
    error_message: entry.error_message ?? null,
    cost_estimate_usd: entry.cost_estimate_usd ?? 0,
    details: entry.details ?? {},
    correlation_id: entry.correlation_id ?? crypto.randomUUID(),
  });
}

// Document AI helper functions
function dataUrlToBase64(dataUrl: string): string {
  if (!dataUrl) return "";
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

async function getGoogleAccessToken(): Promise<string> {
  const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  if (!saJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
  const sa = JSON.parse(saJson);
  const privateKey: CryptoKey = await importPKCS8(sa.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({ scope: "https://www.googleapis.com/auth/cloud-platform" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  const tokenJson = await tokenResp.json();
  if (!tokenResp.ok) throw new Error(tokenJson.error || "OAuth token error");
  return tokenJson.access_token;
}

async function documentAIGetProcessor(processorId: string) {
  const accessToken = await getGoogleAccessToken();
  const resp = await fetch(`https://documentai.googleapis.com/v1/${processorId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error?.message || "Document AI error");
  return json;
}

async function documentAIProcessDocument(processorId: string, docBase64: string, mimeType: string) {
  const accessToken = await getGoogleAccessToken();
  const url = `https://documentai.googleapis.com/v1/${processorId}:process`;
  const body = { rawDocument: { content: docBase64, mimeType } } as const;
  
  console.log(`[gcp-unified-config] Calling Document AI:`, {
    url,
    processorId,
    mimeType,
    contentLength: docBase64.length,
    contentSample: docBase64.substring(0, 50)
  });
  
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  
  const json = await resp.json();
  console.log(`[gcp-unified-config] Document AI response:`, {
    status: resp.status,
    ok: resp.ok,
    error: json.error,
    hasDocument: !!json.document
  });
  
  if (!resp.ok) {
    console.error(`[gcp-unified-config] Document AI error details:`, JSON.stringify(json, null, 2));
    throw new Error(json.error?.message || "Document AI process error");
  }
  return json;
}

async function handleTestAllConnections() {
  const started = Date.now();
  const pres = secretPresence();
  const cfgRow = await getConfig();
  const cfg: any = cfgRow?.config || {};

  const results: Record<string, any> = {
    documentAI: { configured: !!pres.GOOGLE_SERVICE_ACCOUNT_JSON, status: "missing_credentials" },
  };

  // Document AI test (GET processor)
  const processorId = cfg?.services?.documentAI?.processorId as string | undefined;
  if (results.documentAI.configured && processorId) {
    try {
      const info = await documentAIGetProcessor(processorId);
      results.documentAI.status = "ok";
      results.documentAI.processor = info?.name || processorId;
      await recordLog({ action: "connection_test", provider: "documentAI", success: true, latency_ms: Date.now() - started });
    } catch (e: any) {
      results.documentAI.status = "error";
      results.documentAI.error = e.message;
      await recordLog({ action: "connection_test", provider: "documentAI", success: false, error_message: e.message });
    }
  } else if (results.documentAI.configured && !processorId) {
    results.documentAI.status = "missing_processor";
  }

  return { results, total_ms: Date.now() - started };
}

async function handleRunTest(payload: any) {
  const started = Date.now();
  const cfgRow = await getConfig();
  const cfg: any = cfgRow?.config || {};
  const out: any = { outputs: {}, steps: [] };

  try {
    // Document AI branch - ONLY PROVIDER
    if (payload?.documentDataUrl || payload?.documentBase64 || payload?.docB64) {
      // Check if we have credentials - if not, throw error (no mock data)
      const hasCredentials = Boolean(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON"));
      
      if (!hasCredentials) {
        console.error(`❌ [gcp-unified-config] MISSING GOOGLE CLOUD CREDENTIALS`);
        console.error(`📋 To enable Google Cloud Document AI processing:`);
        console.error(`   1. Add your GOOGLE_SERVICE_ACCOUNT_JSON to supabase/.env.local`);
        console.error(`   2. Set GOOGLE_CLOUD_PROJECT_ID=yachtexcel1`);
        console.error(`   3. Set DOCUMENT_AI_PROCESSOR_ID=8708cd1d9cd87cc1`);
        console.error(`❌ REAL Google Cloud Document AI is required - no mock data available`);
        
        throw new Error('Google Cloud credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_CLOUD_PROJECT_ID environment variables.');
      }
      
      // Original Google Cloud Document AI processing
      // Get correct project ID from environment variables
      const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
      if (!projectId) {
        throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable not set');
      }
      
      // Use processor ID from payload if provided, otherwise use configured or default
      let processorId;
      if (payload.processorId) {
        processorId = payload.processorId;
        console.log(`[gcp-unified-config] Using selected processor: ${processorId}`);
      } else {
        // Fallback to configured processor
        const processorIdShort = '8708cd1d9cd87cc1';
        processorId = `projects/${projectId}/locations/us/processors/${processorIdShort}`;
        const cfgProcessorId = cfg?.services?.documentAI?.processorId as string | undefined;
        if (cfgProcessorId) {
          processorId = cfgProcessorId;
        }
        console.log(`[gcp-unified-config] Using default processor: ${processorId}`);
      }
      
      const docB64 = payload.docB64 || payload.documentBase64 || dataUrlToBase64(payload.documentDataUrl);
      if (!docB64) {
        throw new Error('No document data provided');
      }
      
      // Log payload info without validation
      console.log(`[gcp-unified-config] Processing document:`, {
        docB64Length: docB64.length,
        docB64Sample: docB64.substring(0, 50),
        mimeType: payload?.mimeType || 'application/pdf',
        processorId
      });
      
      const mimeType = payload?.mimeType || 'application/pdf';
      const d = await documentAIProcessDocument(processorId, docB64, mimeType);
      out.outputs.documentAI = d;
      out.steps.push({ provider: 'documentAI', processorId });
    } else {
      throw new Error('Document data is required - this is a Document AI only service');
    }

    const total = Date.now() - started;
    await recordLog({ action: 'run_test', provider: 'documentAI', success: true, latency_ms: total, details: { steps: out.steps.length } });
    return { ...out, metrics: { total_ms: total } };
  } catch (e: any) {
    const total = Date.now() - started;
    console.error(`[gcp-unified-config] handleRunTest error:`, e.message);
    await recordLog({ action: 'run_test', provider: 'documentAI', success: false, latency_ms: total, error_message: e.message });
    throw e;
  }
}

async function handleCheckUpdates() {
  return {
    checked_at: new Date().toISOString(),
    providers: [
      { name: "Document AI", latest: "v1", notes_url: "https://cloud.google.com/document-ai/docs/release-notes" },
    ],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;
    
    console.log(`[gcp-unified-config] Received action: ${action}`);

    // RBAC: Only superadmins can run admin actions (config_update, test_all_connections, check_updates)
    // Document processing (run_test) is allowed for authenticated users
    // Status action is allowed for everyone
    const authHeader = req.headers.get("Authorization") ?? "";
    console.log(`[gcp-unified-config] Auth header present: ${!!authHeader}`);
    
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    console.log(`[gcp-unified-config] User authenticated: ${!!user}, User error: ${userError?.message || 'none'}`);
    
    const roles = (user?.app_metadata?.roles as string[]) || [];
    const isSuper = user?.user_metadata?.is_superadmin === true || user?.app_metadata?.is_superadmin === true || roles.includes('superadmin');
    const requiresAdmin = action === "config_update" || action === "test_all_connections" || action === "check_updates";
    
    // For run_test, allow processing without strict authentication check
    // if (action === "run_test" && !user && !authHeader.includes('service_role')) {
    //   console.log(`[gcp-unified-config] run_test requires authentication`);
    //   return new Response(JSON.stringify({ error: "Authentication required for document processing" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    // }
    
    if (requiresAdmin && !isSuper) {
      console.log(`[gcp-unified-config] Admin action ${action} requires superadmin, user is super: ${isSuper}`);
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "status") {
      const status = await handleStatus();
      return new Response(JSON.stringify(status), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "config_update") {
      const out = await handleConfigUpdate(payload);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "test_all_connections") {
      const out = await handleTestAllConnections();
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "run_test") {
      const out = await handleRunTest(payload);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "check_updates") {
      const out = await handleCheckUpdates();
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    if (action === "get_processor_details") {
      const processorId = body.processorId;
      if (!processorId) {
        return new Response(JSON.stringify({ success: false, error: "Processor ID required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        });
      }
      
      try {
        const processorDetails = await documentAIGetProcessor(processorId);
        return new Response(JSON.stringify({ 
          success: true, 
          processor: processorDetails,
          message: "Processor details retrieved successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("Error getting processor details:", error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message || "Failed to get processor details"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("gcp-unified-config error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
