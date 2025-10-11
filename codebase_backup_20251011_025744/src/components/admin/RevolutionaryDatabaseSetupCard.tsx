import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Database, Rocket, Settings, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { executeRevolutionaryDatabaseSetup, testDatabaseConnectivity } from '@/utils/revolutionaryDatabaseSetup';

interface SetupStatus {
  isRunning: boolean;
  isComplete: boolean;
  effectiveness: number;
  message: string;
  details?: any;
  error?: string;
}

const RevolutionaryDatabaseSetupCard: React.FC = () => {
  const { toast } = useToast();
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    isRunning: false,
    isComplete: false,
    effectiveness: 0,
    message: 'Ready to execute Revolutionary Database Setup'
  });
  const [connectivity, setConnectivity] = useState<boolean | null>(null);

  const handleRevolutionarySetup = async () => {
    setSetupStatus({
      isRunning: true,
      isComplete: false,
      effectiveness: 0,
      message: 'Executing Revolutionary Database Setup - 100% Effectiveness...'
    });

    try {
      console.log('[Revolutionary Setup] 🚀 Starting setup execution...');
      
      const result = await executeRevolutionaryDatabaseSetup();
      
      setSetupStatus({
        isRunning: false,
        isComplete: result.success,
        effectiveness: result.effectiveness,
        message: result.message,
        details: result.details,
        error: result.error
      });

      if (result.success) {
        toast({
          title: "🎉 Revolutionary Success!",
          description: `Database setup completed with ${result.effectiveness}% effectiveness`,
        });
      } else {
        toast({
          title: "⚠️ Setup Issue",
          description: result.error || "Setup encountered issues - check logs for details",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[Revolutionary Setup] ❌ Setup error:', error);
      
      setSetupStatus({
        isRunning: false,
        isComplete: false,
        effectiveness: 0,
        message: 'Setup failed',
        error: error.message
      });

      toast({
        title: "❌ Setup Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleConnectivityTest = async () => {
    setConnectivity(null);
    
    try {
      const isConnected = await testDatabaseConnectivity();
      setConnectivity(isConnected);
      
      toast({
        title: isConnected ? "✅ Connected" : "❌ Connection Failed",
        description: isConnected 
          ? "Database connectivity verified" 
          : "Unable to connect to database",
        variant: isConnected ? "default" : "destructive"
      });
    } catch (error: any) {
      setConnectivity(false);
      toast({
        title: "❌ Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    if (setupStatus.isRunning) {
      return <Zap className="h-5 w-5 animate-pulse text-yellow-500" />;
    }
    if (setupStatus.isComplete && setupStatus.effectiveness === 100) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (setupStatus.error) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <Database className="h-5 w-5 text-blue-500" />;
  };

  const getEffectivenessBadge = () => {
    if (setupStatus.effectiveness === 100) {
      return <Badge variant="default" className="bg-green-600">100% Revolutionary</Badge>;
    }
    if (setupStatus.effectiveness > 0) {
      return <Badge variant="secondary">{setupStatus.effectiveness}% Complete</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Revolutionary Database Setup
          </CardTitle>
          {getEffectivenessBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          {getStatusIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">{setupStatus.message}</p>
            {setupStatus.details && (
              <p className="text-xs text-muted-foreground mt-1">
                Processor: {setupStatus.details.processor_id || '8708cd1d9cd87cc1'}
              </p>
            )}
            {setupStatus.error && (
              <p className="text-xs text-red-600 mt-1">{setupStatus.error}</p>
            )}
          </div>
        </div>

        {/* Revolutionary Features */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>Document AI: 8708cd1d9cd87cc1</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>Date Format: DD-MM-YYYY</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>No Fallback Strategies</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>100% Effectiveness</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleRevolutionarySetup}
            disabled={setupStatus.isRunning}
            className="flex-1"
            variant={setupStatus.effectiveness === 100 ? "outline" : "default"}
          >
            {setupStatus.isRunning && <Zap className="h-4 w-4 mr-2 animate-spin" />}
            {setupStatus.effectiveness === 100 ? (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Re-run Setup
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                Execute Setup
              </>
            )}
          </Button>
          
          <Button
            onClick={handleConnectivityTest}
            variant="outline"
            size="sm"
            disabled={setupStatus.isRunning}
          >
            <Database className="h-4 w-4 mr-2" />
            {connectivity === null ? 'Test' : connectivity ? 'Connected' : 'Failed'}
          </Button>
        </div>

        {/* Connection Status */}
        {connectivity !== null && (
          <div className={`text-xs p-2 rounded ${connectivity ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {connectivity 
              ? "✅ Database connectivity verified - Ready for Revolutionary operations"
              : "❌ Database connection failed - Check network and credentials"
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevolutionaryDatabaseSetupCard;