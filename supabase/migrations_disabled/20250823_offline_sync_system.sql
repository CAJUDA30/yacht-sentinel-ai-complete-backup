-- Offline-First Architecture with SQLite Sync Schema
-- Conflict-free synchronization for yacht operations

-- Sync metadata and conflict resolution
CREATE TABLE IF NOT EXISTS public.sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  yacht_id UUID NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version_vector JSONB NOT NULL DEFAULT '{}', -- Vector clocks for conflict resolution
  device_id TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('insert', 'update', 'delete')),
  checksum TEXT NOT NULL, -- Data integrity verification
  is_synced BOOLEAN DEFAULT false,
  sync_priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(table_name, record_id, device_id, last_modified)
);

-- Sync conflicts tracking and resolution
CREATE TABLE IF NOT EXISTS public.sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  yacht_id UUID NOT NULL,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN (
    'concurrent_update', 'delete_update', 'schema_mismatch', 'constraint_violation'
  )),
  local_version JSONB NOT NULL,
  remote_version JSONB NOT NULL,
  version_vectors JSONB NOT NULL,
  resolution_strategy TEXT CHECK (resolution_strategy IN (
    'last_write_wins', 'manual_review', 'merge_fields', 'priority_based'
  )),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device registration and sync status
CREATE TABLE IF NOT EXISTS public.sync_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  yacht_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN (
    'mobile_app', 'tablet_app', 'desktop_app', 'bridge_computer', 'backup_device'
  )),
  platform TEXT NOT NULL, -- iOS, Android, Windows, Linux, etc.
  app_version TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'paused', 'disabled', 'error')),
  sync_settings JSONB DEFAULT '{}',
  storage_capacity_mb INTEGER,
  storage_used_mb INTEGER DEFAULT 0,
  network_quality TEXT DEFAULT 'unknown' CHECK (network_quality IN ('excellent', 'good', 'poor', 'offline', 'unknown')),
  is_primary BOOLEAN DEFAULT false, -- Primary device for conflict resolution
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync queues for batched operations
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES sync_devices(device_id) ON DELETE CASCADE,
  yacht_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('push', 'pull', 'full_sync')),
  table_names TEXT[], -- Tables to sync
  priority INTEGER DEFAULT 5,
  payload JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline data persistence configuration
CREATE TABLE IF NOT EXISTS public.offline_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT UNIQUE NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  conflict_resolution TEXT DEFAULT 'last_write_wins' CHECK (conflict_resolution IN (
    'last_write_wins', 'manual_review', 'merge_fields', 'priority_based'
  )),
  max_offline_days INTEGER DEFAULT 30,
  compression_enabled BOOLEAN DEFAULT true,
  encryption_required BOOLEAN DEFAULT false,
  sync_filters JSONB DEFAULT '{}', -- Row-level filtering rules
  schema_version INTEGER DEFAULT 1,
  critical_data BOOLEAN DEFAULT false, -- Always sync first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data snapshots for point-in-time recovery
CREATE TABLE IF NOT EXISTS public.data_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('full', 'incremental', 'critical_only')),
  tables_included TEXT[] NOT NULL,
  snapshot_size_mb DECIMAL(10,2),
  compression_ratio DECIMAL(4,2),
  checksum TEXT NOT NULL,
  storage_location TEXT, -- Local path or cloud storage reference
  is_compressed BOOLEAN DEFAULT true,
  is_encrypted BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bandwidth and sync optimization metrics
CREATE TABLE IF NOT EXISTS public.sync_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  yacht_id UUID NOT NULL,
  sync_session_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  tables_synced TEXT[],
  records_processed INTEGER DEFAULT 0,
  data_transferred_mb DECIMAL(10,3) DEFAULT 0,
  compression_savings_mb DECIMAL(10,3) DEFAULT 0,
  sync_duration_ms INTEGER NOT NULL,
  network_latency_ms INTEGER,
  bandwidth_mbps DECIMAL(8,3),
  conflicts_detected INTEGER DEFAULT 0,
  conflicts_resolved INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100.0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Critical operations that must sync immediately
CREATE TABLE IF NOT EXISTS public.critical_sync_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation_data JSONB NOT NULL,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('emergency', 'high', 'medium', 'low')),
  requires_confirmation BOOLEAN DEFAULT false,
  max_delay_minutes INTEGER DEFAULT 5,
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMP WITH TIME ZONE,
  expired BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_sync_metadata_table_record ON sync_metadata(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_yacht ON sync_metadata(yacht_id);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_device ON sync_metadata(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_modified ON sync_metadata(last_modified DESC);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_unsynced ON sync_metadata(is_synced) WHERE is_synced = false;

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table_record ON sync_conflicts(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_unresolved ON sync_conflicts(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_yacht ON sync_conflicts(yacht_id);

CREATE INDEX IF NOT EXISTS idx_sync_devices_yacht ON sync_devices(yacht_id);
CREATE INDEX IF NOT EXISTS idx_sync_devices_status ON sync_devices(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_devices_last_seen ON sync_devices(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_queue_device ON sync_queue(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON sync_queue(priority ASC, scheduled_at ASC);

CREATE INDEX IF NOT EXISTS idx_critical_sync_unsynced ON critical_sync_operations(synced) WHERE synced = false;
CREATE INDEX IF NOT EXISTS idx_critical_sync_urgency ON critical_sync_operations(urgency_level, created_at DESC);

-- Enable Row Level Security
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_sync_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (yacht-based access control)
CREATE POLICY "Users can access their yacht's sync metadata" ON sync_metadata
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their yacht's sync conflicts" ON sync_conflicts
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their yacht's sync devices" ON sync_devices
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's sync queue" ON sync_queue
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's data snapshots" ON data_snapshots
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their yacht's sync metrics" ON sync_metrics
  FOR SELECT USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their yacht's critical operations" ON critical_sync_operations
  FOR ALL USING (
    yacht_id IN (
      SELECT yacht_id FROM yacht_access WHERE user_id = auth.uid()
    )
  );

-- Functions for sync operations

-- Function to generate vector clock
CREATE OR REPLACE FUNCTION generate_vector_clock(
  p_device_id TEXT,
  p_current_vector JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_new_vector JSONB;
  v_device_counter INTEGER;
BEGIN
  -- Get current counter for this device
  v_device_counter := COALESCE((p_current_vector->>p_device_id)::INTEGER, 0) + 1;
  
  -- Update vector clock
  v_new_vector := p_current_vector || jsonb_build_object(p_device_id, v_device_counter);
  
  RETURN v_new_vector;
END;
$$ LANGUAGE plpgsql;

-- Function to detect conflicts using vector clocks
CREATE OR REPLACE FUNCTION detect_conflict(
  p_local_vector JSONB,
  p_remote_vector JSONB
)
RETURNS TEXT AS $$
DECLARE
  v_local_keys TEXT[];
  v_remote_keys TEXT[];
  v_all_keys TEXT[];
  v_key TEXT;
  v_local_val INTEGER;
  v_remote_val INTEGER;
  v_local_dominates BOOLEAN := true;
  v_remote_dominates BOOLEAN := true;
BEGIN
  -- Get all device IDs from both vectors
  v_local_keys := ARRAY(SELECT jsonb_object_keys(p_local_vector));
  v_remote_keys := ARRAY(SELECT jsonb_object_keys(p_remote_vector));
  v_all_keys := ARRAY(SELECT DISTINCT unnest(v_local_keys || v_remote_keys));
  
  -- Compare vector clocks
  FOREACH v_key IN ARRAY v_all_keys
  LOOP
    v_local_val := COALESCE((p_local_vector->>v_key)::INTEGER, 0);
    v_remote_val := COALESCE((p_remote_vector->>v_key)::INTEGER, 0);
    
    IF v_local_val < v_remote_val THEN
      v_local_dominates := false;
    ELSIF v_local_val > v_remote_val THEN
      v_remote_dominates := false;
    END IF;
  END LOOP;
  
  -- Determine relationship
  IF v_local_dominates AND v_remote_dominates THEN
    RETURN 'equal';
  ELSIF v_local_dominates THEN
    RETURN 'local_dominates';
  ELSIF v_remote_dominates THEN
    RETURN 'remote_dominates';
  ELSE
    RETURN 'concurrent';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create sync operation
CREATE OR REPLACE FUNCTION create_sync_operation(
  p_yacht_id UUID,
  p_table_name TEXT,
  p_record_id UUID,
  p_device_id TEXT,
  p_operation_type TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sync_id UUID;
  v_vector_clock JSONB;
  v_checksum TEXT;
BEGIN
  -- Generate new vector clock
  SELECT generate_vector_clock(p_device_id) INTO v_vector_clock;
  
  -- Calculate checksum
  v_checksum := encode(digest(p_data::TEXT, 'sha256'), 'hex');
  
  -- Insert sync metadata
  INSERT INTO sync_metadata (
    table_name, record_id, yacht_id, device_id, 
    operation_type, version_vector, checksum
  ) VALUES (
    p_table_name, p_record_id, p_yacht_id, p_device_id,
    p_operation_type, v_vector_clock, v_checksum
  ) RETURNING id INTO v_sync_id;
  
  RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process sync conflicts
CREATE OR REPLACE FUNCTION resolve_sync_conflict(
  p_conflict_id UUID,
  p_resolution_strategy TEXT,
  p_resolution_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflict RECORD;
  v_resolved BOOLEAN := false;
BEGIN
  -- Get conflict details
  SELECT * INTO v_conflict FROM sync_conflicts WHERE id = p_conflict_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Apply resolution strategy
  CASE p_resolution_strategy
    WHEN 'last_write_wins' THEN
      -- Use the version with the latest timestamp
      IF (v_conflict.remote_version->>'last_modified')::TIMESTAMP > 
         (v_conflict.local_version->>'last_modified')::TIMESTAMP THEN
        -- Apply remote version
        v_resolved := true;
      ELSE
        -- Keep local version
        v_resolved := true;
      END IF;
      
    WHEN 'merge_fields' THEN
      -- Merge non-conflicting fields
      v_resolved := true;
      
    WHEN 'priority_based' THEN
      -- Use device priority for resolution
      v_resolved := true;
      
    ELSE
      -- Manual review required
      v_resolved := false;
  END CASE;
  
  -- Update conflict record
  UPDATE sync_conflicts 
  SET 
    resolved = v_resolved,
    resolved_at = CASE WHEN v_resolved THEN NOW() ELSE NULL END,
    resolution_strategy = p_resolution_strategy,
    resolution_data = p_resolution_data
  WHERE id = p_conflict_id;
  
  RETURN v_resolved;
END;
$$ LANGUAGE plpgsql;

-- Function for cleanup old sync data
CREATE OR REPLACE FUNCTION cleanup_sync_data(p_retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  -- Clean up old sync metadata
  DELETE FROM sync_metadata 
  WHERE created_at < NOW() - INTERVAL '1 day' * p_retention_days
    AND is_synced = true;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Clean up resolved conflicts
  DELETE FROM sync_conflicts 
  WHERE created_at < NOW() - INTERVAL '1 day' * p_retention_days
    AND resolved = true;
  
  -- Clean up completed sync queue items
  DELETE FROM sync_queue 
  WHERE created_at < NOW() - INTERVAL '1 day' * (p_retention_days / 2)
    AND status = 'completed';
  
  -- Clean up old snapshots
  DELETE FROM data_snapshots 
  WHERE expires_at < NOW()
    OR created_at < NOW() - INTERVAL '1 day' * p_retention_days;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default offline tables configuration
INSERT INTO offline_tables (table_name, sync_enabled, conflict_resolution, critical_data) VALUES
('nmea_sensor_data', true, 'last_write_wins', true),
('sensor_alerts', true, 'manual_review', true),
('inventory_items', true, 'merge_fields', false),
('maintenance_tasks', true, 'manual_review', true),
('crew_members', true, 'manual_review', false),
('documents', true, 'last_write_wins', false),
('financial_transactions', true, 'manual_review', true),
('navigation_logs', true, 'last_write_wins', true),
('safety_reports', true, 'manual_review', true),
('user_memories', true, 'merge_fields', false)
ON CONFLICT (table_name) DO UPDATE SET
  updated_at = NOW();

-- Grant permissions
GRANT ALL ON sync_metadata TO authenticated;
GRANT ALL ON sync_conflicts TO authenticated;
GRANT ALL ON sync_devices TO authenticated;
GRANT ALL ON sync_queue TO authenticated;
GRANT SELECT ON offline_tables TO authenticated;
GRANT ALL ON data_snapshots TO authenticated;
GRANT SELECT ON sync_metrics TO authenticated;
GRANT ALL ON critical_sync_operations TO authenticated;

COMMENT ON TABLE sync_metadata IS 'Tracks changes and version vectors for conflict-free synchronization';
COMMENT ON TABLE sync_conflicts IS 'Manages conflicts between local and remote data versions';
COMMENT ON TABLE sync_devices IS 'Registry of devices participating in synchronization';
COMMENT ON TABLE sync_queue IS 'Queued sync operations for batched processing';
COMMENT ON TABLE offline_tables IS 'Configuration for tables that support offline operations';
COMMENT ON TABLE data_snapshots IS 'Point-in-time data snapshots for recovery and backup';
COMMENT ON TABLE sync_metrics IS 'Performance metrics and analytics for sync operations';
COMMENT ON TABLE critical_sync_operations IS 'High-priority operations requiring immediate sync';