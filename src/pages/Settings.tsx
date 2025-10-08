import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, X, AlertTriangle } from "lucide-react";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { SystemSettings } from "@/components/settings/SystemSettings";

import { ModuleSettings } from "@/components/settings/ModuleSettings";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

import { useUnifiedSettings } from "@/contexts/UnifiedSettingsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  
  const { 
    hasPendingChanges, 
    saveAllSettings, 
    resetPendingChanges, 
    userRole, 
    isAuthorized 
  } = useUnifiedSettings();
  const { t } = useLanguage();

  // Read URL parameter on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    const validTabs = ['general', 'modules', 'security', 'system'];
    if (isAuthorized('superadmin')) {
      validTabs.push('superadmin');
    }
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search, isAuthorized]);

  const handleSaveSettings = async () => {
    setSaving(true);
    const success = await saveAllSettings();
    if (success) {
      toast({
        title: t('save.success'),
        description: "All settings have been applied successfully."
      });
    }
    setSaving(false);
  };

  const handleDiscardChanges = () => {
    resetPendingChanges();
  };

  // Inventory handlers
  const handleBulkImport = (file: File) => {
    toast({
      title: "Import Started",
      description: "Processing your inventory file..."
    });
  };

  const handleBulkExport = (format: string) => {
    toast({
      title: "Export Started",
      description: `Generating ${format.toUpperCase()} export file...`
    });
  };

  const handlePrintLabels = (items: string[]) => {
    toast({
      title: "Print Labels",
      description: `Printing ${items.length || 'test'} labels...`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <nav aria-label="breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </nav>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
              <Settings className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('settings.title')}</h1>
              <p className="text-muted-foreground">System configuration and preferences</p>
              {userRole === 'superadmin' && (
                <Badge variant="secondary" className="mt-1">Super Administrator</Badge>
              )}
            </div>
          </div>

          {hasPendingChanges && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning">{t('changes.pending')}</span>
              </div>
              <Button onClick={handleDiscardChanges} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                {t('settings.discard')}
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : t('settings.save')}
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isAuthorized('superadmin') ? 'grid-cols-5' : 'grid-cols-4'}`} >
            <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
            <TabsTrigger value="modules">{t('settings.modules')}</TabsTrigger>
            <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
            <TabsTrigger value="system">{t('settings.system')}</TabsTrigger>
            {isAuthorized('superadmin') && (
              <TabsTrigger value="superadmin">SuperAdmin</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            <ModuleSettings />
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <GeneralSettings />
          </TabsContent>


          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemSettings />
          </TabsContent>

          {isAuthorized('superadmin') && (
            <TabsContent value="superadmin" className="space-y-6">
              <div className="rounded-xl border bg-card p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-card-foreground">Super Admin Control Hub</h2>
                    <p className="text-muted-foreground mt-1">Open the enterprise control hub to manage AI, providers, keys, and system status.</p>
                  </div>
                  <Button asChild>
                    <Link to="/superadmin">Open Super Admin</Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
