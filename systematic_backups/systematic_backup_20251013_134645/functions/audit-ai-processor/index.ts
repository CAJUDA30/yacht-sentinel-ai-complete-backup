import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditAnalysisRequest {
  item_id: string;
  item_title: string;
  item_description: string;
  evaluation_type: string;
  text_comment?: string;
  voice_data?: string;
  image_data?: string;
  video_data?: string;
  has_voice?: boolean;
  has_image?: boolean;
  has_video?: boolean;
}

interface AuditInsight {
  suggested_status: 'ok' | 'ko' | 'na' | 'deferred';
  confidence_score: number;
  defects_detected: string[];
  risk_assessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
  recommendations: string[];
  compliance_notes: string[];
  ai_reasoning: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: AuditAnalysisRequest = await req.json();
    console.log('Processing audit analysis request:', request.item_title);

    // Initialize analysis result
    let analysisResult: AuditInsight = {
      suggested_status: 'ok',
      confidence_score: 0.5,
      defects_detected: [],
      risk_assessment: {
        level: 'medium',
        factors: []
      },
      recommendations: [],
      compliance_notes: [],
      ai_reasoning: ''
    };

    // Multi-modal AI processing
    if (request.has_voice && request.voice_data) {
      console.log('Processing voice input...');
      analysisResult = await processVoiceInput(request, analysisResult);
    }

    if (request.has_image && request.image_data) {
      console.log('Processing image input...');
      analysisResult = await processImageInput(request, analysisResult);
    }

    if (request.text_comment) {
      console.log('Processing text input...');
      analysisResult = await processTextInput(request, analysisResult);
    }

    // If no specific input provided, use general AI analysis
    if (!request.has_voice && !request.has_image && !request.text_comment) {
      analysisResult = await performGeneralAnalysis(request);
    }

    // Store AI insights in database
    await supabase.from('audit_ai_insights').insert({
      audit_item_id: request.item_id,
      insight_type: 'multi_modal_evaluation',
      modality: getModalityType(request),
      insight_data: analysisResult,
      confidence_score: analysisResult.confidence_score,
      ai_model: 'audit-ai-processor-v1'
    });

    console.log('Analysis complete:', analysisResult.suggested_status, 'confidence:', analysisResult.confidence_score);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in audit AI processor:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggested_status: 'deferred',
      confidence_score: 0,
      ai_reasoning: 'Error occurred during AI analysis'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processVoiceInput(request: AuditAnalysisRequest, current: AuditInsight): Promise<AuditInsight> {
  try {
    // Convert voice to text using Whisper
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'multipart/form-data',
      },
      body: createFormData(request.voice_data!, 'audio.webm', 'audio/webm'),
    });

    if (!whisperResponse.ok) {
      console.error('Whisper API error:', await whisperResponse.text());
      return current;
    }

    const transcription = await whisperResponse.json();
    const voiceText = transcription.text;
    
    console.log('Voice transcription:', voiceText);

    // Analyze transcribed text with GPT
    const analysisPrompt = `
    Analyze this audit voice note for item "${request.item_title}":
    
    Voice transcription: "${voiceText}"
    Item description: "${request.item_description}"
    Evaluation type: "${request.evaluation_type}"
    
    Provide audit evaluation with:
    1. Suggested status (ok/ko/na/deferred)
    2. Confidence score (0-1)
    3. Any defects mentioned
    4. Risk assessment
    5. Recommendations
    
    Respond in JSON format.
    `;

    const gptResponse = await callOpenAI(analysisPrompt);
    
    return {
      ...current,
      ...parseAIResponse(gptResponse, voiceText),
      confidence_score: Math.max(current.confidence_score, 0.8) // Voice input generally high confidence
    };

  } catch (error) {
    console.error('Voice processing error:', error);
    return current;
  }
}

async function processImageInput(request: AuditAnalysisRequest, current: AuditInsight): Promise<AuditInsight> {
  try {
    // Use GPT-4 Vision for image analysis
    const visionPrompt = `
    Analyze this image for audit item "${request.item_title}":
    
    Item description: "${request.item_description}"
    Evaluation type: "${request.evaluation_type}"
    
    Look for:
    - Visual defects, damage, wear
    - Safety compliance issues
    - Equipment condition
    - Environmental hazards
    - Maintenance needs
    
    Provide detailed audit evaluation in JSON format.
    `;

    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: visionPrompt },
              { 
                type: 'image_url', 
                image_url: { url: `data:image/jpeg;base64,${request.image_data}` }
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });

    if (!visionResponse.ok) {
      console.error('Vision API error:', await visionResponse.text());
      return current;
    }

    const visionResult = await visionResponse.json();
    const analysis = visionResult.choices[0].message.content;
    
    console.log('Vision analysis:', analysis);

    return {
      ...current,
      ...parseAIResponse(analysis, 'Image analysis'),
      confidence_score: Math.max(current.confidence_score, 0.9) // Visual evidence high confidence
    };

  } catch (error) {
    console.error('Image processing error:', error);
    return current;
  }
}

async function processTextInput(request: AuditAnalysisRequest, current: AuditInsight): Promise<AuditInsight> {
  try {
    const textPrompt = `
    Analyze this audit text comment for item "${request.item_title}":
    
    Comment: "${request.text_comment}"
    Item description: "${request.item_description}"
    Evaluation type: "${request.evaluation_type}"
    
    Extract audit insights and provide evaluation in JSON format.
    `;

    const response = await callOpenAI(textPrompt);
    
    return {
      ...current,
      ...parseAIResponse(response, request.text_comment!),
      confidence_score: Math.max(current.confidence_score, 0.7)
    };

  } catch (error) {
    console.error('Text processing error:', error);
    return current;
  }
}

async function performGeneralAnalysis(request: AuditAnalysisRequest): Promise<AuditInsight> {
  try {
    const generalPrompt = `
    Provide general audit guidance for item "${request.item_title}":
    
    Description: "${request.item_description}"
    Evaluation type: "${request.evaluation_type}"
    
    Generate standard audit recommendations and evaluation criteria.
    `;

    const response = await callOpenAI(generalPrompt);
    
    return {
      suggested_status: 'ok',
      confidence_score: 0.3,
      defects_detected: [],
      risk_assessment: { level: 'medium', factors: [] },
      recommendations: [],
      compliance_notes: [],
      ai_reasoning: response,
      ...parseAIResponse(response, 'General analysis')
    };

  } catch (error) {
    console.error('General analysis error:', error);
    return {
      suggested_status: 'deferred',
      confidence_score: 0,
      defects_detected: [],
      risk_assessment: { level: 'medium', factors: [] },
      recommendations: ['Manual review required'],
      compliance_notes: [],
      ai_reasoning: 'Analysis failed, manual review needed'
    };
  }
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marine audit AI assistant. Provide detailed, accurate audit evaluations in JSON format.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.1
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

function parseAIResponse(response: string, originalInput: string): Partial<AuditInsight> {
  try {
    // Try to parse JSON response
    const parsed = JSON.parse(response);
    return {
      suggested_status: parsed.suggested_status || 'ok',
      defects_detected: parsed.defects_detected || [],
      risk_assessment: parsed.risk_assessment || { level: 'medium', factors: [] },
      recommendations: parsed.recommendations || [],
      compliance_notes: parsed.compliance_notes || [],
      ai_reasoning: response
    };
  } catch (error) {
    // Fallback to text analysis if JSON parsing fails
    const lowerResponse = response.toLowerCase();
    let suggestedStatus: 'ok' | 'ko' | 'na' | 'deferred' = 'ok';
    
    if (lowerResponse.includes('fail') || lowerResponse.includes('defect') || lowerResponse.includes('damage')) {
      suggestedStatus = 'ko';
    } else if (lowerResponse.includes('not applicable') || lowerResponse.includes('n/a')) {
      suggestedStatus = 'na';
    } else if (lowerResponse.includes('defer') || lowerResponse.includes('review')) {
      suggestedStatus = 'deferred';
    }

    return {
      suggested_status: suggestedStatus,
      ai_reasoning: response
    };
  }
}

function getModalityType(request: AuditAnalysisRequest): string {
  const modalities = [];
  if (request.has_voice) modalities.push('voice');
  if (request.has_image) modalities.push('vision');
  if (request.text_comment) modalities.push('text');
  
  return modalities.length > 1 ? 'multi_modal' : modalities[0] || 'text';
}

function createFormData(base64Data: string, filename: string, mimeType: string): FormData {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const blob = new Blob([bytes], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('model', 'whisper-1');
  
  return formData;
}