
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// SIMPLIFIED - Use SuperAdminContext as single source of truth
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

export function useIsSuperadmin(userId?: string) {
  const { isSuperAdmin, loading, refreshStatus } = useSuperAdmin();
  
  return {
    isSuper: isSuperAdmin,
    loading,
    refreshStatus
  };
}
