import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface OfflineData {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  synced: boolean;
}

interface OfflineContextType {
  isOnline: boolean;
  pendingSync: OfflineData[];
  storeOfflineData: (type: string, data: any) => void;
  syncPendingData: () => Promise<void>;
  getOfflineData: (type: string) => OfflineData[];
  clearOfflineData: (type?: string) => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);
  const { toast } = useToast();

  // Load offline data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('yacht-offline-data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPendingSync(data);
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    }
  }, []);

  // Save offline data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('yacht-offline-data', JSON.stringify(pendingSync));
  }, [pendingSync]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Syncing pending data...",
      });
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Data will be synced when connection returns",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const storeOfflineData = useCallback((type: string, data: any) => {
    const offlineData: OfflineData = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };

    setPendingSync(prev => [...prev, offlineData]);

    if (!isOnline) {
      toast({
        title: "Data Saved Offline",
        description: `${type} data stored locally`,
      });
    }
  }, [isOnline, toast]);

  const syncPendingData = useCallback(async () => {
    if (!isOnline || pendingSync.length === 0) return;

    const unsyncedData = pendingSync.filter(item => !item.synced);
    console.log('Syncing offline data:', unsyncedData);

    try {
      // Simulate API sync - replace with actual API calls
      for (const item of unsyncedData) {
        // Here you would make actual API calls to sync data
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
        
        setPendingSync(prev => 
          prev.map(p => p.id === item.id ? { ...p, synced: true } : p)
        );
      }

      toast({
        title: "Sync Complete",
        description: `${unsyncedData.length} items synced successfully`,
      });

      // Remove synced items after successful sync
      setTimeout(() => {
        setPendingSync(prev => prev.filter(item => !item.synced));
      }, 5000);

    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Will retry when connection improves",
        variant: "destructive",
      });
    }
  }, [isOnline, pendingSync, toast]);

  const getOfflineData = useCallback((type: string) => {
    return pendingSync.filter(item => item.type === type);
  }, [pendingSync]);

  const clearOfflineData = useCallback((type?: string) => {
    if (type) {
      setPendingSync(prev => prev.filter(item => item.type !== type));
    } else {
      setPendingSync([]);
    }
  }, []);

  return (
    <OfflineContext.Provider value={{
      isOnline,
      pendingSync,
      storeOfflineData,
      syncPendingData,
      getOfflineData,
      clearOfflineData
    }}>
      {children}
    </OfflineContext.Provider>
  );
};