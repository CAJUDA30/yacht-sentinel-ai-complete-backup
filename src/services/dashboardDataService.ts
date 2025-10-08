import { InventoryItemType } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardData {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  criticalItems: number;
  maintenanceAlerts: number;
  crewOnboard: number;
  crewOnDuty: number;
  fuelLevel: number;
  fuelQuantity: number;
  maxFuelCapacity: number;
  currentLocation: string;
}

export interface Alert {
  id: string;
  type: 'fuel' | 'maintenance' | 'inventory' | 'crew' | 'safety';
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  acknowledged: boolean;
}

export const getDashboardData = async (inventoryItems?: InventoryItemType[]): Promise<DashboardData> => {
  try {
    // Use provided inventory items or return defaults
    const items = inventoryItems || [];

    // Calculate inventory stats
    const totalItems = items.length;
    const totalValue = items.reduce((sum: number, item: any) => sum + ((item.purchasePrice || 0) * (item.quantity || 0)), 0);
    const lowStockItems = items.filter((item: any) => 
      item.minStock && item.quantity <= item.minStock && item.quantity > 0
    ).length;
    const outOfStockItems = items.filter((item: any) => item.quantity === 0).length;
    const criticalItems = items.filter((item: any) => item.priority === "critical").length;
    
    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      criticalItems,
      maintenanceAlerts: lowStockItems + outOfStockItems,
      crewOnboard: 0,
      crewOnDuty: 0,
      fuelLevel: 0,
      fuelQuantity: 0,
      maxFuelCapacity: 0,
      currentLocation: "Location not available"
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return fallback data
    return {
      totalItems: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      criticalItems: 0,
      maintenanceAlerts: 0,
      crewOnboard: 0,
      crewOnDuty: 0,
      fuelLevel: 0,
      fuelQuantity: 0,
      maxFuelCapacity: 0,
      currentLocation: "Data unavailable"
    };
  }
};

export const getActiveAlerts = async (inventoryItems?: InventoryItemType[]): Promise<Alert[]> => {
  try {
    const alerts: Alert[] = [];
    
    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

export const getInventoryItems = async (): Promise<InventoryItemType[]> => {
  try {
    // Return empty array for now - simplified implementation
    return [];
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return [];
  }
};

export const getCrewMembers = async () => {
  try {
    // Return empty array for now - simplified implementation
    return [];
  } catch (error) {
    console.error('Error fetching crew members:', error);
    return [];
  }
};