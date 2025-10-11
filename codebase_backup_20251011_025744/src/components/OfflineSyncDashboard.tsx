import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Wifi, 
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Smartphone,
  Tablet,
  Monitor,
  Database,
  CloudOff,
  Zap,
  Activity,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useOfflineSync,
  useSyncDevices,
  type SyncDevice,
  type SyncConflict
} from '@/hooks/useOfflineSync';

interface OfflineSyncDashboardProps {
  yachtId: string;
}

const OfflineSyncDashboard: React.FC<OfflineSyncDashboardProps> = ({ yachtId }) => {
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null);
  const { toast } = useToast();

  // Offline sync hooks
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    syncMetrics,
    conflicts,
    deviceId,
    registerDevice,
    triggerSync,
    resolveConflict,
    clearLocalData
  } = useOfflineSync(yachtId);

  const { devices, updateDeviceStatus, refetch: refetchDevices } = useSyncDevices(yachtId);

  useEffect(() => {
    // Register current device on component mount
    registerDevice({
      device_name: `${getDeviceType()} - ${navigator.userAgent.split(' ')[0]}`,
      device_type: getDeviceType()
    });
  }, [registerDevice]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile_app': return Smartphone;
      case 'tablet_app': return Tablet;
      case 'desktop_app': return Monitor;
      default: return Database;
    }
  };

  const getDeviceType = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) return 'mobile_app';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'mobile_app';
    if (/tablet/.test(userAgent)) return 'tablet_app';
    return 'desktop_app';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      case 'disabled': return 'text-gray-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleConflictResolution = async (
    conflictId: string,
    strategy: 'last_write_wins' | 'manual_review' | 'merge_fields'
  ) => {
    await resolveConflict(conflictId, strategy);
    setSelectedConflict(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Offline Sync Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage offline data synchronization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          <Button
            onClick={() => triggerSync()}
            disabled={isSyncing}
            variant="outline"
            className="gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Now
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Connection Status</p>
              <p className="text-2xl font-bold">{isOnline ? 'Online' : 'Offline'}</p>
            </div>
            {isOnline ? (
              <Wifi className="h-8 w-8 text-green-500" />
            ) : (
              <CloudOff className="h-8 w-8 text-red-500" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Changes</p>
              <p className="text-2xl font-bold">{pendingChanges}</p>
            </div>
            <Upload className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sync Conflicts</p>
              <p className="text-2xl font-bold text-red-600">{conflicts.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
              <p className="text-sm font-bold">
                {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
      </div>

      {/* Sync Status Alert */}
      {!isOnline && pendingChanges > 0 && (
        <Alert>
          <CloudOff className="h-4 w-4" />
          <AlertTitle>Working Offline</AlertTitle>
          <AlertDescription>
            {pendingChanges} changes are queued for synchronization. They will be synced automatically when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Sync Conflicts Detected</AlertTitle>
          <AlertDescription>
            {conflicts.length} conflicts need resolution. Please review and resolve them in the Conflicts tab.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {/* Sync Metrics */}
            {syncMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Sync Performance
                  </CardTitle>
                  <CardDescription>
                    Latest synchronization metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Records Processed</p>
                      <p className="text-2xl font-bold">{syncMetrics.records_processed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data Transferred</p>
                      <p className="text-2xl font-bold">{formatBytes(syncMetrics.data_transferred_mb * 1024 * 1024)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">{syncMetrics.success_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="text-2xl font-bold">{(syncMetrics.sync_duration_ms / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Device */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Current Device
                </CardTitle>
                <CardDescription>
                  This device's sync information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Device ID</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{deviceId}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Type</span>
                    <Badge variant="outline">{getDeviceType()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Platform</span>
                    <span className="text-sm">{navigator.platform}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sync Status</span>
                    <Badge variant={isSyncing ? 'default' : 'secondary'}>
                      {isSyncing ? 'Syncing' : 'Ready'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Devices</CardTitle>
              <CardDescription>
                Manage devices connected to this yacht
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {devices.map((device) => {
                  const Icon = getDeviceIcon(device.device_type);
                  
                  return (
                    <div key={device.id} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6" />
                        <div>
                          <p className="font-medium">{device.device_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.platform} • {device.device_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatBytes(device.storage_used_mb * 1024 * 1024)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last sync: {device.last_sync_at ? 
                              new Date(device.last_sync_at).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(device.sync_status)}>
                          {device.sync_status}
                        </Badge>
                        {device.is_primary && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                        <Switch
                          checked={device.sync_status === 'active'}
                          onCheckedChange={(enabled) =>
                            updateDeviceStatus(device.device_id, enabled ? 'active' : 'paused')
                          }
                        />
                      </div>
                    </div>
                  );
                })}
                
                {devices.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sync devices found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sync Conflicts
              </CardTitle>
              <CardDescription>
                Resolve data synchronization conflicts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conflicts.map((conflict) => (
                  <div key={conflict.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{conflict.table_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {conflict.conflict_type} • Record ID: {conflict.record_id}
                        </p>
                      </div>
                      <Badge variant="destructive">Unresolved</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Local Version</p>
                        <div className="bg-muted p-3 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(conflict.local_version, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Remote Version</p>
                        <div className="bg-muted p-3 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(conflict.remote_version, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConflictResolution(conflict.id, 'last_write_wins')}
                      >
                        Use Latest Version
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConflictResolution(conflict.id, 'merge_fields')}
                      >
                        Merge Fields
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedConflict(conflict.id)}
                      >
                        Manual Review
                      </Button>
                    </div>
                  </div>
                ))}
                
                {conflicts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    No sync conflicts found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Sync Settings
              </CardTitle>
              <CardDescription>
                Configure offline synchronization preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Automatic Sync</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-sync when online</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync changes when connection is restored
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Background sync</p>
                        <p className="text-sm text-muted-foreground">
                          Sync data in the background when app is not active
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Data Management</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Compress offline data</p>
                        <p className="text-sm text-muted-foreground">
                          Reduce storage space by compressing offline data
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Encrypt sensitive data</p>
                        <p className="text-sm text-muted-foreground">
                          Encrypt sensitive data stored offline
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-4">Storage Management</h4>
                  <div className="space-y-4">
                    <Button
                      variant="destructive"
                      onClick={clearLocalData}
                      className="w-full"
                    >
                      Clear All Offline Data
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      This will remove all offline data and pending changes. Use with caution.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfflineSyncDashboard;