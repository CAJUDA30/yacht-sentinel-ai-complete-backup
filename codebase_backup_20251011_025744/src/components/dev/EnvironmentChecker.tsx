import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';

interface EnvVariable {
  name: string;
  value?: string;
  required: boolean;
  description: string;
}

const EnvironmentChecker: React.FC = () => {
  const envVars: EnvVariable[] = [
    {
      name: 'VITE_SUPABASE_URL',
      value: import.meta.env.VITE_SUPABASE_URL,
      required: true,
      description: 'Supabase project URL for database and authentication'
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      value: import.meta.env.VITE_SUPABASE_ANON_KEY,
      required: true,
      description: 'Supabase anonymous key for client-side access'
    },
    {
      name: 'MODE',
      value: import.meta.env.MODE,
      required: false,
      description: 'Current build mode (development/production)'
    },
    {
      name: 'BASE_URL',
      value: import.meta.env.BASE_URL,
      required: false,
      description: 'Base URL for the application'
    }
  ];

  const getStatus = (envVar: EnvVariable) => {
    if (!envVar.value) {
      return envVar.required ? 'error' : 'warning';
    }
    return 'success';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">SET</Badge>;
      case 'error':
        return <Badge variant="destructive">MISSING</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">OPTIONAL</Badge>;
      default:
        return null;
    }
  };

  const criticalMissing = envVars.filter(v => v.required && !v.value).length;
  const optionalMissing = envVars.filter(v => !v.required && !v.value).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Configuration
          </CardTitle>
          <CardDescription>
            Check environment variables required for SmartScan functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          {criticalMissing > 0 && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical:</strong> {criticalMissing} required environment variable(s) missing. 
                SmartScan will not function properly.
              </AlertDescription>
            </Alert>
          )}

          {criticalMissing === 0 && optionalMissing > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> {optionalMissing} optional environment variable(s) missing. 
                Core functionality should work.
              </AlertDescription>
            </Alert>
          )}

          {criticalMissing === 0 && optionalMissing === 0 && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Success:</strong> All environment variables are configured correctly.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {envVars.map((envVar) => {
              const status = getStatus(envVar);
              return (
                <div key={envVar.name} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {envVar.name}
                        </code>
                        {getStatusBadge(status)}
                        {envVar.required && (
                          <Badge variant="outline" className="text-xs">REQUIRED</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {envVar.description}
                      </p>
                      {envVar.value && (
                        <div className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded font-mono">
                          {envVar.name === 'VITE_SUPABASE_ANON_KEY' 
                            ? `${envVar.value.substring(0, 20)}...` 
                            : envVar.value
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Configuration Help</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>For Development:</strong> Create a <code>.env</code> file in your project root with:
              </p>
              <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
              </pre>
              <p>
                <strong>For Production:</strong> Configure these variables in your hosting platform 
                (Vercel, Netlify, etc.)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentChecker;