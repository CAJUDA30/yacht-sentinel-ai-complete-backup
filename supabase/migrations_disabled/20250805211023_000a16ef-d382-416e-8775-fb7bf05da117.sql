-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  part_number TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'operational',
  location TEXT,
  installation_date DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  warranty_expiry DATE,
  purchase_price NUMERIC,
  images TEXT[],
  documents TEXT[],
  technical_specs JSONB DEFAULT '{}',
  maintenance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create equipment maintenance tasks table
CREATE TABLE public.equipment_maintenance_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  priority TEXT NOT NULL DEFAULT 'medium',
  estimated_duration_hours NUMERIC,
  required_parts TEXT[],
  required_tools TEXT[],
  procedure TEXT,
  due_date DATE,
  completed_date DATE,
  completed_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment documents table
CREATE TABLE public.equipment_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'manual', 'warranty', 'certificate', 'drawing', 'photo'
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID,
  tags TEXT[],
  description TEXT
);

-- Enable Row Level Security
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for equipment access
CREATE POLICY "Allow all operations on equipment" 
ON public.equipment 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on equipment_maintenance_tasks" 
ON public.equipment_maintenance_tasks 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on equipment_documents" 
ON public.equipment_documents 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_equipment_updated_at
BEFORE UPDATE ON public.equipment
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_maintenance_tasks_updated_at
BEFORE UPDATE ON public.equipment_maintenance_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_equipment_manufacturer ON public.equipment(manufacturer);
CREATE INDEX idx_maintenance_tasks_equipment_id ON public.equipment_maintenance_tasks(equipment_id);
CREATE INDEX idx_maintenance_tasks_due_date ON public.equipment_maintenance_tasks(due_date);
CREATE INDEX idx_equipment_documents_equipment_id ON public.equipment_documents(equipment_id);