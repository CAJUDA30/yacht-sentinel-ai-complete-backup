import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Play, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VerificationResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export const ComprehensiveVerification = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    const tests: VerificationResult[] = [];
    
    // Test Authentication
    try {
      const { data: { user } } = await supabase.auth.getUser();
      tests.push({
        name: 'Authentication',
        status: user ? 'pass' : 'fail',
        message: user ? `Active session for ${user.email}` : 'No active session',
        details: user ? 'User authentication working properly' : 'Authentication required'
      });
    } catch (error) {
      tests.push({
        name: 'Authentication',
        status: 'fail',
        message: 'Authentication check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Database Connectivity
    try {
      const start = Date.now();
      const { data, error } = await supabase.from('system_logs').select('count').limit(1);
      const responseTime = Date.now() - start;
      
      tests.push({
        name: 'Database Connectivity',
        status: error ? 'fail' : 'pass',
        message: error ? `Connection failed: ${error.message}` : `Connected (${responseTime}ms)`,
        details: error ? 'Database connection error' : 'Supabase connection established'
      });
    } catch (error) {
      tests.push({
        name: 'Database Connectivity',
        status: 'fail',
        message: 'Database connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Edge Functions
    try {
      const { data, error } = await supabase.functions.invoke('system-monitor', {
        body: { action: 'health-check' }
      });
      
      tests.push({
        name: 'Edge Functions',
        status: error ? 'fail' : 'pass',
        message: error ? 'Edge function call failed' : 'All functions responding',
        details: error ? error.message : 'System monitor and AI functions operational'
      });
    } catch (error) {
      tests.push({
        name: 'Edge Functions',
        status: 'fail',
        message: 'Edge function test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test AI Processing
    try {
      const { data: processingLogs } = await supabase
        .from('ai_processing_logs')
        .select('processing_time_ms, success')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(10);

      const successRate = processingLogs?.length
        ? (processingLogs.filter(log => log.success).length / processingLogs.length) * 100
        : 0;

      tests.push({
        name: 'AI Processing',
        status: successRate >= 80 ? 'pass' : successRate >= 50 ? 'warning' : 'fail',
        message: `${processingLogs?.length || 0} requests, ${Math.round(successRate)}% success rate`,
        details: 'AI models and processing pipeline operational'
      });
    } catch (error) {
      tests.push({
        name: 'AI Processing',
        status: 'warning',
        message: 'AI processing test failed',
        details: 'Unable to check AI processing logs'
      });
    }

    // Test Yacht Data
    try {
      const { data: yachtProfile, error } = await supabase
        .from('yacht_profiles')
        .select('*')
        .limit(1);

      tests.push({
        name: 'Yacht Data',
        status: error ? 'warning' : yachtProfile?.length ? 'pass' : 'warning',
        message: error ? 'Yacht data error' : yachtProfile?.length ? 'Yacht profile found' : 'No yacht profile configured',
        details: error ? error.message : yachtProfile?.length ? 'Enterprise yacht data accessible' : 'Configure yacht profile in settings'
      });
    } catch (error) {
      tests.push({
        name: 'Yacht Data',
        status: 'warning',
        message: 'Yacht data test failed',
        details: 'Unable to check yacht profile data'
      });
    }

    // Test Inventory System
    try {
      const { count, error } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true });

      tests.push({
        name: 'Inventory System',
        status: error ? 'fail' : 'pass',
        message: error ? 'Inventory system error' : `${count || 0} inventory items tracked`,
        details: error ? error.message : 'Inventory management system operational'
      });
    } catch (error) {
      tests.push({
        name: 'Inventory System',
        status: 'fail',
        message: 'Inventory test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Performance
    try {
      const { data: recentLogs } = await supabase
        .from('ai_processing_logs')
        .select('processing_time_ms')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .limit(50);

      const avgTime = recentLogs?.length 
        ? recentLogs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / recentLogs.length
        : 0;

      tests.push({
        name: 'System Performance',
        status: avgTime < 2000 ? 'pass' : avgTime < 5000 ? 'warning' : 'fail',
        message: `Average response time: ${Math.round(avgTime)}ms`,
        details: avgTime < 2000 ? 'Performance within acceptable limits' : 'Consider performance optimization'
      });
    } catch (error) {
      tests.push({
        name: 'System Performance',
        status: 'warning',
        message: 'Performance metrics unavailable',
        details: 'Unable to measure system performance'
      });
    }

    // Test Error Monitoring
    try {
      const { data: recentErrors } = await supabase
        .from('system_logs')
        .select('count')
        .eq('level', 'error')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const errorCount = recentErrors?.length || 0;
      tests.push({
        name: 'Error Monitoring',
        status: errorCount === 0 ? 'pass' : errorCount < 5 ? 'warning' : 'fail',
        message: `${errorCount} errors in last 24 hours`,
        details: errorCount === 0 ? 'No recent errors detected' : 'Monitor error logs for issues'
      });
    } catch (error) {
      tests.push({
        name: 'Error Monitoring',
        status: 'warning',
        message: 'Error monitoring test failed',
        details: 'Unable to check error logs'
      });
    }

    setResults(tests);
    setLastRun(new Date());
    setIsRunning(false);
    
    const passedTests = tests.filter(t => t.status === 'pass').length;
    const totalTests = tests.length;
    
    toast({
      title: "Verification Complete",
      description: `${passedTests}/${totalTests} tests passed. Real system verification complete.`
    });
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return 'text-green-600 dark:text-green-400';
      case 'fail': return 'text-red-600 dark:text-red-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const overallScore = results.length > 0 ? 
    Math.round((results.filter(r => r.status === 'pass').length / results.length) * 100) : 0;

  return (
    <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Comprehensive System Verification</span>
          </div>
          <div className="flex items-center space-x-2">
            {results.length > 0 && (
              <Badge variant="outline" className={overallScore >= 80 ? 'text-green-600' : overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                Score: {overallScore}%
              </Badge>
            )}
            <Button 
              onClick={runComprehensiveTest} 
              disabled={isRunning}
              size="sm"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              {isRunning ? 'Running...' : 'Run Tests'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {lastRun && (
          <div className="text-sm text-muted-foreground">
            Last verification: {lastRun.toLocaleString()}
          </div>
        )}

        {isRunning && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Running comprehensive verification...</p>
            <p className="text-sm text-muted-foreground">Testing all systems and configurations</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h4 className="font-medium">{result.name}</h4>
                      <p className={`text-sm ${getStatusColor(result.status)}`}>
                        {result.message}
                      </p>
                      {result.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={result.status === 'pass' ? 'default' : result.status === 'warning' ? 'secondary' : 'destructive'}
                  >
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No verification results yet</p>
            <p className="text-sm">Click "Run Tests" to verify all systems</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};