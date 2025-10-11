import { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItemType } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InventoryContextType {
  items: InventoryItemType[];
  loading: boolean;
  addItem: (item: InventoryItemType) => void;
  updateItem: (id: string, updates: Partial<InventoryItemType>) => void;
  deleteItem: (id: string) => void;
  getStats: () => {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    criticalItems: number;
  };
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

// Helper function to convert database item to frontend format
const convertDbItemToFrontend = (dbItem: any): InventoryItemType => {
  return {
    id: dbItem.id,
    name: dbItem.name,
    description: dbItem.description || '',
    folder: dbItem.folder,
    subfolder: dbItem.subfolder || '',
    quantity: dbItem.quantity,
    minStock: dbItem.min_stock,
    maxStock: dbItem.max_stock,
    location: dbItem.location,
    sublocation: dbItem.sublocation || '',
    folderId: dbItem.folder_id || '',
    status: dbItem.status as any,
    priority: dbItem.priority as any,
    purchasePrice: dbItem.purchase_price ? Number(dbItem.purchase_price) : undefined,
    unitCost: dbItem.unit_cost ? Number(dbItem.unit_cost) : undefined,
    totalCost: dbItem.total_cost ? Number(dbItem.total_cost) : undefined,
    sku: dbItem.sku || '',
    barcode: dbItem.barcode || '',
    qrCode: dbItem.qr_code || '',
    serialNumber: dbItem.serial_number || '',
    modelNumber: dbItem.model_number || '',
    partNumber: dbItem.part_number || '',
    supplier: dbItem.supplier || '',
    supplierContact: dbItem.supplier_contact || '',
    supplierItemId: dbItem.supplier_item_id || '',
    purchaseDate: dbItem.purchase_date || '',
    warrantyDate: dbItem.warranty_date || '',
    expiryDate: dbItem.expiry_date || '',
    weight: dbItem.weight ? Number(dbItem.weight) : undefined,
    dimensions: dbItem.dimensions || undefined,
    color: dbItem.color || '',
    material: dbItem.material || '',
    condition: dbItem.condition as any,
    photos: dbItem.photos || [],
    documents: dbItem.documents || [],
    maintenanceSchedule: dbItem.maintenance_schedule || '',
    lastMaintenanceDate: dbItem.last_maintenance_date || '',
    nextMaintenanceDate: dbItem.next_maintenance_date || '',
    maintenanceNotes: dbItem.maintenance_notes || '',
    lastMovedDate: dbItem.last_moved_date || '',
    lastUsedDate: dbItem.last_used_date || '',
    usageCount: dbItem.usage_count || 0,
    customFields: dbItem.custom_fields || {},
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
    lastUpdated: dbItem.updated_at || dbItem.created_at,
    createdBy: dbItem.created_by || '',
    updatedBy: dbItem.updated_by || '',
    tags: dbItem.tags || [],
    notes: dbItem.notes || '',
    alerts: [] // Will be loaded separately
  };
};

// Helper function to convert frontend item to database format
const convertFrontendItemToDb = (item: InventoryItemType) => {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    folder: item.folder,
    subfolder: item.subfolder,
    quantity: item.quantity,
    min_stock: item.minStock,
    max_stock: item.maxStock,
    location: item.location,
    sublocation: item.sublocation,
    folder_id: item.folderId,
    status: item.status,
    priority: item.priority,
    purchase_price: item.purchasePrice,
    unit_cost: item.unitCost,
    total_cost: item.totalCost,
    sku: item.sku,
    barcode: item.barcode,
    qr_code: item.qrCode,
    serial_number: item.serialNumber,
    model_number: item.modelNumber,
    part_number: item.partNumber,
    supplier: item.supplier,
    supplier_contact: item.supplierContact,
    supplier_item_id: item.supplierItemId,
    purchase_date: item.purchaseDate,
    warranty_date: item.warrantyDate,
    expiry_date: item.expiryDate,
    weight: item.weight,
    dimensions: item.dimensions,
    color: item.color,
    material: item.material,
    condition: item.condition,
    photos: item.photos,
    documents: item.documents,
    maintenance_schedule: item.maintenanceSchedule,
    last_maintenance_date: item.lastMaintenanceDate,
    next_maintenance_date: item.nextMaintenanceDate,
    maintenance_notes: item.maintenanceNotes,
    last_moved_date: item.lastMovedDate,
    last_used_date: item.lastUsedDate,
    usage_count: item.usageCount,
    custom_fields: item.customFields,
    created_by: item.createdBy,
    updated_by: item.updatedBy,
    tags: item.tags,
    notes: item.notes
  };
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItemType[]>([]);
  const [loading, setLoading] = useState(true);

  // Load items from Supabase on mount and set up real-time subscription
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('Failed to load inventory items');
          console.error('Error fetching inventory items:', error);
          return;
        }

        const convertedItems = data.map(convertDbItemToFrontend);
        setItems(convertedItems);
      } catch (error) {
        toast.error('Failed to load inventory items');
        console.error('Error fetching inventory items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();

    // Set up real-time subscription for inventory changes
    const subscription = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = convertDbItemToFrontend(payload.new);
            setItems(prev => [newItem, ...prev]);
            toast.success(`New item added: ${newItem.name}`);
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = convertDbItemToFrontend(payload.new);
            setItems(prev => prev.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id));
            toast.info('Item removed from inventory');
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addItem = async (item: InventoryItemType) => {
    try {
      const dbItem = convertFrontendItemToDb(item);
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([dbItem])
        .select()
        .single();

      if (error) {
        toast.error('Failed to add inventory item');
        console.error('Error adding inventory item:', error);
        return;
      }

      const convertedItem = convertDbItemToFrontend(data);
      setItems(prev => [convertedItem, ...prev]);
      toast.success('Inventory item added successfully');
    } catch (error) {
      toast.error('Failed to add inventory item');
      console.error('Error adding inventory item:', error);
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItemType>) => {
    try {
      const dbUpdates = convertFrontendItemToDb({ ...updates } as InventoryItemType);
      
      const { data, error } = await supabase
        .from('inventory_items')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast.error('Failed to update inventory item');
        console.error('Error updating inventory item:', error);
        return;
      }

      const convertedItem = convertDbItemToFrontend(data);
      setItems(prev => prev.map(item => 
        item.id === id ? convertedItem : item
      ));
      toast.success('Inventory item updated successfully');
    } catch (error) {
      toast.error('Failed to update inventory item');
      console.error('Error updating inventory item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Failed to delete inventory item');
        console.error('Error deleting inventory item:', error);
        return;
      }

      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Inventory item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete inventory item');
      console.error('Error deleting inventory item:', error);
    }
  };

  const getStats = () => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + ((item.purchasePrice || 0) * (item.quantity || 0)), 0);
    const lowStockItems = items.filter(item => 
      item.minStock && item.quantity <= item.minStock && item.quantity > 0
    ).length;
    const outOfStockItems = items.filter(item => item.quantity === 0).length;
    const criticalItems = items.filter(item => item.priority === "critical").length;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      criticalItems
    };
  };

  return (
    <InventoryContext.Provider value={{
      items,
      loading,
      addItem,
      updateItem,
      deleteItem,
      getStats
    }}>
      {children}
    </InventoryContext.Provider>
  );
};