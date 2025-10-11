-- =====================================================
-- CRITICAL DATABASE FIXES - PRODUCTION DEPLOYMENT
-- Fixes console errors for yacht management system
-- Date: 2025-09-21
-- =====================================================

-- =====================================================
-- 1. FIX get_user_yacht_access_detailed FUNCTION
-- Error: Bad Request (400) from RPC call
-- =====================================================

-- Drop existing conflicting functions
DROP FUNCTION IF EXISTS public.get_user_yacht_access_detailed(UUID);
DROP FUNCTION IF EXISTS public.get_user_yacht_access_detailed(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_yacht_access_detailed(UUID, UUID, BOOLEAN);

-- Create yacht-centric access function (PRODUCTION READY)
CREATE OR REPLACE FUNCTION public.get_user_yacht_access_detailed(
  p_user_id UUID DEFAULT auth.uid(),
  p_yacht_id UUID DEFAULT NULL
)
RETURNS TABLE(
  yacht_id UUID,
  role TEXT,
  access_level TEXT,
  is_active BOOLEAN,
  yacht_name TEXT,
  flag_state TEXT,
  current_location TEXT,
  owner_id UUID,
  permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    yp.id as yacht_id,
    COALESCE(yac.role, cm.position, 'viewer') as role,
    CASE 
      WHEN yp.owner_id = p_user_id THEN 'owner'
      WHEN cm.position IN ('captain', 'first_officer') THEN 'manager'
      WHEN cm.position IS NOT NULL THEN 'crew'
      ELSE 'viewer'
    END as access_level,
    COALESCE(yac.is_active, cm.status = 'active', false) as is_active,
    COALESCE(yp.yacht_name, yp.name, 'Unnamed Yacht') as yacht_name,
    COALESCE(yp.flag_state, 'Unknown') as flag_state,
    COALESCE(yp.current_location::TEXT, 'Unknown') as current_location,
    yp.owner_id,
    COALESCE(yac.permissions, '{}'::jsonb) as permissions
  FROM yacht_profiles yp
  LEFT JOIN yacht_access_control yac ON yac.yacht_id = yp.id AND yac.user_id = p_user_id AND yac.is_active = true
  LEFT JOIN crew_members cm ON cm.yacht_id = yp.id AND cm.user_id = p_user_id AND cm.status = 'active'
  WHERE (p_yacht_id IS NULL OR yp.id = p_yacht_id)
    AND (
      yp.owner_id = p_user_id 
      OR cm.user_id = p_user_id
      OR yac.user_id = p_user_id
    )
  ORDER BY (yp.owner_id = p_user_id) DESC, yp.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed(UUID, UUID) TO authenticated, anon;

-- =====================================================
-- 2. FIX CREW SCHEDULES TABLE AND RELATIONSHIPS
-- Error: Could not find relationship between 'crew_schedules' and 'crew_members'
-- =====================================================

-- Create crew_schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crew_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  position TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique schedules per crew member per time slot
  UNIQUE(crew_member_id, shift_date, shift_start_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crew_schedules_yacht_id ON crew_schedules(yacht_id);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_crew_member_id ON crew_schedules(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_shift_date ON crew_schedules(shift_date);
CREATE INDEX IF NOT EXISTS idx_crew_schedules_status ON crew_schedules(status);

-- Enable RLS
ALTER TABLE crew_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crew_schedules
CREATE POLICY "Users can view schedules for their yachts"
  ON crew_schedules FOR SELECT
  USING (
    yacht_id IN (
      SELECT yacht_id FROM get_user_yacht_access_detailed(auth.uid())
    )
  );

CREATE POLICY "Yacht owners and managers can manage schedules"
  ON crew_schedules FOR ALL
  USING (
    yacht_id IN (
      SELECT yacht_id FROM get_user_yacht_access_detailed(auth.uid())
      WHERE access_level IN ('owner', 'manager')
    )
  );

CREATE POLICY "Crew members can view their own schedules"
  ON crew_schedules FOR SELECT
  USING (
    crew_member_id IN (
      SELECT id FROM crew_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- =====================================================
-- 3. ENSURE YACHT_ACCESS_CONTROL TABLE EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.yacht_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID NOT NULL REFERENCES yacht_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  permissions JSONB DEFAULT '{}',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(yacht_id, user_id)
);

-- Enable RLS
ALTER TABLE yacht_access_control ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yacht_access_control
CREATE POLICY "Users can view their own access records"
  ON yacht_access_control FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Yacht owners can manage access control"
  ON yacht_access_control FOR ALL
  USING (
    yacht_id IN (
      SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- 4. CREATE MISSING INDEXES AND CONSTRAINTS
-- =====================================================

-- Ensure yacht_profiles has proper indexes
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_owner_id ON yacht_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_yacht_name ON yacht_profiles(yacht_name);

-- Ensure crew_members has proper indexes
CREATE INDEX IF NOT EXISTS idx_crew_members_yacht_id ON crew_members(yacht_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON crew_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_status ON crew_members(status);

-- =====================================================
-- 5. ADD SAMPLE DATA FOR TESTING (IF TABLES ARE EMPTY)
-- =====================================================

-- Add sample yacht if none exists for the current user
DO $$
DECLARE
    sample_yacht_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID (will be null in migration context)
    SELECT auth.uid() INTO current_user_id;
    
    -- Only add sample data if user exists and no yachts exist
    IF current_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM yacht_profiles WHERE owner_id = current_user_id) THEN
            INSERT INTO yacht_profiles (
                yacht_name, 
                owner_id, 
                flag_state, 
                current_location,
                yacht_type,
                length_overall_m,
                beam_m,
                created_at
            ) VALUES (
                'Sample Yacht', 
                current_user_id, 
                'Bahamas', 
                'Marina Bay',
                'Motor Yacht',
                50.0,
                12.0,
                NOW()
            ) RETURNING id INTO sample_yacht_id;
            
            RAISE NOTICE 'Created sample yacht with ID: %', sample_yacht_id;
        END IF;
    END IF;
END $$;

-- =====================================================
-- 6. UPDATE EXISTING DATA TO FIX RELATIONSHIPS
-- =====================================================

-- Ensure all yacht_profiles have required fields
UPDATE yacht_profiles 
SET yacht_name = COALESCE(yacht_name, name, 'Unnamed Yacht')
WHERE yacht_name IS NULL OR yacht_name = '';

UPDATE yacht_profiles 
SET flag_state = COALESCE(flag_state, 'Unknown')
WHERE flag_state IS NULL OR flag_state = '';

-- =====================================================
-- 7. REFRESH SCHEMA CACHE
-- =====================================================

-- Notify PostgREST to refresh schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the function works
SELECT 'Function test:' as test_type, COUNT(*) as result_count 
FROM get_user_yacht_access_detailed();

-- Test crew_schedules relationship
SELECT 'Crew schedules relationship test:' as test_type, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.table_constraints 
         WHERE table_name = 'crew_schedules' AND constraint_type = 'FOREIGN KEY'
       ) THEN 'OK' ELSE 'MISSING' END as result;

-- Verify all tables exist
SELECT 'Tables exist:' as test_type,
       CASE WHEN (
         SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_name IN ('yacht_profiles', 'crew_members', 'crew_schedules', 'yacht_access_control')
         AND table_schema = 'public'
       ) = 4 THEN 'ALL OK' ELSE 'SOME MISSING' END as result;

SELECT 'Migration completed successfully!' as status;