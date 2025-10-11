import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from "./YachtieIntegrationService";
import { universalEventBus } from "./UniversalEventBus";

interface PredictionModel {
  id: string;
  name: string;
  type: 'maintenance' | 'inventory' | 'cost' | 'performance' | 'weather' | 'crew';
  accuracy: number;
  lastTrained: Date;
  isActive: boolean;
  parameters: Record<string, any>;
}

interface Prediction {
  id: string;
  modelId: string;
  type: string;
  confidence: number;
  prediction: any;
  context: Record<string, any>;
  createdAt: Date;
  validUntil: Date;
  status: 'active' | 'expired' | 'validated' | 'invalid';
}

interface AnalyticsInsight {
  id: string;
  category: 'trend' | 'anomaly' | 'optimization' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  data: any;
  recommendations: string[];
  createdAt: Date;
}

class PredictiveAnalyticsEngine {
  private models = new Map<string, PredictionModel>();
  private predictions = new Map<string, Prediction>();
  private insights: AnalyticsInsight[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.setupPredictionModels();
    this.setupDataListeners();
    await this.runInitialAnalysis();
    
    // Schedule periodic analysis
    setInterval(() => this.runPeriodicAnalysis(), 30 * 60 * 1000); // Every 30 minutes
    
    this.isInitialized = true;
    console.log('PredictiveAnalyticsEngine initialized');
  }

  private async setupPredictionModels(): Promise<void> {
    const defaultModels: PredictionModel[] = [
      {
        id: 'maintenance_predictor',
        name: 'Equipment Maintenance Predictor',
        type: 'maintenance',
        accuracy: 0.85,
        lastTrained: new Date(),
        isActive: true,
        parameters: {
          lookAheadDays: 30,
          confidenceThreshold: 0.7,
          includeWeather: true,
          includeUsage: true
        }
      },
      {
        id: 'inventory_optimizer',
        name: 'Inventory Level Optimizer',
        type: 'inventory',
        accuracy: 0.78,
        lastTrained: new Date(),
        isActive: true,
        parameters: {
          seasonalAdjustment: true,
          demandForecasting: true,
          safetyStock: 0.2
        }
      },
      {
        id: 'cost_forecaster',
        name: 'Operational Cost Forecaster',
        type: 'cost',
        accuracy: 0.73,
        lastTrained: new Date(),
        isActive: true,
        parameters: {
          timeHorizon: 90,
          includeMarketFactors: true,
          currencyHedging: false
        }
      },
      {
        id: 'crew_scheduler',
        name: 'Optimal Crew Scheduler',
        type: 'crew',
        accuracy: 0.82,
        lastTrained: new Date(),
        isActive: true,
        parameters: {
          certificationMatching: true,
          workloadBalancing: true,
          experienceWeighting: 0.3
        }  
      }
    ];

    defaultModels.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  private setupDataListeners(): void {
    // Listen for data changes that might trigger new predictions
    universalEventBus.subscribe('data_*', async (event) => {
      if (event.payload?.table) {
        await this.analyzeDataChange(event.payload.table, event.payload.data);
      }
    });
  }

  private async analyzeDataChange(table: string, data: any): Promise<void> {
    try {
      // Determine which models are affected by this data change
      const affectedModelTypes = this.getAffectedModelTypes(table);
      
      for (const modelType of affectedModelTypes) {
        const models = Array.from(this.models.values())
          .filter(m => m.type === modelType && m.isActive);
          
        for (const model of models) {
          await this.generatePrediction(model, { table, data, trigger: 'data_change' });
        }
      }
    } catch (error) {
      console.error('Failed to analyze data change:', error);
    }
  }

  private getAffectedModelTypes(table: string): PredictionModel['type'][] {
    const tableModelMap: Record<string, PredictionModel['type'][]> = {
      'equipment': ['maintenance', 'cost'],
      'inventory_items': ['inventory', 'cost'],
      'maintenance_schedules': ['maintenance', 'cost'],
      'crew_members': ['crew'],
      'financial_transactions': ['cost'],
      'weather_data': ['maintenance', 'performance']
    };

    return tableModelMap[table] || [];
  }

  private async generatePrediction(model: PredictionModel, context: any): Promise<Prediction | null> {
    try {
      // Gather relevant data for prediction
      const predictionData = await this.gatherPredictionData(model, context);
      
      // Use AI to generate prediction
      const aiRequest = {
        text: `Generate ${model.type} prediction using model ${model.name}`,
        task: 'analyze' as const,
        context: JSON.stringify({
          model: model.name,
          type: model.type,
          parameters: model.parameters,
          data: predictionData,
          trigger: context
        })
      };

      const response = await yachtieService.process(aiRequest);
      
      if (!response.success || !response.result) {
        throw new Error('AI prediction failed');
      }

      let predictionResult;
      try {
        predictionResult = JSON.parse(response.result);
      } catch {
        predictionResult = { prediction: response.result, confidence: response.confidence || 0.5 };
      }

      const prediction: Prediction = {
        id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        modelId: model.id,
        type: model.type,
        confidence: predictionResult.confidence || response.confidence || 0.5,
        prediction: predictionResult.prediction || predictionResult,
        context,
        createdAt: new Date(),
        validUntil: new Date(Date.now() + (model.parameters.validityHours || 24) * 60 * 60 * 1000),
        status: 'active'
      };

      this.predictions.set(prediction.id, prediction);

      // Generate insights from prediction
      await this.generateInsightsFromPrediction(prediction, model);

      // Log prediction
      await this.logPrediction(prediction, model);

      return prediction;

    } catch (error) {
      console.error(`Prediction generation failed for model ${model.id}:`, error);
      return null;
    }
  }

  private async gatherPredictionData(model: PredictionModel, context: any): Promise<any> {
    const data: any = { context };

    try {
      switch (model.type) {
        case 'maintenance':
          const { data: equipment } = await supabase
            .from('equipment')
            .select('*')
            .limit(100);
          
          const { data: maintenanceHistory } = await supabase
            .from('maintenance_schedules')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

          data.equipment = equipment;
          data.maintenanceHistory = maintenanceHistory;
          break;

        case 'inventory':
          const { data: inventory } = await supabase
            .from('inventory_items')
            .select('*')
            .limit(100);
          
          data.inventory = inventory;
          break;

        case 'cost':
          const { data: transactions } = await supabase
            .from('financial_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          
          data.transactions = transactions;
          break;

        case 'crew':
          const { data: crew } = await supabase
            .from('crew_members')
            .select('*');
          
          data.crew = crew;
          break;
      }
    } catch (error) {
      console.error('Failed to gather prediction data:', error);
    }

    return data;
  }

  private async generateInsightsFromPrediction(prediction: Prediction, model: PredictionModel): Promise<void> {
    try {
      const insightRequest = {
        text: `Generate actionable insights from ${model.type} prediction`,
        task: 'analyze' as const,
        context: JSON.stringify({
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          model: model.name,
          type: model.type
        })
      };

      const response = await yachtieService.process(insightRequest);
      
      if (response.success && response.result) {
        let insightData;
        try {
          insightData = JSON.parse(response.result);
        } catch {
          insightData = { 
            title: `${model.type} insight`,
            description: response.result,
            recommendations: []
          };
        }

        const insight: AnalyticsInsight = {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          category: this.determineInsightCategory(prediction.type, prediction.confidence),
          title: insightData.title || `${model.name} Insight`,
          description: insightData.description || response.result,
          impact: this.determineImpactLevel(prediction.confidence, model.type),
          confidence: prediction.confidence,
          data: prediction.prediction,
          recommendations: insightData.recommendations || [],
          createdAt: new Date()
        };

        this.insights.unshift(insight);
        
        // Keep only the most recent 100 insights
        if (this.insights.length > 100) {
          this.insights = this.insights.slice(0, 100);
        }

        // Emit insight event
        universalEventBus.emit('insight_generated', 'analytics', insight);
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  }

  private determineInsightCategory(type: string, confidence: number): AnalyticsInsight['category'] {
    if (confidence > 0.8) {
      return type.includes('risk') || type.includes('failure') ? 'risk' : 'opportunity';
    } else if (confidence > 0.6) {
      return 'trend';
    } else {
      return 'anomaly';
    }
  }

  private determineImpactLevel(confidence: number, modelType: string): AnalyticsInsight['impact'] {
    if (modelType === 'maintenance' && confidence > 0.8) return 'critical';
    if (confidence > 0.85) return 'high';
    if (confidence > 0.7) return 'medium';
    return 'low';
  }

  private async logPrediction(prediction: Prediction, model: PredictionModel): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'prediction_generated',
        module: 'analytics',
        event_message: `${model.name} generated prediction`,
        severity: 'info',
        metadata: {
          prediction_id: prediction.id,
          model_id: model.id,
          confidence: prediction.confidence,
          type: prediction.type,
          valid_until: prediction.validUntil.toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log prediction:', error);
    }
  }

  private async runInitialAnalysis(): Promise<void> {
    console.log('Running initial predictive analysis...');
    
    const activeModels = Array.from(this.models.values()).filter(m => m.isActive);
    
    for (const model of activeModels) {
      try {
        await this.generatePrediction(model, { trigger: 'initial_analysis' });
      } catch (error) {
        console.error(`Initial analysis failed for model ${model.id}:`, error);
      }
    }
  }

  private async runPeriodicAnalysis(): Promise<void> {
    console.log('Running periodic predictive analysis...');
    
    // Clean up expired predictions
    this.cleanupExpiredPredictions();
    
    // Generate new predictions for time-sensitive models
    const activeModels = Array.from(this.models.values())
      .filter(m => m.isActive && ['maintenance', 'inventory'].includes(m.type));
    
    for (const model of activeModels) {
      try {
        await this.generatePrediction(model, { trigger: 'periodic_analysis' });
      } catch (error) {
        console.error(`Periodic analysis failed for model ${model.id}:`, error);
      }
    }
  }

  private cleanupExpiredPredictions(): void {
    const now = new Date();
    
    for (const [id, prediction] of this.predictions.entries()) {
      if (prediction.validUntil < now) {
        prediction.status = 'expired';
        // Keep expired predictions for a while for analysis
        if (now.getTime() - prediction.validUntil.getTime() > 7 * 24 * 60 * 60 * 1000) { // 7 days
          this.predictions.delete(id);
        }
      }
    }
  }

  // Public API methods
  async getPredictions(type?: string, limit: number = 50): Promise<Prediction[]> {
    let predictions = Array.from(this.predictions.values())
      .filter(p => p.status === 'active');
    
    if (type) {
      predictions = predictions.filter(p => p.type === type);
    }
    
    return predictions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getInsights(category?: AnalyticsInsight['category'], limit: number = 20): Promise<AnalyticsInsight[]> {
    let insights = [...this.insights];
    
    if (category) {
      insights = insights.filter(i => i.category === category);
    }
    
    return insights.slice(0, limit);
  }

  async getModelPerformance(): Promise<Array<{
    modelId: string;
    name: string;
    type: string;
    accuracy: number;
    predictionsCount: number;
    avgConfidence: number;
  }>> {
    const performance: Array<{
      modelId: string;
      name: string;
      type: string;
      accuracy: number;
      predictionsCount: number;
      avgConfidence: number;
    }> = [];

    for (const model of Array.from(this.models.values())) {
      const modelPredictions = Array.from(this.predictions.values())
        .filter(p => p.modelId === model.id);
      
      const avgConfidence = modelPredictions.length > 0
        ? modelPredictions.reduce((sum, p) => sum + p.confidence, 0) / modelPredictions.length
        : 0;

      performance.push({
        modelId: model.id,
        name: model.name,
        type: model.type,
        accuracy: model.accuracy,
        predictionsCount: modelPredictions.length,
        avgConfidence
      });
    }

    return performance;
  }

  async generateCustomPrediction(
    modelType: PredictionModel['type'],
    customData: any,
    parameters?: Record<string, any>
  ): Promise<Prediction | null> {
    const model = Array.from(this.models.values())
      .find(m => m.type === modelType && m.isActive);
    
    if (!model) {
      throw new Error(`No active model found for type: ${modelType}`);
    }

    const context = {
      trigger: 'custom_request',
      customData,
      parameters: { ...model.parameters, ...parameters }
    };

    return await this.generatePrediction(model, context);
  }

  async validatePrediction(predictionId: string, actualOutcome: any): Promise<void> {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) {
      throw new Error(`Prediction not found: ${predictionId}`);
    }

    prediction.status = 'validated';
    
    // Use this for model improvement
    await this.updateModelAccuracy(prediction.modelId, prediction, actualOutcome);
  }

  private async updateModelAccuracy(
    modelId: string, 
    prediction: Prediction, 
    actualOutcome: any
  ): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) return;

    // Simple accuracy update (in production, this would be more sophisticated)
    const accuracy = this.calculatePredictionAccuracy(prediction, actualOutcome);
    model.accuracy = (model.accuracy * 0.9) + (accuracy * 0.1); // Weighted average
    
    await this.logModelUpdate(model, accuracy);
  }

  private calculatePredictionAccuracy(prediction: Prediction, actualOutcome: any): number {
    // Simplified accuracy calculation
    // In production, this would be more sophisticated based on prediction type
    try {
      if (typeof prediction.prediction === 'boolean' && typeof actualOutcome === 'boolean') {
        return prediction.prediction === actualOutcome ? 1.0 : 0.0;
      }
      
      if (typeof prediction.prediction === 'number' && typeof actualOutcome === 'number') {
        const error = Math.abs(prediction.prediction - actualOutcome) / Math.max(actualOutcome, 1);
        return Math.max(0, 1 - error);
      }
      
      return 0.5; // Default for complex predictions
    } catch {
      return 0.5;
    }
  }

  private async logModelUpdate(model: PredictionModel, accuracy: number): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'model_accuracy_updated',
        module: 'analytics',
        event_message: `Model ${model.name} accuracy updated`,
        severity: 'info',
        metadata: {
          model_id: model.id,
          old_accuracy: model.accuracy,
          new_accuracy: accuracy,
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log model update:', error);
    }
  }

  // Analytics and reporting
  async getAnalyticsSummary(): Promise<{
    totalPredictions: number;
    activePredictions: number;
    totalInsights: number;
    avgConfidence: number;
    modelPerformance: any[];
    topInsightCategories: Array<{ category: string; count: number }>;
  }> {
    const predictions = Array.from(this.predictions.values());
    const activePredictions = predictions.filter(p => p.status === 'active');
    
    const avgConfidence = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
      : 0;

    const modelPerformance = await this.getModelPerformance();

    const categoryCount = this.insights.reduce((acc, insight) => {
      acc[insight.category] = (acc[insight.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topInsightCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalPredictions: predictions.length,
      activePredictions: activePredictions.length,
      totalInsights: this.insights.length,
      avgConfidence,
      modelPerformance,
      topInsightCategories
    };
  }
}

export const predictiveAnalyticsEngine = new PredictiveAnalyticsEngine();
