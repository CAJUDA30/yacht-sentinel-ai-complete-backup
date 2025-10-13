import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", function: "sync-user-roles", time: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    // Client as the caller (to read the user from the JWT)
    const caller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await caller.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client to read roles and update auth metadata
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch roles from our RBAC table
    const { data: rolesRows, error: rolesErr } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesErr) {
      return new Response(JSON.stringify({ error: "failed_to_fetch_roles", details: rolesErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roles = (rolesRows || []).map((r: any) => r.role);
    const isSuper = roles.includes("superadmin");

    // Update auth app_metadata so legacy checks keep working
    const { data: updated, error: updErr } = await service.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata || {}),
        roles,
        is_superadmin: isSuper,
      },
    });

    if (updErr) {
      return new Response(JSON.stringify({ error: "failed_to_update_app_metadata", details: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, roles, is_superadmin: isSuper, user_id: user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("sync-user-roles error", e);
    return new Response(JSON.stringify({ error: "unexpected_error", message: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
