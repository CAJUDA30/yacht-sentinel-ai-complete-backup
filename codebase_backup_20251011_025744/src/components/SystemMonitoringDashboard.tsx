import { useState, useEffect } from 'react';
import { Download, RefreshCw, AlertTriangle, CheckCircle, Copy, Database, Zap, Activity, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  database: 'connected' | 'slow' | 'error';
  ai: 'operational' | 'degraded' | 'offline';
  scanning: 'active' | 'idle' | 'error';
  lastUpdated: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata?: any;
}

interface AIMetrics {
  totalProcessed: number;
  successRate: number;
  avgConfidence: number;
  avgProcessingTime: number;
  modelsActive: string[];
}

interface ScanMetrics {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  avgProcessingTime: number;
  topModules: { module: string; count: number; }[];
}

const SystemMonitoringDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    database: 'connected',
    ai: 'operational',
    scanning: 'active',
    lastUpdated: new Date().toISOString()
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scanLogs, setScanLogs] = useState<LogEntry[]>([]);
  const [aiMetrics, setAIMetrics] = useState<AIMetrics>({
    totalProcessed: 0,
    successRate: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    modelsActive: []
  });
  
  const [scanMetrics, setScanMetrics] = useState<ScanMetrics>({
    totalScans: 0,
    successfulScans: 0,
    failedScans: 0,
    avgProcessingTime: 0,
    topModules: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { toast } = useToast();

  // Load system data
  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      // Load system logs
      const { data: systemLogsData } = await supabase.functions.invoke('system-monitor', {
        body: { action: 'getLogs', limit: 100 }
      });
      
      // Load scan logs
      const { data: scanLogsData } = await supabase.functions.invoke('system-monitor', {
        body: { action: 'getScanLogs', limit: 200 }
      });
      
      // Load analytics
      const { data: analyticsData } = await supabase.functions.invoke('system-monitor', {
        body: { action: 'getAnalytics', timeRange: '24h' }
      });
      
      // Process logs
      if (systemLogsData?.logs) {
        const processedLogs = systemLogsData.logs.map((log: any) => ({
          id: log.id,
          timestamp: log.timestamp,
          level: log.level,
          source: log.source,
          message: log.message,
          metadata: log.metadata
        }));
        setLogs(processedLogs);
      }
      
      if (scanLogsData?.scanLogs) {
        const processedScanLogs = scanLogsData.scanLogs.map((log: any) => ({
          id: log.id,
          timestamp: log.created_at,
          level: log.error_message ? 'error' : 'info',
          source: log.module,
          message: log.event_type,
          metadata: log
        }));
        setScanLogs(processedScanLogs);
      }
      
      // Calculate metrics from AI processing logs
      const { data: aiData } = await supabase
        .from('ai_processing_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (aiData) {
        const successful = aiData.filter(log => log.success);
        const totalConfidence = successful.reduce((sum, log) => sum + (log.confidence || 0), 0);
        const totalTime = aiData.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0);
        
        setAIMetrics({
          totalProcessed: aiData.length,
          successRate: aiData.length > 0 ? (successful.length / aiData.length) * 100 : 0,
          avgConfidence: successful.length > 0 ? (totalConfidence / successful.length) * 100 : 0,
          avgProcessingTime: aiData.length > 0 ? totalTime / aiData.length : 0,
          modelsActive: [...new Set(aiData.map(log => log.model_name))]
        });
      }
      
      // Calculate scan metrics
      const { data: scanData } = await supabase
        .from('scan_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (scanData) {
        const successful = scanData.filter(scan => !scan.error_message);
        const failed = scanData.filter(scan => scan.error_message);
        const totalTime = scanData.reduce((sum, scan) => sum + (scan.processing_time_ms || 0), 0);
        
        // Count by module
        const moduleCount = scanData.reduce((acc: any, scan) => {
          acc[scan.module] = (acc[scan.module] || 0) + 1;
          return acc;
        }, {});
        
        const topModules = Object.entries(moduleCount)
          .map(([module, count]) => ({ module, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        setScanMetrics({
          totalScans: scanData.length,
          successfulScans: successful.length,
          failedScans: failed.length,
          avgProcessingTime: scanData.length > 0 ? totalTime / scanData.length : 0,
          topModules
        });
      }
      
      // Update system status
      const hasErrors = logs.some(log => log.level === 'error') || scanMetrics.failedScans > scanMetrics.successfulScans;
      const hasWarnings = logs.some(log => log.level === 'warn') || aiMetrics.successRate < 90;
      
      setSystemStatus({
        overall: hasErrors ? 'critical' : hasWarnings ? 'warning' : 'healthy',
        database: 'connected',
        ai: aiMetrics.successRate > 80 ? 'operational' : aiMetrics.successRate > 50 ? 'degraded' : 'offline',
        scanning: scanMetrics.successfulScans > scanMetrics.failedScans ? 'active' : 'error',
        lastUpdated: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error loading system data:', error);
      toast({
        title: "System Monitoring Error",
        description: "Failed to load system data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    loadSystemData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSystemData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Copy all system logs
  const copyAllLogs = async () => {
    try {
      const allData = {
        systemStatus,
        timestamp: new Date().toISOString(),
        systemLogs: logs,
        scanLogs: scanLogs,
        aiMetrics,
        scanMetrics,
        userAgent: navigator.userAgent,
        url: window.location.href,
        localTime: new Date().toLocaleString()
      };
      
      const formattedData = JSON.stringify(allData, null, 2);
      await navigator.clipboard.writeText(formattedData);
      
      toast({
        title: "Logs Copied",
        description: "All system logs copied to clipboard for support analysis",
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy logs to clipboard",
        variant: "destructive",
      });
    }
  };

  // Export logs as JSON file
  const exportLogs = () => {
    const allData = {
      systemStatus,
      timestamp: new Date().toISOString(),
      systemLogs: logs,
      scanLogs: scanLogs,
      aiMetrics,
      scanMetrics,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yacht-system-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs Exported",
      description: "System logs downloaded as JSON file",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'operational':
      case 'active':
        return 'bg-green-500';
      case 'warning':
      case 'degraded':
      case 'slow':
        return 'bg-yellow-500';
      case 'critical':
      case 'offline':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'operational':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
      case 'degraded':
      case 'slow':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
      case 'offline':
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Monitoring</h1>
        <div className="flex gap-2">
          <Button
            onClick={copyAllLogs}
            variant="outline"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy All Logs
          </Button>
          <Button
            onClick={exportLogs}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={loadSystemData}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
            {getStatusIcon(systemStatus.overall)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{systemStatus.overall}</div>
            <div className={`w-full h-2 rounded-full mt-2 ${getStatusColor(systemStatus.overall)}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{systemStatus.database}</div>
            <Badge variant={systemStatus.database === 'connected' ? 'default' : 'destructive'} className="mt-2">
              {systemStatus.database}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Systems</CardTitle>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiMetrics.totalProcessed}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {aiMetrics.successRate.toFixed(1)}% success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Scanning</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scanMetrics.totalScans}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {scanMetrics.successfulScans} successful
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Success Rate</span>
                <span>{aiMetrics.successRate.toFixed(1)}%</span>
              </div>
              <Progress value={aiMetrics.successRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Avg Confidence</span>
                <span>{aiMetrics.avgConfidence.toFixed(1)}%</span>
              </div>
              <Progress value={aiMetrics.avgConfidence} className="h-2" />
            </div>
            
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Avg Processing Time:</span>
                <span>{aiMetrics.avgProcessingTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Active Models:</span>
                <span>{aiMetrics.modelsActive.length}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {aiMetrics.modelsActive.map(model => (
                <Badge key={model} variant="secondary" className="text-xs">
                  {model}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scanning Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-green-600">{scanMetrics.successfulScans}</div>
                <div className="text-muted-foreground">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{scanMetrics.failedScans}</div>
                <div className="text-muted-foreground">Failed</div>
              </div>
            </div>
            
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Avg Processing Time:</span>
                <span>{scanMetrics.avgProcessingTime.toFixed(0)}ms</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Top Modules:</div>
              {scanMetrics.topModules.map(({ module, count }) => (
                <div key={module} className="flex justify-between text-sm">
                  <span className="capitalize">{module}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="system" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="system">System Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="scans">Scan Logs ({scanLogs.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="system">
              <ScrollArea className="h-96 w-full border rounded-md p-4">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="text-sm border-b pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'default'}>
                            {log.level}
                          </Badge>
                          <span className="font-medium">{log.source}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1">{log.message}</div>
                      {log.metadata && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer">Show Details</summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No system logs available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="scans">
              <ScrollArea className="h-96 w-full border rounded-md p-4">
                <div className="space-y-2">
                  {scanLogs.map((log) => (
                    <div key={log.id} className="text-sm border-b pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.level === 'error' ? 'destructive' : 'default'}>
                            {log.level}
                          </Badge>
                          <span className="font-medium">{log.source}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1">{log.message}</div>
                      {log.metadata && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer">Show Details</summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                  {scanLogs.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No scan logs available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitoringDashboard;