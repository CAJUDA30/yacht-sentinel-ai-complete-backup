/**
 * DATABASE HEALTH CHECKER
 * Systematically checks for missing tables and provides graceful fallbacks
 * Prevents the recurring 404 errors by implementing robust error handling
 */

import { supabase } from '@/integrations/supabase/client';

export interface TableStatus {
  name: string;
  exists: boolean;
  error?: string;
  lastChecked: string;
}

export interface DatabaseHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  tables: Record<string, TableStatus>;
  missingTables: string[];
  timestamp: string;
}

class DatabaseHealthChecker {
  private static instance: DatabaseHealthChecker;
  private healthCache: DatabaseHealth | null = null;
  private lastCheck: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute

  // Core tables that are critical for the application
  private readonly CORE_TABLES = [
    'yacht_profiles',
    'crew_members', 
    'equipment',
    'inventory_items',
    'ai_providers',
    'ai_models',
    'document_scans',
    'user_profiles'
  ];

  constructor() {
    if (DatabaseHealthChecker.instance) {
      return DatabaseHealthChecker.instance;
    }
    DatabaseHealthChecker.instance = this;
  }

  /**
   * Check if a specific table exists
   */
  async checkTableExists(tableName: string): Promise<TableStatus> {
    try {
      // Try a simple query to the table using type assertion to bypass strict typing
      const { error } = await (supabase as any)
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) {
        // Check for specific "relation does not exist" error
        if (error.message?.includes(`relation "${tableName}" does not exist`)) {
          return {
            name: tableName,
            exists: false,
            error: 'Table does not exist',
            lastChecked: new Date().toISOString()
          };
        }

        // Other errors might indicate permission issues
        return {
          name: tableName,
          exists: true, // Assume exists but has permission/RLS issues
          error: error.message,
          lastChecked: new Date().toISOString()
        };
      }

      return {
        name: tableName,
        exists: true,
        lastChecked: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        name: tableName,
        exists: false,
        error: error.message || 'Unknown error',
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check health of all core tables
   */
  async checkDatabaseHealth(forceRefresh = false): Promise<DatabaseHealth> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (!forceRefresh && this.healthCache && (now - this.lastCheck) < this.CACHE_DURATION) {
      return this.healthCache;
    }

    console.log('[DatabaseHealthChecker] Checking database health...');

    const tableStatuses: Record<string, TableStatus> = {};
    const missingTables: string[] = [];

    // Check each core table
    for (const tableName of this.CORE_TABLES) {
      const status = await this.checkTableExists(tableName);
      tableStatuses[tableName] = status;
      
      if (!status.exists) {
        missingTables.push(tableName);
      }
    }

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'critical';
    if (missingTables.length === 0) {
      overall = 'healthy';
    } else if (missingTables.length <= 2) {
      overall = 'degraded';
    } else {
      overall = 'critical';
    }

    const health: DatabaseHealth = {
      overall,
      tables: tableStatuses,
      missingTables,
      timestamp: new Date().toISOString()
    };

    // Cache the result
    this.healthCache = health;
    this.lastCheck = now;

    console.log(`[DatabaseHealthChecker] Database health: ${overall}`, {
      totalTables: this.CORE_TABLES.length,
      missingTables: missingTables.length,
      missing: missingTables
    });

    return health;
  }

  /**
   * Get a safe query function that handles missing tables gracefully
   */
  async safeQuery<T>(
    tableName: string, 
    queryFn: () => Promise<{ data: T[] | null; error: any }>,
    fallbackData: T[] = []
  ): Promise<{ data: T[]; error: string | null; tableExists: boolean }> {
    try {
      // Check if table exists first
      const tableStatus = await this.checkTableExists(tableName);
      
      if (!tableStatus.exists) {
        console.warn(`[DatabaseHealthChecker] Table ${tableName} does not exist, returning fallback data`);
        return {
          data: fallbackData,
          error: `Table ${tableName} is not available`,
          tableExists: false
        };
      }

      // Execute the query
      const { data, error } = await queryFn();
      
      if (error) {
        console.error(`[DatabaseHealthChecker] Query error on ${tableName}:`, error);
        return {
          data: fallbackData,
          error: error.message || 'Query failed',
          tableExists: true
        };
      }

      return {
        data: data || fallbackData,
        error: null,
        tableExists: true
      };
    } catch (error: any) {
      console.error(`[DatabaseHealthChecker] Unexpected error in safeQuery for ${tableName}:`, error);
      return {
        data: fallbackData,
        error: error.message || 'Unexpected error',
        tableExists: false
      };
    }
  }

  /**
   * Generate a migration script for missing tables
   */
  generateMigrationScript(): string {
    if (!this.healthCache) {
      return '-- Run database health check first';
    }

    const missingTables = this.healthCache.missingTables;
    if (missingTables.length === 0) {
      return '-- All tables exist, no migration needed';
    }

    let script = `-- Database Migration Script
-- Generated on: ${new Date().toISOString()}
-- Missing tables: ${missingTables.join(', ')}

`;

    // Add table creation scripts for common missing tables
    const tableDefinitions: Record<string, string> = {
      yacht_profiles: `
CREATE TABLE yacht_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_name TEXT NOT NULL,
  yacht_type TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  specifications JSONB DEFAULT '{}',
  registration JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own yacht profiles" ON yacht_profiles
  FOR ALL USING (auth.uid() = owner_id);
`,
      crew_members: `
CREATE TABLE crew_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT,
  certifications JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
`,
      ai_providers: `
CREATE TABLE ai_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  api_endpoint TEXT,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
`
    };

    for (const tableName of missingTables) {
      if (tableDefinitions[tableName]) {
        script += `-- Creating ${tableName} table\n${tableDefinitions[tableName]}\n`;
      } else {
        script += `-- TODO: Add definition for ${tableName} table\n\n`;
      }
    }

    return script;
  }
}

// Export singleton instance
export const databaseHealthChecker = new DatabaseHealthChecker();

// Export helper function for components
export const checkDatabaseHealth = () => databaseHealthChecker.checkDatabaseHealth();
export const safeQuery = <T>(
  tableName: string, 
  queryFn: () => Promise<{ data: T[] | null; error: any }>,
  fallbackData: T[] = []
) => databaseHealthChecker.safeQuery(tableName, queryFn, fallbackData);