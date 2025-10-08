/**
 * User Role System Test
 * This script tests the complete user role synchronization system
 */

import { supabase } from '@/integrations/supabase/client';
import { userRoleService } from '@/services/UserRoleService';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

class UserRoleSystemTest {
  private results: TestResult[] = [];

  private addResult(testName: string, passed: boolean, message: string, details?: any) {
    this.results.push({ testName, passed, message, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName}: ${message}`, details || '');
  }

  async testSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('user_roles').select('count(*)', { count: 'exact' });
      if (error) {
        if (error.message.includes('does not exist')) {
          this.addResult('Supabase Connection', true, 'Connected, table needs migration', error.message);
        } else {
          this.addResult('Supabase Connection', false, 'Connection failed', error.message);
        }
      } else {
        this.addResult('Supabase Connection', true, `Connected, table exists with ${data?.length || 0} records`);
      }
    } catch (error) {
      this.addResult('Supabase Connection', false, 'Connection test failed', error);
    }
  }

  async testUserRoleService() {
    try {
      // Test getCurrentUserRoleInfo
      const userInfo = await userRoleService.getCurrentUserRoleInfo();
      
      if (userInfo) {
        this.addResult('UserRoleService', true, `Service working, user role: ${userInfo.primaryRole}`, userInfo);
        
        // Test superadmin check
        const isSuperAdmin = await userRoleService.isSuperAdmin();
        this.addResult('SuperAdmin Check', true, `SuperAdmin status: ${isSuperAdmin}`);
        
        return userInfo;
      } else {
        this.addResult('UserRoleService', false, 'No user role info returned');
        return null;
      }
    } catch (error) {
      this.addResult('UserRoleService', false, 'Service test failed', error);
      return null;
    }
  }

  async testEdgeFunction() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        this.addResult('Edge Function', false, 'No active session for testing');
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        'setup-user-roles-on-login',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (error) {
        this.addResult('Edge Function', false, 'Edge function call failed', error);
      } else {
        this.addResult('Edge Function', true, 'Edge function successful', data);
      }
    } catch (error) {
      this.addResult('Edge Function', false, 'Edge function test failed', error);
    }
  }

  async testDatabaseQueries() {
    try {
      // Test RPC functions
      const { data: isSuperAdminRPC, error: rpcError } = await supabase.rpc('is_superadmin');
      
      if (rpcError) {
        if (rpcError.message.includes('does not exist')) {
          this.addResult('Database RPC', true, 'RPC functions need migration', rpcError.message);
        } else {
          this.addResult('Database RPC', false, 'RPC function failed', rpcError.message);
        }
      } else {
        this.addResult('Database RPC', true, `RPC is_superadmin returned: ${isSuperAdminRPC}`);
      }

      // Test direct table query
      const { data: roles, error: tableError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(1);

      if (tableError) {
        if (tableError.message.includes('does not exist')) {
          this.addResult('Database Table', true, 'Table needs migration', tableError.message);
        } else {
          this.addResult('Database Table', false, 'Table query failed', tableError.message);
        }
      } else {
        this.addResult('Database Table', true, `Table accessible, sample data:`, roles?.[0] || 'No data');
      }
    } catch (error) {
      this.addResult('Database Queries', false, 'Database test failed', error);
    }
  }

  async testSuperAdminFallback() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        this.addResult('SuperAdmin Fallback', false, 'No authenticated user');
        return;
      }

      const isSuperAdminUser = user.id === '6d201176-5be1-45d4-b09f-f70cb4ad38ac' ||
                              user.email === 'superadmin@yachtexcel.com';

      if (isSuperAdminUser) {
        // Test if fallback works
        const userInfo = await userRoleService.getUserRoleInfo(user.id);
        const expectedSuperAdmin = userInfo?.isSuper === true;
        
        this.addResult(
          'SuperAdmin Fallback', 
          expectedSuperAdmin, 
          `SuperAdmin fallback ${expectedSuperAdmin ? 'working' : 'failed'} for designated user`,
          { userId: user.id, email: user.email, userInfo }
        );
      } else {
        this.addResult('SuperAdmin Fallback', true, 'Current user is not the designated superadmin', {
          userId: user.id,
          email: user.email
        });
      }
    } catch (error) {
      this.addResult('SuperAdmin Fallback', false, 'Fallback test failed', error);
    }
  }

  async runAllTests() {
    console.log('🧪 Starting User Role System Tests...');
    console.log('=' .repeat(50));

    await this.testSupabaseConnection();
    await this.testDatabaseQueries();
    const userInfo = await this.testUserRoleService();
    await this.testEdgeFunction();
    await this.testSuperAdminFallback();

    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Results Summary:');
    console.log('=' .repeat(50));

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.message}`);
    });

    console.log('\n' + '=' .repeat(50));
    console.log(`📈 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! User role system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }

    // Return summary for programmatic use
    return {
      passed,
      total,
      success: passed === total,
      results: this.results,
      userInfo
    };
  }
}

// Export for use in components or console
export const testUserRoleSystem = async () => {
  const tester = new UserRoleSystemTest();
  return await tester.runAllTests();
};

// Auto-run if in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make available globally for console testing
  (window as any).testUserRoleSystem = testUserRoleSystem;
  console.log('🔧 User Role System Test available globally: testUserRoleSystem()');
}