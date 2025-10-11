import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Package,
  Plus,
  X,
  Camera,
  QrCode,
  Calendar as CalendarIcon,
  Tag,
  DollarSign,
  MapPin,
  AlertCircle,
  Save,
  Upload,
  Scan,
  Zap
} from "lucide-react";
import { InventoryItemType } from "@/types/inventory";
import { BarcodeScanner } from "./BarcodeScanner";

interface InventoryItemFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItemType) => void;
  editingItem?: InventoryItemType | null;
  categories: string[];
  locations: string[];
  onCreateFolder?: (folderName: string) => void;
  scanData?: any;
}

export const InventoryItemForm = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  categories,
  locations,
  onCreateFolder,
  scanData
}: InventoryItemFormProps) => {
  const [formData, setFormData] = useState<Partial<InventoryItemType>>({
    name: "",
    description: "",
    folder: "",
    subfolder: "",
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    location: "",
    sublocation: "",
    status: "in-stock",
    priority: "medium",
    purchasePrice: 0,
    sku: "",
    barcode: "",
    serialNumber: "",
    supplier: "",
    supplierContact: "",
    condition: "new",
    tags: [],
    notes: "",
    customFields: {}
  });

  const [newTag, setNewTag] = useState("");
  const [customFieldKey, setCustomFieldKey] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showSmartScan, setShowSmartScan] = useState(false);

  // Initialize form with editing item
  React.useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
      setPhotos(editingItem.photos || []);
    } else {
      setFormData({
        name: "",
        description: "",
        folder: "",
        quantity: 0,
        minStock: 0,
        location: "",
        status: "in-stock",
        priority: "medium",
        condition: "new",
        tags: [],
        customFields: {}
      });
      setPhotos([]);
    }
  }, [editingItem]);

  const updateField = (field: keyof InventoryItemType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      updateField('tags', [...(formData.tags || []), newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateField('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const addCustomField = () => {
    if (customFieldKey.trim() && customFieldValue.trim()) {
      updateField('customFields', {
        ...formData.customFields,
        [customFieldKey]: customFieldValue
      });
      setCustomFieldKey("");
      setCustomFieldValue("");
    }
  };

  const removeCustomField = (key: string) => {
    const newCustomFields = { ...formData.customFields };
    delete newCustomFields[key];
    updateField('customFields', newCustomFields);
  };

  const generateSKU = () => {
    const prefix = formData.folder?.substring(0, 2).toUpperCase() || "IT";
    const timestamp = Date.now().toString().slice(-6);
    updateField('sku', `${prefix}-${timestamp}`);
  };

  const handleCreateNewFolder = () => {
    if (newFolderName.trim()) {
      if (onCreateFolder) {
        onCreateFolder(newFolderName.trim());
      }
      updateField('folder', newFolderName.trim());
      setShowNewFolderDialog(false);
      setNewFolderName("");
      toast({
        title: "Folder Created",
        description: `Created folder "${newFolderName.trim()}" and selected it for this item.`
      });
    }
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Item name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.folder?.trim()) {
      toast({
        title: "Validation Error", 
        description: "Folder is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.location?.trim()) {
      toast({
        title: "Validation Error",
        description: "Location is required", 
        variant: "destructive"
      });
      return;
    }

    const itemData = {
      ...formData,
      id: editingItem?.id || crypto.randomUUID(),
      photos,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as InventoryItemType;

    onSave(itemData);
    onClose();
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setPhotos(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSmartScanDetected = (productInfo: any, barcode: string, quantity?: number) => {
    // Auto-fill form with detected product information
    setFormData(prev => ({
      ...prev,
      name: productInfo.name || prev.name,
      description: productInfo.description || prev.description,
      folder: productInfo.category || prev.folder,
      quantity: quantity || prev.quantity || 1,
      barcode: barcode || prev.barcode,
      weight: productInfo.weight || prev.weight,
      dimensions: productInfo.dimensions || prev.dimensions,
      supplier: productInfo.manufacturer || prev.supplier,
      modelNumber: productInfo.model || prev.modelNumber,
      ...(productInfo.specifications && {
        customFields: {
          ...prev.customFields,
          ...productInfo.specifications
        }
      })
    }));

    toast({
      title: "Smart Scan Complete!",
      description: `Detected ${productInfo.name}. Review and add any missing details.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}</span>
            {!editingItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSmartScan(true)}
                className="bg-gradient-primary text-white border-none hover:bg-gradient-primary/90"
              >
                <Zap className="h-4 w-4 mr-2" />
                Smart Scan
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {editingItem ? "Update item details" : "Create a new inventory item with all necessary information. Use Smart Scan to auto-detect product details from labels, barcodes, or any text."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Basic Information
              </h3>

              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Detailed description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                 <div>
                   <Label htmlFor="folder">Folder *</Label>
                   <Select
                     value={formData.folder || ""}
                     onValueChange={(value) => {
                       if (value === "new") {
                         setShowNewFolderDialog(true);
                       } else {
                         updateField('folder', value);
                       }
                     }}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Select folder" />
                     </SelectTrigger>
                     <SelectContent>
                       {categories.map(cat => (
                         <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                       ))}
                       <SelectItem value="new">+ Add New Folder</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                <div>
                  <Label htmlFor="subfolder">Subfolder</Label>
                  <Input
                    id="subfolder"
                    value={formData.subfolder || ""}
                    onChange={(e) => updateField('subfolder', e.target.value)}
                    placeholder="Subfolder"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={formData.condition || "new"}
                    onValueChange={(value) => updateField('condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="needs-repair">Needs Repair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority || "medium"}
                    onValueChange={(value) => updateField('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Identification */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location & Identification
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={formData.location || ""}
                    onValueChange={(value) => updateField('location', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                      <SelectItem value="new">+ Add New Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sublocation">Sublocation</Label>
                  <Input
                    id="sublocation"
                    value={formData.sublocation || ""}
                    onChange={(e) => updateField('sublocation', e.target.value)}
                    placeholder="Specific location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="sku"
                      value={formData.sku || ""}
                      onChange={(e) => updateField('sku', e.target.value)}
                      placeholder="Item SKU"
                    />
                    <Button variant="outline" size="sm" onClick={generateSKU}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="barcode">Barcode</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="barcode"
                      value={formData.barcode || ""}
                      onChange={(e) => updateField('barcode', e.target.value)}
                      placeholder="Barcode"
                    />
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber || ""}
                  onChange={(e) => updateField('serialNumber', e.target.value)}
                  placeholder="Serial number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quantity & Stock */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Quantity & Stock
              </h3>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="quantity">Current Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity || 0}
                    onChange={(e) => updateField('quantity', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="minStock">Min Stock</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={formData.minStock || 0}
                    onChange={(e) => updateField('minStock', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="maxStock">Max Stock</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={formData.maxStock || 0}
                    onChange={(e) => updateField('maxStock', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "in-stock"}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Financial Information
              </h3>

              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice || 0}
                  onChange={(e) => updateField('purchasePrice', parseFloat(e.target.value) || 0)}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier || ""}
                  onChange={(e) => updateField('supplier', e.target.value)}
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <Label htmlFor="supplierContact">Supplier Contact</Label>
                <Input
                  id="supplierContact"
                  value={formData.supplierContact || ""}
                  onChange={(e) => updateField('supplierContact', e.target.value)}
                  placeholder="Email or phone"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="col-span-1 md:col-span-2">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Photos
              </h3>

              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload photos or drag and drop
                    </p>
                  </div>
                </Label>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Item photo ${index + 1}`}
                        className="w-full h-32 object-contain rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </h3>

              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Fields */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Custom Fields</h3>

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={customFieldKey}
                    onChange={(e) => setCustomFieldKey(e.target.value)}
                    placeholder="Field name"
                  />
                  <Input
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    placeholder="Field value"
                  />
                  <Button onClick={addCustomField} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {Object.entries(formData.customFields || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">
                      <strong>{key}:</strong> {String(value)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomField(key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="col-span-1 md:col-span-2">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Notes</h3>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Additional notes and comments"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {editingItem ? "Update Item" : "Create Item"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* New Folder Creation Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder. It will be created and automatically selected for this item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-folder-name">Folder Name</Label>
              <Input
                id="new-folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNewFolder();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewFolderDialog(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNewFolder}
              disabled={!newFolderName.trim()}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Smart Scanner */}
      <BarcodeScanner
        isOpen={showSmartScan}
        onClose={() => setShowSmartScan(false)}
        onProductDetected={handleSmartScanDetected}
      />
    </Dialog>
  );
};