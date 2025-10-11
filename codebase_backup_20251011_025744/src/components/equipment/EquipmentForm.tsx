import { FC } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Equipment } from '@/hooks/useEnterpriseEquipment';
import { Badge } from "@/components/ui/badge";

interface EquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment?: Equipment;
  smartScanData?: any;
}

interface EquipmentFormData {
  name: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  part_number?: string;
  description?: string;
  status: 'operational' | 'maintenance' | 'repair' | 'decommissioned';
  location?: string;
  installation_date?: string;
  warranty_expiry?: string;
  purchase_price?: number;
  maintenance_notes?: string;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  equipment,
  smartScanData
}) => {
  const { toast } = useToast();
  
  // Get AI-extracted data
  const aiData = smartScanData?.extractedData || {};
  const confidence = smartScanData?.confidence || 0;
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<EquipmentFormData>({
    defaultValues: equipment ? {
      name: equipment.name,
      manufacturer: equipment.manufacturer || '',
      model_number: equipment.model_number || '',
      serial_number: equipment.serial_number || '',
      part_number: equipment.part_number || '',
      description: equipment.description || '',
      status: equipment.status,
      location: equipment.location || '',
      installation_date: equipment.installation_date || '',
      warranty_expiry: equipment.warranty_expiry || '',
      purchase_price: equipment.purchase_price || undefined,
      maintenance_notes: equipment.maintenance_notes || '',
    } : smartScanData ? {
      name: aiData.equipmentName || aiData.productName || '',
      manufacturer: aiData.manufacturer || aiData.brand || '',
      model_number: aiData.model || '',
      serial_number: aiData.serialNumber || '',
      part_number: aiData.partNumber || '',
      description: aiData.description || '',
      status: 'operational' as const,
      location: '',
      maintenance_notes: `AI Confidence: ${Math.round(confidence * 100)}%\nExtracted via Smart Scan`
    } : {
      status: 'operational',
    }
  });

  // Auto-fill fields when smart scan data is available
  React.useEffect(() => {
    if (smartScanData && !equipment) {
      setValue('name', aiData.equipmentName || aiData.productName || '');
      setValue('manufacturer', aiData.manufacturer || aiData.brand || '');
      setValue('model_number', aiData.model || '');
      setValue('serial_number', aiData.serialNumber || '');
      setValue('part_number', aiData.partNumber || '');
      setValue('description', aiData.description || '');
      setValue('maintenance_notes', `AI Confidence: ${Math.round(confidence * 100)}%\nExtracted via Smart Scan`);
    }
  }, [smartScanData, aiData, confidence, setValue, equipment]);

  const selectedStatus = watch('status');

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      const equipmentData = {
        ...data,
        purchase_price: data.purchase_price ? Number(data.purchase_price) : null,
        technical_specs: smartScanData?.extractedData?.specifications || {},
      };

      if (equipment) {
        // Update existing equipment
        const { error } = await supabase
          .from('equipment')
          .update(equipmentData)
          .eq('id', equipment.id);

        if (error) throw error;

        toast({
          title: "Equipment Updated",
          description: `${data.name} has been updated successfully`,
        });
      } else {
        // Create new equipment
        const { data: addedEquipment, error } = await supabase
          .from('equipment')
          .insert([equipmentData])
          .select()
          .single();

        if (error) throw error;

        // Auto-create maintenance schedules if from smart scan
        if (smartScanData?.extractedData?.maintenanceNeeds && addedEquipment) {
          const schedules = smartScanData.extractedData.maintenanceNeeds;
          
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

        // Auto-link required parts if from smart scan
        if (smartScanData?.extractedData?.requiredParts && addedEquipment) {
          for (const part of smartScanData.extractedData.requiredParts) {
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

        toast({
          title: "Equipment Added Successfully",
          description: `${data.name} has been added${smartScanData ? ` with ${Math.round(confidence * 100)}% AI confidence` : ''}`,
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast({
        title: "Error",
        description: "Failed to save equipment",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {equipment ? 'Edit Equipment' : smartScanData ? 'Confirm Scanned Equipment' : 'Add New Equipment'}
            {smartScanData && (
              <Badge variant={confidence > 0.8 ? "default" : confidence > 0.6 ? "secondary" : "outline"}>
                {Math.round(confidence * 100)}% confidence
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {smartScanData && (
          <div className="bg-primary/5 p-4 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">
              Smart scan detected equipment with {Math.round(confidence * 100)}% confidence. 
              Please review and confirm the extracted information below.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Equipment name is required' })}
                placeholder="Enter equipment name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={selectedStatus} onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                {...register('manufacturer')}
                placeholder="Enter manufacturer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_number">Model Number</Label>
              <Input
                id="model_number"
                {...register('model_number')}
                placeholder="Enter model number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                {...register('serial_number')}
                placeholder="Enter serial number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="part_number">Part Number</Label>
              <Input
                id="part_number"
                {...register('part_number')}
                placeholder="Enter part number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Enter location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                {...register('purchase_price')}
                placeholder="Enter purchase price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installation_date">Installation Date</Label>
              <Input
                id="installation_date"
                type="date"
                {...register('installation_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
              <Input
                id="warranty_expiry"
                type="date"
                {...register('warranty_expiry')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter equipment description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
            <Textarea
              id="maintenance_notes"
              {...register('maintenance_notes')}
              placeholder="Enter maintenance notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : equipment ? 'Update Equipment' : smartScanData ? 'Confirm & Add Equipment' : 'Add Equipment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentForm;