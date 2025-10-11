import { createContext, useContext, useEffect, useState, useCallback, ReactNode, FC } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface RealtimeData {
  type: 'system_status' | 'inventory' | 'crew' | 'navigation' | 'maintenance' | 'finance' | 'location' | 'weather' | 'security' | 'smart_scan';
  data: any;
  timestamp: string;
  source?: string;
  module?: string;
}

interface RealtimeContextType {
  isConnected: boolean;
  data: RealtimeData[];
  subscribe: (types: string[]) => void;
  unsubscribe: () => void;
  sendData: (data: RealtimeData) => void;
  broadcastUpdate: (type: string, data: any, module?: string) => void;
  getLatestData: (type: string, module?: string) => RealtimeData | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<RealtimeData[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const { toast } = useToast();

  const subscribe = useCallback((types: string[]) => {
    if (channel) {
      supabase.removeChannel(channel);
    }

    const newChannel = supabase
      .channel('yacht-realtime')
      .on('broadcast' as any, { event: 'yacht-data' }, (payload: any) => {
        // Only log in debug mode to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.log('Realtime data received:', payload);
        }
        const newData: RealtimeData = {
          type: payload.type,
          data: payload.data,
          timestamp: new Date().toISOString(),
          source: payload.source || 'unknown'
        };
        
        setData(prev => [newData, ...prev.slice(0, 99)]); // Keep last 100 items
      })
      .subscribe((status) => {
        // Only log important status changes to reduce console noise
        if (status === 'SUBSCRIBED') {
          console.log('Realtime status: SUBSCRIBED');
          setIsConnected(true);
          toast({
            title: "Real-time Connected",
            description: "Live data streaming is active",
          });
        } else if (status === 'CLOSED') {
          console.log('Realtime status: CLOSED');
          setIsConnected(false);
          toast({
            title: "Real-time Disconnected",
            description: "Attempting to reconnect...",
            variant: "destructive",
          });
        } else if (status === 'CHANNEL_ERROR') {
          // Handle channel errors gracefully without spamming
          console.log('[Realtime] Channel error handled gracefully');
          setIsConnected(false);
          // Don't show toast for channel errors to reduce noise
        }
      });

    setChannel(newChannel);
  }, [toast]);

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setIsConnected(false);
    }
  }, [channel]);

  const sendData = useCallback((data: RealtimeData) => {
    if (channel && isConnected) {
      channel.send({
        type: 'broadcast',
        event: 'yacht-data',
        payload: data
      });
    }
  }, [channel, isConnected]);

  const broadcastUpdate = useCallback((type: string, data: any, module?: string) => {
    const updateData: RealtimeData = {
      type: type as RealtimeData['type'],
      data,
      timestamp: new Date().toISOString(),
      source: 'local',
      module
    };
    
    // Add to local data immediately
    setData(prev => [updateData, ...prev.slice(0, 99)]);
    
    // Broadcast to other clients
    sendData(updateData);
  }, [sendData]);

  const getLatestData = useCallback((type: string, module?: string) => {
    return data.find(item => 
      item.type === type && 
      (module ? item.module === module : true)
    ) || null;
  }, [data]);

  useEffect(() => {
    // Auto-subscribe to all data types on mount
    subscribe(['system_status', 'inventory', 'crew', 'navigation', 'maintenance', 'finance', 'location', 'weather', 'security', 'smart_scan']);

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{
      isConnected,
      data,
      subscribe,
      unsubscribe,
      sendData,
      broadcastUpdate,
      getLatestData
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};