import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Equipment {
  id: string;
  yacht_id: string;
  equipment_name: string;
  equipment_type: string;
  equipment_category: string;
  manufacturer?: string;
  model_number?: string;
  location_description?: string;
  operational_status: string;
  health_score?: number;
  ar_model_url?: string;
  ar_instructions_url?: string;
  specifications: Record<string, any>;
  last_maintenance_date?: string;
  next_scheduled_maintenance?: string;
  maintenance_overdue: boolean;
}

export interface ARSpatialAnchor {
  id: string;
  yacht_id: string;
  equipment_id?: string;
  anchor_type: string;
  anchor_name: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_factor: number;
  ar_content_type: string;
  ar_content_url?: string;
  ar_content_data?: Record<string, any>;
  is_visible: boolean;
  interaction_enabled: boolean;
}

export interface MaintenancePrediction {
  id: string;
  equipment_id: string;
  prediction_type: string;
  prediction_category: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  probability_of_failure?: number;
  predicted_failure_date?: string;
  remaining_useful_life_days?: number;
  recommended_action: string;
  maintenance_type?: string;
  estimated_repair_cost?: number;
  urgency_level?: string;
  alert_status: string;
  equipment?: Equipment;
}

export interface ARTroubleshootingSession {
  id: string;
  user_id: string;
  yacht_id: string;
  equipment_id?: string;
  session_type: string;
  session_status: string;
  reported_issue?: string;
  issue_category?: string;
  issue_severity?: string;
  current_step: number;
  total_steps: number;
  steps_completed: number;
  step_history: any[];
  diagnostic_results?: Record<string, any>;
  issue_resolved?: boolean;
  user_satisfaction_rating?: number;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

export interface TroubleshootingStep {
  step: number;
  title: string;
  description: string;
  ar_overlay?: string;
  estimated_duration: number;
  safety_notes?: string[];
  required_tools?: string[];
  validation_criteria?: string[];
}

// Main AR troubleshooting hook
export function useARTroubleshooting() {
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ARTroubleshootingSession | null>(null);
  const { toast } = useToast();

  const callARAPI = useCallback(async (action: string, data?: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('ar-troubleshooting', {
        body: {
          action,
          ...data
        }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`AR ${action} error:`, error);
      toast({
        title: "AR Error",
        description: `Failed to ${action}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const startSession = useCallback(async (
    yachtId: string,
    equipmentId?: string,
    issueDescription?: string
  ) => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const result = await callARAPI('start_session', {
        yacht_id: yachtId,
        equipment_id: equipmentId,
        user_id: user.data.user.id,
        issue_description: issueDescription,
        data: {
          device_info: await getDeviceInfo()
        }
      });

      // Load session details
      const { data: session, error } = await supabase
        .from('ar_troubleshooting_sessions')
        .select('*')
        .eq('id', result.session_id)
        .single();

      if (error) throw error;
      setCurrentSession(session);

      toast({
        title: "AR Session Started",
        description: "Troubleshooting session initialized",
      });

      return {
        session_id: result.session_id,
        equipment: result.equipment,
        anchors: result.anchors
      };
    } finally {
      setLoading(false);
    }
  }, [callARAPI, toast]);

  const updateSession = useCallback(async (
    sessionId: string,
    updateData: {
      step_completed?: boolean;
      current_step?: number;
      steps_completed?: number;
      step_duration?: number;
      diagnostic_result?: any;
      photos_taken?: string[];
      issue_resolved?: boolean;
    }
  ) => {
    setLoading(true);
    try {
      await callARAPI('update_session', {
        session_id: sessionId,
        data: updateData
      });

      // Refresh session data
      if (currentSession) {
        const { data: session, error } = await supabase
          .from('ar_troubleshooting_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (!error) {
          setCurrentSession(session);
        }
      }

      return true;
    } finally {
      setLoading(false);
    }
  }, [callARAPI, currentSession]);

  const endSession = useCallback(async (
    sessionId: string,
    issueResolved: boolean,
    satisfactionRating?: number
  ) => {
    try {
      await updateSession(sessionId, {
        issue_resolved: issueResolved
      });

      if (satisfactionRating) {
        await supabase
          .from('ar_troubleshooting_sessions')
          .update({
            user_satisfaction_rating: satisfactionRating,
            completed_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      setCurrentSession(null);

      toast({
        title: "Session Completed",
        description: issueResolved ? "Issue resolved successfully" : "Session ended",
      });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [updateSession, toast]);

  return {
    loading,
    currentSession,
    startSession,
    updateSession,
    endSession
  };
}

// Equipment management hook
export function useEquipmentManagement(yachtId?: string) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadEquipment = useCallback(async (equipmentId?: string) => {
    if (!yachtId) return;

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ar-troubleshooting', {
        body: {
          action: 'get_equipment',
          yacht_id: yachtId,
          equipment_id: equipmentId
        }
      });

      if (error) throw error;
      setEquipment(result.equipment || []);
    } catch (error) {
      console.error('Failed to load equipment:', error);
      toast({
        title: "Error",
        description: "Failed to load equipment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [yachtId, toast]);

  const getEquipmentById = useCallback((equipmentId: string) => {
    return equipment.find(eq => eq.id === equipmentId);
  }, [equipment]);

  const getEquipmentByType = useCallback((equipmentType: string) => {
    return equipment.filter(eq => eq.equipment_type === equipmentType);
  }, [equipment]);

  const getEquipmentByStatus = useCallback((status: string) => {
    return equipment.filter(eq => eq.operational_status === status);
  }, [equipment]);

  const getMaintenanceOverdue = useCallback(() => {
    return equipment.filter(eq => eq.maintenance_overdue);
  }, [equipment]);

  useEffect(() => {
    if (yachtId) {
      loadEquipment();
    }
  }, [yachtId, loadEquipment]);

  return {
    equipment,
    loading,
    loadEquipment,
    getEquipmentById,
    getEquipmentByType,
    getEquipmentByStatus,
    getMaintenanceOverdue
  };
}

// AR spatial anchors hook
export function useARAnchors(yachtId?: string) {
  const [anchors, setAnchors] = useState<ARSpatialAnchor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadAnchors = useCallback(async (
    equipmentId?: string,
    position?: { x: number; y: number; z: number }
  ) => {
    if (!yachtId) return;

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ar-troubleshooting', {
        body: {
          action: 'get_anchors',
          yacht_id: yachtId,
          equipment_id: equipmentId,
          position
        }
      });

      if (error) throw error;
      setAnchors(result.anchors || []);
    } catch (error) {
      console.error('Failed to load AR anchors:', error);
      toast({
        title: "Error",
        description: "Failed to load AR anchors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [yachtId, toast]);

  const getAnchorsByType = useCallback((anchorType: string) => {
    return anchors.filter(anchor => anchor.anchor_type === anchorType);
  }, [anchors]);

  const getEquipmentAnchors = useCallback((equipmentId: string) => {
    return anchors.filter(anchor => anchor.equipment_id === equipmentId);
  }, [anchors]);

  useEffect(() => {
    if (yachtId) {
      loadAnchors();
    }
  }, [yachtId, loadAnchors]);

  return {
    anchors,
    loading,
    loadAnchors,
    getAnchorsByType,
    getEquipmentAnchors
  };
}

// Predictive maintenance hook
export function usePredictiveMaintenance(yachtId?: string) {
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPredictions = useCallback(async (equipmentId?: string) => {
    if (!yachtId) return;

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ar-troubleshooting', {
        body: {
          action: 'get_predictions',
          yacht_id: yachtId,
          equipment_id: equipmentId
        }
      });

      if (error) throw error;
      setPredictions(result.predictions || []);
    } catch (error) {
      console.error('Failed to load predictions:', error);
      toast({
        title: "Error",
        description: "Failed to load maintenance predictions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [yachtId, toast]);

  const generatePredictions = useCallback(async (
    equipmentId: string,
    sensorData: Record<string, number>
  ) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ar-troubleshooting', {
        body: {
          action: 'predict_maintenance',
          equipment_id: equipmentId,
          sensor_data: sensorData
        }
      });

      if (error) throw error;

      toast({
        title: "Predictions Generated",
        description: `Generated ${result.predictions?.length || 0} maintenance predictions`,
      });

      // Reload predictions
      await loadPredictions();

      return result.predictions;
    } finally {
      setLoading(false);
    }
  }, [loadPredictions, toast]);

  const createWorkOrder = useCallback(async (
    equipmentId: string,
    predictionId: string,
    workOrderData: {
      title: string;
      description: string;
      priority: string;
      work_order_type: string;
      estimated_cost?: number;
      estimated_duration_hours?: number;
      instructions?: string;
      safety_precautions?: string[];
      required_tools?: string[];
      required_parts?: any[];
    }
  ) => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase.functions.invoke('ar-troubleshooting', {
        body: {
          action: 'create_work_order',
          yacht_id: yachtId,
          equipment_id: equipmentId,
          data: {
            ...workOrderData,
            prediction_id: predictionId,
            created_by: user.data.user.id
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Work Order Created",
        description: "Maintenance work order has been created",
      });

      return result.work_order_id;
    } finally {
      setLoading(false);
    }
  }, [yachtId, toast]);

  const getPredictionsByRisk = useCallback((riskLevel: string) => {
    return predictions.filter(pred => pred.risk_level === riskLevel);
  }, [predictions]);

  const getCriticalPredictions = useCallback(() => {
    return predictions.filter(pred => 
      pred.risk_level === 'critical' || pred.urgency_level === 'immediate'
    );
  }, [predictions]);

  const getUpcomingMaintenance = useCallback((days = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return predictions.filter(pred => 
      pred.predicted_failure_date && 
      new Date(pred.predicted_failure_date) <= futureDate
    );
  }, [predictions]);

  useEffect(() => {
    if (yachtId) {
      loadPredictions();
    }
  }, [yachtId, loadPredictions]);

  return {
    predictions,
    loading,
    loadPredictions,
    generatePredictions,
    createWorkOrder,
    getPredictionsByRisk,
    getCriticalPredictions,
    getUpcomingMaintenance
  };
}

// Sensor data analysis hook
export function useSensorAnalysis() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeSensorData = useCallback(async (
    equipmentId: string,
    sensorData: Record<string, number>
  ) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ar-troubleshooting', {
        body: {
          action: 'analyze_sensor_data',
          equipment_id: equipmentId,
          sensor_data: sensorData
        }
      });

      if (error) throw error;

      if (result.anomalies?.length > 0) {
        toast({
          title: "Anomalies Detected",
          description: `${result.anomalies.length} sensor anomalies found`,
          variant: "destructive",
        });
      }

      return {
        health_score: result.health_score,
        anomalies: result.anomalies || [],
        recommendations: result.recommendations || []
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const storeSensorReading = useCallback(async (
    equipmentId: string,
    sensorType: string,
    value: number,
    unit: string
  ) => {
    try {
      const { error } = await supabase
        .from('equipment_sensor_data')
        .insert({
          equipment_id: equipmentId,
          sensor_type: sensorType,
          measurement_unit: unit,
          value,
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to store sensor reading:', error);
      return false;
    }
  }, []);

  return {
    loading,
    analyzeSensorData,
    storeSensorReading
  };
}

// Troubleshooting instructions hook
export function useTroubleshootingInstructions() {
  const [instructions, setInstructions] = useState<TroubleshootingStep[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInstructions = useCallback(async (
    equipmentId: string,
    issueDescription?: string
  ) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('ar-troubleshooting', {
        body: {
          action: 'get_instructions',
          equipment_id: equipmentId,
          issue_description: issueDescription
        }
      });

      if (error) throw error;
      setInstructions(result.instructions || []);
    } catch (error) {
      console.error('Failed to load instructions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    instructions,
    loading,
    loadInstructions
  };
}

// Camera and device utilities
export function useARCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera for AR
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsActive(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    if (context) {
      context.drawImage(videoRef.current, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    
    return null;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    hasPermission,
    startCamera,
    stopCamera,
    capturePhoto
  };
}

// Utility functions
async function getDeviceInfo() {
  return {
    user_agent: navigator.userAgent,
    screen_resolution: {
      width: screen.width,
      height: screen.height
    },
    device_pixel_ratio: window.devicePixelRatio,
    timestamp: new Date().toISOString()
  };
}