import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Wrench, AlertTriangle, CheckCircle, Clock, ShoppingCart, Zap } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useEnterpriseEquipment, Equipment, MaintenanceSchedule, ProcurementRequest } from '@/hooks/useEnterpriseEquipment';
import UniversalSmartScan from '@/components/UniversalSmartScan';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import BulkEquipmentActions from '@/components/equipment/BulkEquipmentActions';
import SmartEquipmentForm from '@/components/equipment/SmartEquipmentForm';

const EquipmentPage: React.FC = () => {
  const { toast } = useToast();
  
  // Use the enterprise equipment hook
  const {
    equipment,
    maintenanceSchedules,
    spareParts,
    procurementRequests,
    isLoading,
    isProcessing,
    processSmartScanResult,
    updateEquipmentUsage,
    approveProcurementRequest
  } = useEnterpriseEquipment();
  
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showSmartEquipmentForm, setShowSmartEquipmentForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [smartScanData, setSmartScanData] = useState<any>(null);

  // Handle smart scan completion - open form with AI-extracted data
  const handleSmartScanComplete = async (result: any) => {
    try {
      setSmartScanData(result);
      setShowSmartEquipmentForm(false);
      setShowEquipmentForm(true);
    } catch (error) {
      console.error('Smart scan processing failed:', error);
    }
  };

  const getStatusColor = (status: Equipment['status']) => {
    switch (status) {
      case 'operational': return 'default';
      case 'maintenance': return 'secondary';
      case 'repair': return 'destructive';
      case 'decommissioned': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: MaintenanceSchedule['priority'] | ProcurementRequest['urgency']) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getUrgencyColor = (urgency: ProcurementRequest['urgency']) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  // Get maintenance schedules that need attention
  const getMaintenanceNeeds = () => {
    return maintenanceSchedules
      .filter(schedule => {
        const hoursUntilMaintenance = (schedule.next_due_hours || schedule.frequency_value) - schedule.current_hours;
        return hoursUntilMaintenance <= 50; // Within 50 hours of maintenance
      })
      .slice(0, 10)
      .map(schedule => {
        const eq = equipment.find(e => e.id === schedule.equipment_id);
        const hoursUntilMaintenance = (schedule.next_due_hours || schedule.frequency_value) - schedule.current_hours;
        return {
          ...schedule,
          equipmentName: eq?.name || 'Unknown Equipment',
          hoursUntilMaintenance
        };
      });
  };

  // Get pending procurement requests
  const getPendingProcurement = () => {
    return procurementRequests
      .filter(req => req.request_status === 'pending')
      .sort((a, b) => {
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      })
      .slice(0, 10);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground">Enterprise equipment tracking with AI-powered OCR and maintenance planning</p>
        </div>
        <div className="flex gap-3">
          <BulkEquipmentActions 
            equipment={equipment}
            onImportComplete={() => {
              window.location.reload();
            }}
          />
          <Button 
            onClick={() => setShowSmartEquipmentForm(true)}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            {isProcessing ? "Processing..." : "Smart Scan Equipment"}
          </Button>
          <Button 
            onClick={() => setShowEquipmentForm(true)}
            variant="outline"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manual Add
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm font-medium">Processing equipment with AI...</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipment">Equipment List</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          {/* Equipment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((eq) => (
              <Card key={eq.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedEquipment(eq)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{eq.name}</h3>
                      <p className="text-sm text-muted-foreground">{eq.manufacturer} {eq.model_number}</p>
                    </div>
                    <Badge
                      variant={getStatusColor(eq.status)}
                    >
                      {eq.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Manufacturer:</span> {eq.manufacturer || 'Unknown'}</p>
                    <p><span className="font-medium">Model:</span> {eq.model_number || 'Unknown'}</p>
                    <p><span className="font-medium">Serial:</span> {eq.serial_number || 'Unknown'}</p>
                    <p><span className="font-medium">Location:</span> {eq.location || 'Unknown'}</p>
                    <p><span className="font-medium">Next Maintenance:</span> {eq.next_maintenance_date || 'Not scheduled'}</p>
                  </div>
                  <div className="mt-4 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEquipment(eq);
                        setShowEquipmentForm(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {equipment.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No equipment found. Start by using Smart Scan to automatically detect and add equipment.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getMaintenanceNeeds().map((schedule) => (
                  <Card key={schedule.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{schedule.schedule_name}</h4>
                        <p className="text-sm text-muted-foreground">{schedule.equipmentName}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(schedule.priority)}>
                            {schedule.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Every {schedule.frequency_value} {schedule.frequency_type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium text-yellow-600">
                          {schedule.hoursUntilMaintenance > 0 ? 
                            `${schedule.hoursUntilMaintenance}h until due` : 
                            'Maintenance due'
                          }
                        </p>
                        <p className="text-muted-foreground">
                          {schedule.estimated_duration_hours || 0}h estimated
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Current: {schedule.current_hours}h
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                {getMaintenanceNeeds().length === 0 && (
                  <p className="text-muted-foreground text-center">All maintenance schedules are up to date</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Operational Equipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{equipment.filter(eq => eq.status === 'operational').length}</div>
                <p className="text-sm text-muted-foreground">Running normally</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Maintenance Due Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{getMaintenanceNeeds().length}</div>
                <p className="text-sm text-muted-foreground">Within 50 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  Pending Procurement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{procurementRequests.filter(r => r.request_status === 'pending').length}</div>
                <p className="text-sm text-muted-foreground">
                  <a href="/procurement" className="text-primary hover:underline">View in Procurement →</a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{equipment.filter(eq => eq.status === 'repair').length}</div>
                <p className="text-sm text-muted-foreground">Requires repair</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Equipment Detail Modal */}
      {selectedEquipment && (
        <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEquipment.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Manufacturer:</span> {selectedEquipment.manufacturer || 'Unknown'}</p>
                    <p><span className="font-medium">Model:</span> {selectedEquipment.model_number || 'Unknown'}</p>
                    <p><span className="font-medium">Serial Number:</span> {selectedEquipment.serial_number || 'Unknown'}</p>
                    <p><span className="font-medium">Part Number:</span> {selectedEquipment.part_number || 'Unknown'}</p>
                    <p><span className="font-medium">Location:</span> {selectedEquipment.location || 'Unknown'}</p>
                    <p><span className="font-medium">Purchase Price:</span> ${selectedEquipment.purchase_price?.toLocaleString() || 'Unknown'}</p>
                    <p><span className="font-medium">Warranty Expiry:</span> {selectedEquipment.warranty_expiry || 'Unknown'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Technical Specifications</h4>
                  <div className="space-y-2 text-sm">
                    {selectedEquipment.technical_specs && Object.keys(selectedEquipment.technical_specs).length > 0 ? (
                      Object.entries(selectedEquipment.technical_specs).map(([key, value]) => (
                        <p key={key}><span className="font-medium">{key}:</span> {String(value)}</p>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No technical specifications available</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Maintenance Schedules</h4>
                <div className="space-y-3">
                  {maintenanceSchedules
                    .filter(schedule => schedule.equipment_id === selectedEquipment.id)
                    .map((schedule) => (
                    <Card key={schedule.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium">{schedule.schedule_name}</h5>
                        <Badge variant={getPriorityColor(schedule.priority)}>
                          {schedule.priority}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><span className="font-medium">Frequency:</span> Every {schedule.frequency_value} {schedule.frequency_type}</p>
                          <p><span className="font-medium">Current Hours:</span> {schedule.current_hours}</p>
                          <p><span className="font-medium">Next Due:</span> {schedule.next_due_hours || schedule.frequency_value} hours</p>
                          <p><span className="font-medium">Estimated Duration:</span> {schedule.estimated_duration_hours || 0}h</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Requires Shutdown:</span> {schedule.requires_shutdown ? 'Yes' : 'No'}</p>
                          <p><span className="font-medium">Auto Generate Tasks:</span> {schedule.auto_generate_tasks ? 'Yes' : 'No'}</p>
                          <p><span className="font-medium">Active:</span> {schedule.is_active ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                      {schedule.description && (
                        <p className="text-sm text-muted-foreground mt-2">{schedule.description}</p>
                      )}
                    </Card>
                  ))}
                  {maintenanceSchedules.filter(s => s.equipment_id === selectedEquipment.id).length === 0 && (
                    <p className="text-muted-foreground text-center">No maintenance schedules configured</p>
                  )}
                </div>

                <h4 className="font-medium mb-3 mt-6">Spare Parts</h4>
                <div className="space-y-3">
                  {spareParts
                    .filter(part => part.equipment_id === selectedEquipment.id)
                    .map((part) => (
                    <Card key={part.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium">{part.part_name}</h5>
                        {part.is_critical && (
                          <Badge variant="destructive">Critical</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><span className="font-medium">Part Number:</span> {part.part_number || 'N/A'}</p>
                          <p><span className="font-medium">Manufacturer:</span> {part.manufacturer || 'N/A'}</p>
                          <p><span className="font-medium">Quantity Required:</span> {part.quantity_required}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Cost per Unit:</span> ${part.cost_per_unit?.toFixed(2) || 'N/A'}</p>
                          <p><span className="font-medium">Supplier:</span> {part.supplier || 'N/A'}</p>
                          {part.replacement_frequency_hours && (
                            <p><span className="font-medium">Replace Every:</span> {part.replacement_frequency_hours}h</p>
                          )}
                        </div>
                       </div>
                       {part.notes && (
                         <p className="text-sm text-muted-foreground mt-2">{part.notes}</p>
                       )}
                     </Card>
                   ))}
                   {spareParts.filter(p => p.equipment_id === selectedEquipment.id).length === 0 && (
                     <p className="text-muted-foreground text-center">No spare parts configured</p>
                   )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Smart Equipment Form Modal */}
      {showSmartEquipmentForm && (
        <SmartEquipmentForm
          isOpen={showSmartEquipmentForm}
          onClose={() => setShowSmartEquipmentForm(false)}
          onSuccess={() => {
            setShowSmartEquipmentForm(false);
            window.location.reload();
          }}
        />
      )}

      {/* Manual Equipment Form Modal */}
      {showEquipmentForm && (
        <EquipmentForm
          isOpen={showEquipmentForm}
          onClose={() => {
            setShowEquipmentForm(false);
            setEditingEquipment(null);
          }}
          onSuccess={() => {
            setShowEquipmentForm(false);
            setEditingEquipment(null);
            window.location.reload();
          }}
          equipment={editingEquipment}
        />
      )}
    </div>
  );
};

export default EquipmentPage;
