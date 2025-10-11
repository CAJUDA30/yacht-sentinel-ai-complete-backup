import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useUserRole } from '@/contexts/UserRoleContext';
import { CheckCircle, AlertCircle, Shield } from 'lucide-react';

export const UnifiedAuthStatus: React.FC = () => {
  const unified = useSupabaseAuth();
  const userRole = useUserRole();
  
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Unified Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Authentication Status:</span>
            <div className="flex items-center gap-2">
              {unified.isAuthenticated ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={unified.isAuthenticated ? "default" : "destructive"}>
                {unified.isAuthenticated ? "AUTHENTICATED" : "NOT AUTHENTICATED"}
              </Badge>
            </div>
          </div>
          
          {unified.isAuthenticated && (
            <>
              <div className="flex items-center justify-between">
                <span>User Email:</span>
                <span className="font-mono text-sm">{unified.user?.email}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>User Roles:</span>
                <span className="font-mono text-sm">{userRole.roles.join(', ')}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>SuperAdmin:</span>
                <Badge variant={userRole.isSuperAdmin ? "default" : "secondary"}>
                  {userRole.isSuperAdmin ? "YES" : "NO"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>System Ready:</span>
                <Badge variant={unified.initialized ? "default" : "secondary"}>
                  {unified.initialized ? "READY" : "LOADING"}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};