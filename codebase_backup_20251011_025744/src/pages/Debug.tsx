import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, Settings, ArrowLeft } from 'lucide-react';
import StorageCleaner from '@/components/debug/StorageCleaner';

const DebugPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Debug & Troubleshooting</h1>
            <p className="text-muted-foreground">Resolve common application issues</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings?tab=system')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Error Info */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Snippet Error Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-amber-800">
              <p>
                <strong>Error:</strong> "Unable to find snippet with ID 49fc4970-6d15-4fda-9fd5-b6f30c5769ce"
              </p>
              <p>
                This error occurs when the browser cache contains references to components that no longer exist in your project.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Browser Cache</Badge>
                <Badge variant="secondary">Component References</Badge>
                <Badge variant="secondary">Navigation State</Badge>
                <Badge variant="secondary">Tab History</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Cleaner */}
        <StorageCleaner />

        {/* Additional Debug Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Browser Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">User Agent:</span>
                <span className="text-sm truncate">{navigator.userAgent.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Platform:</span>
                <span className="text-sm">{navigator.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Language:</span>
                <span className="text-sm">{navigator.language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Online:</span>
                <Badge variant={navigator.onLine ? "default" : "destructive"}>
                  {navigator.onLine ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.reload()}
              >
                Force Refresh Page
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.history.back()}
              >
                Go Back in History
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open(window.location.href, '_blank')}
              >
                Open in New Tab
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = window.location.origin;
                }}
              >
                Reset to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Manual Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Fix Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Method 1: Browser Console</h4>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-sm">
                    localStorage.clear(); sessionStorage.clear(); location.reload();
                  </code>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Method 2: Developer Tools</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Press F12 to open Developer Tools</li>
                  <li>Go to Application tab</li>
                  <li>Click "Storage" in the left sidebar</li>
                  <li>Click "Clear site data"</li>
                  <li>Refresh the page</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium mb-2">Method 3: Incognito Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Open the application in incognito/private browsing mode to test without cached data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugPage;