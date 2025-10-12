import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'voice-assistant', time: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { text, voice = "Aria", action = "speak" } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (action === "speak") {
      // Text-to-Speech using ElevenLabs
      const voiceId = getVoiceId(voice);
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.5,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

      return new Response(
        JSON.stringify({ 
          success: true, 
          audioContent: base64Audio,
          contentType: 'audio/mpeg'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Voice assistant error:', error);
    const err = {
      message: error?.message ?? String(error),
      code: 'VOICE_ASSISTANT_ERROR',
      function: 'voice-assistant',
      requestId: (globalThis as any).crypto?.randomUUID?.(),
      timestamp: new Date().toISOString(),
    };
    const status = typeof error?.status === 'number' ? error.status : 500;
    return new Response(
      JSON.stringify({ error: err }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getVoiceId(voiceName: string): string {
  const voices: Record<string, string> = {
    'Aria': '9BWtsMINqrJLrRacOk9x',
    'Roger': 'CwhRBWXzGAHq8TQ4Fs17',
    'Sarah': 'EXAVITQu4vr4xnSDxMaL',
    'Laura': 'FGY2WhTYpPnrIDTdsKH5',
    'Charlie': 'IKne3meq5aSn9XLyUdCD',
    'George': 'JBFqnCBsd6RMkjVDRZzb',
    'Callum': 'N2lVS1w4EtoT3dr4eOWO',
    'River': 'SAz9YHcvj6GT2YYXdXww',
    'Liam': 'TX3LPaxmHKxFdv7VOQHJ',
    'Charlotte': 'XB0fDUnXU5powFXDhCwa',
    'Alice': 'Xb7hH8MSUJpSbSDYk0k2',
    'Matilda': 'XrExE9yKIg1WjnnlVkGX',
    'Will': 'bIHbv24MWmeRgasZH58o',
    'Jessica': 'cgSgspJ2msm6clMCkdW9',
    'Eric': 'cjVigY5qzO86Huf0OWal',
    'Chris': 'iP95p4xoKVk53GoZ742B',
    'Brian': 'nPczCjzI2devNBz1zQrb',
    'Daniel': 'onwK4e9ZLuTAKqWW03F9',
    'Lily': 'pFZP5JQG7iQjIQuC4Bku',
    'Bill': 'pqHfZKP75CvOlQylNhV4'
  };
  
  return voices[voiceName] || voices['Aria'];
}