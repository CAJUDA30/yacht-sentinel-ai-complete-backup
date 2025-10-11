import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useOffline } from '@/contexts/OfflineContext';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Database, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Download, 
  Upload, 
  RefreshCw,
  Monitor,
  Smartphone,
  Battery,
  Signal
} from 'lucide-react';
import { SystemHealthChecker } from '@/components/SystemHealthChecker';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

export const SystemSettings = () => {
  const { settings, updateSystemSetting, exportSettings, importSettings } = useAppSettings();
  const { isConnected } = useRealtime();
  const { isOnline, pendingSync } = useOffline();

  const handleSettingUpdate = (key: string, value: any) => {
    updateSystemSetting(key as any, value);
    toast({
      title: "System Setting Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated.`
    });
  };

  const handleExportSettings = () => {
    const settingsData = exportSettings();
    const blob = new Blob([settingsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yacht-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings Exported",
      description: "Settings have been downloaded as JSON file."
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importSettings(content)) {
          toast({
            title: "Settings Imported",
            description: "Settings have been successfully imported."
          });
        } else {
          toast({
            title: "Import Failed",
            description: "Failed to import settings. Please check the file format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast({
      title: "Cache Cleared",
      description: "Application cache has been cleared."
    });
  };

  const restartSystem = () => {
    toast({
      title: "System Restart",
      description: "Restarting application services..."
    });
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection Status</span>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <Badge variant="outline" className="text-green-600">Online</Badge>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">Offline</Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Sync Status</span>
                <Badge variant="outline">
                  {isOnline ? 'Up to date' : 'Syncing...'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending Changes</span>
                <Badge variant="secondary">{pendingSync.length}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Usage</span>
                <span className="text-sm">2.3 GB / 5 GB</span>
              </div>
              <Progress value={46} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-backup">Auto Backup</Label>
                <p className="text-sm text-muted-foreground">Automatic data backup</p>
              </div>
              <Switch
                id="auto-backup"
                checked={settings.system.autoBackup}
                onCheckedChange={(checked) => handleSettingUpdate('autoBackup', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="offline-mode">Offline Mode</Label>
                <p className="text-sm text-muted-foreground">Work without internet</p>
              </div>
              <Switch
                id="offline-mode"
                checked={settings.system.offlineMode}
                onCheckedChange={(checked) => handleSettingUpdate('offlineMode', checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleExportSettings} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Settings */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cache-size">Cache Size</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (100 MB)</SelectItem>
                  <SelectItem value="medium">Medium (500 MB)</SelectItem>
                  <SelectItem value="large">Large (1 GB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sync-frequency">Sync Frequency</Label>
              <Select defaultValue="realtime">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="5min">Every 5 minutes</SelectItem>
                  <SelectItem value="15min">Every 15 minutes</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={clearCache} className="w-full">
              <HardDrive className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </CardContent>
        </Card>

        {/* Device Settings */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Device Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Device Type</span>
                <Badge variant="outline">Desktop</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Screen Resolution</span>
                <span className="text-sm">1920x1080</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Browser</span>
                <span className="text-sm">Chrome 120</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="low-power">Low Power Mode</Label>
                <p className="text-sm text-muted-foreground">Reduce performance for battery</p>
              </div>
              <Switch
                id="low-power"
                checked={false}
                onCheckedChange={() => {}}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-sync">Background Sync</Label>
                <p className="text-sm text-muted-foreground">Sync when app is closed</p>
              </div>
              <Switch
                id="push-sync"
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor />

      {/* System Health Checker */}
      <SystemHealthChecker />

      {/* System Maintenance */}
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>System Maintenance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={clearCache}>
              <HardDrive className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Application
            </Button>
            <Button variant="destructive" onClick={restartSystem}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart System
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};