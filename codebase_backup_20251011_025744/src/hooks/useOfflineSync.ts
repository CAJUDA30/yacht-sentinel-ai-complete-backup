import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SyncDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  platform: string;
  sync_status: 'active' | 'paused' | 'disabled' | 'error';
  last_sync_at?: string;
  storage_used_mb: number;
  network_quality: string;
  is_primary: boolean;
}

export interface SyncMetrics {
  records_processed: number;
  conflicts_detected: number;
  sync_duration_ms: number;
  data_transferred_mb: number;
  success_rate: number;
}

export interface SyncConflict {
  id: string;
  table_name: string;
  record_id: string;
  conflict_type: string;
  local_version: any;
  remote_version: any;
  resolved: boolean;
  created_at: string;
}

export interface OfflineChange {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: string;
  synced: boolean;
}

// Hook for offline sync management
export function useOfflineSync(yachtId?: string) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<OfflineChange[]>([]);
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const deviceId = useRef<string>(generateDeviceId());
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing changes...",
      });
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Working offline. Changes will sync when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && yachtId && pendingChanges.length > 0) {
      const autoSyncTimer = setTimeout(() => {
        triggerSync();
      }, 5000); // Wait 5 seconds before auto-sync

      return () => clearTimeout(autoSyncTimer);
    }
  }, [isOnline, yachtId, pendingChanges.length]);

  const registerDevice = useCallback(async (deviceInfo: Partial<SyncDevice>) => {
    if (!yachtId) return;

    try {
      const { data, error } = await supabase
        .from('sync_devices')
        .upsert({
          device_id: deviceId.current,
          yacht_id: yachtId,
          device_name: deviceInfo.device_name || `Device ${deviceId.current.slice(-4)}`,
          device_type: deviceInfo.device_type || detectDeviceType(),
          platform: navigator.platform,
          app_version: '1.0.0', // Should come from build info
          sync_status: 'active',
          last_seen_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Device Registered",
        description: "Ready for offline synchronization",
      });

      return data;
    } catch (error) {
      console.error('Failed to register device:', error);
      toast({
        title: "Registration Failed",
        description: "Could not register device for sync",
        variant: "destructive",
      });
    }
  }, [yachtId, toast]);

  const triggerSync = useCallback(async (operation: 'push' | 'pull' | 'full_sync' = 'full_sync') => {
    if (!yachtId || isSyncing) return;

    setIsSyncing(true);
    
    try {
      const syncRequest = {
        device_id: deviceId.current,
        yacht_id: yachtId,
        operation,
        data: {
          changes: operation === 'pull' ? undefined : pendingChanges.map(changeToSyncFormat),
          last_sync_timestamp: lastSyncTime?.toISOString(),
          tables: ['inventory_items', 'maintenance_tasks', 'nmea_sensor_data', 'sensor_alerts']
        },
        options: {
          batch_size: 100,
          include_deletes: true
        }
      };

      const { data, error } = await supabase.functions.invoke('offline-sync', {
        body: syncRequest
      });

      if (error) throw error;

      if (data.success) {
        // Apply remote changes locally
        if (data.changes && data.changes.length > 0) {
          await applyRemoteChanges(data.changes);
        }

        // Handle conflicts
        if (data.conflicts && data.conflicts.length > 0) {
          setConflicts(prev => [...prev, ...data.conflicts]);
          toast({
            title: "Sync Conflicts",
            description: `${data.conflicts.length} conflicts need resolution`,
            variant: "destructive",
          });
        }

        // Update metrics
        if (data.metrics) {
          setSyncMetrics(data.metrics);
        }

        // Clear synced pending changes
        if (operation === 'push' || operation === 'full_sync') {
          setPendingChanges(prev => prev.filter(change => !change.synced));
        }

        setLastSyncTime(new Date());
        
        toast({
          title: "Sync Complete",
          description: `Processed ${data.metrics?.records_processed || 0} records`,
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Synchronization failed",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [yachtId, isSyncing, pendingChanges, lastSyncTime, toast]);

  const addPendingChange = useCallback((
    tableName: string,
    recordId: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ) => {
    const change: OfflineChange = {
      id: crypto.randomUUID(),
      table_name: tableName,
      record_id: recordId,
      operation,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };

    setPendingChanges(prev => [...prev, change]);

    // Store in local storage for persistence
    storeChangeLocally(change);

    // Try to sync immediately if online
    if (isOnline) {
      setTimeout(() => triggerSync('push'), 1000);
    }
  }, [isOnline, triggerSync]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    strategy: 'last_write_wins' | 'manual_review' | 'merge_fields' = 'last_write_wins',
    resolutionData?: any
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('offline-sync', {
        body: {
          device_id: deviceId.current,
          yacht_id: yachtId,
          operation: 'resolve_conflict',
          data: {
            conflict_id: conflictId,
            resolution_strategy: strategy,
            resolution_data: resolutionData
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        toast({
          title: "Conflict Resolved",
          description: "Sync conflict has been resolved",
        });
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast({
        title: "Resolution Failed",
        description: "Could not resolve sync conflict",
        variant: "destructive",
      });
    }
  }, [yachtId, toast]);

  const clearLocalData = useCallback(async () => {
    try {
      // Clear IndexedDB/localStorage
      await clearLocalStorage();
      setPendingChanges([]);
      setConflicts([]);
      setSyncMetrics(null);
      
      toast({
        title: "Local Data Cleared",
        description: "All offline data has been cleared",
      });
    } catch (error) {
      console.error('Failed to clear local data:', error);
      toast({
        title: "Clear Failed",
        description: "Could not clear local data",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingChanges: pendingChanges.length,
    syncMetrics,
    conflicts,
    deviceId: deviceId.current,
    registerDevice,
    triggerSync,
    addPendingChange,
    resolveConflict,
    clearLocalData
  };
}

// Hook for offline data storage
export function useOfflineStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Failed to store value:', error);
    }
  }, [key, value]);

  const removeStoredValue = useCallback(() => {
    try {
      setValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove stored value:', error);
    }
  }, [key, initialValue]);

  return [value, setStoredValue, removeStoredValue] as const;
}

// Hook for offline-capable data fetching
export function useOfflineQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    enabled?: boolean;
    fallbackData?: T;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [storedData, setStoredData] = useOfflineStorage<{
    data: T;
    timestamp: number;
  } | null>(`query_${queryKey}`, null);

  const staleTime = options?.staleTime || 5 * 60 * 1000; // 5 minutes default
  const enabled = options?.enabled !== false;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await queryFn();
      setData(result);
      setStoredData({
        data: result,
        timestamp: Date.now()
      });
      setIsStale(false);
    } catch (err) {
      setError(err as Error);
      
      // Use cached data if available
      if (storedData) {
        setData(storedData.data);
        setIsStale(true);
      } else if (options?.fallbackData) {
        setData(options.fallbackData);
        setIsStale(true);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, queryFn, storedData, setStoredData, options?.fallbackData]);

  useEffect(() => {
    // Load cached data first
    if (storedData) {
      const isExpired = Date.now() - storedData.timestamp > staleTime;
      setData(storedData.data);
      setIsStale(isExpired);
      setLoading(false);
      
      // Fetch fresh data if expired or online
      if (isExpired || navigator.onLine) {
        fetchData();
      }
    } else {
      fetchData();
    }
  }, [fetchData, storedData, staleTime]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isStale,
    refetch
  };
}

// Hook for managing sync devices
export function useSyncDevices(yachtId?: string) {
  const [devices, setDevices] = useState<SyncDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    if (!yachtId) return;

    try {
      const { data, error } = await supabase
        .from('sync_devices')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Failed to fetch sync devices:', error);
    } finally {
      setLoading(false);
    }
  }, [yachtId]);

  const updateDeviceStatus = useCallback(async (
    deviceId: string,
    status: 'active' | 'paused' | 'disabled'
  ) => {
    try {
      const { error } = await supabase
        .from('sync_devices')
        .update({ sync_status: status })
        .eq('device_id', deviceId);

      if (error) throw error;

      setDevices(prev => 
        prev.map(device => 
          device.device_id === deviceId 
            ? { ...device, sync_status: status }
            : device
        )
      );
    } catch (error) {
      console.error('Failed to update device status:', error);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    loading,
    updateDeviceStatus,
    refetch: fetchDevices
  };
}

// Utility functions
function generateDeviceId(): string {
  const stored = localStorage.getItem('yacht_device_id');
  if (stored) return stored;
  
  const newId = crypto.randomUUID();
  localStorage.setItem('yacht_device_id', newId);
  return newId;
}

function detectDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/android/.test(userAgent)) return 'mobile_app';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'mobile_app';
  if (/tablet/.test(userAgent)) return 'tablet_app';
  return 'desktop_app';
}

function changeToSyncFormat(change: OfflineChange): any {
  return {
    table_name: change.table_name,
    record_id: change.record_id,
    operation: change.operation,
    data: change.data,
    timestamp: change.timestamp,
    version_vector: { [generateDeviceId()]: 1 }, // Simplified vector clock
    checksum: calculateChecksum(change.data)
  };
}

function calculateChecksum(data: any): string {
  // Simple checksum calculation
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

async function applyRemoteChanges(changes: any[]): Promise<void> {
  // Apply changes to local storage/IndexedDB
  // This would integrate with your local database implementation
  console.log('Applying remote changes:', changes.length);
}

function storeChangeLocally(change: OfflineChange): void {
  try {
    const stored = JSON.parse(localStorage.getItem('pending_changes') || '[]');
    stored.push(change);
    localStorage.setItem('pending_changes', JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to store change locally:', error);
  }
}

async function clearLocalStorage(): Promise<void> {
  localStorage.removeItem('pending_changes');
  localStorage.removeItem('sync_metadata');
  // Clear IndexedDB if using it
}