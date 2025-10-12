// Enhanced Multi-AI Processor - Document AI for SmartScan
// Fixed version with correct project configuration and proper base64 handling

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { importPKCS8, SignJWT } from "https://esm.sh/jose@5.2.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function secretPresence() {
  return {
    GOOGLE_SERVICE_ACCOUNT_JSON: Boolean(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")),
    GOOGLE_CLOUD_PROJECT_ID: Boolean(Deno.env.get("GOOGLE_CLOUD_PROJECT_ID")),
    DOCUMENT_AI_PROCESSOR_ID: Boolean(Deno.env.get("DOCUMENT_AI_PROCESSOR_ID")),
  };
}

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

async function documentAIProcessDocument(processorId: string, docBase64: string, mimeType: string) {
  const accessToken = await getGoogleAccessToken();
  const url = `https://documentai.googleapis.com/v1/${processorId}:process`;
  
  console.log(`[enhanced-multi-ai-processor] Processing with:`, {
    url,
    processorId,
    mimeType,
    contentLength: docBase64.length
  });
  
  const body = { 
    rawDocument: { 
      content: docBase64, 
      mimeType 
    } 
  };
  
  const resp = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${accessToken}` 
    },
    body: JSON.stringify(body),
  });
  
  const json = await resp.json();
  
  console.log(`[enhanced-multi-ai-processor] Document AI response:`, {
    status: resp.status,
    ok: resp.ok,
    hasDocument: !!json.document,
    error: json.error?.message
  });
  
  if (!resp.ok) {
    console.error(`[enhanced-multi-ai-processor] Document AI error:`, json);
    throw new Error(json.error?.message || "Document AI process error");
  }
  
  return json;
}

async function handleDocumentAI(payload: any) {
  const started = Date.now();
  
  // Get project ID from environment variables
  const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable not set');
  }
  
  // Build processor ID with correct project
  const processorIdShort = Deno.env.get("DOCUMENT_AI_PROCESSOR_ID") || '8708cd1d9cd87cc1';
  const processorId = `projects/${projectId}/locations/us/processors/${processorIdShort}`;
  
  console.log(`[enhanced-multi-ai-processor] Using processor: ${processorId}`);
  
  if (!payload?.documentDataUrl && !payload?.documentBase64) {
    throw new Error('Document data is required - documentDataUrl or documentBase64');
  }
  
  let docB64 = payload.documentBase64 || dataUrlToBase64(payload.documentDataUrl);
  if (!docB64) {
    throw new Error('No valid document data provided');
  }
  
  // Clean and validate base64
  docB64 = docB64.replace(/\s/g, ''); // Remove all whitespace
  
  // Ensure proper padding
  const padding = (4 - (docB64.length % 4)) % 4;
  if (padding > 0) {
    docB64 += '='.repeat(padding);
  }
  
  // Validate base64 format
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Pattern.test(docB64)) {
    throw new Error('Invalid base64 format');
  }
  
  const mimeType = payload?.mimeType || 'application/pdf';
  
  console.log(`[enhanced-multi-ai-processor] Processing document:`, {
    processorId,
    mimeType,
    base64Length: docB64.length,
    projectId
  });
  
  const result = await documentAIProcessDocument(processorId, docB64, mimeType);
  
  return {
    success: true,
    outputs: {
      documentAI: result
    },
    steps: [{ provider: 'documentAI', processorId }],
    metrics: {
      total_ms: Date.now() - started,
      processor_id: processorId,
      project_id: projectId
    }
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, payload, content, module, action_type } = body;
    
    console.log(`[enhanced-multi-ai-processor] Request:`, {
      action,
      module,
      action_type,
      hasPayload: !!payload,
      hasContent: !!content
    });

    if (action === "status") {
      const secrets = secretPresence();
      const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
      const processorId = Deno.env.get("DOCUMENT_AI_PROCESSOR_ID");
      
      return new Response(JSON.stringify({
        status: "operational",
        secrets,
        project_id: projectId,
        processor_id: processorId,
        full_processor_id: `projects/${projectId}/locations/us/processors/${processorId}`,
        timestamp: new Date().toISOString(),
        message: "Enhanced Multi-AI Processor ready for Document AI processing"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle SmartScan requests (new format)
    if (module === "smartscan" && action_type === "form_parser_extraction" && content) {
      const smartScanPayload = {
        documentDataUrl: content,
        mimeType: 'auto-detect'
      };
      const result = await handleDocumentAI(smartScanPayload);
      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Handle direct test requests
    if (action === "run_test" && payload) {
      const result = await handleDocumentAI(payload);
      return new Response(JSON.stringify(result), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ 
      error: "Unknown action", 
      received: { action, module, action_type, hasPayload: !!payload, hasContent: !!content }
    }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e: any) {
    console.error("[enhanced-multi-ai-processor] Error:", e);
    return new Response(JSON.stringify({ 
      success: false,
      error: e?.message ?? "Server error",
      details: e?.stack || "No stack trace available"
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});