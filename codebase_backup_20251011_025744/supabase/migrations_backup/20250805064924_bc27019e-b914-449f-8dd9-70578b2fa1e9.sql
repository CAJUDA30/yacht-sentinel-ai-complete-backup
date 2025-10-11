-- Create crew members table
CREATE TABLE IF NOT EXISTS public.crew_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  performance_score INTEGER DEFAULT 0,
  certifications TEXT[],
  availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'onboarded', 'leave', 'training')),
  skills TEXT[],
  experience_years INTEGER DEFAULT 0,
  next_training DATE,
  ai_recommendations TEXT[],
  avatar_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  emergency_contact JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shift schedules table
CREATE TABLE public.shift_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night')),
  crew_member_ids UUID[],
  workload INTEGER DEFAULT 0,
  efficiency_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create yacht status table for real-time dashboard data
CREATE TABLE public.yacht_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_location TEXT,
  coordinates TEXT,
  weather_temp TEXT,
  wind_speed TEXT,
  fuel_level INTEGER DEFAULT 0,
  battery_level INTEGER DEFAULT 0,
  crew_count INTEGER DEFAULT 0,
  guest_count INTEGER DEFAULT 0,
  maintenance_alerts INTEGER DEFAULT 0,
  financial_summary TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yacht_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on crew_members" ON public.crew_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on shift_schedules" ON public.shift_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on yacht_status" ON public.yacht_status FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_crew_members_updated_at
  BEFORE UPDATE ON public.crew_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_schedules_updated_at
  BEFORE UPDATE ON public.shift_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample crew data
INSERT INTO public.crew_members (name, position, performance_score, certifications, availability, skills, experience_years, next_training, ai_recommendations) VALUES
('Captain John Smith', 'Captain', 94, ARRAY['Master 500GT', 'STCW Basic Safety', 'MCA Safety'], 'available', ARRAY['Navigation', 'Leadership', 'Weather Analysis'], 15, '2024-04-15', ARRAY['Advanced weather routing course', 'Leadership development program']),
('Sarah Johnson', 'Chief Engineer', 89, ARRAY['Engineer Class 3', 'STCW Basic Safety'], 'onboarded', ARRAY['Engine Maintenance', 'Troubleshooting', 'Systems Analysis'], 8, '2024-03-20', ARRAY['AI-powered diagnostics training', 'Energy efficiency optimization']),
('Mike Rodriguez', 'Deck Officer', 87, ARRAY['OOW 500GT', 'STCW Basic Safety'], 'available', ARRAY['Deck Operations', 'Safety Protocols', 'Guest Relations'], 5, '2024-03-25', ARRAY['Advanced guest service training', 'Emergency response certification']),
('Anna Thompson', 'Chief Steward', 91, ARRAY['Food Safety', 'STCW Basic Safety'], 'available', ARRAY['Hospitality', 'Guest Services', 'Event Planning'], 7, '2024-04-10', ARRAY['Wine sommelier certification', 'Advanced hospitality management']),
('David Chen', 'Navigation Officer', 85, ARRAY['OOW 200GT', 'STCW Basic Safety'], 'training', ARRAY['Chart Navigation', 'Radar Operations', 'GPS Systems'], 3, '2024-03-30', ARRAY['Electronic navigation systems', 'Weather routing certification']);

-- Insert sample schedule data without subqueries - using safe approach
-- First insert some sample data, then use a procedural block to create schedules
INSERT INTO public.shift_schedules (date, shift_type, crew_member_ids, workload, efficiency_score) 
VALUES 
('2024-03-15', 'morning', '{}', 75, 92),
('2024-03-15', 'afternoon', '{}', 60, 88),
('2024-03-15', 'night', '{}', 45, 85);

-- Update the schedules with actual crew member IDs using a safe approach
DO $$
DECLARE
  schedule_rec RECORD;
  crew_ids UUID[];
BEGIN
  -- Update morning shift
  FOR schedule_rec IN 
    SELECT id FROM public.shift_schedules 
    WHERE date = '2024-03-15' AND shift_type = 'morning'
  LOOP
    SELECT ARRAY_AGG(cm.id) INTO crew_ids 
    FROM public.crew_members cm 
    WHERE cm.name IN ('Captain John Smith', 'Mike Rodriguez') 
    LIMIT 2;
    
    IF crew_ids IS NOT NULL THEN
      UPDATE public.shift_schedules 
      SET crew_member_ids = crew_ids 
      WHERE id = schedule_rec.id;
    END IF;
  END LOOP;

  -- Update afternoon shift
  FOR schedule_rec IN 
    SELECT id FROM public.shift_schedules 
    WHERE date = '2024-03-15' AND shift_type = 'afternoon'
  LOOP
    SELECT ARRAY_AGG(cm.id) INTO crew_ids 
    FROM public.crew_members cm 
    WHERE cm.name IN ('Sarah Johnson', 'Anna Thompson') 
    LIMIT 2;
    
    IF crew_ids IS NOT NULL THEN
      UPDATE public.shift_schedules 
      SET crew_member_ids = crew_ids 
      WHERE id = schedule_rec.id;
    END IF;
  END LOOP;

  -- Update night shift
  FOR schedule_rec IN 
    SELECT id FROM public.shift_schedules 
    WHERE date = '2024-03-15' AND shift_type = 'night'
  LOOP
    SELECT ARRAY_AGG(cm.id) INTO crew_ids 
    FROM public.crew_members cm 
    WHERE cm.name = 'David Chen' 
    LIMIT 1;
    
    IF crew_ids IS NOT NULL THEN
      UPDATE public.shift_schedules 
      SET crew_member_ids = crew_ids 
      WHERE id = schedule_rec.id;
    END IF;
  END LOOP;
END $$;

-- Insert yacht status data
INSERT INTO public.yacht_status (current_location, coordinates, weather_temp, wind_speed, fuel_level, battery_level, crew_count, guest_count, maintenance_alerts, financial_summary) VALUES
('Monaco Marina', '43.7384° N, 7.4246° E', '24°C', '8 kts', 85, 92, 5, 8, 3, '$45,200');