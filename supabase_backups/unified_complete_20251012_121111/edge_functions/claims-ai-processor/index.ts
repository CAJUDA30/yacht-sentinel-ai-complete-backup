import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DocumentAnalysisRequest {
  imageData: string;
  documentType: 'warranty_claim' | 'repair_quote' | 'invoice' | 'compliance_certificate';
  context?: string;
}

interface QuoteComparisonRequest {
  quotes: Array<{
    id: string;
    supplier_name: string;
    total_cost: number;
    labor_cost: number;
    parts_cost: number;
    delivery_time: string;
    warranty_period: string;
    supplier_rating?: number;
  }>;
  job_context: {
    job_type: string;
    urgency: string;
    equipment_type: string;
    location: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    switch (action) {
      case 'analyze_document':
        return await analyzeDocument(data as DocumentAnalysisRequest);
      case 'compare_quotes':
        return await compareQuotes(data as QuoteComparisonRequest);
      case 'extract_warranty_info':
        return await extractWarrantyInfo(data);
      case 'compliance_check':
        return await complianceCheck(data);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Claims AI Processor Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function analyzeDocument(request: DocumentAnalysisRequest) {
  const { imageData, documentType, context } = request;
  
  const content = `Analyze this ${documentType} document and extract structured information:

${getDocumentPrompt(documentType)}

Additional context: ${context || 'None'}

Return a JSON object with the extracted information.

Image data: ${imageData}`;

  // Use Yachtie multi-AI consensus system for document analysis
  const { data: aiResult, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
    body: {
      content,
      context: `Claims & Repairs - Document Analysis: ${documentType}`,
      module: 'claims_repairs',
      action_type: 'document_analysis',
      risk_level: 'high',
      timestamp: new Date().toISOString()
    }
  });

  if (error) {
    throw new Error(`Yachtie AI error: ${error.message}`);
  }

  let extractedData;
  try {
    extractedData = typeof aiResult.consensus === 'string' ? JSON.parse(aiResult.consensus) : aiResult.consensus;
  } catch (e) {
    extractedData = { error: 'Failed to parse AI response', raw_response: aiResult.consensus };
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      extracted_data: extractedData,
      confidence: calculateConfidence(extractedData),
      processing_notes: generateProcessingNotes(documentType, extractedData)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function compareQuotes(request: QuoteComparisonRequest) {
  const { quotes, job_context } = request;
  
  const content = `Analyze and compare these quotes for a ${job_context.job_type} job:

Job Context:
- Type: ${job_context.job_type}
- Urgency: ${job_context.urgency}
- Equipment: ${job_context.equipment_type}
- Location: ${job_context.location}

Quotes:
${quotes.map((q, i) => `
Quote ${i + 1} - ${q.supplier_name}:
- Total Cost: $${q.total_cost}
- Labor: $${q.labor_cost}
- Parts: $${q.parts_cost}
- Delivery: ${q.delivery_time}
- Warranty: ${q.warranty_period}
- Supplier Rating: ${q.supplier_rating || 'N/A'}/5
`).join('\n')}

Provide a comprehensive analysis including:
1. Best value recommendation with reasoning
2. Risk assessment for each quote
3. Cost breakdown analysis
4. Timeline considerations
5. Quality and reliability factors
6. Negotiation suggestions

Return as JSON with structured recommendations.`;

  // Use Yachtie multi-AI consensus system for quote comparison
  const { data: aiResult, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
    body: {
      content,
      context: `Claims & Repairs - Quote Comparison: ${job_context.job_type}`,
      module: 'claims_repairs',
      action_type: 'quote_analysis',
      risk_level: 'medium',
      timestamp: new Date().toISOString()
    }
  });

  if (error) {
    throw new Error(`Yachtie AI error: ${error.message}`);
  }

  let analysis;
  try {
    analysis = typeof aiResult.consensus === 'string' ? JSON.parse(aiResult.consensus) : aiResult.consensus;
  } catch (e) {
    analysis = { error: 'Failed to parse AI response', raw_response: aiResult.consensus };
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      analysis,
      recommended_quote_id: analysis.best_value?.quote_id,
      cost_savings_potential: analysis.cost_optimization?.potential_savings,
      risk_level: analysis.overall_risk_assessment
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function extractWarrantyInfo(data: any) {
  const { document_text, equipment_info } = data;
  
  const content = `Extract warranty information from this document:

Document Text: ${document_text}

Equipment Info: ${JSON.stringify(equipment_info)}

Extract and return JSON with:
- warranty_start_date
- warranty_end_date
- warranty_duration_months
- coverage_details
- exclusions
- claim_process
- supplier_contact
- warranty_terms
- serial_numbers_covered
- conditions_and_limitations`;

  // Use Yachtie multi-AI consensus system for warranty extraction
  const { data: aiResult, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
    body: {
      content,
      context: 'Claims & Repairs - Warranty Information Extraction',
      module: 'claims_repairs',
      action_type: 'warranty_extraction',
      risk_level: 'high',
      timestamp: new Date().toISOString()
    }
  });

  if (error) {
    throw new Error(`Yachtie AI error: ${error.message}`);
  }

  let warrantyInfo;
  try {
    warrantyInfo = typeof aiResult.consensus === 'string' ? JSON.parse(aiResult.consensus) : aiResult.consensus;
  } catch (e) {
    warrantyInfo = { error: 'Failed to parse AI response', raw_response: aiResult.consensus };
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      warranty_info: warrantyInfo,
      validity_check: validateWarrantyInfo(warrantyInfo)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function complianceCheck(data: any) {
  const { job_details, regulations, documentation } = data;
  
  const content = `Perform compliance check for this maritime repair/warranty claim:

Job Details: ${JSON.stringify(job_details)}

Applicable Regulations: ${JSON.stringify(regulations)}

Available Documentation: ${JSON.stringify(documentation)}

Check compliance against:
- SIRE 2.0 requirements
- DNV class requirements
- ISM Code requirements
- MLC requirements
- Port State Control standards
- Flag state regulations

Return JSON with:
- compliance_status (compliant/non_compliant/pending)
- missing_requirements
- recommendations
- priority_actions
- documentation_gaps
- risk_assessment`;

  // Use Yachtie multi-AI consensus system for compliance checking
  const { data: aiResult, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
    body: {
      content,
      context: 'Claims & Repairs - Maritime Compliance Check',
      module: 'claims_repairs',
      action_type: 'compliance_analysis',
      risk_level: 'critical',
      timestamp: new Date().toISOString()
    }
  });

  if (error) {
    throw new Error(`Yachtie AI error: ${error.message}`);
  }

  let complianceResult;
  try {
    complianceResult = typeof aiResult.consensus === 'string' ? JSON.parse(aiResult.consensus) : aiResult.consensus;
  } catch (e) {
    complianceResult = { error: 'Failed to parse AI response', raw_response: aiResult.consensus };
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      compliance_result: complianceResult,
      overall_status: complianceResult.compliance_status,
      priority_level: calculatePriorityLevel(complianceResult)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function getDocumentPrompt(documentType: string): string {
  switch (documentType) {
    case 'warranty_claim':
      return `Extract: equipment_name, serial_number, model_number, purchase_date, warranty_start_date, warranty_end_date, issue_description, claim_amount, supplier_info, documentation_required`;
    case 'repair_quote':
      return `Extract: quote_number, supplier_name, total_cost, labor_cost, parts_cost, parts_list, delivery_time, warranty_period, valid_until, terms_conditions`;
    case 'invoice':
      return `Extract: invoice_number, supplier_name, total_amount, line_items, payment_terms, due_date, tax_info, purchase_order_ref`;
    case 'compliance_certificate':
      return `Extract: certificate_type, issuing_authority, valid_from, valid_until, equipment_covered, compliance_standards, inspection_date, next_inspection_due`;
    default:
      return `Extract all relevant information from this document`;
  }
}

function calculateConfidence(extractedData: any): number {
  let confidence = 0.5;
  let fieldCount = 0;
  let filledFields = 0;

  for (const [key, value] of Object.entries(extractedData)) {
    fieldCount++;
    if (value && value !== '' && value !== 'N/A' && value !== null) {
      filledFields++;
    }
  }

  if (fieldCount > 0) {
    confidence = filledFields / fieldCount;
  }

  return Math.round(confidence * 100) / 100;
}

function generateProcessingNotes(documentType: string, extractedData: any): string[] {
  const notes = [];
  
  if (documentType === 'warranty_claim') {
    if (!extractedData.warranty_end_date) {
      notes.push('Warning: Warranty end date not found - manual verification required');
    }
    if (!extractedData.serial_number) {
      notes.push('Serial number missing - may affect warranty validation');
    }
  }
  
  if (documentType === 'repair_quote') {
    if (!extractedData.valid_until) {
      notes.push('Quote validity period not specified');
    }
    if (extractedData.total_cost && extractedData.labor_cost && extractedData.parts_cost) {
      const calculatedTotal = (parseFloat(extractedData.labor_cost) || 0) + (parseFloat(extractedData.parts_cost) || 0);
      if (Math.abs(calculatedTotal - parseFloat(extractedData.total_cost)) > 1) {
        notes.push('Warning: Cost breakdown does not match total - please verify');
      }
    }
  }
  
  return notes;
}

function validateWarrantyInfo(warrantyInfo: any): { valid: boolean; issues: string[] } {
  const issues = [];
  
  if (!warrantyInfo.warranty_start_date || !warrantyInfo.warranty_end_date) {
    issues.push('Missing warranty dates');
  }
  
  if (warrantyInfo.warranty_start_date && warrantyInfo.warranty_end_date) {
    const start = new Date(warrantyInfo.warranty_start_date);
    const end = new Date(warrantyInfo.warranty_end_date);
    if (end <= start) {
      issues.push('Invalid warranty period - end date must be after start date');
    }
  }
  
  if (!warrantyInfo.coverage_details) {
    issues.push('Missing coverage details');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

function calculatePriorityLevel(complianceResult: any): 'low' | 'medium' | 'high' | 'critical' {
  if (complianceResult.compliance_status === 'non_compliant') {
    if (complianceResult.missing_requirements?.some((req: any) => req.severity === 'critical')) {
      return 'critical';
    }
    return 'high';
  }
  
  if (complianceResult.compliance_status === 'pending') {
    return 'medium';
  }
  
  return 'low';
}