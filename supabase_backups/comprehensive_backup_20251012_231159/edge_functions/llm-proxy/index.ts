import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });

  try {
    const { providerId, providerName, model, messages, params = {}, options = {} } = await req.json();

    if (!providerId && !providerName) {
      return new Response(JSON.stringify({ error: "providerId or providerName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: providers, error: pErr } = await supabase
      .from("ai_providers")
      .select("id,name,base_url,chat_endpoint,auth_type,auth_header_name,api_secret_name")
      .or(providerId ? `id.eq.${providerId}` : "")
      .or(providerName ? `name.eq.${providerName}` : "");

    if (pErr) throw pErr;
    const provider = providers?.[0];
    if (!provider) {
      return new Response(JSON.stringify({ error: "Provider not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKeyName: string | undefined = provider.api_secret_name || undefined;
    const apiKey = apiKeyName ? Deno.env.get(apiKeyName) : undefined;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: `Missing API secret ${apiKeyName || "(unset)"}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `${provider.base_url?.replace(/\/$/, "") || ""}${provider.chat_endpoint || ""}`;
    if (!url) {
      return new Response(JSON.stringify({ error: "Provider endpoint not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timeoutMs = Number(options.timeoutMs ?? 30000);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authHeader = provider.auth_header_name || "Authorization";
    headers[authHeader] = provider.auth_type === "bearer" ? `Bearer ${apiKey}` : apiKey;

    const started = Date.now();
    let response, json;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ model, messages, ...params }),
        signal: controller.signal,
      });
      json = await response.json().catch(() => ({}));
    } finally {
      clearTimeout(t);
    }

    const latency = Date.now() - started;

    // Best-effort logging (non-blocking)
    const status = response?.ok ? "success" : "error";
    const logPayload = {
      status,
      request_type: "chat",
      latency_ms: latency,
      response: JSON.stringify(json).slice(0, 4000),
      metadata: { provider_id: provider.id, provider_name: provider.name, model },
    } as const;
    supabase.from("ai_model_logs").insert(logPayload).then(() => {}).catch(() => {});

    if (!response?.ok) {
      return new Response(JSON.stringify({ error: json?.error || json || "Provider error" }), {
        status: response?.status || 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: json, latency_ms: latency, provider: { id: provider.id, name: provider.name } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
