import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface PerformanceMetrics {
  renderTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  networkLatency: number;
  errorRate: number;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  isOptimized: boolean;
  startPerformanceMonitoring: () => void;
  stopPerformanceMonitoring: () => void;
  logApiCall: (duration: number) => void;
  logError: () => void;
  optimizePerformance: () => void;
}

const defaultMetrics: PerformanceMetrics = {
  renderTime: 0,
  apiResponseTime: 0,
  memoryUsage: 0,
  networkLatency: 0,
  errorRate: 0
};

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

interface PerformanceProviderProps {
  children: ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(defaultMetrics);
  const [isOptimized, setIsOptimized] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [apiCalls, setApiCalls] = useState<number[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);

  const startPerformanceMonitoring = () => {
    setIsMonitoring(true);
    
    // Monitor render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });

    // Monitor memory usage
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo.usedJSHeapSize / 1048576 // Convert to MB
      }));
    }

    // Monitor network performance
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      setMetrics(prev => ({
        ...prev,
        networkLatency: navigationEntry.responseStart - navigationEntry.requestStart
      }));
    }
  };

  const stopPerformanceMonitoring = () => {
    setIsMonitoring(false);
  };

  const logApiCall = (duration: number) => {
    setApiCalls(prev => [...prev.slice(-99), duration]); // Keep last 100 calls
    setTotalRequests(prev => prev + 1);
    
    const avgResponseTime = apiCalls.reduce((sum, time) => sum + time, 0) / apiCalls.length;
    setMetrics(prev => ({
      ...prev,
      apiResponseTime: avgResponseTime
    }));
  };

  const logError = () => {
    setErrorCount(prev => prev + 1);
    setMetrics(prev => ({
      ...prev,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0
    }));
  };

  const optimizePerformance = () => {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('old') || cacheName.includes('temp')) {
            caches.delete(cacheName);
          }
        });
      });
    }

    // Clear localStorage of old data
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    Object.keys(localStorage).forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && (now - data.timestamp) > oneWeek) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // Skip invalid JSON items
      }
    });

    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    setIsOptimized(true);
    
    toast({
      title: "Performance Optimized",
      description: "Application performance has been optimized."
    });
  };

  // Auto-start monitoring
  useEffect(() => {
    startPerformanceMonitoring();
    return () => stopPerformanceMonitoring();
  }, []);

  // Monitor optimization status
  useEffect(() => {
    const checkOptimization = () => {
      const needsOptimization = 
        metrics.apiResponseTime > 3000 || 
        metrics.memoryUsage > 100 || 
        metrics.errorRate > 5 ||
        metrics.renderTime > 16; // 60fps threshold

      setIsOptimized(!needsOptimization);
    };

    checkOptimization();
  }, [metrics]);

  const value = {
    metrics,
    isOptimized,
    startPerformanceMonitoring,
    stopPerformanceMonitoring,
    logApiCall,
    logError,
    optimizePerformance
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};