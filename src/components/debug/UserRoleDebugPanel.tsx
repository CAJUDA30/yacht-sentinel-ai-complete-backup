import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Database, Settings, RotateCcw } from 'lucide-react';
import { useSuperAdmin } from '@/contexts/UserRoleContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useYacht } from '@/contexts/YachtContext';
import { SuperadminFixButton } from './SuperadminFixButton';
import { AuthStatusChecker } from './AuthStatusChecker';
import { AuthFixer } from './AuthFixer';
import { UserChecker } from './UserChecker';
import { DirectLogin } from './DirectLogin';
import { DatabaseReset } from './DatabaseReset';

export const UserRoleDebugPanel: React.FC = () => {
  const [authData, setAuthData] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [rpcResult, setRpcResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const { isSuperAdmin, userRole, loading: superAdminLoading } = useSuperAdmin();
  const { settings } = useAppSettings();
  const { isGlobalSuperAdmin, getUserRole, loading: yachtLoading } = useYacht();

  const refreshData = async () => {
    setLoading(true);
    try {
      // Force refresh all contexts by triggering a sign-in event simulation
      console.log('[Debug] Manually refreshing all contexts...');
      
      // Get current session and simulate auth state change
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[Debug] Triggering manual auth state refresh...');
        // This will trigger all context re-evaluations
        supabase.auth.onAuthStateChange((event, session) => {
          console.log('[Debug] Auth state change triggered:', event);
        });
      }
      
      // Refresh debug data
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[Debug] Session check:', sessionData, sessionError);
      
      setAuthData({
        session: sessionData.session ? {
          user: {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
            user_metadata: sessionData.session.user.user_metadata,
            app_metadata: sessionData.session.user.app_metadata
          },
          expires_at: sessionData.session.expires_at,
          access_token: sessionData.session.access_token ? 'Present' : 'Missing'
        } : null,
        error: sessionError
      });
      
      // If no session, try to get user directly as fallback
      if (!sessionData.session) {
        console.log('[Debug] No session found, trying getUser() as fallback...');
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userData.user && !userError) {
            setAuthData({
              session: {
                user: {
                  id: userData.user.id,
                  email: userData.user.email,
                  user_metadata: userData.user.user_metadata,
                  app_metadata: userData.user.app_metadata
                },
                fallback: true
              },
              error: null
            });
          }
        } catch (fallbackError) {
          console.warn('[Debug] Fallback getUser() also failed:', fallbackError);
        }
      }

      // Try to get database role data
      try {
        // Test basic table access with count only to avoid TypeScript issues
        const { count, error: countError } = await supabase
          .from('user_roles' as any)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          setDbData({ userRoles: null, error: `Table access failed: ${countError.message}` });
        } else {
          setDbData({ 
            userRoles: [`Table accessible with ${count || 0} records`], 
            error: null 
          });
        }
      } catch (dbError) {
        setDbData({ userRoles: null, error: `Database error: ${dbError}` });
      }

      // Test RPC function
      try {
        const { data: isSuperadminRpc, error: rpcError } = await supabase
          .rpc('is_superadmin');
        
        setRpcResult({ result: isSuperadminRpc, error: rpcError });
      } catch (rpcError) {
        setRpcResult({ result: null, error: rpcError });
      }

    } catch (error) {
      console.error('Debug panel error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[70vh] overflow-y-auto z-50 space-y-4">
      <AuthStatusChecker />
      
      <Card className="bg-red-50 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-red-800">🆘 CORE SYSTEM FIX</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DatabaseReset />
          <hr className="border-red-200" />
          <DirectLogin />
        </CardContent>
      </Card>
      
      <Card className="bg-background/95 backdrop-blur border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Create/Test User</CardTitle>
        </CardHeader>
        <CardContent>
          <UserChecker />
        </CardContent>
      </Card>
      
      <Card className="bg-background/95 backdrop-blur border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              User Role Debug
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 text-sm">
          {/* Context States */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Context States
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>SuperAdmin Context:</span>
                <Badge variant={isSuperAdmin ? "default" : "secondary"}>
                  {superAdminLoading ? 'Loading...' : (isSuperAdmin ? 'Super Admin' : userRole)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>App Settings Role:</span>
                <Badge variant="outline">{settings.user.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Yacht Context:</span>
                <Badge variant={isGlobalSuperAdmin ? "default" : "secondary"}>
                  {yachtLoading ? 'Loading...' : (isGlobalSuperAdmin ? 'Global Admin' : getUserRole() || 'No Role')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Auth Session Data */}
          <div>
            <h4 className="font-semibold mb-2">Auth Session</h4>
            {authData?.session ? (
              <div className="space-y-1 text-xs">
                <div><strong>Email:</strong> {authData.session.user.email}</div>
                <div><strong>User Metadata:</strong> {JSON.stringify(authData.session.user.user_metadata, null, 2)}</div>
                <div><strong>App Metadata:</strong> {JSON.stringify(authData.session.user.app_metadata, null, 2)}</div>
              </div>
            ) : (
              <Badge variant="destructive">No Session</Badge>
            )}
            {authData?.error && (
              <div className="text-red-500 text-xs mt-1">
                Error: {authData.error.message}
              </div>
            )}
          </div>

          {/* Database Data */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Roles
            </h4>
            {dbData?.userRoles ? (
              <div className="space-y-1 text-xs">
                {dbData.userRoles.map((role: any, index: number) => (
                  <div key={index} className="p-2 border rounded">
                    <div><strong>Role:</strong> {role.role}</div>
                    <div><strong>Yacht ID:</strong> {role.yacht_id || 'Global'}</div>
                    <div><strong>Active:</strong> {role.is_active ? 'Yes' : 'No'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Badge variant="secondary">No Roles Found</Badge>
            )}
            {dbData?.error && (
              <div className="text-red-500 text-xs mt-1">
                Error: {dbData.error.message}
              </div>
            )}
          </div>

          {/* RPC Function Result */}
          <div>
            <h4 className="font-semibold mb-2">RPC Function Test</h4>
            <div className="flex justify-between">
              <span>is_superadmin():</span>
              <Badge variant={rpcResult?.result ? "default" : "secondary"}>
                {rpcResult?.result ? 'TRUE' : 'FALSE'}
              </Badge>
            </div>
            {rpcResult?.error && (
              <div className="text-red-500 text-xs mt-1">
                Error: {rpcResult.error.message}
              </div>
            )}
          </div>
          
          {/* Fix Button */}
          <div>
            <h4 className="font-semibold mb-2">Authentication Fix</h4>
            <AuthFixer />
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Database Fix</h4>
            <div className="space-y-2">
              <SuperadminFixButton />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Force Page Reload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};