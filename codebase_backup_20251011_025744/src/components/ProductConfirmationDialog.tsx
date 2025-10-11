import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Save, 
  ExternalLink, 
  Package, 
  Zap,
  BookOpen,
  Shield,
  Wrench
} from 'lucide-react';

interface ProductConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedData: any) => void;
  scanResult: any;
  confidence: number;
}

export const ProductConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  scanResult, 
  confidence 
}: ProductConfirmationDialogProps) => {
  const [editedData, setEditedData] = useState(scanResult?.extractedData || {});
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());

  const toggleFieldEdit = (field: string) => {
    const newEditing = new Set(editingFields);
    if (newEditing.has(field)) {
      newEditing.delete(field);
    } else {
      newEditing.add(field);
    }
    setEditingFields(newEditing);
  };

  const updateField = (field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-600 bg-green-50';
    if (conf >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.9) return 'High Confidence';
    if (conf >= 0.7) return 'Medium Confidence';
    return 'Low Confidence - Please Review';
  };

  const renderEditableField = (label: string, field: string, value: any, type: 'text' | 'number' | 'textarea' = 'text') => {
    const isEditing = editingFields.has(field);
    const fieldValue = editedData[field] || value || '';

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFieldEdit(field)}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>
        {isEditing ? (
          type === 'textarea' ? (
            <Textarea
              value={fieldValue}
              onChange={(e) => updateField(field, e.target.value)}
              rows={3}
            />
          ) : (
            <Input
              type={type}
              value={fieldValue}
              onChange={(e) => updateField(field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            />
          )
        ) : (
          <div className="p-2 bg-muted rounded border">
            {fieldValue || 'Not detected'}
          </div>
        )}
      </div>
    );
  };

  const handleConfirm = () => {
    onConfirm({
      ...scanResult,
      extractedData: editedData,
      userConfirmed: true,
      confirmationTimestamp: new Date().toISOString()
    });
  };

  if (!scanResult) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Confirm Product Information
            <Badge className={getConfidenceColor(confidence)}>
              {Math.round(confidence * 100)}% {getConfidenceLabel(confidence)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Confidence Indicator */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">AI Recognition Confidence</span>
                <span className="text-sm text-muted-foreground">{Math.round(confidence * 100)}%</span>
              </div>
              <Progress value={confidence * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {confidence >= 0.9 
                  ? "High confidence - Auto-fill is likely accurate" 
                  : confidence >= 0.7 
                  ? "Medium confidence - Please review key fields"
                  : "Low confidence - Manual review recommended"
                }
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="manual">Manual & Docs</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderEditableField('Product Name', 'productName', editedData.productName)}
                  {renderEditableField('Description', 'description', editedData.description, 'textarea')}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField('Manufacturer', 'manufacturer', editedData.manufacturer)}
                    {renderEditableField('Model', 'model', editedData.model)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {renderEditableField('SKU', 'sku', editedData.sku)}
                    {renderEditableField('Barcode', 'barcode', editedData.barcode)}
                    {renderEditableField('Price', 'price', editedData.price, 'number')}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField('Category', 'category', editedData.category)}
                    {renderEditableField('Condition', 'condition', editedData.condition)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {renderEditableField('Weight', 'weight', editedData.weight, 'number')}
                    {renderEditableField('Serial Number', 'serialNumber', editedData.serialNumber)}
                  </div>
                  
                  {editedData.dimensions && (
                    <div>
                      <Label>Dimensions</Label>
                      <div className="p-2 bg-muted rounded border">
                        {editedData.dimensions.length} × {editedData.dimensions.width} × {editedData.dimensions.height} {editedData.dimensions.unit}
                      </div>
                    </div>
                  )}
                  
                  {editedData.specifications && Object.keys(editedData.specifications).length > 0 && (
                    <div>
                      <Label>Additional Specifications</Label>
                      <ScrollArea className="h-32 p-2 bg-muted rounded border">
                        {Object.entries(editedData.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-1">
                            <span className="font-medium">{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Documentation & Manual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editedData.ownerManualUrl ? (
                    <div className="space-y-2">
                      <Label>Owner's Manual Found</Label>
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-green-800">
                              {editedData.ownerManualTitle || 'Owner\'s Manual'}
                            </p>
                            <p className="text-sm text-green-600">AI found the official manual for this product</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={editedData.ownerManualUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm text-muted-foreground">No owner's manual found automatically</p>
                    </div>
                  )}
                  
                  {editedData.warrantyInfo && (
                    <div>
                      <Label>Warranty Information</Label>
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">{editedData.warrantyInfo}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Advanced Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editedData.compatibleParts && editedData.compatibleParts.length > 0 && (
                    <div>
                      <Label>Compatible Parts</Label>
                      <ScrollArea className="h-24 p-2 bg-muted rounded border">
                        {editedData.compatibleParts.map((part, index) => (
                          <div key={index} className="py-1 text-sm">
                            {part}
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                  
                  {editedData.maintenanceSchedule && (
                    <div>
                      <Label>Maintenance Schedule</Label>
                      <div className="p-2 bg-muted rounded border">
                        <p className="text-sm">{editedData.maintenanceSchedule}</p>
                      </div>
                    </div>
                  )}
                  
                  {editedData.safetyInfo && (
                    <div>
                      <Label>Safety Information</Label>
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                        <p className="text-sm text-amber-800">{editedData.safetyInfo}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center gap-2">
            <Switch 
              id="auto-confirm" 
              checked={confidence >= 0.9}
              disabled={confidence < 0.9}
            />
            <Label htmlFor="auto-confirm" className="text-sm">
              Auto-confirm future high-confidence scans
            </Label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              Confirm & Add to Inventory
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};