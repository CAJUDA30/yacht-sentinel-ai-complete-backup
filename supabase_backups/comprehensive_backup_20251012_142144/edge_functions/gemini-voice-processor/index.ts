import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceRequest {
  type: 'speech-to-text' | 'text-to-speech' | 'voice-analysis';
  content: string; // Base64 audio for STT, text for TTS
  voice?: string; // Voice selection for TTS
  language?: string; // Language code
  config?: {
    enhance_speech?: boolean;
    noise_reduction?: boolean;
    speaker_diarization?: boolean;
    maritime_terminology?: boolean;
  };
}

interface VoiceResponse {
  success: boolean;
  text?: string; // For STT
  audioContent?: string; // For TTS (base64)
  analysis?: {
    confidence: number;
    language_detected: string;
    speaker_count?: number;
    emotional_tone?: string;
    maritime_context_detected?: boolean;
  };
  error?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      function: 'gemini-voice-processor',
      capabilities: ['speech_to_text', 'text_to_speech', 'voice_analysis', 'maritime_context'],
      time: new Date().toISOString() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const request: VoiceRequest = await req.json();
    console.log(`Processing voice request: ${request.type}`);

    let result: VoiceResponse;

    switch (request.type) {
      case 'speech-to-text':
        result = await processSpeechToText(request);
        break;
      case 'text-to-speech':
        result = await processTextToSpeech(request);
        break;
      case 'voice-analysis':
        result = await processVoiceAnalysis(request);
        break;
      default:
        throw new Error(`Unsupported voice processing type: ${request.type}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Voice processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Voice processing failed'
    } as VoiceResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processSpeechToText(request: VoiceRequest): Promise<VoiceResponse> {
  // Option 1: Use Google Cloud Speech-to-Text API (preferred for Gemini ecosystem)
  const speechApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  
  if (speechApiKey && Deno.env.get('GOOGLE_CLOUD_PROJECT_ID')) {
    try {
      return await processWithGoogleSpeech(request, speechApiKey);
    } catch (error) {
      console.error('Google Speech-to-Text failed, trying fallback:', error);
    }
  }

  // Option 2: Fallback to OpenAI Whisper if available
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      return await processWithWhisper(request, openaiKey);
    } catch (error) {
      console.error('Whisper fallback failed:', error);
    }
  }

  // Option 3: Use Gemini with audio analysis (experimental)
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (geminiKey) {
    try {
      return await processWithGeminiAudio(request, geminiKey);
    } catch (error) {
      console.error('Gemini audio processing failed:', error);
    }
  }

  throw new Error('No speech-to-text service available. Please configure Google Cloud Speech-to-Text, OpenAI Whisper, or Gemini API keys.');
}

async function processWithGoogleSpeech(request: VoiceRequest, apiKey: string): Promise<VoiceResponse> {
  const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID');
  const endpoint = `https://speech.googleapis.com/v1/speech:recognize`;

  const config = {
    encoding: 'WEBM_OPUS', // Common for web audio
    sampleRateHertz: 16000,
    languageCode: request.language || 'en-US',
    enableAutomaticPunctuation: true,
    enableWordTimeOffsets: true,
    model: 'latest_short', // Best for short audio clips
    useEnhanced: true,
    ...(request.config?.maritime_terminology && {
      speechContexts: [{
        phrases: [
          'starboard', 'port', 'bow', 'stern', 'galley', 'bridge', 'engine room',
          'anchor', 'dock', 'marina', 'captain', 'crew', 'navigation', 'radar',
          'GPS', 'autopilot', 'hull', 'deck', 'cabin', 'yacht', 'vessel'
        ]
      }]
    })
  };

  const requestBody = {
    config,
    audio: {
      content: request.content
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Speech API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    throw new Error('No speech detected in audio');
  }

  const bestResult = data.results[0];
  const transcript = bestResult.alternatives[0].transcript;
  const confidence = bestResult.alternatives[0].confidence || 0.8;

  return {
    success: true,
    text: transcript,
    analysis: {
      confidence,
      language_detected: request.language || 'en-US',
      maritime_context_detected: detectMaritimeContext(transcript)
    }
  };
}

async function processWithWhisper(request: VoiceRequest, apiKey: string): Promise<VoiceResponse> {
  // Convert base64 to blob for Whisper API
  const audioData = atob(request.content);
  const audioArray = new Uint8Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    audioArray[i] = audioData.charCodeAt(i);
  }
  const audioBlob = new Blob([audioArray], { type: 'audio/webm' });

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  if (request.language) {
    formData.append('language', request.language.split('-')[0]); // Whisper uses 2-letter codes
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    success: true,
    text: data.text,
    analysis: {
      confidence: 0.9, // Whisper generally high confidence
      language_detected: request.language || 'en-US',
      maritime_context_detected: detectMaritimeContext(data.text)
    }
  };
}

async function processWithGeminiAudio(request: VoiceRequest, apiKey: string): Promise<VoiceResponse> {
  // Note: Gemini doesn't directly support audio transcription yet
  // This is a placeholder for future audio capabilities
  throw new Error('Gemini direct audio processing not yet available. Please use Google Cloud Speech-to-Text.');
}

async function processTextToSpeech(request: VoiceRequest): Promise<VoiceResponse> {
  // Option 1: Use Google Cloud Text-to-Speech API (preferred)
  const speechApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  
  if (speechApiKey) {
    try {
      return await processWithGoogleTTS(request, speechApiKey);
    } catch (error) {
      console.error('Google TTS failed, trying fallback:', error);
    }
  }

  // Option 2: Fallback to OpenAI TTS if available
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    try {
      return await processWithOpenAITTS(request, openaiKey);
    } catch (error) {
      console.error('OpenAI TTS fallback failed:', error);
    }
  }

  throw new Error('No text-to-speech service available. Please configure Google Cloud TTS or OpenAI TTS API keys.');
}

async function processWithGoogleTTS(request: VoiceRequest, apiKey: string): Promise<VoiceResponse> {
  const endpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';

  const requestBody = {
    input: { text: request.content },
    voice: {
      languageCode: request.language || 'en-US',
      name: request.voice || 'en-US-Studio-O', // Professional voice
      ssmlGender: 'NEUTRAL'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 0.0
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    success: true,
    audioContent: data.audioContent,
    analysis: {
      confidence: 1.0,
      language_detected: request.language || 'en-US'
    }
  };
}

async function processWithOpenAITTS(request: VoiceRequest, apiKey: string): Promise<VoiceResponse> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: request.content,
      voice: request.voice || 'nova'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI TTS API error: ${response.status} - ${errorText}`);
  }

  // Convert response to base64
  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

  return {
    success: true,
    audioContent: audioBase64,
    analysis: {
      confidence: 1.0,
      language_detected: request.language || 'en-US'
    }
  };
}

async function processVoiceAnalysis(request: VoiceRequest): Promise<VoiceResponse> {
  // Use Gemini for voice analysis and context understanding
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) {
    throw new Error('Gemini API key required for voice analysis');
  }

  // First transcribe the audio
  const transcriptionResult = await processSpeechToText({
    ...request,
    type: 'speech-to-text'
  });

  if (!transcriptionResult.success || !transcriptionResult.text) {
    throw new Error('Failed to transcribe audio for analysis');
  }

  // Then analyze with Gemini
  const analysisPrompt = `
  Analyze this voice transcription for a yacht management context:
  
  Text: "${transcriptionResult.text}"
  
  Provide analysis including:
  1. Emotional tone (calm, urgent, frustrated, excited, etc.)
  2. Intent detection (request, complaint, emergency, information, etc.)
  3. Maritime terminology usage
  4. Confidence in transcription accuracy
  5. Suggested response approach
  
  Format as JSON with the following structure:
  {
    "emotional_tone": "tone_description",
    "intent": "detected_intent",
    "maritime_context": true/false,
    "transcription_confidence": 0.0-1.0,
    "suggested_response": "approach_description",
    "key_entities": ["entity1", "entity2"],
    "urgency_level": "low|medium|high|critical"
  }
  `;

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiKey
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: analysisPrompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini analysis error: ${response.status}`);
  }

  const data = await response.json();
  const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  
  let analysis;
  try {
    analysis = JSON.parse(analysisText);
  } catch {
    // Fallback analysis
    analysis = {
      emotional_tone: 'neutral',
      intent: 'general_inquiry',
      maritime_context: detectMaritimeContext(transcriptionResult.text),
      transcription_confidence: transcriptionResult.analysis?.confidence || 0.8,
      suggested_response: 'standard_helpful_response',
      key_entities: [],
      urgency_level: 'low'
    };
  }

  return {
    success: true,
    text: transcriptionResult.text,
    analysis: {
      confidence: transcriptionResult.analysis?.confidence || 0.8,
      language_detected: transcriptionResult.analysis?.language_detected || 'en-US',
      emotional_tone: analysis.emotional_tone,
      maritime_context_detected: analysis.maritime_context,
      ...analysis
    }
  };
}

function detectMaritimeContext(text: string): boolean {
  const maritimeTerms = [
    'yacht', 'boat', 'vessel', 'ship', 'marine', 'nautical', 'sailing',
    'anchor', 'dock', 'marina', 'port', 'starboard', 'bow', 'stern',
    'captain', 'crew', 'navigation', 'radar', 'gps', 'engine', 'hull',
    'deck', 'cabin', 'galley', 'bridge', 'autopilot', 'mooring'
  ];
  
  const lowerText = text.toLowerCase();
  return maritimeTerms.some(term => lowerText.includes(term));
}