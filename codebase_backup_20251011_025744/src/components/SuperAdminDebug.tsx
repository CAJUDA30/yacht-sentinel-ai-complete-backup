import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

/**
 * DEBUG COMPONENT - Use temporarily to diagnose superadmin role issues
 * Add this to your app temporarily: <SuperAdminDebug />
 */
export const SuperAdminDebug: React.FC = () => {
  const { isSuperAdmin, userRole, loading, refreshStatus } = useSuperAdmin();
  const [debugInfo, setDebugInfo] = useState<any>({});

  const runDiagnostics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        setDebugInfo({ error: 'No authenticated user' });
        return;
      }

      // Test database function
      let dbFunctionResult = null;
      let dbFunctionError = null;
      try {
        const { data, error } = await supabase.rpc('is_superadmin');
        dbFunctionResult = data;
        dbFunctionError = error;
      } catch (e) {
        dbFunctionError = e;
      }

      // Check user_roles table directly
      let userRolesResult = null;
      let userRolesError = null;
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, created_at')
          .eq('user_id', user.id);
        userRolesResult = data;
        userRolesError = error;
      } catch (e) {
        userRolesError = e;
      }

      setDebugInfo({
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata
        },
        superAdminContext: {
          isSuperAdmin,
          userRole,
          loading
        },
        databaseFunction: {
          result: dbFunctionResult,
          error: dbFunctionError?.message || null
        },
        userRolesTable: {
          result: userRolesResult,
          error: userRolesError?.message || null
        },
        detectionMethods: {
          email: user.email === 'superadmin@yachtexcel.com',
          userMetadata: user.user_metadata?.role === 'global_superadmin' || user.user_metadata?.is_superadmin === true,
          appMetadata: user.app_metadata?.role === 'global_superadmin' || user.app_metadata?.is_superadmin === true,
          hardcodedId: user.id === 'c5f001c6-6a59-49bb-a698-a97c5a028b2a',
          database: dbFunctionResult === true
        }
      });
    } catch (error) {
      setDebugInfo({ error: error.message });
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [isSuperAdmin, userRole, loading]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid red', 
      padding: '10px', 
      borderRadius: '5px',
      maxWidth: '400px',
      maxHeight: '400px',
      overflow: 'auto',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <h3 style={{ color: 'red', margin: '0 0 10px 0' }}>🔍 SuperAdmin Debug</h3>
      
      <button 
        onClick={refreshStatus}
        style={{ 
          background: 'blue', 
          color: 'white', 
          border: 'none', 
          padding: '5px 10px', 
          margin: '0 5px 10px 0',
          borderRadius: '3px'
        }}
      >
        Refresh Status
      </button>
      
      <button 
        onClick={runDiagnostics}
        style={{ 
          background: 'green', 
          color: 'white', 
          border: 'none', 
          padding: '5px 10px', 
          margin: '0 0 10px 0',
          borderRadius: '3px'
        }}
      >
        Run Diagnostics
      </button>

      <pre style={{ 
        background: '#f5f5f5', 
        padding: '5px', 
        borderRadius: '3px',
        fontSize: '10px',
        overflow: 'auto'
      }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};