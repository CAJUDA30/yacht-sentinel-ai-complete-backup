import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to handle page visibility changes and refresh authentication state
 * Fixes issues where switching tabs requires a refresh to show the home page
 */
export const useVisibilityRefresh = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only refresh when page becomes visible
      if (document.visibilityState === 'visible') {
        console.log('[VisibilityRefresh] Page became visible, checking auth state');
        
        try {
          // Check current session
          const { data: { session } } = await supabase.auth.getSession();
          
          // If we're on auth page but have a session, redirect to home
          if (session && location.pathname === '/auth') {
            console.log('[VisibilityRefresh] Session found on auth page, redirecting to home');
            navigate('/', { replace: true });
          }
          
          // If we're not on auth page but have no session, redirect to auth
          if (!session && location.pathname !== '/auth') {
            console.log('[VisibilityRefresh] No session found, redirecting to auth');
            navigate('/auth', { replace: true });
          }
        } catch (error) {
          console.error('[VisibilityRefresh] Error checking session:', error);
        }
      }
    };

    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate, location.pathname]);
};
