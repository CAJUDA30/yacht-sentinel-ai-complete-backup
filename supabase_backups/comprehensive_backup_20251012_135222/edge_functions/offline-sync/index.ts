import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  device_id: string;
  yacht_id: string;
  operation: 'push' | 'pull' | 'full_sync' | 'resolve_conflict';
  data?: {
    changes?: SyncChange[];
    last_sync_timestamp?: string;
    conflict_id?: string;
    resolution_strategy?: string;
    tables?: string[];
  };
  options?: {
    force_sync?: boolean;
    batch_size?: number;
    include_deletes?: boolean;
  };
}

interface SyncChange {
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: string;
  version_vector: Record<string, number>;
  checksum: string;
}

interface SyncResponse {
  success: boolean;
  changes?: SyncChange[];
  conflicts?: ConflictInfo[];
  metrics?: {
    records_processed: number;
    conflicts_detected: number;
    sync_duration_ms: number;
    data_transferred_kb: number;
  };
  next_sync_timestamp?: string;
}

interface ConflictInfo {
  id: string;
  table_name: string;
  record_id: string;
  conflict_type: string;
  local_version: any;
  remote_version: any;
  suggested_resolution: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const request: SyncRequest = await req.json();
    console.log(`🔄 Sync operation: ${request.operation} for device ${request.device_id}`);

    // Validate request
    if (!request.device_id || !request.yacht_id || !request.operation) {
      throw new Error('Invalid request: device_id, yacht_id, and operation are required');
    }

    // Update device last seen
    await updateDeviceStatus(request.device_id, request.yacht_id);

    let result: SyncResponse;

    switch (request.operation) {
      case 'push':
        result = await handlePushSync(request);
        break;
      case 'pull':
        result = await handlePullSync(request);
        break;
      case 'full_sync':
        result = await handleFullSync(request);
        break;
      case 'resolve_conflict':
        result = await handleConflictResolution(request);
        break;
      default:
        throw new Error(`Unsupported operation: ${request.operation}`);
    }

    // Log sync metrics
    await logSyncMetrics(request, result, Date.now() - startTime);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 Sync error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Sync operation failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handlePushSync(request: SyncRequest): Promise<SyncResponse> {
  const changes = request.data?.changes || [];
  const conflicts: ConflictInfo[] = [];
  let recordsProcessed = 0;
  
  console.log(`📤 Push sync: ${changes.length} changes from device ${request.device_id}`);

  for (const change of changes) {
    try {
      // Check for conflicts
      const conflictResult = await detectConflict(change, request.device_id);
      
      if (conflictResult.hasConflict) {
        // Log conflict for resolution
        const conflictId = await logConflict(change, conflictResult, request.yacht_id);
        conflicts.push({
          id: conflictId,
          table_name: change.table_name,
          record_id: change.record_id,
          conflict_type: conflictResult.type,
          local_version: change.data,
          remote_version: conflictResult.remoteData,
          suggested_resolution: conflictResult.suggestedResolution
        });
        continue;
      }

      // Apply change to database
      await applyChange(change, request.yacht_id, request.device_id);
      recordsProcessed++;

    } catch (error) {
      console.error(`Failed to process change for ${change.table_name}:${change.record_id}:`, error);
    }
  }

  return {
    success: true,
    conflicts: conflicts,
    metrics: {
      records_processed: recordsProcessed,
      conflicts_detected: conflicts.length,
      sync_duration_ms: 0,
      data_transferred_kb: estimateDataSize(changes)
    }
  };
}

async function handlePullSync(request: SyncRequest): Promise<SyncResponse> {
  const lastSyncTimestamp = request.data?.last_sync_timestamp;
  const tables = request.data?.tables || await getActiveTables();
  const batchSize = request.options?.batch_size || 100;
  
  console.log(`📥 Pull sync: ${tables.length} tables for device ${request.device_id}`);

  const changes: SyncChange[] = [];
  
  for (const tableName of tables) {
    try {
      const tableChanges = await getTableChanges(
        tableName,
        request.yacht_id,
        request.device_id,
        lastSyncTimestamp,
        batchSize
      );
      changes.push(...tableChanges);
    } catch (error) {
      console.error(`Failed to get changes for table ${tableName}:`, error);
    }
  }

  // Sort changes by timestamp for proper ordering
  changes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    success: true,
    changes: changes.slice(0, batchSize),
    next_sync_timestamp: changes.length > 0 ? changes[changes.length - 1].timestamp : new Date().toISOString(),
    metrics: {
      records_processed: changes.length,
      conflicts_detected: 0,
      sync_duration_ms: 0,
      data_transferred_kb: estimateDataSize(changes)
    }
  };
}

async function handleFullSync(request: SyncRequest): Promise<SyncResponse> {
  console.log(`🔄 Full sync for device ${request.device_id}`);

  // First do a push to send local changes
  const pushResult = await handlePushSync(request);
  
  // Then do a pull to get remote changes
  const pullRequest = { ...request, operation: 'pull' as const };
  const pullResult = await handlePullSync(pullRequest);

  return {
    success: true,
    changes: pullResult.changes,
    conflicts: pushResult.conflicts,
    next_sync_timestamp: pullResult.next_sync_timestamp,
    metrics: {
      records_processed: (pushResult.metrics?.records_processed || 0) + (pullResult.metrics?.records_processed || 0),
      conflicts_detected: pushResult.metrics?.conflicts_detected || 0,
      sync_duration_ms: 0,
      data_transferred_kb: (pushResult.metrics?.data_transferred_kb || 0) + (pullResult.metrics?.data_transferred_kb || 0)
    }
  };
}

async function handleConflictResolution(request: SyncRequest): Promise<SyncResponse> {
  const conflictId = request.data?.conflict_id;
  const strategy = request.data?.resolution_strategy || 'last_write_wins';
  
  if (!conflictId) {
    throw new Error('Conflict ID is required for conflict resolution');
  }

  console.log(`⚖️ Resolving conflict ${conflictId} with strategy: ${strategy}`);

  const { data, error } = await supabase.rpc('resolve_sync_conflict', {
    p_conflict_id: conflictId,
    p_resolution_strategy: strategy,
    p_resolution_data: request.data
  });

  if (error) {
    throw new Error(`Failed to resolve conflict: ${error.message}`);
  }

  return {
    success: true,
    metrics: {
      records_processed: 1,
      conflicts_detected: 0,
      sync_duration_ms: 0,
      data_transferred_kb: 0
    }
  };
}

async function detectConflict(change: SyncChange, deviceId: string): Promise<{
  hasConflict: boolean;
  type?: string;
  remoteData?: any;
  suggestedResolution?: string;
}> {
  try {
    // Get the latest version from database
    const { data: remoteMetadata } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('table_name', change.table_name)
      .eq('record_id', change.record_id)
      .neq('device_id', deviceId)
      .order('last_modified', { ascending: false })
      .limit(1)
      .single();

    if (!remoteMetadata) {
      return { hasConflict: false };
    }

    // Use vector clocks to detect conflicts
    const { data: conflictResult } = await supabase.rpc('detect_conflict', {
      p_local_vector: change.version_vector,
      p_remote_vector: remoteMetadata.version_vector
    });

    if (conflictResult === 'concurrent') {
      // Get remote data for conflict resolution
      const remoteData = await getRecordData(change.table_name, change.record_id);
      
      return {
        hasConflict: true,
        type: 'concurrent_update',
        remoteData: remoteData,
        suggestedResolution: 'last_write_wins'
      };
    }

    return { hasConflict: false };
  } catch (error) {
    console.error('Error detecting conflict:', error);
    return { hasConflict: false };
  }
}

async function logConflict(
  change: SyncChange, 
  conflictResult: any, 
  yachtId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('sync_conflicts')
    .insert({
      table_name: change.table_name,
      record_id: change.record_id,
      yacht_id: yachtId,
      conflict_type: conflictResult.type,
      local_version: change.data,
      remote_version: conflictResult.remoteData,
      version_vectors: {
        local: change.version_vector,
        remote: conflictResult.remoteVersion
      }
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to log conflict: ${error.message}`);
  }

  return data.id;
}

async function applyChange(change: SyncChange, yachtId: string, deviceId: string): Promise<void> {
  const tableName = change.table_name;
  const recordId = change.record_id;
  
  try {
    switch (change.operation) {
      case 'insert':
      case 'update':
        // Upsert the record
        await supabase
          .from(tableName)
          .upsert({ 
            id: recordId, 
            ...change.data, 
            yacht_id: yachtId,
            updated_at: new Date().toISOString()
          });
        break;
        
      case 'delete':
        // Soft delete or hard delete based on table configuration
        await supabase
          .from(tableName)
          .delete()
          .eq('id', recordId);
        break;
    }

    // Update sync metadata
    await supabase.rpc('create_sync_operation', {
      p_yacht_id: yachtId,
      p_table_name: tableName,
      p_record_id: recordId,
      p_device_id: deviceId,
      p_operation_type: change.operation,
      p_data: change.data
    });

  } catch (error) {
    console.error(`Failed to apply change to ${tableName}:`, error);
    throw error;
  }
}

async function getTableChanges(
  tableName: string,
  yachtId: string,
  deviceId: string,
  lastSyncTimestamp?: string,
  limit = 100
): Promise<SyncChange[]> {
  try {
    let query = supabase
      .from('sync_metadata')
      .select('*')
      .eq('table_name', tableName)
      .eq('yacht_id', yachtId)
      .neq('device_id', deviceId)
      .order('last_modified', { ascending: true })
      .limit(limit);

    if (lastSyncTimestamp) {
      query = query.gt('last_modified', lastSyncTimestamp);
    }

    const { data: metadata, error } = await query;
    if (error) throw error;

    const changes: SyncChange[] = [];
    
    for (const meta of metadata || []) {
      // Get actual record data
      const recordData = await getRecordData(tableName, meta.record_id);
      
      changes.push({
        table_name: tableName,
        record_id: meta.record_id,
        operation: meta.operation_type as 'insert' | 'update' | 'delete',
        data: recordData,
        timestamp: meta.last_modified,
        version_vector: meta.version_vector,
        checksum: meta.checksum
      });
    }

    return changes;
  } catch (error) {
    console.error(`Failed to get changes for table ${tableName}:`, error);
    return [];
  }
}

async function getRecordData(tableName: string, recordId: string): Promise<any> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', recordId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is OK for deletes
    throw error;
  }

  return data;
}

async function getActiveTables(): Promise<string[]> {
  const { data, error } = await supabase
    .from('offline_tables')
    .select('table_name')
    .eq('sync_enabled', true)
    .order('critical_data', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(row => row.table_name);
}

async function updateDeviceStatus(deviceId: string, yachtId: string): Promise<void> {
  await supabase
    .from('sync_devices')
    .upsert({
      device_id: deviceId,
      yacht_id: yachtId,
      last_seen_at: new Date().toISOString(),
      sync_status: 'active'
    }, {
      onConflict: 'device_id'
    });
}

async function logSyncMetrics(
  request: SyncRequest,
  result: SyncResponse,
  durationMs: number
): Promise<void> {
  try {
    await supabase.from('sync_metrics').insert({
      device_id: request.device_id,
      yacht_id: request.yacht_id,
      sync_session_id: crypto.randomUUID(),
      operation_type: request.operation,
      tables_synced: request.data?.tables || [],
      records_processed: result.metrics?.records_processed || 0,
      data_transferred_mb: (result.metrics?.data_transferred_kb || 0) / 1024,
      sync_duration_ms: durationMs,
      conflicts_detected: result.metrics?.conflicts_detected || 0,
      conflicts_resolved: 0, // Will be updated separately
      success_rate: result.success ? 100 : 0
    });
  } catch (error) {
    console.error('Failed to log sync metrics:', error);
  }
}

function estimateDataSize(changes: SyncChange[]): number {
  // Rough estimation of data size in KB
  const jsonString = JSON.stringify(changes);
  return Math.ceil(jsonString.length / 1024);
}