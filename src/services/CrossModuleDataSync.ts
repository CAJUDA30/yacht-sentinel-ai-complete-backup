import { supabase } from "@/integrations/supabase/client";
import { universalEventBus } from "./UniversalEventBus";

interface SyncRule {
  id: string;
  sourceTable: string;
  targetTable: string;
  fieldMappings: Record<string, string>;
  conditions?: Record<string, any>;
  syncType: 'realtime' | 'batch' | 'trigger';
  isActive: boolean;
  lastSyncAt?: Date;
}

interface SyncStatus {
  ruleId: string;
  status: 'syncing' | 'completed' | 'error';
  recordsProcessed: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
}

class CrossModuleDataSync {
  private syncRules = new Map<string, SyncRule>();
  private syncStatuses = new Map<string, SyncStatus>();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.setupDefaultSyncRules();
    this.setupRealtimeListeners();
    
    this.isInitialized = true;
    console.log('CrossModuleDataSync initialized');
  }

  private async setupDefaultSyncRules(): Promise<void> {
    const defaultRules: SyncRule[] = [
      {
        id: 'equipment-to-maintenance',
        sourceTable: 'equipment',
        targetTable: 'maintenance_schedules',
        fieldMappings: {
          'id': 'equipment_id',
          'name': 'equipment_name',
          'status': 'equipment_status',
          'last_maintenance': 'previous_maintenance'
        },
        conditions: { status: ['needs_maintenance', 'critical'] },
        syncType: 'realtime',
        isActive: true
      },
      {
        id: 'inventory-to-procurement',
        sourceTable: 'inventory_items',
        targetTable: 'automated_procurement_requests',
        fieldMappings: {
          'name': 'part_name',
          'part_number': 'part_number',
          'quantity': 'current_stock',
          'min_stock': 'minimum_threshold'
        },
        conditions: { 'quantity': 'below_min_stock' },
        syncType: 'trigger',
        isActive: true
      },
      {
        id: 'crew-to-audit',
        sourceTable: 'crew_members',
        targetTable: 'audit_instances',
        fieldMappings: {
          'id': 'assigned_to',
          'name': 'crew_member_name',
          'role': 'crew_role',
          'certifications': 'required_certifications'
        },
        syncType: 'batch',
        isActive: true
      },
      {
        id: 'claims-to-finance',
        sourceTable: 'claims_repairs_jobs',
        targetTable: 'financial_transactions',
        fieldMappings: {
          'id': 'reference_id',
          'cost': 'amount',
          'currency': 'currency',
          'status': 'transaction_status'
        },
        conditions: { status: ['approved', 'completed'] },
        syncType: 'trigger',
        isActive: true
      }
    ];

    defaultRules.forEach(rule => {
      this.syncRules.set(rule.id, rule);
    });
  }

  private setupRealtimeListeners(): void {
    // Listen for data changes that might trigger syncs
    universalEventBus.subscribe('data_*', async (event) => {
      const relevantRules = Array.from(this.syncRules.values())
        .filter(rule => 
          rule.isActive && 
          rule.syncType === 'realtime' && 
          event.payload?.table === rule.sourceTable
        );

      for (const rule of relevantRules) {
        await this.executeSync(rule, event.payload.data);
      }
    });
  }

  async executeSync(rule: SyncRule, sourceData?: any): Promise<void> {
    const syncId = `sync_${rule.id}_${Date.now()}`;
    const status: SyncStatus = {
      ruleId: rule.id,
      status: 'syncing',
      recordsProcessed: 0,
      errors: [],
      startedAt: new Date()
    };

    this.syncStatuses.set(syncId, status);

    try {
      let recordsToSync: any[] = [];

      if (sourceData) {
        // Single record sync (realtime/trigger)
        if (this.matchesConditions(sourceData, rule.conditions)) {
          recordsToSync = [sourceData];
        }
      } else {
        // Batch sync - fetch all matching records
        const { data, error } = await (supabase as any)
          .from(rule.sourceTable)
          .select('*');
        
        if (error) throw error;
        
        recordsToSync = data?.filter((record: any) => 
          this.matchesConditions(record, rule.conditions)
        ) || [];
      }

      for (const record of recordsToSync) {
        try {
          const mappedData = this.mapFields(record, rule.fieldMappings);
          await this.upsertTarget(rule.targetTable, mappedData);
          status.recordsProcessed++;
        } catch (error) {
          status.errors.push(`Record ${record.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      status.status = 'completed';
      status.completedAt = new Date();
      
      // Update last sync time
      rule.lastSyncAt = new Date();

      // Log successful sync
      await this.logSync(rule, status);

    } catch (error) {
      status.status = 'error';
      status.errors.push(error instanceof Error ? error.message : String(error));
      console.error(`Sync failed for rule ${rule.id}:`, error);
    }
  }

  private matchesConditions(record: any, conditions?: Record<string, any>): boolean {
    if (!conditions) return true;

    for (const [field, expectedValue] of Object.entries(conditions)) {
      const recordValue = record[field];

      if (expectedValue === 'below_min_stock') {
        // Special condition for inventory
        if (recordValue >= record.min_stock) return false;
      } else if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(recordValue)) return false;
      } else if (expectedValue !== recordValue) {
        return false;
      }
    }

    return true;
  }

  private mapFields(sourceRecord: any, fieldMappings: Record<string, string>): any {
    const mappedData: any = {};

    for (const [sourceField, targetField] of Object.entries(fieldMappings)) {
      if (sourceRecord[sourceField] !== undefined) {
        mappedData[targetField] = sourceRecord[sourceField];
      }
    }

    // Add sync metadata
    mappedData.sync_source = 'cross_module_sync';
    mappedData.sync_timestamp = new Date().toISOString();

    return mappedData;
  }

  private async upsertTarget(targetTable: string, data: any): Promise<void> {
    const { error } = await (supabase as any)
      .from(targetTable)
      .upsert(data, { onConflict: 'id' });

    if (error) throw error;
  }

  private async logSync(rule: SyncRule, status: SyncStatus): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'data_sync_completed',
        module: 'sync',
        event_message: `Sync completed: ${rule.sourceTable} → ${rule.targetTable}`,
        severity: status.errors.length > 0 ? 'warn' : 'info',
        metadata: {
          rule_id: rule.id,
          records_processed: status.recordsProcessed,
          errors_count: status.errors.length,
          duration_ms: status.completedAt && status.startedAt
            ? status.completedAt.getTime() - status.startedAt.getTime()
            : null
        }
      });
    } catch (error) {
      console.error('Failed to log sync:', error);
    }
  }

  // Public API methods
  async addSyncRule(rule: SyncRule): Promise<void> {
    this.syncRules.set(rule.id, rule);
    console.log(`Added sync rule: ${rule.id}`);
  }

  async removeSyncRule(ruleId: string): Promise<void> {
    this.syncRules.delete(ruleId);
    console.log(`Removed sync rule: ${ruleId}`);
  }

  async triggerBatchSync(ruleId?: string): Promise<void> {
    const rulesToSync = ruleId 
      ? [this.syncRules.get(ruleId)].filter(Boolean) as SyncRule[]
      : Array.from(this.syncRules.values()).filter(rule => rule.syncType === 'batch');

    for (const rule of rulesToSync) {
      await this.executeSync(rule);
    }
  }

  getSyncRules(): SyncRule[] {
    return Array.from(this.syncRules.values());
  }

  getSyncStatuses(): SyncStatus[] {
    return Array.from(this.syncStatuses.values());
  }

  async getSyncHealth(): Promise<{
    totalRules: number;
    activeRules: number;
    recentSyncs: number;
    errorRate: number;
  }> {
    const totalRules = this.syncRules.size;
    const activeRules = Array.from(this.syncRules.values()).filter(r => r.isActive).length;
    const recentStatuses = Array.from(this.syncStatuses.values())
      .filter(s => s.startedAt > new Date(Date.now() - 24 * 60 * 60 * 1000)); // Last 24 hours
    
    const recentSyncs = recentStatuses.length;
    const errorRate = recentSyncs > 0 
      ? recentStatuses.filter(s => s.status === 'error').length / recentSyncs 
      : 0;

    return {
      totalRules,
      activeRules,
      recentSyncs,
      errorRate
    };
  }

  // Cross-module data relationships
  async getRelatedData(table: string, recordId: string): Promise<Record<string, any[]>> {
    const relatedData: Record<string, any[]> = {};
    
    // Find all sync rules that involve this table
    const relevantRules = Array.from(this.syncRules.values())
      .filter(rule => rule.sourceTable === table || rule.targetTable === table);

    for (const rule of relevantRules) {
      try {
        const targetTable = rule.sourceTable === table ? rule.targetTable : rule.sourceTable;
        const fieldMapping = rule.sourceTable === table ? rule.fieldMappings : this.invertMapping(rule.fieldMappings);
        
        const lookupField = Object.values(fieldMapping)[0]; // Simplified lookup
        
        const { data } = await (supabase as any)
          .from(targetTable)
          .select('*')
          .eq(lookupField, recordId);

        if (data) {
          relatedData[targetTable] = data;
        }
      } catch (error) {
        console.error(`Failed to fetch related data from ${rule.targetTable}:`, error);
      }
    }

    return relatedData;
  }

  private invertMapping(mapping: Record<string, string>): Record<string, string> {
    const inverted: Record<string, string> = {};
    for (const [key, value] of Object.entries(mapping)) {
      inverted[value] = key;
    }
    return inverted;
  }

  // Data consistency checks
  async runConsistencyCheck(): Promise<{
    issues: Array<{
      ruleId: string;
      issue: string;
      affectedRecords: number;
    }>;
  }> {
    const issues: Array<{ ruleId: string; issue: string; affectedRecords: number }> = [];

    for (const rule of Array.from(this.syncRules.values())) {
      try {
        // Check for orphaned records, mismatched data, etc.
        const { data: sourceData } = await (supabase as any)
          .from(rule.sourceTable)
          .select('*');

        const { data: targetData } = await (supabase as any)
          .from(rule.targetTable)
          .select('*');

        // Basic consistency checks
        if (sourceData && targetData) {
          const sourceCount = sourceData.length;
          const targetCount = targetData.length;
          
          if (Math.abs(sourceCount - targetCount) / sourceCount > 0.1) { // More than 10% difference
            issues.push({
              ruleId: rule.id,
              issue: `Record count mismatch: ${sourceCount} source vs ${targetCount} target`,
              affectedRecords: Math.abs(sourceCount - targetCount)
            });
          }
        }
      } catch (error) {
        issues.push({
          ruleId: rule.id,
          issue: `Consistency check failed: ${error instanceof Error ? error.message : String(error)}`,
          affectedRecords: 0
        });
      }
    }

    return { issues };
  }
}

export const crossModuleDataSync = new CrossModuleDataSync();