-- Create missing database tables for Yacht Sentinel AI
-- Migration: 20250922165500_create_missing_tables

-- 1. yacht_profiles table
CREATE TABLE IF NOT EXISTS yacht_profiles (
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

-- 2. equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    yacht_id UUID REFERENCES yacht_profiles(id),
    equipment_name TEXT NOT NULL,
    equipment_type TEXT,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    installation_date DATE,
    next_maintenance_date DATE,
    maintenance_interval_days INTEGER,
    status TEXT DEFAULT 'operational',
    location_on_yacht TEXT,
    specifications JSONB,
    maintenance_history JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE yacht_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personalization_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for yacht_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'yacht_profiles' 
        AND policyname = 'Users can view their own yacht profiles'
    ) THEN
        CREATE POLICY "Users can view their own yacht profiles" ON yacht_profiles
            FOR SELECT USING (auth.uid() = owner_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'yacht_profiles' 
        AND policyname = 'Users can insert their own yacht profiles'
    ) THEN
        CREATE POLICY "Users can insert their own yacht profiles" ON yacht_profiles
            FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'yacht_profiles' 
        AND policyname = 'Users can update their own yacht profiles'
    ) THEN
        CREATE POLICY "Users can update their own yacht profiles" ON yacht_profiles
            FOR UPDATE USING (auth.uid() = owner_id);
    END IF;
END $$;

-- Create RLS policies for equipment
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'equipment' 
        AND policyname = 'Users can view equipment for their yachts'
    ) THEN
        CREATE POLICY "Users can view equipment for their yachts" ON equipment
            FOR SELECT USING (
                yacht_id IN (
                    SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'equipment' 
        AND policyname = 'Users can insert equipment for their yachts'
    ) THEN
        CREATE POLICY "Users can insert equipment for their yachts" ON equipment
            FOR INSERT WITH CHECK (
                yacht_id IN (
                    SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
                )
            );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'equipment' 
        AND policyname = 'Users can update equipment for their yachts'
    ) THEN
        CREATE POLICY "Users can update equipment for their yachts" ON equipment
            FOR UPDATE USING (
                yacht_id IN (
                    SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Create RLS policies for user_personalization_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_personalization_profiles' 
        AND policyname = 'Users can view their own personalization profile'
    ) THEN
        CREATE POLICY "Users can view their own personalization profile" ON user_personalization_profiles
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_personalization_profiles' 
        AND policyname = 'Users can insert their own personalization profile'
    ) THEN
        CREATE POLICY "Users can insert their own personalization profile" ON user_personalization_profiles
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_personalization_profiles' 
        AND policyname = 'Users can update their own personalization profile'
    ) THEN
        CREATE POLICY "Users can update their own personalization profile" ON user_personalization_profiles
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create the missing RPC function get_user_yacht_access_detailed
CREATE OR REPLACE FUNCTION get_user_yacht_access_detailed(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    yacht_id UUID,
    yacht_name TEXT,
    yacht_type TEXT,
    access_level TEXT,
    permissions JSONB
) AS $$
BEGIN
    -- Use current user if no target specified
    IF target_user_id IS NULL THEN
        target_user_id := auth.uid();
    END IF;
    
    -- Return yacht access details for the user
    RETURN QUERY
    SELECT 
        yp.id as yacht_id,
        yp.yacht_name,
        yp.yacht_type,
        'owner'::TEXT as access_level,
        '{"read": true, "write": true, "admin": true}'::JSONB as permissions
    FROM yacht_profiles yp
    WHERE yp.owner_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_user_yacht_access_detailed TO authenticated;

-- Insert some sample data for testing
DO $$
DECLARE
    sample_user_id UUID;
    sample_yacht_id UUID;
BEGIN
    -- Check if we have any users to work with
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- Insert a sample yacht profile if none exists
        INSERT INTO yacht_profiles (
            yacht_name, yacht_type, length_overall, beam, draft, year_built, 
            builder, flag_state, registration_number, owner_id, status
        ) VALUES (
            'Sample Yacht', 'Motor Yacht', 50.5, 12.2, 3.8, 2020,
            'Example Shipyard', 'US', 'SY-12345', sample_user_id, 'active'
        ) 
        ON CONFLICT DO NOTHING
        RETURNING id INTO sample_yacht_id;
        
        -- Insert sample equipment if yacht was created
        IF sample_yacht_id IS NOT NULL THEN
            INSERT INTO equipment (
                yacht_id, equipment_name, equipment_type, manufacturer, 
                model, next_maintenance_date, maintenance_interval_days, status
            ) VALUES 
            (sample_yacht_id, 'Main Engine Port', 'Engine', 'Caterpillar', 'C32A', 
             CURRENT_DATE + INTERVAL '30 days', 365, 'operational'),
            (sample_yacht_id, 'Generator 1', 'Generator', 'Kohler', '25EFOZD', 
             CURRENT_DATE + INTERVAL '60 days', 180, 'operational')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;