// Service Role configuration for Edge Functions
// This uses the service role key for elevated permissions

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://vdjsfupbjtbkpuvwffbn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkanNmdXBianRia3B1dndmZmJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIyNzgxMywiZXhwIjoyMDY5ODAzODEzfQ.YOUR_ACTUAL_SERVICE_ROLE_JWT_SIGNATURE";

// Service role client for Edge Functions
export const supabaseService = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'x-client-info': 'yacht-sentinel-service@1.0.0'
    }
  }
});

// Edge Function caller with service role authentication
export const callEdgeFunction = async (
  functionName: string, 
  payload: any,
  userContext?: { userId?: string; userEmail?: string }
) => {
  try {
    console.log(`[ServiceRole] Calling Edge Function: ${functionName}`);
    
    const { data, error } = await supabaseService.functions.invoke(functionName, {
      body: {
        ...payload,
        // Include user context for audit purposes
        _user_context: userContext
      },
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      console.error(`[ServiceRole] Edge Function ${functionName} error:`, error);
      throw error;
    }

    console.log(`[ServiceRole] Edge Function ${functionName} success`);
    return data;

  } catch (error) {
    console.error(`[ServiceRole] Failed to call ${functionName}:`, error);
    throw error;
  }
};