import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wrench, CheckCircle, XCircle } from 'lucide-react';

export const SuperadminFixButton: React.FC = () => {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<string>('');

  const runDatabaseFix = async () => {
    setFixing(true);
    setResult('');
    
    try {
      console.log('🔧 Running superadmin database fix...');
      
      // Since metadata already shows the correct role, just test table access
      const { count, error: tableError } = await supabase
        .from('user_roles' as any)
        .select('*', { count: 'exact', head: true });
      
      if (tableError) {
        setResult('⚠️ Database table not accessible: ' + tableError.message);
        setResult(prev => prev + '\n✅ BUT: User metadata contains correct role, so SuperAdmin should work');
      } else {
        setResult(`✅ Database table accessible with ${count || 0} records`);
        
        // Try to insert user role record
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === 'superadmin@yachtexcel.com') {
          const { error: insertError } = await supabase
            .from('user_roles' as any)
            .upsert({
              user_id: session.user.id,
              role: 'global_superadmin',
              yacht_id: null,
              is_active: true,
              created_by: session.user.id
            });
          
          if (insertError) {
            setResult(prev => prev + '\n⚠️ Could not insert role record: ' + insertError.message);
          } else {
            setResult(prev => prev + '\n✅ Superadmin role record created/updated');
          }
        }
      }
      
    } catch (error) {
      console.error('Fix failed:', error);
      setResult(`❌ Fix failed: ${error}`);
      toast.error('Database fix failed');
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button 
        onClick={runDatabaseFix}
        disabled={fixing}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Wrench className={`h-4 w-4 mr-2 ${fixing ? 'animate-spin' : ''}`} />
        {fixing ? 'Fixing Database...' : 'Fix Superadmin Access'}
      </Button>
      
      {result && (
        <div className="text-xs p-3 bg-muted rounded border">
          <div className="whitespace-pre-line">{result}</div>
        </div>
      )}
    </div>
  );
};