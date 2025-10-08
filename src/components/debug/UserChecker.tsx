import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, UserPlus, Eye, EyeOff } from 'lucide-react';

export const UserChecker: React.FC = () => {
  const [email, setEmail] = useState('superadmin@yachtexcel.com');
  const [password, setPassword] = useState('Ocean2024!');
  const [showPassword, setShowPassword] = useState(false);
  const [working, setWorking] = useState(false);

  const handleTestLogin = async () => {
    setWorking(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        toast.error(`Login failed: ${error.message}`);
        
        // If user doesn't exist, offer to create it
        if (error.message.includes('Invalid login credentials')) {
          toast.info('User may not exist. Try creating the account first.');
        }
      } else {
        toast.success(`Login successful for ${email}!`);
        // Force reload to refresh all contexts
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      toast.error(`Error: ${error}`);
    } finally {
      setWorking(false);
    }
  };

  const handleCreateUser = async () => {
    setWorking(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            role: 'global_superadmin',
            email: email.trim()
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.warning('User already exists! Try logging in instead.');
        } else {
          toast.error(`Failed to create user: ${error.message}`);
        }
      } else {
        toast.success(`User created successfully for ${email}!`);
        toast.info('You may need to confirm the email, but you can try logging in now.');
      }
    } catch (error) {
      toast.error(`Create error: ${error}`);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium">Email:</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="h-8 text-xs"
        />
      </div>
      
      <div>
        <label className="text-xs font-medium">Password:</label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="h-8 text-xs pr-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-8 w-8 p-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Button 
          onClick={handleCreateUser}
          disabled={working || !email || !password}
          size="sm"
          className="w-full"
        >
          <UserPlus className={`h-4 w-4 mr-2 ${working ? 'animate-spin' : ''}`} />
          {working ? 'Creating...' : 'Create User'}
        </Button>
        
        <Button 
          onClick={handleTestLogin}
          disabled={working || !email || !password}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Search className={`h-4 w-4 mr-2 ${working ? 'animate-spin' : ''}`} />
          {working ? 'Testing...' : 'Test Login'}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Try creating the superadmin user first, then test login.
      </div>
    </div>
  );
};