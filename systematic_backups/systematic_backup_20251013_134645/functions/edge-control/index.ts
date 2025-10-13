
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PROJECT_REF = (new URL(SUPABASE_URL)).host.split(".")[0];
const FUNCTIONS_BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EdgeSetting = {
  function_name: string;
  enabled: boolean;
  timeout_ms: number;
  warm_schedule: string | null;
  verify_jwt: boolean | null;
  department: string | null;
  feature_flag: string | null;
  updated_at?: string;
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health endpoint (warm-up friendly)
  if (req.method === "GET") {
    return json({ status: "ok", function: "edge-control", time: new Date().toISOString() });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (!action) {
      return jsonError("Missing 'action' in request body", 400);
    }

    switch (action) {
      case "list_settings": {
        const { data: settings, error: sErr } = await supabase
          .from("edge_function_settings")
          .select("*")
          .order("function_name", { ascending: true });

        if (sErr) return jsonError(sErr.message, 500, { code: "LIST_SETTINGS_ERROR" });

        const { data: health, error: hErr } = await supabase
          .from("edge_function_health")
          .select("*");

        if (hErr) return jsonError(hErr.message, 500, { code: "LIST_HEALTH_ERROR" });

        // Emit event
        await publishEvent(supabase, {
          event_type: "edge_control.list_settings",
          severity: "info",
          module: "edge_function_settings",
          department: "Operations",
          payload: { count: settings?.length ?? 0 }
        });

        return json({ settings, health });
      }

      case "upsert_setting": {
        const payload = body?.payload as Partial<EdgeSetting> & { function_name: string };
        if (!payload?.function_name) return jsonError("function_name is required", 400);

        const { data, error } = await supabase
          .from("edge_function_settings")
          .upsert({
            function_name: payload.function_name,
            enabled: payload.enabled ?? true,
            timeout_ms: payload.timeout_ms ?? 10000,
            warm_schedule: payload.warm_schedule ?? "*/10 * * * *",
            verify_jwt: payload.verify_jwt ?? false,
            department: payload.department ?? "Operations",
            feature_flag: payload.feature_flag ?? null,
          })
          .select("*")
          .maybeSingle();

        if (error) return jsonError(error.message, 500, { code: "UPSERT_SETTING_ERROR" });

        await publishEvent(supabase, {
          event_type: "edge_control.upsert_setting",
          severity: "info",
          module: "edge_function_settings",
          department: "Operations",
          payload: { function_name: payload.function_name }
        });

        return json({ updated: data });
      }

      case "warm_and_check": {
        const fnName = body?.function_name as string;
        if (!fnName) return jsonError("function_name is required", 400);

        const { data: setting, error: sErr } = await supabase
          .from("edge_function_settings")
          .select("*")
          .eq("function_name", fnName)
          .maybeSingle();

        if (sErr) return jsonError(sErr.message, 500, { code: "FETCH_SETTING_ERROR" });

        let status = "unknown";
        let latency_ms: number | null = null;
        let err: any = null;

        if (setting?.verify_jwt === false) {
          const url = `${FUNCTIONS_BASE}/${fnName}`;
          const start = Date.now();
          try {
            const res = await fetch(url, { method: "GET" });
            latency_ms = Date.now() - start;
            if (res.ok) {
              status = "healthy";
            } else {
              status = "error";
              err = { status: res.status, statusText: res.statusText };
            }
          } catch (e) {
            status = "error";
            err = { message: `${e}` };
            latency_ms = Date.now() - start;
          }
        } else {
          status = "skipped_auth";
        }

        const { error: hErr } = await supabase
          .from("edge_function_health")
          .upsert({
            function_name: fnName,
            status,
            last_checked_at: new Date().toISOString(),
            latency_ms,
            region: Deno.env.get("FLY_REGION") || Deno.env.get("SUPABASE_REGION") || "unknown",
            version: Deno.env.get("SUPABASE_FUNCTIONS_VERSION") || "unknown",
            error: err,
            metadata: { source: "edge-control:warm_and_check" },
          });

        if (hErr) return jsonError(hErr.message, 500, { code: "UPSERT_HEALTH_ERROR" });

        // Emit event with severity based on status
        await publishEvent(supabase, {
          event_type: "edge_control.warm_and_check",
          severity: status === "healthy" ? "info" : (status === "skipped_auth" ? "info" : "critical"),
          module: "edge_function_health",
          department: "Operations",
          payload: { function: fnName, status, latency_ms, error: err }
        });

        return json({ function: fnName, status, latency_ms, error: err });
      }

      case "publish_event": {
        const { topic, payload } = body || {};
        if (!topic || payload === undefined) return jsonError("topic and payload are required", 400);

        const { data, error } = await supabase
          .from("event_bus")
          .insert({ event_type: topic, payload, severity: "info", department: "Operations", source: "edge-control" })
          .select("id")
          .maybeSingle();

        if (error) return jsonError(error.message, 500, { code: "PUBLISH_EVENT_ERROR" });
        return json({ queued: true, id: data?.id });
      }

      default:
        return jsonError("Unknown action", 400);
    }
  } catch (e: any) {
    console.error("edge-control error:", e);
    return jsonError(e?.message ?? "Internal error", 500, { code: "EDGE_CONTROL_ERROR" });
  }
});

async function publishEvent(
  supabase: ReturnType<typeof createClient>,
  params: { event_type: string; severity?: string; module?: string; department?: string; payload?: any }
) {
  await supabase.from("event_bus").insert({
    event_type: params.event_type,
    severity: params.severity ?? "info",
    module: params.module ?? "edge",
    department: params.department ?? "Operations",
    source: "edge-control",
    payload: params.payload ?? {},
  });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status = 500, extra?: Record<string, unknown>) {
  return json({ error: { message, ...(extra || {}) }, ok: false }, status);
}

