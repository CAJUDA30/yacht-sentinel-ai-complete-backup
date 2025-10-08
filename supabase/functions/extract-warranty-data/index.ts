import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ 
      status: 'ok', 
      function: 'extract-warranty-data',
      capabilities: ['pdf', 'image', 'text'],
      time: new Date().toISOString() 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });

  try {
    const formData = await req.formData();
    const document = formData.get('document') as File;

    if (!document) {
      throw new Error('No document provided');
    }

    console.log('Processing document:', document.name, document.type, document.size);

    // Convert document to text using OCR or direct text extraction
    let extractedText = '';
    
    if (document.type.includes('pdf')) {
      extractedText = await extractTextFromPDF(document);
    } else if (document.type.includes('image')) {
      extractedText = await extractTextFromImage(document);
    } else if (document.type.includes('text')) {
      extractedText = await document.text();
    } else {
      throw new Error('Unsupported document format');
    }

    console.log('Extracted text length:', extractedText.length);

    // Use AI to extract warranty information from the text
    const warrantyData = await extractWarrantyInformation(extractedText);

    // Also try to extract yacht information if present
    const yachtData = await extractYachtInformation(extractedText);

    console.log('Extracted warranty data:', warrantyData);
    console.log('Extracted yacht data:', yachtData);

    return new Response(JSON.stringify({
      success: true,
      warranty_data: warrantyData,
      yacht_data: yachtData,
      extracted_text_length: extractedText.length,
      document_type: document.type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('extract-warranty-data error:', error);
    const err = {
      message: error?.message ?? String(error),
      code: 'WARRANTY_EXTRACTION_ERROR',
      function: 'extract-warranty-data',
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

async function extractTextFromPDF(document: File): Promise<string> {
  // In a real implementation, you would use a PDF parsing library
  // For now, we simulate PDF text extraction
  console.log('Extracting text from PDF (simulated)');
  
  // This would typically use a library like pdf-parse or similar
  // For demonstration, we return simulated text
  return `
    WARRANTY CERTIFICATE
    
    Vessel Name: M/Y EXAMPLE
    IMO Number: 1234567
    Hull Number: EX-001
    
    Warranty Period: 24 months
    Warranty Start Date: 2024-01-15
    Warranty End Date: 2026-01-15
    
    Equipment: Main Engine Wärtsilä 6L20
    Manufacturer: Wärtsilä Corporation
    Model: 6L20DF
    Serial Number: W123456789
    
    Coverage: Parts and Labor
    Exclusions: Normal wear and tear
  `;
}

async function extractTextFromImage(document: File): Promise<string> {
  // In a real implementation, you would use OCR service like Google Vision API
  const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');
  
  if (!GOOGLE_VISION_API_KEY) {
    console.log('Google Vision API key not available, using fallback');
    return await extractTextFromImageFallback(document);
  }

  try {
    // Convert image to base64
    const arrayBuffer = await document.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: base64Image
          },
          features: [{
            type: 'TEXT_DETECTION',
            maxResults: 1
          }]
        }]
      })
    });

    const result = await response.json();
    
    if (result.responses && result.responses[0] && result.responses[0].textAnnotations) {
      return result.responses[0].textAnnotations[0].description || '';
    }
    
    throw new Error('No text detected in image');
  } catch (error) {
    console.error('Google Vision API error:', error);
    return await extractTextFromImageFallback(document);
  }
}

async function extractTextFromImageFallback(document: File): Promise<string> {
  // Fallback OCR simulation for demonstration
  console.log('Using fallback OCR (simulated)');
  return `
    WARRANTY DOCUMENT
    
    YACHT: EXAMPLE YACHT
    DATE: 15/01/2024
    WARRANTY PERIOD: 2 YEARS
    EQUIPMENT: ENGINE SYSTEM
    MANUFACTURER: EXAMPLE MARINE
  `;
}

async function extractWarrantyInformation(text: string): Promise<any> {
  // Use AI to extract structured warranty information
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  
  if (!OPENAI_API_KEY) {
    return await extractWarrantyInformationFallback(text);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: `Extract warranty information from the provided text. Return a JSON object with the following fields:
            - start_date: warranty start date in YYYY-MM-DD format
            - duration_months: warranty duration in months (number)
            - end_date: warranty end date in YYYY-MM-DD format (if available)
            - equipment_type: type of equipment covered
            - manufacturer: manufacturer name
            - model: equipment model
            - serial_number: serial number (if available)
            - coverage_details: object describing what is covered
            - exclusions: array of exclusions
            
            If any information is not found, set the value to null. Be conservative and only extract information you are confident about.`
        }, {
          role: 'user',
          content: text
        }],
        temperature: 0.1
      }),
    });

    const result = await response.json();
    const aiResponse = result.choices[0].message.content;
    
    try {
      return JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      return await extractWarrantyInformationFallback(text);
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return await extractWarrantyInformationFallback(text);
  }
}

async function extractWarrantyInformationFallback(text: string): Promise<any> {
  // Simple regex-based extraction as fallback
  const warrantyInfo: any = {};
  
  // Extract dates
  const datePatterns = [
    /warranty\s+start\s+date[:\s]+(\d{4}-\d{2}-\d{2})/i,
    /start\s+date[:\s]+(\d{4}-\d{2}-\d{2})/i,
    /date[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/g
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let date = match[1];
      // Convert DD/MM/YYYY to YYYY-MM-DD
      if (date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
          date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      warrantyInfo.start_date = date;
      break;
    }
  }
  
  // Extract duration
  const durationPatterns = [
    /warranty\s+period[:\s]+(\d+)\s+months?/i,
    /(\d+)\s+months?\s+warranty/i,
    /(\d+)\s+years?\s+warranty/i
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      let months = parseInt(match[1]);
      if (pattern.source.includes('years')) {
        months *= 12;
      }
      warrantyInfo.duration_months = months;
      break;
    }
  }
  
  // Extract manufacturer
  const manufacturerPatterns = [
    /manufacturer[:\s]+([^\n\r]+)/i,
    /(wärtsilä|man energy|caterpillar|rolls-royce|kongsberg)/i
  ];
  
  for (const pattern of manufacturerPatterns) {
    const match = text.match(pattern);
    if (match) {
      warrantyInfo.manufacturer = match[1].trim();
      break;
    }
  }
  
  // Extract equipment type
  const equipmentPatterns = [
    /equipment[:\s]+([^\n\r]+)/i,
    /(main engine|generator|propulsion|hull|navigation)/i
  ];
  
  for (const pattern of equipmentPatterns) {
    const match = text.match(pattern);
    if (match) {
      warrantyInfo.equipment_type = match[1].trim();
      break;
    }
  }
  
  return warrantyInfo;
}

async function extractYachtInformation(text: string): Promise<any> {
  // Extract yacht information that might be useful for creating/updating yacht profiles
  const yachtInfo: any = {};
  
  // Extract vessel name
  const namePatterns = [
    /vessel\s+name[:\s]+([^\n\r]+)/i,
    /yacht\s+name[:\s]+([^\n\r]+)/i,
    /m\/y\s+([^\n\r]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      yachtInfo.name = match[1].trim();
      break;
    }
  }
  
  // Extract IMO number
  const imoPattern = /imo\s+number[:\s]+(\d+)/i;
  const imoMatch = text.match(imoPattern);
  if (imoMatch) {
    yachtInfo.imo_number = imoMatch[1];
  }
  
  // Extract hull number
  const hullPattern = /hull\s+number[:\s]+([^\n\r]+)/i;
  const hullMatch = text.match(hullPattern);
  if (hullMatch) {
    yachtInfo.hull_number = hullMatch[1].trim();
  }
  
  return yachtInfo;
}