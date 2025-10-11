import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2 } from 'lucide-react';
import FirstTimeUserHandler from './FirstTimeUserHandler';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user, session } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If authentication is complete
    if (!loading) {
      // If user is authenticated but on auth page, redirect to home
      if (isAuthenticated && location.pathname === '/auth') {
        console.log('ProtectedRoute: User authenticated on auth page - redirecting to home');
        navigate('/', { replace: true });
      }
      // If user is not authenticated and not on auth page, redirect to auth
      else if (!isAuthenticated && location.pathname !== '/auth') {
        console.log('ProtectedRoute: Redirecting to /auth - not authenticated');
        navigate('/auth', { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

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