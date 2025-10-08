/**
 * UnifiedDataService - Consolidated Data Management
 * 
 * Eliminates duplicate data operations and provides a single source of truth
 * for all data access with caching, deduplication, and optional Yachtie processing.
 */

import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from "./YachtieIntegrationService";
const fromAny = (supabase as any).from.bind(supabase as any);

interface CacheEntry {
  data: any;
  timestamp: number;
  key: string;
  ttl: number;
}

interface DataQuery {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean }[];
  limit?: number;
  cached?: boolean;
  cacheTtl?: number;
}

interface DataMutation {
  table: string;
  operation: "insert" | "update" | "upsert" | "delete";
  data?: any;
  filters?: Record<string, any>;
  returning?: string;
}

class UnifiedDataService {
  private static instance: UnifiedDataService;
  private cache = new Map<string, CacheEntry>();
  private subscriptions = new Map<string, { unsubscribe: () => void }>();
  private duplicateTracker = new Map<string, Set<string>>();
  private readonly defaultCacheTtl = 300000; // 5 minutes

  private constructor() {
    this.setupPeriodicCleanup();
  }

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  /**
   * Unified query method with automatic caching and deduplication
   */
  async query(queryConfig: DataQuery): Promise<any> {
    const cacheKey = this.generateCacheKey(queryConfig);
    
    // Check cache first
    if (queryConfig.cached !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.trackDuplicateRequest(cacheKey, 'cache_hit');
        return cached;
      }
    }

    try {
      // Build Supabase query
      let query: any = (supabase as any).from(queryConfig.table as any);
      
      if (queryConfig.select) {
        query = query.select(queryConfig.select);
      }
      
      // Apply filters
      if (queryConfig.filters) {
        Object.entries(queryConfig.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (value && typeof value === "object" && "operator" in value) {
            const op = (value as any).operator as string;
            const val = (value as any).value;
            // @ts-ignore - index access for operator is supported by supabase-js types
            query = query[op](key, val);
          } else {
            query = query.eq(key, value);
          }
        });
      }
      
      // Apply ordering
      if (queryConfig.orderBy) {
        queryConfig.orderBy.forEach(order => {
          query = query.order(order.column, { ascending: order.ascending });
        });
      }
      
      // Apply limit
      if (queryConfig.limit) {
        query = query.limit(queryConfig.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Process data with Yachtie if needed (e.g., for multilingual content)
      const processedData = await this.processDataWithYachtie(data, queryConfig);

      // Cache the result
      if (queryConfig.cached !== false) {
        this.setCache(cacheKey, processedData, queryConfig.cacheTtl || this.defaultCacheTtl);
      }

      // Track successful query
      this.trackDuplicateRequest(cacheKey, 'database_query');

      return processedData;

    } catch (error) {
      console.error('UnifiedDataService query error:', error);
      throw error;
    }
  }

  /**
   * Unified mutation method with validation and conflict resolution
   */
  async mutate(mutationConfig: DataMutation): Promise<any> {
    try {
      // Validate data with Yachtie if it contains text
      if (mutationConfig.data && this.containsTextData(mutationConfig.data)) {
        const validationResult = await yachtieService.validate(
          JSON.stringify(mutationConfig.data),
          'database_mutation'
        );
        
        if (!validationResult.success) {
          throw new Error(`Data validation failed: ${validationResult.error}`);
        }
      }

      let query: any = fromAny(mutationConfig.table as any);
      let result;

      switch (mutationConfig.operation) {
        case 'insert':
          result = await query.insert(mutationConfig.data).select(mutationConfig.returning || '*');
          break;
          
        case 'update':
          result = await query
            .update(mutationConfig.data)
            .match(mutationConfig.filters || {})
            .select(mutationConfig.returning || '*');
          break;
          
        case 'upsert':
          result = await query.upsert(mutationConfig.data).select(mutationConfig.returning || '*');
          break;
          
        case 'delete':
          result = await query
            .delete()
            .match(mutationConfig.filters || {})
            .select(mutationConfig.returning || '*');
          break;
          
        default:
          throw new Error(`Unsupported operation: ${mutationConfig.operation}`);
      }

      if (result.error) throw result.error;

      // Invalidate related cache entries
      this.invalidateRelatedCache(mutationConfig.table);

      // Log mutation for audit
      await this.logDataMutation(mutationConfig, result.data);

      return result.data;

    } catch (error) {
      console.error('UnifiedDataService mutation error:', error);
      throw error;
    }
  }

  /**
   * Real-time subscription with automatic deduplication
   */
  subscribe(config: DataQuery, callback: (data: any) => void): () => void {
    const subscriptionKey = this.generateCacheKey(config);
    
    // Check for existing subscription to prevent duplicates
    if (this.subscriptions.has(subscriptionKey)) {
      console.warn(`Duplicate subscription detected for ${subscriptionKey}`);
      return this.subscriptions.get(subscriptionKey)!.unsubscribe;
    }

    const channel = supabase
      .channel(`unified_${subscriptionKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: config.table,
          ...(config.filters && { filter: this.buildPostgresFilter(config.filters) })
        },
        async (payload) => {
          // Process changes with Yachtie
          const processedPayload = await this.processDataWithYachtie([payload.new || payload.old], config);
          callback(processedPayload[0]);
          
          // Invalidate cache for this table
          this.invalidateRelatedCache(config.table);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      supabase.removeChannel(channel);
      this.subscriptions.delete(subscriptionKey);
    };

    this.subscriptions.set(subscriptionKey, { unsubscribe });
    
    return unsubscribe;
  }

  /**
   * Batch operations with simple optimization
   */
  async batch(operations: (DataQuery | DataMutation)[]): Promise<any[]> {
    const results: any[] = [];
    const queries = operations.filter((op) => (op as any).table && !(op as any).operation) as DataQuery[];
    const mutations = operations.filter((op) => (op as any).operation) as DataMutation[];

    if (queries.length > 0) {
      const queryResults = await Promise.all(queries.map((q) => this.query(q)));
      results.push(...queryResults);
    }

    for (const mutation of mutations) {
      const result = await this.mutate(mutation);
      results.push(result);
    }

    return results;
  }

  /**
   * Advanced search with Yachtie-powered semantic matching
   */
  async search(
    table: string,
    searchTerm: string,
    columns: string[],
    options?: { limit?: number; fuzzy?: boolean; multilingual?: boolean; semantic?: boolean }
  ): Promise<any> {
    const opts = { limit: 50, fuzzy: false, multilingual: true, semantic: true, ...options };

    // Use Yachtie for semantic search enhancement
    const searchAnalysis = await yachtieService.process({
      text: searchTerm,
      task: "analyze",
      context: "search_query",
      options: { extractKeywords: true, detectLanguage: opts.multilingual, semanticExpansion: opts.semantic },
    });

    let query: any = fromAny(table as any).select("*");

    if (opts.fuzzy && searchAnalysis.success) {
      const keywords: string[] = searchAnalysis.result?.keywords || [searchTerm];
      const conditions = columns.flatMap((col) => keywords.map((k) => `${col}.ilike.%${k}%`));
      query = query.or(conditions.join(","));
    } else {
      const conditions = columns.map((col) => `${col}.ilike.%${searchTerm}%`);
      query = query.or(conditions.join(","));
    }

    if (opts.limit) {
      query = query.limit(opts.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    if (opts.semantic && data && data.length > 0) {
      return this.rankSearchResults(data, searchTerm, columns);
    }

    return data;
  }

  /**
   * Data deduplication and cleanup (keeps the oldest record)
   */
  async deduplicateTable(
    table: string,
    uniqueFields: string[]
  ): Promise<{ duplicatesFound: number; duplicatesRemoved: number; errors: Array<{ record: string; error: string }> }> {
    const { data: allRecords, error } = await fromAny(table as any).select("*").order("created_at", { ascending: true });
    if (error) throw error;

    const duplicates = this.findDuplicates(allRecords || [], uniqueFields);
    const errors: Array<{ record: string; error: string }> = [];
    let removed = 0;

    for (const group of duplicates) {
      const [keep, ...remove] = group;
      for (const record of remove) {
        try {
          await this.mutate({ table, operation: "delete", filters: { id: record.id } });
          removed++;
        } catch (e: any) {
          errors.push({ record: record.id, error: e?.message || "Unknown error" });
        }
      }
    }

    return { duplicatesFound: duplicates.length, duplicatesRemoved: removed, errors };
  }

  /**
   * Get service statistics
   */
  getStats(): { 
    cacheSize: number;
    cacheHitRate: number;
    activeSubscriptions: number;
    duplicateRequestsBlocked: number;
  } {
    const totalRequests = Array.from(this.duplicateTracker.values()).reduce((sum, set) => sum + set.size, 0);
    const cacheHits = Array.from(this.duplicateTracker.values()).reduce(
      (sum, set) => sum + Array.from(set).filter((t) => t === "cache_hit").length,
      0
    );

    return {
      cacheSize: this.cache.size,
      cacheHitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      activeSubscriptions: this.subscriptions.size,
      duplicateRequestsBlocked: cacheHits
    };
  }

  // ---------- Private helpers ----------

  private async processDataWithYachtie(data: any[], _config: DataQuery): Promise<any[]> {
    if (!Array.isArray(data) || data.length === 0) return data;
    const textFields = this.identifyTextFields(data[0]);
    if (textFields.length === 0) return data;

    try {
      const processed = await Promise.all(
        data.map(async (item) => {
          const next = { ...item };
          for (const field of textFields) {
            if (typeof item[field] === "string" && item[field].length > 10) {
              const res = await yachtieService.validate(item[field], "data_processing");
              if (res.success) {
                next[`${field}_processed`] = res.result;
                next[`${field}_language`] = res.language;
              }
            }
          }
          return next;
        })
      );
      return processed;
    } catch (e) {
      console.warn("Yachtie processing failed:", e);
      return data;
    }
  }

  private identifyTextFields(sample: any): string[] {
    if (!sample || typeof sample !== "object") return [];
    return Object.keys(sample).filter((k) => {
      const v = (sample as any)[k];
      return typeof v === "string" && v.length > 10 && !k.includes("id") && !k.includes("url") && !k.includes("email");
    });
  }

  private containsTextData(data: any): boolean {
    if (typeof data === "string") return data.length > 10;
    if (data && typeof data === "object") return Object.values(data).some((v) => this.containsTextData(v));
    return false;
  }

  private generateCacheKey(config: DataQuery | DataMutation): string {
    return btoa(JSON.stringify(config)).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), key, ttl });
  }

  private invalidateRelatedCache(table: string): void {
    const encoded = btoa(table).substring(0, 8);
    for (const key of this.cache.keys()) {
      if (key.includes(encoded)) this.cache.delete(key);
    }
  }

  private trackDuplicateRequest(key: string, type: string): void {
    if (!this.duplicateTracker.has(key)) this.duplicateTracker.set(key, new Set());
    this.duplicateTracker.get(key)!.add(type);
  }

  private findDuplicates(records: any[], uniqueFields: string[]): any[][] {
    const groups = new Map<string, any[]>();
    for (const r of records) {
      const k = uniqueFields.map((f) => r[f]).join("|");
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    }
    return Array.from(groups.values()).filter((g) => g.length > 1);
  }

  private buildPostgresFilter(filters: Record<string, any>): string {
    return Object.entries(filters)
      .map(([k, v]) => `${k}=eq.${v}`)
      .join("&");
  }

  private async rankSearchResults(results: any[], searchTerm: string, columns: string[]): Promise<any[]> {
    try {
      const rankings = await Promise.all(
        results.map(async (result, index) => {
          const text = columns.map((c) => result[c]).filter(Boolean).join(" ");
          const similarity = await yachtieService.process({
            text: `${searchTerm}|||${text}`,
            task: "analyze",
            context: "similarity_scoring",
            options: { scoreSimilarity: true },
          });
          return { index, score: similarity.success ? similarity.confidence : 0.5, result };
        })
      );
      return rankings.sort((a, b) => b.score - a.score).map((r) => r.result);
    } catch (e) {
      console.warn("Result ranking failed:", e);
      return results;
    }
  }

  private async logDataMutation(config: DataMutation, result: any): Promise<void> {
    try {
      await supabase.from("analytics_events").insert({
        event_type: `data_${config.operation}`,
        event_message: `${config.operation} operation on ${config.table}`,
        module: "unified_data_service",
        severity: "info",
        metadata: {
          table: config.table,
          operation: config.operation,
          recordCount: Array.isArray(result) ? result.length : 1,
        },
      });
    } catch (e) {
      console.warn("Failed to log data mutation:", e);
    }
  }

  private setupPeriodicCleanup(): void {
    // Cache cleanup every 10 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) this.cache.delete(key);
      }
    }, 600000);

    // Duplicate tracker reset every hour
    setInterval(() => {
      this.duplicateTracker.clear();
    }, 3600000);
  }
}

// Export singleton instance and helpers
export const unifiedDataService = UnifiedDataService.getInstance();
export const query = (config: DataQuery) => unifiedDataService.query(config);
export const mutate = (config: DataMutation) => unifiedDataService.mutate(config);
export const subscribe = (config: DataQuery, callback: (data: any) => void) =>
  unifiedDataService.subscribe(config, callback);
export const search = (table: string, term: string, columns: string[], options?: any) =>
  unifiedDataService.search(table, term, columns, options);
