import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { userRoleService } from '@/services/UserRoleService';
import type { Json } from '@/integrations/supabase/types';

interface ThemeSettings {
  theme: 'light' | 'dark' | 'auto';
  colorScheme: 'blue' | 'ocean' | 'sunset' | 'forest';
  animations: boolean;
  compactMode: boolean;
}

interface NotificationSettings {
  globalNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  criticalAlertsOnly: boolean;
}

interface SystemSettings {
  language: string;
  timezone: string;
  dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  timeFormat: '12h' | '24h';
  units: 'metric' | 'imperial';
  autoSave: boolean;
  autoBackup: boolean;
  offlineMode: boolean;
  dataRetentionDays: number;
  maxStorageGB: number;
}

interface UserSettings {
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'viewer' | 'superadmin' | 'global_superadmin';
  displayName: string;
  avatar: string;
  preferences: Record<string, any>;
}

interface AISettings {
  enabledModels: string[];
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  consensusThreshold: number;
  autoExecuteThreshold: number;
  humanApprovalThreshold: number;
  costLimitPerDay: number;
  enablePredictive: boolean;
  enableProactive: boolean;
}

interface AppSettings {
  theme: ThemeSettings;
  notifications: NotificationSettings;
  system: SystemSettings;
  user: UserSettings;
  ai: AISettings;
}

interface AppSettingsContextType {
  settings: AppSettings;
  loading: boolean;
  updateThemeSetting: (key: keyof ThemeSettings, value: any) => Promise<void>;
  updateNotificationSetting: (key: keyof NotificationSettings, value: any) => Promise<void>;
  updateSystemSetting: (key: keyof SystemSettings, value: any) => Promise<void>;
  updateUserSetting: (key: keyof UserSettings, value: any) => Promise<void>;
  updateAISetting: (key: keyof AISettings, value: any) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<boolean>;
  isSettingEnabled: (category: string, setting: string) => boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: {
    theme: 'auto',
    colorScheme: 'ocean',
    animations: true,
    compactMode: false
  },
  notifications: {
    globalNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    desktopNotifications: true,
    emailNotifications: true,
    criticalAlertsOnly: false
  },
  system: {
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'dd/mm/yyyy',
    timeFormat: '24h',
    units: 'metric',
    autoSave: true,
    autoBackup: true,
    offlineMode: false,
    dataRetentionDays: 365,
    maxStorageGB: 100
  },
  user: {
    username: '',
    email: '',
    role: 'user',
    displayName: '',
    avatar: '',
    preferences: {}
  },
  ai: {
    enabledModels: ['openai', 'gemini'],
    defaultModel: 'openai',
    maxTokens: 4000,
    temperature: 0.7,
    consensusThreshold: 0.7,
    autoExecuteThreshold: 0.85,
    humanApprovalThreshold: 0.65,
    costLimitPerDay: 50,
    enablePredictive: true,
    enableProactive: true
  }
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

interface AppSettingsProviderProps {
  children: ReactNode;
}

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  const { broadcastUpdate } = useRealtime();
  const { isMonitoring } = useSecurity();
  const { setTheme, theme } = useTheme();
  
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [userSyncInProgress, setUserSyncInProgress] = useState(false);

  // Load settings from database or localStorage as fallback
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen for auth changes and sync user role - REMOVED CONFLICTING LISTENER
  // This now uses Master Auth System through useSupabaseAuth hook
  useEffect(() => {
    // Get current user if available
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await syncUserRole(user.id);
      }
    };
    
    getCurrentUser();
  }, []);

  const syncUserRole = async (userId: string) => {
    // Prevent duplicate sync operations
    if (userSyncInProgress) {
      console.log('[AppSettings] User sync already in progress, skipping...');
      return;
    }
    
    setUserSyncInProgress(true);
    
    try {
      console.log('[AppSettings] Setting up user roles for:', userId);
      
      // Get current session first (more reliable than getUser)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.log('[AppSettings] No valid session found');
        return;
      }
      
      const user = session.user;
      
      // Check if this is the superadmin user immediately
      const isSuperAdmin = user.email === 'superadmin@yachtexcel.com' || 
                          user.user_metadata?.role === 'global_superadmin' ||
                          user.app_metadata?.role === 'global_superadmin';
      
      if (isSuperAdmin) {
        console.log('[AppSettings] Superadmin user detected, setting role immediately');
        setSettings(prevSettings => ({
          ...prevSettings,
          user: {
            ...prevSettings.user,
            role: 'superadmin',
            email: user.email || 'superadmin@yachtexcel.com',
            username: user.email?.split('@')[0] || 'superadmin',
            displayName: 'Super Administrator'
          }
        }));
        
        toast.success('Super Administrator access granted');
        return;
      }
      
      // For other users, try the edge function setup but handle failures gracefully
      try {
        const { data: setupResult, error: setupError } = await supabase.functions.invoke(
          'setup-user-roles-on-login',
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );
        
        if (setupError) {
          console.warn('[AppSettings] Edge function setup failed, using fallback:', setupError);
        } else {
          console.log('[AppSettings] Edge function setup result:', setupResult);
        }
      } catch (edgeFunctionError) {
        console.warn('[AppSettings] Edge function call failed:', edgeFunctionError);
      }
      
      // Try to get user role information from the database with fallback
      try {
        const userRoleInfo = await userRoleService.getUserRoleInfo(userId);
        
        if (userRoleInfo) {
          console.log('[AppSettings] User role info loaded:', userRoleInfo);
          
          // Update user settings with actual role from database
          setSettings(prevSettings => ({
            ...prevSettings,
            user: {
              ...prevSettings.user,
              role: userRoleInfo.primaryRole,
              email: userRoleInfo.email,
              username: userRoleInfo.email.split('@')[0] || '',
              displayName: userRoleInfo.email.split('@')[0] || ''
            }
          }));
          
          console.log('[AppSettings] User role synchronized successfully:', userRoleInfo.primaryRole);
        } else {
          // Fallback to basic user role
          console.log('[AppSettings] No role info found, setting default user role');
          setSettings(prevSettings => ({
            ...prevSettings,
            user: {
              ...prevSettings.user,
              role: 'user',
              email: user.email || '',
              username: user.email?.split('@')[0] || '',
              displayName: user.email?.split('@')[0] || ''
            }
          }));
        }
      } catch (roleServiceError) {
        console.warn('[AppSettings] Role service failed, using session data:', roleServiceError);
        
        // Final fallback: use session data
        setSettings(prevSettings => ({
          ...prevSettings,
          user: {
            ...prevSettings.user,
            role: 'user',
            email: user.email || '',
            username: user.email?.split('@')[0] || '',
            displayName: user.email?.split('@')[0] || ''
          }
        }));
      }
    } catch (error) {
      console.error('[AppSettings] Error syncing user role:', error);
    } finally {
      setUserSyncInProgress(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to load from Supabase system_settings table first
      const { data: dbSettings } = await supabase
        .from('system_settings')
        .select('*')
        .maybeSingle();

      if (dbSettings) {
        // Merge database settings with defaults
        const loadedSettings = {
          ...defaultSettings,
          theme: { ...defaultSettings.theme, ...(dbSettings.value as any)?.theme_settings || {} },
          notifications: { ...defaultSettings.notifications, ...(dbSettings.value as any)?.notification_settings || {} },
          system: { ...defaultSettings.system, ...(dbSettings.value as any)?.system_settings || {} },
          user: { ...defaultSettings.user, ...(dbSettings.value as any)?.user_settings || {} },
          ai: { ...defaultSettings.ai, ...(dbSettings.value as any)?.ai_settings || {} }
        };
        setSettings(loadedSettings);
      } else {
        // Fallback to localStorage for backwards compatibility
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } else {
          setSettings(defaultSettings);
        }
      }
      
      // Sync user role if user is authenticated
      if (user) {
        await syncUserRole(user.id);
      }
      
    } catch (error) {
      console.error('Error loading settings:', error);
      // Final fallback to localStorage
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch {
          setSettings(defaultSettings);
        }
      } else {
        setSettings(defaultSettings);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      // Try to save to database first
      const { data: yachtProfile } = await supabase
        .from('yacht_profiles')
        .select('id')
        .maybeSingle();

      if (yachtProfile) {
        const settingsToUpsert = {
          key: 'app_settings',
          category: 'system',
          value: {
            theme_settings: newSettings.theme,
            notification_settings: newSettings.notifications,
            system_settings: newSettings.system,
            user_settings: newSettings.user,
            ai_settings: newSettings.ai
          } as unknown as Json
        };

        const { error } = await supabase
          .from('system_settings')
          .upsert(settingsToUpsert);
        
        if (error) {
          console.error('Database save error:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to save to database, using localStorage:', error);
    }
    
    // Always save to localStorage as backup
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const updateThemeSetting = async (key: keyof ThemeSettings, value: any) => {
    const newSettings = {
      ...settings,
      theme: { ...settings.theme, [key]: value }
    };
    setSettings(newSettings);
    
    // Sync with next-themes
    if (key === 'theme') {
      setTheme(value === 'auto' ? 'system' : value);
    }
    
    await saveSettings(newSettings);
    broadcastUpdate('appSettings', { category: 'theme', key, value });
    toast.success('Theme setting updated');
  };

  const updateNotificationSetting = async (key: keyof NotificationSettings, value: any) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, [key]: value }
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
    broadcastUpdate('appSettings', { category: 'notifications', key, value });
    toast.success('Notification setting updated');
  };

  const updateSystemSetting = async (key: keyof SystemSettings, value: any) => {
    const newSettings = {
      ...settings,
      system: { ...settings.system, [key]: value }
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
    broadcastUpdate('appSettings', { category: 'system', key, value });
    toast.success('System setting updated');
  };

  const updateUserSetting = async (key: keyof UserSettings, value: any) => {
    const newSettings = {
      ...settings,
      user: { ...settings.user, [key]: value }
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
    broadcastUpdate('appSettings', { category: 'user', key, value });
    toast.success('User setting updated');
  };

  const updateAISetting = async (key: keyof AISettings, value: any) => {
    const newSettings = {
      ...settings,
      ai: { ...settings.ai, [key]: value }
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
    broadcastUpdate('appSettings', { category: 'ai', key, value });
    toast.success('AI setting updated');
  };

  const resetSettings = async () => {
    setSettings(defaultSettings);
    await saveSettings(defaultSettings);
    localStorage.removeItem('appSettings');
    broadcastUpdate('appSettings', { action: 'reset' });
    toast.success('Settings reset to defaults');
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = async (settingsJson: string): Promise<boolean> => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      const mergedSettings = { ...defaultSettings, ...importedSettings };
      setSettings(mergedSettings);
      await saveSettings(mergedSettings);
      broadcastUpdate('appSettings', { action: 'import' });
      toast.success('Settings imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      toast.error('Failed to import settings');
      return false;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
    toast.success('Settings refreshed');
  };

  const isSettingEnabled = (category: string, setting: string) => {
    const categorySettings = settings[category as keyof AppSettings];
    if (typeof categorySettings === 'object' && categorySettings !== null) {
      return (categorySettings as any)[setting] === true;
    }
    return false;
  };

  // Apply theme changes to document and sync with next-themes
  useEffect(() => {
    // Sync app settings with next-themes
    if (settings.theme.theme !== (theme === 'system' ? 'auto' : theme)) {
      setTheme(settings.theme.theme === 'auto' ? 'system' : settings.theme.theme);
    }
    
    // Apply color scheme
    document.documentElement.setAttribute('data-color-scheme', settings.theme.colorScheme);
    
    // Apply compact mode
    if (settings.theme.compactMode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }
    
    // Apply animations
    if (!settings.theme.animations) {
      document.documentElement.classList.add('no-animations');
    } else {
      document.documentElement.classList.remove('no-animations');
    }
  }, [settings.theme, theme, setTheme]);

  const value = {
    settings,
    loading,
    updateThemeSetting,
    updateNotificationSetting,
    updateSystemSetting,
    updateUserSetting,
    updateAISetting,
    resetSettings,
    exportSettings,
    importSettings,
    isSettingEnabled,
    refreshSettings
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};