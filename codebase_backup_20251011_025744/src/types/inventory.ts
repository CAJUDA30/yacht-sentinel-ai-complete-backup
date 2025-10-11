export interface InventoryItemType {
  id: string;
  name: string;
  description?: string;
  folder: string;
  subfolder?: string;
  quantity: number;
  minStock?: number;
  maxStock?: number;
  location: string;
  sublocation?: string;
  folderId?: string;
  status: "in-stock" | "low-stock" | "out-of-stock" | "expired" | "maintenance";
  priority?: "critical" | "high" | "medium" | "low";
  
  // Financial
  purchasePrice?: number;
  unitCost?: number;
  totalCost?: number;
  
  // Identification
  sku?: string;
  barcode?: string;
  qrCode?: string;
  serialNumber?: string;
  modelNumber?: string;
  partNumber?: string;
  
  // Supplier & Purchase Info
  supplier?: string;
  supplierContact?: string;
  supplierItemId?: string;
  purchaseDate?: string;
  warrantyDate?: string;
  expiryDate?: string;
  
  // Physical Properties
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  color?: string;
  material?: string;
  condition?: "new" | "good" | "fair" | "poor" | "needs-repair";
  
  // Media
  photos?: string[];
  documents?: string[];
  
  // Maintenance & Service
  maintenanceSchedule?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceNotes?: string;
  
  // Usage & Movement
  lastMovedDate?: string;
  lastUsedDate?: string;
  usageCount?: number;
  movementHistory?: MovementRecord[];
  
  // Custom Fields
  customFields?: Record<string, any>;
  
  // System Fields
  createdAt: string;
  updatedAt?: string;
  lastUpdated: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Tags and Notes
  tags?: string[];
  notes?: string;
  alerts?: AlertType[];
  
  // Integration
  integrationData?: Record<string, any>;
}

export interface MovementRecord {
  id: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  reason: string;
  movedBy: string;
  movedAt: string;
  notes?: string;
}

export interface AlertType {
  id: string;
  type: "low-stock" | "expiry" | "maintenance" | "custom";
  message: string;
  severity: "info" | "warning" | "error";
  createdAt: string;
  dismissed?: boolean;
}

export interface InventoryFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  location?: string;
  color?: string;
  icon?: string;
  itemCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryFilter {
  search?: string;
  category?: string;
  location?: string;
  status?: string[];
  priority?: string[];
  tags?: string[];
  itemId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  customFields?: Record<string, any>;
}

export interface InventoryReport {
  id: string;
  name: string;
  type: "stock-levels" | "low-stock" | "expiry" | "movement" | "valuation" | "custom";
  filters: InventoryFilter;
  format: "pdf" | "csv" | "excel";
  schedule?: "daily" | "weekly" | "monthly";
  recipients?: string[];
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  type: "increase" | "decrease" | "set";
  quantity: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
  notes?: string;
  cost?: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  items: PurchaseOrderItem[];
  status: "draft" | "sent" | "confirmed" | "received" | "cancelled";
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  totalAmount: number;
  notes?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  quantity: number;
  unitCost: number;
  received?: number;
  status: "pending" | "partial" | "received";
}

export interface LowStockAlert {
  id: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  location: string;
  priority: "critical" | "high" | "medium";
  createdAt: string;
  acknowledged?: boolean;
}

export interface InventoryAudit {
  id: string;
  name: string;
  location?: string;
  startDate: string;
  endDate?: string;
  status: "planning" | "in-progress" | "completed" | "cancelled";
  auditedBy: string[];
  items: AuditItem[];
  discrepancies: number;
  notes?: string;
}

export interface AuditItem {
  itemId: string;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  reason?: string;
  auditedAt: string;
  auditedBy: string;
}