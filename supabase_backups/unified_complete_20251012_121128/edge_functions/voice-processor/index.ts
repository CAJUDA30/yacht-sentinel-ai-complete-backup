import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceRequest {
  type: 'speech-to-text' | 'text-to-speech';
  content: string;
  voice?: string;
  language?: string;
  context?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'voice-processor', time: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  try {
    const { type, content, voice = 'alloy', language = 'en', context }: VoiceRequest = await req.json();
    
    console.log(`Voice processing: ${type}`);

    if (type === 'speech-to-text') {
      return await speechToText(content);
    } else if (type === 'text-to-speech') {
      return await textToSpeech(content, voice);
    } else {
      throw new Error('Invalid voice processing type');
    }

  } catch (error: any) {
    console.error('Voice processing error:', error);
    const err = {
      message: error?.message ?? String(error),
      code: 'VOICE_PROCESSOR_ERROR',
      function: 'voice-processor',
      requestId: (globalThis as any).crypto?.randomUUID?.(),
      timestamp: new Date().toISOString(),
    };
    const status = typeof error?.status === 'number' ? error.status : 500;
    return new Response(JSON.stringify({ error: err }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function speechToText(audioBase64: string) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OpenAI API key not configured');

  // Process base64 audio in chunks to prevent memory issues
  function processBase64Chunks(base64String: string, chunkSize = 32768) {
    const chunks: Uint8Array[] = [];
    let position = 0;
    
    while (position < base64String.length) {
      const chunk = base64String.slice(position, position + chunkSize);
      const binaryChunk = atob(chunk);
      const bytes = new Uint8Array(binaryChunk.length);
      
      for (let i = 0; i < binaryChunk.length; i++) {
        bytes[i] = binaryChunk.charCodeAt(i);
      }
      
      chunks.push(bytes);
      position += chunkSize;
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  const binaryAudio = processBase64Chunks(audioBase64);
  
  const formData = new FormData();
  const blob = new Blob([binaryAudio], { type: 'audio/webm' });
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();

  // Process transcription with AI for better understanding
  const supa = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
  const { data: aiResults, error: aiError } = await supa.functions.invoke('multi-ai-processor', {
    body: {
      type: 'voice',
      content: result.text,
      context: 'voice command processing'
    }
  });

  if (aiError) {
    throw aiError;
  }

  return new Response(JSON.stringify({
    text: result.text,
    aiInterpretation: aiResults.consensus,
    confidence: aiResults.confidence,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function textToSpeech(text: string, voice: string) {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate speech');
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64Audio = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer))
  );

  return new Response(JSON.stringify({
    audioContent: base64Audio,
    voice: voice,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}