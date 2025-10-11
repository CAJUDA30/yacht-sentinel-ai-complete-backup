import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Zap, 
  Database, 
  Wifi, 
  HardDrive, 
  Cpu, 
  Timer, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface PerformanceMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  timing: {
    pageLoad: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  network: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  vitals: {
    cls: number; // Cumulative Layout Shift
    fid: number; // First Input Delay
    lcp: number; // Largest Contentful Paint
  };
  resources: {
    totalResources: number;
    totalSize: number;
    cacheHitRate: number;
  };
  smartscan: {
    processingTime: number;
    accuracy: number;
    throughput: number;
    errorRate: number;
  };
}

interface PerformanceMonitorProps {
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ type: 'warning' | 'error'; message: string }>>([]);

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // Initial metrics collection
    collectMetrics();
    
    // Set up periodic monitoring
    const interval = setInterval(collectMetrics, 5000); // Every 5 seconds
    
    // Monitor performance observer
    if ('PerformanceObserver' in window) {
      setupPerformanceObserver();
    }

    return () => {
      clearInterval(interval);
    };
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const collectMetrics = () => {
    try {
      const performanceEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memoryInfo = (performance as any).memory;
      const connection = (navigator as any).connection;

      // Collect timing metrics
      const timing = {
        pageLoad: performanceEntries.loadEventEnd - performanceEntries.loadEventStart,
        domContentLoaded: performanceEntries.domContentLoadedEventEnd - performanceEntries.domContentLoadedEventStart,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      };

      // Get paint metrics
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          timing.firstContentfulPaint = entry.startTime;
        }
      });

      // Memory metrics
      const memory = memoryInfo ? {
        used: memoryInfo.usedJSHeapSize,
        total: memoryInfo.totalJSHeapSize,
        percentage: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100
      } : {
        used: 0,
        total: 0,
        percentage: 0
      };

      // Network metrics
      const network = connection ? {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0
      } : {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0
      };

      // Resource metrics
      const resourceEntries = performance.getEntriesByType('resource');
      const totalSize = resourceEntries.reduce((total, entry: any) => {
        return total + (entry.transferSize || 0);
      }, 0);

      const resources = {
        totalResources: resourceEntries.length,
        totalSize: totalSize,
        cacheHitRate: calculateCacheHitRate(resourceEntries)
      };

      // Mock SmartScan metrics (in real implementation, these would come from actual usage)
      const smartscan = {
        processingTime: Math.random() * 2000 + 500, // 500-2500ms
        accuracy: Math.random() * 0.1 + 0.9, // 90-100%
        throughput: Math.random() * 50 + 20, // 20-70 docs/min
        errorRate: Math.random() * 0.05 // 0-5%
      };

      // Mock Web Vitals (in real implementation, use web-vitals library)
      const vitals = {
        cls: Math.random() * 0.1, // Good: < 0.1
        fid: Math.random() * 100, // Good: < 100ms
        lcp: timing.largestContentfulPaint || Math.random() * 2500 + 1000 // Good: < 2.5s
      };

      const newMetrics: PerformanceMetrics = {
        memory,
        timing,
        network,
        vitals,
        resources,
        smartscan
      };

      setMetrics(newMetrics);
      checkAlerts(newMetrics);
      
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  };

  const setupPerformanceObserver = () => {
    try {
      // Observe Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        setMetrics(prev => prev ? {
          ...prev,
          vitals: {
            ...prev.vitals,
            lcp: lastEntry.startTime
          }
        } : null);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => prev ? {
            ...prev,
            vitals: {
              ...prev.vitals,
              fid: entry.processingStart - entry.startTime
            }
          } : null);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observe Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        
        setMetrics(prev => prev ? {
          ...prev,
          vitals: {
            ...prev.vitals,
            cls
          }
        } : null);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.error('Error setting up performance observer:', error);
    }
  };

  const calculateCacheHitRate = (resourceEntries: PerformanceEntry[]) => {
    const cachedResources = resourceEntries.filter((entry: any) => 
      entry.transferSize === 0 && entry.decodedBodySize > 0
    );
    return resourceEntries.length > 0 ? (cachedResources.length / resourceEntries.length) * 100 : 0;
  };

  const checkAlerts = (metrics: PerformanceMetrics) => {
    const newAlerts: Array<{ type: 'warning' | 'error'; message: string }> = [];

    // Memory alerts
    if (metrics.memory.percentage > 90) {
      newAlerts.push({ type: 'error', message: 'Memory usage is critically high (>90%)' });
    } else if (metrics.memory.percentage > 75) {
      newAlerts.push({ type: 'warning', message: 'Memory usage is high (>75%)' });
    }

    // Performance alerts
    if (metrics.vitals.lcp > 4000) {
      newAlerts.push({ type: 'error', message: 'Largest Contentful Paint is too slow (>4s)' });
    } else if (metrics.vitals.lcp > 2500) {
      newAlerts.push({ type: 'warning', message: 'Largest Contentful Paint needs improvement (>2.5s)' });
    }

    if (metrics.vitals.fid > 300) {
      newAlerts.push({ type: 'error', message: 'First Input Delay is too high (>300ms)' });
    } else if (metrics.vitals.fid > 100) {
      newAlerts.push({ type: 'warning', message: 'First Input Delay needs improvement (>100ms)' });
    }

    if (metrics.vitals.cls > 0.25) {
      newAlerts.push({ type: 'error', message: 'Cumulative Layout Shift is too high (>0.25)' });
    } else if (metrics.vitals.cls > 0.1) {
      newAlerts.push({ type: 'warning', message: 'Cumulative Layout Shift needs improvement (>0.1)' });
    }

    // SmartScan alerts
    if (metrics.smartscan.errorRate > 0.1) {
      newAlerts.push({ type: 'error', message: 'SmartScan error rate is too high (>10%)' });
    } else if (metrics.smartscan.errorRate > 0.05) {
      newAlerts.push({ type: 'warning', message: 'SmartScan error rate is elevated (>5%)' });
    }

    if (metrics.smartscan.processingTime > 5000) {
      newAlerts.push({ type: 'error', message: 'SmartScan processing time is too slow (>5s)' });
    } else if (metrics.smartscan.processingTime > 2000) {
      newAlerts.push({ type: 'warning', message: 'SmartScan processing time is slow (>2s)' });
    }

    setAlerts(newAlerts);
  };

  const getStatusColor = (value: number, goodThreshold: number, warningThreshold: number) => {
    if (value <= goodThreshold) return 'text-green-600';
    if (value <= warningThreshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, goodThreshold: number, warningThreshold: number) => {
    if (value <= goodThreshold) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (value <= warningThreshold) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="h-6 w-6 animate-pulse mr-2" />
            <span>Collecting performance metrics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">LCP</span>
                {getStatusIcon(metrics.vitals.lcp, 2500, 4000)}
              </div>
              <div className="text-2xl font-bold">
                {(metrics.vitals.lcp / 1000).toFixed(2)}s
              </div>
              <Progress 
                value={(metrics.vitals.lcp / 4000) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Largest Contentful Paint (Good: &lt;2.5s)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FID</span>
                {getStatusIcon(metrics.vitals.fid, 100, 300)}
              </div>
              <div className="text-2xl font-bold">
                {metrics.vitals.fid.toFixed(0)}ms
              </div>
              <Progress 
                value={(metrics.vitals.fid / 300) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                First Input Delay (Good: &lt;100ms)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CLS</span>
                {getStatusIcon(metrics.vitals.cls, 0.1, 0.25)}
              </div>
              <div className="text-2xl font-bold">
                {metrics.vitals.cls.toFixed(3)}
              </div>
              <Progress 
                value={(metrics.vitals.cls / 0.25) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Cumulative Layout Shift (Good: &lt;0.1)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Used</span>
                <span className="font-mono text-sm">
                  {(metrics.memory.used / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
              <Progress value={metrics.memory.percentage} className="h-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{metrics.memory.percentage.toFixed(1)}% used</span>
                <span>{(metrics.memory.total / 1024 / 1024).toFixed(1)} MB total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Connection</span>
                <Badge variant="outline">{metrics.network.effectiveType}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Downlink</span>
                <span className="font-mono text-sm">{metrics.network.downlink} Mbps</span>
              </div>
              <div className="flex items-center justify-between">
                <span>RTT</span>
                <span className="font-mono text-sm">{metrics.network.rtt} ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SmartScan Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            SmartScan Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Time</span>
                {getStatusIcon(metrics.smartscan.processingTime, 2000, 5000)}
              </div>
              <div className="text-2xl font-bold">
                {(metrics.smartscan.processingTime / 1000).toFixed(2)}s
              </div>
              <p className="text-xs text-muted-foreground">
                Avg document processing (Target: &lt;2s)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Accuracy</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold">
                {(metrics.smartscan.accuracy * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                AI extraction accuracy
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Throughput</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">
                {metrics.smartscan.throughput.toFixed(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Documents per minute
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                {getStatusIcon(metrics.smartscan.errorRate * 100, 5, 10)}
              </div>
              <div className="text-2xl font-bold">
                {(metrics.smartscan.errorRate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Processing failures (Target: &lt;5%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Loading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Resource Loading
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Total Resources</span>
              <div className="text-2xl font-bold">{metrics.resources.totalResources}</div>
              <p className="text-xs text-muted-foreground">Loaded assets</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Total Size</span>
              <div className="text-2xl font-bold">
                {(metrics.resources.totalSize / 1024 / 1024).toFixed(1)} MB
              </div>
              <p className="text-xs text-muted-foreground">Transferred data</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Cache Hit Rate</span>
              <div className="text-2xl font-bold">{metrics.resources.cacheHitRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Cached resources</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;