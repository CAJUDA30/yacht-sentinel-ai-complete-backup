import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Server, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Lock
} from 'lucide-react';
import { enterpriseScalabilityService } from '@/services/EnterpriseScalabilityService';
import { advancedSecurityService } from '@/services/AdvancedSecurityService';
import { toast } from 'sonner';

const AdvancedOperationsDashboard = () => {
  const [scalabilityMetrics, setScalabilityMetrics] = useState<any>(null);
  const [securityThreats, setSecurityThreats] = useState<any[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metrics, threats, compliance] = await Promise.all([
        enterpriseScalabilityService.getScalabilityMetrics(),
        advancedSecurityService.monitorSecurityThreats(),
        advancedSecurityService.getComplianceStatus()
      ]);

      setScalabilityMetrics(metrics);
      setSecurityThreats(threats);
      setComplianceStatus(compliance);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizePerformance = async () => {
    try {
      const result = await enterpriseScalabilityService.optimizePerformance();
      toast.success(`Performance optimized! Estimated ${result.estimatedImprovement.toFixed(1)}% improvement`);
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to optimize performance');
    }
  };

  const handleSecurityScan = async () => {
    try {
      const result = await advancedSecurityService.performSecurityScan();
      toast.success(`Security scan completed. Score: ${result.score}/100`);
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to perform security scan');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Operations</h1>
          <p className="text-muted-foreground">Enterprise scalability and security management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOptimizePerformance} variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Optimize Performance
          </Button>
          <Button onClick={handleSecurityScan} variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            Security Scan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Load</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scalabilityMetrics?.currentLoad?.toFixed(1)}%
            </div>
            <Progress value={scalabilityMetrics?.currentLoad || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scalabilityMetrics?.responseTime?.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Threats</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityThreats.filter(t => !t.resolved).length}
            </div>
            <p className="text-xs text-muted-foreground">Active threats detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scalabilityMetrics?.throughput?.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Requests per minute</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="scalability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scalability">Scalability</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="scalability" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Current system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Load</span>
                    <span>{scalabilityMetrics?.currentLoad?.toFixed(1)}%</span>
                  </div>
                  <Progress value={scalabilityMetrics?.currentLoad || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <span>{scalabilityMetrics?.errorRate?.toFixed(2)}%</span>
                  </div>
                  <Progress value={scalabilityMetrics?.errorRate || 0} className="bg-red-100" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scalability Recommendations</CardTitle>
                <CardDescription>Optimization suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scalabilityMetrics?.recommendations?.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Threats</CardTitle>
                <CardDescription>Current security incidents and threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityThreats.map((threat) => (
                    <Alert key={threat.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <strong>{threat.description}</strong>
                            <p className="text-xs text-muted-foreground mt-1">
                              Source: {threat.source}
                            </p>
                          </div>
                          <Badge variant={threat.resolved ? "default" : "destructive"}>
                            {threat.resolved ? 'Resolved' : threat.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Features</CardTitle>
                <CardDescription>Available security enhancements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    'Two-Factor Authentication',
                    'Encryption at Rest',
                    'Audit Logging',
                    'Threat Monitoring',
                    'Backup Encryption'
                  ].map((feature) => (
                    <div key={feature} className="flex items-center justify-between">
                      <span className="text-sm">{feature}</span>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {complianceStatus.map((compliance) => (
              <Card key={compliance.framework}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {compliance.status === 'compliant' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : compliance.status === 'partial' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {compliance.framework}
                  </CardTitle>
                  <CardDescription>
                    Status: {compliance.status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Last Audit: {compliance.lastAudit.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Next Audit: {compliance.nextAudit.toLocaleDateString()}
                    </div>
                    {compliance.issues.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Issues:</div>
                        {compliance.issues.map((issue: string, index: number) => (
                          <div key={index} className="text-xs text-red-600">
                            • {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Analytics</CardTitle>
              <CardDescription>Advanced business intelligence and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Comprehensive business intelligence dashboards and custom reporting will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedOperationsDashboard;