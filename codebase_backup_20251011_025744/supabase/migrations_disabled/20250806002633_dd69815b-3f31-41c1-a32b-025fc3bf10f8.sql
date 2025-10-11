-- Create yacht profiles table for enterprise vessel management
CREATE TABLE public.yacht_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users ON DELETE CASCADE,
  imo_number TEXT UNIQUE,
  current_location POINT,
  fuel_capacity DECIMAL DEFAULT 0,
  fuel_level DECIMAL DEFAULT 0,
  battery_level DECIMAL DEFAULT 100,
  max_speed DECIMAL DEFAULT 0,
  crew_capacity INTEGER DEFAULT 0,
  guest_capacity INTEGER DEFAULT 0,
  length_meters DECIMAL,
  beam_meters DECIMAL,
  draft_meters DECIMAL,
  year_built INTEGER,
  builder TEXT,
  flag_state TEXT,
  home_port TEXT,
  classification_society TEXT,
  insurance_expiry DATE,
  status TEXT DEFAULT 'operational',
  specifications JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create crew members table for real crew management
CREATE TABLE IF NOT EXISTS public.crew_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID REFERENCES public.yacht_profiles ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  license_number TEXT,
  license_expiry DATE,
  medical_certificate_expiry DATE,
  visa_expiry DATE,
  stcw_certificate TEXT,
  certifications JSONB DEFAULT '[]',
  performance_score DECIMAL DEFAULT 0,
  hours_worked_month INTEGER DEFAULT 0,
  overtime_hours INTEGER DEFAULT 0,
  leave_balance INTEGER DEFAULT 0,
  emergency_contact JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  hire_date DATE,
  salary DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create guest charters table for charter management
CREATE TABLE public.guest_charters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID REFERENCES public.yacht_profiles ON DELETE CASCADE,
  charter_name TEXT NOT NULL,
  primary_guest_name TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_port TEXT,
  end_port TEXT,
  charter_value DECIMAL,
  deposit_amount DECIMAL,
  balance_due DECIMAL,
  payment_status TEXT DEFAULT 'pending',
  special_requests JSONB DEFAULT '[]',
  dietary_requirements JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '{}',
  satisfaction_score DECIMAL,
  feedback TEXT,
  status TEXT DEFAULT 'confirmed',
  broker_name TEXT,
  broker_commission DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fuel consumption tracking
CREATE TABLE public.fuel_consumption (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID REFERENCES public.yacht_profiles ON DELETE CASCADE,
  consumption_date DATE NOT NULL,
  fuel_consumed_liters DECIMAL NOT NULL,
  distance_nautical_miles DECIMAL,
  engine_hours DECIMAL,
  average_speed DECIMAL,
  fuel_efficiency DECIMAL,
  weather_conditions TEXT,
  sea_state TEXT,
  route_taken TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create financial transactions for yacht operations
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID REFERENCES public.yacht_profiles ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'revenue', 'expense', 'maintenance', 'fuel', 'provisioning'
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_date DATE NOT NULL,
  vendor_name TEXT,
  invoice_number TEXT,
  payment_method TEXT,
  charter_id UUID REFERENCES public.guest_charters,
  equipment_id UUID REFERENCES public.equipment,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create yacht positions for real-time tracking
CREATE TABLE public.yacht_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  yacht_id UUID REFERENCES public.yacht_profiles ON DELETE CASCADE,
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  speed_knots DECIMAL,
  heading_degrees DECIMAL,
  depth_meters DECIMAL,
  wind_speed_knots DECIMAL,
  wind_direction_degrees DECIMAL,
  sea_temperature_celsius DECIMAL,
  air_temperature_celsius DECIMAL,
  barometric_pressure DECIMAL,
  visibility_meters DECIMAL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_charters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yacht_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for yacht profiles
CREATE POLICY "Users can view yachts they own or crew on" 
ON public.yacht_profiles FOR SELECT 
USING (
  owner_id = auth.uid() OR 
  id IN (SELECT yacht_id FROM public.crew_members WHERE user_id = auth.uid())
);

CREATE POLICY "Owners can manage their yachts" 
ON public.yacht_profiles FOR ALL 
USING (owner_id = auth.uid());

-- Create RLS policies for crew members
CREATE POLICY "Users can view crew on their yachts" 
ON public.crew_members FOR SELECT 
USING (
  yacht_id IN (
    SELECT id FROM public.yacht_profiles 
    WHERE owner_id = auth.uid() OR 
    id IN (SELECT yacht_id FROM public.crew_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Yacht owners and captains can manage crew" 
ON public.crew_members FOR ALL 
USING (
  yacht_id IN (
    SELECT id FROM public.yacht_profiles WHERE owner_id = auth.uid()
  ) OR
  (user_id = auth.uid() AND position IN ('captain', 'first_officer'))
);

-- Create RLS policies for guest charters
CREATE POLICY "Users can view charters for their yachts" 
ON public.guest_charters FOR SELECT 
USING (
  yacht_id IN (
    SELECT id FROM public.yacht_profiles 
    WHERE owner_id = auth.uid() OR 
    id IN (SELECT yacht_id FROM public.crew_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Yacht owners can manage charters" 
ON public.guest_charters FOR ALL 
USING (
  yacht_id IN (SELECT id FROM public.yacht_profiles WHERE owner_id = auth.uid())
);

-- Create RLS policies for fuel consumption
CREATE POLICY "Users can view fuel data for their yachts" 
ON public.fuel_consumption FOR SELECT 
USING (
  yacht_id IN (
    SELECT id FROM public.yacht_profiles 
    WHERE owner_id = auth.uid() OR 
    id IN (SELECT yacht_id FROM public.crew_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Yacht owners and engineers can manage fuel data" 
ON public.fuel_consumption FOR ALL 
USING (
  yacht_id IN (
    SELECT id FROM public.yacht_profiles WHERE owner_id = auth.uid()
  ) OR
  yacht_id IN (
    SELECT yacht_id FROM public.crew_members 
    WHERE user_id = auth.uid() AND position IN ('chief_engineer', 'engineer', 'captain')
  )
);

-- Create RLS policies for financial transactions
CREATE POLICY "Users can view financial data for their yachts" 
ON public.financial_transactions FOR SELECT 
USING (
  yacht_id IN (
    SELECT id FROM public.yacht_profiles 
    WHERE owner_id = auth.uid() OR 
    id IN (SELECT yacht_id FROM public.crew_members WHERE user_id = auth.uid() AND position IN ('captain', 'purser'))
  )
);

CREATE POLICY "Yacht owners can manage financial data" 
ON public.financial_transactions FOR ALL 
USING (
  yacht_id IN (SELECT id FROM public.yacht_profiles WHERE owner_id = auth.uid())
);

-- Create RLS policies for yacht positions
CREATE POLICY "Users can view positions for their yachts" 
ON public.yacht_positions FOR SELECT 
USING (
  yacht_id IN (
    SELECT id FROM public.yacht_profiles 
    WHERE owner_id = auth.uid() OR 
    id IN (SELECT yacht_id FROM public.crew_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY "System can insert position data" 
ON public.yacht_positions FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_yacht_profiles_owner ON public.yacht_profiles(owner_id);
CREATE INDEX idx_crew_members_yacht ON public.crew_members(yacht_id);
CREATE INDEX idx_crew_members_user ON public.crew_members(user_id);
CREATE INDEX idx_guest_charters_yacht ON public.guest_charters(yacht_id);
CREATE INDEX idx_guest_charters_dates ON public.guest_charters(start_date, end_date);
CREATE INDEX idx_fuel_consumption_yacht ON public.fuel_consumption(yacht_id);
CREATE INDEX idx_financial_transactions_yacht ON public.financial_transactions(yacht_id);
CREATE INDEX idx_yacht_positions_yacht ON public.yacht_positions(yacht_id);
CREATE INDEX idx_yacht_positions_time ON public.yacht_positions(recorded_at);

-- Create triggers for updated_at columns
CREATE TRIGGER update_yacht_profiles_updated_at
  BEFORE UPDATE ON public.yacht_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crew_members_updated_at
  BEFORE UPDATE ON public.crew_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guest_charters_updated_at
  BEFORE UPDATE ON public.guest_charters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();