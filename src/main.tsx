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
// PROFESSIONAL: Clean console output with intelligent filtering
// Maintains error visibility while reducing development noise

if (import.meta.env.DEV) {
  // Store original console methods for bypass when needed
  const _originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
  
  // PROFESSIONAL: Intelligent message filtering with comprehensive patterns
  const shouldFilter = (msg: any): boolean => {
    if (!msg) return false;
    const str = String(msg);
    
    // PROFESSIONAL: React DevTools development convenience message
    if (str.includes('Download the React DevTools for a better development experience')) return true;
    if (str.includes('Install the React Developer Tools')) return true;
    
    // PROFESSIONAL: Supabase GoTrueClient authentication noise (development only)
    if (str.includes('GoTrueClient@') && 
        (str.includes('#_acquireLock') || 
         str.includes('lock acquired') ||
         str.includes('lock released') ||
         str.includes('session refresh'))) return true;
    
    // PROFESSIONAL: Hot reload and development server messages
    if (str.includes('[vite]') && str.includes('connected')) return true;
    if (str.includes('DevTools') && str.includes('backend')) return true;
    
    return false;
  };
  
  // PROFESSIONAL: Override console methods with intelligent filtering
  // Preserves all errors and warnings while filtering development noise
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
  
  // PROFESSIONAL: Never filter errors or warnings - always show for debugging
  // console.error and console.warn remain untouched for maximum visibility
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
