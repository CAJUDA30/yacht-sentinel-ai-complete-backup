import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, Receipt, FileText } from 'lucide-react';
import UniversalSmartScan from '@/components/UniversalSmartScan';

interface SmartFinanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scanType?: 'receipt' | 'document' | 'auto';
}

const SmartFinanceForm: React.FC<SmartFinanceFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  scanType = 'receipt'
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanData, setScanData] = useState<any>(null);

  const handleScanComplete = (result: any) => {
    setScanData(result);
    setShowScanner(false);
    // Auto-create expense entry with scan data
    // This would typically call a financial API or component
    onSuccess();
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
        module="finance"
        context="Financial document scanning for automatic expense tracking and categorization"
        scanType={scanType}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Smart Financial Scan</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button
            onClick={() => setShowScanner(true)}
            className="w-full bg-gradient-primary text-primary-foreground h-16"
            size="lg"
          >
            <Zap className="h-6 w-6 mr-3" />
            <div className="text-left">
              <div className="font-medium">Smart Scan {scanType}</div>
              <div className="text-sm opacity-90">AI expense extraction & categorization</div>
            </div>
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                // Set scan type and start scanner
                setShowScanner(true);
              }}
              variant="outline"
              className="h-12"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Receipt
            </Button>
            <Button
              onClick={() => {
                // Set scan type and start scanner  
                setShowScanner(true);
              }}
              variant="outline"
              className="h-12"
            >
              <FileText className="h-4 w-4 mr-2" />
              Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartFinanceForm;