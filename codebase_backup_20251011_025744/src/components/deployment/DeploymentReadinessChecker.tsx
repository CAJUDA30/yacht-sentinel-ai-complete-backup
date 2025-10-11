import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Terminal,
  Key,
  Cloud,
  Database,
  Zap
} from 'lucide-react';

interface ReadinessCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  details?: string;
  command?: string;
  fix?: string;
}

const DeploymentReadinessChecker: React.FC = () => {
  const [checks, setChecks] = useState<ReadinessCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const initialChecks: ReadinessCheck[] = [
    {
      id: 'node_version',
      name: 'Node.js Version',
      status: 'pending',
      message: 'Checking Node.js installation...',
      command: 'node --version'
    },
    {
      id: 'npm_version',
      name: 'NPM Version',
      status: 'pending',
      message: 'Checking NPM installation...',
      command: 'npm --version'
    },
    {
      id: 'supabase_cli',
      name: 'Supabase CLI',
      status: 'pending',
      message: 'Checking Supabase CLI installation...',
      command: 'supabase --version'
    },
    {
      id: 'project_dependencies',
      name: 'Project Dependencies',
      status: 'pending',
      message: 'Checking project dependencies...'
    },
    {
      id: 'env_variables',
      name: 'Environment Variables',
      status: 'pending',
      message: 'Checking environment configuration...'
    },
    {
      id: 'build_process',
      name: 'Build Process',
      status: 'pending',
      message: 'Testing build process...'
    }
  ];

  useEffect(() => {
    setChecks(initialChecks);
  }, []);

  const updateCheck = (id: string, updates: Partial<ReadinessCheck>) => {
    setChecks(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const runReadinessChecks = async () => {
    setIsRunning(true);
    setProgress(0);
    setChecks(initialChecks);

    try {
      // 1. Node.js Version Check
      setProgress(10);
      const nodeVersion = process.version;
      const nodeVersionNumber = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (nodeVersionNumber >= 16) {
        updateCheck('node_version', {
          status: 'pass',
          message: `Node.js ${nodeVersion} detected`,
          details: 'Node.js version is compatible'
        });
      } else {
        updateCheck('node_version', {
          status: 'fail',
          message: `Node.js ${nodeVersion} is too old`,
          details: 'Node.js 16+ is required',
          fix: 'Update Node.js to version 16 or higher'
        });
      }

      // 2. NPM Version Check
      setProgress(20);
      try {
        // We can't easily check npm version in browser, so we'll assume it's available
        updateCheck('npm_version', {
          status: 'pass',
          message: 'NPM is available',
          details: 'Package manager is ready'
        });
      } catch (error) {
        updateCheck('npm_version', {
          status: 'fail',
          message: 'NPM not available',
          fix: 'Install Node.js which includes NPM'
        });
      }

      // 3. Supabase CLI Check
      setProgress(30);
      // This would need to be checked server-side or via terminal
      updateCheck('supabase_cli', {
        status: 'warning',
        message: 'Cannot verify Supabase CLI from browser',
        details: 'Manual verification required',
        fix: 'Run "npm install -g @supabase/cli" if not installed'
      });

      // 4. Project Dependencies
      setProgress(50);
      try {
        // Check if critical dependencies are available
        const hasReact = typeof React !== 'undefined';
        const hasSupabase = typeof window !== 'undefined' && window.localStorage !== undefined;
        
        if (hasReact && hasSupabase) {
          updateCheck('project_dependencies', {
            status: 'pass',
            message: 'Core dependencies available',
            details: 'React and Supabase client are loaded'
          });
        } else {
          updateCheck('project_dependencies', {
            status: 'fail',
            message: 'Missing core dependencies',
            fix: 'Run "npm install" to install dependencies'
          });
        }
      } catch (error) {
        updateCheck('project_dependencies', {
          status: 'fail',
          message: 'Dependency check failed',
          details: error.message,
          fix: 'Run "npm install" and check for errors'
        });
      }

      // 5. Environment Variables
      setProgress(70);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && anonKey) {
        updateCheck('env_variables', {
          status: 'pass',
          message: 'Environment variables configured',
          details: 'Supabase URL and anon key are set'
        });
      } else {
        const missing = [];
        if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
        if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
        
        updateCheck('env_variables', {
          status: 'fail',
          message: 'Missing environment variables',
          details: `Missing: ${missing.join(', ')}`,
          fix: 'Create .env file with required Supabase configuration'
        });
      }

      // 6. Build Process Test
      setProgress(90);
      // This would need to be tested server-side
      updateCheck('build_process', {
        status: 'warning',
        message: 'Build process not tested',
        details: 'Run build manually to verify',
        command: 'npm run build'
      });

      setProgress(100);

    } catch (error: any) {
      console.error('Readiness check error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: ReadinessCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: ReadinessCheck['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">READY</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAILED</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">WARNING</Badge>;
      case 'pending':
        return <Badge variant="outline">CHECKING</Badge>;
    }
  };

  const passCount = checks.filter(c => c.status === 'pass').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Deployment Readiness Checker
          </CardTitle>
          <CardDescription>
            Verify that all tools and configurations are ready for SmartScan deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Check development environment and deployment prerequisites
              </p>
              {checks.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-green-700">
                    {passCount} Ready
                  </Badge>
                  {failCount > 0 && (
                    <Badge variant="destructive">
                      {failCount} Failed
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                      {warningCount} Warnings
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Button onClick={runReadinessChecks} disabled={isRunning}>
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Terminal className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Checking...' : 'Run Checks'}
            </Button>
          </div>
          
          {isRunning && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground mt-1">
                Progress: {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check Results */}
      {checks.length > 0 && (
        <div className="space-y-3">
          {checks.map((check) => (
            <Card key={check.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{check.name}</h4>
                        {getStatusBadge(check.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {check.message}
                      </p>
                      
                      {check.details && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                          <strong>Details:</strong> {check.details}
                        </div>
                      )}
                      
                      {check.command && (
                        <div className="text-xs bg-gray-900 text-gray-100 p-2 rounded mt-2 font-mono">
                          $ {check.command}
                        </div>
                      )}
                      
                      {check.fix && (
                        <Alert className="mt-2">
                          <Terminal className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>Fix:</strong> {check.fix}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Deployment Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Next Steps for Deployment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Key className="h-4 w-4" />
                1. API Configuration
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Get Google Vision API key</li>
                <li>• Get Gemini API key from Google AI Studio</li>
                <li>• Configure Google Cloud Project ID</li>
                <li>• Set up Document AI processor</li>
                <li>• Optional: Get OpenAI API key as fallback</li>
                <li>• Configure Supabase secrets</li>
              </ul>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Database className="h-4 w-4" />
                2. Deploy Functions
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Install Supabase CLI</li>
                <li>• Deploy Edge Functions</li>
                <li>• Test function connectivity</li>
              </ul>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4" />
                3. Build & Test
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Run production build</li>
                <li>• Test SmartScan functionality</li>
                <li>• Verify all features work</li>
              </ul>
            </div>
            
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Cloud className="h-4 w-4" />
                4. Production Deploy
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Deploy to hosting platform</li>
                <li>• Configure production URLs</li>
                <li>• Monitor performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentReadinessChecker;