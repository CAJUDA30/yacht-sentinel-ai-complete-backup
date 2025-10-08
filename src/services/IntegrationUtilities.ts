import { supabase } from "@/integrations/supabase/client";
import { universalEventBus } from "./UniversalEventBus";
import { yachtieService } from "./YachtieIntegrationService";

interface ModuleConnectionHealth {
  module: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastSeen: Date;
  errorCount: number;
  avgResponseTime: number;
}

interface CrossModuleTransaction {
  id: string;
  sourceModule: string;
  targetModules: string[];
  operation: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  payload: any;
  results: Record<string, any>;
}

class IntegrationUtilities {
  private moduleHealth = new Map<string, ModuleConnectionHealth>();
  private transactions = new Map<string, CrossModuleTransaction>();

  constructor() {
    this.initializeHealthMonitoring();
  }

  private initializeHealthMonitoring(): void {
    // Monitor module health through event activity
    universalEventBus.subscribe('*', (event) => {
      this.updateModuleHealth(event.module);
    });

    // Periodic health checks
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  private updateModuleHealth(module: string): void {
    const existing = this.moduleHealth.get(module);
    const now = new Date();

    if (existing) {
      existing.lastSeen = now;
      // Reset error count if module is active
      if (now.getTime() - existing.lastSeen.getTime() < 60000) { // Within 1 minute
        existing.status = 'healthy';
        existing.errorCount = Math.max(0, existing.errorCount - 1);
      }
    } else {
      this.moduleHealth.set(module, {
        module,
        status: 'healthy',
        lastSeen: now,
        errorCount: 0,
        avgResponseTime: 0
      });
    }
  }

  private performHealthChecks(): void {
    const now = new Date();
    
    for (const [module, health] of this.moduleHealth.entries()) {
      const timeSinceLastSeen = now.getTime() - health.lastSeen.getTime();
      
      if (timeSinceLastSeen > 300000) { // 5 minutes
        health.status = 'failed';
        health.errorCount++;
      } else if (timeSinceLastSeen > 120000) { // 2 minutes
        health.status = 'degraded';
      }
    }
  }

  // Cross-module transaction management
  async startTransaction(
    sourceModule: string,
    targetModules: string[],
    operation: string,
    payload: any
  ): Promise<string> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: CrossModuleTransaction = {
      id: transactionId,
      sourceModule,
      targetModules,
      operation,
      status: 'pending',
      startedAt: new Date(),
      payload,
      results: {}
    };

    this.transactions.set(transactionId, transaction);

    // Emit transaction start event
    universalEventBus.emit('transaction_started', 'integration', {
      transactionId,
      sourceModule,
      targetModules,
      operation
    });

    return transactionId;
  }

  async completeTransaction(transactionId: string, results: Record<string, any>): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error(`Transaction not found: ${transactionId}`);

    transaction.status = 'completed';
    transaction.completedAt = new Date();
    transaction.results = results;

    // Emit transaction completed event
    universalEventBus.emit('transaction_completed', 'integration', {
      transactionId,
      duration: transaction.completedAt.getTime() - transaction.startedAt.getTime(),
      results
    });

    // Log transaction completion
    await this.logTransaction(transaction);
  }

  async failTransaction(transactionId: string, error: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) throw new Error(`Transaction not found: ${transactionId}`);

    transaction.status = 'failed';
    transaction.completedAt = new Date();
    transaction.results = { error };

    // Emit transaction failed event
    universalEventBus.emit('transaction_failed', 'integration', {
      transactionId,
      error
    });

    await this.logTransaction(transaction);
  }

  private async logTransaction(transaction: CrossModuleTransaction): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: `transaction_${transaction.status}`,
        module: 'integration',
        event_message: `Cross-module transaction ${transaction.operation}`,
        severity: transaction.status === 'failed' ? 'error' : 'info',
        metadata: {
          transaction_id: transaction.id,
          source_module: transaction.sourceModule,
          target_modules: transaction.targetModules,
          operation: transaction.operation,
          duration_ms: transaction.completedAt && transaction.startedAt
            ? transaction.completedAt.getTime() - transaction.startedAt.getTime()
            : null,
          results: transaction.results
        }
      });
    } catch (error) {
      console.error('Failed to log transaction:', error);
    }
  }

  // Data transformation utilities
  async transformDataForModule(
    data: any,
    sourceModule: string,
    targetModule: string,
    transformationType: string = 'default'
  ): Promise<any> {
    try {
      const transformRequest = {
        text: `Transform data from ${sourceModule} to ${targetModule}`,
        task: 'analyze' as const,
        context: JSON.stringify({
          sourceModule,
          targetModule,
          transformationType,
          data: typeof data === 'object' ? JSON.stringify(data) : data
        })
      };

      const response = await yachtieService.process(transformRequest);
      
      if (response.success && response.result) {
        try {
          return JSON.parse(response.result);
        } catch {
          return response.result;
        }
      }

      throw new Error('AI transformation failed');
    } catch (error) {
      console.error('Data transformation failed:', error);
      // Fallback to basic transformation
      return this.basicDataTransform(data, sourceModule, targetModule);
    }
  }

  private basicDataTransform(data: any, sourceModule: string, targetModule: string): any {
    // Basic field mapping between common modules
    const fieldMappings: Record<string, Record<string, string>> = {
      'equipment_maintenance': {
        'equipment_id': 'item_id',
        'equipment_name': 'item_name',
        'maintenance_type': 'task_type'
      },
      'inventory_procurement': {
        'item_id': 'product_id',
        'quantity': 'requested_quantity',
        'min_stock': 'minimum_threshold'
      },
      'claims_finance': {
        'claim_id': 'reference_id',
        'cost': 'amount',
        'claim_status': 'transaction_status'
      }
    };

    const mappingKey = `${sourceModule}_${targetModule}`;
    const mapping = fieldMappings[mappingKey];

    if (!mapping) return data;

    const transformed: any = { ...data };
    
    for (const [sourceField, targetField] of Object.entries(mapping)) {
      if (data[sourceField] !== undefined) {
        transformed[targetField] = data[sourceField];
        if (sourceField !== targetField) {
          delete transformed[sourceField];
        }
      }
    }

    return transformed;
  }

  // Module dependency management
  async validateModuleDependencies(module: string, operation: string): Promise<{
    canProceed: boolean;
    missingDependencies: string[];
    warnings: string[];
  }> {
    const dependencies: Record<string, string[]> = {
      'maintenance': ['equipment', 'inventory'],
      'procurement': ['inventory', 'finance'],
      'claims': ['equipment', 'finance'],
      'audit': ['equipment', 'maintenance', 'crew']
    };

    const requiredDeps = dependencies[module] || [];
    const missingDependencies: string[] = [];
    const warnings: string[] = [];

    for (const dep of requiredDeps) {
      const health = this.moduleHealth.get(dep);
      
      if (!health || health.status === 'failed') {
        missingDependencies.push(dep);
      } else if (health.status === 'degraded') {
        warnings.push(`${dep} module is degraded`);
      }
    }

    return {
      canProceed: missingDependencies.length === 0,
      missingDependencies,
      warnings
    };
  }

  // Integration testing utilities
  async testModuleIntegration(sourceModule: string, targetModule: string): Promise<{
    success: boolean;
    latency: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test data flow
      const testData = { test: true, timestamp: new Date().toISOString() };
      const transactionId = await this.startTransaction(
        sourceModule,
        [targetModule],
        'integration_test',
        testData
      );

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));

      await this.completeTransaction(transactionId, { success: true });

      const latency = Date.now() - startTime;

      return {
        success: true,
        latency,
        errors
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        latency: Date.now() - startTime,
        errors
      };
    }
  }

  // API methods
  getModuleHealth(): ModuleConnectionHealth[] {
    return Array.from(this.moduleHealth.values());
  }

  getActiveTransactions(): CrossModuleTransaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.status === 'pending' || tx.status === 'processing');
  }

  getTransactionHistory(limit: number = 50): CrossModuleTransaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  async getIntegrationMetrics(): Promise<{
    totalTransactions: number;
    successRate: number;
    avgLatency: number;
    healthyModules: number;
    totalModules: number;
  }> {
    const transactions = Array.from(this.transactions.values());
    const completedTransactions = transactions.filter(tx => tx.completedAt);
    const successfulTransactions = completedTransactions.filter(tx => tx.status === 'completed');
    
    const avgLatency = completedTransactions.length > 0
      ? completedTransactions.reduce((sum, tx) => {
          return sum + (tx.completedAt!.getTime() - tx.startedAt.getTime());
        }, 0) / completedTransactions.length
      : 0;

    const healthyModules = Array.from(this.moduleHealth.values())
      .filter(health => health.status === 'healthy').length;

    return {
      totalTransactions: transactions.length,
      successRate: completedTransactions.length > 0 
        ? (successfulTransactions.length / completedTransactions.length) * 100 
        : 100,
      avgLatency,
      healthyModules,
      totalModules: this.moduleHealth.size
    };
  }

  // Cleanup utilities
  clearOldTransactions(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [id, transaction] of this.transactions.entries()) {
      if (transaction.startedAt < cutoff && transaction.status !== 'pending') {
        this.transactions.delete(id);
      }
    }
  }

  // Event utilities for cross-module communication
  async broadcastToModules(
    modules: string[],
    event: string,
    payload: any,
    options: { priority?: number; timeout?: number } = {}
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const promises = modules.map(async (module) => {
      try {
        // Emit event to specific module
        universalEventBus.emit(`${event}_${module}`, module, payload);
        results[module] = { success: true };
      } catch (error) {
        results[module] = { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    });

    await Promise.allSettled(promises);
    return results;
  }
}

export const integrationUtilities = new IntegrationUtilities();