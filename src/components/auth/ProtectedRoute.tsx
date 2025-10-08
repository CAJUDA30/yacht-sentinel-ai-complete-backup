import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Loader2 } from 'lucide-react';
import FirstTimeUserHandler from './FirstTimeUserHandler';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user, session } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if auth is complete and user is not authenticated
    if (!loading && !isAuthenticated) {
      console.log('ProtectedRoute: Redirecting to /auth - not authenticated');
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Debug authentication state only when there are actual changes
  useEffect(() => {
    // Only log when auth state changes significantly
    if (!loading && (isAuthenticated || (!isAuthenticated && user === null))) {
      console.log('ProtectedRoute:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    }
  }, [loading, isAuthenticated, user]);

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

  // Immediate redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <FirstTimeUserHandler>
      {children}
    </FirstTimeUserHandler>
  );
};

export default ProtectedRoute;