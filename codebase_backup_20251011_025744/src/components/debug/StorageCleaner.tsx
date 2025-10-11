import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  HardDrive,
  Wifi,
  Clock
} from 'lucide-react';

const StorageCleaner: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const { toast } = useToast();

  const getStorageInfo = () => {
    try {
      const localStorage_size = new Blob(Object.values(localStorage)).size;
      const sessionStorage_size = new Blob(Object.values(sessionStorage)).size;
      
      const info = {
        localStorage: {
          items: localStorage.length,
          size: localStorage_size,
          keys: Object.keys(localStorage)
        },
        sessionStorage: {
          items: sessionStorage.length,
          size: sessionStorage_size,
          keys: Object.keys(sessionStorage)
        },
        cookies: document.cookie.split(';').length,
        userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                  navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                  navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'
      };
      
      setStorageInfo(info);
      return info;
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  };

  const clearAllStorage = async () => {
    setIsClearing(true);
    
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
      
      // Clear Cache Storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Clear Service Worker registration
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      
      toast({
        title: "Storage Cleared",
        description: "All browser storage has been cleared successfully. Reloading page...",
      });
      
      // Reload page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing storage:', error);
      toast({
        title: "Clear Failed",
        description: "Some storage could not be cleared. Try manual clearing.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const clearSpecificStorage = (type: 'localStorage' | 'sessionStorage') => {
    try {
      if (type === 'localStorage') {
        localStorage.clear();
        toast({
          title: "Local Storage Cleared",
          description: "All localStorage data has been removed.",
        });
      } else {
        sessionStorage.clear();
        toast({
          title: "Session Storage Cleared", 
          description: "All sessionStorage data has been removed.",
        });
      }
      getStorageInfo();
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: `Failed to clear ${type}`,
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    getStorageInfo();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Browser Storage Cleaner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Snippet Error Fix:</strong> This tool clears browser storage that may contain 
            references to missing components (ID: 49fc4970-6d15-4fda-9fd5-b6f30c5769ce).
          </AlertDescription>
        </Alert>

        {/* Storage Information */}
        {storageInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Local Storage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Items:</span>
                  <Badge variant="outline">{storageInfo.localStorage.items}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Size:</span>
                  <Badge variant="outline">{(storageInfo.localStorage.size / 1024).toFixed(1)} KB</Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => clearSpecificStorage('localStorage')}
                  className="w-full"
                >
                  Clear Local Storage
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Session Storage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Items:</span>
                  <Badge variant="outline">{storageInfo.sessionStorage.items}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Size:</span>
                  <Badge variant="outline">{(storageInfo.sessionStorage.size / 1024).toFixed(1)} KB</Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => clearSpecificStorage('sessionStorage')}
                  className="w-full"
                >
                  Clear Session Storage
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Storage Keys */}
        {storageInfo && storageInfo.localStorage.keys.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">localStorage Keys:</h4>
            <div className="flex flex-wrap gap-1">
              {storageInfo.localStorage.keys.slice(0, 10).map((key: string) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key.substring(0, 20)}{key.length > 20 ? '...' : ''}
                </Badge>
              ))}
              {storageInfo.localStorage.keys.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{storageInfo.localStorage.keys.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={clearAllStorage} 
            disabled={isClearing}
            variant="destructive"
            className="flex-1"
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Storage
              </>
            )}
          </Button>
          
          <Button 
            onClick={getStorageInfo} 
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Info
          </Button>
        </div>

        {/* Manual Instructions */}
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Manual Method:</strong> Open DevTools (F12) → Application → Storage → 
            Clear site data, or run in Console: <code>localStorage.clear(); sessionStorage.clear(); location.reload();</code>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default StorageCleaner;