/**
 * useYachtPermissions - Yacht-Centric Permission Management Hook
 * Updated to work with existing schema - no mock data approach
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface UserYachtAccess {
  yacht_id: string;
  role: string;
  access_level: string;
  permissions: Record<string, any>;
  is_active: boolean;
}

interface ModulePermissions {
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_approve: boolean;
  can_delete: boolean;
}

export interface YachtPermissions {
  // Current yacht context
  currentYachtId: string | null;
  
  // User's yacht access
  yachtAccess: UserYachtAccess[];
  
  // Current yacht role and access level
  currentRole: string | null;
  currentAccessLevel: string | null;
  
  // Fleet access (for owners/managers)
  hasFleetAccess: boolean;
  fleetYachtIds: string[];
  
  // Permission checking functions
  hasYachtAccess: (yachtId: string) => boolean;
  hasModulePermission: (module: string, permission: keyof ModulePermissions, yachtId?: string) => boolean;
  canManageYacht: (yachtId: string) => boolean;
  canViewFinance: (yachtId: string) => boolean;
  canManageCrew: (yachtId: string) => boolean;
  
  // Yacht switching
  switchYacht: (yachtId: string) => Promise<boolean>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export const useYachtPermissions = (initialYachtId?: string): YachtPermissions => {
  const { user } = useSupabaseAuth();
  
  // State management
  const [currentYachtId, setCurrentYachtId] = useState<string | null>(
    initialYachtId || localStorage.getItem('currentYachtId')
  );
  const [yachtAccess, setYachtAccess] = useState<UserYachtAccess[]>([]);
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, Record<string, ModulePermissions>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's yacht access and permissions - ENTERPRISE APPROACH
  const loadUserPermissions = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use existing yacht_profiles table to get yacht access
      const { data: ownedYachts, error: yachtError } = await supabase
        .from('yacht_profiles')
        .select('*')
        .eq('owner_id', user.id);

      if (yachtError && !yachtError.message.includes('does not exist')) {
        throw yachtError;
      }

      // Convert yacht profiles to access data
      const accessData: UserYachtAccess[] = (ownedYachts || []).map(yacht => ({
        yacht_id: yacht.id || '',
        role: 'owner',
        access_level: 'admin',
        permissions: { all: true },
        is_active: true
      }));

      setYachtAccess(accessData);

      // Set up enterprise permissions matrix
      const enterpriseMatrix: Record<string, Record<string, ModulePermissions>> = {
        'owner': {
          'all': {
            can_view: true,
            can_add: true,
            can_edit: true,
            can_approve: true,
            can_delete: true
          },
          'crew': {
            can_view: true,
            can_add: true,
            can_edit: true,
            can_approve: true,
            can_delete: false
          },
          'finance': {
            can_view: true,
            can_add: true,
            can_edit: true,
            can_approve: true,
            can_delete: true
          }
        },
        'manager': {
          'all': {
            can_view: true,
            can_add: true,
            can_edit: true,
            can_approve: false,
            can_delete: false
          }
        },
        'captain': {
          'navigation': {
            can_view: true,
            can_add: true,
            can_edit: true,
            can_approve: true,
            can_delete: false
          },
          'crew': {
            can_view: true,
            can_add: true,
            can_edit: true,
            can_approve: false,
            can_delete: false
          }
        },
        'crew': {
          'general': {
            can_view: true,
            can_add: false,
            can_edit: false,
            can_approve: false,
            can_delete: false
          }
        }
      };
      
      setPermissionsMatrix(enterpriseMatrix);

      // Set current yacht if not already set and user has access
      if (!currentYachtId && accessData && accessData.length > 0) {
        const firstYacht = accessData[0].yacht_id;
        setCurrentYachtId(firstYacht);
        localStorage.setItem('currentYachtId', firstYacht);
      }

    } catch (err) {
      console.error('Error loading user permissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentYachtId]);

  // Get current yacht's role and access level
  const currentYachtAccess = yachtAccess.find(access => access.yacht_id === currentYachtId);
  const currentRole = currentYachtAccess?.role || null;
  const currentAccessLevel = currentYachtAccess?.access_level || null;

  // Check fleet access (owners/managers can access multiple yachts)
  const hasFleetAccess = yachtAccess.some(access => 
    ['owner', 'manager'].includes(access.access_level)
  );
  
  const fleetYachtIds = yachtAccess
    .filter(access => ['owner', 'manager'].includes(access.access_level))
    .map(access => access.yacht_id);

  // Permission checking functions
  const hasYachtAccess = useCallback((yachtId: string): boolean => {
    return yachtAccess.some(access => 
      access.yacht_id === yachtId && access.is_active
    );
  }, [yachtAccess]);

  const hasModulePermission = useCallback((
    module: string, 
    permission: keyof ModulePermissions, 
    yachtId?: string
  ): boolean => {
    const targetYachtId = yachtId || currentYachtId;
    if (!targetYachtId) return false;

    // Find user's role for this yacht
    const yachtRole = yachtAccess.find(access => 
      access.yacht_id === targetYachtId && access.is_active
    )?.role;

    if (!yachtRole) return false;

    // Check permission in matrix - try specific module first, then 'all'
    const modulePermissions = permissionsMatrix[yachtRole]?.[module] || 
                             permissionsMatrix[yachtRole]?.["all"];
    return modulePermissions?.[permission] || false;
  }, [yachtAccess, permissionsMatrix, currentYachtId]);

  const canManageYacht = useCallback((yachtId: string): boolean => {
    const access = yachtAccess.find(access => 
      access.yacht_id === yachtId && access.is_active
    );
    
    return access ? ['owner', 'manager', 'captain'].includes(access.access_level) : false;
  }, [yachtAccess]);

  const canViewFinance = useCallback((yachtId: string): boolean => {
    return hasModulePermission('finance', 'can_view', yachtId);
  }, [hasModulePermission]);

  const canManageCrew = useCallback((yachtId: string): boolean => {
    return hasModulePermission('crew', 'can_add', yachtId) || 
           hasModulePermission('crew', 'can_edit', yachtId);
  }, [hasModulePermission]);

  // Switch yacht context - ENTERPRISE VERSION
  const switchYacht = useCallback(async (yachtId: string): Promise<boolean> => {
    if (!hasYachtAccess(yachtId)) {
      setError('Access denied to this yacht');
      return false;
    }

    try {
      setCurrentYachtId(yachtId);
      localStorage.setItem('currentYachtId', yachtId);
      
      // Log activity - simplified approach without RPC
      console.log('[YachtPermissions] Switched to yacht:', yachtId);
      return true;
    } catch (err) {
      console.error('Error switching yacht:', err);
      setError('Failed to switch yacht context');
      return false;
    }
  }, [hasYachtAccess]);

  // Load permissions on user change
  useEffect(() => {
    loadUserPermissions();
  }, [loadUserPermissions]);

  // Update current yacht ID when it changes externally
  useEffect(() => {
    if (initialYachtId && initialYachtId !== currentYachtId) {
      setCurrentYachtId(initialYachtId);
      localStorage.setItem('currentYachtId', initialYachtId);
    }
  }, [initialYachtId, currentYachtId]);

  return {
    currentYachtId,
    yachtAccess,
    currentRole,
    currentAccessLevel,
    hasFleetAccess,
    fleetYachtIds,
    hasYachtAccess,
    hasModulePermission,
    canManageYacht,
    canViewFinance,
    canManageCrew,
    switchYacht,
    isLoading,
    error
  };
};

/**
 * Higher-order component for yacht-scoped route protection
 */
export const withYachtPermission = (
  WrappedComponent: React.ComponentType<any>,
  requiredModule: string,
  requiredPermission: keyof ModulePermissions
) => {
  return function YachtPermissionWrapper(props: any) {
    const permissions = useYachtPermissions();
    
    // Extract yacht ID from URL params or props
    const yachtId = props.yachtId || new URLSearchParams(window.location.search).get('yacht');
    
    if (permissions.isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!yachtId || !permissions.hasYachtAccess(yachtId)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have access to this yacht.</p>
          </div>
        </div>
      );
    }

    if (!permissions.hasModulePermission(requiredModule, requiredPermission, yachtId)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Permission Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have {requiredPermission} permission for {requiredModule} on this yacht.
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} yachtPermissions={permissions} />;
  };
};

/**
 * Permission-aware button component
 */
interface PermissionButtonProps {
  yachtId?: string;
  module: string;
  permission: keyof ModulePermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  yachtId,
  module,
  permission,
  children,
  fallback = null,
  ...props
}) => {
  const permissions = useYachtPermissions();
  
  if (!permissions.hasModulePermission(module, permission, yachtId)) {
    return fallback as React.ReactElement;
  }
  
  return <button {...props}>{children}</button>;
};

export default useYachtPermissions;