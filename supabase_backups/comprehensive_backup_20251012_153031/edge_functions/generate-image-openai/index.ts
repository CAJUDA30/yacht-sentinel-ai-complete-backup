import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model = 'gpt-image-1', size = '1024x1024', quality = 'high', style = 'vivid' } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Generating image with OpenAI: ${model}, size: ${size}, quality: ${quality}`);

    const requestBody: any = {
      model: model,
      prompt: prompt,
      n: 1,
      size: size,
      quality: quality
    };

    // Add style for DALL-E 3
    if (model === 'dall-e-3') {
      requestBody.style = style;
    }

    // GPT Image 1 specific settings
    if (model === 'gpt-image-1') {
      requestBody.output_format = 'png';
      requestBody.background = 'auto';
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('OpenAI image generation successful');

    // For GPT Image 1, the image comes as base64 in b64_json format
    const imageData = result.data[0];
    let imageUrl;

    if (imageData.b64_json) {
      imageUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else if (imageData.url) {
      imageUrl = imageData.url;
    } else {
      throw new Error('No image data received from OpenAI');
    }

    return new Response(
      JSON.stringify({ 
        image: imageUrl,
        model: model,
        revised_prompt: imageData.revised_prompt || prompt
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});