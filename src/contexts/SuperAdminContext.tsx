import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SuperAdminContextType {
  isSuperAdmin: boolean;
  userRole: string;
  loading: boolean;
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
      const isSuper = user.email === 'superadmin@yachtexcel.com' || 
                     user.user_metadata?.role === 'global_superadmin' ||
                     user.app_metadata?.role === 'global_superadmin';
      
      console.log('[SuperAdmin] Status determined:', { email: user.email, isSuper });
      
      setIsSuperAdmin(isSuper);
      setUserRole(isSuper ? 'superadmin' : 'user');
      
      // Cache globally
      globalSuperAdminStatus = { isSuperAdmin: isSuper, userRole: isSuper ? 'superadmin' : 'user', loading: false };
      
    } catch (error) {
      console.error('[SuperAdmin] Error:', error);
      setIsSuperAdmin(false);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent multiple initializations with simple flag
    if (globalSuperAdminInitialized) {
      console.log('[SuperAdmin] Using cached status');
      setIsSuperAdmin(globalSuperAdminStatus.isSuperAdmin);
      setUserRole(globalSuperAdminStatus.userRole);
      setLoading(globalSuperAdminStatus.loading);
      return;
    }
    
    globalSuperAdminInitialized = true;
    console.log('[SuperAdmin] Initializing...');
    
    checkSuperAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
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
      loading
    }}>
      {children}
    </SuperAdminContext.Provider>
  );
};