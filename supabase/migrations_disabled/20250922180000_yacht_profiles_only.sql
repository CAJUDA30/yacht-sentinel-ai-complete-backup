-- Create yacht_profiles table only
CREATE TABLE yacht_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    yacht_name TEXT,
    yacht_type TEXT,
    length_overall DECIMAL,
    beam DECIMAL,
    draft DECIMAL,
    year_built INTEGER,
    builder TEXT,
    flag_state TEXT,
    registration_number TEXT,
    imo_number TEXT,
    call_sign TEXT,
    owner_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy
CREATE POLICY "yacht_profiles_policy" ON yacht_profiles
    FOR ALL USING (auth.uid() = owner_id);