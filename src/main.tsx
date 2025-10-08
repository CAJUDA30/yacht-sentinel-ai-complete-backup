import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { InventorySettingsProvider } from "@/components/inventory/InventorySettingsContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { ContextualAIProvider } from "@/contexts/ContextualAIContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { UniversalLLMProvider } from "@/contexts/UniversalLLMContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AppSettingsProvider } from "@/contexts/AppSettingsContext";
import { ModuleSettingsProvider } from "@/contexts/ModuleSettingsContext";
import { AuditIntegrationProvider } from "@/contexts/AuditIntegrationContext";
import { PerformanceProvider } from "@/contexts/PerformanceContext";
import { UnifiedSettingsProvider } from "@/contexts/UnifiedSettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

// Reduce GoTrueClient console spam by filtering noisy logs
if (import.meta.env.DEV || import.meta.env.VITE_DISABLE_AUTH_LOGS === 'true') {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  const shouldFilterLog = (message: any) => {
    const msgStr = String(message);
    return msgStr.includes('GoTrueClient@') || 
           msgStr.includes('#_acquireLock') ||
           msgStr.includes('#_releaseLock') ||
           msgStr.includes('GOTRUE_') ||
           msgStr.includes('_acquireLock start') ||
           msgStr.includes('_acquireLock end') ||
           msgStr.includes('_releaseLock start') ||
           msgStr.includes('_releaseLock end') ||
           msgStr.includes('GoTrueAdminApi') ||
           msgStr.includes('storageKey') ||
           // Filter duplicate AppSettings logs
           (msgStr.includes('[AppSettings] Setting up user roles for') && msgStr.includes('c4ca4238')) ||
           (msgStr.includes('supabase') && msgStr.includes('lock'));
  };
  
  console.log = (...args) => {
    if (!shouldFilterLog(args[0])) {
      originalConsoleLog.apply(console, args);
    }
  };
  
  console.warn = (...args) => {
    if (!shouldFilterLog(args[0])) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  console.info = (...args) => {
    if (!shouldFilterLog(args[0])) {
      originalConsoleInfo.apply(console, args);
    }
  };
  
  console.debug = (...args) => {
    if (!shouldFilterLog(args[0])) {
      originalConsoleDebug.apply(console, args);
    }
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ErrorBoundary>
        <PerformanceProvider>
          <OfflineProvider>
            <RealtimeProvider>
              <LocationProvider>
                <SecurityProvider>
                  <UniversalLLMProvider>
                    <ContextualAIProvider>
                      <LanguageProvider>
                        <AppSettingsProvider>
                          <CurrencyProvider>
                            <ModuleSettingsProvider>
                              <AuditIntegrationProvider>
                                <UnifiedSettingsProvider>
                                  <InventoryProvider>
                                    <InventorySettingsProvider>
                                      <App />
                                    </InventorySettingsProvider>
                                  </InventoryProvider>
                                </UnifiedSettingsProvider>
                              </AuditIntegrationProvider>
                            </ModuleSettingsProvider>
                          </CurrencyProvider>
                        </AppSettingsProvider>
                      </LanguageProvider>
                    </ContextualAIProvider>
                  </UniversalLLMProvider>
                </SecurityProvider>
              </LocationProvider>
            </RealtimeProvider>
          </OfflineProvider>
        </PerformanceProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
);
