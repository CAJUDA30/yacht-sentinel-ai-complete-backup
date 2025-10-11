import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useUnifiedSettings } from '@/contexts/UnifiedSettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency, CURRENCY_SYMBOLS } from '@/contexts/CurrencyContext';
import { toast } from '@/hooks/use-toast';
import { User, Bell, Palette, Globe, RotateCcw, DollarSign } from 'lucide-react';

export const GeneralSettings = () => {
  const { 
    settings, 
    updateThemeSetting, 
    updateNotificationSetting, 
    updateSystemSetting, 
    updateUserSetting,
    resetSettings 
  } = useAppSettings();
  
  const { addPendingChange } = useUnifiedSettings();
  const { t, supportedLanguages } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  const handleSettingUpdate = (category: string, key: string, value: any) => {
    // Handle currency separately through CurrencyContext
    if (key === 'currency') {
      setCurrency(value);
      return;
    }
    
    // Add to pending changes for critical settings like language
    if (category === 'system' && key === 'language') {
      addPendingChange('appSettingsSettings', key, value);
      return;
    }
    
    // For non-critical settings, update immediately for UI responsiveness
    switch (category) {
      case 'theme':
        updateThemeSetting(key as any, value);
        break;
      case 'notifications':
        updateNotificationSetting(key as any, value);
        break;
      case 'system':
        updateSystemSetting(key as any, value);
        break;
      case 'user':
        updateUserSetting(key as any, value);
        break;
    }
  };

  const handleResetSettings = () => {
    resetSettings();
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults."
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>User Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={settings.user.displayName}
                onChange={(e) => handleSettingUpdate('user', 'displayName', e.target.value)}
                placeholder="Enter your display name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.user.email}
                onChange={(e) => handleSettingUpdate('user', 'email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={settings.user.role}
                onValueChange={(value) => handleSettingUpdate('user', 'role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Super Administrator</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Theme & Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.theme.theme}
                onValueChange={(value) => handleSettingUpdate('theme', 'theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-scheme">Color Scheme</Label>
              <Select
                value={settings.theme.colorScheme}
                onValueChange={(value) => handleSettingUpdate('theme', 'colorScheme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="ocean">Ocean</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="animations">Enable Animations</Label>
                <p className="text-sm text-muted-foreground">Smooth transitions and effects</p>
              </div>
              <Switch
                id="animations"
                checked={settings.theme.animations}
                onCheckedChange={(checked) => handleSettingUpdate('theme', 'animations', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <p className="text-sm text-muted-foreground">Reduce spacing and padding</p>
              </div>
              <Switch
                id="compact-mode"
                checked={settings.theme.compactMode}
                onCheckedChange={(checked) => handleSettingUpdate('theme', 'compactMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Global Notifications */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Global Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="global-notifications">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">Master notification switch</p>
              </div>
              <Switch
                id="global-notifications"
                checked={settings.notifications.globalNotifications}
                onCheckedChange={(checked) => handleSettingUpdate('notifications', 'globalNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-enabled">Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">Play sounds for alerts</p>
              </div>
              <Switch
                id="sound-enabled"
                checked={settings.notifications.soundEnabled}
                onCheckedChange={(checked) => handleSettingUpdate('notifications', 'soundEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser desktop notifications</p>
              </div>
              <Switch
                id="desktop-notifications"
                checked={settings.notifications.desktopNotifications}
                onCheckedChange={(checked) => handleSettingUpdate('notifications', 'desktopNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="critical-only">Critical Alerts Only</Label>
                <p className="text-sm text-muted-foreground">Only show critical notifications</p>
              </div>
              <Switch
                id="critical-only"
                checked={settings.notifications.criticalAlertsOnly}
                onCheckedChange={(checked) => handleSettingUpdate('notifications', 'criticalAlertsOnly', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>System Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t('language.label')}</Label>
              <Select
                value={settings.system.language}
                onValueChange={(value) => handleSettingUpdate('system', 'language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName} ({lang.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{t('language.description')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('currency.label')}</Label>
              <Select
                value={currency}
                onValueChange={(value) => handleSettingUpdate('system', 'currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                    <SelectItem key={code} value={code}>
                      {symbol} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{t('currency.description')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select
                value={settings.system.dateFormat}
                onValueChange={(value) => handleSettingUpdate('system', 'dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-format">Time Format</Label>
              <Select
                value={settings.system.timeFormat}
                onValueChange={(value) => handleSettingUpdate('system', 'timeFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="units">Units</Label>
              <Select
                value={settings.system.units}
                onValueChange={(value) => handleSettingUpdate('system', 'units', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric</SelectItem>
                  <SelectItem value="imperial">Imperial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-save">Auto Save</Label>
                <p className="text-sm text-muted-foreground">Automatically save changes</p>
              </div>
              <Switch
                id="auto-save"
                checked={settings.system.autoSave}
                onCheckedChange={(checked) => handleSettingUpdate('system', 'autoSave', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Settings */}
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Reset Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reset all settings to defaults</p>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
            <Button variant="destructive" onClick={handleResetSettings}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};