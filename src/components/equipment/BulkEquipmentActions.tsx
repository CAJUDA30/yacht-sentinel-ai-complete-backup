import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload, FileText } from 'lucide-react';
import { Equipment } from '@/hooks/useEnterpriseEquipment';

interface BulkEquipmentActionsProps {
  equipment: Equipment[];
  onImportComplete: () => void;
}

const BulkEquipmentActions: React.FC<BulkEquipmentActionsProps> = ({
  equipment,
  onImportComplete
}) => {
  const { toast } = useToast();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportEquipment = () => {
    try {
      const csvContent = [
        // CSV Header
        'Name,Manufacturer,Model Number,Serial Number,Part Number,Status,Location,Description,Purchase Price,Installation Date,Warranty Expiry,Maintenance Notes',
        // CSV Data
        ...equipment.map(eq => [
          eq.name,
          eq.manufacturer || '',
          eq.model_number || '',
          eq.serial_number || '',
          eq.part_number || '',
          eq.status,
          eq.location || '',
          eq.description || '',
          eq.purchase_price || '',
          eq.installation_date || '',
          eq.warranty_expiry || '',
          eq.maintenance_notes || ''
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `equipment-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${equipment.length} equipment records to CSV`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export equipment data",
        variant: "destructive",
      });
    }
  };

  const handleImportEquipment = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const equipmentData: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const equipment: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          switch (header.toLowerCase()) {
            case 'name':
              equipment.name = value;
              break;
            case 'manufacturer':
              equipment.manufacturer = value || null;
              break;
            case 'model number':
              equipment.model_number = value || null;
              break;
            case 'serial number':
              equipment.serial_number = value || null;
              break;
            case 'part number':
              equipment.part_number = value || null;
              break;
            case 'status':
              equipment.status = ['operational', 'maintenance', 'repair', 'decommissioned'].includes(value.toLowerCase()) 
                ? value.toLowerCase() : 'operational';
              break;
            case 'location':
              equipment.location = value || null;
              break;
            case 'description':
              equipment.description = value || null;
              break;
            case 'purchase price':
              equipment.purchase_price = value && !isNaN(Number(value)) ? Number(value) : null;
              break;
            case 'installation date':
              equipment.installation_date = value || null;
              break;
            case 'warranty expiry':
              equipment.warranty_expiry = value || null;
              break;
            case 'maintenance notes':
              equipment.maintenance_notes = value || null;
              break;
          }
        });
        
        if (equipment.name) {
          equipment.technical_specs = {};
          equipmentData.push(equipment);
        }
      }

      if (equipmentData.length === 0) {
        throw new Error('No valid equipment data found in file');
      }

      const { error } = await supabase
        .from('equipment')
        .insert(equipmentData);

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `Successfully imported ${equipmentData.length} equipment records`,
      });

      setShowImportDialog(false);
      setImportFile(null);
      onImportComplete();

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import equipment data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const generateTemplate = () => {
    const templateContent = [
      'Name,Manufacturer,Model Number,Serial Number,Part Number,Status,Location,Description,Purchase Price,Installation Date,Warranty Expiry,Maintenance Notes',
      'Example Engine,Caterpillar,C12,ABC123456,CAT-456,operational,Engine Room,Main propulsion engine,50000,2023-01-15,2025-01-15,Regular maintenance required'
    ].join('\n');

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'equipment-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Import template downloaded successfully",
    });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExportEquipment}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
      
      <Button
        variant="outline"
        onClick={() => setShowImportDialog(true)}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Equipment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with equipment data
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateTemplate}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="importFile">CSV File</Label>
              <Input
                id="importFile"
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Headers: Name, Manufacturer, Model Number, Serial Number, Part Number, Status, Location, Description, Purchase Price, Installation Date, Warranty Expiry, Maintenance Notes</li>
                <li>Status must be: operational, maintenance, repair, or decommissioned</li>
                <li>Dates in YYYY-MM-DD format</li>
                <li>Name field is required</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowImportDialog(false)}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImportEquipment}
                disabled={!importFile || isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Equipment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkEquipmentActions;