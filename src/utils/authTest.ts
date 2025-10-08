// Authentication test utility
import { supabase } from '@/integrations/supabase/client';

export const testAuthentication = async () => {
  console.log('[AuthTest] Starting authentication test...');
  
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[AuthTest] Session error:', sessionError);
      return false;
    }
    
    if (!session) {
      console.log('[AuthTest] No active session found');
      return false;
    }
    
    console.log('[AuthTest] Session found:', {
      userId: session.user?.id,
      userEmail: session.user?.email,
      hasAccessToken: !!session.access_token,
      tokenLength: session.access_token?.length,
      tokenValid: session.access_token?.includes('.') && session.access_token?.split('.').length === 3,
      expiresAt: session.expires_at,
      tokenStart: session.access_token?.substring(0, 50) + '...'
    });
    
    // Test Edge Function with this token
    console.log('[AuthTest] Testing Edge Function with user token...');
    
    const response = await fetch(
      'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/production-smart-scan',
      {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkanNmdXBianRia3B1dndmZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjc4MTMsImV4cCI6MjA2OTgwMzgxM30.3sLKA1llE4tRBUaLzZhlLqzvM14d9db5v__GIvwvSng',
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: 'user_auth', user_id: session.user.id })
      }
    );
    
    console.log('[AuthTest] Edge Function response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    const responseText = await response.text();
    console.log('[AuthTest] Edge Function body:', responseText);
    
    return response.ok;
    
  } catch (error) {
    console.error('[AuthTest] Test failed:', error);
    return false;
  }
};

// Export for browser console use
(window as any).testAuthentication = testAuthentication;