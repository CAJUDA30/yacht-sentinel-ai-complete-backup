import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSecurity } from '@/contexts/SecurityContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { toast } from '@/hooks/use-toast';
import { Shield, Lock, Eye, AlertTriangle, Activity, FileText, Users, Database } from 'lucide-react';

export const SecuritySettings = () => {
  const { 
    securityMetrics, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring,
    runSecurityScan 
  } = useSecurity();
  
  const { settings, updateSystemSetting } = useAppSettings();

  const handleMonitoringToggle = (enabled: boolean) => {
    if (enabled) {
      startMonitoring();
      toast({
        title: "Security Monitoring Enabled",
        description: "Real-time security monitoring is now active."
      });
    } else {
      stopMonitoring();
      toast({
        title: "Security Monitoring Disabled",
        description: "Security monitoring has been stopped."
      });
    }
  };

  const handleSecurityScan = async () => {
    try {
      await runSecurityScan();
      toast({
        title: "Security Scan Complete",
        description: "System security scan has been completed."
      });
    } catch (error) {
      toast({
        title: "Security Scan Failed",
        description: "Unable to complete security scan.",
        variant: "destructive"
      });
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Monitoring */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Monitoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="monitoring">Real-time Monitoring</Label>
                <p className="text-sm text-muted-foreground">Monitor security events in real-time</p>
              </div>
              <Switch
                id="monitoring"
                checked={isMonitoring}
                onCheckedChange={handleMonitoringToggle}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Threat Level</span>
                <Badge 
                  variant="secondary" 
                  className={`${getThreatLevelColor(securityMetrics.threatLevel)} text-white`}
                >
                  {securityMetrics.threatLevel}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Threats</span>
                <span className="text-sm font-medium">{securityMetrics.activeThreats}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Security Score</span>
                <span className="text-sm font-medium">{securityMetrics.securityScore}/100</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleSecurityScan}
              className="w-full"
            >
              <Activity className="h-4 w-4 mr-2" />
              Run Security Scan
            </Button>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Access Control</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for login</p>
              </div>
              <Switch
                id="two-factor"
                checked={settings.system.autoSave} // Using as placeholder
                onCheckedChange={(checked) => updateSystemSetting('autoSave', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="session-timeout">Auto Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <Switch
                id="session-timeout"
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="strong-passwords">Enforce Strong Passwords</Label>
                <p className="text-sm text-muted-foreground">Require complex passwords</p>
              </div>
              <Switch
                id="strong-passwords"
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Privacy Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analytics">Analytics Collection</Label>
                <p className="text-sm text-muted-foreground">Allow usage analytics</p>
              </div>
              <Switch
                id="analytics"
                checked={false}
                onCheckedChange={() => {}}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="data-sharing">Data Sharing</Label>
                <p className="text-sm text-muted-foreground">Share data with third parties</p>
              </div>
              <Switch
                id="data-sharing"
                checked={false}
                onCheckedChange={() => {}}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="location-tracking">Location Tracking</Label>
                <p className="text-sm text-muted-foreground">Track device location</p>
              </div>
              <Switch
                id="location-tracking"
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audit & Compliance */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Audit & Compliance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="audit-trail">Enable Audit Trail</Label>
                <p className="text-sm text-muted-foreground">Log all user actions</p>
              </div>
              <Switch
                id="audit-trail"
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="data-retention">Data Retention Policy</Label>
                <p className="text-sm text-muted-foreground">Auto-delete old data</p>
              </div>
              <Switch
                id="data-retention"
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="encryption">Data Encryption</Label>
                <p className="text-sm text-muted-foreground">Encrypt sensitive data</p>
              </div>
              <Switch
                id="encryption"
                checked={true}
                onCheckedChange={() => {}}
              />
            </div>

            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Download Audit Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Recent Security Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Successful login from new device</span>
              <Badge variant="outline">Info</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Password changed successfully</span>
              <Badge variant="outline">Info</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-sm">Failed login attempt detected</span>
              <Badge variant="destructive">Warning</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};