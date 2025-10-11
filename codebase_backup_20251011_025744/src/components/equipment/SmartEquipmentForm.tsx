import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, Camera } from 'lucide-react';
import UniversalSmartScan from '@/components/UniversalSmartScan';
import EquipmentForm from './EquipmentForm';

interface SmartEquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SmartEquipmentForm: React.FC<SmartEquipmentFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scanData, setScanData] = useState<any>(null);

  const handleScanComplete = (result: any) => {
    setScanData(result);
    setShowScanner(false);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setScanData(null);
    onSuccess();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setScanData(null);
    onClose();
  };

  if (showScanner) {
    return (
      <UniversalSmartScan
        isOpen={showScanner}
        onClose={() => {
          setShowScanner(false);
          onClose();
        }}
        onScanComplete={handleScanComplete}
        module="equipment"
        context="Equipment scanning for maintenance tracking and inventory management"
        scanType="product"
      />
    );
  }

  if (showForm) {
    return (
      <EquipmentForm
        isOpen={showForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        smartScanData={scanData}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button
            onClick={() => setShowScanner(true)}
            className="w-full bg-gradient-primary text-primary-foreground h-16"
            size="lg"
          >
            <Zap className="h-6 w-6 mr-3" />
            <div className="text-left">
              <div className="font-medium">Smart Scan Equipment</div>
              <div className="text-sm opacity-90">AI-powered instant data extraction</div>
            </div>
          </Button>
          
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full h-12"
          >
            <Camera className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartEquipmentForm;