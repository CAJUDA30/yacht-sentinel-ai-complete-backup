import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from '@/store';
import ErrorBoundary from "@/components/ErrorBoundary";
import { UnifiedYachtSentinelProvider } from "@/contexts/UnifiedYachtSentinelContext";
import { YachtProvider } from "@/contexts/YachtContext";
import { SuperAdminProvider } from "@/contexts/SuperAdminContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";

// Initialize authentication error handling
import '@/utils/authErrorHandler';

// Initialize startup health checking
import { useStartupHealthCheck } from '@/hooks/useStartupHealthCheck';
import { systemHealthService } from '@/services/systemHealthService';
import { enterpriseHealthOrchestrator } from '@/services/enterpriseHealthOrchestrator';
import { debugConsole } from '@/services/debugConsole';

// Lazy load components for better performance
import { lazy, Suspense } from "react";
import React from "react";

const Layout = lazy(() => import("@/components/Layout"));
const ProtectedRoute = lazy(() => import("@/components/auth/ProtectedRoute"));
const Auth = lazy(() => import("./pages/Auth"));

const YachtSelector = lazy(() => import("@/components/YachtSelector"));
const YachtOnboardingWizard = lazy(() => import("@/components/onboarding/YachtOnboardingWizard"));
const YachtPage = lazy(() => import("@/components/YachtPage"));
const Index = lazy(() => import("./pages/Index"));
const SuperAdminPage = lazy(() => import("./pages/SuperAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Core Module Pages
const Inventory = lazy(() => import("./pages/Inventory"));
const Equipment = lazy(() => import("./pages/Equipment"));
const Crew = lazy(() => import("./pages/Crew"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Finance = lazy(() => import("./pages/Finance"));
const Procurement = lazy(() => import("./pages/Procurement"));
const Safety = lazy(() => import("./pages/Safety"));
const ClaimsRepairs = lazy(() => import("./pages/ClaimsRepairs"));
const Operations = lazy(() => import("./pages/Operations"));
const Documents = lazy(() => import("./pages/Documents"));
const Communications = lazy(() => import("./pages/Communications"));
const Navigation = lazy(() => import("./pages/Navigation"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Todos = lazy(() => import("./pages/Todos"));
const AuditManager = lazy(() => import("./pages/AuditManager"));
const Settings = lazy(() => import("./pages/Settings"));

// AI & Advanced Features
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const AdvancedCamera = lazy(() => import("./pages/AdvancedCamera"));
const VisionStudio = lazy(() => import("./pages/VisionStudio"));
const UniversalSearch = lazy(() => import("./pages/UniversalSearch"));
const PerformanceCenter = lazy(() => import("./pages/PerformanceCenter"));
const SystemOverview = lazy(() => import("./pages/SystemOverview"));
const IntegrationHub = lazy(() => import("./pages/IntegrationHub"));
const ProductionReadiness = lazy(() => import("./pages/ProductionReadiness"));
const DeploymentDashboard = lazy(() => import("./pages/DeploymentDashboard"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const OfflineManager = lazy(() => import("./pages/OfflineManager"));
const RealTimeTracker = lazy(() => import("./pages/RealTimeTracker"));
const DevConfigDashboard = lazy(() => import("./pages/DevConfigDashboard"));

const ComprehensiveTest = lazy(() => import("./pages/ComprehensiveTestPage"));
const DocumentProcessing = lazy(() => import("./pages/DocumentProcessing"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Component to handle automated enterprise health monitoring
const AppStartupHandler = () => {
  // Initialize automatic health checking on app start and login
  useStartupHealthCheck({
    enabled: true,
    delay: 8000, // 8 second delay after AI initialization for comprehensive checks
    runOnLogin: true,
    runOnAppStart: true
  });

  // Initialize enterprise health orchestrator - fully automated
  React.useEffect(() => {
    let isInitialized = false;
    
    const initializeEnterpriseMonitoring = async () => {
      if (isInitialized) return;
      isInitialized = true;

      try {
        debugConsole.info('SYSTEM', '🏢 Initializing Enterprise Health Orchestrator - Zero Manual Intervention Mode');
        
        // Start fully automated enterprise health monitoring
        await enterpriseHealthOrchestrator.initializeAutomatedMonitoring();
        
        debugConsole.success('SYSTEM', '✅ Enterprise Health Orchestrator operational - Autonomous monitoring active', {
          monitoring_mode: 'fully_automated',
          manual_intervention: 'disabled',
          systematic_verification: 'enabled',
          professional_monitoring: 'active'
        });
        
      } catch (error: any) {
        debugConsole.error('SYSTEM', '❌ Enterprise Health Orchestrator initialization failed', { 
          error: error.message,
          note: 'System will continue with basic monitoring'
        });
      }
    };

    // Initialize after a delay to ensure all systems are ready
    const initTimeout = setTimeout(() => {
      initializeEnterpriseMonitoring();
    }, 30000); // 30 seconds to ensure complete system initialization

    return () => {
      clearTimeout(initTimeout);
      if (isInitialized) {
        enterpriseHealthOrchestrator.cleanup();
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

const App = () => {
  return (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <SuperAdminProvider>
              <UnifiedYachtSentinelProvider>
                <AppSettingsProvider>
                  <YachtProvider>
                    <AppStartupHandler />
                    <Suspense fallback={<LoadingSpinner />}>
                      <Routes>
              <Route path="/auth" element={<Auth />} />

              
              {/* Test Routes */}
              <Route path="/comprehensive-test" element={
                <Layout>
                  <ProtectedRoute>
                    <ComprehensiveTest />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/document-processing" element={
                <Layout>
                  <ProtectedRoute>
                    <DocumentProcessing />
                  </ProtectedRoute>
                </Layout>
              } />
              
              {/* Yacht-Centric Routes */}
              <Route path="/" element={
                <Layout>
                  <ProtectedRoute>
                    <YachtSelector />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/fleet" element={
                <Layout>
                  <ProtectedRoute>
                    <YachtSelector />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/yacht/onboarding" element={
                <Layout>
                  <ProtectedRoute>
                    <YachtOnboardingWizard />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/yacht/:yachtId" element={
                <Layout>
                  <ProtectedRoute>
                    <YachtPage />
                  </ProtectedRoute>
                </Layout>
              } />
              
              {/* Legacy dashboard route */}
              <Route path="/dashboard" element={
                <Layout>
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/superadmin" element={
                <Layout>
                  <ProtectedRoute>
                    <SuperAdminPage />
                  </ProtectedRoute>
                </Layout>
              } />
              
              {/* Core Module Routes */}
              <Route path="/inventory" element={
                <Layout>
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/equipment" element={
                <Layout>
                  <ProtectedRoute>
                    <Equipment />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/crew" element={
                <Layout>
                  <ProtectedRoute>
                    <Crew />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/maintenance" element={
                <Layout>
                  <ProtectedRoute>
                    <Maintenance />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/finance" element={
                <Layout>
                  <ProtectedRoute>
                    <Finance />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/procurement" element={
                <Layout>
                  <ProtectedRoute>
                    <Procurement />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/safety" element={
                <Layout>
                  <ProtectedRoute>
                    <Safety />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/claims-repairs" element={
                <Layout>
                  <ProtectedRoute>
                    <ClaimsRepairs />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/operations" element={
                <Layout>
                  <ProtectedRoute>
                    <Operations />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/documents" element={
                <Layout>
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/communications" element={
                <Layout>
                  <ProtectedRoute>
                    <Communications />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/navigation" element={
                <Layout>
                  <ProtectedRoute>
                    <Navigation />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/analytics" element={
                <Layout>
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/todos" element={
                <Layout>
                  <ProtectedRoute>
                    <Todos />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/todos/assign" element={
                <Layout>
                  <ProtectedRoute>
                    <Todos />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/audit-manager" element={
                <Layout>
                  <ProtectedRoute>
                    <AuditManager />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/settings" element={
                <Layout>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </Layout>
              } />
              
              {/* AI & Advanced Features */}
              <Route path="/voice-assistant" element={
                <Layout>
                  <ProtectedRoute>
                    <VoiceAssistant />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/advanced-camera" element={
                <Layout>
                  <ProtectedRoute>
                    <AdvancedCamera />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/vision-studio" element={
                <Layout>
                  <ProtectedRoute>
                    <VisionStudio />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/universal-search" element={
                <Layout>
                  <ProtectedRoute>
                    <UniversalSearch />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/performance-center" element={
                <Layout>
                  <ProtectedRoute>
                    <PerformanceCenter />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/system-overview" element={
                <Layout>
                  <ProtectedRoute>
                    <SystemOverview />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/integration-hub" element={
                <Layout>
                  <ProtectedRoute>
                    <IntegrationHub />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/production-readiness" element={
                <Layout>
                  <ProtectedRoute>
                    <ProductionReadiness />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/deployment-dashboard" element={
                <Layout>
                  <ProtectedRoute>
                    <DeploymentDashboard />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/notification-center" element={
                <Layout>
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/offline-manager" element={
                <Layout>
                  <ProtectedRoute>
                    <OfflineManager />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/real-time-tracker" element={
                <Layout>
                  <ProtectedRoute>
                    <RealTimeTracker />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/dev-config" element={
                <Layout>
                  <ProtectedRoute>
                    <DevConfigDashboard />
                  </ProtectedRoute>
                </Layout>
              } />
              
              {/* Navigation submenu routes */}
              <Route path="/navigation/maps" element={
                <Layout>
                  <ProtectedRoute>
                    <Navigation />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/navigation/weather" element={
                <Layout>
                  <ProtectedRoute>
                    <Navigation />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/navigation/tracking" element={
                <Layout>
                  <ProtectedRoute>
                    <Navigation />
                  </ProtectedRoute>
                </Layout>
              } />
              
              {/* Settings submenu routes */}
              <Route path="/settings/notifications" element={
                <Layout>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/settings/appearance" element={
                <Layout>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/settings/security" element={
                <Layout>
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="*" element={
                <Layout>
                  <NotFound />
                </Layout>
              } />
                      </Routes>
                    </Suspense>
                  </YachtProvider>
                </AppSettingsProvider>
              </UnifiedYachtSentinelProvider>
            </SuperAdminProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
  </Provider>
  );
};

export default App;
