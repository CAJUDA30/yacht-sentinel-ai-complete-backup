-- Create system_settings table for app configuration
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID,
  theme_settings JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  system_settings JSONB DEFAULT '{}',
  user_settings JSONB DEFAULT '{}',
  ai_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system settings
CREATE POLICY "Users can manage their yacht settings" 
ON public.system_settings 
FOR ALL 
USING (yacht_id IN (
  SELECT id FROM yacht_profiles WHERE owner_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();