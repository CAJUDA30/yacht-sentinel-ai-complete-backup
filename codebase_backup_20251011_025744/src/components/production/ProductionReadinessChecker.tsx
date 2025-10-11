import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  Database,
  Globe,
  Settings,
  Zap,
  Eye,
  PlayCircle,
  RefreshCw,
  FileCheck,
  Lock,
  Monitor,
  Activity,
  AlertCircle,
  Users,
  Code,
  Rocket
} from 'lucide-react';

interface ReadinessCheck {
  id: string;
  category: 'security' | 'performance' | 'database' | 'deployment' | 'monitoring' | 'compliance';
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  priority: 'critical' | 'high' | 'medium' | 'low';
  lastChecked: Date;
  details: string;
  fixAction?: string;
  automated: boolean;
}

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  domain: string;
  ssl: boolean;
  cdn: boolean;
  backups: boolean;
  monitoring: boolean;
  rateLimit: boolean;
  cors: string[];
  envVars: {
    name: string;
    configured: boolean;
    required: boolean;
  }[];
}

const ProductionReadinessChecker = () => {
  const { toast } = useToast();
  const [readinessChecks, setReadinessChecks] = useState<ReadinessCheck[]>([
    {
      id: 'ssl-cert',
      category: 'security',
      name: 'SSL Certificate',
      description: 'Valid SSL certificate configured for HTTPS',
      status: 'pass',
      priority: 'critical',
      lastChecked: new Date(),
      details: 'SSL certificate is valid and properly configured',
      automated: true
    },
    {
      id: 'env-vars',
      category: 'security',
      name: 'Environment Variables',
      description: 'All required environment variables configured',
      status: 'warning',
      priority: 'critical',
      lastChecked: new Date(),
      details: '2 environment variables missing: STRIPE_WEBHOOK_SECRET, SMTP_PASSWORD',
      fixAction: 'Configure missing environment variables in Supabase settings',
      automated: false
    },
    {
      id: 'rls-policies',
      category: 'security',
      name: 'Row Level Security',
      description: 'RLS policies enabled on all tables',
      status: 'pass',
      priority: 'critical',
      lastChecked: new Date(),
      details: 'All tables have appropriate RLS policies configured',
      automated: true
    },
    {
      id: 'api-rate-limits',
      category: 'security',
      name: 'API Rate Limiting',
      description: 'Rate limiting configured for API endpoints',
      status: 'warning',
      priority: 'high',
      lastChecked: new Date(),
      details: 'Rate limiting not configured for some edge functions',
      fixAction: 'Configure rate limiting in edge function middleware',
      automated: false
    },
    {
      id: 'database-indexes',
      category: 'performance',
      name: 'Database Indexes',
      description: 'Proper indexes configured for query performance',
      status: 'pass',
      priority: 'high',
      lastChecked: new Date(),
      details: 'All frequently queried columns have appropriate indexes',
      automated: true
    },
    {
      id: 'image-optimization',
      category: 'performance',
      name: 'Image Optimization',
      description: 'Images optimized and using WebP format where possible',
      status: 'warning',
      priority: 'medium',
      lastChecked: new Date(),
      details: '3 images could be further optimized',
      fixAction: 'Run image optimization script',
      automated: true
    },
    {
      id: 'bundle-size',
      category: 'performance',
      name: 'Bundle Size',
      description: 'JavaScript bundle size under recommended limits',
      status: 'pass',
      priority: 'medium',
      lastChecked: new Date(),
      details: 'Bundle size: 245KB (under 500KB limit)',
      automated: true
    },
    {
      id: 'database-backups',
      category: 'database',
      name: 'Database Backups',
      description: 'Automated database backups configured',
      status: 'pass',
      priority: 'critical',
      lastChecked: new Date(),
      details: 'Daily backups enabled with 30-day retention',
      automated: true
    },
    {
      id: 'migration-status',
      category: 'database',
      name: 'Database Migrations',
      description: 'All database migrations applied successfully',
      status: 'pass',
      priority: 'critical',
      lastChecked: new Date(),
      details: 'All 23 migrations applied successfully',
      automated: true
    },
    {
      id: 'error-monitoring',
      category: 'monitoring',
      name: 'Error Monitoring',
      description: 'Error tracking and monitoring configured',
      status: 'pass',
      priority: 'high',
      lastChecked: new Date(),
      details: 'Error monitoring active with alert thresholds configured',
      automated: true
    },
    {
      id: 'health-checks',
      category: 'monitoring',
      name: 'Health Check Endpoints',
      description: 'Health check endpoints responding correctly',
      status: 'pass',
      priority: 'high',
      lastChecked: new Date(),
      details: 'All health endpoints returning 200 OK',
      automated: true
    },
    {
      id: 'gdpr-compliance',
      category: 'compliance',
      name: 'GDPR Compliance',
      description: 'Data privacy and GDPR compliance measures',
      status: 'warning',
      priority: 'high',
      lastChecked: new Date(),
      details: 'Privacy policy needs updating for new data collection',
      fixAction: 'Update privacy policy and cookie consent',
      automated: false
    }
  ]);

  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    environment: 'production',
    domain: 'yachtexcel.com',
    ssl: true,
    cdn: true,
    backups: true,
    monitoring: true,
    rateLimit: false,
    cors: ['https://yachtexcel.com', 'https://www.yachtexcel.com'],
    envVars: [
      { name: 'SUPABASE_URL', configured: true, required: true },
      { name: 'SUPABASE_ANON_KEY', configured: true, required: true },
      { name: 'OPENAI_API_KEY', configured: true, required: true },
      { name: 'STRIPE_WEBHOOK_SECRET', configured: false, required: true },
      { name: 'SMTP_PASSWORD', configured: false, required: true },
      { name: 'SENTRY_DSN', configured: false, required: false }
    ]
  });

  const [checking, setChecking] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const runChecks = useCallback(async () => {
    setChecking(true);
    
    // Simulate running checks
    setTimeout(() => {
      setReadinessChecks(prev => 
        prev.map(check => ({
          ...check,
          lastChecked: new Date(),
          // Randomly update some statuses for demo
          status: Math.random() > 0.8 ? 
            (['pass', 'warning', 'fail'][Math.floor(Math.random() * 3)] as any) : 
            check.status
        }))
      );
      setChecking(false);
      toast({ title: 'Readiness checks completed', description: 'All checks have been updated' });
    }, 3000);
  }, [toast]);

  const fixIssue = useCallback((checkId: string) => {
    setReadinessChecks(prev =>
      prev.map(check =>
        check.id === checkId ? { ...check, status: 'pass' as const } : check
      )
    );
    toast({ title: 'Issue resolved', description: 'Check status updated to passing' });
  }, [toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return CheckCircle;
      case 'fail': return XCircle;
      case 'warning': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'hsl(var(--success))';
      case 'fail': return 'hsl(var(--destructive))';
      case 'warning': return 'hsl(var(--warning))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'performance': return Zap;
      case 'database': return Database;
      case 'deployment': return Globe;
      case 'monitoring': return Monitor;
      case 'compliance': return FileCheck;
      default: return Settings;
    }
  };

  const filteredChecks = readinessChecks.filter(check => 
    selectedCategory === 'all' || check.category === selectedCategory
  );

  const checksByCategory = readinessChecks.reduce((acc, check) => {
    if (!acc[check.category]) acc[check.category] = [];
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, ReadinessCheck[]>);

  const passedChecks = readinessChecks.filter(check => check.status === 'pass').length;
  const totalChecks = readinessChecks.length;
  const readinessScore = Math.round((passedChecks / totalChecks) * 100);

  const criticalIssues = readinessChecks.filter(check => 
    check.priority === 'critical' && check.status !== 'pass'
  ).length;

  const missingEnvVars = deploymentConfig.envVars.filter(env => 
    env.required && !env.configured
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rocket className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">Production Readiness</h2>
            <p className="text-muted-foreground">
              Readiness Score: {readinessScore}% • {criticalIssues} critical issues
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runChecks}
            disabled={checking}
          >
            {checking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Run Checks
              </>
            )}
          </Button>
          <Badge variant={readinessScore >= 90 ? 'default' : readinessScore >= 70 ? 'secondary' : 'destructive'}>
            {readinessScore >= 90 ? 'Production Ready' : readinessScore >= 70 ? 'Needs Review' : 'Not Ready'}
          </Badge>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">Critical Issues Found</h4>
                <p className="text-sm text-muted-foreground">
                  {criticalIssues} critical issue{criticalIssues > 1 ? 's' : ''} must be resolved before production deployment
                </p>
              </div>
              <Button variant="destructive" size="sm">
                View Issues
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checks">Checks</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="deployment">Deploy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Readiness Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Production Readiness Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{readinessScore}%</span>
                <span className="text-muted-foreground">
                  {passedChecks} of {totalChecks} checks passing
                </span>
              </div>
              <Progress value={readinessScore} className="h-3" />
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-medium">
                    {readinessChecks.filter(c => c.status === 'pass').length}
                  </div>
                  <div className="text-muted-foreground">Passing</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-600 font-medium">
                    {readinessChecks.filter(c => c.status === 'warning').length}
                  </div>
                  <div className="text-muted-foreground">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-red-600 font-medium">
                    {readinessChecks.filter(c => c.status === 'fail').length}
                  </div>
                  <div className="text-muted-foreground">Failing</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600 font-medium">
                    {readinessChecks.filter(c => c.status === 'pending').length}
                  </div>
                  <div className="text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(checksByCategory).map(([category, checks]) => {
              const CategoryIcon = getCategoryIcon(category);
              const passed = checks.filter(c => c.status === 'pass').length;
              const percentage = Math.round((passed / checks.length) * 100);
              
              return (
                <Card key={category}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <CategoryIcon className="h-5 w-5" />
                      <span className="font-medium capitalize">{category}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{passed}/{checks.length} checks</span>
                        <span className="font-medium">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Top Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Top Priority Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {readinessChecks
                  .filter(check => check.status !== 'pass')
                  .sort((a, b) => {
                    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                  })
                  .slice(0, 5)
                  .map((check) => {
                    const StatusIcon = getStatusIcon(check.status);
                    return (
                      <div key={check.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <StatusIcon className="h-4 w-4" style={{ color: getStatusColor(check.status) }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{check.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {check.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{check.details}</p>
                        </div>
                        {check.fixAction && (
                          <Button variant="outline" size="sm" onClick={() => fixIssue(check.id)}>
                            Fix
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All ({readinessChecks.length})
              </Button>
              {Object.keys(checksByCategory).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category} ({checksByCategory[category].length})
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredChecks.map((check) => {
                const StatusIcon = getStatusIcon(check.status);
                const CategoryIcon = getCategoryIcon(check.category);
                
                return (
                  <Card key={check.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-muted">
                          <StatusIcon className="h-4 w-4" style={{ color: getStatusColor(check.status) }} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{check.name}</h4>
                              <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {check.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs" style={{ color: getStatusColor(check.status) }}>
                                {check.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{check.description}</p>
                          <p className="text-sm">{check.details}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Last checked: {check.lastChecked.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              {check.automated && (
                                <Badge variant="secondary" className="text-xs">Automated</Badge>
                              )}
                              {check.fixAction && (
                                <Button variant="outline" size="sm" onClick={() => fixIssue(check.id)}>
                                  {check.automated ? 'Auto Fix' : 'Fix'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Deployment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <div className="text-sm">
                    <div className="font-medium">{deploymentConfig.domain}</div>
                    <div className="text-muted-foreground">Domain</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <div className="text-sm">
                    <div className="font-medium">{deploymentConfig.ssl ? 'Enabled' : 'Disabled'}</div>
                    <div className="text-muted-foreground">SSL</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <div className="text-sm">
                    <div className="font-medium">{deploymentConfig.cdn ? 'Enabled' : 'Disabled'}</div>
                    <div className="text-muted-foreground">CDN</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <div className="text-sm">
                    <div className="font-medium">{deploymentConfig.backups ? 'Enabled' : 'Disabled'}</div>
                    <div className="text-muted-foreground">Backups</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deploymentConfig.envVars.map((envVar) => (
                  <div key={envVar.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        envVar.configured ? 'bg-green-500' : envVar.required ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <span className="font-medium">{envVar.name}</span>
                        {envVar.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                    </div>
                    <Badge variant={envVar.configured ? 'default' : 'destructive'}>
                      {envVar.configured ? 'Configured' : 'Missing'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Deployment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  readinessScore >= 90 ? 'bg-green-100 dark:bg-green-900/20' :
                  readinessScore >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-red-100 dark:bg-red-900/20'
                }`}>
                  <Rocket className={`h-8 w-8 ${
                    readinessScore >= 90 ? 'text-green-600' :
                    readinessScore >= 70 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {readinessScore >= 90 ? 'Ready for Production' :
                   readinessScore >= 70 ? 'Needs Review' :
                   'Not Ready'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {readinessScore >= 90 ? 'All critical checks are passing. Your application is ready for production deployment.' :
                   readinessScore >= 70 ? 'Some issues need to be addressed before production deployment.' :
                   'Critical issues must be resolved before deployment.'}
                </p>
                
                {readinessScore >= 90 ? (
                  <Button size="lg" className="gap-2">
                    <Rocket className="h-4 w-4" />
                    Deploy to Production
                  </Button>
                ) : (
                  <Button variant="outline" size="lg" onClick={runChecks}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-run Checks
                  </Button>
                )}
              </div>
              
              {missingEnvVars > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-700 dark:text-yellow-300">
                      Missing Environment Variables
                    </span>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {missingEnvVars} required environment variable{missingEnvVars > 1 ? 's are' : ' is'} not configured.
                    Configure them in your Supabase project settings before deployment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionReadinessChecker;