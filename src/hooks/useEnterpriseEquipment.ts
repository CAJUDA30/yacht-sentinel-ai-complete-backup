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

export interface MaintenanceSchedule {
  id: string;
  equipment_id: string;
  schedule_name: string;
  description?: string;
  frequency_type: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  frequency_value: number;
  current_hours: number;
  next_due_hours?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration_hours?: number;
  requires_shutdown: boolean;
  auto_generate_tasks: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EquipmentSparePart {
  id: string;
  equipment_id: string;
  inventory_item_id?: string;
  part_name: string;
  part_number?: string;
  manufacturer?: string;
  quantity_required: number;
  is_critical: boolean;
  replacement_frequency_hours?: number;
  cost_per_unit?: number;
  supplier?: string;
  supplier_part_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcurementRequest {
  id: string;
  equipment_id?: string;
  maintenance_schedule_id?: string;
  part_name: string;
  part_number?: string;
  quantity_needed: number;
  current_stock: number;
  minimum_threshold: number;
  estimated_cost?: number;
  supplier?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  request_status: 'pending' | 'approved' | 'ordered' | 'fulfilled' | 'cancelled';
  auto_approved: boolean;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useEnterpriseEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [spareParts, setSpareParts] = useState<EquipmentSparePart[]>([]);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch equipment
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (equipmentError) throw equipmentError;
      setEquipment((equipmentData || []) as Equipment[]);

      // Fetch maintenance schedules
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('is_active', true)
        .order('next_due_hours', { ascending: true });

      if (scheduleError) throw scheduleError;
      setMaintenanceSchedules((scheduleData || []) as MaintenanceSchedule[]);

      // Fetch spare parts
      const { data: partsData, error: partsError } = await supabase
        .from('equipment_spare_parts')
        .select('*')
        .order('part_name');

      if (partsError) throw partsError;
      setSpareParts((partsData || []) as EquipmentSparePart[]);

      // Fetch procurement requests
      const { data: procurementData, error: procurementError } = await supabase
        .from('automated_procurement_requests')
        .select('*')
        .eq('request_status', 'pending')
        .order('urgency', { ascending: false });

      if (procurementError) throw procurementError;
      setProcurementRequests((procurementData || []) as ProcurementRequest[]);

    } catch (error) {
      console.error('Error fetching equipment data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch equipment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const processSmartScanResult = useCallback(async (scanResult: any) => {
    setIsProcessing(true);
    try {
      const extractedData = scanResult.extractedData;
      
      // Create equipment record from smart scan
      const newEquipment = {
        name: extractedData.equipmentName || extractedData.productName || 'Scanned Equipment',
        manufacturer: extractedData.manufacturer || extractedData.brand,
        model_number: extractedData.model,
        serial_number: extractedData.serialNumber,
        part_number: extractedData.partNumber,
        status: 'operational' as const,
        location: 'To be assigned',
        technical_specs: extractedData.specifications || {},
        images: scanResult.imagePath ? [scanResult.imagePath] : [],
        maintenance_notes: `AI Confidence: ${Math.round(scanResult.confidence * 100)}%\nScan Type: ${scanResult.scanType}`
      };

      const { data: addedEquipment, error: equipmentError } = await supabase
        .from('equipment')
        .insert([newEquipment])
        .select()
        .single();

      if (equipmentError) throw equipmentError;

      // Create maintenance schedules based on AI analysis
      if (extractedData.maintenanceNeeds && addedEquipment) {
        const schedules = extractedData.maintenanceNeeds;
        
        for (const schedule of schedules) {
          await supabase
            .from('maintenance_schedules')
            .insert({
              equipment_id: addedEquipment.id,
              schedule_name: schedule.name || 'Standard Maintenance',
              description: schedule.description,
              frequency_type: schedule.frequencyType || 'hours',
              frequency_value: schedule.frequencyValue || 100,
              priority: schedule.priority || 'medium',
              estimated_duration_hours: schedule.estimatedHours || 2,
              requires_shutdown: schedule.requiresShutdown || false
            });
        }
      }

      // Link required parts if identified
      if (extractedData.requiredParts && addedEquipment) {
        for (const part of extractedData.requiredParts) {
          await supabase
            .from('equipment_spare_parts')
            .insert({
              equipment_id: addedEquipment.id,
              part_name: part.name,
              part_number: part.partNumber,
              manufacturer: part.manufacturer,
              quantity_required: part.quantity || 1,
              is_critical: part.critical || false,
              cost_per_unit: part.estimatedCost,
              supplier: part.supplier
            });
        }
      }

      await fetchAllData();
      
      toast({
        title: "Equipment Added Successfully",
        description: `${newEquipment.name} scanned and added with ${Math.round(scanResult.confidence * 100)}% confidence`,
      });

      return addedEquipment;

    } catch (error) {
      console.error('Error processing smart scan:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process scanned equipment data",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [fetchAllData, toast]);

  const updateEquipmentUsage = useCallback(async (equipmentId: string, usageHours: number, notes?: string) => {
    try {
      // Log usage
      await supabase
        .from('equipment_usage_logs')
        .insert({
          equipment_id: equipmentId,
          usage_hours: usageHours,
          notes: notes
        });

      // Update maintenance schedules
      const { data: schedules } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('is_active', true);

      if (schedules) {
        for (const schedule of schedules) {
          const newCurrentHours = schedule.current_hours + usageHours;
          const isMaintenanceDue = newCurrentHours >= (schedule.next_due_hours || schedule.frequency_value);

          await supabase
            .from('maintenance_schedules')
            .update({
              current_hours: newCurrentHours,
              ...(isMaintenanceDue && {
                next_due_hours: newCurrentHours + schedule.frequency_value
              })
            })
            .eq('id', schedule.id);

          // Check if parts need to be ordered
          if (isMaintenanceDue) {
            await checkAndCreateProcurementRequests(equipmentId, schedule.id);
          }
        }
      }

      await fetchAllData();

    } catch (error) {
      console.error('Error updating equipment usage:', error);
      toast({
        title: "Error",
        description: "Failed to update equipment usage",
        variant: "destructive",
      });
    }
  }, [fetchAllData, toast]);

  const checkAndCreateProcurementRequests = useCallback(async (equipmentId: string, maintenanceScheduleId: string) => {
    try {
      // Get required parts for this maintenance
      const { data: requiredParts } = await supabase
        .from('maintenance_parts_requirements')
        .select(`
          *,
          equipment_spare_parts (*)
        `)
        .eq('maintenance_schedule_id', maintenanceScheduleId);

      if (requiredParts) {
        for (const requirement of requiredParts) {
          const sparePart = requirement.equipment_spare_parts;
          
          // Check current inventory if linked
          if (sparePart?.inventory_item_id) {
            const { data: inventoryItem } = await supabase
              .from('inventory_items')
              .select('quantity, min_stock')
              .eq('id', sparePart.inventory_item_id)
              .single();

            if (inventoryItem && inventoryItem.quantity < requirement.minimum_stock_level) {
              // Create procurement request
              await supabase
                .from('automated_procurement_requests')
                .insert({
                  equipment_id: equipmentId,
                  maintenance_schedule_id: maintenanceScheduleId,
                  part_name: requirement.part_name,
                  quantity_needed: requirement.quantity_needed * 2, // Order double
                  current_stock: inventoryItem.quantity,
                  minimum_threshold: requirement.minimum_stock_level,
                  urgency: inventoryItem.quantity === 0 ? 'critical' : 'high',
                  notes: 'Auto-generated for upcoming maintenance'
                });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking procurement needs:', error);
    }
  }, []);

  const approveProcurementRequest = useCallback(async (requestId: string) => {
    try {
      await supabase
        .from('automated_procurement_requests')
        .update({
          request_status: 'approved',
          auto_approved: false
        })
        .eq('id', requestId);

      await fetchAllData();

      toast({
        title: "Procurement Approved",
        description: "Request has been approved and sent to procurement",
      });
    } catch (error) {
      console.error('Error approving procurement request:', error);
      toast({
        title: "Error",
        description: "Failed to approve procurement request",
        variant: "destructive",
      });
    }
  }, [fetchAllData, toast]);

  useEffect(() => {
    fetchAllData();

    // Set up real-time subscriptions
    const equipmentSubscription = supabase
      .channel('equipment-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'equipment' },
        () => fetchAllData()
      )
      .subscribe();

    const procurementSubscription = supabase
      .channel('procurement-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'automated_procurement_requests' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      equipmentSubscription.unsubscribe();
      procurementSubscription.unsubscribe();
    };
  }, [fetchAllData]);

  const addEquipment = useCallback(async (equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .insert([equipmentData]);

      if (error) throw error;

      await fetchAllData();
      
      toast({
        title: "Equipment Added",
        description: `${equipmentData.name} has been added successfully`,
      });
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchAllData, toast]);

  const updateEquipment = useCallback(async (equipmentId: string, equipmentData: Partial<Equipment>) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update(equipmentData)
        .eq('id', equipmentId);

      if (error) throw error;

      await fetchAllData();
      
      toast({
        title: "Equipment Updated",
        description: `Equipment has been updated successfully`,
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
  }, [fetchAllData, toast]);

  return {
    equipment,
    maintenanceSchedules,
    spareParts,
    procurementRequests,
    isLoading,
    isProcessing,
    processSmartScanResult,
    updateEquipmentUsage,
    approveProcurementRequest,
    addEquipment,
    updateEquipment,
    refetch: fetchAllData
  };
}