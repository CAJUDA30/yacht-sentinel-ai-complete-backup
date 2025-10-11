-- Create crew_schedules table for shift management
CREATE TABLE public.crew_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_member_id UUID REFERENCES public.crew_members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night', 'full_day')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  workload INTEGER NOT NULL DEFAULT 50 CHECK (workload >= 0 AND workload <= 100),
  efficiency_score NUMERIC(4,3) DEFAULT 0.850 CHECK (efficiency_score >= 0 AND efficiency_score <= 1),
  assigned_tasks JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment_health_metrics table for predictive maintenance
CREATE TABLE public.equipment_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  metric_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overall_health_score NUMERIC(5,2) NOT NULL CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  temperature NUMERIC(5,2),
  vibration_level NUMERIC(5,2),
  pressure NUMERIC(8,2),
  operating_hours INTEGER DEFAULT 0,
  maintenance_urgency TEXT DEFAULT 'low' CHECK (maintenance_urgency IN ('low', 'medium', 'high', 'critical')),
  predicted_failure_date DATE,
  sensor_data JSONB DEFAULT '{}'::jsonb,
  anomalies_detected JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.crew_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for crew_schedules
CREATE POLICY "crew_schedules_read" ON public.crew_schedules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "crew_schedules_insert" ON public.crew_schedules FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "crew_schedules_update" ON public.crew_schedules FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "crew_schedules_delete" ON public.crew_schedules FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS policies for equipment_health_metrics
CREATE POLICY "equipment_health_read" ON public.equipment_health_metrics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "equipment_health_insert" ON public.equipment_health_metrics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "equipment_health_update" ON public.equipment_health_metrics FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_crew_schedules_member_date ON public.crew_schedules(crew_member_id, shift_date);
CREATE INDEX idx_crew_schedules_date ON public.crew_schedules(shift_date);
CREATE INDEX idx_equipment_health_equipment_id ON public.equipment_health_metrics(equipment_id);
CREATE INDEX idx_equipment_health_timestamp ON public.equipment_health_metrics(metric_timestamp);

-- Create triggers for updated_at
CREATE TRIGGER crew_schedules_updated_at
  BEFORE UPDATE ON public.crew_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample crew schedules for existing crew members
INSERT INTO public.crew_schedules (crew_member_id, shift_date, shift_type, start_time, end_time, workload, efficiency_score, assigned_tasks)
SELECT 
  cm.id,
  CURRENT_DATE + (i || ' days')::interval,
  CASE (i % 3)
    WHEN 0 THEN 'morning'
    WHEN 1 THEN 'afternoon'
    ELSE 'night'
  END,
  CASE (i % 3)
    WHEN 0 THEN '06:00'::time
    WHEN 1 THEN '14:00'::time
    ELSE '22:00'::time
  END,
  CASE (i % 3)
    WHEN 0 THEN '14:00'::time
    WHEN 1 THEN '22:00'::time
    ELSE '06:00'::time
  END,
  60 + (RANDOM() * 30)::int,
  (0.75 + (RANDOM() * 0.2))::numeric,
  CASE (i % 3)
    WHEN 0 THEN '["Deck maintenance", "Safety checks"]'::jsonb
    WHEN 1 THEN '["Engine monitoring", "Equipment inspection"]'::jsonb
    ELSE '["Security rounds", "System monitoring"]'::jsonb
  END
FROM public.crew_members cm
CROSS JOIN generate_series(0, 6) AS i
LIMIT 50;

-- Insert sample equipment health metrics for existing equipment
INSERT INTO public.equipment_health_metrics (equipment_id, overall_health_score, temperature, operating_hours, maintenance_urgency, recommendations)
SELECT 
  e.id,
  (70 + (RANDOM() * 25))::numeric,
  (20 + (RANDOM() * 60))::numeric,
  (RANDOM() * 5000)::int,
  CASE 
    WHEN RANDOM() < 0.1 THEN 'critical'
    WHEN RANDOM() < 0.3 THEN 'high'
    WHEN RANDOM() < 0.6 THEN 'medium'
    ELSE 'low'
  END,
  CASE 
    WHEN RANDOM() < 0.3 THEN '["Schedule routine maintenance", "Monitor temperature"]'::jsonb
    WHEN RANDOM() < 0.6 THEN '["Check fluid levels", "Inspect for wear"]'::jsonb
    ELSE '["Continue normal operation"]'::jsonb
  END
FROM public.equipment e
LIMIT 30;