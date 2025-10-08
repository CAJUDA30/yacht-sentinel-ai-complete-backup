import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RotateCcw, Database, Play } from 'lucide-react';

export const DatabaseReset: React.FC = () => {
  const [working, setWorking] = useState(false);

  const testConnection = async () => {
    setWorking(true);
    try {
      console.log('Testing Supabase connection...');
      
      // Try a simple auth operation
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session test:', { sessionData, sessionError });
      
      if (sessionError) {
        toast.error(`Connection failed: ${sessionError.message}`);
      } else {
        toast.success('Supabase connection working!');
      }
      
      // Try a simple database operation
      const { data: tableData, error: tableError } = await supabase
        .from('yachts')
        .select('count', { count: 'exact', head: true });
      
      if (tableError) {
        toast.error(`Database error: ${tableError.message}`);
        console.error('Database error:', tableError);
      } else {
        toast.success(`Database accessible with ${tableData || 0} yacht records`);
      }
      
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error(`Test failed: ${error}`);
    } finally {
      setWorking(false);
    }
  };

  const createSuperadminUser = async () => {
    setWorking(true);
    try {
      console.log('Creating superadmin user...');
      
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
          toast.warning('User already exists! That\'s good - try logging in now.');
        } else {
          toast.error(`Failed to create user: ${error.message}`);
          console.error('Signup error:', error);
        }
      } else {
        toast.success('Superadmin user created successfully!');
        console.log('Signup success:', data);
      }
    } catch (error) {
      console.error('Create user failed:', error);
      toast.error(`Create failed: ${error}`);
    } finally {
      setWorking(false);
    }
  };

  const restartInstructions = () => {
    toast.info('Manual restart required:');
    toast.info('1. Stop this dev server (Ctrl+C)');
    toast.info('2. Run: docker stop $(docker ps -q)');
    toast.info('3. Run: supabase stop');
    toast.info('4. Run: supabase start');
    toast.info('5. Run: npm run dev');
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={testConnection}
        disabled={working}
        size="sm"
        className="w-full"
      >
        <Database className={`h-4 w-4 mr-2 ${working ? 'animate-spin' : ''}`} />
        {working ? 'Testing...' : 'Test Connection'}
      </Button>
      
      <Button 
        onClick={createSuperadminUser}
        disabled={working}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Play className={`h-4 w-4 mr-2 ${working ? 'animate-spin' : ''}`} />
        {working ? 'Creating...' : 'Create Superadmin User'}
      </Button>
      
      <Button 
        onClick={restartInstructions}
        variant="destructive"
        size="sm"
        className="w-full"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Manual Restart Instructions
      </Button>
    </div>
  );
};