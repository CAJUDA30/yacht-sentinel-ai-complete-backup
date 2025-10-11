import { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

// UNIFIED User Role Context - Now uses Master Auth System
// This eliminates conflicts with authentication state management
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
  // Use Master Auth System - no more conflicts!
  const masterAuth = useSupabaseAuth();

  console.log('[UserRoleProvider] ✅ Using Master Auth System - No conflicts!');

  const contextValue: UserRoleContextType = {
    user: masterAuth.user,
    roles: masterAuth.roles,
    isLoading: masterAuth.loading,
    
    // Role checking functions - directly from Master Auth
    hasRole: masterAuth.hasRole,
    hasAnyRole: masterAuth.hasAnyRole,
    
    // Permission checking functions - directly from Master Auth
    canRead: masterAuth.canRead,
    canWrite: masterAuth.canWrite,
    canDelete: masterAuth.canDelete,
    canAdmin: masterAuth.canAdmin,
    
    // Convenience role checks - directly from Master Auth
    isGuest: masterAuth.isGuest,
    isViewer: masterAuth.isViewer,
    isUser: masterAuth.isUser,
    isManager: masterAuth.isManager,
    isAdmin: masterAuth.isAdmin,
    isSuperAdmin: masterAuth.isSuperAdmin,
    
    // Actions - directly from Master Auth
    refreshRoles: masterAuth.refreshRoles
  };

  return (
    <UserRoleContext.Provider value={contextValue}>
      {children}
    </UserRoleContext.Provider>
  );
};

// Export the provider as SuperAdminProvider for backward compatibility
export const SuperAdminProvider = UserRoleProvider;