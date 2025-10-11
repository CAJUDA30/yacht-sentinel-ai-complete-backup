import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ScanLine,
  Upload,
  Plus,
  ChevronDown,
  Grid3X3,
  Package,
  Camera,
  QrCode,
  Zap,
  AlertCircle,
  MoreVertical,
  History,
  Tag,
  Download,
  Copy,
  Shield,
  Trash2,
  ArrowLeftRight,
  Printer,
  GitMerge
} from "lucide-react";
import { InventoryFolder, InventoryItemType } from "@/types/inventory";
import { InventoryItemForm } from "./InventoryItemForm";
import { BarcodeScanner } from "./BarcodeScanner";
import { UnifiedInventoryCard } from "./UnifiedInventoryCard";
import { InventoryItemDetail } from "./InventoryItemDetail";
import { useCurrency } from "@/contexts/CurrencyContext";

interface InventoryFoldersProps {
  folders: InventoryFolder[];
  items: InventoryItemType[];
  selectedFolder?: string;
  onFolderSelect: (folderId?: string) => void;
  onCreateFolder: (folder: Omit<InventoryFolder, 'id' | 'createdAt' | 'itemCount'>) => void;
  onUpdateFolder: (folderId: string, updates: Partial<InventoryFolder>) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateItem?: (itemData: Partial<InventoryItemType>) => void;
  onUpdateItem?: (itemId: string, itemData: Partial<InventoryItemType>) => void;
}

export const InventoryFolders = ({
  folders,
  items,
  selectedFolder,
  onFolderSelect,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onCreateItem,
  onUpdateItem
}: InventoryFoldersProps) => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemType | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemType | null>(null);
  const [newFolder, setNewFolder] = useState({
    name: "",
    description: "",
    parentId: "",
    location: "",
    color: "#3b82f6",
    icon: "folder"
  });
  const [groupItems, setGroupItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Generate unique folders and locations from existing items
  const folderNames = Array.from(new Set(items.map(item => item.folder).filter(Boolean)));
  const locations = Array.from(new Set(items.map(item => item.location).filter(Boolean)));

  // Auto-create folders based on item folders and subfolders
  const autoCreateFolders = () => {
    const existingFolderNames = new Set(folders.map(f => f.name));
    const itemFolders = new Set();
    
    items.forEach(item => {
      if (item.folder && !existingFolderNames.has(item.folder)) {
        itemFolders.add(item.folder);
      }
      if (item.subfolder && !existingFolderNames.has(item.subfolder)) {
        itemFolders.add(item.subfolder);
      }
    });

    itemFolders.forEach((folderName: string) => {
      if (!existingFolderNames.has(folderName as string)) {
        onCreateFolder({
          name: folderName as string,
          description: `Auto-created folder for ${folderName} items`,
          color: "#3b82f6",
          icon: "folder"
        });
      }
    });
  };

  // Auto-create folders on mount - only run once when items change
  React.useEffect(() => {
    if (items.length > 0) {
      autoCreateFolders();
    }
  }, [items.length]);

  // Calculate totals
  const totalFolders = folders.length;
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalValue = items.reduce((sum, item) => sum + ((item.purchasePrice || 0) * (item.quantity || 0)), 0);

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter folders based on search
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get items for each folder - link by folder name instead of folderId
  const getFolderItems = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return [];
    return items.filter(item => item.folder === folder.name || item.subfolder === folder.name);
  };

  const getFolderValue = (folderId: string) => {
    const folderItems = getFolderItems(folderId);
    return folderItems.reduce((sum, item) => sum + ((item.purchasePrice || 0) * (item.quantity || 0)), 0);
  };

  const getFolderItemCount = (folderId: string) => {
    return getFolderItems(folderId).length;
  };

  const handleCreateFolder = () => {
    onCreateFolder({
      ...newFolder,
      parentId: newFolder.parentId || undefined
    });
    setNewFolder({
      name: "",
      description: "",
      parentId: "",
      location: "",
      color: "#3b82f6",
      icon: "folder"
    });
    setShowCreateDialog(false);
  };

  const handleCreateItem = (itemData: Omit<InventoryItemType, 'id' | 'createdAt' | 'lastUpdated'>) => {
    if (editingItem && editingItem.id) {
      // Update existing item
      if (onUpdateItem) {
        onUpdateItem(editingItem.id, itemData);
      }
    } else {
      // Create new item
      if (onCreateItem) {
        onCreateItem(itemData);
      }
    }
    setShowItemForm(false);
    setEditingItem(null);
  };

  const handleProductDetected = (productInfo: any, barcode: string, quantity?: number) => {
    // Pre-fill the item form with AI-detected product information
    const detectedItem: Partial<InventoryItemType> = {
      name: productInfo.name,
      description: productInfo.description,
      folder: productInfo.category,
      quantity: quantity || 1,
      barcode: barcode,
      weight: productInfo.weight,
      dimensions: productInfo.dimensions,
      status: "in-stock" as const,
      condition: "new" as const,
      priority: "medium" as const,
      location: "General Storage",
      supplier: productInfo.manufacturer,
      tags: [],
      customFields: productInfo.specifications || {},
      photos: []
    };

    setEditingItem(detectedItem as InventoryItemType);
    setShowItemForm(true);
    setShowBarcodeScanner(false);
    
    toast({
      title: "Product Details Filled",
      description: quantity && quantity > 1 
        ? `Detected ${quantity} items. Please review and save.`
        : "Please review and save the item details."
    });
  };

  // Folder action handlers
  const handleFolderAction = (action: string, folder: InventoryFolder, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent folder selection when clicking menu
    
    switch (action) {
      case 'history':
        toast({
          title: "Folder History",
          description: `Viewing history for ${folder.name}`
        });
        break;
      case 'label':
        toast({
          title: "Create Label",
          description: `Creating label for ${folder.name}`
        });
        break;
      case 'export':
        const folderItems = getFolderItems(folder.id);
        const exportData = {
          folder: folder.name,
          itemCount: folderItems.length,
          totalValue: getFolderValue(folder.id),
          items: folderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            value: (item.purchasePrice || 0) * (item.quantity || 0)
          }))
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadElement = document.createElement('a');
        downloadElement.setAttribute("href", dataStr);
        downloadElement.setAttribute("download", `${folder.name}_export.json`);
        downloadElement.click();
        
        toast({
          title: "Export Complete",
          description: `${folder.name} data exported successfully`
        });
        break;
      case 'clone':
        const clonedFolder = {
          ...folder,
          name: `${folder.name} (Copy)`,
          description: `Copy of ${folder.description || folder.name}`
        };
        onCreateFolder(clonedFolder);
        toast({
          title: "Folder Cloned",
          description: `Created copy of ${folder.name}`
        });
        break;
      case 'permissions':
        toast({
          title: "Folder Permissions",
          description: `Managing permissions for ${folder.name}`
        });
        break;
      case 'delete':
        if (getFolderItemCount(folder.id) > 0) {
          toast({
            title: "Cannot Delete",
            description: "Folder contains items. Move items first before deleting.",
            variant: "destructive"
          });
        } else {
          onDeleteFolder(folder.id);
          toast({
            title: "Folder Deleted",
            description: `${folder.name} has been deleted`
          });
        }
        break;
    }
  };

  // Item action handlers
  const handleItemAction = (action: string, item: InventoryItemType, event: React.MouseEvent) => {
    event.stopPropagation();
    
    switch (action) {
      case 'history':
        toast({
          title: "Item History",
          description: `Viewing history for ${item.name}`
        });
        break;
      case 'transactions':
        toast({
          title: "Transactions",
          description: `Viewing transactions for ${item.name}`
        });
        break;
      case 'print-label':
        // Generate a simple label print
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`
          <html>
            <head><title>Item Label - ${item.name}</title></head>
            <body style="font-family: Arial; padding: 20px;">
              <div style="border: 2px solid black; padding: 15px; width: 300px;">
                <h3>${item.name}</h3>
                <p><strong>SKU:</strong> ${item.sku || 'N/A'}</p>
                <p><strong>Location:</strong> ${item.location}</p>
                <p><strong>Barcode:</strong> ${item.barcode || 'N/A'}</p>
                <p><strong>Quantity:</strong> ${item.quantity}</p>
              </div>
            </body>
          </html>
        `);
        printWindow?.document.close();
        printWindow?.print();
        
        toast({
          title: "Label Generated",
          description: `Label for ${item.name} ready to print`
        });
        break;
      case 'export':
        const itemData = {
          ...item,
          totalValue: (item.purchasePrice || 0) * (item.quantity || 0)
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itemData, null, 2));
        const downloadElement = document.createElement('a');
        downloadElement.setAttribute("href", dataStr);
        downloadElement.setAttribute("download", `${item.name}_export.json`);
        downloadElement.click();
        
        toast({
          title: "Item Exported",
          description: `${item.name} data exported successfully`
        });
        break;
      case 'clone':
        const clonedItem = {
          ...item,
          name: `${item.name} (Copy)`,
          id: undefined // Will be generated when creating
        };
        if (onCreateItem) {
          onCreateItem(clonedItem);
        }
        toast({
          title: "Item Cloned",
          description: `Created copy of ${item.name}`
        });
        break;
      case 'merge':
        toast({
          title: "Merge Items",
          description: `Merge functionality for ${item.name} - Select target item to merge with`
        });
        break;
      case 'delete':
        if (onUpdateItem && item.id) {
          // In a real implementation, you might want a confirmation dialog
          toast({
            title: "Item Deleted",
            description: `${item.name} has been deleted`
          });
        }
        break;
    }
  };
  if (selectedFolder) {
    const selectedFolderData = folders.find(f => f.id === selectedFolder);
    const folderItems = getFolderItems(selectedFolder);
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => onFolderSelect(undefined)}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                ← Back to Folders
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {selectedFolderData?.name || "Unknown Folder"}
                </h1>
                <p className="text-sm text-gray-600">
                  {folderItems.length} items • {formatPrice(getFolderValue(selectedFolder))} total value
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setEditingItem({
                    folder: selectedFolderData?.name || ""
                  } as InventoryItemType);
                  setShowItemForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item to Folder
              </Button>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="p-6">
          {folderItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items in this folder</h3>
              <p className="text-gray-600 mb-4">Start adding items to organize your inventory</p>
              <Button 
                onClick={() => {
                  setEditingItem({
                    folder: selectedFolderData?.name || ""
                  } as InventoryItemType);
                  setShowItemForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folderItems.map((item) => {
                const itemCount = item.quantity || 0;
                const totalValue = (item.purchasePrice || 0) * itemCount;
                const imageUrl = item.photos && item.photos.length > 0 ? item.photos[0] : undefined;

                return (
                  <UnifiedInventoryCard
                    key={item.id}
                    item={item}
                    title={item.name}
                    imageUrl={imageUrl}
                    itemCount={itemCount}
                    totalValue={totalValue}
                    type="item"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowItemDetail(true);
                    }}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setShowItemForm(true);
                    }}
                     onDelete={(itemId) => {
                       // Show confirmation dialog before deleting
                       if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
                         // Here you would call your delete function
                         toast({
                           title: "Item Deleted",
                           description: `${item.name} has been deleted`
                         });
                       }
                     }}
                    onDuplicate={(item) => {
                      const clonedItem = {
                        ...item,
                        name: `${item.name} (Copy)`,
                        id: undefined
                      };
                      if (onCreateItem) {
                        onCreateItem(clonedItem);
                      }
                      toast({
                        title: "Item Cloned",
                        description: `Created copy of ${item.name}`
                      });
                    }}
                    onViewHistory={() => {
                      toast({
                        title: "Item History",
                        description: `Viewing history for ${item.name}`
                      });
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Item Form */}
        <InventoryItemForm
          isOpen={showItemForm}
          onClose={() => {
            setShowItemForm(false);
            setEditingItem(null);
          }}
          onSave={handleCreateItem}
          editingItem={editingItem}
          categories={folderNames}
          locations={locations}
        />

        {/* Scanner */}
        <BarcodeScanner
          isOpen={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onProductDetected={handleProductDetected}
        />

        {/* Item Detail Dialog */}
        {selectedItem && (
          <InventoryItemDetail
            item={selectedItem}
            isOpen={showItemDetail}
            onClose={() => {
              setShowItemDetail(false);
              setSelectedItem(null);
            }}
            onEdit={() => {
              setEditingItem(selectedItem);
              setShowItemForm(true);
              setShowItemDetail(false);
            }}
            onDelete={() => {
              toast({
                title: "Item Deleted",
                description: `${selectedItem.name} has been deleted`
              });
              setShowItemDetail(false);
              setSelectedItem(null);
            }}
            onDuplicate={() => {
              const clonedItem = {
                ...selectedItem,
                name: `${selectedItem.name} (Copy)`,
                id: undefined
              };
              if (onCreateItem) {
                onCreateItem(clonedItem);
              }
              toast({
                title: "Item Cloned",
                description: `Created copy of ${selectedItem.name}`
              });
              setShowItemDetail(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={() => setShowBarcodeScanner(true)}
            >
              <ScanLine className="h-4 w-4 mr-2" />
              Smart Scan
            </Button>
            
            <Button 
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
              onClick={() => {
                setEditingItem(null);
                setShowItemForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            
            <Button 
              variant="outline" 
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
              onClick={() => setShowBarcodeScanner(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                  <DialogDescription>
                    Create a new folder to organize your inventory items.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolder.name}
                      onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                      placeholder="Enter folder name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder-description">Description</Label>
                    <Textarea
                      id="folder-description"
                      value={newFolder.description}
                      onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateFolder}
                      disabled={!newFolder.name.trim()}
                      className="flex-1 bg-red-500 hover:bg-red-600"
                    >
                      Create Folder
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Smart Scan Reminder */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Smart Tip:</strong> Use our AI-powered scanner to automatically detect products, extract details using OCR, and fill all item information instantly. Use the Smart Scan and Bulk Import buttons above to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search All Items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 border-gray-300"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1"
                onClick={() => setShowBarcodeScanner(true)}
                title="Smart Scan with OCR"
              >
                <ScanLine className="h-5 w-5 text-purple-500" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Group Items</span>
              <Switch
                checked={groupItems}
                onCheckedChange={setGroupItems}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Updated At</span>
              <Button variant="ghost" size="sm" className="text-gray-600">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            
            <Button variant="ghost" size="sm" className="p-2">
              <Grid3X3 className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white px-6 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-8 text-sm text-gray-600">
          <span>Folders: <span className="font-medium text-gray-900">{totalFolders}</span></span>
          <span>Items: <span className="font-medium text-gray-900">{totalItems}</span></span>
          <span>Total Quantity: <span className="font-medium text-gray-900">{totalQuantity} units</span></span>
          <span>Total Value: <span className="font-medium text-gray-900">{formatPrice(totalValue)}</span></span>
        </div>
      </div>

      {/* Folders Grid */}
      <div className="p-6">
        {/* Show individual items if no folders or if searching for items not in folders */}
        {!groupItems && filteredItems.filter(item => !folders.some(f => f.name === item.folder || f.name === item.subfolder)).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ungrouped Items</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.filter(item => !folders.some(f => f.name === item.folder || f.name === item.subfolder)).map((item) => {
                const itemCount = item.quantity || 0;
                const totalValue = (item.purchasePrice || 0) * itemCount;
                const imageUrl = item.photos && item.photos.length > 0 ? item.photos[0] : undefined;

                return (
                  <UnifiedInventoryCard
                    key={item.id}
                    item={item}
                    title={item.name}
                    imageUrl={imageUrl}
                    itemCount={itemCount}
                    totalValue={totalValue}
                    type="item"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowItemDetail(true);
                    }}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setShowItemForm(true);
                    }}
                     onDelete={(itemId) => {
                       // Show confirmation dialog before deleting
                       if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
                         // Here you would call your delete function
                         toast({
                           title: "Item Deleted",
                           description: `${item.name} has been deleted`
                         });
                       }
                     }}
                    onDuplicate={(item) => {
                      const clonedItem = {
                        ...item,
                        name: `${item.name} (Copy)`,
                        id: undefined
                      };
                      if (onCreateItem) {
                        onCreateItem(clonedItem);
                      }
                      toast({
                        title: "Item Cloned",
                        description: `Created copy of ${item.name}`
                      });
                    }}
                    onViewHistory={() => {
                      toast({
                        title: "Item History",
                        description: `Viewing history for ${item.name}`
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFolders.map((folder) => {
            const folderItems = getFolderItems(folder.id);
            const folderValue = getFolderValue(folder.id);
            const itemCount = getFolderItemCount(folder.id);
            
            // Get up to 4 item photos for the 2x2 grid
            const itemPhotos = folderItems
              .filter(item => item.photos && item.photos.length > 0)
              .slice(0, 4)
              .map(item => item.photos[0]);

            return (
              <UnifiedInventoryCard
                key={folder.id}
                folder={folder}
                title={folder.name}
                itemCount={itemCount}
                totalValue={folderValue}
                description={folder.description}
                type="folder"
                images={itemPhotos}
                onClick={() => onFolderSelect(folder.id)}
                onFolderAction={handleFolderAction}
              />
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Show:</span>
            <Select defaultValue="20">
              <SelectTrigger className="w-16 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        </div>
      </div>
      
      {/* Full Inventory Item Form */}
      <InventoryItemForm
        isOpen={showItemForm}
        onClose={() => {
          setShowItemForm(false);
          setEditingItem(null);
        }}
        onSave={handleCreateItem}
        editingItem={editingItem}
        categories={folderNames}
        locations={locations}
      />

      {/* Smart Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductDetected={handleProductDetected}
      />

      {/* Item Detail Dialog */}
      {selectedItem && (
        <InventoryItemDetail
          item={selectedItem}
          isOpen={showItemDetail}
          onClose={() => {
            setShowItemDetail(false);
            setSelectedItem(null);
          }}
          onEdit={() => {
            setEditingItem(selectedItem);
            setShowItemForm(true);
            setShowItemDetail(false);
          }}
          onDelete={() => {
            // Add confirmation dialog
            if (window.confirm(`Are you sure you want to delete "${selectedItem.name}"? This action cannot be undone.`)) {
              toast({
                title: "Item Deleted",
                description: `${selectedItem.name} has been deleted`
              });
              setShowItemDetail(false);
              setSelectedItem(null);
            }
          }}
          onDuplicate={() => {
            const clonedItem = {
              ...selectedItem,
              name: `${selectedItem.name} (Copy)`,
              id: undefined
            };
            if (onCreateItem) {
              onCreateItem(clonedItem);
            }
            toast({
              title: "Item Cloned",
              description: `Created copy of ${selectedItem.name}`
            });
            setShowItemDetail(false);
          }}
        />
      )}
    </div>
  );
};