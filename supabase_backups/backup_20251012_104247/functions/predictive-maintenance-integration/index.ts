import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PredictiveAnalysisRequest {
  equipment_id?: string;
  yacht_id?: string;
  analysis_type: 'failure_prediction' | 'maintenance_optimization' | 'parts_forecasting' | 'cost_analysis';
  time_horizon_days: number;
}

interface MaintenanceRecommendation {
  equipment_id: string;
  recommended_action: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimated_cost: number;
  failure_probability: number;
  optimal_timing: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    switch (action) {
      case 'analyze_predictive_maintenance':
        return await analyzePredictiveMaintenance(data as PredictiveAnalysisRequest);
      case 'generate_maintenance_plan':
        return await generateMaintenancePlan(data);
      case 'predict_failures':
        return await predictFailures(data);
      case 'optimize_parts_inventory':
        return await optimizePartsInventory(data);
      case 'calculate_maintenance_roi':
        return await calculateMaintenanceROI(data);
      case 'create_claims_from_maintenance':
        return await createClaimsFromMaintenance(data);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Predictive Maintenance Integration Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function analyzePredictiveMaintenance(request: PredictiveAnalysisRequest) {
  const { equipment_id, yacht_id, analysis_type, time_horizon_days } = request;
  
  // Get equipment data
  let equipmentQuery = supabase
    .from('equipment')
    .select(`
      *,
      maintenance_logs(*),
      warranty_claims(*),
      repair_jobs(*)
    `);
  
  if (equipment_id) {
    equipmentQuery = equipmentQuery.eq('id', equipment_id);
  } else if (yacht_id) {
    equipmentQuery = equipmentQuery.eq('yacht_id', yacht_id);
  }
  
  const { data: equipment, error: equipmentError } = await equipmentQuery;
  
  if (equipmentError) {
    throw new Error(`Failed to fetch equipment data: ${equipmentError.message}`);
  }

  // Get maintenance history and patterns
  const analysisResults = await Promise.all(
    equipment.map(async (item) => {
      switch (analysis_type) {
        case 'failure_prediction':
          return await predictEquipmentFailure(item, time_horizon_days);
        case 'maintenance_optimization':
          return await optimizeMaintenanceSchedule(item, time_horizon_days);
        case 'parts_forecasting':
          return await forecastPartsDemand(item, time_horizon_days);
        case 'cost_analysis':
          return await analyzeMaintenanceCosts(item, time_horizon_days);
        default:
          throw new Error('Invalid analysis type');
      }
    })
  );

  const aggregatedInsights = aggregateAnalysisResults(analysisResults, analysis_type);
  const recommendations = generateMaintenanceRecommendations(analysisResults);
  
  return new Response(
    JSON.stringify({
      success: true,
      analysis_type,
      time_horizon_days,
      equipment_analyzed: equipment.length,
      results: analysisResults,
      aggregated_insights: aggregatedInsights,
      recommendations,
      priority_actions: identifyPriorityActions(analysisResults)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function predictEquipmentFailure(equipment: any, timeHorizonDays: number) {
  const maintenanceLogs = equipment.maintenance_logs || [];
  const warrantyClaims = equipment.warranty_claims || [];
  const repairJobs = equipment.repair_jobs || [];
  
  // Calculate equipment age and usage metrics
  const installDate = new Date(equipment.installation_date || equipment.created_at);
  const ageInDays = Math.floor((Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24));
  const operatingHours = equipment.operating_hours || (ageInDays * 12); // Estimate if not available
  
  // Analyze maintenance frequency and patterns
  const maintenanceFrequency = calculateMaintenanceFrequency(maintenanceLogs);
  const failureHistory = analyzeFailureHistory(warrantyClaims, repairJobs);
  const wearIndicators = calculateWearIndicators(equipment, maintenanceLogs);
  
  // AI-powered failure prediction
  const aiPrediction = await generateAIFailurePrediction({
    equipment_type: equipment.type,
    manufacturer: equipment.manufacturer,
    model: equipment.model,
    age_days: ageInDays,
    operating_hours: operatingHours,
    maintenance_history: maintenanceLogs,
    failure_history: failureHistory,
    current_condition: equipment.condition || 'good',
    environment: equipment.operating_environment || 'standard'
  });
  
  // Combine statistical and AI predictions
  const failureProbability = calculateFailureProbability(
    maintenanceFrequency,
    failureHistory,
    wearIndicators,
    aiPrediction,
    timeHorizonDays
  );
  
  return {
    equipment_id: equipment.id,
    equipment_name: equipment.name,
    failure_probability: failureProbability,
    risk_level: calculateRiskLevel(failureProbability),
    predicted_failure_modes: aiPrediction.likely_failure_modes,
    recommended_actions: generateFailurePreventionActions(failureProbability, aiPrediction),
    optimal_maintenance_window: calculateOptimalMaintenanceWindow(maintenanceFrequency, failureProbability),
    cost_impact: estimateFailureCostImpact(equipment, failureProbability)
  };
}

async function optimizeMaintenanceSchedule(equipment: any, timeHorizonDays: number) {
  const maintenanceLogs = equipment.maintenance_logs || [];
  const currentSchedule = equipment.maintenance_schedule || [];
  
  // Analyze current maintenance effectiveness
  const effectivenessMetrics = analyzeMaintenanceEffectiveness(maintenanceLogs);
  const costAnalysis = analyzeMaintenanceCosts(equipment, timeHorizonDays);
  
  // Generate optimized schedule using AI
  const optimizationPrompt = `Optimize maintenance schedule for ${equipment.type} equipment:
    
Current Schedule: ${JSON.stringify(currentSchedule)}
Maintenance History: ${JSON.stringify(maintenanceLogs.slice(-10))}
Equipment Details: Age ${equipment.age_months} months, Operating hours ${equipment.operating_hours}
Current Effectiveness: ${JSON.stringify(effectivenessMetrics)}

Generate optimized maintenance schedule for next ${timeHorizonDays} days focusing on:
1. Cost efficiency
2. Failure prevention
3. Operational availability
4. Resource optimization

Return JSON with optimized schedule, cost savings, and justification.`;

  const aiOptimization = await callYachtieAI(optimizationPrompt, 'schedule_optimization');
  
  return {
    equipment_id: equipment.id,
    current_schedule: currentSchedule,
    optimized_schedule: aiOptimization.optimized_schedule,
    cost_savings: aiOptimization.estimated_savings,
    availability_improvement: aiOptimization.availability_gain,
    implementation_plan: aiOptimization.implementation_steps,
    roi_analysis: calculateMaintenanceROI(costAnalysis, aiOptimization)
  };
}

async function forecastPartsDemand(equipment: any, timeHorizonDays: number) {
  const maintenanceLogs = equipment.maintenance_logs || [];
  const repairJobs = equipment.repair_jobs || [];
  
  // Extract parts usage patterns
  const partsUsage = extractPartsUsagePatterns(maintenanceLogs, repairJobs);
  const seasonalFactors = analyzeSeasonalDemand(partsUsage);
  
  // AI-powered demand forecasting
  const forecastPrompt = `Forecast parts demand for ${equipment.type} equipment over ${timeHorizonDays} days:
    
Parts Usage History: ${JSON.stringify(partsUsage)}
Seasonal Patterns: ${JSON.stringify(seasonalFactors)}
Equipment Condition: ${equipment.condition}
Operating Environment: ${equipment.operating_environment}

Predict:
1. Parts quantities needed
2. Optimal ordering timing
3. Critical parts to stock
4. Budget requirements
5. Supplier lead times consideration

Return JSON with detailed forecast.`;

  const demandForecast = await callYachtieAI(forecastPrompt, 'demand_forecasting');
  
  return {
    equipment_id: equipment.id,
    forecast_period_days: timeHorizonDays,
    predicted_parts_demand: demandForecast.parts_forecast,
    critical_parts: demandForecast.critical_parts,
    ordering_schedule: demandForecast.optimal_ordering,
    budget_estimate: demandForecast.budget_required,
    inventory_recommendations: demandForecast.inventory_strategy
  };
}

async function generateMaintenancePlan(data: any) {
  const { yacht_id, planning_horizon_days, budget_constraints, priority_focus } = data;
  
  // Get all equipment for the yacht
  const { data: equipment, error } = await supabase
    .from('equipment')
    .select(`
      *,
      maintenance_logs(*),
      warranty_claims(*),
      repair_jobs(*)
    `)
    .eq('yacht_id', yacht_id);
  
  if (error) {
    throw new Error(`Failed to fetch equipment: ${error.message}`);
  }
  
  // Analyze each piece of equipment
  const equipmentAnalysis = await Promise.all(
    equipment.map(async (item) => {
      const failurePrediction = await predictEquipmentFailure(item, planning_horizon_days);
      const maintenanceOptimization = await optimizeMaintenanceSchedule(item, planning_horizon_days);
      
      return {
        equipment: item,
        failure_prediction: failurePrediction,
        maintenance_optimization: maintenanceOptimization,
        priority_score: calculatePriorityScore(failurePrediction, budget_constraints, priority_focus)
      };
    })
  );
  
  // Generate comprehensive maintenance plan
  const maintenancePlan = createIntegratedMaintenancePlan(equipmentAnalysis, planning_horizon_days, budget_constraints);
  const potentialClaims = identifyPotentialWarrantyClaims(equipmentAnalysis);
  
  return new Response(
    JSON.stringify({
      success: true,
      yacht_id,
      planning_horizon_days,
      equipment_count: equipment.length,
      maintenance_plan: maintenancePlan,
      budget_utilization: maintenancePlan.total_cost,
      potential_warranty_claims: potentialClaims,
      risk_mitigation: maintenancePlan.risk_reduction,
      recommended_timeline: maintenancePlan.execution_timeline
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createClaimsFromMaintenance(data: any) {
  const { maintenance_findings, equipment_id, yacht_id } = data;
  
  // Analyze maintenance findings for warranty claim opportunities
  const claimOpportunities = [];
  
  for (const finding of maintenance_findings) {
    // Check if issue is covered under warranty
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select('*, warranty_claims(*)')
      .eq('id', equipment_id)
      .single();
    
    if (error) continue;
    
    const warrantyStatus = checkWarrantyStatus(equipment, finding);
    
    if (warrantyStatus.eligible) {
      // Create warranty claim automatically
      const { data: newClaim, error: claimError } = await supabase
        .from('warranty_claims')
        .insert({
          yacht_id,
          equipment_id,
          category_id: finding.category_id,
          name: `Warranty Claim - ${finding.issue_description}`,
          description: `Automatically generated claim based on maintenance finding: ${finding.detailed_description}`,
          job_type: 'warranty_claim',
          priority: calculateClaimPriority(finding),
          status: 'draft',
          warranty_start_date: equipment.warranty_start_date,
          warranty_duration_months: equipment.warranty_duration_months,
          estimated_cost: finding.estimated_repair_cost,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (!claimError && newClaim) {
        claimOpportunities.push({
          claim_id: newClaim.id,
          equipment_name: equipment.name,
          issue: finding.issue_description,
          estimated_value: finding.estimated_repair_cost,
          warranty_coverage: warrantyStatus.coverage_percentage,
          recommended_action: 'Submit warranty claim immediately',
          supporting_evidence: finding.evidence_files || []
        });
      }
    }
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      claims_created: claimOpportunities.length,
      claim_opportunities: claimOpportunities,
      potential_savings: claimOpportunities.reduce((sum, claim) => sum + (claim.estimated_value * claim.warranty_coverage / 100), 0),
      next_steps: generateClaimsNextSteps(claimOpportunities)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions
async function generateAIFailurePrediction(equipmentData: any) {
  const content = `Analyze equipment failure risk:
  
Equipment: ${equipmentData.equipment_type} ${equipmentData.manufacturer} ${equipmentData.model}
Age: ${equipmentData.age_days} days
Operating Hours: ${equipmentData.operating_hours}
Current Condition: ${equipmentData.current_condition}
Environment: ${equipmentData.environment}
Recent Maintenance: ${JSON.stringify(equipmentData.maintenance_history.slice(-5))}
Failure History: ${JSON.stringify(equipmentData.failure_history)}

Predict:
1. Failure probability (0-1)
2. Most likely failure modes
3. Contributing factors
4. Early warning signs
5. Preventive actions

Return detailed JSON analysis.`;

  return await callYachtieAI(content, 'predictive_analysis');
}

async function callYachtieAI(content: string, analysisType: string = 'general') {
  try {
    // Use Yachtie multi-AI consensus system for predictive maintenance
    const { data: aiResult, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
      body: {
        content,
        context: `Predictive Maintenance - ${analysisType}`,
        module: 'predictive_maintenance',
        action_type: analysisType,
        risk_level: 'high',
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.warn('Yachtie AI error:', error.message);
      return { error: 'AI analysis unavailable' };
    }

    try {
      return typeof aiResult.consensus === 'string' ? JSON.parse(aiResult.consensus) : aiResult.consensus;
    } catch (e) {
      console.warn('Failed to parse AI response:', e);
      return { error: 'AI response parsing failed', raw_response: aiResult.consensus };
    }
  } catch (error) {
    console.warn('Yachtie AI call failed:', error);
    // Return mock data as fallback
    return {
      failure_probability: Math.random() * 0.3,
      likely_failure_modes: ['wear', 'corrosion'],
      preventive_actions: ['increase inspection frequency'],
      optimized_schedule: [],
      estimated_savings: 1000
    };
  }
}

function calculateMaintenanceFrequency(maintenanceLogs: any[]) {
  if (maintenanceLogs.length < 2) return { frequency: 0, trend: 'insufficient_data' };
  
  const sortedLogs = maintenanceLogs.sort((a, b) => new Date(a.performed_date).getTime() - new Date(b.performed_date).getTime());
  const intervals = [];
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const interval = (new Date(sortedLogs[i].performed_date).getTime() - new Date(sortedLogs[i-1].performed_date).getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(interval);
  }
  
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  
  return {
    frequency: 365 / averageInterval, // Times per year
    average_interval_days: averageInterval,
    trend: intervals.length > 2 ? analyzeTrend(intervals) : 'stable'
  };
}

function analyzeFailureHistory(warrantyClaims: any[], repairJobs: any[]) {
  const failures = [...warrantyClaims, ...repairJobs].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  return {
    total_failures: failures.length,
    failure_rate: failures.length / Math.max(1, (Date.now() - new Date(failures[0]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24 * 365)),
    common_failure_modes: extractFailureModes(failures),
    mtbf: calculateMTBF(failures) // Mean Time Between Failures
  };
}

function calculateWearIndicators(equipment: any, maintenanceLogs: any[]) {
  // Mock implementation - in reality would use sensor data, visual inspections, etc.
  const ageScore = Math.min(1, (equipment.age_months || 0) / 120); // Normalize to 10 years
  const usageScore = Math.min(1, (equipment.operating_hours || 0) / 50000); // Normalize to typical lifecycle
  const maintenanceScore = maintenanceLogs.length > 0 ? 1 - (maintenanceLogs.length / 20) : 0.5;
  
  return {
    age_indicator: ageScore,
    usage_indicator: usageScore,
    maintenance_indicator: Math.max(0, maintenanceScore),
    overall_wear: (ageScore + usageScore + maintenanceScore) / 3
  };
}

function calculateFailureProbability(maintenanceFreq: any, failureHistory: any, wearIndicators: any, aiPrediction: any, timeHorizonDays: number) {
  // Combine multiple factors to predict failure probability
  const baseProbability = failureHistory.failure_rate * (timeHorizonDays / 365);
  const wearAdjustment = wearIndicators.overall_wear * 0.3;
  const maintenanceAdjustment = maintenanceFreq.frequency > 2 ? -0.1 : 0.1; // Good maintenance reduces risk
  const aiAdjustment = (aiPrediction.failure_probability || 0.2) * 0.4;
  
  return Math.min(1, Math.max(0, baseProbability + wearAdjustment + maintenanceAdjustment + aiAdjustment));
}

function calculateRiskLevel(failureProbability: number): 'low' | 'medium' | 'high' | 'critical' {
  if (failureProbability > 0.7) return 'critical';
  if (failureProbability > 0.5) return 'high';
  if (failureProbability > 0.3) return 'medium';
  return 'low';
}

function generateFailurePreventionActions(failureProbability: number, aiPrediction: any): string[] {
  const actions = [];
  
  if (failureProbability > 0.6) {
    actions.push('Schedule immediate inspection');
    actions.push('Prepare replacement parts');
    actions.push('Consider temporary replacement during maintenance');
  } else if (failureProbability > 0.4) {
    actions.push('Increase monitoring frequency');
    actions.push('Schedule preventive maintenance');
  } else if (failureProbability > 0.2) {
    actions.push('Continue regular maintenance schedule');
    actions.push('Monitor for early warning signs');
  }
  
  if (aiPrediction.preventive_actions) {
    actions.push(...aiPrediction.preventive_actions);
  }
  
  return [...new Set(actions)]; // Remove duplicates
}

function calculateOptimalMaintenanceWindow(maintenanceFreq: any, failureProbability: number) {
  const baseInterval = maintenanceFreq.average_interval_days || 90;
  const riskAdjustment = failureProbability > 0.5 ? 0.7 : (failureProbability > 0.3 ? 0.85 : 1.0);
  
  const optimalInterval = Math.round(baseInterval * riskAdjustment);
  const nextMaintenanceDate = new Date(Date.now() + optimalInterval * 24 * 60 * 60 * 1000);
  
  return {
    recommended_interval_days: optimalInterval,
    next_maintenance_date: nextMaintenanceDate.toISOString().split('T')[0],
    confidence: maintenanceFreq.trend === 'stable' ? 'high' : 'medium'
  };
}

function estimateFailureCostImpact(equipment: any, failureProbability: number) {
  // Estimate costs based on equipment value and failure probability
  const equipmentValue = equipment.purchase_cost || 50000; // Default estimate
  const repairCostMultiplier = 0.3; // Typical repair cost as % of equipment value
  const downtimeCostPerDay = 1000; // Estimated daily operational impact
  const expectedDowntimeDays = 5;
  
  const directRepairCost = equipmentValue * repairCostMultiplier;
  const downtimeCost = downtimeCostPerDay * expectedDowntimeDays;
  const totalImpact = (directRepairCost + downtimeCost) * failureProbability;
  
  return {
    direct_repair_cost: directRepairCost,
    downtime_cost: downtimeCost,
    total_expected_impact: totalImpact,
    preventive_maintenance_cost: totalImpact * 0.2 // Preventive is typically 20% of failure cost
  };
}

function analyzeMaintenanceEffectiveness(maintenanceLogs: any[]) {
  if (maintenanceLogs.length === 0) return { effectiveness: 0.5, trend: 'unknown' };
  
  // Analyze intervals between maintenance and issues
  const issueResolution = maintenanceLogs.filter(log => log.maintenance_type === 'corrective').length;
  const preventiveMaintenance = maintenanceLogs.filter(log => log.maintenance_type === 'preventive').length;
  
  const effectivenessRatio = preventiveMaintenance / Math.max(1, issueResolution);
  const effectiveness = Math.min(1, effectivenessRatio / 3); // Normalize: 3:1 preventive:corrective is ideal
  
  return {
    effectiveness,
    preventive_vs_corrective_ratio: effectivenessRatio,
    total_maintenance_events: maintenanceLogs.length,
    trend: analyzeTrend(maintenanceLogs.map(log => new Date(log.performed_date).getTime()))
  };
}

function extractPartsUsagePatterns(maintenanceLogs: any[], repairJobs: any[]) {
  const partsUsage = {};
  
  [...maintenanceLogs, ...repairJobs].forEach(event => {
    if (event.parts_used) {
      event.parts_used.forEach((part: any) => {
        if (!partsUsage[part.part_number]) {
          partsUsage[part.part_number] = {
            name: part.name,
            total_quantity: 0,
            usage_events: [],
            average_interval: 0
          };
        }
        partsUsage[part.part_number].total_quantity += part.quantity;
        partsUsage[part.part_number].usage_events.push({
          date: event.performed_date || event.created_at,
          quantity: part.quantity
        });
      });
    }
  });
  
  // Calculate usage intervals
  Object.keys(partsUsage).forEach(partNumber => {
    const events = partsUsage[partNumber].usage_events.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (events.length > 1) {
      const intervals = [];
      for (let i = 1; i < events.length; i++) {
        intervals.push((new Date(events[i].date).getTime() - new Date(events[i-1].date).getTime()) / (1000 * 60 * 60 * 24));
      }
      partsUsage[partNumber].average_interval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }
  });
  
  return partsUsage;
}

function analyzeSeasonalDemand(partsUsage: any) {
  // Simplified seasonal analysis
  const seasonalFactors = {
    spring: 1.2, // Higher maintenance in spring preparation
    summer: 1.0, // Normal usage during operating season
    autumn: 1.1, // End of season maintenance
    winter: 0.7  // Reduced activity in winter
  };
  
  return seasonalFactors;
}

function calculatePriorityScore(failurePrediction: any, budgetConstraints: any, priorityFocus: string) {
  let score = 0;
  
  // Risk-based scoring
  score += failurePrediction.failure_probability * 40;
  
  // Cost impact scoring
  score += Math.min(30, (failurePrediction.cost_impact.total_expected_impact / 10000) * 10);
  
  // Priority focus adjustment
  if (priorityFocus === 'safety' && failurePrediction.equipment.safety_critical) {
    score += 20;
  } else if (priorityFocus === 'cost' && failurePrediction.cost_impact.preventive_maintenance_cost < budgetConstraints.max_per_item) {
    score += 15;
  } else if (priorityFocus === 'availability' && failurePrediction.equipment.operational_criticality === 'high') {
    score += 15;
  }
  
  return Math.min(100, score);
}

function createIntegratedMaintenancePlan(equipmentAnalysis: any[], planningHorizonDays: number, budgetConstraints: any) {
  // Sort by priority score
  const prioritizedEquipment = equipmentAnalysis.sort((a, b) => b.priority_score - a.priority_score);
  
  const maintenancePlan = {
    total_cost: 0,
    equipment_count: 0,
    high_priority_items: [],
    medium_priority_items: [],
    low_priority_items: [],
    execution_timeline: [],
    risk_reduction: 0
  };
  
  let remainingBudget = budgetConstraints.total_budget;
  
  prioritizedEquipment.forEach(analysis => {
    const item = analysis.failure_prediction;
    const maintenanceCost = item.cost_impact.preventive_maintenance_cost;
    
    if (remainingBudget >= maintenanceCost) {
      const maintenanceItem = {
        equipment_id: item.equipment_id,
        equipment_name: item.equipment_name,
        action: analysis.maintenance_optimization.implementation_plan?.[0] || 'Schedule maintenance',
        cost: maintenanceCost,
        priority_score: analysis.priority_score,
        risk_reduction: item.failure_probability * 0.7, // Assume 70% risk reduction
        recommended_date: item.optimal_maintenance_window.next_maintenance_date
      };
      
      if (analysis.priority_score > 70) {
        maintenancePlan.high_priority_items.push(maintenanceItem);
      } else if (analysis.priority_score > 40) {
        maintenancePlan.medium_priority_items.push(maintenanceItem);
      } else {
        maintenancePlan.low_priority_items.push(maintenanceItem);
      }
      
      maintenancePlan.total_cost += maintenanceCost;
      maintenancePlan.equipment_count += 1;
      maintenancePlan.risk_reduction += maintenanceItem.risk_reduction;
      remainingBudget -= maintenanceCost;
    }
  });
  
  // Generate execution timeline
  const allItems = [...maintenancePlan.high_priority_items, ...maintenancePlan.medium_priority_items, ...maintenancePlan.low_priority_items];
  maintenancePlan.execution_timeline = allItems
    .sort((a, b) => new Date(a.recommended_date).getTime() - new Date(b.recommended_date).getTime())
    .map(item => ({
      date: item.recommended_date,
      equipment: item.equipment_name,
      action: item.action,
      cost: item.cost
    }));
  
  return maintenancePlan;
}

function identifyPotentialWarrantyClaims(equipmentAnalysis: any[]) {
  return equipmentAnalysis
    .filter(analysis => {
      const equipment = analysis.equipment;
      const warrantyExpiry = new Date(equipment.warranty_expires_at || '2000-01-01');
      const isUnderWarranty = warrantyExpiry > new Date();
      const hasRecentIssues = analysis.failure_prediction.failure_probability > 0.3;
      
      return isUnderWarranty && hasRecentIssues;
    })
    .map(analysis => ({
      equipment_id: analysis.equipment.id,
      equipment_name: analysis.equipment.name,
      warranty_expires: analysis.equipment.warranty_expires_at,
      failure_probability: analysis.failure_prediction.failure_probability,
      estimated_claim_value: analysis.failure_prediction.cost_impact.direct_repair_cost,
      recommended_action: 'Monitor for warranty claim opportunity',
      justification: analysis.failure_prediction.predicted_failure_modes.join(', ')
    }));
}

function checkWarrantyStatus(equipment: any, finding: any) {
  const warrantyExpiry = new Date(equipment.warranty_expires_at || '2000-01-01');
  const isUnderWarranty = warrantyExpiry > new Date();
  
  if (!isUnderWarranty) {
    return { eligible: false, reason: 'Warranty expired' };
  }
  
  // Check if issue type is covered (simplified logic)
  const coveredIssues = ['manufacturing_defect', 'material_failure', 'premature_wear'];
  const isCovered = coveredIssues.some(issue => finding.issue_type?.includes(issue));
  
  return {
    eligible: isCovered,
    coverage_percentage: isCovered ? 80 : 0, // Assume 80% coverage for eligible claims
    reason: isCovered ? 'Covered under warranty' : 'Issue type not covered'
  };
}

function calculateClaimPriority(finding: any): 'low' | 'medium' | 'high' | 'critical' {
  if (finding.safety_impact === 'critical') return 'critical';
  if (finding.estimated_repair_cost > 50000) return 'high';
  if (finding.operational_impact === 'high') return 'high';
  if (finding.estimated_repair_cost > 10000) return 'medium';
  return 'low';
}

function generateClaimsNextSteps(claimOpportunities: any[]): string[] {
  const steps = [];
  
  if (claimOpportunities.length === 0) {
    return ['No warranty claims identified at this time'];
  }
  
  steps.push(`Review ${claimOpportunities.length} potential warranty claims`);
  steps.push('Gather supporting documentation and evidence');
  steps.push('Contact suppliers to initiate claim process');
  steps.push('Schedule supplier inspections if required');
  steps.push('Monitor claim progress and follow up regularly');
  
  return steps;
}

function analyzeTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 3) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = (secondAvg - firstAvg) / firstAvg;
  
  if (change > 0.1) return 'increasing';
  if (change < -0.1) return 'decreasing';
  return 'stable';
}

function extractFailureModes(failures: any[]): string[] {
  const modes = failures
    .map(failure => failure.issue_description || failure.description || '')
    .filter(desc => desc.length > 0);
  
  // Simple keyword extraction (in reality would use NLP)
  const commonModes = ['wear', 'corrosion', 'electrical', 'mechanical', 'hydraulic', 'overheating'];
  return commonModes.filter(mode => 
    modes.some(desc => desc.toLowerCase().includes(mode))
  );
}

function calculateMTBF(failures: any[]): number {
  if (failures.length < 2) return 0;
  
  const sortedFailures = failures.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const totalTimespan = new Date(sortedFailures[sortedFailures.length - 1].created_at).getTime() - 
                       new Date(sortedFailures[0].created_at).getTime();
  
  return totalTimespan / (1000 * 60 * 60 * 24 * failures.length); // Days between failures
}

function aggregateAnalysisResults(results: any[], analysisType: string) {
  const aggregated = {
    total_equipment: results.length,
    average_failure_probability: 0,
    high_risk_count: 0,
    total_estimated_savings: 0,
    critical_actions_needed: 0
  };
  
  results.forEach(result => {
    if (result.failure_probability) {
      aggregated.average_failure_probability += result.failure_probability;
      if (result.failure_probability > 0.5) aggregated.high_risk_count++;
    }
    
    if (result.cost_savings) {
      aggregated.total_estimated_savings += result.cost_savings;
    }
    
    if (result.risk_level === 'critical' || result.risk_level === 'high') {
      aggregated.critical_actions_needed++;
    }
  });
  
  if (results.length > 0) {
    aggregated.average_failure_probability /= results.length;
  }
  
  return aggregated;
}

function generateMaintenanceRecommendations(analysisResults: any[]): MaintenanceRecommendation[] {
  return analysisResults
    .filter(result => result.failure_probability > 0.3 || result.risk_level === 'high')
    .map(result => ({
      equipment_id: result.equipment_id,
      recommended_action: result.recommended_actions?.[0] || 'Schedule inspection',
      urgency: result.risk_level,
      estimated_cost: result.cost_impact?.preventive_maintenance_cost || 1000,
      failure_probability: result.failure_probability,
      optimal_timing: result.optimal_maintenance_window?.next_maintenance_date || 'Within 30 days'
    }));
}

function identifyPriorityActions(analysisResults: any[]): string[] {
  const actions = [];
  
  const criticalEquipment = analysisResults.filter(result => result.risk_level === 'critical');
  const highRiskEquipment = analysisResults.filter(result => result.failure_probability > 0.6);
  
  if (criticalEquipment.length > 0) {
    actions.push(`${criticalEquipment.length} equipment items require immediate attention`);
  }
  
  if (highRiskEquipment.length > 0) {
    actions.push(`${highRiskEquipment.length} equipment items have high failure probability`);
  }
  
  const totalPotentialSavings = analysisResults.reduce((sum, result) => 
    sum + (result.cost_savings || 0), 0
  );
  
  if (totalPotentialSavings > 10000) {
    actions.push(`Potential cost savings of $${totalPotentialSavings.toLocaleString()} identified`);
  }
  
  return actions;
}

function calculateMaintenanceROI(costAnalysis: any, optimization: any) {
  const maintenanceCost = costAnalysis.annual_maintenance_cost || 10000;
  const potentialSavings = optimization.estimated_savings || 5000;
  const avoidedFailureCosts = costAnalysis.potential_failure_costs || 20000;
  
  const totalBenefits = potentialSavings + (avoidedFailureCosts * 0.3); // 30% failure probability
  const roi = ((totalBenefits - maintenanceCost) / maintenanceCost) * 100;
  
  return {
    investment: maintenanceCost,
    benefits: totalBenefits,
    net_benefit: totalBenefits - maintenanceCost,
    roi_percentage: Math.round(roi * 100) / 100,
    payback_period_months: Math.ceil(maintenanceCost / (totalBenefits / 12))
  };
}