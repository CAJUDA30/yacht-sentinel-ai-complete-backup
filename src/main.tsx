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
import { checkAndInvalidateCache } from "@/utils/cacheInvalidation";
import App from "./App.tsx";
import "./index.css";

// =============================================================================
// AUTOMATIC CACHE INVALIDATION
// =============================================================================
// Clear localStorage/sessionStorage when app version changes
// This ensures users always see latest code after updates
const cacheWasCleared = checkAndInvalidateCache();
if (cacheWasCleared) {
  console.log('[App] 🔄 Cache cleared due to version update - reloading...');
  // Give a moment for logs to flush, then reload
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

// =============================================================================
// SYSTEMATIC CONSOLE MANAGEMENT SYSTEM
// =============================================================================
// Clean console output while preserving error visibility
// Based on user preference for systematic, efficient workflows

// FIXED: Console filtering without recursion
if (import.meta.env.DEV) {
  // Store ORIGINAL console methods before ANY modifications
  const _originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
  
  // Simple filter that won't cause recursion
  const shouldFilter = (msg: any): boolean => {
    if (!msg) return false;
    const str = String(msg);
    
    // Filter React DevTools message
    if (str.includes('Download the React DevTools')) return true;
    
    // Filter GoTrueClient spam
    if (str.includes('GoTrueClient@') && 
        (str.includes('#_acquireLock') || str.includes('lock acquired'))) return true;
    
    // Filter auth spam for performance
    if (str.includes('[useSupabaseAuth] 🚀 MASTER HOOK initialized, subscribers:')) return true;
    if (str.includes('[useSupabaseAuth] Using existing master state:')) return true;
    if (str.includes('[UserRoleProvider] ✅ Using Master Auth System')) return true;
    if (str.includes('[SYSTEM] ⏳ Waiting for AI system to be ready')) return true;
    if (str.includes('[useSupabaseAuth] Init already in progress')) return true;
    
    return false;
  };
  
  // Override with NO possibility of recursion
  console.log = function(...args) {
    if (!shouldFilter(args[0])) {
      _originalConsole.log.apply(this, args);
    }
  };
  
  console.info = function(...args) {
    if (!shouldFilter(args[0])) {
      _originalConsole.info.apply(this, args);
    }
  };
  
  // Never touch error/warn - always show
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
