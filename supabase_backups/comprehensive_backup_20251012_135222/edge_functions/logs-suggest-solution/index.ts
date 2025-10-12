import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logAnalyticsEvent } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: 'ok', function: 'logs-suggest-solution', time: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  try {
    // RBAC: only superadmins may call this
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });

    await logAnalyticsEvent(
      // We need service role to ensure insert even if user has limited role; but anon with permissive policy works as well
      createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''),
      {
        event_type: 'logs_suggest_solution_request',
        event_message: 'logs-suggest-solution request received',
        module: 'logs_suggest_solution',
        severity: 'info',
        metadata: { method: req.method },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const roles = (user?.app_metadata?.roles as string[]) || [];
    const isSuper = user?.user_metadata?.is_superadmin === true || user?.app_metadata?.is_superadmin === true || roles.includes('superadmin');
    if (!isSuper) {
      await logAnalyticsEvent(
        createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''),
        {
          event_type: 'logs_suggest_solution_forbidden',
          event_message: 'Forbidden - not superadmin',
          module: 'logs_suggest_solution',
          severity: 'warn',
        }
      );
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!OPENAI_API_KEY) {
      await logAnalyticsEvent(
        createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''),
        {
          event_type: 'logs_suggest_solution_missing_key',
          event_message: 'Missing OPENAI_API_KEY',
          module: 'logs_suggest_solution',
          severity: 'error',
        }
      );
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { log } = await req.json();

    const system = `You are an expert SRE and AI platform engineer for a web app using Google Vision, Vertex AI, Document AI, and Supabase Edge Functions. Given a log entry (with severity, module/service, timestamp, message, metadata), analyze root cause and propose a concise, actionable resolution plan with clear steps, checks, and follow-ups. Prefer concrete commands and Supabase function names if relevant. Keep response under 400 words.`;

    const userPrompt = `Log Entry:\n${JSON.stringify(log, null, 2)}\n\nContext: The app runs on Supabase Edge Functions. Suggest steps to fix and prevent recurrence.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      await logAnalyticsEvent(
        createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''),
        {
          event_type: 'logs_suggest_solution_openai_error',
          event_message: 'OpenAI API error',
          module: 'logs_suggest_solution',
          severity: 'error',
          metadata: { openai_status: response.status, text },
        }
      );
      return new Response(JSON.stringify({ error: `OpenAI error: ${text}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content ?? "No suggestion generated.";

    await logAnalyticsEvent(
      createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''),
      {
        event_type: 'logs_suggest_solution_success',
        event_message: 'Suggestion generated',
        module: 'logs_suggest_solution',
        severity: 'info',
        metadata: { suggestion_preview: suggestion.slice(0, 120) },
      }
    );

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("logs-suggest-solution error", e);

    await logAnalyticsEvent(
      createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''),
      {
        event_type: 'logs_suggest_solution_exception',
        event_message: 'Unhandled error in logs-suggest-solution',
        module: 'logs_suggest_solution',
        severity: 'error',
        metadata: { error: { message: e?.message, stack: e?.stack } },
      }
    );

    const err = {
      message: e?.message ?? String(e),
      code: 'LOGS_SUGGEST_SOLUTION_ERROR',
      function: 'logs-suggest-solution',
      requestId: (globalThis as any).crypto?.randomUUID?.(),
      timestamp: new Date().toISOString(),
    };
    const status = typeof e?.status === 'number' ? e.status : 500;
    return new Response(JSON.stringify({ error: err }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
