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
        setIsSuperAdmin(false);
        setUserRole('user');
        setLoading(false);
        return;
      }
      
      const user = session.user;
      
      // AUTHORITATIVE SUPERADMIN DETECTION - Check ALL sources
      let isSuper = false;
      const userId = user.id;
      
      // Method 1: Email-based detection (primary)
      if (user.email === 'superadmin@yachtexcel.com') {
        console.log('[SuperAdmin] Detected by email');
        isSuper = true;
      }
      
      // Method 2: Metadata-based detection
      if (!isSuper && (
        user.user_metadata?.role === 'global_superadmin' ||
        user.app_metadata?.role === 'global_superadmin' ||
        user.user_metadata?.is_superadmin === true ||
        user.app_metadata?.is_superadmin === true
      )) {
        console.log('[SuperAdmin] Detected by metadata');
        isSuper = true;
      }
      
      // Method 3: Database-based detection (authoritative)
      if (!isSuper) {
        try {
          const { data: dbCheck, error: dbError } = await supabase
            .rpc('is_superadmin');
          
          if (!dbError && dbCheck === true) {
            console.log('[SuperAdmin] Detected by database');
            isSuper = true;
          }
        } catch (dbError) {
          console.warn('[SuperAdmin] Database check failed, using fallback:', dbError);
        }
      }
      
      // Method 4: Hardcoded user ID fallback (emergency)
      if (!isSuper && userId === 'c5f001c6-6a59-49bb-a698-a97c5a028b2a') {
        console.log('[SuperAdmin] Detected by hardcoded user ID');
        isSuper = true;
      }
      
      console.log('[SuperAdmin] Final determination:', { 
        email: user.email, 
        userId, 
        isSuper,
        method: isSuper ? 'comprehensive_check' : 'none'
      });
      
      setIsSuperAdmin(isSuper);
      setUserRole(isSuper ? 'superadmin' : 'user');
      
      // Cache globally
      globalSuperAdminStatus = { 
        isSuperAdmin: isSuper, 
        userRole: isSuper ? 'superadmin' : 'user', 
        loading: false 
      };
      
    } catch (error) {
      console.error('[SuperAdmin] Error:', error);
      // Emergency fallback - check email at least
      const { data: { session } } = await supabase.auth.getSession();
      const isEmergencySuper = session?.user?.email === 'superadmin@yachtexcel.com';
      
      setIsSuperAdmin(isEmergencySuper);
      setUserRole(isEmergencySuper ? 'superadmin' : 'user');
    } finally {
      setLoading(false);
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