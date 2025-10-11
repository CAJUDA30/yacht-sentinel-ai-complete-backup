import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/contexts/RealtimeContext';

interface EnterpriseMetrics {
  fuelLevel: number;
  batteryLevel: number;
  crewCount: number;
  guestCount: number;
  maintenanceAlerts: number;
  financialSummary: string;
  inventoryCount: number;
  lowStockItems: number;
  criticalAlerts: number;
}

export const useEnterpriseData = () => {
  const [metrics, setMetrics] = useState<EnterpriseMetrics>({
    fuelLevel: 0,
    batteryLevel: 0,
    crewCount: 0,
    guestCount: 0,
    maintenanceAlerts: 0,
    financialSummary: "Loading...",
    inventoryCount: 0,
    lowStockItems: 0,
    criticalAlerts: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { broadcastUpdate } = useRealtime();

  const fetchInventoryMetrics = async () => {
    try {
      // Get total inventory count
      const { count: totalItems } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true });

      // Get low stock items
      const { data: lowStockData } = await supabase
        .from('inventory_items')
        .select('id, quantity, min_stock')
        .not('min_stock', 'is', null);

      const lowStockCount = lowStockData?.filter(
        item => item.quantity <= (item.min_stock || 0)
      ).length || 0;

      // Get alerts
      const { count: alertsCount } = await supabase
        .from('inventory_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('dismissed', false);

      return {
        inventoryCount: totalItems || 0,
        lowStockItems: lowStockCount,
        criticalAlerts: alertsCount || 0
      };
    } catch (error) {
      console.error('Error fetching inventory metrics:', error);
      throw error;
    }
  };

  const calculateFinancialSummary = async () => {
    try {
      const { data: inventoryItems } = await supabase
        .from('inventory_items')
        .select('quantity, purchase_price');

      if (!inventoryItems) return "$0";

      const totalValue = inventoryItems.reduce((sum, item) => {
        return sum + ((item.quantity || 0) * (item.purchase_price || 0));
      }, 0);

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(totalValue);
    } catch (error) {
      console.error('Error calculating financial summary:', error);
      return "$0";
    }
  };

  const fetchEnterpriseMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch real data from multiple sources
      const [inventoryMetrics, financialSummary] = await Promise.all([
        fetchInventoryMetrics(),
        calculateFinancialSummary()
      ]);

      // Get the user's yacht data
      const { data: yachtProfile } = await supabase
        .from('yacht_profiles')
        .select('*')
        .maybeSingle();

      // Get crew count
      const { count: crewCount } = await supabase
        .from('crew_members')
        .select('*', { count: 'exact', head: true })
        .eq('yacht_id', yachtProfile?.id || '')
        .eq('status', 'active');

      // Get current charter guests
      const { data: currentCharters } = await supabase
        .from('guest_charters')
        .select('guest_count')
        .eq('yacht_id', yachtProfile?.id || '')
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0]);

      const totalGuests = currentCharters?.reduce((sum, charter) => sum + charter.guest_count, 0) || 0;

      const newMetrics: EnterpriseMetrics = {
        ...inventoryMetrics,
        financialSummary,
        fuelLevel: yachtProfile?.fuel_level || 0,
        batteryLevel: yachtProfile?.battery_level || 100,
        crewCount: crewCount || 0,
        guestCount: totalGuests,
        maintenanceAlerts: inventoryMetrics.criticalAlerts
      };

      setMetrics(newMetrics);
      
      // Broadcast the update to other components
      broadcastUpdate('system_status', newMetrics, 'dashboard');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enterprise data');
      console.error('Enterprise data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [broadcastUpdate]);

  // Real-time subscriptions for data changes
  useEffect(() => {
    // Initial fetch
    fetchEnterpriseMetrics();

    // Subscribe to inventory changes
    const inventoryChannel = supabase
      .channel('inventory_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory_items' }, 
        () => {
          console.log('Inventory changed, refreshing metrics');
          fetchEnterpriseMetrics();
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory_alerts' }, 
        () => {
          console.log('Alerts changed, refreshing metrics');
          fetchEnterpriseMetrics();
        }
      )
      .subscribe();

    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchEnterpriseMetrics, 30000);

    return () => {
      supabase.removeChannel(inventoryChannel);
      clearInterval(interval);
    };
  }, [fetchEnterpriseMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchEnterpriseMetrics
  };
};