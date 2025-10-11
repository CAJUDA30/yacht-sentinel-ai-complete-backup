import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { SuperAdminAIPanel } from '@/components/SuperAdminAIPanel';
import { 
  Settings, 
  Brain, 
  Database, 
  Users, 
  Package, 
  Shield,
  Sliders,
  Palette,
  Bell,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

export const AdvancedSettings = () => {
  const { 
    settings, 
    loading,
    updateAISetting,
    updateSystemSetting,
    updateThemeSetting,
    updateNotificationSetting
  } = useAppSettings();

  const handleAISettingChange = async (key: string, value: any) => {
    try {
      await updateAISetting(key as any, value);
    } catch (error) {
      toast.error('Failed to update AI setting');
    }
  };

  const handleSystemSettingChange = async (key: string, value: any) => {
    try {
      await updateSystemSetting(key as any, value);
    } catch (error) {
      toast.error('Failed to update system setting');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Settings className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading advanced settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Settings</h2>
          <p className="text-muted-foreground">
            Configure advanced system settings and AI behavior
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Shield className="h-4 w-4 mr-2" />
          Production Ready
        </Badge>
      </div>

      <Tabs defaultValue="ai-settings" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-settings" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>AI Settings</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
          <TabsTrigger value="ui-theme" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>UI & Theme</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="superadmin" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>SuperAdmin</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Settings */}
        <TabsContent value="ai-settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Model Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="defaultModel">Default AI Model</Label>
                  <Input
                    id="defaultModel"
                    value={settings.ai.defaultModel}
                    onChange={(e) => handleAISettingChange('defaultModel', e.target.value)}
                    placeholder="openai"
                  />
                </div>

                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={settings.ai.maxTokens}
                    onChange={(e) => handleAISettingChange('maxTokens', parseInt(e.target.value))}
                    min="100"
                    max="32000"
                  />
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={settings.ai.temperature}
                    onChange={(e) => handleAISettingChange('temperature', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="costLimit">Daily Cost Limit ($)</Label>
                  <Input
                    id="costLimit"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.ai.costLimitPerDay}
                    onChange={(e) => handleAISettingChange('costLimitPerDay', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sliders className="h-5 w-5" />
                  <span>Consensus & Automation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="consensusThreshold">Consensus Threshold</Label>
                  <Input
                    id="consensusThreshold"
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1"
                    value={settings.ai.consensusThreshold}
                    onChange={(e) => handleAISettingChange('consensusThreshold', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(settings.ai.consensusThreshold * 100).toFixed(0)}% agreement required
                  </p>
                </div>

                <div>
                  <Label htmlFor="autoExecuteThreshold">Auto Execute Threshold</Label>
                  <Input
                    id="autoExecuteThreshold"
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1"
                    value={settings.ai.autoExecuteThreshold}
                    onChange={(e) => handleAISettingChange('autoExecuteThreshold', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(settings.ai.autoExecuteThreshold * 100).toFixed(0)}% confidence for auto-execution
                  </p>
                </div>

                <div>
                  <Label htmlFor="humanApprovalThreshold">Human Approval Threshold</Label>
                  <Input
                    id="humanApprovalThreshold"
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1"
                    value={settings.ai.humanApprovalThreshold}
                    onChange={(e) => handleAISettingChange('humanApprovalThreshold', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {(settings.ai.humanApprovalThreshold * 100).toFixed(0)}% confidence requires human approval
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enablePredictive">Predictive Analysis</Label>
                    <Switch
                      id="enablePredictive"
                      checked={settings.ai.enablePredictive}
                      onCheckedChange={(checked) => handleAISettingChange('enablePredictive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableProactive">Proactive Monitoring</Label>
                    <Switch
                      id="enableProactive"
                      checked={settings.ai.enableProactive}
                      onCheckedChange={(checked) => handleAISettingChange('enableProactive', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    min="30"
                    max="3650"
                    value={settings.system.dataRetentionDays}
                    onChange={(e) => handleSystemSettingChange('dataRetentionDays', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxStorage">Max Storage (GB)</Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    min="10"
                    max="1000"
                    value={settings.system.maxStorageGB}
                    onChange={(e) => handleSystemSettingChange('maxStorageGB', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoSave">Auto Save</Label>
                    <Switch
                      id="autoSave"
                      checked={settings.system.autoSave}
                      onCheckedChange={(checked) => handleSystemSettingChange('autoSave', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoBackup">Auto Backup</Label>
                    <Switch
                      id="autoBackup"
                      checked={settings.system.autoBackup}
                      onCheckedChange={(checked) => handleSystemSettingChange('autoBackup', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="offlineMode">Offline Mode</Label>
                    <Switch
                      id="offlineMode"
                      checked={settings.system.offlineMode}
                      onCheckedChange={(checked) => handleSystemSettingChange('offlineMode', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Localization</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={settings.system.language}
                    onChange={(e) => handleSystemSettingChange('language', e.target.value)}
                    placeholder="en"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={settings.system.timezone}
                    onChange={(e) => handleSystemSettingChange('timezone', e.target.value)}
                    placeholder="UTC"
                  />
                </div>

                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input
                    id="dateFormat"
                    value={settings.system.dateFormat}
                    onChange={(e) => handleSystemSettingChange('dateFormat', e.target.value)}
                    placeholder="dd/mm/yyyy"
                  />
                </div>

                <div>
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Input
                    id="timeFormat"
                    value={settings.system.timeFormat}
                    onChange={(e) => handleSystemSettingChange('timeFormat', e.target.value)}
                    placeholder="24h"
                  />
                </div>

                <div>
                  <Label htmlFor="units">Units</Label>
                  <Input
                    id="units"
                    value={settings.system.units}
                    onChange={(e) => handleSystemSettingChange('units', e.target.value)}
                    placeholder="metric"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* UI & Theme Settings */}
        <TabsContent value="ui-theme" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Theme Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="colorScheme">Color Scheme</Label>
                  <Input
                    id="colorScheme"
                    value={settings.theme.colorScheme}
                    onChange={(e) => updateThemeSetting('colorScheme', e.target.value)}
                    placeholder="ocean"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animations">Animations</Label>
                    <Switch
                      id="animations"
                      checked={settings.theme.animations}
                      onCheckedChange={(checked) => updateThemeSetting('animations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compactMode">Compact Mode</Label>
                    <Switch
                      id="compactMode"
                      checked={settings.theme.compactMode}
                      onCheckedChange={(checked) => updateThemeSetting('compactMode', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="globalNotifications">Global Notifications</Label>
                    <Switch
                      id="globalNotifications"
                      checked={settings.notifications.globalNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('globalNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="soundEnabled">Sound</Label>
                    <Switch
                      id="soundEnabled"
                      checked={settings.notifications.soundEnabled}
                      onCheckedChange={(checked) => updateNotificationSetting('soundEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="vibrationEnabled">Vibration</Label>
                    <Switch
                      id="vibrationEnabled"
                      checked={settings.notifications.vibrationEnabled}
                      onCheckedChange={(checked) => updateNotificationSetting('vibrationEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="desktopNotifications">Desktop Notifications</Label>
                    <Switch
                      id="desktopNotifications"
                      checked={settings.notifications.desktopNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('desktopNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <Switch
                      id="emailNotifications"
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="criticalAlertsOnly">Critical Alerts Only</Label>
                    <Switch
                      id="criticalAlertsOnly"
                      checked={settings.notifications.criticalAlertsOnly}
                      onCheckedChange={(checked) => updateNotificationSetting('criticalAlertsOnly', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SuperAdmin Panel */}
        <TabsContent value="superadmin">
          {settings.user.role === 'superadmin' ? (
            <SuperAdminAIPanel />
          ) : (
            <Card className="shadow-elegant border-border/50">
              <CardHeader>
                <CardTitle className="text-center text-2xl text-destructive">
                  Access Denied
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  You need SuperAdmin privileges to access this panel.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};