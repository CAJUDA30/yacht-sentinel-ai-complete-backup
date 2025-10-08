import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogOut, LogIn, RefreshCw } from 'lucide-react';

export const AuthFixer: React.FC = () => {
  const [working, setWorking] = useState(false);

  const handleSignOut = async () => {
    setWorking(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Sign out failed: ${error.message}`);
      } else {
        toast.success('Signed out successfully');
        // Clear any cached data
        localStorage.clear();
        sessionStorage.clear();
        // Redirect to auth page
        window.location.href = '/auth';
      }
    } catch (error) {
      toast.error(`Sign out error: ${error}`);
    } finally {
      setWorking(false);
    }
  };

  const handleSignInWithPassword = async () => {
    setWorking(true);
    try {
      // We'll try the correct password first
      const possiblePasswords = ['Ocean2024!', 'admin123', 'password', 'superadmin123'];
      
      let signInSuccess = false;
      let lastError = null;
      
      for (const password of possiblePasswords) {
        try {
          console.log(`Trying password: ${password}`);
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'superadmin@yachtexcel.com',
            password: password
          });
          
          if (!error && data.user) {
            toast.success(`Signed in successfully!`);
            signInSuccess = true;
            // Force reload to refresh all contexts
            window.location.reload();
            return;
          }
          lastError = error;
          console.log(`Password ${password} failed:`, error?.message);
        } catch (e) {
          lastError = e;
          console.log(`Password ${password} error:`, e);
        }
      }
      
      if (!signInSuccess) {
        toast.error(`All password attempts failed. Last error: ${lastError?.message}`);
        toast.info('The superadmin user may not exist. Try creating it first.');
      }
      
    } catch (error) {
      toast.error(`Sign in error: ${error}`);
    } finally {
      setWorking(false);
    }
  };
  
  const handleCreateSuperadmin = async () => {
    setWorking(true);
    try {
      // Try to create the superadmin user with the correct password
      const { data, error } = await supabase.auth.signUp({
        email: 'superadmin@yachtexcel.com',
        password: 'Ocean2024!',
        options: {
          data: {
            role: 'global_superadmin',
            email: 'superadmin@yachtexcel.com'
          }
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.warning('User already exists. Try signing in or use a different password.');
        } else {
          toast.error(`Failed to create user: ${error.message}`);
        }
      } else {
        toast.success('Superadmin user created successfully!');
        toast.info('Check your email for confirmation, or try signing in with password: admin123');
      }
    } catch (error) {
      toast.error(`Create user error: ${error}`);
    } finally {
      setWorking(false);
    }
  };

  const clearAndReload = () => {
    // Clear all local storage and session storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any Supabase auth tokens
    supabase.auth.signOut();
    
    toast.info('Cleared all data, redirecting to login...');
    
    // Redirect to auth page
    setTimeout(() => {
      window.location.href = '/auth';
    }, 1000);
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleCreateSuperadmin}
        disabled={working}
        size="sm"
        className="w-full"
      >
        <LogIn className={`h-4 w-4 mr-2 ${working ? 'animate-spin' : ''}`} />
        {working ? 'Creating...' : 'Create Superadmin User'}
      </Button>
      
      <Button 
        onClick={handleSignInWithPassword}
        disabled={working}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <LogIn className={`h-4 w-4 mr-2 ${working ? 'animate-spin' : ''}`} />
        {working ? 'Trying Passwords...' : 'Try Common Passwords'}
      </Button>
      
      <Button 
        onClick={handleSignOut}
        disabled={working}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out & Go to Login
      </Button>
      
      <Button 
        onClick={clearAndReload}
        disabled={working}
        variant="destructive"
        size="sm"
        className="w-full"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Clear All Data & Restart
      </Button>
    </div>
  );
};