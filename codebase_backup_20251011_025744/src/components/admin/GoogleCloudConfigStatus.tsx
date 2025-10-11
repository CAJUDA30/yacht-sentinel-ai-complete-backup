import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud, CheckCircle2, XCircle, AlertTriangle, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const GoogleCloudConfigStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use direct fetch instead of supabase.functions.invoke for better error handling
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Get auth token if available
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/gcp-unified-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ action: 'status' })
      });

      if (!response.ok) {
        // If edge function returns 500, it likely means credentials aren't configured yet
        if (response.status === 500) {
          console.warn('⚠️ Edge function returned 500 - Google Cloud credentials may not be configured yet');
          // Set empty status to show setup needed
          setStatus({ 
            secrets: {
              GOOGLE_SERVICE_ACCOUNT_JSON: false,
              GOOGLE_DOCUMENT_AI_API_KEY: false,
              GOOGLE_CLOUD_PROJECT_ID: false
            },
            config: {},
            logs: []
          });
          setError(null); // Don't show error, just show setup needed
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to check status';
      setError(errorMessage);
      console.error('Google Cloud status check failed:', err);
      
      // Set default status on error to show setup needed
      setStatus({ 
        secrets: {
          GOOGLE_SERVICE_ACCOUNT_JSON: false,
          GOOGLE_DOCUMENT_AI_API_KEY: false,
          GOOGLE_CLOUD_PROJECT_ID: false
        },
        config: {},
        logs: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const hasCredentials = status?.secrets?.GOOGLE_SERVICE_ACCOUNT_JSON && status?.secrets?.GOOGLE_CLOUD_PROJECT_ID;
  const isConfigured = hasCredentials && status?.config?.services?.documentAI?.processorId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Google Cloud Configuration
            </CardTitle>
            <CardDescription>Document AI processor connectivity status</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {hasCredentials ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium text-sm">Credentials</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasCredentials ? 'Configured' : 'Not configured'}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {status?.config?.services?.documentAI?.processorId ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium text-sm">Processor ID</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {status?.config?.services?.documentAI?.processorId || 'Not set'}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {isConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <span className="font-medium text-sm">Status</span>
            </div>
            <Badge variant={isConfigured ? 'default' : 'secondary'}>
              {isConfigured ? 'Ready' : 'Setup Required'}
            </Badge>
          </div>
        </div>

        {/* Configuration Alert */}
        {!hasCredentials && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="space-y-2">
                <p className="font-medium">Google Cloud credentials not configured</p>
                <p className="text-sm text-muted-foreground">
                  To enable real Document AI processing, configure your Google Cloud credentials:
                </p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-2">
                  <li>Create a Google Cloud project and enable Document AI API</li>
                  <li>Create a service account with Document AI permissions</li>
                  <li>Download the JSON key file</li>
                  <li>Add credentials to <code className="px-1 py-0.5 bg-muted rounded text-xs">supabase/.env.local</code></li>
                </ol>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/GOOGLE_CLOUD_SETUP.md', '_blank')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Setup Guide
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google Cloud Console
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mock Mode Notice */}
        {!hasCredentials && (
          <Alert variant="default">
            <AlertDescription className="ml-2">
              <div className="space-y-2">
                <p className="font-medium text-sm">Development Mode Active</p>
                <p className="text-sm text-muted-foreground">
                  The system is currently using mock data for Document AI responses. 
                  This allows you to develop and test the UI without Google Cloud credentials.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Environment Variables Checklist */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-sm mb-3">Required Environment Variables</h4>
          <div className="space-y-2">
            {[
              { name: 'GOOGLE_CLOUD_PROJECT_ID', present: status?.secrets?.GOOGLE_CLOUD_PROJECT_ID },
              { name: 'GOOGLE_SERVICE_ACCOUNT_JSON', present: status?.secrets?.GOOGLE_SERVICE_ACCOUNT_JSON },
              { name: 'DOCUMENT_AI_PROCESSOR_ID', present: status?.config?.services?.documentAI?.processorId }
            ].map((envVar) => (
              <div key={envVar.name} className="flex items-center justify-between text-sm">
                <code className="text-xs bg-muted px-2 py-1 rounded">{envVar.name}</code>
                {envVar.present ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Missing
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logs */}
        {status?.logs && status.logs.length > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3">Recent Activity</h4>
            <div className="space-y-2 max-h-48 overflow-auto">
              {status.logs.slice(0, 5).map((log: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    {log.success ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-600" />
                    )}
                    <span>{log.action}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{log.provider}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {log.latency_ms ? `${log.latency_ms}ms` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
