-- Fix yacht_profiles table structure
-- Add missing columns that are referenced in the application

-- Add owner_id column if it doesn't exist
ALTER TABLE public.yacht_profiles 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add other commonly used columns
ALTER TABLE public.yacht_profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS yacht_name TEXT,
ADD COLUMN IF NOT EXISTS yacht_type TEXT,
ADD COLUMN IF NOT EXISTS imo_number TEXT,
ADD COLUMN IF NOT EXISTS flag_state TEXT,
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS length_meters DECIMAL,
ADD COLUMN IF NOT EXISTS beam_meters DECIMAL,
ADD COLUMN IF NOT EXISTS draft_meters DECIMAL,
ADD COLUMN IF NOT EXISTS gross_tonnage DECIMAL,
ADD COLUMN IF NOT EXISTS max_speed DECIMAL,
ADD COLUMN IF NOT EXISTS crew_capacity INTEGER,
ADD COLUMN IF NOT EXISTS guest_capacity INTEGER,
ADD COLUMN IF NOT EXISTS fuel_capacity DECIMAL,
ADD COLUMN IF NOT EXISTS builder TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS home_port TEXT,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS documentation JSONB DEFAULT '{}'::jsonb;

-- Enable Row Level Security if not already enabled
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own yacht profiles" ON public.yacht_profiles;
DROP POLICY IF EXISTS "Users can insert their own yacht profiles" ON public.yacht_profiles;
DROP POLICY IF EXISTS "Users can update their own yacht profiles" ON public.yacht_profiles;

-- Create RLS policies for yacht_profiles with owner_id
CREATE POLICY "Users can view their own yacht profiles" ON public.yacht_profiles
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own yacht profiles" ON public.yacht_profiles
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own yacht profiles" ON public.yacht_profiles
  FOR UPDATE USING (auth.uid() = owner_id);

-- Create or replace the yacht access function
CREATE OR REPLACE FUNCTION public.get_user_yacht_access_detailed(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  yacht_id UUID,
  yacht_name TEXT,
  yacht_type TEXT,
  access_level TEXT,
  permissions JSONB
) AS $$
BEGIN
  IF target_user_id IS NULL THEN
    target_user_id := auth.uid();
  END IF;
  
  RETURN QUERY
  SELECT 
    yp.id as yacht_id,
    COALESCE(yp.yacht_name, yp.name, 'Unnamed Yacht') as yacht_name,
    COALESCE(yp.yacht_type, 'Unknown') as yacht_type,
    'owner'::TEXT as access_level,
    '{"read": true, "write": true, "admin": true}'::JSONB as permissions
  FROM public.yacht_profiles yp
  WHERE yp.owner_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_yacht_access_detailed TO authenticated;
GRANT ALL ON public.yacht_profiles TO authenticated;