import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  QrCode, 
  Camera, 
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  BarChart3,
  Grid,
  List,
  Folder,
  FileText,
  Settings,
  Upload,
  Download,
  Scan,
  History,
  DollarSign
} from "lucide-react";

// Import new components
import { InventoryDashboard } from "./inventory/InventoryDashboard";
import { InventoryFilters } from "./inventory/InventoryFilters";
import { InventoryFolders } from "./inventory/InventoryFolders";
import { InventoryItem } from "./inventory/InventoryItem";
import { InventoryItemForm } from "./inventory/InventoryItemForm";
import { InventoryReports } from "./inventory/InventoryReports";
import { BarcodeScanner } from "./inventory/BarcodeScanner";
import { InventorySettingsProvider } from "./inventory/InventorySettingsContext";
import { InventoryItemType, InventoryFilter, InventoryFolder } from "@/types/inventory";
import { useInventory } from "@/contexts/InventoryContext";
import { useInventoryFolders } from '@/hooks/useInventoryFolders';
import { InventoryItemDetail } from "./inventory/InventoryItemDetail";
import { MoveItemDialog } from "./inventory/MoveItemDialog";

const InventoryModule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items: inventoryItems, loading: inventoryLoading, addItem, updateItem, deleteItem } = useInventory();
  const { folders, loading: foldersLoading, createFolder } = useInventoryFolders();
  
  // State management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<InventoryFilter>({});
  const [selectedFolder, setSelectedFolder] = useState<string>();
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemType | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [movingItem, setMovingItem] = useState<InventoryItemType | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemType | null>(null);

  // Event handlers - defined first to avoid hoisting issues
  const handleItemEdit = useCallback((item: InventoryItemType) => {
    setEditingItem(item);
    setShowItemForm(true);
  }, []);

  const handleItemViewDetail = useCallback((item: InventoryItemType) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  }, []);

  const handleItemDelete = useCallback((id: string) => {
    deleteItem(id);
    toast({ title: "Item Deleted", description: "Item archived successfully." });
  }, [deleteItem]);

  const handleItemDuplicate = useCallback((item: InventoryItemType) => {
    const duplicatedItem: InventoryItemType = {
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} (Copy)`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    addItem(duplicatedItem);
    toast({ title: "Item Duplicated", description: `Duplicated ${item.name}` });
  }, [addItem]);

  const handleItemMove = useCallback((id: string, newLocation: string, folderId?: string) => {
    updateItem(id, { location: newLocation, folderId });
    toast({ title: "Item Moved", description: `Moved to ${newLocation}${folderId ? ' in selected folder' : ''}` });
  }, [updateItem]);

  // Filtered items based on current filters
  const filteredItems = inventoryItems.filter(item => {
    // Check for specific item ID first (for direct item linking)
    if (filters.itemId) {
      return item.id === filters.itemId;
    }
    
    const matchesSearch = !filters.search || 
      item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.id.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesCategory = !filters.category || item.folder === filters.category;
    const matchesLocation = !filters.location || item.location === filters.location;
    const matchesStatus = !filters.status?.length || filters.status.includes(item.status);
    const matchesPriority = !filters.priority?.length || (item.priority && filters.priority.includes(item.priority));
    const matchesTags = !filters.tags?.length || filters.tags.some(tag => item.tags?.includes(tag));
    
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus && matchesPriority && matchesTags;
  });

  const handleQuickAction = useCallback((action: string, data?: any) => {
    switch (action) {
      case 'add-item':
        setShowItemForm(true);
        setEditingItem(null);
        break;
      case 'scan-qr':
      case 'photo-scan':
        setShowBarcodeScanner(true);
        break;
      case 'open-settings':
        setActiveTab('settings');
        toast({ title: "Settings", description: "Opening inventory settings..." });
        break;
      case 'bulk-import':
        toast({ title: "Bulk Import", description: "Opening import wizard..." });
        break;
      case 'generate-report':
        toast({ title: "Generate Report", description: "Creating inventory report..." });
        break;
      case 'audit':
        toast({ title: "Audit Started", description: "Beginning inventory audit process..." });
        break;
      case 'view-all-alerts':
        setActiveTab('dashboard');
        toast({ title: "Viewing Alerts", description: "Showing all active alerts..." });
        break;
      case 'edit-item':
        if (data) {
          handleItemEdit(data);
        }
        break;
      case 'set-alert':
        if (data) {
          toast({ 
            title: "Alert Set", 
            description: `Alert set for ${data.name}. You'll be notified when stock is low.` 
          });
        }
        break;
      case 'move-item':
        if (data) {
          setMovingItem(data);
          setShowMoveDialog(true);
        }
        break;
      case 'increase-quantity':
        if (data) {
          updateItem(data.id, { quantity: data.quantity + 1 });
          toast({ title: "Quantity Updated", description: `Increased ${data.name} quantity to ${data.quantity + 1}` });
        }
        break;
      case 'decrease-quantity':
        if (data && data.quantity > 0) {
          updateItem(data.id, { quantity: data.quantity - 1 });
          toast({ title: "Quantity Updated", description: `Decreased ${data.name} quantity to ${data.quantity - 1}` });
        }
        break;
      case 'duplicate-item':
        if (data) {
          handleItemDuplicate(data);
        }
        break;
      case 'delete-item':
        if (data) {
          handleItemDelete(data.id);
        }
        break;
      default:
        toast({ title: action.replace('-', ' '), description: "Feature coming soon..." });
    }
  }, [handleItemEdit, handleItemMove, updateItem]);

  const handleViewHistory = useCallback((id: string) => {
    toast({ title: "Item History", description: "Opening history view..." });
  }, []);

  const handleProductDetected = useCallback((productInfo: any, barcode: string, quantity?: number) => {
    // Pre-fill form with AI-detected product information
    const newItemData = {
      name: productInfo.name,
      description: productInfo.description,
      folder: productInfo.category,
      quantity: quantity || 1,
      barcode: barcode,
      weight: productInfo.weight,
      dimensions: productInfo.dimensions,
      customFields: productInfo.specifications || {},
      status: "in-stock" as const,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Auto-open the form with pre-filled data
    setEditingItem(newItemData as any);
    setShowItemForm(true);
    
    toast({
      title: "Product Details Filled",
      description: quantity && quantity > 1 
        ? `Detected ${quantity} items. Please verify the quantity.`
        : "Please review and save the item details."
    });
  }, []);

  // Handle filter actions from dashboard
  const handleFilterItems = useCallback((filterType: string, filterValue?: any) => {
    // Clear existing filters first
    setFilters({});
    
    // Apply new filter based on type
    switch (filterType) {
      case 'all':
        // Show all items - no filter needed
        break;
      case 'low-stock':
        setFilters({ status: ['low-stock', 'out-of-stock'] });
        break;
      case 'critical':
        setFilters({ priority: ['critical'] });
        break;
      case 'maintenance-due':
        // For maintenance due, we'll use a search filter for items with maintenance dates
        setFilters({ search: 'maintenance' });
        break;
      case 'category':
        if (filterValue) {
          setFilters({ category: filterValue });
        }
        break;
      case 'categories':
        // Show items grouped by categories - we'll just show all for now
        break;
      case 'item':
        if (filterValue) {
          setFilters({ itemId: filterValue });
        }
        break;
      case 'all-alerts':
        // Show all items with alerts (low stock items)
        setFilters({ status: ['low-stock', 'out-of-stock'] });
        break;
      case 'sort-by-value':
        // We'll sort by showing all items but could add sorting logic
        break;
    }
    
    // Switch to items tab to show filtered results
    setActiveTab('items');
  }, [inventoryItems]);

  if (inventoryLoading || foldersLoading) {
    return (
      <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
                  <Package className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Inventory Management
                  </h1>
                  <p className="text-muted-foreground">
                    Loading inventory data...
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Loading Inventory...</h3>
              <p className="text-muted-foreground">
                Please wait while we fetch your inventory data from the database.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
                <Package className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Inventory Management
                </h1>
                <p className="text-muted-foreground">
                  Manage all yacht inventory with advanced tracking and organization
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ocean" onClick={() => setShowBarcodeScanner(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Smart Scan
            </Button>
            <Button variant="default" onClick={() => handleQuickAction('add-item')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => {
          if (value === 'settings') {
            navigate('/settings?tab=inventory');
          } else {
            setActiveTab(value);
          }
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Items</span>
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex items-center space-x-2">
              <Folder className="h-4 w-4" />
              <span>Folders</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <InventoryDashboard 
              items={inventoryItems} 
              onQuickAction={handleQuickAction}
              onFilterItems={handleFilterItems}
              onEditItem={handleItemEdit}
              onDeleteItem={handleItemDelete}
              onDuplicateItem={handleItemDuplicate}
              onViewItemDetail={handleItemViewDetail}
            />
          </TabsContent>

          <TabsContent value="items" className="space-y-6">
            <InventoryFilters
              items={inventoryItems}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={() => setFilters({})}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{filteredItems.length} items</Badge>
                {Object.keys(filters).some(key => {
                  const value = filters[key as keyof InventoryFilter];
                  return Array.isArray(value) ? value.length > 0 : Boolean(value);
                }) && (
                  <Badge variant="secondary">Filtered</Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filteredItems.map((item) => (
                <InventoryItem
                  key={item.id}
                  item={item}
                  onEdit={handleItemEdit}
                  onDelete={handleItemDelete}
                  onDuplicate={handleItemDuplicate}
                  onMove={handleItemMove}
                  onViewHistory={handleViewHistory}
                  onViewDetail={handleItemViewDetail}
                />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No items found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or add new inventory items.
                  </p>
                  <Button variant="default" onClick={() => handleQuickAction('add-item')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="folders" className="space-y-6">
            <InventoryFolders
              folders={folders}
              items={inventoryItems}
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
              onCreateFolder={createFolder}
              onUpdateFolder={async (folderId, updates) => {
                // This will be handled by the hook's update function
                toast({ title: "Folder Updated", description: "Folder updated successfully" });
              }}
              onDeleteFolder={async (folderId) => {
                // This will be handled by the hook's delete function  
                toast({ title: "Folder Deleted", description: "Folder deleted successfully" });
              }}
              onCreateItem={(itemData) => {
                const newItem: InventoryItemType = {
                  id: `INV${String(inventoryItems.length + 1).padStart(3, '0')}`,
                  name: itemData.name || "Unnamed Item",
                  description: itemData.description,
                  folder: itemData.folder || "General",
                  quantity: itemData.quantity || 1,
                  status: "in-stock" as const,
                  location: "General Storage",
                  
                  purchasePrice: itemData.purchasePrice || 0,
                  createdAt: new Date().toISOString(),
                  lastUpdated: new Date().toISOString(),
                  
                  totalCost: (itemData.purchasePrice || 0) * (itemData.quantity || 1),
                  unitCost: itemData.purchasePrice || 0,
                  photos: itemData.photos || [],
                  tags: itemData.tags || [],
                  alerts: []
                };
                addItem(newItem);
                toast({ title: "Item Added", description: `Added ${itemData.name || "item"} to inventory` });
              }}
              onUpdateItem={(itemId, itemData) => {
                updateItem(itemId, itemData);
                toast({ title: "Item Updated", description: `Updated ${itemData.name || "item"}` });
              }}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <InventoryReports
              items={inventoryItems}
              onExport={(format, data) => {
                toast({ title: "Export", description: `Exporting ${format} report...` });
              }}
            />
          </TabsContent>

        </Tabs>

        {/* Item Form Dialog */}
        <InventoryItemForm
          isOpen={showItemForm}
          onClose={() => {
            setShowItemForm(false);
            setEditingItem(null);
          }}
          onSave={(itemData) => {
              if (editingItem && editingItem.id) {
                updateItem(editingItem.id, itemData);
              } else {
                addItem(itemData);
              }
              setShowItemForm(false);
              setEditingItem(null);
          }}
          editingItem={editingItem}
          categories={Array.from(new Set([...folders.map(folder => folder.name), ...inventoryItems.map(item => item.folder).filter(Boolean) as string[]]))}
          locations={Array.from(new Set(inventoryItems.map(item => item.location).filter(Boolean))) as string[]}
          onCreateFolder={async (folderName) => {
            const folderData = {
              name: folderName,
              description: `Folder for ${folderName} items`,
              color: "#3b82f6",
              icon: "folder"
            };
            await createFolder(folderData);
          }}
        />

        {/* Move Item Dialog */}
        <MoveItemDialog
          isOpen={showMoveDialog}
          onClose={() => {
            setShowMoveDialog(false);
            setMovingItem(null);
          }}
          onMove={(itemId, newLocation, folderId) => {
            const updates: any = { location: newLocation };
            if (folderId) {
              updates.folderId = folderId;
            }
            updateItem(itemId, updates);
            toast({ 
              title: "Item Moved", 
              description: folderId 
                ? `Item moved to ${newLocation} and organized in folder.`
                : `Item moved to ${newLocation}.`
            });
            setShowMoveDialog(false);
            setMovingItem(null);
          }}
          onCreateFolder={async (folderData) => {
            await createFolder(folderData);
          }}
          item={movingItem}
          folders={folders}
          locations={Array.from(new Set(inventoryItems.map(item => item.location).filter(Boolean))) as string[]}
        />

        {/* Barcode Scanner Dialog */}
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
              handleItemDelete(selectedItem.id);
              setShowItemDetail(false);
              setSelectedItem(null);
            }}
            onDuplicate={() => {
              handleItemDuplicate(selectedItem);
              setShowItemDetail(false);
              setSelectedItem(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default InventoryModule;