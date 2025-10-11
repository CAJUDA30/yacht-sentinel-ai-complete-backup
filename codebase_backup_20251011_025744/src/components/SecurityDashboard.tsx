import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  Activity,
  Scan,
  FileText,
  Clock,
  Users,
  Globe,
  Server
} from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import { useToast } from '@/components/ui/use-toast';

const SecurityDashboard: React.FC = () => {
  const [scanInProgress, setScanInProgress] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  
  const {
    securityEvents,
    securityMetrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    acknowledgeEvent,
    runSecurityScan,
    getSecurityReport
  } = useSecurity();

  const handleSecurityScan = async () => {
    setScanInProgress(true);
    try {
      await runSecurityScan();
    } finally {
      setScanInProgress(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await getSecurityReport();
      console.log('Security Report:', report);
      toast({
        title: "Security Report Generated",
        description: "Report has been generated and is ready for download",
      });
    } catch (error) {
      toast({
        title: "Report Generation Failed",
        description: "Unable to generate security report",
        variant: "destructive",
      });
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-green-600 bg-green-100 border-green-200';
    }
  };

  const getEventSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const unresolvedEvents = securityEvents.filter(e => !e.resolved);
  const recentEvents = securityEvents.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Threat Level</p>
                <Badge className={`mt-1 ${getThreatLevelColor(securityMetrics.threatLevel)}`}>
                  {securityMetrics.threatLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold">{securityMetrics.securityScore}%</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
            <Progress value={securityMetrics.securityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold text-orange-600">{securityMetrics.activeThreats}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold text-green-600">{securityMetrics.complianceScore}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <Progress value={securityMetrics.complianceScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Security Controls */}
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Security Controls
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isMonitoring ? "default" : "secondary"}>
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              {isMonitoring ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>

            <Button
              onClick={handleSecurityScan}
              disabled={scanInProgress}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Scan className="w-4 h-4" />
              {scanInProgress ? 'Scanning...' : 'Run Security Scan'}
            </Button>

            <Button
              onClick={handleGenerateReport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Last scan: {new Date(securityMetrics.lastScan).toLocaleString()}</p>
            <p>Vulnerabilities found: {securityMetrics.vulnerabilities}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Security Events
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              <Badge variant="outline">
                {unresolvedEvents.length} unresolved
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No recent security events</p>
                <p className="text-sm">Your system is secure</p>
              </div>
            ) : (
              recentEvents.map((event) => (
                <div 
                  key={event.id}
                  className={`border rounded-lg p-4 ${event.resolved ? 'bg-background/30' : 'bg-background/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div 
                        className={`w-3 h-3 rounded-full mt-1 ${getEventSeverityColor(event.severity)}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{event.description}</span>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getEventSeverityColor(event.severity)} text-white`}
                          >
                            {event.severity}
                          </Badge>
                        </div>
                        
                        {showDetails && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Server className="w-3 h-3" />
                                {event.source}
                              </span>
                              {event.user && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {event.user}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {event.resolved ? (
                        <Badge variant="secondary" className="text-xs">
                          Resolved
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeEvent(event.id)}
                          className="h-7 text-xs"
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Compliance */}
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">ISO 27001</span>
              <Badge variant="default" className="bg-green-500">
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">GDPR</span>
              <Badge variant="default" className="bg-green-500">
                Compliant
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Maritime Security</span>
              <Badge variant="default" className="bg-green-500">
                Compliant
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;