/**
 * YachtExcel Performance Monitoring & Optimization
 * Comprehensive performance tracking, analysis, and optimization tools
 */

import { createClient } from '@supabase/supabase-js';

// Performance monitoring configuration
export const performanceConfig = {
  monitoring: {
    enableRealTimeMetrics: true,
    enablePerformanceProfiling: true,
    enableResourceTracking: true,
    enableUserExperienceMetrics: true,
    samplingRate: 0.1, // 10% sampling for production
    retentionDays: 30
  },
  thresholds: {
    apiResponseTime: 2000, // 2 seconds
    databaseQueryTime: 1000, // 1 second
    pageLoadTime: 3000, // 3 seconds
    memoryUsage: 100 * 1024 * 1024, // 100MB
    cpuUsage: 70, // 70%
    errorRate: 0.01 // 1%
  },
  optimization: {
    enableAutomaticOptimization: true,
    enableCaching: true,
    enableCompression: true,
    enableCDN: true,
    cacheSize: 50 * 1024 * 1024 // 50MB
  }
};

// Performance metrics collector
export class PerformanceMetrics {
  private metrics: Map<string, any> = new Map();
  private startTimes: Map<string, number> = new Map();
  private memoryBaseline: number = 0;

  constructor() {
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }

  // Start timing a metric
  startTiming(metricName: string): void {
    this.startTimes.set(metricName, performance.now());
  }

  // End timing and record metric
  endTiming(metricName: string): number {
    const startTime = this.startTimes.get(metricName);
    if (!startTime) {
      console.warn(`No start time found for metric: ${metricName}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.recordMetric(metricName, duration, 'duration_ms');
    this.startTimes.delete(metricName);
    
    return duration;
  }

  // Record a general metric
  recordMetric(name: string, value: number, unit: string, metadata?: any): void {
    const metric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    this.metrics.set(name, metric);

    // Check against thresholds
    this.checkThresholds(name, value);
  }

  // Record user experience metrics
  recordUserExperience(action: string, duration: number, success: boolean, metadata?: any): void {
    this.recordMetric(`ux_${action}_duration`, duration, 'ms', {
      success,
      ...metadata
    });

    this.recordMetric(`ux_${action}_success_rate`, success ? 1 : 0, 'boolean');
  }

  // Record API performance
  recordApiCall(endpoint: string, method: string, duration: number, statusCode: number): void {
    this.recordMetric(`api_${endpoint}_${method}_duration`, duration, 'ms', {
      statusCode,
      endpoint,
      method
    });

    this.recordMetric(`api_${endpoint}_${method}_success`, statusCode < 400 ? 1 : 0, 'boolean');
  }

  // Record database query performance
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    this.recordMetric(`db_${operation}_${table}_duration`, duration, 'ms', {
      operation,
      table,
      success
    });
  }

  // Get current memory usage
  getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Browser fallback
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    
    return 0;
  }

  // Get memory usage delta
  getMemoryDelta(): number {
    return this.getCurrentMemoryUsage() - this.memoryBaseline;
  }

  // Check metric against thresholds
  private checkThresholds(metricName: string, value: number): void {
    const thresholds = performanceConfig.thresholds;
    
    let threshold: number | undefined;
    let alertLevel: 'warning' | 'critical' = 'warning';

    if (metricName.includes('api') && metricName.includes('duration')) {
      threshold = thresholds.apiResponseTime;
    } else if (metricName.includes('db') && metricName.includes('duration')) {
      threshold = thresholds.databaseQueryTime;
    } else if (metricName.includes('page_load')) {
      threshold = thresholds.pageLoadTime;
    }

    if (threshold && value > threshold) {
      alertLevel = value > threshold * 2 ? 'critical' : 'warning';
      this.triggerAlert(metricName, value, threshold, alertLevel);
    }
  }

  // Trigger performance alert
  private triggerAlert(metricName: string, value: number, threshold: number, level: 'warning' | 'critical'): void {
    console.warn(`Performance ${level}: ${metricName} = ${value} exceeds threshold ${threshold}`);
    
    // In a real application, this would send alerts to monitoring systems
    if (level === 'critical') {
      this.recordMetric('performance_alert_critical', 1, 'count', {
        metric: metricName,
        value,
        threshold
      });
    }
  }

  // Get all collected metrics
  getMetrics(): Map<string, any> {
    return new Map(this.metrics);
  }

  // Get metrics summary
  getMetricsSummary(): any {
    const summary = {
      totalMetrics: this.metrics.size,
      apiCalls: 0,
      databaseQueries: 0,
      userExperience: 0,
      averageApiDuration: 0,
      averageDbDuration: 0,
      memoryUsage: this.getCurrentMemoryUsage(),
      memoryDelta: this.getMemoryDelta()
    };

    let apiDurations: number[] = [];
    let dbDurations: number[] = [];

    for (const [name, metric] of this.metrics) {
      if (name.startsWith('api_')) {
        summary.apiCalls++;
        if (name.includes('duration')) {
          apiDurations.push(metric.value);
        }
      } else if (name.startsWith('db_')) {
        summary.databaseQueries++;
        if (name.includes('duration')) {
          dbDurations.push(metric.value);
        }
      } else if (name.startsWith('ux_')) {
        summary.userExperience++;
      }
    }

    summary.averageApiDuration = apiDurations.length > 0 
      ? apiDurations.reduce((a, b) => a + b, 0) / apiDurations.length 
      : 0;

    summary.averageDbDuration = dbDurations.length > 0
      ? dbDurations.reduce((a, b) => a + b, 0) / dbDurations.length
      : 0;

    return summary;
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
    this.memoryBaseline = this.getCurrentMemoryUsage();
  }
}

// Database performance optimizer
export class DatabaseOptimizer {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  // Analyze query performance
  async analyzeQueryPerformance(query: string, params?: any): Promise<any> {
    const startTime = performance.now();
    
    try {
      // Execute the query
      const result = await this.executeQuery(query, params);
      const duration = performance.now() - startTime;

      return {
        success: true,
        duration,
        resultCount: result?.data?.length || 0,
        query,
        performance: this.categorizePerformance(duration),
        recommendations: this.generateQueryRecommendations(query, duration)
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        success: false,
        duration,
        error: error.message,
        query,
        recommendations: ['Check query syntax', 'Verify table names and columns']
      };
    }
  }

  // Execute query with performance tracking
  private async executeQuery(query: string, params?: any): Promise<any> {
    // This would execute the actual query
    // For now, return a mock result
    return {
      data: Array.from({ length: 10 }, (_, i) => ({ id: i, data: 'mock' }))
    };
  }

  // Categorize query performance
  private categorizePerformance(duration: number): string {
    if (duration < 100) return 'excellent';
    if (duration < 500) return 'good';
    if (duration < 1000) return 'acceptable';
    if (duration < 2000) return 'slow';
    return 'very_slow';
  }

  // Generate query optimization recommendations
  private generateQueryRecommendations(query: string, duration: number): string[] {
    const recommendations: string[] = [];

    if (duration > 1000) {
      recommendations.push('Consider adding indexes for frequently queried columns');
      recommendations.push('Review WHERE clauses for optimization opportunities');
    }

    if (query.toLowerCase().includes('select *')) {
      recommendations.push('Avoid SELECT * - specify only needed columns');
    }

    if (query.toLowerCase().includes('order by') && duration > 500) {
      recommendations.push('Consider adding index on ORDER BY columns');
    }

    if (query.toLowerCase().includes('like') && duration > 300) {
      recommendations.push('Consider full-text search for LIKE operations');
    }

    return recommendations;
  }

  // Suggest index optimizations
  async suggestIndexOptimizations(tableName: string): Promise<string[]> {
    const suggestions: string[] = [];

    // Analyze common query patterns (this would be based on actual query logs)
    const commonPatterns = [
      { column: 'yacht_id', frequency: 95 },
      { column: 'user_id', frequency: 90 },
      { column: 'created_at', frequency: 80 },
      { column: 'equipment_id', frequency: 75 }
    ];

    for (const pattern of commonPatterns) {
      if (pattern.frequency > 70) {
        suggestions.push(`CREATE INDEX idx_${tableName}_${pattern.column} ON ${tableName} (${pattern.column});`);
      }
    }

    // Composite index suggestions
    if (tableName === 'equipment_sensor_data') {
      suggestions.push('CREATE INDEX idx_sensor_data_composite ON equipment_sensor_data (equipment_id, recorded_at DESC);');
    }

    if (tableName === 'user_memories') {
      suggestions.push('CREATE INDEX idx_memories_user_yacht ON user_memories (user_id, yacht_id);');
    }

    return suggestions;
  }
}

// Caching optimizer
export class CacheOptimizer {
  private cache: Map<string, any> = new Map();
  private cacheStats: Map<string, { hits: number; misses: number; lastAccess: Date }> = new Map();
  private maxCacheSize: number;

  constructor(maxSize: number = performanceConfig.optimization.cacheSize) {
    this.maxCacheSize = maxSize;
  }

  // Get from cache
  get(key: string): any {
    const value = this.cache.get(key);
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, lastAccess: new Date() };

    if (value !== undefined) {
      stats.hits++;
      stats.lastAccess = new Date();
      this.cacheStats.set(key, stats);
      return value;
    } else {
      stats.misses++;
      this.cacheStats.set(key, stats);
      return undefined;
    }
  }

  // Set in cache
  set(key: string, value: any, ttl?: number): void {
    // Check cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    const cacheEntry = {
      value,
      timestamp: Date.now(),
      ttl: ttl ? Date.now() + ttl : undefined
    };

    this.cache.set(key, cacheEntry);
    
    if (!this.cacheStats.has(key)) {
      this.cacheStats.set(key, { hits: 0, misses: 0, lastAccess: new Date() });
    }
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.ttl && Date.now() > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Evict least recently used items
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestAccess: Date | null = null;

    for (const [key, stats] of this.cacheStats) {
      if (!oldestAccess || stats.lastAccess < oldestAccess) {
        oldestAccess = stats.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheStats.delete(oldestKey);
    }
  }

  // Get cache hit ratio
  getHitRatio(): number {
    let totalHits = 0;
    let totalMisses = 0;

    for (const stats of this.cacheStats.values()) {
      totalHits += stats.hits;
      totalMisses += stats.misses;
    }

    const total = totalHits + totalMisses;
    return total > 0 ? totalHits / total : 0;
  }

  // Get cache statistics
  getStats(): any {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRatio: this.getHitRatio(),
      totalEntries: this.cacheStats.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage (rough approximation)
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry).length * 2; // Rough byte estimation
    }
    
    return totalSize;
  }

  // Clear expired entries
  clearExpired(): number {
    let clearedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now > entry.ttl) {
        this.cache.delete(key);
        this.cacheStats.delete(key);
        clearedCount++;
      }
    }

    return clearedCount;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.cacheStats.clear();
  }
}

// Resource optimizer
export class ResourceOptimizer {
  private resourceMetrics: Map<string, any> = new Map();

  // Monitor resource usage
  monitorResources(): any {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: this.getMemoryMetrics(),
      network: this.getNetworkMetrics(),
      storage: this.getStorageMetrics(),
      cpu: this.getCPUMetrics()
    };

    this.resourceMetrics.set('latest', metrics);
    return metrics;
  }

  // Get memory metrics
  private getMemoryMetrics(): any {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers,
        rss: usage.rss
      };
    }

    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }

    return { available: false };
  }

  // Get network metrics (mock for browser environment)
  private getNetworkMetrics(): any {
    // In a real application, this would track actual network usage
    return {
      requestsInFlight: 0,
      bandwidth: 'unknown',
      latency: 'unknown',
      errorRate: 0
    };
  }

  // Get storage metrics
  private getStorageMetrics(): any {
    if (typeof navigator !== 'undefined' && 'storage' in navigator) {
      return navigator.storage.estimate().then(estimate => ({
        quota: estimate.quota,
        usage: estimate.usage,
        available: estimate.quota - estimate.usage
      }));
    }

    return { available: false };
  }

  // Get CPU metrics (limited in browser)
  private getCPUMetrics(): any {
    // Browser environment has limited CPU monitoring
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const usage = process.cpuUsage();
      return {
        user: usage.user,
        system: usage.system
      };
    }

    return { available: false };
  }

  // Optimize resources based on current usage
  optimizeResources(): string[] {
    const optimizations: string[] = [];
    const latest = this.resourceMetrics.get('latest');

    if (!latest) {
      return ['No resource data available for optimization'];
    }

    // Memory optimizations
    if (latest.memory.heapUsed > 50 * 1024 * 1024) { // 50MB
      optimizations.push('Consider implementing memory cleanup routines');
      optimizations.push('Enable garbage collection optimization');
    }

    // Storage optimizations
    if (latest.storage && latest.storage.usage / latest.storage.quota > 0.8) {
      optimizations.push('Clear unused cache entries');
      optimizations.push('Implement data compression');
    }

    return optimizations;
  }
}

// Performance monitoring service
export class PerformanceMonitoringService {
  private metrics: PerformanceMetrics;
  private dbOptimizer: DatabaseOptimizer;
  private cacheOptimizer: CacheOptimizer;
  private resourceOptimizer: ResourceOptimizer;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(supabaseClient?: any) {
    this.metrics = new PerformanceMetrics();
    this.dbOptimizer = new DatabaseOptimizer(supabaseClient);
    this.cacheOptimizer = new CacheOptimizer();
    this.resourceOptimizer = new ResourceOptimizer();
  }

  // Start monitoring
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already running');
      return;
    }

    console.log('Starting YachtExcel performance monitoring...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    // Initial collection
    this.collectMetrics();
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('Stopping YachtExcel performance monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Collect all metrics
  private collectMetrics(): void {
    try {
      // Collect resource metrics
      const resourceMetrics = this.resourceOptimizer.monitorResources();
      
      // Record in performance metrics
      this.metrics.recordMetric('memory_usage', resourceMetrics.memory.heapUsed || 0, 'bytes');
      this.metrics.recordMetric('cache_hit_ratio', this.cacheOptimizer.getHitRatio(), 'ratio');
      
      // Clear expired cache entries
      const clearedEntries = this.cacheOptimizer.clearExpired();
      if (clearedEntries > 0) {
        this.metrics.recordMetric('cache_entries_cleared', clearedEntries, 'count');
      }

      console.log('Performance metrics collected:', this.metrics.getMetricsSummary());
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  // Get comprehensive performance report
  getPerformanceReport(): any {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics.getMetricsSummary(),
      cache: this.cacheOptimizer.getStats(),
      optimizations: this.resourceOptimizer.optimizeResources(),
      status: this.isMonitoring ? 'monitoring' : 'stopped'
    };
  }

  // Get performance metrics instance
  getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  // Get cache optimizer instance
  getCache(): CacheOptimizer {
    return this.cacheOptimizer;
  }

  // Get database optimizer instance
  getDatabaseOptimizer(): DatabaseOptimizer {
    return this.dbOptimizer;
  }

  // Reset all metrics and caches
  reset(): void {
    this.metrics.clear();
    this.cacheOptimizer.clear();
    console.log('Performance monitoring reset complete');
  }
}

// Global performance monitoring instance
export const globalPerformanceMonitor = new PerformanceMonitoringService();

// Performance monitoring React hook for components
export function usePerformanceMonitoring() {
  return {
    monitor: globalPerformanceMonitor,
    startTiming: (name: string) => globalPerformanceMonitor.getMetrics().startTiming(name),
    endTiming: (name: string) => globalPerformanceMonitor.getMetrics().endTiming(name),
    recordMetric: (name: string, value: number, unit: string) => 
      globalPerformanceMonitor.getMetrics().recordMetric(name, value, unit),
    getReport: () => globalPerformanceMonitor.getPerformanceReport()
  };
}