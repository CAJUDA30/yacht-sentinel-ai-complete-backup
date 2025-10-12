-- Create missing yachts and yacht_profiles tables, fix user_roles RLS, add is_superadmin function

-- 1. CREATE YACHTS TABLE
CREATE TABLE IF NOT EXISTS public.yachts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    length_meters DECIMAL(8,2),
    year_built INTEGER,
    flag_state TEXT,
    owner_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yachts RLS
ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yachts
CREATE POLICY "Service role full access"
ON public.yachts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.yachts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owner full access"
ON public.yachts
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Superadmin full access"
ON public.yachts
FOR ALL
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_yachts_owner_id ON public.yachts(owner_id);
CREATE INDEX IF NOT EXISTS idx_yachts_created_at ON public.yachts(created_at DESC);

-- 2. CREATE YACHT_PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.yacht_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id),
    profile_name TEXT NOT NULL,
    profile_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yacht profiles RLS
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yacht_profiles
CREATE POLICY "Service role full access"
ON public.yacht_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated read access"
ON public.yacht_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owner full access"
ON public.yacht_profiles
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Superadmin full access"
ON public.yacht_profiles
FOR ALL
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_yacht_id ON public.yacht_profiles(yacht_id);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_owner_id ON public.yacht_profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_yacht_profiles_active ON public.yacht_profiles(is_active);

-- 3. FIX USER_ROLES RLS (remove infinite recursion)
-- Drop all existing policies
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_roles;
DROP POLICY IF EXISTS "Enable superadmin access" ON public.user_roles;
DROP POLICY IF EXISTS "authenticated_access_user_roles" ON public.user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Service role full access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Superadmin full access"
ON public.user_roles
FOR ALL
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- 4. CREATE IS_SUPERADMIN FUNCTION
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get current user email
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Simple email-based check
    RETURN (user_email = 'superadmin@yachtexcel.com');
END;
$$;

-- 5. ADD DELETE POLICY TO AI_PROVIDERS_UNIFIED
-- Drop existing delete policy if exists
DROP POLICY IF EXISTS "Authenticated delete access" ON public.ai_providers_unified;

-- Create new delete policy
CREATE POLICY "Authenticated delete access"
ON public.ai_providers_unified
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

-- Create updated_at triggers
DROP TRIGGER IF EXISTS trigger_yachts_updated_at ON public.yachts;
CREATE TRIGGER trigger_yachts_updated_at
    BEFORE UPDATE ON public.yachts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_yacht_profiles_updated_at ON public.yacht_profiles;
CREATE TRIGGER trigger_yacht_profiles_updated_at
    BEFORE UPDATE ON public.yacht_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.yachts IS 'Core yacht registry - stores yacht information and ownership';
COMMENT ON TABLE public.yacht_profiles IS 'Yacht profiles with configuration data for multi-profile support';
COMMENT ON FUNCTION public.is_superadmin() IS 'Checks if current user is superadmin (superadmin@yachtexcel.com)';
