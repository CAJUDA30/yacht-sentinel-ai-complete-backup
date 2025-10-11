import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap, Package } from 'lucide-react';
import UniversalSmartScan from '@/components/UniversalSmartScan';
import { InventoryItemForm } from './InventoryItemForm';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SmartInventoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folderId?: string;
}

const SmartInventoryForm: React.FC<SmartInventoryFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  folderId
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scanData, setScanData] = useState<any>(null);
  const { toast } = useToast();

  const upsertScannedInventory = async (result: any) => {
    const extracted = result?.extractedData || {};
    const qty = Number(extracted.quantity) || 1;
    const identifiers: { barcode?: string; sku?: string; serial?: string } = {
      barcode: extracted.barcode || undefined,
      sku: extracted.sku || undefined,
      serial: extracted.serialNumber || extracted.serial_number || undefined,
    };

    // Try to find an existing item by barcode/SKU/serial
    let existing: any | null = null;
    try {
      const orParts: string[] = [];
      if (identifiers.barcode) orParts.push(`barcode.eq.${identifiers.barcode}`);
      if (identifiers.sku) orParts.push(`sku.eq.${identifiers.sku}`);
      if (identifiers.serial) orParts.push(`serial_number.eq.${identifiers.serial}`);

      if (orParts.length) {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('id, name, quantity')
          .or(orParts.join(','))
          .limit(1);
        if (error) throw error;
        existing = data?.[0] || null;
      }
    } catch (e) {
      console.warn('Lookup failed, will insert new item:', e);
    }

    if (existing?.id) {
      // Update existing record (increment quantity, update core fields)
      const { data: updated, error } = await supabase
        .from('inventory_items')
        .update({
          name: extracted.productName || extracted.name || existing.name || 'Item',
          description: extracted.description || null,
          sku: extracted.sku || null,
          barcode: extracted.barcode || null,
          serial_number: identifiers.serial || null,
          purchase_price: extracted.price || null,
          location: extracted.location || 'General',
          condition: extracted.condition || 'new',
          quantity: (existing.quantity || 0) + qty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('scan_events').insert({
        session_id: result.sessionId,
        event_type: 'inventory_update',
        module: 'inventory',
        scan_type: result.scanType || 'product',
        confidence: result.confidence,
        extracted_data: result.extractedData,
        ai_analysis: result.aiAnalysis,
        suggestions: result.suggestions,
        actions: result.actions,
      });

      toast({
        title: 'Inventory Updated',
        description: `Updated ${updated?.name || 'item'} (+${qty}). ID: ${updated?.id}`,
      });

      return updated?.id as string;
    } else {
      // Insert new record
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const dbItem: any = {
        id,
        name: extracted.productName || extracted.name || 'New Item',
        description: extracted.description || '',
        folder: 'Smart Scan',
        subfolder: null,
        quantity: qty,
        min_stock: 0,
        location: extracted.location || 'General',
        sublocation: null,
        status: 'in-stock',
        priority: 'medium',
        purchase_price: extracted.price || null,
        sku: extracted.sku || null,
        barcode: identifiers.barcode || null,
        serial_number: identifiers.serial || null,
        condition: extracted.condition || 'new',
        created_at: now,
        updated_at: now,
        folder_id: folderId || null,
      };

      const { data: inserted, error } = await supabase
        .from('inventory_items')
        .insert(dbItem)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('scan_events').insert({
        session_id: result.sessionId,
        event_type: 'inventory_insert',
        module: 'inventory',
        scan_type: result.scanType || 'product',
        confidence: result.confidence,
        extracted_data: result.extractedData,
        ai_analysis: result.aiAnalysis,
        suggestions: result.suggestions,
        actions: result.actions,
      });

      toast({
        title: 'Item Added',
        description: `Saved ${inserted?.name || 'item'} (Qty ${qty}). ID: ${inserted?.id}`,
      });

      return inserted?.id as string;
    }
  };

  const handleScanComplete = async (result: any) => {
    try {
      setShowScanner(false);
      
      // Enhanced logic: always show confirmation for better UX
      if (result.confidence >= 0.7) {
        // Show confirmation dialog for medium to high confidence
        setScanData(result);
        setShowForm(true);
        
        toast({
          title: "Product Recognized!",
          description: `${result.extractedData?.productName || 'Product'} detected with ${Math.round(result.confidence * 100)}% confidence. Please review and confirm.`,
        });
      } else {
        // Low confidence - fall back to manual entry with pre-filled data
        setScanData(result);
        setShowForm(true);
        
        toast({
          title: "Partial Recognition",
          description: "AI detected some information. Please review and complete the details.",
          variant: "default",
        });
      }
    } catch (e: any) {
      console.error('Scan processing failed:', e);
      setScanData(result);
      setShowScanner(false);
      setShowForm(true);
      
      toast({
        title: "Processing Error",
        description: "Unable to process scan automatically. Please enter details manually.",
        variant: "destructive",
      });
    }
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
        module="inventory"
        context="Inventory item scanning for automatic categorization and stock management"
        scanType="product"
      />
    );
  }

  if (showForm) {
    const handleSave = async (item: any) => {
      try {
        // Enhanced save with scan data integration
        const savedId = await upsertScannedInventory({
          ...scanData,
          extractedData: {
            ...scanData?.extractedData,
            ...item,
            userConfirmed: true,
            confirmationTimestamp: new Date().toISOString()
          }
        });
        
        toast({
          title: "Item Added Successfully",
          description: `${item.name} has been added to inventory with ID: ${savedId}`,
        });
        
        handleFormSuccess();
      } catch (error) {
        console.error('Save failed:', error);
        toast({
          title: "Save Failed",
          description: "Unable to save item. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Enhanced pre-population with scan data
    const prefilledItem = scanData ? {
      id: Date.now().toString(),
      name: scanData.extractedData?.productName || '',
      description: scanData.extractedData?.description || '',
      folder: scanData.extractedData?.category || folderId || 'Smart Scan',
      subfolder: '',
      quantity: scanData.extractedData?.quantity || 1,
      minStock: 0,
      maxStock: 0,
      location: scanData.extractedData?.location || '',
      sublocation: '',
      status: 'in-stock' as const,
      priority: 'medium' as const,
      purchasePrice: scanData.extractedData?.price || 0,
      sku: scanData.extractedData?.sku || '',
      barcode: scanData.extractedData?.barcode || '',
      serialNumber: scanData.extractedData?.serialNumber || '',
      supplier: scanData.extractedData?.manufacturer || '',
      supplierContact: '',
      condition: scanData.extractedData?.condition || 'new',
      tags: scanData.extractedData?.category ? [scanData.extractedData.category] : [],
      notes: scanData.extractedData?.ownerManualUrl ? `Owner manual: ${scanData.extractedData.ownerManualUrl}` : '',
      customFields: {
        ...(scanData.extractedData?.specifications || {}),
        ...(scanData.extractedData?.weight && { weight: scanData.extractedData.weight }),
        ...(scanData.extractedData?.dimensions && { dimensions: JSON.stringify(scanData.extractedData.dimensions) }),
        ...(scanData.extractedData?.warrantyInfo && { warranty: scanData.extractedData.warrantyInfo }),
        scanConfidence: Math.round(scanData.confidence * 100),
        scanTimestamp: scanData.timestamp
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    } : null;

    return (
      <InventoryItemForm
        isOpen={showForm}
        onClose={handleFormClose}
        onSave={handleSave}
        editingItem={prefilledItem}
        categories={[]}
        locations={[]}
        scanData={scanData} // Pass scan data for additional context
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button
            onClick={() => setShowScanner(true)}
            className="w-full bg-gradient-primary text-primary-foreground h-16"
            size="lg"
          >
            <Zap className="h-6 w-6 mr-3" />
            <div className="text-left">
              <div className="font-medium">Smart Scan Item</div>
              <div className="text-sm opacity-90">AI-powered product recognition</div>
            </div>
          </Button>
          
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full h-12"
          >
            <Package className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartInventoryForm;