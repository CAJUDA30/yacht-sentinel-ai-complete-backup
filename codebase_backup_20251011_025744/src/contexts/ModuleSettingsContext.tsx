import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CrewSettings {
  autoAssignTasks: boolean;
  skillBasedScheduling: boolean;
  overtimeAlerts: boolean;
  certificateTracking: boolean;
  performanceMonitoring: boolean;
  defaultShiftDuration: number;
  emergencyContactRequired: boolean;
}

interface MaintenanceSettings {
  predictiveMode: boolean;
  autoScheduling: boolean;
  partInventoryTracking: boolean;
  costTracking: boolean;
  warrantyTracking: boolean;
  defaultMaintenanceInterval: number;
  emergencyMaintenanceAlerts: boolean;
  maintenanceHistoryRetention: number;
}

interface FinanceSettings {
  autoExpenseTracking: boolean;
  budgetAlerts: boolean;
  currencyConversion: boolean;
  taxCalculation: boolean;
  invoiceGeneration: boolean;
  expenseApprovalWorkflow: boolean;
  financialReporting: boolean;
  costCenterTracking: boolean;
}

interface DocumentsSettings {
  autoVersioning: boolean;
  documentApproval: boolean;
  expiryTracking: boolean;
  digitalSignatures: boolean;
  documentSharing: boolean;
  backupEnabled: boolean;
  encryptionEnabled: boolean;
  retentionPeriod: number;
}

interface NavigationSettings {
  autoRouting: boolean;
  weatherIntegration: boolean;
  hazardAlerts: boolean;
  anchorageTracking: boolean;
  speedLimits: boolean;
  routeOptimization: boolean;
  emergencyBeacons: boolean;
  trackingInterval: number;
  gpsTracking: boolean;
  autoPilotIntegration: boolean;
  weatherOverlay: boolean;
  collisionDetection: boolean;
  anchorWatch: boolean;
  emergencyProcedures: boolean;
}

interface ModuleSettings {
  crew: CrewSettings;
  maintenance: MaintenanceSettings;
  finance: FinanceSettings;
  documents: DocumentsSettings;
  navigation: NavigationSettings;
}

interface ModuleSettingsContextType {
  settings: ModuleSettings;
  updateCrewSetting: (key: keyof CrewSettings, value: any) => void;
  updateMaintenanceSetting: (key: keyof MaintenanceSettings, value: any) => void;
  updateFinanceSetting: (key: keyof FinanceSettings, value: any) => void;
  updateDocumentsSetting: (key: keyof DocumentsSettings, value: any) => void;
  updateNavigationSetting: (key: keyof NavigationSettings, value: any) => void;
  getModuleSettings: (module: string) => any;
  isModuleSettingEnabled: (module: string, setting: string) => boolean;
}

const defaultSettings: ModuleSettings = {
  crew: {
    autoAssignTasks: true,
    skillBasedScheduling: true,
    overtimeAlerts: true,
    certificateTracking: true,
    performanceMonitoring: false,
    defaultShiftDuration: 8,
    emergencyContactRequired: true
  },
  maintenance: {
    predictiveMode: true,
    autoScheduling: true,
    partInventoryTracking: true,
    costTracking: true,
    warrantyTracking: true,
    defaultMaintenanceInterval: 30,
    emergencyMaintenanceAlerts: true,
    maintenanceHistoryRetention: 365
  },
  finance: {
    autoExpenseTracking: true,
    budgetAlerts: true,
    currencyConversion: true,
    taxCalculation: false,
    invoiceGeneration: true,
    expenseApprovalWorkflow: false,
    financialReporting: true,
    costCenterTracking: false
  },
  documents: {
    autoVersioning: true,
    documentApproval: false,
    expiryTracking: true,
    digitalSignatures: false,
    documentSharing: true,
    backupEnabled: true,
    encryptionEnabled: true,
    retentionPeriod: 1095
  },
  navigation: {
    autoRouting: true,
    weatherIntegration: true,
    hazardAlerts: true,
    anchorageTracking: true,
    speedLimits: true,
    routeOptimization: true,
    emergencyBeacons: true,
    trackingInterval: 5,
    gpsTracking: true,
    autoPilotIntegration: false,
    weatherOverlay: true,
    collisionDetection: true,
    anchorWatch: false,
    emergencyProcedures: true
  }
};

const ModuleSettingsContext = createContext<ModuleSettingsContextType | undefined>(undefined);

export const useModuleSettings = () => {
  const context = useContext(ModuleSettingsContext);
  if (context === undefined) {
    throw new Error('useModuleSettings must be used within a ModuleSettingsProvider');
  }
  return context;
};

interface ModuleSettingsProviderProps {
  children: ReactNode;
}

export const ModuleSettingsProvider: React.FC<ModuleSettingsProviderProps> = ({ children }) => {
  const { broadcastUpdate } = useRealtime();
  const { currency } = useCurrency();
  
  const [settings, setSettings] = useState<ModuleSettings>(() => {
    const savedSettings = localStorage.getItem('moduleSettings');
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  });

  const updateCrewSetting = (key: keyof CrewSettings, value: any) => {
    const newSettings = {
      ...settings,
      crew: { ...settings.crew, [key]: value }
    };
    setSettings(newSettings);
    broadcastUpdate('moduleSettings', { module: 'crew', key, value });
  };

  const updateMaintenanceSetting = (key: keyof MaintenanceSettings, value: any) => {
    const newSettings = {
      ...settings,
      maintenance: { ...settings.maintenance, [key]: value }
    };
    setSettings(newSettings);
    broadcastUpdate('moduleSettings', { module: 'maintenance', key, value });
  };

  const updateFinanceSetting = (key: keyof FinanceSettings, value: any) => {
    const newSettings = {
      ...settings,
      finance: { ...settings.finance, [key]: value }
    };
    setSettings(newSettings);
    broadcastUpdate('moduleSettings', { module: 'finance', key, value });
  };

  const updateDocumentsSetting = (key: keyof DocumentsSettings, value: any) => {
    const newSettings = {
      ...settings,
      documents: { ...settings.documents, [key]: value }
    };
    setSettings(newSettings);
    broadcastUpdate('moduleSettings', { module: 'documents', key, value });
  };

  const updateNavigationSetting = (key: keyof NavigationSettings, value: any) => {
    const newSettings = {
      ...settings,
      navigation: { ...settings.navigation, [key]: value }
    };
    setSettings(newSettings);
    broadcastUpdate('moduleSettings', { module: 'navigation', key, value });
  };

  const getModuleSettings = (module: string) => {
    return settings[module as keyof ModuleSettings];
  };

  const isModuleSettingEnabled = (module: string, setting: string) => {
    const moduleSettings = settings[module as keyof ModuleSettings];
    if (typeof moduleSettings === 'object' && moduleSettings !== null) {
      return (moduleSettings as any)[setting] === true;
    }
    return false;
  };

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('moduleSettings', JSON.stringify(settings));
  }, [settings]);

  // Broadcast currency changes to all modules
  useEffect(() => {
    broadcastUpdate('moduleSettings', { 
      module: 'global', 
      key: 'currency', 
      value: currency 
    });
  }, [currency, broadcastUpdate]);

  const value = {
    settings,
    updateCrewSetting,
    updateMaintenanceSetting,
    updateFinanceSetting,
    updateDocumentsSetting,
    updateNavigationSetting,
    getModuleSettings,
    isModuleSettingEnabled
  };

  return (
    <ModuleSettingsContext.Provider value={value}>
      {children}
    </ModuleSettingsContext.Provider>
  );
};