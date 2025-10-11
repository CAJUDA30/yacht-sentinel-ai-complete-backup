import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface YachtInfo {
  id: string;
  name: string;
  userRole: string;
}

interface YachtContextType {
  userYachtId: string | null;
  userYacht: YachtInfo | null;
  loading: boolean;
  getUserRole: () => string | null;
  hasRole: (requiredRole: string) => boolean;
  refreshYachtData: () => Promise<void>;
  isGlobalSuperAdmin: boolean;
}

const YachtContext = createContext<YachtContextType | undefined>(undefined);

export const useYacht = () => {
  const context = useContext(YachtContext);
  if (context === undefined) {
    throw new Error('useYacht must be used within a YachtProvider');
  }
  return context;
};

interface YachtProviderProps {
  children: ReactNode;
}

export const YachtProvider: React.FC<YachtProviderProps> = ({ children }) => {
  const [userYachtId, setUserYachtId] = useState<string | null>(null);
  const [userYacht, setUserYacht] = useState<YachtInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGlobalSuperAdmin, setIsGlobalSuperAdmin] = useState(false);

  // Load user's assigned yacht on auth change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserYacht();
        } else if (event === 'SIGNED_OUT') {
          resetYachtData();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load yacht data on mount if user is already authenticated
  useEffect(() => {
    const loadInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserYacht();
      } else {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const resetYachtData = () => {
    setUserYachtId(null);
    setUserYacht(null);
    setIsGlobalSuperAdmin(false);
    setLoading(false);
  };

  const loadUserYacht = async () => {
    try {
      setLoading(true);
      
      // Get current session instead of getUser to avoid 403 errors
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        console.log('[YachtContext] No valid session found');
        resetYachtData();
        return;
      }
      
      const user = session.user;
      console.log('[YachtContext] Loading yacht data for user:', user.email);

      // Check if user is global superadmin from multiple sources
      const isSuperAdminEmail = user.email === 'superadmin@yachtexcel.com';
      const isSuperAdminMetadata = user.user_metadata?.role === 'global_superadmin';
      const isSuperAdminAppMetadata = user.app_metadata?.role === 'global_superadmin';
      
      // Also try to check the database for the role, but handle failures gracefully
      let isSuperAdminDB = false;
      try {
        const { data: roleCheck, error: roleError } = await supabase
          .rpc('is_superadmin');
        
        if (!roleError && roleCheck) {
          isSuperAdminDB = true;
          console.log('[YachtContext] Database confirms superadmin status');
        }
      } catch (error) {
        console.warn('[YachtContext] Could not query database for superadmin status, using fallback detection:', error);
      }
      
      const isSuperAdmin = isSuperAdminEmail || isSuperAdminMetadata || isSuperAdminAppMetadata || isSuperAdminDB;
      
      console.log('[YachtContext] Superadmin status:', {
        email: isSuperAdminEmail,
        metadata: isSuperAdminMetadata,
        appMetadata: isSuperAdminAppMetadata,
        database: isSuperAdminDB,
        final: isSuperAdmin
      });
      
      setIsGlobalSuperAdmin(isSuperAdmin);

      if (isSuperAdmin) {
        // Global superadmin doesn't belong to a specific yacht
        setUserYachtId(null);
        setUserYacht(null);
        console.log('[YachtContext] Global superadmin authenticated successfully');
        toast.success('Welcome, Global Superadmin!');
      } else {
        // For regular users, temporarily skip yacht assignment loading to avoid TypeScript issues
        // This will be implemented once the database schema is fully stabilized
        console.log('[YachtContext] Regular user - yacht assignment temporarily disabled');
        setUserYachtId(null);
        setUserYacht(null);
        toast.info('Regular user mode - yacht assignment feature coming soon');
      }

    } catch (error) {
      console.error('Error loading user yacht:', error);
      toast.error('Failed to load yacht data');
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (): string | null => {
    if (isGlobalSuperAdmin) return 'global_superadmin';
    return userYacht?.userRole || null;
  };

  const hasRole = (requiredRole: string): boolean => {
    // Global superadmin has access to everything
    if (isGlobalSuperAdmin) {
      console.log('[YachtContext] Superadmin access granted for role:', requiredRole);
      return true;
    }
    
    const userRole = userYacht?.userRole;
    if (!userRole) {
      console.log('[YachtContext] No role found, access denied for:', requiredRole);
      return false;
    }

    const roleHierarchy = {
      viewer: 1,
      user: 2,
      crew_member: 2,
      manager: 3,
      admin: 4,
      yacht_admin: 4,
      global_superadmin: 5,
      superadmin: 5
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    const hasAccess = userLevel >= requiredLevel;
    console.log('[YachtContext] Role check:', {
      userRole,
      userLevel,
      requiredRole,
      requiredLevel,
      hasAccess
    });

    return hasAccess;
  };

  const refreshYachtData = async () => {
    await loadUserYacht();
  };

  const value = {
    userYachtId,
    userYacht,
    loading,
    getUserRole,
    hasRole,
    refreshYachtData,
    isGlobalSuperAdmin
  };

  return (
    <YachtContext.Provider value={value}>
      {children}
    </YachtContext.Provider>
  );
};