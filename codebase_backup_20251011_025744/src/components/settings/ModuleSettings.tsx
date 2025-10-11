import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModuleSettings } from '@/contexts/ModuleSettingsContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useUnifiedSettings } from '@/contexts/UnifiedSettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Wrench, 
  DollarSign, 
  FileText, 
  Navigation, 
  Settings,
  Clock,
  AlertTriangle,
  TrendingUp,
  Shield,
  Package
} from 'lucide-react';

export const ModuleSettings = () => {
  const { 
    settings,
    updateCrewSetting,
    updateMaintenanceSetting,
    updateFinanceSetting,
    updateDocumentsSetting,
    updateNavigationSetting
  } = useModuleSettings();
  
  const { inventorySettings, updateInventorySetting } = useUnifiedSettings();
  const { t } = useLanguage();
  
  const { currency } = useCurrency();

  const handleSettingUpdate = (module: string, key: string, value: any) => {
    switch (module) {
      case 'crew':
        updateCrewSetting(key as any, value);
        break;
      case 'maintenance':
        updateMaintenanceSetting(key as any, value);
        break;
      case 'finance':
        updateFinanceSetting(key as any, value);
        break;
      case 'documents':
        updateDocumentsSetting(key as any, value);
        break;
      case 'navigation':
        updateNavigationSetting(key as any, value);
        break;
    }
    
    toast({
      title: "Module Setting Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated for ${module}.`
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Module Settings</h2>
        <p className="text-muted-foreground">Configure settings for each module using {currency} currency</p>
      </div>

      <Tabs defaultValue="crew" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Crew Settings */}
        <TabsContent value="crew" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Crew Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-assign">Auto Assign Tasks</Label>
                    <p className="text-sm text-muted-foreground">Automatically assign tasks to crew</p>
                  </div>
                  <Switch
                    id="auto-assign"
                    checked={settings.crew.autoAssignTasks}
                    onCheckedChange={(checked) => handleSettingUpdate('crew', 'autoAssignTasks', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="skill-scheduling">Skill-Based Scheduling</Label>
                    <p className="text-sm text-muted-foreground">Schedule based on crew skills</p>
                  </div>
                  <Switch
                    id="skill-scheduling"
                    checked={settings.crew.skillBasedScheduling}
                    onCheckedChange={(checked) => handleSettingUpdate('crew', 'skillBasedScheduling', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="overtime-alerts">Overtime Alerts</Label>
                    <p className="text-sm text-muted-foreground">Alert when overtime threshold reached</p>
                  </div>
                  <Switch
                    id="overtime-alerts"
                    checked={settings.crew.overtimeAlerts}
                    onCheckedChange={(checked) => handleSettingUpdate('crew', 'overtimeAlerts', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift-duration">Default Shift Duration (hours)</Label>
                  <Input
                    id="shift-duration"
                    type="number"
                    value={settings.crew.defaultShiftDuration}
                    onChange={(e) => handleSettingUpdate('crew', 'defaultShiftDuration', parseInt(e.target.value))}
                    min="1"
                    max="24"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Compliance & Safety</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="certificate-tracking">Certificate Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track crew certifications</p>
                  </div>
                  <Switch
                    id="certificate-tracking"
                    checked={settings.crew.certificateTracking}
                    onCheckedChange={(checked) => handleSettingUpdate('crew', 'certificateTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="performance-monitoring">Performance Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Monitor crew performance</p>
                  </div>
                  <Switch
                    id="performance-monitoring"
                    checked={settings.crew.performanceMonitoring}
                    onCheckedChange={(checked) => handleSettingUpdate('crew', 'performanceMonitoring', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emergency-contact">Emergency Contact Required</Label>
                    <p className="text-sm text-muted-foreground">Require emergency contact info</p>
                  </div>
                  <Switch
                    id="emergency-contact"
                    checked={settings.crew.emergencyContactRequired}
                    onCheckedChange={(checked) => handleSettingUpdate('crew', 'emergencyContactRequired', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maintenance Settings */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Maintenance Operations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="predictive-mode">Predictive Maintenance</Label>
                    <p className="text-sm text-muted-foreground">AI-powered maintenance predictions</p>
                  </div>
                  <Switch
                    id="predictive-mode"
                    checked={settings.maintenance.predictiveMode}
                    onCheckedChange={(checked) => handleSettingUpdate('maintenance', 'predictiveMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-scheduling">Auto Scheduling</Label>
                    <p className="text-sm text-muted-foreground">Automatically schedule maintenance</p>
                  </div>
                  <Switch
                    id="auto-scheduling"
                    checked={settings.maintenance.autoScheduling}
                    onCheckedChange={(checked) => handleSettingUpdate('maintenance', 'autoScheduling', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-interval">Default Maintenance Interval (days)</Label>
                  <Input
                    id="maintenance-interval"
                    type="number"
                    value={settings.maintenance.defaultMaintenanceInterval}
                    onChange={(e) => handleSettingUpdate('maintenance', 'defaultMaintenanceInterval', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Cost & Inventory Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="cost-tracking">Cost Tracking ({currency})</Label>
                    <p className="text-sm text-muted-foreground">Track maintenance costs</p>
                  </div>
                  <Switch
                    id="cost-tracking"
                    checked={settings.maintenance.costTracking}
                    onCheckedChange={(checked) => handleSettingUpdate('maintenance', 'costTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="part-inventory">Parts Inventory Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track spare parts inventory</p>
                  </div>
                  <Switch
                    id="part-inventory"
                    checked={settings.maintenance.partInventoryTracking}
                    onCheckedChange={(checked) => handleSettingUpdate('maintenance', 'partInventoryTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="warranty-tracking">Warranty Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track equipment warranties</p>
                  </div>
                  <Switch
                    id="warranty-tracking"
                    checked={settings.maintenance.warrantyTracking}
                    onCheckedChange={(checked) => handleSettingUpdate('maintenance', 'warrantyTracking', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Finance Settings */}
        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Financial Operations ({currency})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-expense">Auto Expense Tracking</Label>
                    <p className="text-sm text-muted-foreground">Automatically track expenses</p>
                  </div>
                  <Switch
                    id="auto-expense"
                    checked={settings.finance.autoExpenseTracking}
                    onCheckedChange={(checked) => handleSettingUpdate('finance', 'autoExpenseTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="budget-alerts">Budget Alerts</Label>
                    <p className="text-sm text-muted-foreground">Alert when budget limits reached</p>
                  </div>
                  <Switch
                    id="budget-alerts"
                    checked={settings.finance.budgetAlerts}
                    onCheckedChange={(checked) => handleSettingUpdate('finance', 'budgetAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="currency-conversion">Currency Conversion</Label>
                    <p className="text-sm text-muted-foreground">Auto convert to {currency}</p>
                  </div>
                  <Switch
                    id="currency-conversion"
                    checked={settings.finance.currencyConversion}
                    onCheckedChange={(checked) => handleSettingUpdate('finance', 'currencyConversion', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="financial-reporting">Financial Reporting</Label>
                    <p className="text-sm text-muted-foreground">Generate financial reports</p>
                  </div>
                  <Switch
                    id="financial-reporting"
                    checked={settings.finance.financialReporting}
                    onCheckedChange={(checked) => handleSettingUpdate('finance', 'financialReporting', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Invoicing & Compliance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="invoice-generation">Invoice Generation</Label>
                    <p className="text-sm text-muted-foreground">Auto generate invoices</p>
                  </div>
                  <Switch
                    id="invoice-generation"
                    checked={settings.finance.invoiceGeneration}
                    onCheckedChange={(checked) => handleSettingUpdate('finance', 'invoiceGeneration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tax-calculation">Tax Calculation</Label>
                    <p className="text-sm text-muted-foreground">Calculate taxes automatically</p>
                  </div>
                  <Switch
                    id="tax-calculation"
                    checked={settings.finance.taxCalculation}
                    onCheckedChange={(checked) => handleSettingUpdate('finance', 'taxCalculation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="expense-approval">Expense Approval Workflow</Label>
                    <p className="text-sm text-muted-foreground">Require approval for expenses</p>
                  </div>
                  <Switch
                    id="expense-approval"
                    checked={settings.finance.expenseApprovalWorkflow}
                    onCheckedChange={(checked) => handleSettingUpdate('finance', 'expenseApprovalWorkflow', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Settings */}
        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Document Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-versioning">Auto Versioning</Label>
                    <p className="text-sm text-muted-foreground">Automatically version documents</p>
                  </div>
                  <Switch
                    id="auto-versioning"
                    checked={settings.documents.autoVersioning}
                    onCheckedChange={(checked) => handleSettingUpdate('documents', 'autoVersioning', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="expiry-tracking">Expiry Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track document expiration</p>
                  </div>
                  <Switch
                    id="expiry-tracking"
                    checked={settings.documents.expiryTracking}
                    onCheckedChange={(checked) => handleSettingUpdate('documents', 'expiryTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="document-sharing">Document Sharing</Label>
                    <p className="text-sm text-muted-foreground">Allow document sharing</p>
                  </div>
                  <Switch
                    id="document-sharing"
                    checked={settings.documents.documentSharing}
                    onCheckedChange={(checked) => handleSettingUpdate('documents', 'documentSharing', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention-period">Retention Period (days)</Label>
                  <Input
                    id="retention-period"
                    type="number"
                    value={settings.documents.retentionPeriod}
                    onChange={(e) => handleSettingUpdate('documents', 'retentionPeriod', parseInt(e.target.value))}
                    min="1"
                    max="3650"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security & Compliance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="encryption">Encryption Enabled</Label>
                    <p className="text-sm text-muted-foreground">Encrypt sensitive documents</p>
                  </div>
                  <Switch
                    id="encryption"
                    checked={settings.documents.encryptionEnabled}
                    onCheckedChange={(checked) => handleSettingUpdate('documents', 'encryptionEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="backup-enabled">Backup Enabled</Label>
                    <p className="text-sm text-muted-foreground">Auto backup documents</p>
                  </div>
                  <Switch
                    id="backup-enabled"
                    checked={settings.documents.backupEnabled}
                    onCheckedChange={(checked) => handleSettingUpdate('documents', 'backupEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="digital-signatures">Digital Signatures</Label>
                    <p className="text-sm text-muted-foreground">Enable digital signing</p>
                  </div>
                  <Switch
                    id="digital-signatures"
                    checked={settings.documents.digitalSignatures}
                    onCheckedChange={(checked) => handleSettingUpdate('documents', 'digitalSignatures', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Navigation Settings */}
        <TabsContent value="navigation" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5" />
                  <span>Navigation Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gps-tracking">GPS Tracking</Label>
                    <p className="text-sm text-muted-foreground">Real-time GPS tracking</p>
                  </div>
                  <Switch
                    id="gps-tracking"
                    checked={settings.navigation.gpsTracking}
                    onCheckedChange={(checked) => handleSettingUpdate('navigation', 'gpsTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-pilot">Auto Pilot Integration</Label>
                    <p className="text-sm text-muted-foreground">Connect with autopilot system</p>
                  </div>
                  <Switch
                    id="auto-pilot"
                    checked={settings.navigation.autoPilotIntegration}
                    onCheckedChange={(checked) => handleSettingUpdate('navigation', 'autoPilotIntegration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weather-overlay">Weather Overlay</Label>
                    <p className="text-sm text-muted-foreground">Show weather on navigation</p>
                  </div>
                  <Switch
                    id="weather-overlay"
                    checked={settings.navigation.weatherOverlay}
                    onCheckedChange={(checked) => handleSettingUpdate('navigation', 'weatherOverlay', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="route-optimization">Route Optimization</Label>
                    <p className="text-sm text-muted-foreground">AI-powered route optimization</p>
                  </div>
                  <Switch
                    id="route-optimization"
                    checked={settings.navigation.routeOptimization}
                    onCheckedChange={(checked) => handleSettingUpdate('navigation', 'routeOptimization', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Safety & Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="collision-detection">Collision Detection</Label>
                    <p className="text-sm text-muted-foreground">Automatic collision warnings</p>
                  </div>
                  <Switch
                    id="collision-detection"
                    checked={settings.navigation.collisionDetection}
                    onCheckedChange={(checked) => handleSettingUpdate('navigation', 'collisionDetection', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="anchor-watch">Anchor Watch</Label>
                    <p className="text-sm text-muted-foreground">Monitor anchor position</p>
                  </div>
                  <Switch
                    id="anchor-watch"
                    checked={settings.navigation.anchorWatch}
                    onCheckedChange={(checked) => handleSettingUpdate('navigation', 'anchorWatch', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emergency-procedures">Emergency Procedures</Label>
                    <p className="text-sm text-muted-foreground">Emergency protocol guidance</p>
                  </div>
                  <Switch
                    id="emergency-procedures"
                    checked={settings.navigation.emergencyProcedures}
                    onCheckedChange={(checked) => handleSettingUpdate('navigation', 'emergencyProcedures', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Settings */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Inventory Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-reorder">Auto Reorder</Label>
                    <p className="text-sm text-muted-foreground">Automatically reorder low stock items</p>
                  </div>
                  <Switch
                    id="auto-reorder"
                    checked={inventorySettings.autoReorder}
                    onCheckedChange={(checked) => updateInventorySetting('autoReorder', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
                  <Input
                    id="low-stock-threshold"
                    type="number"
                    value={inventorySettings.lowStockThreshold}
                    onChange={(e) => updateInventorySetting('lowStockThreshold', parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="category-management">Category Management</Label>
                    <p className="text-sm text-muted-foreground">Enable category-based organization</p>
                  </div>
                  <Switch
                    id="category-management"
                    checked={inventorySettings.categoryManagement}
                    onCheckedChange={(checked) => updateInventorySetting('categoryManagement', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="bulk-operations">Bulk Operations</Label>
                    <p className="text-sm text-muted-foreground">Enable bulk import/export</p>
                  </div>
                  <Switch
                    id="bulk-operations"
                    checked={inventorySettings.bulkOperations}
                    onCheckedChange={(checked) => updateInventorySetting('bulkOperations', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Advanced Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="barcode-scanning">Barcode Scanning</Label>
                    <p className="text-sm text-muted-foreground">Enable barcode scanning features</p>
                  </div>
                  <Switch
                    id="barcode-scanning"
                    checked={inventorySettings.barcodeScanning}
                    onCheckedChange={(checked) => updateInventorySetting('barcodeScanning', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="location-tracking">Location Tracking</Label>
                    <p className="text-sm text-muted-foreground">Track item locations</p>
                  </div>
                  <Switch
                    id="location-tracking"
                    checked={inventorySettings.locationTracking}
                    onCheckedChange={(checked) => updateInventorySetting('locationTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="cost-tracking">Cost Tracking ({currency})</Label>
                    <p className="text-sm text-muted-foreground">Track inventory costs</p>
                  </div>
                  <Switch
                    id="cost-tracking"
                    checked={inventorySettings.costTracking}
                    onCheckedChange={(checked) => updateInventorySetting('costTracking', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="expiry-alerts">Expiry Alerts</Label>
                    <p className="text-sm text-muted-foreground">Alert for expiring items</p>
                  </div>
                  <Switch
                    id="expiry-alerts"
                    checked={inventorySettings.expiryAlerts}
                    onCheckedChange={(checked) => updateInventorySetting('expiryAlerts', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};