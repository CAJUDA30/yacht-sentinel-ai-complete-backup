import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NMEADevice {
  id: string;
  yacht_id: string;
  device_name: string;
  device_type: string;
  manufacturer?: string;
  model?: string;
  can_address: number;
  pgn_codes: number[];
  is_active: boolean;
  last_seen_at: string;
  location_description?: string;
}

export interface SensorData {
  id: string;
  device_id: string;
  pgn: number;
  timestamp: string;
  parsed_data: Record<string, any>;
  signal_quality: number;
  is_valid: boolean;
}

export interface SensorAlert {
  id: string;
  alert_rule_id: string;
  device_id: string;
  parameter_name: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  alert_message: string;
  triggered_value: number;
  threshold_value: number;
  is_acknowledged: boolean;
  is_resolved: boolean;
  created_at: string;
}

export interface DeviceHealth {
  id: string;
  device_id: string;
  status: 'online' | 'offline' | 'error' | 'maintenance' | 'unknown';
  last_data_received: string;
  health_score: number;
  error_count_24h: number;
  signal_strength?: number;
  battery_level?: number;
  uptime_hours: number;
}

export interface AlertRule {
  id: string;
  device_id?: string;
  parameter_name: string;
  rule_name: string;
  condition_type: 'threshold_high' | 'threshold_low' | 'range_violation' | 'rate_change' | 'device_offline';
  threshold_value?: number;
  threshold_range?: { min: number; max: number };
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  is_active: boolean;
}

// Hook for managing NMEA devices
export function useNMEADevices(yachtId?: string) {
  const [devices, setDevices] = useState<NMEADevice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDevices = useCallback(async () => {
    if (!yachtId) return;

    try {
      const { data, error } = await supabase
        .from('nmea_devices')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('device_name');

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Failed to fetch NMEA devices:', error);
      toast({
        title: "Error",
        description: "Failed to load NMEA devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [yachtId, toast]);

  const addDevice = useCallback(async (deviceData: Partial<NMEADevice>) => {
    if (!yachtId) return null;

    try {
      const { data, error } = await supabase
        .from('nmea_devices')
        .insert({ ...deviceData, yacht_id: yachtId })
        .select()
        .single();

      if (error) throw error;

      setDevices(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "NMEA device added successfully",
      });
      return data;
    } catch (error) {
      console.error('Failed to add device:', error);
      toast({
        title: "Error",
        description: "Failed to add NMEA device",
        variant: "destructive",
      });
      return null;
    }
  }, [yachtId, toast]);

  const updateDevice = useCallback(async (deviceId: string, updates: Partial<NMEADevice>) => {
    try {
      const { data, error } = await supabase
        .from('nmea_devices')
        .update(updates)
        .eq('id', deviceId)
        .select()
        .single();

      if (error) throw error;

      setDevices(prev => prev.map(d => d.id === deviceId ? data : d));
      toast({
        title: "Success",
        description: "Device updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Failed to update device:', error);
      toast({
        title: "Error",
        description: "Failed to update device",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const deleteDevice = useCallback(async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('nmea_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      setDevices(prev => prev.filter(d => d.id !== deviceId));
      toast({
        title: "Success",
        description: "Device deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete device:', error);
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    loading,
    addDevice,
    updateDevice,
    deleteDevice,
    refetch: fetchDevices
  };
}

// Hook for real-time sensor data
export function useSensorData(yachtId?: string, deviceId?: string, limit = 100) {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealTime, setIsRealTime] = useState(false);
  const subscriptionRef = useRef<any>(null);

  const fetchSensorData = useCallback(async () => {
    if (!yachtId) return;

    try {
      let query = supabase
        .from('nmea_sensor_data')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSensorData(data || []);
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
    } finally {
      setLoading(false);
    }
  }, [yachtId, deviceId, limit]);

  const startRealTime = useCallback(() => {
    if (!yachtId || isRealTime) return;

    const channel = supabase
      .channel('nmea_sensor_data')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'nmea_sensor_data',
        filter: `yacht_id=eq.${yachtId}`
      }, (payload) => {
        setSensorData(prev => [payload.new as SensorData, ...prev.slice(0, limit - 1)]);
      })
      .subscribe();

    subscriptionRef.current = channel;
    setIsRealTime(true);
  }, [yachtId, isRealTime, limit]);

  const stopRealTime = useCallback(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    setIsRealTime(false);
  }, []);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  useEffect(() => {
    return () => {
      stopRealTime();
    };
  }, [stopRealTime]);

  return {
    sensorData,
    loading,
    isRealTime,
    startRealTime,
    stopRealTime,
    refetch: fetchSensorData
  };
}

// Hook for sensor alerts management
export function useSensorAlerts(yachtId?: string) {
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = useCallback(async () => {
    if (!yachtId) return;

    try {
      const { data, error } = await supabase
        .from('sensor_alerts')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
      setUnreadCount(data?.filter(a => !a.is_acknowledged).length || 0);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [yachtId]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('sensor_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => 
        a.id === alertId 
          ? { ...a, is_acknowledged: true, acknowledged_at: new Date().toISOString() }
          : a
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  }, [toast]);

  const resolveAlert = useCallback(async (alertId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('sensor_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => 
        a.id === alertId 
          ? { 
              ...a, 
              is_resolved: true, 
              resolved_at: new Date().toISOString(),
              resolution_notes: notes
            }
          : a
      ));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to new alerts
    const channel = supabase
      .channel('sensor_alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sensor_alerts',
        filter: yachtId ? `yacht_id=eq.${yachtId}` : undefined
      }, (payload) => {
        const newAlert = payload.new as SensorAlert;
        setAlerts(prev => [newAlert, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast for critical alerts
        if (newAlert.severity === 'critical' || newAlert.severity === 'emergency') {
          toast({
            title: `${newAlert.severity.toUpperCase()} Alert`,
            description: newAlert.alert_message,
            variant: "destructive",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [yachtId, fetchAlerts, toast]);

  return {
    alerts,
    unreadCount,
    loading,
    acknowledgeAlert,
    resolveAlert,
    refetch: fetchAlerts
  };
}

// Hook for device health monitoring
export function useDeviceHealth(yachtId?: string) {
  const [deviceHealth, setDeviceHealth] = useState<DeviceHealth[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeviceHealth = useCallback(async () => {
    if (!yachtId) return;

    try {
      const { data, error } = await supabase
        .from('device_health_status')
        .select(`
          *,
          nmea_devices(device_name, device_type)
        `)
        .eq('yacht_id', yachtId);

      if (error) throw error;
      setDeviceHealth(data || []);
    } catch (error) {
      console.error('Failed to fetch device health:', error);
    } finally {
      setLoading(false);
    }
  }, [yachtId]);

  const getHealthSummary = useCallback(() => {
    const total = deviceHealth.length;
    const online = deviceHealth.filter(d => d.status === 'online').length;
    const offline = deviceHealth.filter(d => d.status === 'offline').length;
    const error = deviceHealth.filter(d => d.status === 'error').length;
    const avgHealth = total > 0 
      ? deviceHealth.reduce((sum, d) => sum + d.health_score, 0) / total 
      : 0;

    return { total, online, offline, error, avgHealth };
  }, [deviceHealth]);

  useEffect(() => {
    fetchDeviceHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDeviceHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchDeviceHealth]);

  return {
    deviceHealth,
    loading,
    healthSummary: getHealthSummary(),
    refetch: fetchDeviceHealth
  };
}

// Hook for alert rules management
export function useAlertRules(yachtId?: string) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRules = useCallback(async () => {
    if (!yachtId) return;

    try {
      const { data, error } = await supabase
        .from('sensor_alert_rules')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('rule_name');

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Failed to fetch alert rules:', error);
    } finally {
      setLoading(false);
    }
  }, [yachtId]);

  const createRule = useCallback(async (ruleData: Partial<AlertRule>) => {
    if (!yachtId) return null;

    try {
      const { data, error } = await supabase
        .from('sensor_alert_rules')
        .insert({ ...ruleData, yacht_id: yachtId })
        .select()
        .single();

      if (error) throw error;

      setRules(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Alert rule created successfully",
      });
      return data;
    } catch (error) {
      console.error('Failed to create rule:', error);
      toast({
        title: "Error",
        description: "Failed to create alert rule",
        variant: "destructive",
      });
      return null;
    }
  }, [yachtId, toast]);

  const updateRule = useCallback(async (ruleId: string, updates: Partial<AlertRule>) => {
    try {
      const { data, error } = await supabase
        .from('sensor_alert_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;

      setRules(prev => prev.map(r => r.id === ruleId ? data : r));
      toast({
        title: "Success",
        description: "Alert rule updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Failed to update rule:', error);
      toast({
        title: "Error",
        description: "Failed to update alert rule",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('sensor_alert_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setRules(prev => prev.filter(r => r.id !== ruleId));
      toast({
        title: "Success",
        description: "Alert rule deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete alert rule",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    createRule,
    updateRule,
    deleteRule,
    refetch: fetchRules
  };
}

// Hook for NMEA data processing simulation (for testing)
export function useNMEASimulator(yachtId?: string) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStats, setSimulationStats] = useState({
    messagesGenerated: 0,
    devicesSimulated: 0,
    lastUpdate: null as Date | null
  });

  const startSimulation = useCallback(async () => {
    if (!yachtId || isSimulating) return;

    setIsSimulating(true);
    
    // Generate sample NMEA data
    const simulateNMEAData = async () => {
      const sampleMessages = [
        {
          pgn: 127488,
          source: 0,
          priority: 6,
          data: new Uint8Array([0x64, 0x19, 0x4B, 0x00]), // Engine data
          timestamp: Date.now()
        },
        {
          pgn: 128259,
          source: 1,
          priority: 2,
          data: new Uint8Array([0x96, 0x00, 0x00]), // Speed data
          timestamp: Date.now()
        }
      ];

      try {
        const { data, error } = await supabase.functions.invoke('nmea-data-processor', {
          body: {
            yacht_id: yachtId,
            device_name: 'Simulator Device',
            device_type: 'simulation',
            messages: sampleMessages
          }
        });

        if (!error) {
          setSimulationStats(prev => ({
            messagesGenerated: prev.messagesGenerated + sampleMessages.length,
            devicesSimulated: 2,
            lastUpdate: new Date()
          }));
        }
      } catch (error) {
        console.error('Simulation error:', error);
      }
    };

    // Run simulation every 5 seconds
    const interval = setInterval(simulateNMEAData, 5000);
    
    // Initial run
    simulateNMEAData();

    return () => {
      clearInterval(interval);
      setIsSimulating(false);
    };
  }, [yachtId, isSimulating]);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
  }, []);

  return {
    isSimulating,
    simulationStats,
    startSimulation,
    stopSimulation
  };
}