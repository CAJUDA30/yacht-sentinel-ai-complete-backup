import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIResponse {
  provider: string;
  response: string;
  confidence: number;
  reasoning?: string;
}

interface UnifiedResponse {
  primary: AIResponse;
  verification: AIResponse[];
  consensus: string;
  confidence: number;
  verified: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'unified-voice-ai', time: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  try {
    const { prompt, context = "yacht management assistant", action = "chat" } = await req.json();
    
    console.log(`Unified AI processing: ${action} - ${prompt}`);

    // Get API keys
    const GROK_API_KEY = Deno.env.get('GROK_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

    if (!GROK_API_KEY) {
      throw new Error('Grok API key not configured');
    }

    // Primary response from Grok
    const grokResponse = await callGrokAPI(prompt, context, GROK_API_KEY);
    
    // Verification responses
    const verificationPromises = [];
    
    if (OPENAI_API_KEY) {
      verificationPromises.push(callOpenAI(prompt, context, OPENAI_API_KEY));
    }
    
    if (DEEPSEEK_API_KEY) {
      verificationPromises.push(callDeepSeek(prompt, context, DEEPSEEK_API_KEY));
    }

    const verifications = await Promise.allSettled(verificationPromises);
    const validVerifications = verifications
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<AIResponse>).value);

    // Generate consensus and verification
    const unifiedResponse = generateUnifiedResponse(grokResponse, validVerifications);

    return new Response(
      JSON.stringify({
        success: true,
        ...unifiedResponse,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unified Voice AI error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        fallback: "I apologize, but I'm having technical difficulties. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function callGrokAPI(prompt: string, context: string, apiKey: string): Promise<AIResponse> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: `You are an advanced yacht management AI assistant. Context: ${context}. 
                   Be concise, accurate, and helpful. Focus on yacht operations, safety, and efficiency.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  return {
    provider: 'grok',
    response: content,
    confidence: 0.9, // Grok is our primary
    reasoning: 'Primary AI response'
  };
}

async function callOpenAI(prompt: string, context: string, apiKey: string): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are verifying yacht management responses. Context: ${context}. 
                   Provide accurate, safety-focused verification.`
        },
        {
          role: 'user',
          content: `Verify and provide alternative perspective: ${prompt}`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI verification failed`);
  }

  const data = await response.json();
  return {
    provider: 'openai',
    response: data.choices[0].message.content,
    confidence: 0.85,
    reasoning: 'OpenAI verification'
  };
}

async function callDeepSeek(prompt: string, context: string, apiKey: string): Promise<AIResponse> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a technical verification AI for yacht management. Context: ${context}. 
                   Focus on technical accuracy and safety validation.`
        },
        {
          role: 'user',
          content: `Technical verification needed: ${prompt}`
        }
      ],
      temperature: 0.2,
      max_tokens: 300
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek verification failed`);
  }

  const data = await response.json();
  return {
    provider: 'deepseek',
    response: data.choices[0].message.content,
    confidence: 0.8,
    reasoning: 'DeepSeek technical verification'
  };
}

function generateUnifiedResponse(primary: AIResponse, verifications: AIResponse[]): UnifiedResponse {
  // Calculate consensus confidence
  const allResponses = [primary, ...verifications];
  const avgConfidence = allResponses.reduce((sum, r) => sum + r.confidence, 0) / allResponses.length;
  
  // Check for major disagreements
  const verified = verifications.length === 0 || 
    verifications.every(v => !hasSignificantDisagreement(primary.response, v.response));

  // Generate consensus response
  let consensus = primary.response;
  
  if (verifications.length > 0 && !verified) {
    // If there are disagreements, create a more cautious response
    consensus = `${primary.response}\n\n[Note: Multiple AI systems provided input for accuracy]`;
  }

  return {
    primary,
    verification: verifications,
    consensus,
    confidence: avgConfidence,
    verified
  };
}

function hasSignificantDisagreement(response1: string, response2: string): boolean {
  // Simple disagreement detection based on contradictory keywords
  const contradictoryPairs = [
    ['safe', 'unsafe'],
    ['recommended', 'not recommended'],
    ['yes', 'no'],
    ['should', 'should not'],
    ['correct', 'incorrect']
  ];

  const r1Lower = response1.toLowerCase();
  const r2Lower = response2.toLowerCase();

  return contradictoryPairs.some(([word1, word2]) => 
    (r1Lower.includes(word1) && r2Lower.includes(word2)) ||
    (r1Lower.includes(word2) && r2Lower.includes(word1))
  );
}