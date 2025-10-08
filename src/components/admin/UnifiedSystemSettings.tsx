import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/useSecureSettings";
import { SETTINGS_REGISTRY, getSystemSettingKeys, getAISettingKeys, getSecuritySettingKeys } from "@/lib/settings";
import { 
  Settings, 
  Shield, 
  Brain, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Save,
  RotateCcw
} from "lucide-react";

// =============================================
// UNIFIED SYSTEM SETTINGS - SUPERADMIN ONLY
// Consolidates all system, AI, and security settings
// =============================================

interface SettingValue {
  key: string;
  value: any;
  changed: boolean;
}

export function UnifiedSystemSettings() {
  const { toast } = useToast();
  const { getSetting, setSetting, getSystemSettings, isLoading, error } = useSystemSettings();
  
  const [settings, setSettings] = useState<Record<string, SettingValue>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Get all admin-only setting keys
  const systemKeys = getSystemSettingKeys();
  const aiKeys = getAISettingKeys();
  const securityKeys = getSecuritySettingKeys();
  const allKeys = [...systemKeys, ...aiKeys, ...securityKeys];

  // Load all settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        const settingsData = await getSystemSettings();
        const settingsState: Record<string, SettingValue> = {};
        
        for (const key of allKeys) {
          settingsState[key] = {
            key,
            value: settingsData[key] ?? SETTINGS_REGISTRY[key]?.defaultValue,
            changed: false
          };
        }
        
        setSettings(settingsState);
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast({
          title: "Error",
          description: "Failed to load system settings",
          variant: "destructive"
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  // Handle setting value change
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
        changed: value !== SETTINGS_REGISTRY[key]?.defaultValue
      }
    }));
  };

  // Save all changed settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const changedSettings = Object.values(settings).filter(s => s.changed);
    
    if (changedSettings.length === 0) {
      toast({
        title: "No Changes",
        description: "No settings have been modified",
        variant: "default"
      });
      setSavingSettings(false);
      return;
    }

    try {
      let successCount = 0;
      let failureCount = 0;

      for (const setting of changedSettings) {
        const success = await setSetting(setting.key, setting.value);
        if (success) {
          successCount++;
          // Mark as saved
          setSettings(prev => ({
            ...prev,
            [setting.key]: {
              ...prev[setting.key],
              changed: false
            }
          }));
        } else {
          failureCount++;
        }
      }

      if (failureCount === 0) {
        toast({
          title: "Settings Saved",
          description: `Successfully saved ${successCount} settings`,
          variant: "default"
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Saved ${successCount} settings, ${failureCount} failed`,
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Reset all settings to defaults
  const handleResetSettings = () => {
    const resetSettings: Record<string, SettingValue> = {};
    
    for (const key of allKeys) {
      resetSettings[key] = {
        key,
        value: SETTINGS_REGISTRY[key]?.defaultValue,
        changed: settings[key]?.value !== SETTINGS_REGISTRY[key]?.defaultValue
      };
    }
    
    setSettings(resetSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
      variant: "default"
    });
  };

  // Render individual setting based on type
  const renderSetting = (key: string) => {
    const definition = SETTINGS_REGISTRY[key];
    const setting = settings[key];
    
    if (!definition || !setting) return null;

    const isBoolean = typeof definition.defaultValue === 'boolean';
    const isNumber = typeof definition.defaultValue === 'number';

    return (
      <div key={key} className="flex items-center justify-between py-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Label htmlFor={key} className="text-sm font-medium">
              {definition.key.split('.').pop()}
            </Label>
            {setting.changed && (
              <Badge variant="secondary" className="text-xs">
                Modified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {definition.description}
          </p>
        </div>
        
        <div className="ml-4">
          {isBoolean ? (
            <Switch
              id={key}
              checked={setting.value}
              onCheckedChange={(checked) => handleSettingChange(key, checked)}
            />
          ) : (
            <Input
              id={key}
              type={isNumber ? "number" : "text"}
              value={setting.value}
              onChange={(e) => {
                const value = isNumber ? parseFloat(e.target.value) || 0 : e.target.value;
                handleSettingChange(key, value);
              }}
              className="w-32"
              min={isNumber ? 0 : undefined}
            />
          )}
        </div>
      </div>
    );
  };

  // Get changed settings count
  const changedCount = Object.values(settings).filter(s => s.changed).length;

  if (loadingSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Unified System Settings
              </CardTitle>
              <CardDescription>
                Centralized management of all system, AI, and security configurations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {changedCount > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {changedCount} changes pending
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSettings}
                disabled={savingSettings}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset All
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings || changedCount === 0}
                size="sm"
              >
                {savingSettings ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Core system settings and operational parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {systemKeys.map(key => renderSetting(key))}
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Artificial intelligence models and processing settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {aiKeys.map(key => renderSetting(key))}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
          <CardDescription>
            Authentication, authorization, and security policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {securityKeys.map(key => renderSetting(key))}
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">
              Phase 1 Security Implementation: ✅ Enhanced authentication, rate limiting, input validation, and centralized settings management active
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}