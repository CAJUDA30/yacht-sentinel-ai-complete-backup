import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EquipmentHealthMetric {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  metricTimestamp: string;
  overallHealthScore: number;
  temperature?: number;
  vibrationLevel?: number;
  pressure?: number;
  operatingHours: number;
  maintenanceUrgency: 'low' | 'medium' | 'high' | 'critical';
  predictedFailureDate?: string;
  sensorData: Record<string, any>;
  anomaliesDetected: string[];
  recommendations: string[];
  createdAt: string;
}

export const useEquipmentHealth = (equipmentId?: string) => {
  const [healthMetrics, setHealthMetrics] = useState<EquipmentHealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealthMetrics = async () => {
    try {
      let query = supabase
        .from('equipment_health_metrics')
        .select(`
          *,
          equipment (
            name
          )
        `);

      if (equipmentId) {
        query = query.eq('equipment_id', equipmentId);
      }

      const { data, error } = await query.order('metric_timestamp', { ascending: false });

      if (error) throw error;

      const transformedMetrics: EquipmentHealthMetric[] = data.map(metric => ({
        id: metric.id,
        equipmentId: metric.equipment_id,
        equipmentName: metric.equipment?.name,
        metricTimestamp: metric.metric_timestamp,
        overallHealthScore: parseFloat(metric.overall_health_score.toString()),
        temperature: metric.temperature ? parseFloat(metric.temperature.toString()) : undefined,
        vibrationLevel: metric.vibration_level ? parseFloat(metric.vibration_level.toString()) : undefined,
        pressure: metric.pressure ? parseFloat(metric.pressure.toString()) : undefined,
        operatingHours: metric.operating_hours,
        maintenanceUrgency: metric.maintenance_urgency as 'low' | 'medium' | 'high' | 'critical',
        predictedFailureDate: metric.predicted_failure_date,
        sensorData: (metric.sensor_data as Record<string, any>) || {},
        anomaliesDetected: (metric.anomalies_detected as string[]) || [],
        recommendations: (metric.recommendations as string[]) || [],
        createdAt: metric.created_at
      }));

      setHealthMetrics(transformedMetrics);
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      toast.error('Failed to load equipment health metrics');
    } finally {
      setLoading(false);
    }
  };

  const addHealthMetric = async (metricData: Omit<EquipmentHealthMetric, 'id' | 'createdAt' | 'equipmentName'>) => {
    try {
      const { data, error } = await supabase
        .from('equipment_health_metrics')
        .insert({
          equipment_id: metricData.equipmentId,
          metric_timestamp: metricData.metricTimestamp,
          overall_health_score: metricData.overallHealthScore,
          temperature: metricData.temperature,
          vibration_level: metricData.vibrationLevel,
          pressure: metricData.pressure,
          operating_hours: metricData.operatingHours,
          maintenance_urgency: metricData.maintenanceUrgency,
          predicted_failure_date: metricData.predictedFailureDate,
          sensor_data: metricData.sensorData,
          anomalies_detected: metricData.anomaliesDetected,
          recommendations: metricData.recommendations
        })
        .select()
        .single();

      if (error) throw error;

      await fetchHealthMetrics(); // Refresh to get equipment name
      toast.success('Health metric recorded successfully');
      return data;
    } catch (error) {
      console.error('Error adding health metric:', error);
      toast.error('Failed to record health metric');
      throw error;
    }
  };

  const getLatestHealthScores = () => {
    const latestMetrics = new Map<string, EquipmentHealthMetric>();
    
    healthMetrics.forEach(metric => {
      const existing = latestMetrics.get(metric.equipmentId);
      if (!existing || new Date(metric.metricTimestamp) > new Date(existing.metricTimestamp)) {
        latestMetrics.set(metric.equipmentId, metric);
      }
    });

    return Array.from(latestMetrics.values());
  };

  const getCriticalEquipment = () => {
    return getLatestHealthScores().filter(metric => 
      metric.maintenanceUrgency === 'critical' || metric.overallHealthScore < 50
    );
  };

  const getAverageHealthScore = () => {
    const latest = getLatestHealthScores();
    if (latest.length === 0) return 0;
    
    const total = latest.reduce((sum, metric) => sum + metric.overallHealthScore, 0);
    return total / latest.length;
  };

  useEffect(() => {
    fetchHealthMetrics();

    // Set up real-time subscription
    const channel = supabase
      .channel('equipment_health_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'equipment_health_metrics' },
        () => {
          fetchHealthMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipmentId]);

  return {
    healthMetrics,
    loading,
    addHealthMetric,
    getLatestHealthScores,
    getCriticalEquipment,
    getAverageHealthScore,
    refetch: fetchHealthMetrics
  };
};