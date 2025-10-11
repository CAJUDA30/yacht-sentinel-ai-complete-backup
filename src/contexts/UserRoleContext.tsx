import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Dynamic User Role Context - Replaces hardcoded SuperAdminContext
interface UserRole {
  role: string;
  yacht_id?: string;
  department?: string;
  expires_at?: string;
}

interface UserRoleContextType {
  user: User | null;
  roles: string[];
  isLoading: boolean;
  
  // Role checking functions
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  
  // Permission checking functions (based on roles)
  canRead: (resource: string) => boolean;
  canWrite: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canAdmin: (resource?: string) => boolean;
  
  // Convenience role checks
  isGuest: boolean;
  isViewer: boolean;
  isUser: boolean;
  isManager: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  
  // Actions
  refreshRoles: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};

// For backward compatibility, keep the original hook name
export const useSuperAdmin = () => {
  const { isSuperAdmin, isLoading, refreshRoles } = useUserRole();
  return {
    isSuperAdmin,
    userRole: isSuperAdmin ? 'superadmin' : 'user',
    loading: isLoading,
    refreshStatus: refreshRoles
  };
};

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider: React.FC<UserRoleProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user roles using RPC functions and fallback detection
  const loadUserRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[UserRole] Loading user roles...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('[UserRole] No user session found');
        setUser(null);
        setRoles([]);
        setIsLoading(false);
        return;
      }

      setUser(session.user);
      console.log('[UserRole] User found:', session.user.email, session.user.id);

      // Use the existing is_superadmin RPC function first
      try {
        const { data: isSuperAdminData, error: superAdminError } = await supabase
          .rpc('is_superadmin');

        if (!superAdminError && isSuperAdminData === true) {
          console.log('[UserRole] User is superadmin via RPC');
          setRoles(['superadmin']);
          setIsLoading(false);
          return;
        }
      } catch (rpcError) {
        console.warn('[UserRole] RPC call failed, using fallback detection:', rpcError);
      }

      // Email-based role detection (matches database trigger logic)
      const userRoles: string[] = [];
      
      // Smart role assignment based on email patterns
      if (session.user.email === 'superadmin@yachtexcel.com') {
        userRoles.push('superadmin');
      } else if (session.user.email?.includes('@yachtexcel.com')) {
        userRoles.push('admin');
      } else if (session.user.email?.includes('admin') || session.user.email?.includes('manager')) {
        userRoles.push('manager');
      } else {
        userRoles.push('user');
      }

      // Check metadata for additional roles
      const metadata = session.user.user_metadata || {};
      const appMetadata = session.user.app_metadata || {};
      
      if (metadata.role === 'global_superadmin' || appMetadata.role === 'global_superadmin') {
        if (!userRoles.includes('superadmin')) {
          userRoles.push('superadmin');
        }
      }

      setRoles(userRoles);
      console.log('[UserRole] Roles assigned:', userRoles);
      console.log('[UserRole] Dynamic role system active - roles match database trigger logic');

    } catch (error) {
      console.error('[UserRole] Error loading user roles:', error);
      // Default to user role on error
      setRoles(['user']);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Role checking functions
  const hasRole = useCallback((role: string) => {
    return roles.includes(role) || (role !== 'superadmin' && roles.includes('superadmin'));
  }, [roles]);

  const hasAnyRole = useCallback((roleList: string[]) => {
    return roleList.some(role => hasRole(role));
  }, [hasRole]);

  // Permission checking functions based on role hierarchy
  const canRead = useCallback((resource: string) => {
    if (hasRole('superadmin') || hasRole('admin')) return true;
    if (hasRole('manager') && ['yachts', 'users', 'reports'].includes(resource)) return true;
    if (hasRole('user') && ['yachts', 'reports', 'profile'].includes(resource)) return true;
    if (hasRole('viewer') && ['yachts', 'reports'].includes(resource)) return true;
    return false;
  }, [hasRole]);

  const canWrite = useCallback((resource: string) => {
    if (hasRole('superadmin') || hasRole('admin')) return true;
    if (hasRole('manager') && ['yachts', 'users', 'reports'].includes(resource)) return true;
    if (hasRole('user') && ['profile'].includes(resource)) return true;
    return false;
  }, [hasRole]);

  const canDelete = useCallback((resource: string) => {
    if (hasRole('superadmin') || hasRole('admin')) return true;
    if (hasRole('manager') && ['reports'].includes(resource)) return true;
    return false;
  }, [hasRole]);

  const canAdmin = useCallback((resource?: string) => {
    return hasRole('superadmin') || hasRole('admin');
  }, [hasRole]);

  // Convenience role checks
  const isGuest = hasRole('guest');
  const isViewer = hasRole('viewer');
  const isUser = hasRole('user');
  const isManager = hasRole('manager');
  const isAdmin = hasRole('admin');
  const isSuperAdmin = hasRole('superadmin');

  // Load roles on mount and auth changes  
  useEffect(() => {
    console.log('[UserRole] Initializing UserRoleProvider...');
    loadUserRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[UserRole] Auth state change:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserRoles();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setRoles([]);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserRoles]);

  const contextValue: UserRoleContextType = {
    user,
    roles,
    isLoading,
    
    // Role checking functions
    hasRole,
    hasAnyRole,
    
    // Permission checking functions
    canRead,
    canWrite,
    canDelete,
    canAdmin,
    
    // Convenience role checks
    isGuest,
    isViewer,
    isUser,
    isManager,
    isAdmin,
    isSuperAdmin,
    
    // Actions
    refreshRoles: loadUserRoles
  };

  return (
    <UserRoleContext.Provider value={contextValue}>
      {children}
    </UserRoleContext.Provider>
  );
};

// Export the provider as SuperAdminProvider for backward compatibility
export const SuperAdminProvider = UserRoleProvider;