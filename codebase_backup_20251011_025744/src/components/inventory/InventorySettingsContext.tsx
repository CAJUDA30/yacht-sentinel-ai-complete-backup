import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InventorySettings {
  // General Settings
  autoGenerateSKU: boolean;
  defaultCurrency: string;
  lowStockThreshold: number;
  enableExpiryAlerts: boolean;
  expiryWarningDays: number;
  
  // QR Code Settings
  qrCodeFormat: string;
  includeQRInLabels: boolean;
  qrCodeSize: string;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  lowStockAlerts: boolean;
  expiryAlerts: boolean;
  maintenanceAlerts: boolean;
  
  // Integration Settings
  enableBarcodeScanning: boolean;
  cameraAccess: boolean;
  offlineMode: boolean;
  autoSync: boolean;
  
  // Security Settings
  requireApprovalForDeletion: boolean;
  auditTrail: boolean;
  userPermissions: boolean;
}

interface InventorySettingsContextType {
  settings: InventorySettings;
  updateSetting: (key: keyof InventorySettings, value: any) => void;
  getCurrencySymbol: () => string;
  formatCurrency: (amount: number) => string;
  isLowStock: (quantity: number, minStock?: number) => boolean;
}

const defaultSettings: InventorySettings = {
  autoGenerateSKU: true,
  defaultCurrency: "EUR", // Changed to match main currency context default
  lowStockThreshold: 10,
  enableExpiryAlerts: true,
  expiryWarningDays: 30,
  qrCodeFormat: "standard",
  includeQRInLabels: true,
  qrCodeSize: "medium",
  emailNotifications: true,
  pushNotifications: true,
  lowStockAlerts: true,
  expiryAlerts: true,
  maintenanceAlerts: true,
  enableBarcodeScanning: true,
  cameraAccess: true,
  offlineMode: true,
  autoSync: true,
  requireApprovalForDeletion: true,
  auditTrail: true,
  userPermissions: true
};

const InventorySettingsContext = createContext<InventorySettingsContextType | undefined>(undefined);

export const useInventorySettings = () => {
  const context = useContext(InventorySettingsContext);
  if (context === undefined) {
    throw new Error('useInventorySettings must be used within an InventorySettingsProvider');
  }
  return context;
};

interface InventorySettingsProviderProps {
  children: ReactNode;
}

export const InventorySettingsProvider: React.FC<InventorySettingsProviderProps> = ({ children }) => {
  const { currency, setCurrency } = useCurrency();
  const [settings, setSettings] = useState<InventorySettings>(() => {
    const savedSettings = localStorage.getItem('inventorySettings');
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  });

  const updateSetting = (key: keyof InventorySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('inventorySettings', JSON.stringify(newSettings));
    
    // Sync currency with main currency context
    if (key === 'defaultCurrency') {
      setCurrency(value);
    }
  };

  const getCurrencySymbol = () => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥'
    };
    return currencySymbols[currency] || '$';
  };

  const formatCurrency = (amount: number) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${amount.toLocaleString()}`;
  };

  const isLowStock = (quantity: number, minStock?: number) => {
    if (!minStock) return false;
    return quantity <= minStock;
  };

  useEffect(() => {
    // Save settings whenever they change
    localStorage.setItem('inventorySettings', JSON.stringify(settings));
  }, [settings]);

  // Sync currency context with inventory settings on mount
  useEffect(() => {
    if (settings.defaultCurrency !== currency) {
      updateSetting('defaultCurrency', currency);
    }
  }, [currency, settings.defaultCurrency]);

  const value = {
    settings: { ...settings, defaultCurrency: currency }, // Always use main currency context
    updateSetting,
    getCurrencySymbol,
    formatCurrency,
    isLowStock
  };

  return (
    <InventorySettingsContext.Provider value={value}>
      {children}
    </InventorySettingsContext.Provider>
  );
};