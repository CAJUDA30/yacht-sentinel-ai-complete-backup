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

async function listDocumentAIProcessors(projectId: string, locations: string[] = ['us', 'eu', 'asia1']) {
  const accessToken = await getGoogleAccessToken();
  const allProcessors: any[] = [];
  
  console.log(`[gcp-unified-config] Discovering processors across ${locations.length} locations: ${locations.join(', ')}`);
  
  for (const location of locations) {
    try {
      const url = `https://documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors`;
      console.log(`[gcp-unified-config] Fetching processors from ${location}: ${url}`);
      
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      const json = await resp.json();
      if (!resp.ok) {
        console.error(`[gcp-unified-config] Error fetching processors from ${location}:`, json.error?.message || 'Unknown error');
        continue; // Continue with other locations
      }
      
      const processors = json.processors || [];
      console.log(`[gcp-unified-config] Found ${processors.length} processors in ${location}`);
      
      // Add location metadata to each processor
      processors.forEach((processor: any) => {
        processor.location = location;
        processor.projectId = projectId;
        // Extract short processor ID from full name
        const match = processor.name?.match(/processors\/([^/]+)$/);
        processor.shortId = match ? match[1] : processor.name;
      });
      
      allProcessors.push(...processors);
    } catch (error) {
      console.error(`[gcp-unified-config] Exception fetching processors from ${location}:`, error);
      // Continue with other locations
    }
  }
  
  console.log(`[gcp-unified-config] Total processors discovered: ${allProcessors.length}`);
  return allProcessors;
}

async function syncProcessorsToDatabase(processors: any[]) {
  console.log(`[gcp-unified-config] Syncing ${processors.length} processors to database`);
  
  const syncResults = {
    created: 0,
    updated: 0,
    errors: 0,
    skipped: 0,
    details: [] as any[]
  };
  
  for (const processor of processors) {
    try {
      if (!processor.shortId || !processor.displayName) {
        console.warn(`[gcp-unified-config] Skipping processor with missing required fields:`, processor.name);
        syncResults.skipped++;
        continue;
      }
      
      // Check if processor already exists
      const { data: existing, error: selectError } = await supabase
        .from('document_ai_processors')
        .select('id, processor_id, updated_at')
        .eq('processor_id', processor.shortId)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw selectError;
      }
      
      const processorData = {
        name: processor.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || processor.shortId,
        display_name: processor.displayName || processor.name,
        processor_id: processor.shortId,
        processor_full_id: processor.name,
        processor_type: processor.type || 'CUSTOM_EXTRACTOR',
        location: processor.location,
        project_id: processor.projectId,
        specialization: processor.displayName || 'Document Processing',
        description: `Auto-discovered processor: ${processor.displayName || processor.name}`,
        is_active: processor.state === 'ENABLED',
        configuration: {
          auto_discovered: true,
          cloud_state: processor.state,
          create_time: processor.createTime,
          kms_key_name: processor.kmsKeyName,
          process_endpoint: processor.processEndpoint
        },
        updated_at: new Date().toISOString()
      };
      
      if (existing) {
        // Update existing processor
        const { error: updateError } = await supabase
          .from('document_ai_processors')
          .update(processorData)
          .eq('id', existing.id);
        
        if (updateError) throw updateError;
        
        syncResults.updated++;
        syncResults.details.push({
          processor_id: processor.shortId,
          action: 'updated',
          display_name: processor.displayName
        });
        
        console.log(`[gcp-unified-config] Updated processor: ${processor.displayName} (${processor.shortId})`);
      } else {
        // Create new processor
        const { error: insertError } = await supabase
          .from('document_ai_processors')
          .insert([{
            ...processorData,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
          }]);
        
        if (insertError) throw insertError;
        
        syncResults.created++;
        syncResults.details.push({
          processor_id: processor.shortId,
          action: 'created',
          display_name: processor.displayName
        });
        
        console.log(`[gcp-unified-config] Created processor: ${processor.displayName} (${processor.shortId})`);
      }
    } catch (error) {
      console.error(`[gcp-unified-config] Error syncing processor ${processor.shortId}:`, error);
      syncResults.errors++;
      syncResults.details.push({
        processor_id: processor.shortId,
        action: 'error',
        error: error.message
      });
    }
  }
  
  console.log(`[gcp-unified-config] Sync completed:`, syncResults);
  return syncResults;
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

  // First attempt processor discovery/sync from Google Cloud
  if (results.documentAI.configured) {
    try {
      const projectId = cfg?.project_id || Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || "338523806048";
      console.log(`[gcp-unified-config] Attempting processor discovery and sync for project: ${projectId}`);
      
      const cloudProcessors = await listDocumentAIProcessors(projectId);
      const syncResults = await syncProcessorsToDatabase(cloudProcessors);
      
      results.documentAI.discovery = {
        processors_found: cloudProcessors.length,
        sync_results: syncResults,
        status: "success"
      };
      
      console.log(`[gcp-unified-config] Processor discovery completed: ${cloudProcessors.length} found, ${syncResults.created} created, ${syncResults.updated} updated`);
    } catch (discoveryError: any) {
      console.error(`[gcp-unified-config] Processor discovery failed:`, discoveryError);
      results.documentAI.discovery = {
        status: "error",
        error: discoveryError.message
      };
    }
  }

  // Then test processor connections using database processors
  try {
    const { data: dbProcessors, error: dbError } = await supabase
      .from('document_ai_processors')
      .select('processor_id, processor_full_id, display_name, is_active')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .limit(5); // Test up to 5 processors
    
    if (dbError) throw dbError;
    
    results.documentAI.database_processors = {
      total_active: dbProcessors?.length || 0,
      tested: [] as any[]
    };
    
    if (dbProcessors && dbProcessors.length > 0) {
      console.log(`[gcp-unified-config] Testing ${dbProcessors.length} database processors`);
      
      for (const processor of dbProcessors.slice(0, 3)) { // Test first 3
        try {
          const processorId = processor.processor_full_id || `projects/${cfg?.project_id || "338523806048"}/locations/us/processors/${processor.processor_id}`;
          const info = await documentAIGetProcessor(processorId);
          
          results.documentAI.database_processors.tested.push({
            processor_id: processor.processor_id,
            display_name: processor.display_name,
            status: "ok",
            cloud_name: info?.name || processorId
          });
        } catch (testError: any) {
          results.documentAI.database_processors.tested.push({
            processor_id: processor.processor_id,
            display_name: processor.display_name,
            status: "error",
            error: testError.message
          });
        }
      }
      
      results.documentAI.status = "ok";
    } else {
      results.documentAI.status = "no_processors";
      results.documentAI.message = "No active processors found in database. Try running processor discovery.";
    }
  } catch (dbTestError: any) {
    console.error(`[gcp-unified-config] Database processor test failed:`, dbTestError);
    results.documentAI.status = "database_error";
    results.documentAI.error = dbTestError.message;
  }

  await recordLog({ 
    action: "connection_test", 
    provider: "documentAI", 
    success: results.documentAI.status === "ok", 
    latency_ms: Date.now() - started,
    details: { discovery: results.documentAI.discovery, processors_tested: results.documentAI.database_processors?.tested?.length || 0 }
  });

  return { results, total_ms: Date.now() - started };
}

async function handleListProcessors(payload?: any) {
  const started = Date.now();
  
  try {
    // Get project ID from config or environment
    const cfgRow = await getConfig();
    const cfg: any = cfgRow?.config || {};
    const projectId = payload?.project_id || cfg?.project_id || Deno.env.get("GOOGLE_CLOUD_PROJECT_ID") || "338523806048";
    const locations = payload?.locations || ['us', 'eu', 'asia1'];
    
    console.log(`[gcp-unified-config] Starting processor discovery for project ${projectId}`);
    
    // Discover processors from Google Cloud
    const cloudProcessors = await listDocumentAIProcessors(projectId, locations);
    
    // Sync to database
    const syncResults = await syncProcessorsToDatabase(cloudProcessors);
    
    // Get updated database state
    const { data: dbProcessors, error: dbError } = await supabase
      .from('document_ai_processors')
      .select('*')
      .order('priority', { ascending: true });
    
    if (dbError) {
      console.error('[gcp-unified-config] Error fetching updated processors:', dbError);
    }
    
    const result = {
      success: true,
      processors_discovered: cloudProcessors.length,
      sync_results: syncResults,
      database_processors: dbProcessors || [],
      locations_searched: locations,
      project_id: projectId,
      discovery_time_ms: Date.now() - started
    };
    
    await recordLog({ 
      action: "list_processors", 
      provider: "documentAI", 
      success: true, 
      latency_ms: Date.now() - started,
      details: { 
        discovered: cloudProcessors.length, 
        synced: syncResults.created + syncResults.updated,
        locations: locations.length 
      }
    });
    
    console.log(`[gcp-unified-config] Processor discovery completed successfully:`, result);
    return result;
    
  } catch (error: any) {
    console.error('[gcp-unified-config] handleListProcessors error:', error);
    
    await recordLog({ 
      action: "list_processors", 
      provider: "documentAI", 
      success: false, 
      latency_ms: Date.now() - started,
      error_message: error.message
    });
    
    // Return graceful error response
    return {
      success: false,
      error: error.message,
      processors_discovered: 0,
      sync_results: { created: 0, updated: 0, errors: 1, skipped: 0, details: [] },
      database_processors: [],
      troubleshooting: {
        check_credentials: !Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON"),
        check_project_id: !Deno.env.get("GOOGLE_CLOUD_PROJECT_ID"),
        suggested_action: "Verify Google Cloud credentials and project configuration"
      }
    };
  }
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
    
    if (action === "list_processors") {
      // Allow superadmins to discover and sync processors
      if (!isSuper) {
        console.log(`[gcp-unified-config] list_processors requires superadmin, user is super: ${isSuper}`);
        return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      const out = await handleListProcessors(payload);
      return new Response(JSON.stringify(out), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    if (action === "test_processor") {
      const { processor_id, location, project_id } = body;
      
      if (!processor_id || !location || !project_id) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "processor_id, location, and project_id are required" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        });
      }
      
      try {
        const started = Date.now();
        const fullProcessorId = `projects/${project_id}/locations/${location}/processors/${processor_id}`;
        
        console.log(`[gcp-unified-config] Testing processor: ${fullProcessorId}`);
        
        // Test processor accessibility
        const processorDetails = await documentAIGetProcessor(fullProcessorId);
        const latency = Date.now() - started;
        
        await recordLog({ 
          action: 'test_processor', 
          provider: 'documentAI', 
          success: true, 
          latency_ms: latency,
          details: { processor_id, location, project_id }
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Processor ${processor_id} is accessible and operational`,
          details: {
            processor_name: processorDetails.name,
            display_name: processorDetails.displayName,
            type: processorDetails.type,
            state: processorDetails.state,
            latency_ms: latency
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("Error testing processor:", error);
        
        await recordLog({ 
          action: 'test_processor', 
          provider: 'documentAI', 
          success: false, 
          error_message: error.message,
          details: { processor_id, location, project_id }
        });
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message || "Failed to test processor",
          message: `Processor ${processor_id} test failed: ${error.message}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        });
      }
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
