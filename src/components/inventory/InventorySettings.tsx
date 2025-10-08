import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useInventorySettings } from "./InventorySettingsContext";
import {
  Settings,
  Upload,
  Download,
  QrCode,
  Package,
  Bell,
  Database,
  Smartphone,
  Printer,
  FileText,
  Camera,
  Plus,
  Trash2
} from "lucide-react";

interface InventorySettingsProps {
  onBulkImport: (file: File) => void;
  onBulkExport: (format: string) => void;
  onPrintLabels: (items: string[]) => void;
}

export const InventorySettings = ({
  onBulkImport,
  onBulkExport,
  onPrintLabels
}: InventorySettingsProps) => {
  const { settings, updateSetting } = useInventorySettings();
  const [customCategories, setCustomCategories] = useState([
    "Safety", "Engine", "Hydraulic", "Electrical", "Deck", "Interior", "Electronics", "Navigation"
  ]);

  const [customLocations, setCustomLocations] = useState([
    "Engine Room", "Safety Locker A", "Safety Locker B", "Deck Storage", "Bridge", "Galley", 
    "Tool Room", "Spare Parts", "Electronics Bay", "Anchor Locker"
  ]);

  const [newCategory, setNewCategory] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleSettingUpdate = (key: string, value: any) => {
    updateSetting(key as any, value);
    toast({
      title: "Setting Applied",
      description: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} updated across entire module.`
    });
  };

  const addCategory = () => {
    if (newCategory.trim() && !customCategories.includes(newCategory.trim())) {
      setCustomCategories([...customCategories, newCategory.trim()]);
      setNewCategory("");
      toast({
        title: "Category Added",
        description: `${newCategory} has been added to categories.`
      });
    }
  };

  const removeCategory = (category: string) => {
    setCustomCategories(customCategories.filter(c => c !== category));
    toast({
      title: "Category Removed",
      description: `${category} has been removed from categories.`
    });
  };

  const addLocation = () => {
    if (newLocation.trim() && !customLocations.includes(newLocation.trim())) {
      setCustomLocations([...customLocations, newLocation.trim()]);
      setNewLocation("");
      toast({
        title: "Location Added",
        description: `${newLocation} has been added to locations.`
      });
    }
  };

  const removeLocation = (location: string) => {
    setCustomLocations(customLocations.filter(l => l !== location));
    toast({
      title: "Location Removed",
      description: `${location} has been removed from locations.`
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onBulkImport(file);
      setShowImportDialog(false);
      toast({
        title: "Import Started",
        description: "Processing your inventory file..."
      });
    }
  };

  const handleExport = (format: string) => {
    onBulkExport(format);
    setShowExportDialog(false);
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} export file...`
    });
  };

  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      toast({
        title: "Camera Test Successful",
        description: "Camera access is working properly."
      });
    } catch (error) {
      toast({
        title: "Camera Test Failed",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const generateSampleQR = () => {
    toast({
      title: "QR Code Generated",
      description: "Sample QR code generated successfully."
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inventory Settings</h2>
        <p className="text-muted-foreground">Configure your inventory management system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sku">Auto-generate SKU</Label>
                <p className="text-sm text-muted-foreground">Automatically create SKUs for new items</p>
              </div>
              <Switch
                id="auto-sku"
                checked={settings.autoGenerateSKU}
                onCheckedChange={(checked) => handleSettingUpdate('autoGenerateSKU', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={settings.defaultCurrency}
                onValueChange={(value) => handleSettingUpdate('defaultCurrency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Low Stock Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => updateSetting('lowStockThreshold', parseInt(e.target.value))}
                min="1"
                max="50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry-days">Expiry Warning (Days)</Label>
              <Input
                id="expiry-days"
                type="number"
                value={settings.expiryWarningDays}
                onChange={(e) => updateSetting('expiryWarningDays', parseInt(e.target.value))}
                min="1"
                max="365"
              />
            </div>
          </CardContent>
        </Card>

        {/* QR Code & Barcode Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="h-5 w-5 mr-2" />
              QR Code & Barcode Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-format">QR Code Format</Label>
              <Select
                value={settings.qrCodeFormat}
                onValueChange={(value) => updateSetting('qrCodeFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-size">QR Code Size</Label>
              <Select
                value={settings.qrCodeSize}
                onValueChange={(value) => updateSetting('qrCodeSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (1")</SelectItem>
                  <SelectItem value="medium">Medium (1.5")</SelectItem>
                  <SelectItem value="large">Large (2")</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="include-qr">Include QR in Labels</Label>
                <p className="text-sm text-muted-foreground">Add QR codes to printed labels</p>
              </div>
              <Switch
                id="include-qr"
                checked={settings.includeQRInLabels}
                onCheckedChange={(checked) => updateSetting('includeQRInLabels', checked)}
              />
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={generateSampleQR} className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                Test QR Generation
              </Button>
              <Button variant="outline" onClick={() => onPrintLabels([])} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Test Label
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email alerts</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="low-stock-alerts">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert when items are low</p>
              </div>
              <Switch
                id="low-stock-alerts"
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => updateSetting('lowStockAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="expiry-alerts">Expiry Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert for expiring items</p>
              </div>
              <Switch
                id="expiry-alerts"
                checked={settings.expiryAlerts}
                onCheckedChange={(checked) => updateSetting('expiryAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance-alerts">Maintenance Alerts</Label>
                <p className="text-sm text-muted-foreground">Alert for maintenance due</p>
              </div>
              <Switch
                id="maintenance-alerts"
                checked={settings.maintenanceAlerts}
                onCheckedChange={(checked) => updateSetting('maintenanceAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Integration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Integration Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="barcode-scanning">Barcode Scanning</Label>
                <p className="text-sm text-muted-foreground">Enable barcode scanner</p>
              </div>
              <Switch
                id="barcode-scanning"
                checked={settings.enableBarcodeScanning}
                onCheckedChange={(checked) => updateSetting('enableBarcodeScanning', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="camera-access">Camera Access</Label>
                <p className="text-sm text-muted-foreground">Allow camera for scanning</p>
              </div>
              <Switch
                id="camera-access"
                checked={settings.cameraAccess}
                onCheckedChange={(checked) => updateSetting('cameraAccess', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="offline-mode">Offline Mode</Label>
                <p className="text-sm text-muted-foreground">Work without internet</p>
              </div>
              <Switch
                id="offline-mode"
                checked={settings.offlineMode}
                onCheckedChange={(checked) => updateSetting('offlineMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">Sync when online</p>
              </div>
              <Switch
                id="auto-sync"
                checked={settings.autoSync}
                onCheckedChange={(checked) => updateSetting('autoSync', checked)}
              />
            </div>

            <Button variant="outline" onClick={testCamera} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Test Camera Access
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Data Management
            </CardTitle>
            <CardDescription>
              Import and export inventory data, manage bulk operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex-col">
                    <Upload className="h-8 w-8 mb-2" />
                    Import Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Inventory Data</DialogTitle>
                    <DialogDescription>
                      Upload a CSV or Excel file with your inventory data
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="import-file">Select File</Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileImport}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Supported formats: CSV, Excel (.xlsx, .xls)</p>
                      <p>Maximum file size: 10MB</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-20 flex-col">
                    <Download className="h-8 w-8 mb-2" />
                    Export Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Inventory Data</DialogTitle>
                    <DialogDescription>
                      Download your inventory data in various formats
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => handleExport('csv')} variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      CSV Format
                    </Button>
                    <Button onClick={() => handleExport('excel')} variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Excel Format
                    </Button>
                    <Button onClick={() => handleExport('pdf')} variant="outline" className="col-span-2">
                      <FileText className="h-4 w-4 mr-2" />
                      PDF Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="h-20 flex-col" onClick={() => onPrintLabels([])}>
                <Printer className="h-8 w-8 mb-2" />
                Print Labels
              </Button>

              <Button variant="outline" className="h-20 flex-col">
                <Database className="h-8 w-8 mb-2" />
                Backup Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Categories & Locations */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Categories & Locations
            </CardTitle>
            <CardDescription>
              Manage custom categories and locations for your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Categories */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Categories</Label>
                  <p className="text-sm text-muted-foreground">Organize items by category</p>
                </div>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add new category..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <Button onClick={addCategory} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {customCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="flex items-center space-x-1">
                      <span>{category}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => removeCategory(category)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Locations</Label>
                  <p className="text-sm text-muted-foreground">Define storage locations</p>
                </div>
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add new location..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                  />
                  <Button onClick={addLocation} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {customLocations.map((location) => (
                    <Badge key={location} variant="secondary" className="flex items-center space-x-1">
                      <span>{location}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => removeLocation(location)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};