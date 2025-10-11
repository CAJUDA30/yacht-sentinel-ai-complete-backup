import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  WifiOff,
  Wifi,
  Download,
  Upload,
  HardDrive,
  Clock,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  
  CloudOff,
  Smartphone,
  Activity,
  Archive,
  Trash2
} from 'lucide-react';

interface OfflineData {
  id: string;
  type: 'navigation' | 'inventory' | 'maintenance' | 'crew' | 'weather' | 'logs';
  name: string;
  size: number;
  lastSynced: Date;
  status: 'synced' | 'pending' | 'conflict' | 'error';
  priority: 'high' | 'medium' | 'low';
  description: string;
}

interface SyncStatus {
  isOnline: boolean;
  pendingUploads: number;
  pendingDownloads: number;
  lastSync: Date | null;
  storageUsed: number;
  storageLimit: number;
  syncInProgress: boolean;
}

const OfflineCapabilityManager = () => {
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingUploads: 3,
    pendingDownloads: 1,
    lastSync: new Date(Date.now() - 15 * 60 * 1000),
    storageUsed: 245,
    storageLimit: 1024,
    syncInProgress: false
  });

  const [offlineData, setOfflineData] = useState<OfflineData[]>([
    {
      id: '1',
      type: 'navigation',
      name: 'Navigation Charts - Caribbean',
      size: 125,
      lastSynced: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'synced',
      priority: 'high',
      description: 'Essential navigation charts for current route'
    },
    {
      id: '2',
      type: 'inventory',
      name: 'Equipment Inventory Data',
      size: 35,
      lastSynced: new Date(Date.now() - 10 * 60 * 1000),
      status: 'pending',
      priority: 'medium',
      description: 'Recent inventory updates and scans'
    },
    {
      id: '3',
      type: 'maintenance',
      name: 'Engine Maintenance Logs',
      size: 15,
      lastSynced: new Date(Date.now() - 30 * 60 * 1000),
      status: 'conflict',
      priority: 'high',
      description: 'Maintenance records and schedules'
    },
    {
      id: '4',
      type: 'crew',
      name: 'Crew Schedules & Certifications',
      size: 8,
      lastSynced: new Date(Date.now() - 5 * 60 * 1000),
      status: 'synced',
      priority: 'medium',
      description: 'Crew management and certification data'
    },
    {
      id: '5',
      type: 'weather',
      name: 'Weather Forecast Data',
      size: 22,
      lastSynced: new Date(Date.now() - 45 * 60 * 1000),
      status: 'error',
      priority: 'high',
      description: '7-day weather forecast and marine conditions'
    },
    {
      id: '6',
      type: 'logs',
      name: 'System Activity Logs',
      size: 40,
      lastSynced: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'pending',
      priority: 'low',
      description: 'System events and operational logs'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'hsl(var(--success))';
      case 'pending': return 'hsl(var(--warning))';
      case 'conflict': return 'hsl(var(--destructive))';
      case 'error': return 'hsl(var(--destructive))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return CheckCircle;
      case 'pending': return Clock;
      case 'conflict': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Database;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'navigation': return Activity;
      case 'inventory': return Archive;
      case 'maintenance': return HardDrive;
      case 'crew': return Smartphone;
      case 'weather': return CloudOff;
      case 'logs': return Database;
      default: return Database;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSync = useCallback(async () => {
    if (!syncStatus.isOnline) {
      toast({
        title: 'Cannot sync',
        description: 'No internet connection available',
        variant: 'destructive'
      });
      return;
    }

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date(),
        pendingUploads: 0,
        pendingDownloads: 0
      }));
      
      setOfflineData(prev => 
        prev.map(item => ({ ...item, status: 'synced' as const, lastSynced: new Date() }))
      );
      
      toast({
        title: 'Sync completed',
        description: 'All data has been synchronized successfully'
      });
    }, 3000);
  }, [syncStatus.isOnline, toast]);

  const handleDownload = useCallback((id: string) => {
    const item = offlineData.find(d => d.id === id);
    if (!item) return;

    toast({
      title: 'Download started',
      description: `Downloading ${item.name} for offline use`
    });

    // Simulate download
    setTimeout(() => {
      setOfflineData(prev =>
        prev.map(d => d.id === id ? { ...d, status: 'synced' as const, lastSynced: new Date() } : d)
      );
      toast({
        title: 'Download completed',
        description: `${item.name} is now available offline`
      });
    }, 2000);
  }, [offlineData, toast]);

  const handleDelete = useCallback((id: string) => {
    const item = offlineData.find(d => d.id === id);
    if (!item) return;

    setSyncStatus(prev => ({
      ...prev,
      storageUsed: prev.storageUsed - item.size
    }));

    setOfflineData(prev => prev.filter(d => d.id !== id));
    
    toast({
      title: 'Data removed',
      description: `${item.name} has been removed from offline storage`
    });
  }, [offlineData, toast]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (syncStatus.isOnline && (syncStatus.pendingUploads > 0 || syncStatus.pendingDownloads > 0)) {
      toast({
        title: 'Connection restored',
        description: 'Automatic sync will begin shortly'
      });
    }
  }, [syncStatus.isOnline, syncStatus.pendingUploads, syncStatus.pendingDownloads, toast]);

  const storagePercentage = (syncStatus.storageUsed / syncStatus.storageLimit) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {syncStatus.isOnline ? (
            <Wifi className="h-6 w-6 text-green-600" />
          ) : (
            <WifiOff className="h-6 w-6 text-red-600" />
          )}
          <div>
            <h2 className="text-2xl font-bold">Offline Capabilities</h2>
            <p className="text-muted-foreground">
              {syncStatus.isOnline ? 'Connected' : 'Offline Mode'} • 
              Last sync: {syncStatus.lastSync ? syncStatus.lastSync.toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
          >
            {syncStatus.syncInProgress ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
          <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{syncStatus.pendingUploads}</p>
                <p className="text-sm text-muted-foreground">Pending Uploads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{syncStatus.pendingDownloads}</p>
                <p className="text-sm text-muted-foreground">Pending Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatFileSize(syncStatus.storageUsed)}</p>
                <p className="text-sm text-muted-foreground">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{offlineData.length}</p>
                <p className="text-sm text-muted-foreground">Offline Datasets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">Offline Data</TabsTrigger>
          <TabsTrigger value="storage">Storage Management</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {offlineData.map((item) => {
                const StatusIcon = getStatusIcon(item.status);
                const TypeIcon = getTypeIcon(item.type);
                
                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-muted">
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {item.priority}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ color: getStatusColor(item.status) }}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatFileSize(item.size)}</span>
                              <span>•</span>
                              <span>Last synced: {item.lastSynced.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {item.status !== 'synced' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(item.id)}
                                  disabled={!syncStatus.isOnline}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used Storage</span>
                  <span>{formatFileSize(syncStatus.storageUsed)} / {formatFileSize(syncStatus.storageLimit)}</span>
                </div>
                <Progress value={storagePercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {storagePercentage.toFixed(1)}% of available offline storage used
                </p>
              </div>
              
              {storagePercentage > 80 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Storage is almost full. Consider removing unused offline data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['navigation', 'inventory', 'maintenance', 'crew', 'weather', 'logs'].map(type => {
                  const typeData = offlineData.filter(item => item.type === type);
                  const totalSize = typeData.reduce((sum, item) => sum + item.size, 0);
                  const percentage = totalSize > 0 ? (totalSize / syncStatus.storageUsed) * 100 : 0;
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{type}</span>
                        <span>{formatFileSize(totalSize)} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfflineCapabilityManager;