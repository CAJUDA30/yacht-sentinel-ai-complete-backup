import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const AuthStatusChecker: React.FC = () => {
  const [status, setStatus] = useState<{
    session: any;
    user: any;
    sessionValid: boolean;
    userValid: boolean;
    loading: boolean;
    isSessionMissing?: boolean;
    sessionError?: string;
    userError?: string;
  }>({
    session: null,
    user: null,
    sessionValid: false,
    userValid: false,
    loading: true
  });

  const checkAuthStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('🔍 Checking authentication status...');
      
      // Check session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check:', { sessionData, sessionError });
      
      // Check user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('User check:', { userData, userError });
      
      const sessionValid = !sessionError && !!sessionData.session && !!sessionData.session.user;
      const userValid = !userError && !!userData.user;
      
      // Check for specific auth session missing error
      const isSessionMissing = userError?.name === 'AuthSessionMissingError' || 
                               userError?.message?.includes('Auth session missing');
      
      setStatus({
        session: sessionData.session,
        user: userData.user,
        sessionValid,
        userValid,
        loading: false,
        isSessionMissing,
        sessionError: sessionError?.message,
        userError: userError?.message
      });
      
      // If we have a valid user but no session, try to refresh
      if (userValid && !sessionValid && !isSessionMissing) {
        console.log('⚠️ User valid but session invalid - attempting refresh...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          console.log('✅ Session refreshed successfully');
          // Recheck after refresh
          setTimeout(checkAuthStatus, 1000);
        }
      }
      
    } catch (error) {
      console.error('Auth check failed:', error);
      setStatus(prev => ({ 
        ...prev, 
        loading: false,
        sessionError: error.message,
        userError: error.message
      }));
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const getStatusIcon = (isValid: boolean) => {
    if (status.loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    return isValid ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (isValid: boolean) => {
    if (status.loading) return <Badge variant="secondary">Checking...</Badge>;
    return <Badge variant={isValid ? "default" : "destructive"}>{isValid ? "Valid" : "Invalid"}</Badge>;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Authentication Status
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.sessionValid)}
            <span>Session</span>
          </div>
          {getStatusBadge(status.sessionValid)}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.userValid)}
            <span>User</span>
          </div>
          {getStatusBadge(status.userValid)}
        </div>
        
        {status.session && (
          <div className="text-xs p-2 bg-muted rounded">
            <div><strong>Email:</strong> {status.session.user?.email}</div>
            <div><strong>Expires:</strong> {new Date(status.session.expires_at * 1000).toLocaleString()}</div>
          </div>
        )}
        
        {status.isSessionMissing && (
          <div className="text-xs p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-red-800 font-semibold mb-2">❌ Session Expired</div>
            <div className="text-red-700 mb-2">Your authentication session has expired. Please log in again.</div>
            <Button 
              onClick={() => window.location.href = '/auth'}
              size="sm"
              className="w-full"
            >
              Go to Login Page
            </Button>
          </div>
        )}
        
        {status.sessionError && !status.isSessionMissing && (
          <div className="text-xs p-2 bg-red-50 border border-red-200 rounded">
            <div className="text-red-800">Session Error: {status.sessionError}</div>
          </div>
        )}
        
        {status.userError && !status.isSessionMissing && (
          <div className="text-xs p-2 bg-red-50 border border-red-200 rounded">
            <div className="text-red-800">User Error: {status.userError}</div>
          </div>
        )}
        
        <Button 
          onClick={checkAuthStatus}
          disabled={status.loading}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${status.loading ? 'animate-spin' : ''}`} />
          Recheck Auth
        </Button>
      </CardContent>
    </Card>
  );
};