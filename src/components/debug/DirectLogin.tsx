import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

export const DirectLogin: React.FC = () => {
  const [working, setWorking] = useState(false);

  const loginDirectly = async () => {
    setWorking(true);
    try {
      console.log('Attempting login with correct credentials...');
      
      // Test basic connectivity by trying to get session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check before login:', { sessionData, sessionError });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'superadmin@yachtexcel.com',
        password: 'Ocean2024!'
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(`Login failed: ${error.message}`);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.warning('User may not exist or password is wrong. Database might need reset.');
        } else if (error.message.includes('400') || error.message.includes('422')) {
          toast.error('Supabase database connection issue. Check if Docker/Supabase is running.');
        }
      } else {
        console.log('Login successful:', data);
        toast.success('Login successful! Refreshing page...');
        
        // Wait a moment then reload
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Login exception:', error);
      toast.error(`Login exception: ${error}`);
      
      if (error.toString().includes('fetch')) {
        toast.error('Network error - Supabase may not be running. Check Docker.');
      }
    } finally {
      setWorking(false);
    }
  };

  return (
    <Button 
      onClick={loginDirectly}
      disabled={working}
      className="w-full"
      size="sm"
    >
      <LogIn className={`h-4 w-4 mr-2 ${working ? 'animate-spin' : ''}`} />
      {working ? 'Logging in...' : 'Login as Superadmin (Ocean2024!)'}
    </Button>
  );
};