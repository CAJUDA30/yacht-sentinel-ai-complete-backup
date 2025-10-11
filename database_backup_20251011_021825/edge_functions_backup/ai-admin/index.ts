import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const getClient = (req: Request) => {
  const authHeader = req.headers.get("Authorization") ?? "";
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
};

// Helper: fetch provider + secret info
async function getProvider(supabase: any, providerId: string) {
  const { data, error } = await supabase
    .from("ai_providers")
    .select("id, name, base_url, models_endpoint, discovery_url, test_endpoint, chat_endpoint, embeddings_endpoint, tools_endpoint, auth_type, auth_header_name, api_secret_name")
    .eq("id", providerId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Provider not found");
  const secretName = data.api_secret_name || inferSecretName(data.name);
  const apiKey = secretName ? Deno.env.get(secretName) : undefined;
  return { provider: data, secretName, apiKey } as const;
}

function inferSecretName(name?: string): string | undefined {
  if (!name) return undefined;
  const key = name.toUpperCase();
  if (key.includes("OPENAI")) return "OPENAI_API_KEY";
  if (key.includes("GEMINI") || key.includes("GOOGLE")) return "GEMINI_API_KEY";
  if (key.includes("GROK") || key.includes("XAI")) return "GROK_API_KEY";
  if (key.includes("DEEPSEEK")) return "DEEPSEEK_API_KEY";
  return undefined;
}

function buildAuthHeaders(provider: any, apiKey?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    const headerName = provider.auth_header_name || "Authorization";
    if ((provider.auth_type || 'bearer') === 'bearer') {
      headers[headerName] = `Bearer ${apiKey}`;
    } else {
      headers[headerName] = apiKey;
    }
  }
  return headers;
}

function maskSecret(value: string): { masked: string; last4: string; length: number } {
  const v = value || '';
  const length = v.length;
  const last4 = v.slice(-4);
  const masked = length <= 4 ? '•'.repeat(length) : '•'.repeat(length - 4) + last4;
  return { masked, last4, length };
}

const KNOWN_SECRET_NAMES = [
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'GROK_API_KEY',
  'DEEPSEEK_API_KEY',
  'GOOGLE_VISION_API_KEY',
  'ELEVENLABS_API_KEY',
  'WINDY_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
];

async function ensureSuperAdmin(req: Request) {
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await client.auth.getUser();
  const roles = (user?.app_metadata?.roles as string[]) || [];
  const isSuper = user?.user_metadata?.is_superadmin === true || user?.app_metadata?.is_superadmin === true || roles.includes('superadmin');
  if (!isSuper) throw new Error("forbidden");
}

async function handleAction(req: Request) {
  const supabase = getClient(req);
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  switch (action) {
    case "list_providers": {
      const { data, error } = await supabase.from("ai_providers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return { data };
    }

    case "create_provider": {
      await ensureSuperAdmin(req);
      const { providerName, baseUrl, authType, modelListEndpoint, headersTemplate } = body;
      const { data, error } = await supabase.from("ai_providers").insert({
        name: providerName,
        base_url: baseUrl,
        auth_type: authType || "bearer",
        auth_header_name: headersTemplate?.authHeaderName || "Authorization",
        models_endpoint: modelListEndpoint || null,
      }).select("id").maybeSingle();
      if (error) throw error;
      return { providerId: data?.id };
    }

    case "update_credentials": {
      await ensureSuperAdmin(req);
      const { providerId, secretName } = body;
      const { data: provider, error: pErr } = await supabase.from("ai_providers").update({ api_secret_name: secretName }).eq("id", providerId).select("name, api_secret_name").maybeSingle();
      if (pErr) throw pErr;
      const exists = !!Deno.env.get(secretName);
      return { status: exists ? "ok" : "missing_secret", provider };
    }

    case "fetch_models": {
      await ensureSuperAdmin(req);
      const { providerId, forceRefresh } = body;
      const { provider, apiKey } = await getProvider(supabase, providerId);
      if (!provider.models_endpoint && !provider.discovery_url) throw new Error("Provider has no models endpoint configured");
      if (!apiKey) throw new Error("Missing API key for provider");

      const url = provider.models_endpoint || provider.discovery_url;
      const headers = buildAuthHeaders(provider, apiKey);
      const t0 = performance.now();
      const resp = await fetch(url, { headers });
      const latency = Math.round(performance.now() - t0);
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Model list fetch failed: ${resp.status} ${txt}`);
      }
      const json = await resp.json();

      // Normalize: expect array of models with id & capabilities
      const models: Array<{ id: string; name?: string; capabilities?: any }> =
        Array.isArray(json?.data) ? json.data : (Array.isArray(json?.models) ? json.models : []);

      for (const m of models) {
        const model_id = m.id || m.model_id || m.name;
        if (!model_id) continue;
        await supabase.from("llm_provider_models").upsert({
          provider_id: providerId,
          model_id,
          model_name: m.name || model_id,
          capabilities: m.capabilities || {},
          fetched_at: new Date().toISOString(),
        }, { onConflict: "provider_id,model_id" });
      }

      // Return cached list
      const { data } = await supabase
        .from("llm_provider_models")
        .select("model_id, model_name, capabilities")
        .eq("provider_id", providerId)
        .order("model_id");

      // Log health
      await supabase.from("ai_health").upsert({
        provider_id: providerId,
        status: "connected",
        last_checked_at: new Date().toISOString(),
        metadata: { fetched: data?.length ?? 0, latency }
      }, { onConflict: "provider_id" });

      return { models: data, latency };
    }

    case "test_connection": {
      await ensureSuperAdmin(req);
      const { providerId } = body;
      const { provider, apiKey } = await getProvider(supabase, providerId);
      if (!apiKey) return { connected: false, errors: ["Missing API key"], latency: null };
      const url = provider.test_endpoint || provider.models_endpoint || provider.discovery_url || provider.base_url;
      if (!url) return { connected: false, errors: ["No endpoint configured"], latency: null };

      const headers = buildAuthHeaders(provider, apiKey);
      const t0 = performance.now();
      let ok = false, err: string | null = null;
      try {
        const resp = await fetch(url, { headers, method: "GET" });
        ok = resp.ok;
        if (!ok) err = `${resp.status} ${await resp.text()}`;
      } catch (e) {
        err = String(e);
      }
      const latency = Math.round(performance.now() - t0);

      await supabase.from("ai_provider_logs").insert({
        provider_id: providerId,
        status: ok ? "connected" : "error",
        message: ok ? "Connection OK" : "Connection failed",
        latency_ms: latency,
        details: err ? { error: err } : {},
      });

      await supabase.from("ai_health").upsert({
        provider_id: providerId,
        status: ok ? "healthy" : "degraded",
        last_checked_at: new Date().toISOString(),
        metadata: { last_error: err }
      }, { onConflict: "provider_id" });

      return { connected: ok, details: ok ? "OK" : err, latency };
    }

    case "save_config": {
      await ensureSuperAdmin(req);
      const { id, providerId, modelId, module, params, active, priority } = body;
      const payload: any = {
        provider_id: providerId,
        model_id: modelId,
        module,
        params: params || {},
        active: active ?? true,
        priority: priority ?? 50,
      };
      let res;
      if (id) {
        res = await supabase.from("ai_configs").update(payload).eq("id", id).select("*").maybeSingle();
      } else {
        res = await supabase.from("ai_configs").insert(payload).select("*").maybeSingle();
      }
      if (res.error) throw res.error;
      return { config: res.data };
    }

    case "list_configs": {
      const { data, error } = await supabase.from("ai_configs").select("*");
      if (error) throw error;
      return { data };
    }

    case "map_module": {
      await ensureSuperAdmin(req);
      const { module, providerId, modelId, defaults, isActive, priority } = body;
      const up = await supabase.from("module_mappings").upsert({
        module,
        provider_id: providerId,
        model_id: modelId,
        defaults: defaults || {},
        is_active: isActive ?? true,
        priority: priority ?? 50,
        updated_at: new Date().toISOString()
      }, { onConflict: "module" }).select("*").maybeSingle();
      if (up.error) throw up.error;
      return { mapping: up.data };
    }

    case "list_module_mappings": {
      const { data, error } = await supabase.from("module_mappings").select("*");
      if (error) throw error;
      return { data };
    }

    case "save_field_rule": {
      await ensureSuperAdmin(req);
      const { module, fieldName, enabled, humanReview, confidenceThreshold, validationRegex, minValue, maxValue } = body;
      const up = await supabase.from("ai_field_rules").upsert({
        module,
        field_name: fieldName,
        enabled: enabled ?? true,
        human_review: humanReview ?? false,
        confidence_threshold: confidenceThreshold ?? 0.8,
        validation_regex: validationRegex || null,
        min_value: minValue ?? null,
        max_value: maxValue ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "module,field_name" }).select("*").maybeSingle();
      if (up.error) throw up.error;
      return { rule: up.data };
    }

    case "list_field_rules": {
      const { module } = body;
      let query = supabase.from("ai_field_rules").select("*");
      if (module) query = query.eq("module", module);
      const { data, error } = await query;
      if (error) throw error;
      return { data };
    }

    case "get_logs": {
      const { providerId } = body;
      const { data, error } = await supabase
        .from("ai_provider_logs").select("*")
        .eq("provider_id", providerId)
        .order("tested_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return { data };
    }

    case "secrets_status": {
      const items = KNOWN_SECRET_NAMES.map((name) => {
        const val = Deno.env.get(name) || '';
        const m = maskSecret(val);
        return { name, configured: !!val, preview: m.masked, last4: m.last4, length: m.length };
      });
      return { data: items };
    }

    case "check_secret": {
      const { secretName } = body;
      const val = secretName ? (Deno.env.get(secretName) || '') : '';
      const m = maskSecret(val);
      return { name: secretName, configured: !!val, preview: m.masked, last4: m.last4, length: m.length };
    }

    case "reveal_secret": {
      const { secretName, reveal } = body;
      const val = secretName ? (Deno.env.get(secretName) || '') : '';
      const m = maskSecret(val);

      await supabase.from('analytics_events').insert({
        event_type: 'admin',
        module: 'superadmin',
        event_message: `Secret ${secretName} ${reveal ? 'revealed' : 'previewed'}`,
        severity: reveal ? 'warning' : 'info',
        metadata: { secretName, reveal }
      });

      return { name: secretName, configured: !!val, value: reveal ? val : m.masked, preview: m.masked, last4: m.last4, length: m.length };
    }

    case "get_config_summary": {
      const { data: providers, error: pErr } = await supabase
        .from('ai_providers')
        .select('id,name,base_url,api_secret_name,is_active,models_endpoint,updated_at');
      if (pErr) throw pErr;

      const { data: health } = await supabase
        .from('ai_health')
        .select('provider_id,status,last_checked_at,metadata');
      const { data: models } = await supabase
        .from('llm_provider_models')
        .select('provider_id,model_id');
      const { data: configs } = await supabase
        .from('ai_configs')
        .select('id,module,provider_id,model_id,active,priority,params,updated_at');

      const providersSummary = (providers || []).map((p: any) => {
        const h = (health || []).find((h: any) => h.provider_id === p.id);
        const mCount = (models || []).filter((m: any) => m.provider_id === p.id).length;
        const secretName = p.api_secret_name || inferSecretName(p.name);
        const configured = secretName ? !!Deno.env.get(secretName) : false;
        return {
          id: p.id,
          name: p.name,
          is_active: p.is_active,
          models_endpoint: p.models_endpoint,
          status: h?.status || 'unknown',
          last_checked_at: h?.last_checked_at || null,
          models_count: mCount,
          secret_name: secretName || null,
          secret_configured: configured,
          updated_at: p.updated_at
        };
      });

      return { providers: providersSummary, configs: configs || [] };
    }

    case "update_service_config": {
      await ensureSuperAdmin(req);
      const { serviceKey, enabled, provider_id, model_id, config } = body;
      
      // Update or create service configuration
      const { data, error } = await supabase.from("ai_configs").upsert({
        module: serviceKey,
        provider_id,
        model_id: model_id || 'default',
        active: enabled ?? true,
        params: config || {},
        priority: 50,
      }, { onConflict: "module" }).select("*").maybeSingle();
      
      if (error) throw error;
      
      // Log the configuration change
      await supabase.from('analytics_events').insert({
        event_type: 'admin',
        module: 'ai_config',
        event_message: `Service ${serviceKey} ${enabled ? 'enabled' : 'disabled'}`,
        severity: 'info',
        metadata: { serviceKey, enabled, provider_id, model_id }
      });
      
      return { success: true, config: data };
    }

    case "validate_all_services": {
      await ensureSuperAdmin(req);
      // Validate all configured AI services
      const { data: configs } = await supabase.from("ai_configs").select("*").eq("active", true);
      const { data: providers } = await supabase.from("ai_providers").select("*");
      
      const validationResults = [];
      
      for (const config of configs || []) {
        const provider = providers?.find(p => p.id === config.provider_id);
        if (!provider) continue;
        
        const secretName = provider.api_secret_name || inferSecretName(provider.name);
        const apiKey = secretName ? Deno.env.get(secretName) : undefined;
        
        let status = 'unknown';
        let error = null;
        let latency = null;
        
        if (apiKey) {
          try {
            const testUrl = provider.test_endpoint || provider.models_endpoint || provider.base_url;
            if (testUrl) {
              const headers = buildAuthHeaders(provider, apiKey);
              const t0 = performance.now();
              const resp = await fetch(testUrl, { headers, method: "GET" });
              latency = Math.round(performance.now() - t0);
              status = resp.ok ? 'healthy' : 'error';
              if (!resp.ok) {
                error = `${resp.status} ${await resp.text()}`;
              }
            }
          } catch (e) {
            status = 'error';
            error = String(e);
          }
        } else {
          status = 'error';
          error = 'Missing API key';
        }
        
        // Update health status
        await supabase.from("ai_health").upsert({
          provider_id: config.provider_id,
          status,
          last_checked_at: new Date().toISOString(),
          metadata: { last_error: error, latency }
        }, { onConflict: "provider_id" });
        
        validationResults.push({
          service: config.module,
          provider: provider.name,
          status,
          error,
          latency
        });
      }
      
      return { results: validationResults };
    }

    case "get_service_logs": {
      const { serviceKey, limit = 50 } = body;
      
      // Get logs for a specific service
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("module", serviceKey)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { logs: data || [] };
    }

    case "update_endpoints": {
      await ensureSuperAdmin(req);
      const { providerId, base_url, chat_endpoint, models_endpoint, test_endpoint, auth_type, auth_header_name } = body;
      if (!providerId) throw new Error("providerId is required");
      const updates: any = {};
      if (typeof base_url === 'string') updates.base_url = base_url;
      if (typeof chat_endpoint === 'string') updates.chat_endpoint = chat_endpoint;
      if (typeof models_endpoint === 'string') updates.models_endpoint = models_endpoint;
      if (typeof test_endpoint === 'string') updates.test_endpoint = test_endpoint;
      if (typeof auth_type === 'string') updates.auth_type = auth_type;
      if (typeof auth_header_name === 'string') updates.auth_header_name = auth_header_name;

      const { data, error } = await supabase
        .from('ai_providers')
        .update(updates)
        .eq('id', providerId)
        .select('*')
        .maybeSingle();
      if (error) throw error;

      // Log admin change
      await supabase.from('analytics_events').insert({
        event_type: 'admin',
        module: 'providers',
        event_message: `Endpoints updated for provider ${providerId}`,
        severity: 'info',
        metadata: { providerId, updates }
      });

      return { updated: data };
    }

    case "test_chat_endpoint": {
      await ensureSuperAdmin(req);
      const { providerId, model = 'grok-3-mini', prompt = 'Hello from YachtExcel' } = body;
      const { provider, apiKey } = await getProvider(supabase, providerId);
      if (!apiKey) throw new Error('Missing API key for provider');

      const base = provider.base_url || '';
      // prefer chat_endpoint; fallback to test_endpoint
      // support absolute URLs
      const path = (provider as any).chat_endpoint || provider.test_endpoint || provider.models_endpoint || '';
      const url = path?.startsWith('http') ? path : `${base?.replace(/\/$/, '')}${path ? '/' + path.replace(/^\//, '') : ''}`;
      if (!url) throw new Error('No chat/test endpoint configured');

      const headers = buildAuthHeaders(provider, apiKey);
      const bodyPayload = {
        model,
        messages: [
          { role: 'system', content: 'You are a test assistant. Keep answers brief.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 60
      };

      const t0 = performance.now();
      let ok = false, errMsg: string | null = null, preview: string | null = null;
      try {
        const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(bodyPayload) });
        const latency = Math.round(performance.now() - t0);
        if (!resp.ok) {
          errMsg = `${resp.status} ${await resp.text()}`;
        } else {
          const json = await resp.json().catch(() => ({}));
          const content = json?.choices?.[0]?.message?.content || json?.response || json?.text || '';
          preview = typeof content === 'string' ? content.slice(0, 200) : JSON.stringify(json).slice(0, 200);
          ok = true;
        }

        await supabase.from('ai_provider_logs').insert({
          provider_id: providerId,
          status: ok ? 'connected' : 'error',
          message: ok ? 'Chat OK' : 'Chat failed',
          latency_ms: latency,
          details: errMsg ? { error: errMsg } : { preview },
        });

        await supabase.from('ai_health').upsert({
          provider_id: providerId,
          status: ok ? 'healthy' : 'degraded',
          last_checked_at: new Date().toISOString(),
          metadata: { last_error: errMsg, preview }
        }, { onConflict: 'provider_id' });

        return { ok, preview, latency };
      } catch (e) {
        const latency = Math.round(performance.now() - t0);
        const msg = String(e);
        await supabase.from('ai_provider_logs').insert({
          provider_id: providerId,
          status: 'error',
          message: 'Chat exception',
          latency_ms: latency,
          details: { error: msg }
        });
        await supabase.from('ai_health').upsert({
          provider_id: providerId,
          status: 'degraded',
          last_checked_at: new Date().toISOString(),
          metadata: { last_error: msg }
        }, { onConflict: 'provider_id' });
        throw new Error(msg);
      }
    }

    default:
      return { error: `Unknown action: ${action}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'ai-admin', time: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await handleAction(req);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("ai-admin error", error);
    const isForbidden = String(error).includes('forbidden');
    const status = isForbidden ? 403 : 400;
    const err = {
      message: isForbidden ? 'Superadmin privileges required' : (error?.message ?? 'Bad request'),
      code: isForbidden ? 'FORBIDDEN_SUPERADMIN_REQUIRED' : 'AI_ADMIN_ERROR',
      function: 'ai-admin',
      requestId: (globalThis as any).crypto?.randomUUID?.(),
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify({ error: err }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});