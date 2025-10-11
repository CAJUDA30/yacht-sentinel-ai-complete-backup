/**
 * FirstTimeUserHandler - Yacht-Centric First Time User Flow
 * 
 * Handles automatic redirection for users who don't have any yachts associated
 * with their account to complete the yacht onboarding wizard before accessing
 * the rest of the application.
 * 
 * This component ensures that the yacht ID becomes the central key for all
 * data and operations in the system, implementing the yacht-centric architecture.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2, Ship, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FirstTimeUserHandlerProps {
  children: React.ReactNode;
}

interface UserYachtStatus {
  hasYachts: boolean;
  yachtCount: number;
  isLoading: boolean;
  error: string | null;
}

const FirstTimeUserHandler: React.FC<FirstTimeUserHandlerProps> = ({ children }) => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [yachtStatus, setYachtStatus] = useState<UserYachtStatus>({
    hasYachts: false,
    yachtCount: 0,
    isLoading: true,
    error: null
  });

  // Routes that should be accessible even without yachts
  const allowedRoutesWithoutYacht = [
    '/yacht/onboarding',
    '/auth',
    '/superadmin',
    // Allow test routes for development
    '/comprehensive-test',
    '/document-processing'
  ];

  // Check if current route is allowed without yacht
  const isRouteAllowedWithoutYacht = (pathname: string): boolean => {
    return allowedRoutesWithoutYacht.some(route => pathname.startsWith(route));
  };

  // Check user's yacht status
  const checkUserYachtStatus = async () => {
    if (!user || !isAuthenticated) {
      setYachtStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Skip yacht status check for SuperAdmin routes and users to avoid permission issues
    if (location.pathname.startsWith('/superadmin') || 
        user.email?.includes('superadmin') || 
        user.app_metadata?.role === 'superadmin' ||
        user.user_metadata?.role === 'global_superadmin') {
      console.log('[FirstTimeUserHandler] SuperAdmin detected, bypassing yacht check');
      setYachtStatus({
        hasYachts: true, // Assume SuperAdmin always has access
        yachtCount: 1,
        isLoading: false,
        error: null
      });
      return;
    }

    try {
      setYachtStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if user has any yachts associated with their account
      const { data: userYachts, error } = await supabase
        .from('yacht_profiles')
        .select(`
          id,
          yacht_id,
          created_at,
          yachts!inner(
            id,
            name
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[FirstTimeUserHandler] Error checking yacht status:', error);
        
        // For SuperAdmin users, don't block access due to database permission issues
        if (user.email?.includes('superadmin') || user.app_metadata?.role === 'superadmin') {
          console.log('[FirstTimeUserHandler] SuperAdmin detected, bypassing yacht check');
          setYachtStatus({
            hasYachts: true,
            yachtCount: 1,
            isLoading: false,
            error: null
          });
          return;
        }
        
        setYachtStatus({
          hasYachts: false,
          yachtCount: 0,
          isLoading: false,
          error: error.message
        });
        return;
      }

      const hasYachts = userYachts && userYachts.length > 0;
      const yachtCount = userYachts?.length || 0;

      console.log(`[FirstTimeUserHandler] User yacht status:`, {
        userId: user.id,
        email: user.email,
        hasYachts,
        yachtCount,
        yachts: userYachts?.map(y => ({ 
          id: y.yacht_id, 
          name: y.yachts?.name || 'Unknown Yacht'
        }))
      });

      setYachtStatus({
        hasYachts,
        yachtCount,
        isLoading: false,
        error: null
      });

      // Handle first-time user redirection
      if (!hasYachts && !isRouteAllowedWithoutYacht(location.pathname)) {
        console.log('[FirstTimeUserHandler] First-time user detected, redirecting to onboarding');
        navigate('/yacht/onboarding', { 
          replace: true,
          state: { 
            reason: 'first_time_user',
            originalPath: location.pathname
          }
        });
      }

    } catch (error) {
      console.error('[FirstTimeUserHandler] Unexpected error:', error);
      setYachtStatus({
        hasYachts: false,
        yachtCount: 0,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Check yacht status when user authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      checkUserYachtStatus();
    } else {
      setYachtStatus({
        hasYachts: false,
        yachtCount: 0,
        isLoading: false,
        error: null
      });
    }
  }, [user, isAuthenticated, location.pathname]);

  // Handle loading state
  if (yachtStatus.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Ship className="h-8 w-8 text-primary animate-pulse mr-3" />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Checking Your Fleet Status</h3>
            <p className="text-muted-foreground">Verifying your yacht assignments...</p>
            <p className="text-xs text-muted-foreground">If this takes more than a few seconds, you might need to add your first yacht</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state - Show welcome message instead of technical error
  if (yachtStatus.error && !isRouteAllowedWithoutYacht(location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Ship className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome to Yacht Excel!</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              It looks like you don't have any yachts registered yet. Let's get you started with our quick onboarding process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Ship className="h-4 w-4" />
              <AlertDescription>
                <strong>No yachts found:</strong> To access Yacht Excel's features, you'll need to register your first yacht or get invited to an existing one.
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900">Add Your Yacht Details</h4>
                  <p className="text-xs text-blue-700 mt-1">Quick registration with vessel specifications</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/yacht/onboarding')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
              >
                <Ship className="w-5 h-5 mr-2" />
                Register Your First Yacht
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                Already have access to a yacht? Contact your yacht administrator for an invitation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show onboarding prompt for users without yachts on specific routes
  if (!yachtStatus.hasYachts && location.pathname === '/' && !isRouteAllowedWithoutYacht(location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Ship className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to YachtExcel!</CardTitle>
            <CardDescription className="text-base">
              Let's get started by adding your first yacht to the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Complete yacht registration and documentation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Set up crew assignments and roles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Configure operational settings and access control</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>Generate your unique Yacht ID for all operations</span>
              </div>
            </div>

            <Alert>
              <Ship className="h-4 w-4" />
              <AlertDescription>
                <strong>Yacht-Centric Design:</strong> Your yacht will become the central hub for all crew, 
                operations, and data. Everything in the system is organized around your yacht's unique ID.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => navigate('/yacht/onboarding')}
              className="w-full"
              size="lg"
            >
              Start Yacht Onboarding
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              If you were invited to an existing yacht, contact your yacht administrator for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Allow access to the app if user has yachts or is on an allowed route
  return <>{children}</>;
};

export default FirstTimeUserHandler;