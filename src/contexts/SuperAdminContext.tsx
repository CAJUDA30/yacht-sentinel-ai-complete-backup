import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  userRole: string;
  loading: boolean;
  refreshStatus: () => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

interface SuperAdminProviderProps {
  children: ReactNode;
}

// Simple global state without complex tracking
let globalSuperAdminInitialized = false;
let globalSuperAdminStatus = {
  isSuperAdmin: false,
  userRole: 'user' as string,
  loading: true
};

export const SuperAdminProvider: React.FC<SuperAdminProviderProps> = ({ children }) => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  const checkSuperAdminStatus = useCallback(async () => {
    try {
      console.log('[SuperAdmin] Checking status...');
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('[SuperAdmin] No user session found');
        setIsSuperAdmin(false);
        setUserRole('user');
        setLoading(false);
        return;
      }
      
      const user = session.user;
      console.log('[SuperAdmin] Checking user:', user.email, user.id);
      
      // ENHANCED SUPERADMIN DETECTION - Multiple methods with priority
      let isSuper = false;
      let detectionMethod = 'none';
      const userId = user.id;
      
      // Method 1: Email-based detection (HIGHEST PRIORITY)
      if (user.email === 'superadmin@yachtexcel.com') {
        console.log('[SuperAdmin] ✅ DETECTED by email: superadmin@yachtexcel.com');
        isSuper = true;
        detectionMethod = 'email';
      }
      
      // Method 2: Specific User ID (HARDCODED FALLBACK)
      if (!isSuper && userId === '73af070f-0168-4e4c-a42b-c58931a9009a') {
        console.log('[SuperAdmin] ✅ DETECTED by hardcoded user ID');
        isSuper = true;
        detectionMethod = 'user_id';
      }
      
      // Method 3: Metadata-based detection
      if (!isSuper && (
        user.user_metadata?.role === 'global_superadmin' ||
        user.app_metadata?.role === 'global_superadmin' ||
        user.user_metadata?.is_superadmin === true ||
        user.app_metadata?.is_superadmin === true
      )) {
        console.log('[SuperAdmin] ✅ DETECTED by metadata');
        isSuper = true;
        detectionMethod = 'metadata';
      }
      
      // Method 4: Database RPC check (if available)
      if (!isSuper) {
        try {
          const { data: dbCheck, error: dbError } = await supabase
            .rpc('is_superadmin');
          
          if (!dbError && dbCheck === true) {
            console.log('[SuperAdmin] ✅ DETECTED by database RPC');
            isSuper = true;
            detectionMethod = 'database';
          }
        } catch (dbError) {
          console.warn('[SuperAdmin] Database RPC check failed (expected):', dbError);
        }
      }
      
      // Method 5: Manual override for superadmin@yachtexcel.com (EMERGENCY FALLBACK)
      if (!isSuper && user.email === 'superadmin@yachtexcel.com') {
        console.log('[SuperAdmin] 🚨 EMERGENCY OVERRIDE - Granting superadmin to superadmin@yachtexcel.com');
        isSuper = true;
        detectionMethod = 'emergency_override';
      }
      
      console.log('[SuperAdmin] 🔍 FINAL DETERMINATION:', { 
        email: user.email, 
        userId, 
        isSuper,
        detectionMethod,
        timestamp: new Date().toISOString()
      });
      
      // Set the state
      setIsSuperAdmin(isSuper);
      setUserRole(isSuper ? 'superadmin' : 'user');
      
      // Update global cache
      globalSuperAdminStatus = { 
        isSuperAdmin: isSuper, 
        userRole: isSuper ? 'superadmin' : 'user', 
        loading: false 
      };
      
      // If this is superadmin@yachtexcel.com but not detected, force it
      if (!isSuper && user.email === 'superadmin@yachtexcel.com') {
        console.log('[SuperAdmin] 🚨 FORCE OVERRIDE - Setting superadmin status for superadmin@yachtexcel.com');
        setIsSuperAdmin(true);
        setUserRole('superadmin');
        globalSuperAdminStatus.isSuperAdmin = true;
        globalSuperAdminStatus.userRole = 'superadmin';
      }
      
    } catch (error) {
      console.error('[SuperAdmin] Error checking status:', error);
      
      // Emergency fallback - check email directly
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isEmergencySuper = session?.user?.email === 'superadmin@yachtexcel.com';
        
        console.log('[SuperAdmin] 🚨 EMERGENCY FALLBACK - Email check result:', isEmergencySuper);
        
        setIsSuperAdmin(isEmergencySuper);
        setUserRole(isEmergencySuper ? 'superadmin' : 'user');
      } catch (fallbackError) {
        console.error('[SuperAdmin] Emergency fallback failed:', fallbackError);
        setIsSuperAdmin(false);
        setUserRole('user');
      }
    } finally {
      setLoading(false);
      globalSuperAdminInitialized = true;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    console.log('[SuperAdmin] Force refresh requested');
    globalSuperAdminInitialized = false; // Clear cache
    await checkSuperAdminStatus();
  }, [checkSuperAdminStatus]);

  useEffect(() => {
    // Always check on mount - don't rely on cache for critical auth
    console.log('[SuperAdmin] Initializing...');
    
    checkSuperAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SuperAdmin] Auth state change:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          globalSuperAdminInitialized = false; // Clear cache
          await checkSuperAdminStatus();
        } else if (event === 'SIGNED_OUT') {
          setIsSuperAdmin(false);
          setUserRole('user');
          setLoading(false);
          globalSuperAdminInitialized = false;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSuperAdminStatus]);

  return (
    <SuperAdminContext.Provider value={{
      isSuperAdmin,
      userRole,
      loading,
      refreshStatus
    }}>
      {children}
    </SuperAdminContext.Provider>
  );
};