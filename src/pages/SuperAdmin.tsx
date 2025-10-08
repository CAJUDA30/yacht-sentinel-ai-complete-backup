import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { RefreshCw, CheckCircle2, XCircle, LogOut } from 'lucide-react';
import SecretsManager from '@/components/admin/SecretsManager';
import AIProvidersPanel from '@/components/admin/AIProvidersPanel';
import AIConfigurationManager from '@/components/admin/AIConfigurationManager';
import { SuperAdminAIPanel } from '@/components/SuperAdminAIPanel';
import { SuperAdminLogs } from '@/components/SuperAdminLogs';
import { AppStatusDashboard } from '@/components/AppStatusDashboard';
import UnifiedAIConfigPage from '@/pages/UnifiedAIConfig';
import DevConfigDashboard from '@/pages/DevConfigDashboard';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAIConfig } from '@/hooks/useUnifiedAIConfig';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import EdgeFunctionsPanel from '@/components/admin/EdgeFunctionsPanel';
import UnifiedLogsPanel from '@/components/admin/UnifiedLogsPanel';
import FeatureFlagsCard from '@/components/admin/FeatureFlagsCard';
import DepartmentQuickCards from '@/components/admin/DepartmentQuickCards';
import PermissionsManager from '@/components/admin/PermissionsManager';
import { UnifiedSystemSettings } from '@/components/admin/UnifiedSystemSettings';
import { SecurityStatusDashboard } from '@/components/admin/SecurityStatusDashboard';
import { UnifiedAIOperations } from '@/components/admin/UnifiedAIOperations';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useIsSuperadmin } from '@/hooks/useIsSuperadmin';
import InlineAuthCard from '@/components/auth/InlineAuthCard';
import { supabase } from '@/integrations/supabase/client';
import EmailSettings from '@/components/admin/EmailSettings';
import ProfessionalVisualMappingSystem from '@/components/admin/ProfessionalVisualMappingSystem';
import { Phase3CompletionDashboard } from '@/components/system/Phase3CompletionDashboard';
import Phase4CompletionDashboard from '@/components/system/Phase4CompletionDashboard';
import Phase5CompletionDashboard from '@/components/system/Phase5CompletionDashboard';
import Phase6CompletionDashboard from '@/components/system/Phase6CompletionDashboard';
import { ProductionSystemValidator } from '@/components/production/ProductionSystemValidator';
import { ProductionMonitoringHub } from '@/components/monitoring/ProductionMonitoringHub';
import { PredictiveAnalyticsEngine } from '@/components/analytics/PredictiveAnalyticsEngine';

export default function SuperAdminPage() {
  const { settings, loading: appLoading } = useAppSettings();
  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const { isSuper, loading: roleLoading } = useIsSuperadmin(user?.id);
  const [synced, setSynced] = React.useState(false);

  // Add immediate superadmin detection based on email and metadata
  const isSuperadminByEmail = user?.email === 'superadmin@yachtexcel.com';
  const isSuperadminByMetadata = user?.user_metadata?.role === 'global_superadmin' || user?.app_metadata?.role === 'global_superadmin';
  const effectiveIsSuper = isSuper || isSuperadminByEmail || isSuperadminByMetadata;
  
  console.log('[SuperAdmin Page] Auth state:', {
    userEmail: user?.email,
    userId: user?.id,
    userMetadata: user?.user_metadata,
    appMetadata: user?.app_metadata,
    isSuper,
    isSuperadminByEmail,
    isSuperadminByMetadata,
    effectiveIsSuper,
    loading: { authLoading, roleLoading }
  });

  const { status, testAll } = useUnifiedAIConfig();
  const [testing, setTesting] = React.useState(false);
  const [testResults, setTestResults] = React.useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDept = searchParams.get('dept') || 'All';

  const [activeTab, setActiveTab] = React.useState(searchParams.get('tab') || 'ai-operations');
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) setActiveTab(t);
  }, [searchParams, activeTab]);

  useEffect(() => {
    document.title = 'SuperAdmin Dev Configuration Panel';
    const desc = 'Manage providers, models, secrets, unified AI config, and app status.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = desc;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = `${window.location.origin}/superadmin`;
  }, []);

  // Sync DB roles -> app_metadata so legacy edge functions that check app_metadata keep working
  useEffect(() => {
    const doSync = async () => {
      if (user && effectiveIsSuper && !synced) {
        try {
          await supabase.functions.invoke('sync-user-roles');
          setSynced(true);
          console.log('Synced user roles to app_metadata');
        } catch (e) {
          console.warn('Failed to sync user roles', e);
        }
      }
    };
    doSync();
  }, [user, effectiveIsSuper, synced]);

  const ChecklistItem = ({ label, ok }: { label: string; ok?: boolean }) => (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" aria-hidden />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );

  const handleSmokeTests = async () => {
    setTesting(true);
    setTestResults(null);
    try {
      const res = await testAll.mutateAsync();
      setTestResults(res);
      toast({ title: "Smoke tests completed", description: `Total time: ${res?.total_ms ?? "—"} ms` });
    } catch (e: any) {
      toast({ title: "Smoke tests failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  // Unified loading state
  if (appLoading || authLoading || roleLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  // If not authenticated, show inline auth card
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <InlineAuthCard />
      </div>
    );
  }

  // If authenticated but not superadmin, show access denied (no redirect)
  if (!effectiveIsSuper) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">SuperAdmin Dev Configuration Panel</h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Signed in</Badge>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You must be a SuperAdmin to access this page. If you were recently granted access, try refreshing.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // From here on, user is authenticated and a real superadmin
  return (
    <div className="container mx-auto p-6 space-y-6">
      <nav aria-label="breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Super Admin</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-2">Developer Configuration</h1>
            <p className="text-gray-600">Advanced system configuration and AI management tools</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
              <span className="text-sm font-medium text-blue-700">SuperAdmin</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-gray-600 hover:text-gray-900">
              <LogOut className="h-4 w-4 mr-2" /> 
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => { setActiveTab('ai-operations'); setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', 'ai-operations'); return next; }); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ai-operations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI Operations
            </button>
            <button
              onClick={() => { setActiveTab('visual-mapping'); setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', 'visual-mapping'); return next; }); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'visual-mapping'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Visual Mapping
            </button>
            <button
              onClick={() => { setActiveTab('system'); setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', 'system'); return next; }); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              System Settings
            </button>
            <button
              onClick={() => { setActiveTab('monitoring'); setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', 'monitoring'); return next; }); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Monitoring
            </button>
            <button
              onClick={() => { setActiveTab('administration'); setSearchParams(prev => { const next = new URLSearchParams(prev); next.set('tab', 'administration'); return next; }); }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'administration'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Administration
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-screen">
        {activeTab === 'ai-operations' && (
          <div className="space-y-6">
            <UnifiedAIOperations />
          </div>
        )}

        {activeTab === 'visual-mapping' && (
          <div className="space-y-6">
            <ProfessionalVisualMappingSystem />
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <SecurityStatusDashboard />
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health Check</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-lg border ${
                  Boolean((status.data as any)?.config?.projectId) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      Boolean((status.data as any)?.config?.projectId) ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">Project ID</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  Boolean((status.data as any)?.config?.region) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      Boolean((status.data as any)?.config?.region) ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">Region Configuration</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  Boolean((status.data as any)?.secrets?.GOOGLE_VISION_API_KEY) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      Boolean((status.data as any)?.secrets?.GOOGLE_VISION_API_KEY) ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">Vision API</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  Boolean(((status.data as any)?.secrets?.GEMINI_API_KEY) || ((status.data as any)?.secrets?.OPENAI_API_KEY)) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      Boolean(((status.data as any)?.secrets?.GEMINI_API_KEY) || ((status.data as any)?.secrets?.OPENAI_API_KEY)) ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">AI Models</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  Boolean((status.data as any)?.config?.services?.documentAI?.processorId) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      Boolean((status.data as any)?.config?.services?.documentAI?.processorId) ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">Document AI</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  Boolean((status.data as any)?.secrets?.GOOGLE_SERVICE_ACCOUNT_JSON) 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      Boolean((status.data as any)?.secrets?.GOOGLE_SERVICE_ACCOUNT_JSON) ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium">Service Account</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSmokeTests}
                  disabled={testing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {testing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Run Health Check
                </button>
              </div>

              {testResults && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Test Results</h3>
                  <pre className="text-xs text-gray-700 overflow-auto max-h-64 font-mono">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <AppStatusDashboard />
            <AIConfigurationManager />
            <FeatureFlagsCard />
            <UnifiedSystemSettings />
            <SecretsManager />
            <EdgeFunctionsPanel />
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <Phase3CompletionDashboard />
            <ProductionSystemValidator />
            <ProductionMonitoringHub />
            <PredictiveAnalyticsEngine />
            <Phase4CompletionDashboard />
            <Phase5CompletionDashboard />
            <Phase6CompletionDashboard />
            <DepartmentQuickCards />
            <UnifiedLogsPanel initialDepartment={initialDept as any} />
          </div>
        )}

        {activeTab === 'administration' && (
          <div className="space-y-6">
            <PermissionsManager />
            <EmailSettings />
          </div>
        )}
      </div>
    </div>
  );
}
