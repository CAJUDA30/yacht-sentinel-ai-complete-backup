import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Equipment {
  id: string;
  name: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  part_number?: string;
  description?: string;
  status: 'operational' | 'maintenance' | 'repair' | 'decommissioned';
  location?: string;
  installation_date?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  warranty_expiry?: string;
  purchase_price?: number;
  images?: string[];
  documents?: string[];
  technical_specs?: Record<string, any>;
  maintenance_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTask {
  id: string;
  equipment_id: string;
  task_name: string;
  description?: string;
  frequency: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration_hours?: number;
  required_parts?: string[];
  required_tools?: string[];
  procedure?: string;
  due_date?: string;
  completed_date?: string;
  completed_by?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchEquipment = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment((data || []) as Equipment[]);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast({
        title: "Error",
        description: "Failed to fetch equipment data",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchMaintenanceTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_maintenance_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setMaintenanceTasks((data || []) as MaintenanceTask[]);
    } catch (error) {
      console.error('Error fetching maintenance tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance tasks",
        variant: "destructive",
      });
    }
  }, [toast]);

  const processEquipmentOCR = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('equipment-ocr', {
        body: formData,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error processing OCR:', error);
      toast({
        title: "Error",
        description: "Failed to process equipment image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const researchEquipment = useCallback(async (equipmentInfo: any) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('equipment-research', {
        body: { equipmentInfo, generateMaintenancePlan: true },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error researching equipment:', error);
      toast({
        title: "Error",
        description: "Failed to research equipment",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const addEquipment = useCallback(async (equipmentData: Partial<Equipment> & { name: string }) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([equipmentData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchEquipment();
      toast({
        title: "Success",
        description: "Equipment added successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchEquipment, toast]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<Equipment>) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchEquipment();
      toast({
        title: "Success",
        description: "Equipment updated successfully",
      });
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchEquipment, toast]);

  const addMaintenanceTask = useCallback(async (taskData: Partial<MaintenanceTask> & { equipment_id: string; task_name: string; frequency: string }) => {
    try {
      const { error } = await supabase
        .from('equipment_maintenance_tasks')
        .insert([taskData]);

      if (error) throw error;
      
      await fetchMaintenanceTasks();
      toast({
        title: "Success",
        description: "Maintenance task added successfully",
      });
    } catch (error) {
      console.error('Error adding maintenance task:', error);
      toast({
        title: "Error",
        description: "Failed to add maintenance task",
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchMaintenanceTasks, toast]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEquipment(), fetchMaintenanceTasks()]);
      setIsLoading(false);
    };

    loadData();

    // Set up real-time subscriptions
    const equipmentSubscription = supabase
      .channel('equipment-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'equipment' },
        () => fetchEquipment()
      )
      .subscribe();

    const tasksSubscription = supabase
      .channel('maintenance-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'equipment_maintenance_tasks' },
        () => fetchMaintenanceTasks()
      )
      .subscribe();

    return () => {
      equipmentSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, [fetchEquipment, fetchMaintenanceTasks]);

  return {
    equipment,
    maintenanceTasks,
    isLoading,
    isProcessing,
    processEquipmentOCR,
    researchEquipment,
    addEquipment,
    updateEquipment,
    addMaintenanceTask,
    refetch: () => {
      fetchEquipment();
      fetchMaintenanceTasks();
    }
  };
}