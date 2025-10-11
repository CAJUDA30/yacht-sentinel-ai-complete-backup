import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useToast } from '@/components/ui/use-toast';
import { useEnterpriseData } from './useEnterpriseData';

export interface YachtStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance' | 'transit';
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  systems: {
    engines: 'good' | 'warning' | 'critical';
    fuel: number;
    battery: number;
    generator: number;
  };
  crew: number;
  guests: number;
  maintenance: {
    nextDue: string;
    overdue: number;
  };
  weather: {
    condition: string;
    temperature: number;
    windSpeed: number;
  };
  lastUpdate: string;
}

export interface SystemAlert {
  id: string;
  yachtId?: string;
  type: 'fuel' | 'maintenance' | 'inventory' | 'crew' | 'safety' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  category: string;
  acknowledged: boolean;
  resolved: boolean;
  timestamp: string;
}

export interface FleetMetrics {
  totalYachts: number;
  activeYachts: number;
  activeAlerts: number;
  totalCrew: number;
  maintenanceAlerts: number;
}

export const useOperationsData = () => {
  const [yachts, setYachts] = useState<YachtStatus[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics>({
    totalYachts: 0,
    activeYachts: 0,
    activeAlerts: 0,
    totalCrew: 0,
    maintenanceAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { isConnected, broadcastUpdate } = useRealtime();
  const { toast } = useToast();
  const { metrics: enterpriseMetrics } = useEnterpriseData();

  const fetchYachtStatuses = useCallback(async () => {
    try {
      // Get user's yacht access
      const { data: yachtAccess } = await supabase.rpc('get_user_yacht_access_safe');
      
      if (!yachtAccess || yachtAccess.length === 0) {
        setYachts([]);
        return;
      }

      const yachtIds = yachtAccess.map(access => access.yacht_id);

      // Fetch yacht profiles
      const { data: yachtProfiles } = await supabase
        .from('yacht_profiles')
        .select('*')
        .in('id', yachtIds);

      // Fetch crew counts
      const { data: crewMembers } = await supabase
        .from('crew_members')
        .select('yacht_id')
        .in('yacht_id', yachtIds);

      // Fetch guest counts from charters
      const { data: guestCharters } = await supabase
        .from('guest_charters')
        .select('yacht_id, guest_count')
        .in('yacht_id', yachtIds)
        .eq('status', 'active');

      // Fetch current positions
      const { data: positions } = await supabase
        .from('yacht_positions')
        .select('*')
        .in('yacht_id', yachtIds)
        .order('recorded_at', { ascending: false });

      // Get weather data from Windy API for each yacht
      const getWeatherData = async (lat: number, lng: number) => {
        try {
          const response = await supabase.functions.invoke('windy-weather', {
            body: { latitude: lat, longitude: lng }
          });
          return response.data || { condition: 'Clear', temperature: 22, windSpeed: 5 };
        } catch {
          return { condition: 'Clear', temperature: 22, windSpeed: 5 };
        }
      };

      // Combine data into yacht status objects with enhanced real-time simulation
      const yachtStatuses: YachtStatus[] = await Promise.all(
        (yachtProfiles || []).map(async (profile) => {
          const crewCount = crewMembers?.filter(c => c.yacht_id === profile.id).length || 0;
          const guestCount = guestCharters?.find(g => g.yacht_id === profile.id)?.guest_count || 0;
          const position = positions?.find(p => p.yacht_id === profile.id);
          
          // Enhanced simulation based on real data
          const isOnline = Math.random() > 0.2; // 80% chance of being online
          const fuelLevel = enterpriseMetrics.fuelLevel || (60 + Math.random() * 40);
          const batteryLevel = enterpriseMetrics.batteryLevel || (70 + Math.random() * 30);
          
          const lat = position?.latitude || (43.7 + (Math.random() - 0.5) * 0.2);
          const lng = position?.longitude || (7.4 + (Math.random() - 0.5) * 0.2);
          
          const weather = await getWeatherData(lat, lng);

          return {
            id: profile.id,
            name: profile.name || 'Unknown Yacht',
            status: isOnline ? 
              (Math.random() > 0.9 ? 'maintenance' : (Math.random() > 0.8 ? 'transit' : 'online')) : 
              'offline',
            location: {
              lat,
              lng,
              name: 'Monaco Harbor', // Default location name
            },
            systems: {
              engines: fuelLevel > 20 ? 'good' : (fuelLevel > 10 ? 'warning' : 'critical'),
              fuel: fuelLevel,
              battery: batteryLevel,
              generator: Math.floor(Math.random() * 2000),
            },
            crew: crewCount,
            guests: guestCount,
            maintenance: {
              nextDue: new Date(Date.now() + (7 + Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              overdue: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0,
            },
            weather,
            lastUpdate: new Date().toISOString(),
          };
        })
      );

      setYachts(yachtStatuses);
      
      // Update fleet metrics
      const metrics: FleetMetrics = {
        totalYachts: yachtStatuses.length,
        activeYachts: yachtStatuses.filter(y => y.status === 'online').length,
        activeAlerts: 0, // Will be updated when alerts are fetched
        totalCrew: yachtStatuses.reduce((sum, y) => sum + y.crew, 0),
        maintenanceAlerts: yachtStatuses.filter(y => y.maintenance.overdue > 0).length,
      };

      setFleetMetrics(prev => ({ ...prev, ...metrics }));
      
    } catch (error) {
      console.error('Error fetching yacht statuses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch yacht status data",
        variant: "destructive",
      });
    }
  }, [toast, enterpriseMetrics]);

  const fetchSystemAlerts = useCallback(async () => {
    try {
      // Get user's yacht access
      const { data: yachtAccess } = await supabase.rpc('get_user_yacht_access_safe');
      
      if (!yachtAccess || yachtAccess.length === 0) {
        setAlerts([]);
        return;
      }

      const yachtIds = yachtAccess.map(access => access.yacht_id);

      // Fetch inventory alerts (real data)
      const { data: inventoryAlerts } = await supabase
        .from('inventory_alerts')
        .select('*, inventory_items(name)')
        .eq('dismissed', false);

      // Create enhanced alerts from real inventory data plus simulated system alerts
      const realAlerts: SystemAlert[] = (inventoryAlerts || []).map(alert => ({
        id: alert.id,
        yachtId: yachtIds[0], // Assign to first available yacht
        type: 'inventory' as const,
        severity: alert.severity as any,
        title: `Low Stock: ${alert.inventory_items?.name || 'Unknown Item'}`,
        description: alert.message || 'Stock level is below minimum threshold',
        category: 'inventory',
        acknowledged: false,
        resolved: alert.dismissed,
        timestamp: alert.created_at,
      }));

      // Add simulated system alerts for demonstration
      const simulatedAlerts: SystemAlert[] = [
        {
          id: 'fuel-low-001',
          yachtId: yachtIds[0],
          type: 'fuel' as const,
          severity: 'high' as const,
          title: 'Low Fuel Level',
          description: 'Main fuel tank below 15%. Consider refueling soon.',
          category: 'system',
          acknowledged: false,
          resolved: false,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'maint-due-002',
          yachtId: yachtIds[0],
          type: 'maintenance' as const,
          severity: 'medium' as const,
          title: 'Engine Maintenance Due',
          description: 'Regular engine servicing is overdue by 3 days.',
          category: 'maintenance',
          acknowledged: false,
          resolved: false,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ].filter(() => Math.random() > 0.3); // Show some alerts randomly

      const allAlerts = [...realAlerts, ...simulatedAlerts];
      setAlerts(allAlerts);
      
      // Update active alerts count
      setFleetMetrics(prev => ({
        ...prev,
        activeAlerts: allAlerts.filter(a => !a.resolved && !a.acknowledged).length,
      }));

    } catch (error) {
      console.error('Error fetching system alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system alerts",
        variant: "destructive",
      });
    }
  }, [toast]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      // Update local state immediately for better UX
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true }
            : alert
        )
      );

      // Try to update in database if it's a real alert
      if (alertId.startsWith('inv-')) {
        await supabase
          .from('inventory_alerts')
          .update({ dismissed: true })
          .eq('id', alertId);
      }

      // Broadcast update
      broadcastUpdate('system_alert_acknowledged', { alertId });

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged",
      });

    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  }, [broadcastUpdate, toast]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchYachtStatuses(),
      fetchSystemAlerts(),
    ]);
    setLastUpdate(new Date());
    setLoading(false);
  }, [fetchYachtStatuses, fetchSystemAlerts]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set up real-time subscriptions for existing tables
  useEffect(() => {
    if (!isConnected) return;

    const channel = supabase
      .channel('operations_data_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory_alerts' },
        () => {
          console.log('Inventory alerts changed, refreshing...');
          fetchSystemAlerts();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'yacht_positions' },
        () => {
          console.log('Yacht positions changed, refreshing...');
          fetchYachtStatuses();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'crew_members' },
        () => {
          console.log('Crew data changed, refreshing...');
          fetchYachtStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isConnected, fetchYachtStatuses, fetchSystemAlerts]);

  // Auto-refresh every 30 seconds for real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refreshData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, refreshData]);

  return {
    yachts,
    alerts,
    fleetMetrics,
    loading,
    lastUpdate,
    refreshData,
    acknowledgeAlert,
  };
};