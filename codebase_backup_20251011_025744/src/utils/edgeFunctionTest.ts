// Simple Edge Function connectivity test
import { supabase } from '@/integrations/supabase/client';

export const testEdgeFunctionConnection = async () => {
  try {
    console.log('[Test] Starting Edge Function connectivity test...');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[Test] Session error:', sessionError);
      return false;
    }
    
    if (!session?.access_token) {
      console.error('[Test] No valid session found');
      return false;
    }
    
    console.log('[Test] Session valid, testing function call...');
    
    // Test function call
    const { data, error } = await supabase.functions.invoke('production-smart-scan', {
      body: { test: true },
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[Test] Function call result:', { data, error });
    
    if (error) {
      console.error('[Test] Function call failed:', error);
      
      // Try direct fetch as fallback
      console.log('[Test] Trying direct fetch...');
      const response = await fetch(
        'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/production-smart-scan',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: true })
        }
      );
      
      console.log('[Test] Direct fetch response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const responseText = await response.text();
      console.log('[Test] Direct fetch body:', responseText);
      
      return response.ok || response.status === 401; // 401 is expected for this test
    }
    
    return true;
    
  } catch (error) {
    console.error('[Test] Connectivity test failed:', error);
    return false;
  }
};

// Export for use in browser console
(window as any).testEdgeFunctionConnection = testEdgeFunctionConnection;