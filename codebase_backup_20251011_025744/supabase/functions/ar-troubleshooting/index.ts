import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ARRequest {
  action: 'start_session' | 'get_equipment' | 'get_anchors' | 'predict_maintenance' | 'update_session' | 
          'get_predictions' | 'create_work_order' | 'get_instructions' | 'analyze_sensor_data';
  yacht_id?: string;
  equipment_id?: string;
  session_id?: string;
  user_id?: string;
  issue_description?: string;
  sensor_data?: any;
  position?: { x: number; y: number; z: number };
  data?: any;
}

interface ARResponse {
  success: boolean;
  session_id?: string;
  equipment?: any[];
  anchors?: any[];
  predictions?: any[];
  instructions?: any[];
  work_order_id?: string;
  health_score?: number;
  recommendations?: any[];
  error?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ARRequest = await req.json();
    console.log(`🥽 AR operation: ${request.action}`);

    let result: ARResponse;

    switch (request.action) {
      case 'start_session':
        result = await startTroubleshootingSession(request);
        break;
      case 'get_equipment':
        result = await getEquipmentData(request);
        break;
      case 'get_anchors':
        result = await getARAnchors(request);
        break;
      case 'predict_maintenance':
        result = await generateMaintenancePredictions(request);
        break;
      case 'update_session':
        result = await updateTroubleshootingSession(request);
        break;
      case 'get_predictions':
        result = await getMaintenancePredictions(request);
        break;
      case 'create_work_order':
        result = await createWorkOrder(request);
        break;
      case 'get_instructions':
        result = await getTroubleshootingInstructions(request);
        break;
      case 'analyze_sensor_data':
        result = await analyzeSensorData(request);
        break;
      default:
        throw new Error(`Unsupported AR action: ${request.action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 AR operation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'AR operation failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function startTroubleshootingSession(request: ARRequest): Promise<ARResponse> {
  const { yacht_id, equipment_id, user_id, issue_description } = request;

  if (!yacht_id || !user_id) {
    throw new Error('Yacht ID and user ID are required');
  }

  console.log(`🚀 Starting AR troubleshooting session for yacht ${yacht_id}`);

  // Create new AR troubleshooting session
  const { data: session, error } = await supabase
    .from('ar_troubleshooting_sessions')
    .insert({
      user_id,
      yacht_id,
      equipment_id,
      session_type: equipment_id ? 'troubleshooting' : 'guided_inspection',
      reported_issue: issue_description,
      issue_severity: await classifyIssueSeverity(issue_description),
      ar_device_info: request.data?.device_info || {},
      current_step: 1,
      total_steps: await calculateTotalSteps(equipment_id, issue_description)
    })
    .select()
    .single();

  if (error) throw error;

  // Get relevant equipment and AR anchors
  const [equipmentData, anchorsData] = await Promise.all([
    getEquipmentForSession(yacht_id, equipment_id),
    getARAnchorsForSession(yacht_id, equipment_id)
  ]);

  return {
    success: true,
    session_id: session.id,
    equipment: equipmentData,
    anchors: anchorsData
  };
}

async function getEquipmentData(request: ARRequest): Promise<ARResponse> {
  const { yacht_id, equipment_id } = request;

  if (!yacht_id) {
    throw new Error('Yacht ID is required');
  }

  console.log(`⚙️ Getting equipment data for yacht ${yacht_id}`);

  let query = supabase
    .from('equipment_systems')
    .select(`
      *,
      recent_predictions:maintenance_predictions!inner(
        prediction_type,
        risk_level,
        confidence_score,
        recommended_action,
        predicted_failure_date
      )
    `)
    .eq('yacht_id', yacht_id)
    .eq('monitoring_enabled', true)
    .order('criticality_level', { ascending: false });

  if (equipment_id) {
    query = query.eq('id', equipment_id);
  }

  const { data: equipment, error } = await query.limit(50);

  if (error) throw error;

  // Calculate health scores for equipment
  const equipmentWithHealth = await Promise.all(
    equipment.map(async (eq) => ({
      ...eq,
      health_score: await calculateHealthScore(eq.id),
      ar_available: !!eq.ar_model_url,
      instructions_available: !!eq.ar_instructions_url
    }))
  );

  return {
    success: true,
    equipment: equipmentWithHealth
  };
}

async function getARAnchors(request: ARRequest): Promise<ARResponse> {
  const { yacht_id, equipment_id, position } = request;

  if (!yacht_id) {
    throw new Error('Yacht ID is required');
  }

  console.log(`📍 Getting AR anchors for yacht ${yacht_id}`);

  let query = supabase
    .from('ar_spatial_anchors')
    .select('*')
    .eq('yacht_id', yacht_id)
    .eq('is_visible', true)
    .order('anchor_type');

  if (equipment_id) {
    query = query.eq('equipment_id', equipment_id);
  }

  const { data: anchors, error } = await query;

  if (error) throw error;

  // Filter anchors by proximity if position is provided
  let filteredAnchors = anchors;
  if (position && anchors) {
    filteredAnchors = anchors.filter(anchor => {
      const distance = calculateDistance3D(
        position,
        { x: anchor.position_x, y: anchor.position_y, z: anchor.position_z }
      );
      return distance <= 10; // 10 meter radius
    });
  }

  return {
    success: true,
    anchors: filteredAnchors
  };
}

async function generateMaintenancePredictions(request: ARRequest): Promise<ARResponse> {
  const { equipment_id, sensor_data } = request;

  if (!equipment_id) {
    throw new Error('Equipment ID is required');
  }

  console.log(`🔮 Generating maintenance predictions for equipment ${equipment_id}`);

  // Get equipment details and specifications
  const { data: equipment, error: equipmentError } = await supabase
    .from('equipment_systems')
    .select('*')
    .eq('id', equipment_id)
    .single();

  if (equipmentError) throw equipmentError;

  // Get applicable predictive models
  const { data: models } = await supabase
    .from('predictive_models')
    .select('*')
    .contains('equipment_types', [equipment.equipment_type])
    .eq('deployment_status', 'production')
    .order('accuracy_score', { ascending: false });

  const predictions = [];

  // Generate predictions using available models
  for (const model of models || []) {
    try {
      const prediction = await runPredictiveModel(model, equipment, sensor_data);
      if (prediction.confidence_score >= model.prediction_confidence_threshold) {
        predictions.push(prediction);
      }
    } catch (error) {
      console.error(`Model ${model.model_name} failed:`, error);
    }
  }

  // Store predictions in database
  if (predictions.length > 0) {
    for (const prediction of predictions) {
      await supabase
        .from('maintenance_predictions')
        .insert({
          equipment_id,
          model_id: prediction.model_id,
          prediction_type: prediction.type,
          prediction_category: prediction.category,
          risk_level: prediction.risk_level,
          confidence_score: prediction.confidence_score,
          probability_of_failure: prediction.probability_of_failure,
          predicted_failure_date: prediction.predicted_failure_date,
          remaining_useful_life_days: prediction.remaining_useful_life_days,
          recommended_action: prediction.recommended_action,
          estimated_repair_cost: prediction.estimated_repair_cost,
          urgency_level: prediction.urgency_level,
          input_data: sensor_data,
          model_output: prediction.model_output
        });
    }
  }

  return {
    success: true,
    predictions
  };
}

async function updateTroubleshootingSession(request: ARRequest): Promise<ARResponse> {
  const { session_id, data } = request;

  if (!session_id) {
    throw new Error('Session ID is required');
  }

  console.log(`📝 Updating AR session ${session_id}`);

  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  // Handle different types of updates
  if (data.step_completed) {
    updateData.current_step = data.current_step + 1;
    updateData.steps_completed = data.steps_completed + 1;
    
    // Add to step history
    const { data: session } = await supabase
      .from('ar_troubleshooting_sessions')
      .select('step_history')
      .eq('id', session_id)
      .single();

    const stepHistory = session?.step_history || [];
    stepHistory.push({
      step: data.current_step,
      completed_at: new Date().toISOString(),
      duration_seconds: data.step_duration || 0,
      success: true
    });
    updateData.step_history = stepHistory;
  }

  if (data.diagnostic_result) {
    updateData.diagnostic_results = data.diagnostic_result;
  }

  if (data.photos_taken) {
    updateData.photos_taken = data.photos_taken;
  }

  if (data.issue_resolved !== undefined) {
    updateData.issue_resolved = data.issue_resolved;
    updateData.session_status = data.issue_resolved ? 'completed' : 'failed';
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('ar_troubleshooting_sessions')
    .update(updateData)
    .eq('id', session_id);

  if (error) throw error;

  return {
    success: true
  };
}

async function getMaintenancePredictions(request: ARRequest): Promise<ARResponse> {
  const { yacht_id, equipment_id } = request;

  if (!yacht_id) {
    throw new Error('Yacht ID is required');
  }

  console.log(`📊 Getting maintenance predictions for yacht ${yacht_id}`);

  let query = supabase
    .from('maintenance_predictions')
    .select(`
      *,
      equipment:equipment_systems!inner(
        yacht_id,
        equipment_name,
        equipment_type,
        location_description
      )
    `)
    .eq('equipment.yacht_id', yacht_id)
    .eq('alert_status', 'active')
    .gte('confidence_score', 0.7)
    .order('risk_level', { ascending: false })
    .order('confidence_score', { ascending: false });

  if (equipment_id) {
    query = query.eq('equipment_id', equipment_id);
  }

  const { data: predictions, error } = await query.limit(100);

  if (error) throw error;

  return {
    success: true,
    predictions: predictions || []
  };
}

async function createWorkOrder(request: ARRequest): Promise<ARResponse> {
  const { yacht_id, equipment_id, data } = request;

  if (!yacht_id || !equipment_id) {
    throw new Error('Yacht ID and equipment ID are required');
  }

  console.log(`📝 Creating work order for equipment ${equipment_id}`);

  // Generate work order number
  const workOrderNumber = `WO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data: workOrder, error } = await supabase
    .from('maintenance_work_orders')
    .insert({
      yacht_id,
      equipment_id,
      prediction_id: data.prediction_id,
      work_order_number: workOrderNumber,
      work_order_type: data.work_order_type || 'predictive',
      priority: data.priority || 'medium',
      title: data.title,
      description: data.description,
      detailed_instructions: data.instructions,
      safety_precautions: data.safety_precautions || [],
      required_tools: data.required_tools || [],
      required_parts: data.required_parts || [],
      estimated_duration_hours: data.estimated_duration_hours,
      required_skill_level: data.required_skill_level || 'intermediate',
      estimated_cost: data.estimated_cost,
      ar_instructions_available: !!data.ar_instructions,
      created_by: data.created_by
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    work_order_id: workOrder.id
  };
}

async function getTroubleshootingInstructions(request: ARRequest): Promise<ARResponse> {
  const { equipment_id, issue_description } = request;

  if (!equipment_id) {
    throw new Error('Equipment ID is required');
  }

  console.log(`📖 Getting troubleshooting instructions for equipment ${equipment_id}`);

  // Get equipment details
  const { data: equipment } = await supabase
    .from('equipment_systems')
    .select('*')
    .eq('id', equipment_id)
    .single();

  if (!equipment) throw new Error('Equipment not found');

  // Generate step-by-step instructions based on equipment type and issue
  const instructions = await generateTroubleshootingSteps(equipment, issue_description);

  return {
    success: true,
    instructions
  };
}

async function analyzeSensorData(request: ARRequest): Promise<ARResponse> {
  const { equipment_id, sensor_data } = request;

  if (!equipment_id || !sensor_data) {
    throw new Error('Equipment ID and sensor data are required');
  }

  console.log(`📈 Analyzing sensor data for equipment ${equipment_id}`);

  // Store sensor data
  const sensorInserts = Object.entries(sensor_data).map(([sensor_type, value]) => ({
    equipment_id,
    sensor_type,
    measurement_unit: getSensorUnit(sensor_type),
    value: parseFloat(value as string),
    recorded_at: new Date().toISOString()
  }));

  await supabase
    .from('equipment_sensor_data')
    .insert(sensorInserts);

  // Analyze for anomalies
  const anomalies = await detectAnomalies(equipment_id, sensor_data);

  // Calculate health score
  const health_score = await calculateHealthScore(equipment_id);

  // Generate recommendations if needed
  const recommendations = [];
  if (anomalies.length > 0 || health_score < 70) {
    recommendations.push(...await generateRecommendationsFromAnalysis(equipment_id, anomalies, health_score));
  }

  return {
    success: true,
    health_score,
    anomalies,
    recommendations
  };
}

// Helper functions

async function classifyIssueSeverity(description?: string): Promise<string> {
  if (!description) return 'medium';
  
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes('emergency') || lowerDesc.includes('critical') || lowerDesc.includes('fire') || lowerDesc.includes('flood')) {
    return 'critical';
  } else if (lowerDesc.includes('urgent') || lowerDesc.includes('high') || lowerDesc.includes('immediate')) {
    return 'high';
  } else if (lowerDesc.includes('minor') || lowerDesc.includes('low')) {
    return 'low';
  }
  return 'medium';
}

async function calculateTotalSteps(equipmentId?: string, issue?: string): Promise<number> {
  // Basic estimation - would be more sophisticated in real implementation
  if (equipmentId) {
    return 8; // Detailed troubleshooting
  } else {
    return 5; // General inspection
  }
}

async function getEquipmentForSession(yachtId: string, equipmentId?: string) {
  let query = supabase
    .from('equipment_systems')
    .select('*')
    .eq('yacht_id', yachtId)
    .eq('monitoring_enabled', true);

  if (equipmentId) {
    query = query.eq('id', equipmentId);
  }

  const { data } = await query.limit(10);
  return data || [];
}

async function getARAnchorsForSession(yachtId: string, equipmentId?: string) {
  let query = supabase
    .from('ar_spatial_anchors')
    .select('*')
    .eq('yacht_id', yachtId)
    .eq('is_visible', true);

  if (equipmentId) {
    query = query.eq('equipment_id', equipmentId);
  }

  const { data } = await query.limit(20);
  return data || [];
}

function calculateDistance3D(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
  return Math.sqrt(
    Math.pow(pos2.x - pos1.x, 2) +
    Math.pow(pos2.y - pos1.y, 2) +
    Math.pow(pos2.z - pos1.z, 2)
  );
}

async function calculateHealthScore(equipmentId: string): Promise<number> {
  // Use the database function
  const { data, error } = await supabase.rpc('calculate_equipment_health_score', {
    p_equipment_id: equipmentId
  });

  if (error) {
    console.error('Health score calculation error:', error);
    return 50; // Default fallback
  }

  return data || 50;
}

async function runPredictiveModel(model: any, equipment: any, sensorData: any) {
  // This would integrate with actual ML models
  // For now, simulate predictions based on rules
  
  const mockPrediction = {
    model_id: model.id,
    type: 'maintenance_due',
    category: 'predictive',
    risk_level: 'medium',
    confidence_score: 0.85,
    probability_of_failure: 0.3,
    predicted_failure_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remaining_useful_life_days: 30,
    recommended_action: 'Schedule preventive maintenance inspection',
    estimated_repair_cost: 500,
    urgency_level: 'medium',
    model_output: {
      features: sensorData,
      prediction_confidence: 0.85,
      contributing_factors: ['operating_hours', 'temperature_variance']
    }
  };

  return mockPrediction;
}

async function generateTroubleshootingSteps(equipment: any, issue?: string) {
  // Generate context-aware troubleshooting steps
  const baseSteps = [
    {
      step: 1,
      title: 'Safety Check',
      description: 'Ensure all safety protocols are followed',
      ar_overlay: 'safety_indicators',
      estimated_duration: 2
    },
    {
      step: 2,
      title: 'Visual Inspection',
      description: 'Perform visual inspection of the equipment',
      ar_overlay: 'inspection_points',
      estimated_duration: 5
    },
    {
      step: 3,
      title: 'Component Check',
      description: 'Check individual components and connections',
      ar_overlay: 'component_highlights',
      estimated_duration: 10
    }
  ];

  // Add equipment-specific steps based on type
  if (equipment.equipment_type === 'engine') {
    baseSteps.push({
      step: 4,
      title: 'Fluid Levels',
      description: 'Check oil, coolant, and other fluid levels',
      ar_overlay: 'fluid_indicators',
      estimated_duration: 5
    });
  }

  return baseSteps;
}

async function detectAnomalies(equipmentId: string, sensorData: any) {
  // Simple anomaly detection - would use ML models in production
  const anomalies = [];

  for (const [sensor, value] of Object.entries(sensorData)) {
    const numValue = parseFloat(value as string);
    
    // Basic threshold-based detection
    if (sensor.includes('temperature') && numValue > 85) {
      anomalies.push({
        sensor,
        value: numValue,
        type: 'high_temperature',
        severity: 'warning'
      });
    }
    
    if (sensor.includes('pressure') && numValue < 10) {
      anomalies.push({
        sensor,
        value: numValue,
        type: 'low_pressure',
        severity: 'warning'
      });
    }
  }

  return anomalies;
}

async function generateRecommendationsFromAnalysis(equipmentId: string, anomalies: any[], healthScore: number) {
  const recommendations = [];

  if (healthScore < 50) {
    recommendations.push({
      type: 'immediate_inspection',
      description: 'Equipment health score is critically low - immediate inspection recommended',
      priority: 'high'
    });
  }

  if (anomalies.length > 0) {
    recommendations.push({
      type: 'anomaly_investigation',
      description: `${anomalies.length} anomalies detected - investigate and address issues`,
      priority: 'medium'
    });
  }

  return recommendations;
}

function getSensorUnit(sensorType: string): string {
  const unitMap: Record<string, string> = {
    temperature: '°C',
    pressure: 'bar',
    vibration: 'Hz',
    current: 'A',
    voltage: 'V',
    speed: 'RPM',
    flow: 'L/min'
  };

  for (const [type, unit] of Object.entries(unitMap)) {
    if (sensorType.toLowerCase().includes(type)) {
      return unit;
    }
  }

  return 'units';
}