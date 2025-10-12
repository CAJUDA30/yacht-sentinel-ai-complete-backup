/**
 * RLS Health Monitoring Service
 * ============================================================================
 * Systematically monitors and fixes RLS policy issues to prevent recurring
 * DELETE permission problems and other policy conflicts.
 * 
 * Based on memories:
 * - Master Auth System Integration
 * - Systematic Provider Integration  
 * - RLS Policy Management patterns
 */

import { supabase } from '@/integrations/supabase/client';

// Types for RLS health monitoring
interface RLSIntegrityResult {
  table_name: string;
  total_policies: number;
  missing_policies: string[];
  conflicting_policies: string[];
  is_compliant: boolean;
  expected_policies: string[];
}

interface RLSHealthStatus {
  overall_health: 'healthy' | 'warning' | 'critical';
  total_tables_checked: number;
  compliant_tables: number;
  non_compliant_tables: number;
  critical_issues: string[];
  warnings: string[];
  last_check: string;
  details: RLSIntegrityResult[];
}

// Critical tables that must have proper RLS policies
const CRITICAL_TABLES = [
  'ai_providers_unified',
  'user_roles', 
  'ai_models_unified',
  'system_settings',
  'yachts',
  'inventory_items'
];

class RLSHealthService {
  private lastHealthCheck: RLSHealthStatus | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize RLS health monitoring
   * Integrates with Master Auth System for permission checks
   */
  async initialize(): Promise<void> {
    console.log('[RLS_HEALTH] Initializing RLS health monitoring service');
    
    // Run initial health check
    await this.performHealthCheck();

    // Set up periodic monitoring (every 5 minutes)
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000);
  }

  /**
   * Perform comprehensive RLS health check
   * Uses the verify_rls_integrity database function
   */
  async performHealthCheck(): Promise<RLSHealthStatus> {
    try {
      console.log('[RLS_HEALTH] Starting comprehensive health check...');
      
      const results: RLSIntegrityResult[] = [];
      const criticalIssues: string[] = [];
      const warnings: string[] = [];

      // Check each critical table
      for (const tableName of CRITICAL_TABLES) {
        try {
          const { data, error } = await supabase.rpc('verify_rls_integrity', {
            p_table_name: tableName
          });

          if (error) {
            console.error(`[RLS_HEALTH] Error checking ${tableName}:`, error);
            criticalIssues.push(`Failed to check RLS policies for ${tableName}: ${error.message}`);
            continue;
          }

          if (data && typeof data === 'object') {
            const result = data as RLSIntegrityResult;
            results.push(result);

            // Analyze results
            if (!result.is_compliant) {
              if (tableName === 'ai_providers_unified') {
                // This is critical for DELETE operations
                criticalIssues.push(`${tableName} has non-compliant RLS policies - DELETE operations may fail`);
              } else {
                warnings.push(`${tableName} has non-compliant RLS policies`);
              }

              if (result.missing_policies.length > 0) {
                warnings.push(`${tableName} missing policies: ${result.missing_policies.join(', ')}`);
              }

              if (result.conflicting_policies.length > 0) {
                warnings.push(`${tableName} has conflicting policies: ${result.conflicting_policies.join(', ')}`);
              }
            }
          }
        } catch (tableError) {
          console.error(`[RLS_HEALTH] Error processing ${tableName}:`, tableError);
          criticalIssues.push(`Exception checking ${tableName}: ${tableError}`);
        }
      }

      // Calculate health status
      const compliantTables = results.filter(r => r.is_compliant).length;
      const totalTables = results.length;
      
      let overallHealth: RLSHealthStatus['overall_health'] = 'healthy';
      if (criticalIssues.length > 0) {
        overallHealth = 'critical';
      } else if (warnings.length > 0) {
        overallHealth = 'warning';
      }

      const healthStatus: RLSHealthStatus = {
        overall_health: overallHealth,
        total_tables_checked: totalTables,
        compliant_tables: compliantTables,
        non_compliant_tables: totalTables - compliantTables,
        critical_issues: criticalIssues,
        warnings: warnings,
        last_check: new Date().toISOString(),
        details: results
      };

      this.lastHealthCheck = healthStatus;

      // Log results
      console.log(`[RLS_HEALTH] Health check completed:`, {
        health: overallHealth,
        compliant: `${compliantTables}/${totalTables}`,
        critical_issues: criticalIssues.length,
        warnings: warnings.length
      });

      return healthStatus;

    } catch (error) {
      console.error('[RLS_HEALTH] Health check failed:', error);
      
      const errorStatus: RLSHealthStatus = {
        overall_health: 'critical',
        total_tables_checked: 0,
        compliant_tables: 0,
        non_compliant_tables: 0,
        critical_issues: [`Health check system failure: ${error}`],
        warnings: [],
        last_check: new Date().toISOString(),
        details: []
      };

      this.lastHealthCheck = errorStatus;
      return errorStatus;
    }
  }

  /**
   * Automatically fix RLS policy issues
   * Uses the enforce_standard_rls_policies database function
   */
  async autoFixIssues(): Promise<{ success: boolean; message: string; fixed_tables: string[] }> {
    try {
      console.log('[RLS_HEALTH] Starting automatic RLS policy fixes...');
      
      const fixedTables: string[] = [];
      const errors: string[] = [];

      // Get current health status
      const healthStatus = this.lastHealthCheck || await this.performHealthCheck();
      
      // Fix non-compliant tables
      for (const result of healthStatus.details) {
        if (!result.is_compliant) {
          try {
            const isOwnerTable = ['yachts', 'inventory_items'].includes(result.table_name);
            
            const { error } = await supabase.rpc('enforce_standard_rls_policies', {
              p_table_name: result.table_name,
              p_include_owner_access: isOwnerTable
            });

            if (error) {
              console.error(`[RLS_HEALTH] Failed to fix ${result.table_name}:`, error);
              errors.push(`${result.table_name}: ${error.message}`);
            } else {
              console.log(`[RLS_HEALTH] Fixed RLS policies for ${result.table_name}`);
              fixedTables.push(result.table_name);
            }
          } catch (tableError) {
            console.error(`[RLS_HEALTH] Error fixing ${result.table_name}:`, tableError);
            errors.push(`${result.table_name}: ${tableError}`);
          }
        }
      }

      // Re-run health check after fixes
      if (fixedTables.length > 0) {
        await this.performHealthCheck();
      }

      const success = errors.length === 0 && fixedTables.length > 0;
      const message = success 
        ? `Successfully fixed RLS policies for ${fixedTables.length} tables`
        : errors.length > 0 
          ? `Partial success: Fixed ${fixedTables.length} tables, but ${errors.length} errors occurred`
          : 'No fixes needed - all tables are compliant';

      return {
        success,
        message,
        fixed_tables: fixedTables
      };

    } catch (error) {
      console.error('[RLS_HEALTH] Auto-fix failed:', error);
      return {
        success: false,
        message: `Auto-fix system failure: ${error}`,
        fixed_tables: []
      };
    }
  }

  /**
   * Check specific table's RLS health
   */
  async checkTableHealth(tableName: string): Promise<RLSIntegrityResult | null> {
    try {
      const { data, error } = await supabase.rpc('verify_rls_integrity', {
        p_table_name: tableName
      });

      if (error) {
        console.error(`[RLS_HEALTH] Error checking ${tableName}:`, error);
        return null;
      }

      return data as RLSIntegrityResult;
    } catch (error) {
      console.error(`[RLS_HEALTH] Exception checking ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Get last health check results
   */
  getLastHealthCheck(): RLSHealthStatus | null {
    return this.lastHealthCheck;
  }

  /**
   * Check if DELETE operations are likely to work
   * Specifically checks ai_providers_unified compliance
   */
  async canPerformDeleteOperations(): Promise<{ canDelete: boolean; reason?: string }> {
    const tableHealth = await this.checkTableHealth('ai_providers_unified');
    
    if (!tableHealth) {
      return {
        canDelete: false,
        reason: 'Unable to verify RLS policies for ai_providers_unified table'
      };
    }

    if (!tableHealth.is_compliant) {
      return {
        canDelete: false,
        reason: `ai_providers_unified has policy issues: missing [${tableHealth.missing_policies.join(', ')}], conflicting [${tableHealth.conflicting_policies.join(', ')}]`
      };
    }

    return { canDelete: true };
  }

  /**
   * Cleanup service
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('[RLS_HEALTH] Service destroyed');
  }
}

// Singleton instance
export const rlsHealthService = new RLSHealthService();

// Export types for use in components
export type { RLSHealthStatus, RLSIntegrityResult };