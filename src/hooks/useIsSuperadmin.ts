import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export function useIsSuperadmin(userId?: string) {
  const { isSuperAdmin, loading, refreshRoles } = useSupabaseAuth();
  
  return {
    isSuper: isSuperAdmin,
    loading,
    refreshStatus: refreshRoles
  };
}
