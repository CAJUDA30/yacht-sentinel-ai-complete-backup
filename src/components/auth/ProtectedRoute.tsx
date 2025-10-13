import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2 } from 'lucide-react';
import FirstTimeUserHandler from './FirstTimeUserHandler';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user, session, isSuperAdmin } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const previousAuthRef = useRef<boolean | null>(null);
  const previousSuperRef = useRef<boolean | null>(null);

  // CRITICAL: Immediate authentication failure detection with no delays
  useEffect(() => {
    // Track authentication state changes for immediate detection
    const wasAuthenticated = previousAuthRef.current;
    const wasSuper = previousSuperRef.current;
    
    // Update refs
    previousAuthRef.current = isAuthenticated;
    previousSuperRef.current = isSuperAdmin;
    
    // If authentication is complete
    if (!loading) {
      // CRITICAL: Immediate redirect on authentication loss
      if (wasAuthenticated === true && !isAuthenticated) {
        console.error('🚨 IMMEDIATE: Authentication lost - redirecting NOW');
        window.location.href = '/auth';
        return;
      }
      
      // CRITICAL: Immediate redirect on superadmin role loss
      if (wasSuper === true && !isSuperAdmin && isAuthenticated) {
        console.error('🚨 IMMEDIATE: Superadmin role lost - redirecting NOW');
        window.location.href = '/auth';
        return;
      }
      
      // Standard redirections
      // If user is authenticated but on auth page, redirect to home
      if (isAuthenticated && location.pathname === '/auth') {
        console.log('ProtectedRoute: User authenticated on auth page - redirecting to home');
        navigate('/', { replace: true });
      }
      // If user is not authenticated and not on auth page, redirect to auth
      else if (!isAuthenticated && location.pathname !== '/auth') {
        console.log('ProtectedRoute: Redirecting to /auth - not authenticated');
        window.location.href = '/auth'; // Use window.location for immediate redirect
      }
    }
  }, [isAuthenticated, isSuperAdmin, loading, navigate, location.pathname]);

  // Debug authentication state only when there are actual changes
  useEffect(() => {
    // Only log when auth state changes significantly
    if (!loading && (isAuthenticated || (!isAuthenticated && user === null))) {
      console.log('ProtectedRoute:', isAuthenticated ? 'Authenticated' : 'Not authenticated', 'on', location.pathname);
    }
  }, [loading, isAuthenticated, user, location.pathname]);

  // Show minimal loading only while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-muted-foreground">Verifying access...</p>
          <p className="mt-1 text-xs text-muted-foreground">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // Allow access to /auth route regardless of authentication status
  if (location.pathname === '/auth') {
    return <>{children}</>;
  }

  // For all other routes, require authentication
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <FirstTimeUserHandler>
      {children}
    </FirstTimeUserHandler>
  );
};

export default ProtectedRoute;