import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PerformanceUpdate {
  supplier_id: string;
  job_id: string;
  metrics: {
    delivery_timeliness: number; // 1-5 scale
    quality_rating: number; // 1-5 scale
    communication_rating: number; // 1-5 scale
    cost_accuracy: number; // 1-5 scale
    problem_resolution: number; // 1-5 scale
  };
  completion_date: string;
  notes?: string;
}

interface SupplierAnalysis {
  supplier_id: string;
  analysis_period_days: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    switch (action) {
      case 'update_performance':
        return await updateSupplierPerformance(data as PerformanceUpdate);
      case 'analyze_supplier':
        return await analyzeSupplierPerformance(data as SupplierAnalysis);
      case 'get_recommendations':
        return await getSupplierRecommendations(data);
      case 'track_delivery':
        return await trackDeliveryPerformance(data);
      case 'calculate_ratings':
        return await calculateSupplierRatings();
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Supplier Performance Tracker Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function updateSupplierPerformance(update: PerformanceUpdate) {
  const { supplier_id, job_id, metrics, completion_date, notes } = update;
  
  // Insert performance record
  const { data: performanceRecord, error: insertError } = await supabase
    .from('supplier_performance_history')
    .insert({
      supplier_id,
      job_id,
      delivery_timeliness: metrics.delivery_timeliness,
      quality_rating: metrics.quality_rating,
      communication_rating: metrics.communication_rating,
      cost_accuracy: metrics.cost_accuracy,
      problem_resolution: metrics.problem_resolution,
      completion_date,
      notes,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to insert performance record: ${insertError.message}`);
  }

  // Calculate updated overall rating
  const { data: supplierHistory, error: historyError } = await supabase
    .from('supplier_performance_history')
    .select('*')
    .eq('supplier_id', supplier_id)
    .gte('completion_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last year
    .order('completion_date', { ascending: false });

  if (historyError) {
    throw new Error(`Failed to fetch supplier history: ${historyError.message}`);
  }

  const overallRating = calculateOverallRating(supplierHistory);
  const trendAnalysis = analyzeTrends(supplierHistory);
  
  // Update supplier's overall rating
  const { error: updateError } = await supabase
    .from('suppliers_contractors')
    .update({
      performance_rating: overallRating.overall,
      updated_at: new Date().toISOString()
    })
    .eq('id', supplier_id);

  if (updateError) {
    throw new Error(`Failed to update supplier rating: ${updateError.message}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      performance_record: performanceRecord,
      updated_rating: overallRating,
      trend_analysis: trendAnalysis,
      recommendations: generatePerformanceRecommendations(overallRating, trendAnalysis)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function analyzeSupplierPerformance(request: SupplierAnalysis) {
  const { supplier_id, analysis_period_days } = request;
  
  const startDate = new Date(Date.now() - analysis_period_days * 24 * 60 * 60 * 1000).toISOString();
  
  // Get supplier info
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers_contractors')
    .select('*')
    .eq('id', supplier_id)
    .single();

  if (supplierError) {
    throw new Error(`Failed to fetch supplier: ${supplierError.message}`);
  }

  // Get performance history
  const { data: performanceHistory, error: historyError } = await supabase
    .from('supplier_performance_history')
    .select('*')
    .eq('supplier_id', supplier_id)
    .gte('completion_date', startDate)
    .order('completion_date', { ascending: false });

  if (historyError) {
    throw new Error(`Failed to fetch performance history: ${historyError.message}`);
  }

  // Get associated jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('warranty_claims')
    .select('*, repair_jobs(*)')
    .eq('supplier_contractor_id', supplier_id)
    .gte('created_at', startDate);

  if (jobsError) {
    console.warn('Failed to fetch jobs:', jobsError.message);
  }

  const analysis = {
    supplier_info: supplier,
    period_days: analysis_period_days,
    total_jobs: performanceHistory.length,
    performance_metrics: calculateDetailedMetrics(performanceHistory),
    trend_analysis: analyzeTrends(performanceHistory),
    job_breakdown: analyzeJobTypes(jobs || []),
    benchmarking: await benchmarkAgainstPeers(supplier_id, performanceHistory),
    recommendations: generateImprovementRecommendations(performanceHistory),
    risk_assessment: assessSupplierRisk(performanceHistory, supplier)
  };

  return new Response(
    JSON.stringify({
      success: true,
      analysis
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getSupplierRecommendations(data: any) {
  const { job_type, location, urgency, budget_range } = data;
  
  // Get all suppliers with performance ratings
  const { data: suppliers, error } = await supabase
    .from('suppliers_contractors')
    .select(`
      *,
      supplier_performance_history(*)
    `)
    .eq('is_active', true)
    .order('performance_rating', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch suppliers: ${error.message}`);
  }

  // Score suppliers based on criteria
  const scoredSuppliers = suppliers.map(supplier => {
    let score = 0;
    let reasons = [];

    // Performance rating (40% weight)
    score += (supplier.performance_rating || 3) * 8;
    reasons.push(`Performance rating: ${supplier.performance_rating || 'N/A'}/5`);

    // Location match (20% weight)
    if (supplier.service_locations?.includes(location)) {
      score += 20;
      reasons.push('Services your location');
    }

    // Job type specialization (25% weight)
    if (supplier.specializations?.includes(job_type)) {
      score += 25;
      reasons.push(`Specializes in ${job_type}`);
    }

    // Recent performance trend (15% weight)
    const recentJobs = supplier.supplier_performance_history
      ?.filter((record: any) => 
        new Date(record.completion_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      ) || [];
    
    if (recentJobs.length > 0) {
      const avgRecentRating = recentJobs.reduce((sum: number, record: any) => 
        sum + ((record.delivery_timeliness + record.quality_rating + record.communication_rating) / 3), 0
      ) / recentJobs.length;
      score += avgRecentRating * 3;
      reasons.push(`Recent performance: ${avgRecentRating.toFixed(1)}/5`);
    }

    return {
      ...supplier,
      recommendation_score: Math.round(score),
      recommendation_reasons: reasons,
      recent_job_count: recentJobs.length
    };
  });

  // Sort by score and take top recommendations
  const topRecommendations = scoredSuppliers
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, 5);

  return new Response(
    JSON.stringify({
      success: true,
      recommendations: topRecommendations,
      selection_criteria: {
        job_type,
        location,
        urgency,
        budget_range
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function trackDeliveryPerformance(data: any) {
  const { supplier_id, job_id, promised_date, actual_date, delivery_notes } = data;
  
  const promisedTimestamp = new Date(promised_date).getTime();
  const actualTimestamp = new Date(actual_date).getTime();
  const delayDays = Math.ceil((actualTimestamp - promisedTimestamp) / (1000 * 60 * 60 * 24));
  
  const deliveryRating = calculateDeliveryRating(delayDays);
  
  // Record delivery performance
  const { data: deliveryRecord, error } = await supabase
    .from('supplier_delivery_tracking')
    .insert({
      supplier_id,
      job_id,
      promised_delivery_date: promised_date,
      actual_delivery_date: actual_date,
      delay_days: delayDays,
      delivery_rating: deliveryRating,
      notes: delivery_notes,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record delivery performance: ${error.message}`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      delivery_record: deliveryRecord,
      delay_days: delayDays,
      delivery_rating: deliveryRating,
      impact_assessment: assessDeliveryImpact(delayDays, data.urgency)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function calculateSupplierRatings() {
  // Get all active suppliers
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers_contractors')
    .select('id, name')
    .eq('is_active', true);

  if (suppliersError) {
    throw new Error(`Failed to fetch suppliers: ${suppliersError.message}`);
  }

  const updatedRatings = [];

  for (const supplier of suppliers) {
    // Get recent performance history (last 12 months)
    const { data: performanceHistory, error: historyError } = await supabase
      .from('supplier_performance_history')
      .select('*')
      .eq('supplier_id', supplier.id)
      .gte('completion_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    if (historyError) {
      console.warn(`Failed to fetch history for supplier ${supplier.id}:`, historyError.message);
      continue;
    }

    if (performanceHistory.length === 0) {
      continue; // Skip suppliers with no recent performance data
    }

    const overallRating = calculateOverallRating(performanceHistory);
    
    // Update supplier rating
    const { error: updateError } = await supabase
      .from('suppliers_contractors')
      .update({
        performance_rating: overallRating.overall,
        updated_at: new Date().toISOString()
      })
      .eq('id', supplier.id);

    if (updateError) {
      console.warn(`Failed to update rating for supplier ${supplier.id}:`, updateError.message);
      continue;
    }

    updatedRatings.push({
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      previous_rating: supplier.performance_rating,
      new_rating: overallRating.overall,
      job_count: performanceHistory.length
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      updated_suppliers: updatedRatings.length,
      details: updatedRatings
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions
function calculateOverallRating(performanceHistory: any[]) {
  if (performanceHistory.length === 0) {
    return { overall: 3.0, breakdown: {} };
  }

  const metrics = {
    delivery_timeliness: 0,
    quality_rating: 0,
    communication_rating: 0,
    cost_accuracy: 0,
    problem_resolution: 0
  };

  performanceHistory.forEach(record => {
    metrics.delivery_timeliness += record.delivery_timeliness || 3;
    metrics.quality_rating += record.quality_rating || 3;
    metrics.communication_rating += record.communication_rating || 3;
    metrics.cost_accuracy += record.cost_accuracy || 3;
    metrics.problem_resolution += record.problem_resolution || 3;
  });

  const count = performanceHistory.length;
  Object.keys(metrics).forEach(key => {
    metrics[key] = Math.round((metrics[key] / count) * 100) / 100;
  });

  // Weighted average for overall rating
  const overall = Math.round((
    metrics.delivery_timeliness * 0.25 +
    metrics.quality_rating * 0.30 +
    metrics.communication_rating * 0.15 +
    metrics.cost_accuracy * 0.20 +
    metrics.problem_resolution * 0.10
  ) * 100) / 100;

  return { overall, breakdown: metrics };
}

function analyzeTrends(performanceHistory: any[]) {
  if (performanceHistory.length < 2) {
    return { trend: 'stable', direction: 'none', confidence: 'low' };
  }

  // Sort by date
  const sortedHistory = [...performanceHistory].sort(
    (a, b) => new Date(a.completion_date).getTime() - new Date(b.completion_date).getTime()
  );

  const halfPoint = Math.floor(sortedHistory.length / 2);
  const firstHalf = sortedHistory.slice(0, halfPoint);
  const secondHalf = sortedHistory.slice(halfPoint);

  const firstHalfAvg = calculateOverallRating(firstHalf).overall;
  const secondHalfAvg = calculateOverallRating(secondHalf).overall;

  const difference = secondHalfAvg - firstHalfAvg;
  
  let trend, direction, confidence;
  
  if (Math.abs(difference) < 0.2) {
    trend = 'stable';
    direction = 'none';
  } else if (difference > 0) {
    trend = 'improving';
    direction = 'up';
  } else {
    trend = 'declining';
    direction = 'down';
  }

  confidence = performanceHistory.length > 5 ? 'high' : 'medium';

  return { trend, direction, confidence, change: Math.round(difference * 100) / 100 };
}

function calculateDeliveryRating(delayDays: number): number {
  if (delayDays <= 0) return 5; // Early or on time
  if (delayDays <= 2) return 4; // 1-2 days late
  if (delayDays <= 5) return 3; // 3-5 days late
  if (delayDays <= 10) return 2; // 6-10 days late
  return 1; // More than 10 days late
}

function calculateDetailedMetrics(performanceHistory: any[]) {
  if (performanceHistory.length === 0) return {};

  const metrics = calculateOverallRating(performanceHistory);
  const count = performanceHistory.length;

  return {
    ...metrics,
    total_jobs: count,
    average_job_value: performanceHistory.reduce((sum, record) => sum + (record.job_value || 0), 0) / count,
    on_time_delivery_rate: performanceHistory.filter(record => (record.delivery_timeliness || 3) >= 4).length / count,
    quality_consistency: calculateConsistency(performanceHistory, 'quality_rating'),
    communication_consistency: calculateConsistency(performanceHistory, 'communication_rating')
  };
}

function calculateConsistency(history: any[], metric: string): number {
  if (history.length < 2) return 1;
  
  const values = history.map(record => record[metric] || 3);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to consistency score (lower standard deviation = higher consistency)
  return Math.max(0, Math.min(1, 1 - (stdDev / 2)));
}

function analyzeJobTypes(jobs: any[]) {
  const breakdown = {
    warranty_claims: jobs.filter(job => job.job_type === 'warranty_claim').length,
    repairs: jobs.filter(job => job.job_type === 'repair').length,
    total_value: jobs.reduce((sum, job) => sum + (job.estimated_cost || 0), 0)
  };

  return breakdown;
}

async function benchmarkAgainstPeers(supplierId: string, performanceHistory: any[]) {
  // Get industry averages (simplified - in reality would use more sophisticated benchmarking)
  const industryAverages = {
    delivery_timeliness: 3.5,
    quality_rating: 3.7,
    communication_rating: 3.4,
    cost_accuracy: 3.6,
    problem_resolution: 3.3
  };

  const supplierRating = calculateOverallRating(performanceHistory);
  
  const benchmark = {
    vs_industry: {},
    ranking: 'unknown', // Would require more data to calculate
    percentile: 'unknown'
  };

  Object.keys(industryAverages).forEach(metric => {
    const supplierValue = supplierRating.breakdown[metric] || 3;
    const industryValue = industryAverages[metric];
    benchmark.vs_industry[metric] = {
      supplier: supplierValue,
      industry: industryValue,
      difference: Math.round((supplierValue - industryValue) * 100) / 100,
      performance: supplierValue >= industryValue ? 'above_average' : 'below_average'
    };
  });

  return benchmark;
}

function generatePerformanceRecommendations(rating: any, trends: any): string[] {
  const recommendations = [];

  if (rating.overall < 3.5) {
    recommendations.push('Consider performance improvement discussions with supplier');
  }

  if (rating.breakdown.delivery_timeliness < 3.0) {
    recommendations.push('Address delivery reliability issues');
  }

  if (rating.breakdown.quality_rating < 3.0) {
    recommendations.push('Implement quality assurance measures');
  }

  if (trends.trend === 'declining') {
    recommendations.push('Investigate cause of performance decline');
  }

  if (rating.breakdown.communication_rating < 3.0) {
    recommendations.push('Establish better communication protocols');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current performance level');
  }

  return recommendations;
}

function generateImprovementRecommendations(performanceHistory: any[]): string[] {
  const recommendations = [];
  const rating = calculateOverallRating(performanceHistory);

  // Analyze weak areas and suggest improvements
  Object.entries(rating.breakdown).forEach(([metric, value]) => {
    if (value < 3.5) {
      switch (metric) {
        case 'delivery_timeliness':
          recommendations.push('Implement delivery tracking and early warning systems');
          break;
        case 'quality_rating':
          recommendations.push('Establish quality control checkpoints and inspections');
          break;
        case 'communication_rating':
          recommendations.push('Set up regular progress updates and communication schedules');
          break;
        case 'cost_accuracy':
          recommendations.push('Improve cost estimation processes and change order management');
          break;
        case 'problem_resolution':
          recommendations.push('Develop faster issue escalation and resolution procedures');
          break;
      }
    }
  });

  return recommendations;
}

function assessSupplierRisk(performanceHistory: any[], supplier: any) {
  const rating = calculateOverallRating(performanceHistory);
  const trends = analyzeTrends(performanceHistory);
  
  let riskLevel = 'low';
  const riskFactors = [];

  if (rating.overall < 2.5) {
    riskLevel = 'high';
    riskFactors.push('Poor overall performance rating');
  } else if (rating.overall < 3.5) {
    riskLevel = 'medium';
    riskFactors.push('Below average performance rating');
  }

  if (trends.trend === 'declining') {
    riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    riskFactors.push('Declining performance trend');
  }

  if (performanceHistory.length < 3) {
    riskFactors.push('Limited performance history');
  }

  return {
    level: riskLevel,
    factors: riskFactors,
    mitigation_strategies: generateRiskMitigation(riskLevel, riskFactors)
  };
}

function generateRiskMitigation(riskLevel: string, factors: string[]): string[] {
  const strategies = [];

  if (riskLevel === 'high') {
    strategies.push('Consider alternative suppliers for critical jobs');
    strategies.push('Implement enhanced monitoring and oversight');
    strategies.push('Require performance bonds or guarantees');
  }

  if (riskLevel === 'medium') {
    strategies.push('Increase communication frequency');
    strategies.push('Set clear performance expectations and milestones');
  }

  if (factors.includes('Limited performance history')) {
    strategies.push('Start with smaller, less critical projects to build history');
  }

  return strategies;
}

function assessDeliveryImpact(delayDays: number, urgency: string) {
  let impact = 'low';
  const consequences = [];

  if (urgency === 'critical' && delayDays > 1) {
    impact = 'high';
    consequences.push('Critical timeline affected');
  } else if (urgency === 'high' && delayDays > 3) {
    impact = 'medium';
    consequences.push('Schedule disruption likely');
  } else if (delayDays > 7) {
    impact = 'medium';
    consequences.push('Extended downtime');
  }

  return {
    level: impact,
    consequences,
    recommended_actions: generateDelayActions(impact, delayDays)
  };
}

function generateDelayActions(impact: string, delayDays: number): string[] {
  const actions = [];

  if (impact === 'high') {
    actions.push('Escalate to supplier management');
    actions.push('Consider expedited alternatives');
    actions.push('Notify stakeholders of delay impact');
  }

  if (delayDays > 5) {
    actions.push('Request formal explanation and recovery plan');
    actions.push('Document delay for performance review');
  }

  return actions;
}