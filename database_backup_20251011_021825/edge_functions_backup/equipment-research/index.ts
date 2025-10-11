import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok', function: 'equipment-research', time: new Date().toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { equipmentInfo, generateMaintenancePlan = true } = await req.json();

    // Use the multi-AI processor for equipment research
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create research prompt
    const researchPrompt = `
    Research this equipment and provide comprehensive technical information:
    
    Equipment Details:
    - Name: ${equipmentInfo.name || 'Unknown'}
    - Manufacturer: ${equipmentInfo.manufacturer || 'Unknown'}
    - Model: ${equipmentInfo.model || 'Unknown'}
    - Serial: ${equipmentInfo.serial || 'Unknown'}
    - Part Number: ${equipmentInfo.part || 'Unknown'}
    
    Please provide:
    1. Full equipment specifications and technical data
    2. Manufacturer information and contact details
    3. Expected lifespan and maintenance intervals
    4. Common failure points and preventive measures
    5. Parts availability and suppliers
    6. Safety considerations and operational guidelines
    7. Performance benchmarks and efficiency ratings
    
    Format as structured JSON with clear categories.
    `;

    const maintenancePrompt = `
    Create a comprehensive maintenance plan for this equipment:
    
    Equipment: ${equipmentInfo.name || 'Unknown equipment'}
    Manufacturer: ${equipmentInfo.manufacturer || 'Unknown'}
    Model: ${equipmentInfo.model || 'Unknown'}
    
    Generate a detailed maintenance schedule including:
    1. Daily inspection tasks
    2. Weekly maintenance procedures
    3. Monthly service requirements
    4. Quarterly maintenance tasks
    5. Annual overhaul procedures
    6. Emergency maintenance protocols
    7. Required tools and spare parts
    8. Estimated labor hours for each task
    9. Critical safety procedures
    10. Performance monitoring guidelines
    
    Format as structured JSON with task details, frequencies, and priorities.
    `;

    // Call multi-AI processor for equipment research
    const { data: researchData, error: researchError } = await supabase.functions.invoke(
      'multi-ai-processor',
      {
        body: {
          type: 'equipment_research',
          prompt: researchPrompt,
          context: `Maritime vessel equipment analysis for ${equipmentInfo.name}`,
          specialization: 'maritime_engineering'
        }
      }
    );

    if (researchError) {
      console.error('Research error:', researchError);
      throw new Error('Failed to research equipment');
    }

    let maintenanceData = null;
    if (generateMaintenancePlan) {
      const { data: maintData, error: maintError } = await supabase.functions.invoke(
        'multi-ai-processor',
        {
          body: {
            type: 'maintenance_planning',
            prompt: maintenancePrompt,
            context: `Maintenance planning for ${equipmentInfo.name}`,
            specialization: 'maintenance_engineering'
          }
        }
      );

      if (maintError) {
        console.error('Maintenance planning error:', maintError);
      } else {
        maintenanceData = maintData;
      }
    }

    // Parse and structure the AI responses
    const research = parseResearchResponse(researchData?.response || '');
    const maintenance = maintenanceData ? parseMaintenanceResponse(maintenanceData.response || '') : null;

    // Generate confidence score based on available information
    const confidenceScore = calculateConfidence(equipmentInfo, research);

    return new Response(
      JSON.stringify({
        success: true,
        confidence: confidenceScore,
        research: {
          specifications: research.specifications || {},
          manufacturer: research.manufacturer || {},
          maintenance: research.maintenance || {},
          safety: research.safety || {},
          performance: research.performance || {}
        },
        maintenancePlan: maintenance,
        recommendations: generateRecommendations(equipmentInfo, research),
        dataQuality: assessDataQuality(equipmentInfo)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in equipment-research function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseResearchResponse(response: string) {
  try {
    // Try to parse as JSON first
    return JSON.parse(response);
  } catch {
    // If not valid JSON, parse as text and structure it
    return {
      specifications: extractSection(response, 'specifications'),
      manufacturer: extractSection(response, 'manufacturer'),
      maintenance: extractSection(response, 'maintenance'),
      safety: extractSection(response, 'safety'),
      performance: extractSection(response, 'performance')
    };
  }
}

function parseMaintenanceResponse(response: string) {
  try {
    return JSON.parse(response);
  } catch {
    return {
      daily: extractTasks(response, 'daily'),
      weekly: extractTasks(response, 'weekly'),
      monthly: extractTasks(response, 'monthly'),
      quarterly: extractTasks(response, 'quarterly'),
      annual: extractTasks(response, 'annual')
    };
  }
}

function extractSection(text: string, section: string) {
  const lines = text.split('\n');
  const sectionStart = lines.findIndex(line => 
    line.toLowerCase().includes(section.toLowerCase())
  );
  
  if (sectionStart === -1) return {};
  
  const sectionLines = [];
  for (let i = sectionStart + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '' || line.match(/^\d+\./)) break;
    if (line.startsWith('-') || line.startsWith('•')) {
      sectionLines.push(line.substring(1).trim());
    }
  }
  
  return { content: sectionLines };
}

function extractTasks(text: string, frequency: string) {
  const lines = text.split('\n');
  const tasks = [];
  
  for (const line of lines) {
    if (line.toLowerCase().includes(frequency.toLowerCase())) {
      const taskMatch = line.match(/(?:•|-|\d+\.)\s*(.+)/);
      if (taskMatch) {
        tasks.push({
          task: taskMatch[1].trim(),
          frequency: frequency,
          priority: 'medium',
          estimatedHours: 1
        });
      }
    }
  }
  
  return tasks;
}

function calculateConfidence(equipmentInfo: any, research: any) {
  let score = 0;
  let maxScore = 0;
  
  // Base information availability
  if (equipmentInfo.name) { score += 10; }
  if (equipmentInfo.manufacturer) { score += 15; }
  if (equipmentInfo.model) { score += 15; }
  if (equipmentInfo.serial) { score += 10; }
  maxScore += 50;
  
  // Research quality
  if (research.specifications?.content?.length > 0) { score += 20; }
  if (research.manufacturer?.content?.length > 0) { score += 15; }
  if (research.maintenance?.content?.length > 0) { score += 15; }
  maxScore += 50;
  
  return Math.round((score / maxScore) * 100);
}

function generateRecommendations(equipmentInfo: any, research: any) {
  const recommendations = [];
  
  if (!equipmentInfo.manufacturer) {
    recommendations.push({
      type: 'data_quality',
      priority: 'high',
      message: 'Manufacturer information missing - affects maintenance planning accuracy'
    });
  }
  
  if (!equipmentInfo.model) {
    recommendations.push({
      type: 'data_quality',
      priority: 'medium',
      message: 'Model number missing - may limit specific maintenance procedures'
    });
  }
  
  recommendations.push({
    type: 'maintenance',
    priority: 'medium',
    message: 'Implement regular inspection schedule based on manufacturer recommendations'
  });
  
  return recommendations;
}

function assessDataQuality(equipmentInfo: any) {
  const completeness = Object.values(equipmentInfo).filter(v => v && v !== 'Unknown').length;
  const totalFields = Object.keys(equipmentInfo).length;
  
  return {
    completeness: Math.round((completeness / totalFields) * 100),
    missingCritical: !equipmentInfo.manufacturer || !equipmentInfo.model,
    suggestions: [
      'Take additional photos of equipment nameplates',
      'Check equipment documentation for missing details',
      'Contact manufacturer for technical specifications'
    ]
  };
}