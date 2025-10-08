import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useModuleSettings } from '@/contexts/ModuleSettingsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from '@/hooks/use-toast';

interface InventorySettings {
  autoReorder: boolean;
  lowStockThreshold: number;
  categoryManagement: boolean;
  barcodeScanning: boolean;
  locationTracking: boolean;
  costTracking: boolean;
  expiryAlerts: boolean;
  bulkOperations: boolean;
}

interface PendingChanges {
  appSettings?: any;
  appSettingsSettings?: any;
  moduleSettings?: any;
  currency?: string;
  inventory?: Partial<InventorySettings>;
}

interface UnifiedSettingsContextType {
  pendingChanges: PendingChanges;
  hasPendingChanges: boolean;
  addPendingChange: (category: string, key: string, value: any) => void;
  saveAllSettings: () => Promise<boolean>;
  resetPendingChanges: () => void;
  inventorySettings: InventorySettings;
  updateInventorySetting: (key: keyof InventorySettings, value: any) => void;
  userRole: 'user' | 'manager' | 'admin' | 'superadmin' | 'viewer';
  isAuthorized: (requiredRole: string) => boolean;
}

const defaultInventorySettings: InventorySettings = {
  autoReorder: true,
  lowStockThreshold: 10,
  categoryManagement: true,
  barcodeScanning: true,
  locationTracking: true,
  costTracking: true,
  expiryAlerts: true,
  bulkOperations: true
};

const roleHierarchy = {
  viewer: 0,
  user: 1,
  manager: 2,
  admin: 3,
  superadmin: 4
};

const UnifiedSettingsContext = createContext<UnifiedSettingsContextType | undefined>(undefined);

export const useUnifiedSettings = () => {
  const context = useContext(UnifiedSettingsContext);
  if (context === undefined) {
    throw new Error('useUnifiedSettings must be used within a UnifiedSettingsProvider');
  }
  return context;
};

interface UnifiedSettingsProviderProps {
  children: ReactNode;
}

export const UnifiedSettingsProvider: React.FC<UnifiedSettingsProviderProps> = ({ children }) => {
  const { settings: appSettings, updateSystemSetting } = useAppSettings();
  const { settings: moduleSettings } = useModuleSettings();
  const { currency, setCurrency } = useCurrency();
  
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [inventorySettings, setInventorySettings] = useState<InventorySettings>(() => {
    const saved = localStorage.getItem('inventorySettings');
    return saved ? { ...defaultInventorySettings, ...JSON.parse(saved) } : defaultInventorySettings;
  });

  const userRole = appSettings.user.role as 'user' | 'manager' | 'admin' | 'superadmin' | 'viewer';

  const addPendingChange = (category: string, key: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const saveAllSettings = async (): Promise<boolean> => {
    try {
      // Apply currency changes immediately
      if (pendingChanges.currency) {
        setCurrency(pendingChanges.currency);
      }

      // Apply inventory settings
      if (pendingChanges.inventory) {
        const newInventorySettings = { ...inventorySettings, ...pendingChanges.inventory };
        setInventorySettings(newInventorySettings);
        localStorage.setItem('inventorySettings', JSON.stringify(newInventorySettings));
      }

      // Apply language changes with reactive update
      if (pendingChanges.appSettingsSettings?.language && pendingChanges.appSettingsSettings.language !== appSettings.system.language) {
        updateSystemSetting('language', pendingChanges.appSettingsSettings.language);
        // Broadcast language change to all contexts
        window.dispatchEvent(new CustomEvent('languageChange', { 
          detail: { language: pendingChanges.appSettingsSettings.language } 
        }));
      }

      // Apply other app settings
      if (pendingChanges.appSettingsSettings) {
        Object.entries(pendingChanges.appSettingsSettings).forEach(([key, value]) => {
          if (key !== 'language') {
            updateSystemSetting(key as any, value);
          }
        });
      }

      // Clear pending changes
      setPendingChanges({});

      toast({
        title: "Settings Saved",
        description: "All settings have been applied successfully."
      });

      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your settings.",
        variant: "destructive"
      });
      return false;
    }
  };

  const resetPendingChanges = () => {
    setPendingChanges({});
    toast({
      title: "Changes Discarded",
      description: "Pending changes have been discarded."
    });
  };

  const updateInventorySetting = (key: keyof InventorySettings, value: any) => {
    addPendingChange('inventory', key, value);
  };

  const isAuthorized = (requiredRole: string): boolean => {
    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    return userLevel >= requiredLevel;
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Persist inventory settings
  useEffect(() => {
    localStorage.setItem('inventorySettings', JSON.stringify(inventorySettings));
  }, [inventorySettings]);

  const value = {
    pendingChanges,
    hasPendingChanges,
    addPendingChange,
    saveAllSettings,
    resetPendingChanges,
    inventorySettings,
    updateInventorySetting,
    userRole,
    isAuthorized
  };

  return (
    <UnifiedSettingsContext.Provider value={value}>
      {children}
    </UnifiedSettingsContext.Provider>
  );
};