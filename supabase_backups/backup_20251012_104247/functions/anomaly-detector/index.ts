import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnomalyRequest {
  yacht_id: string;
  parameter: string;
  values: number[];
  variance?: number;
  mean?: number;
  detection_time: string;
  device_id?: string;
  context?: {
    weather_conditions?: string;
    operating_mode?: string;
    location?: { lat: number; lng: number };
  };
}

interface AnomalyResult {
  anomaly_detected: boolean;
  anomaly_type: string;
  confidence_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  predicted_failure_risk: number;
  recommended_actions: string[];
  maintenance_suggestion?: {
    urgency: 'immediate' | 'within_24h' | 'within_week' | 'routine';
    estimated_cost: number;
    parts_needed?: string[];
  };
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Anomaly detection thresholds and patterns
const ANOMALY_PATTERNS = {
  engine_speed: {
    normal_range: [600, 4000], // RPM
    critical_variance_threshold: 500,
    failure_indicators: {
      sudden_drop: { threshold: 0.3, risk: 0.8 },
      excessive_variance: { threshold: 200, risk: 0.6 },
      prolonged_high: { threshold: 3500, duration_minutes: 30, risk: 0.7 }
    }
  },
  oil_pressure: {
    normal_range: [200, 600], // kPa
    critical_variance_threshold: 50,
    failure_indicators: {
      low_pressure: { threshold: 150, risk: 0.9 },
      pressure_drop: { rate: 0.2, risk: 0.8 },
      fluctuation: { variance_threshold: 100, risk: 0.6 }
    }
  },
  coolant_temperature: {
    normal_range: [60, 95], // Celsius
    critical_variance_threshold: 10,
    failure_indicators: {
      overheating: { threshold: 100, risk: 0.95 },
      rapid_increase: { rate: 0.5, risk: 0.8 },
      temperature_instability: { variance_threshold: 15, risk: 0.7 }
    }
  },
  fuel_level: {
    normal_range: [10, 100], // Percentage
    critical_variance_threshold: 5,
    failure_indicators: {
      rapid_consumption: { rate: 0.1, risk: 0.6 },
      sensor_malfunction: { impossible_values: true, risk: 0.4 }
    }
  },
  alternator_voltage: {
    normal_range: [13.5, 14.5], // Volts
    critical_variance_threshold: 0.5,
    failure_indicators: {
      undercharging: { threshold: 13.0, risk: 0.7 },
      overcharging: { threshold: 15.0, risk: 0.8 },
      voltage_instability: { variance_threshold: 1.0, risk: 0.6 }
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: AnomalyRequest = await req.json();
    console.log(`🔍 Anomaly detection for ${request.parameter} on yacht ${request.yacht_id}`);

    if (!request.yacht_id || !request.parameter || !request.values || request.values.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request: yacht_id, parameter, and values are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Perform anomaly detection
    const result = await detectAnomalies(request);

    // Store anomaly result if significant
    if (result.anomaly_detected && result.confidence_score > 0.6) {
      await storeAnomalyResult(request, result);
      
      // Trigger alerts for high-severity anomalies
      if (result.severity === 'high' || result.severity === 'critical') {
        await triggerAnomalyAlert(request, result);
      }
    }

    // Update predictive maintenance recommendations
    await updateMaintenancePredictions(request, result);

    return new Response(JSON.stringify({
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 Anomaly detection error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Anomaly detection failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function detectAnomalies(request: AnomalyRequest): Promise<AnomalyResult> {
  const { parameter, values, variance, mean } = request;
  
  // Get parameter pattern configuration
  const pattern = ANOMALY_PATTERNS[parameter as keyof typeof ANOMALY_PATTERNS];
  if (!pattern) {
    return {
      anomaly_detected: false,
      anomaly_type: 'unknown_parameter',
      confidence_score: 0,
      severity: 'low',
      predicted_failure_risk: 0,
      recommended_actions: ['Monitor parameter trends']
    };
  }

  const currentMean = mean || (values.reduce((a, b) => a + b, 0) / values.length);
  const currentVariance = variance || calculateVariance(values);
  const latestValue = values[values.length - 1];
  
  let anomalyDetected = false;
  let anomalyType = 'none';
  let confidence = 0;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let failureRisk = 0;
  const recommendedActions: string[] = [];
  let maintenanceSuggestion;

  // 1. Range Check
  if (latestValue < pattern.normal_range[0] || latestValue > pattern.normal_range[1]) {
    anomalyDetected = true;
    anomalyType = 'out_of_range';
    confidence = Math.max(confidence, 0.8);
    severity = 'high';
    failureRisk = Math.max(failureRisk, 0.7);
    recommendedActions.push(`${parameter} is outside normal operating range`);
  }

  // 2. Variance Analysis
  if (currentVariance > pattern.critical_variance_threshold) {
    anomalyDetected = true;
    anomalyType = anomalyType === 'none' ? 'high_variance' : 'multiple_anomalies';
    confidence = Math.max(confidence, 0.6);
    severity = severity === 'low' ? 'medium' : severity;
    failureRisk = Math.max(failureRisk, 0.5);
    recommendedActions.push(`Excessive ${parameter} fluctuation detected`);
  }

  // 3. Trend Analysis
  const trend = analyzeTrend(values);
  if (Math.abs(trend.slope) > 0.1) { // Significant trend
    anomalyDetected = true;
    anomalyType = anomalyType === 'none' ? 'trend_anomaly' : 'multiple_anomalies';
    confidence = Math.max(confidence, 0.5);
    
    if (trend.slope > 0 && parameter.includes('temperature')) {
      severity = 'high';
      failureRisk = Math.max(failureRisk, 0.8);
      recommendedActions.push('Rising temperature trend - check cooling system');
    } else if (trend.slope < 0 && parameter.includes('pressure')) {
      severity = 'critical';
      failureRisk = Math.max(failureRisk, 0.9);
      recommendedActions.push('Dropping pressure trend - immediate inspection required');
    }
  }

  // 4. Specific Parameter Patterns
  const specificResult = analyzeParameterSpecificPatterns(parameter, values, pattern);
  if (specificResult.anomaly) {
    anomalyDetected = true;
    anomalyType = specificResult.type;
    confidence = Math.max(confidence, specificResult.confidence);
    severity = getSeverityFromRisk(specificResult.risk);
    failureRisk = Math.max(failureRisk, specificResult.risk);
    recommendedActions.push(...specificResult.actions);
    maintenanceSuggestion = specificResult.maintenance;
  }

  // 5. Historical Comparison
  const historicalContext = await getHistoricalContext(request.yacht_id, parameter);
  if (historicalContext) {
    const historicalAnomaly = compareWithHistorical(values, historicalContext);
    if (historicalAnomaly.isAnomalous) {
      anomalyDetected = true;
      confidence = Math.max(confidence, historicalAnomaly.confidence);
      recommendedActions.push(historicalAnomaly.recommendation);
    }
  }

  // 6. Contextual Analysis (weather, operating conditions)
  if (request.context) {
    const contextualAdjustment = analyzeContextualFactors(request.context, parameter, latestValue);
    confidence *= contextualAdjustment.confidence_modifier;
    if (contextualAdjustment.environmental_factor) {
      recommendedActions.push(contextualAdjustment.recommendation);
    }
  }

  return {
    anomaly_detected: anomalyDetected,
    anomaly_type: anomalyType,
    confidence_score: Math.min(confidence, 1.0),
    severity: severity,
    predicted_failure_risk: Math.min(failureRisk, 1.0),
    recommended_actions: recommendedActions.length > 0 ? recommendedActions : ['Continue monitoring'],
    maintenance_suggestion: maintenanceSuggestion
  };
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

function analyzeTrend(values: number[]): { slope: number; r_squared: number } {
  const n = values.length;
  if (n < 3) return { slope: 0, r_squared: 0 };

  const x = values.map((_, i) => i);
  const y = values;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Calculate R-squared
  const meanY = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + (sumY - slope * sumX) / n;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
  const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

  return { slope, r_squared: rSquared };
}

function analyzeParameterSpecificPatterns(
  parameter: string, 
  values: number[], 
  pattern: any
): { anomaly: boolean; type: string; confidence: number; risk: number; actions: string[]; maintenance?: any } {
  const result = {
    anomaly: false,
    type: 'none',
    confidence: 0,
    risk: 0,
    actions: [] as string[],
    maintenance: undefined as any
  };

  const latestValue = values[values.length - 1];
  const indicators = pattern.failure_indicators;

  switch (parameter) {
    case 'engine_speed':
      // Sudden RPM drop
      if (values.length >= 2) {
        const previousValue = values[values.length - 2];
        const dropPercentage = (previousValue - latestValue) / previousValue;
        
        if (dropPercentage > indicators.sudden_drop.threshold) {
          result.anomaly = true;
          result.type = 'sudden_rpm_drop';
          result.confidence = 0.8;
          result.risk = indicators.sudden_drop.risk;
          result.actions.push('Engine RPM dropped suddenly - check fuel supply and ignition');
          result.maintenance = {
            urgency: 'immediate' as const,
            estimated_cost: 500,
            parts_needed: ['fuel filter', 'spark plugs']
          };
        }
      }
      break;

    case 'oil_pressure':
      if (latestValue < indicators.low_pressure.threshold) {
        result.anomaly = true;
        result.type = 'low_oil_pressure';
        result.confidence = 0.9;
        result.risk = indicators.low_pressure.risk;
        result.actions.push('CRITICAL: Low oil pressure - stop engine immediately');
        result.maintenance = {
          urgency: 'immediate' as const,
          estimated_cost: 200,
          parts_needed: ['oil', 'oil filter', 'pressure sensor']
        };
      }
      break;

    case 'coolant_temperature':
      if (latestValue > indicators.overheating.threshold) {
        result.anomaly = true;
        result.type = 'engine_overheating';
        result.confidence = 0.95;
        result.risk = indicators.overheating.risk;
        result.actions.push('ENGINE OVERHEATING - reduce load and check cooling system');
        result.maintenance = {
          urgency: 'immediate' as const,
          estimated_cost: 800,
          parts_needed: ['coolant', 'thermostat', 'water pump']
        };
      }
      break;

    case 'alternator_voltage':
      if (latestValue < indicators.undercharging.threshold) {
        result.anomaly = true;
        result.type = 'charging_system_failure';
        result.confidence = 0.7;
        result.risk = indicators.undercharging.risk;
        result.actions.push('Charging system underperforming - check alternator and battery');
        result.maintenance = {
          urgency: 'within_24h' as const,
          estimated_cost: 400,
          parts_needed: ['alternator belt', 'voltage regulator']
        };
      }
      break;
  }

  return result;
}

function getSeverityFromRisk(risk: number): 'low' | 'medium' | 'high' | 'critical' {
  if (risk >= 0.9) return 'critical';
  if (risk >= 0.7) return 'high';
  if (risk >= 0.4) return 'medium';
  return 'low';
}

async function getHistoricalContext(yachtId: string, parameter: string): Promise<any> {
  try {
    // Get historical data for the same parameter over the last 30 days
    const { data, error } = await supabase
      .from('nmea_data_hourly')
      .select('avg_value, max_value, min_value, sample_count')
      .eq('yacht_id', yachtId)
      .eq('parameter_name', parameter)
      .gte('hour_timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('hour_timestamp', { ascending: false })
      .limit(720); // 30 days * 24 hours

    if (error || !data || data.length === 0) {
      return null;
    }

    const avgValues = data.map(d => d.avg_value).filter(v => v !== null);
    const historicalMean = avgValues.reduce((a, b) => a + b, 0) / avgValues.length;
    const historicalStdDev = Math.sqrt(
      avgValues.reduce((sum, val) => sum + Math.pow(val - historicalMean, 2), 0) / avgValues.length
    );

    return {
      mean: historicalMean,
      std_dev: historicalStdDev,
      sample_count: avgValues.length
    };
  } catch (error) {
    console.error('Failed to get historical context:', error);
    return null;
  }
}

function compareWithHistorical(
  currentValues: number[], 
  historical: any
): { isAnomalous: boolean; confidence: number; recommendation: string } {
  const currentMean = currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
  const zScore = Math.abs(currentMean - historical.mean) / historical.std_dev;
  
  // Values more than 3 standard deviations from historical mean are anomalous
  if (zScore > 3) {
    return {
      isAnomalous: true,
      confidence: Math.min(zScore / 5, 1.0), // Scale confidence based on z-score
      recommendation: `Current values are ${zScore.toFixed(1)} standard deviations from historical average`
    };
  }
  
  return {
    isAnomalous: false,
    confidence: 0,
    recommendation: 'Values within historical normal range'
  };
}

function analyzeContextualFactors(
  context: any, 
  parameter: string, 
  value: number
): { confidence_modifier: number; environmental_factor: boolean; recommendation: string } {
  let confidenceModifier = 1.0;
  let environmentalFactor = false;
  let recommendation = '';

  // Adjust for weather conditions
  if (context.weather_conditions) {
    if (context.weather_conditions.includes('storm') || context.weather_conditions.includes('rough')) {
      confidenceModifier *= 0.8; // Reduce confidence in rough conditions
      environmentalFactor = true;
      recommendation = 'Consider weather conditions in analysis';
    }
  }

  // Adjust for operating mode
  if (context.operating_mode) {
    if (context.operating_mode === 'high_performance' && parameter.includes('temperature')) {
      confidenceModifier *= 0.9; // Higher temps expected in performance mode
      recommendation = 'Higher values expected in performance mode';
    }
  }

  return { confidence_modifier: confidenceModifier, environmental_factor: environmentalFactor, recommendation };
}

async function storeAnomalyResult(request: AnomalyRequest, result: AnomalyResult): Promise<void> {
  try {
    await supabase.from('anomaly_detections').insert({
      yacht_id: request.yacht_id,
      device_id: request.device_id,
      parameter_name: request.parameter,
      anomaly_type: result.anomaly_type,
      confidence_score: result.confidence_score,
      severity: result.severity,
      predicted_failure_risk: result.predicted_failure_risk,
      detection_data: {
        values: request.values,
        variance: request.variance,
        mean: request.mean,
        context: request.context
      },
      recommended_actions: result.recommended_actions,
      maintenance_suggestion: result.maintenance_suggestion,
      detected_at: request.detection_time
    });
  } catch (error) {
    console.error('Failed to store anomaly result:', error);
  }
}

async function triggerAnomalyAlert(request: AnomalyRequest, result: AnomalyResult): Promise<void> {
  try {
    // Create a high-priority alert
    await supabase.from('sensor_alerts').insert({
      yacht_id: request.yacht_id,
      device_id: request.device_id,
      parameter_name: request.parameter,
      alert_type: 'anomaly_detected',
      severity: result.severity,
      triggered_value: request.values[request.values.length - 1],
      alert_message: `Anomaly detected in ${request.parameter}: ${result.anomaly_type} (confidence: ${(result.confidence_score * 100).toFixed(1)}%)`,
      additional_context: {
        anomaly_type: result.anomaly_type,
        confidence_score: result.confidence_score,
        failure_risk: result.predicted_failure_risk,
        recommended_actions: result.recommended_actions,
        maintenance_suggestion: result.maintenance_suggestion
      }
    });

    // Send notification through notification system
    await supabase.functions.invoke('notification-dispatcher', {
      body: {
        yacht_id: request.yacht_id,
        type: 'anomaly_alert',
        severity: result.severity,
        message: `Anomaly detected in ${request.parameter}`,
        data: result
      }
    });
  } catch (error) {
    console.error('Failed to trigger anomaly alert:', error);
  }
}

async function updateMaintenancePredictions(request: AnomalyRequest, result: AnomalyResult): Promise<void> {
  try {
    if (result.maintenance_suggestion) {
      await supabase.from('predictive_maintenance').upsert({
        yacht_id: request.yacht_id,
        device_id: request.device_id,
        parameter_name: request.parameter,
        prediction_type: 'anomaly_based',
        urgency: result.maintenance_suggestion.urgency,
        estimated_cost: result.maintenance_suggestion.estimated_cost,
        parts_needed: result.maintenance_suggestion.parts_needed,
        confidence_score: result.confidence_score,
        prediction_data: {
          anomaly_type: result.anomaly_type,
          failure_risk: result.predicted_failure_risk,
          detection_time: request.detection_time
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'yacht_id,device_id,parameter_name'
      });
    }
  } catch (error) {
    console.error('Failed to update maintenance predictions:', error);
  }
}