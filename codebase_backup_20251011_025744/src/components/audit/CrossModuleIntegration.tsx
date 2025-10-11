import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Package,
  Users,
  Wrench,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Link,
  Zap,
  Eye,
  Settings,
  Calendar,
  FileText
} from 'lucide-react';

interface ModuleMetrics {
  equipment: {
    totalItems: number;
    maintenanceDue: number;
    auditsPending: number;
    complianceScore: number;
  };
  crew: {
    totalMembers: number;
    certificationsExpiring: number;
    auditAssignments: number;
    performanceScore: number;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    auditRequired: number;
    accuracyScore: number;
  };
  maintenance: {
    scheduledTasks: number;
    overdueTasks: number;
    auditItems: number;
    efficiencyScore: number;
  };
  safety: {
    incidents: number;
    auditsCompleted: number;
    complianceGaps: number;
    riskScore: number;
  };
  finance: {
    auditCosts: number;
    savingsIdentified: number;
    budgetCompliance: number;
    roi: number;
  };
}

const CrossModuleIntegration: React.FC = () => {
  const [metrics, setMetrics] = useState<ModuleMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
    checkIntegrationStatus();
  }, []);

  const loadMetrics = async () => {
    try {
      // Load cross-module metrics from existing tables
      const [
        { data: equipment },
        { data: crew },
        { data: inventory },
        { data: maintenance }
      ] = await Promise.all([
        supabase.from('equipment').select('*'),
        supabase.from('crew_members').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('maintenance_schedules').select('*')
      ]);

      // Calculate audit-related metrics with mock data for demonstration
      const auditMetrics: ModuleMetrics = {
        equipment: {
          totalItems: equipment?.length || 0,
          maintenanceDue: equipment?.filter(e => {
            const nextMaintenance = new Date(e.next_maintenance_date || '');
            return nextMaintenance < new Date();
          }).length || 0,
          auditsPending: Math.floor((equipment?.length || 0) * 0.1), // Mock 10% pending audits
          complianceScore: 92
        },
        crew: {
          totalMembers: crew?.length || 0,
          certificationsExpiring: crew?.filter(c => {
            const expiry = new Date(c.license_expiry || '');
            const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            return expiry < thirtyDaysFromNow;
          }).length || 0,
          auditAssignments: Math.floor((crew?.length || 0) * 0.3), // Mock 30% with assignments
          performanceScore: 87
        },
        inventory: {
          totalItems: inventory?.length || 0,
          lowStock: inventory?.filter(i => i.quantity < i.min_stock).length || 0,
          auditRequired: inventory?.filter(i => {
            const lastUsed = new Date(i.last_used_date || '');
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            return lastUsed < ninetyDaysAgo;
          }).length || 0,
          accuracyScore: 95
        },
        maintenance: {
          scheduledTasks: maintenance?.filter(m => m.is_active).length || 0,
          overdueTasks: Math.floor((maintenance?.length || 0) * 0.1), // Mock 10% overdue
          auditItems: Math.floor((maintenance?.length || 0) * 0.2), // Mock 20% require audit
          efficiencyScore: 89
        },
        safety: {
          incidents: 2, // Mock data
          auditsCompleted: 15, // Mock data
          complianceGaps: 3,
          riskScore: 85
        },
        finance: {
          auditCosts: 15000,
          savingsIdentified: 45000,
          budgetCompliance: 97,
          roi: 300
        }
      };

      setMetrics(auditMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cross-module metrics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIntegrationStatus = async () => {
    const modules = ['equipment', 'crew', 'inventory', 'maintenance', 'safety', 'finance'];
    const status: Record<string, boolean> = {};
    
    // For now, mock the integration status based on existing data
    for (const module of modules) {
      status[module] = ['equipment', 'crew', 'inventory', 'maintenance'].includes(module);
    }
    
    setIntegrationStatus(status);
  };

  const enableIntegration = async (module: string) => {
    try {
      // Enable audit integration for the module
      await supabase.functions.invoke('enhanced-multi-ai-processor', {
        body: {
          content: `Enable audit integration for ${module} module`,
          context: 'Cross-module audit integration setup',
          module: 'audit',
          action_type: 'integration_setup',
          risk_level: 'low',
          target_module: module
        }
      });

      setIntegrationStatus(prev => ({ ...prev, [module]: true }));
      
      toast({
        title: 'Integration Enabled',
        description: `Audit integration enabled for ${module} module`,
      });
    } catch (error) {
      console.error('Integration error:', error);
      toast({
        title: 'Integration Failed',
        description: `Failed to enable integration for ${module}`,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const moduleConfigs = [
    {
      id: 'equipment',
      title: 'Equipment Integration',
      icon: Wrench,
      description: 'Link audits to equipment maintenance and condition monitoring',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      metrics: metrics?.equipment
    },
    {
      id: 'crew',
      title: 'Crew Integration',
      icon: Users,
      description: 'Assign audits to crew members and track certifications',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      metrics: metrics?.crew
    },
    {
      id: 'inventory',
      title: 'Inventory Integration',
      icon: Package,
      description: 'Audit inventory levels and stock conditions',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      metrics: metrics?.inventory
    },
    {
      id: 'maintenance',
      title: 'Maintenance Integration',
      icon: Settings,
      description: 'Integrate with maintenance schedules and predictive alerts',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      metrics: metrics?.maintenance
    },
    {
      id: 'safety',
      title: 'Safety Integration',
      icon: Shield,
      description: 'Monitor safety compliance and incident audits',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      metrics: metrics?.safety
    },
    {
      id: 'finance',
      title: 'Finance Integration',
      icon: DollarSign,
      description: 'Track audit costs and ROI from improvements',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      metrics: metrics?.finance
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cross-Module Integration</h2>
          <p className="text-muted-foreground">
            Unified audit management across all yacht systems
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1">
            <Link className="h-3 w-3" />
            Integrated
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            AI-Enhanced
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Integration Overview</TabsTrigger>
          <TabsTrigger value="dataflow">Data Flow</TabsTrigger>
          <TabsTrigger value="automation">Automation Rules</TabsTrigger>
          <TabsTrigger value="analytics">Cross-Module Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moduleConfigs.map((module) => (
              <Card key={module.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${module.bgColor}`}>
                      <module.icon className={`h-5 w-5 ${module.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                      {integrationStatus[module.id] ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Module Metrics */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(module.metrics || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="font-medium">
                          {typeof value === 'number' && key.includes('Score') 
                            ? `${value}%` 
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Integration Actions */}
                  <div className="pt-2 border-t">
                    {integrationStatus[module.id] ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-1" />
                          Config
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => enableIntegration(module.id)} 
                        size="sm" 
                        className="w-full"
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Enable Integration
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dataflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Flow Visualization</CardTitle>
              <CardDescription>
                See how audit data flows between different yacht management modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Data Flow Diagram */}
                <div className="relative">
                  <div className="flex items-center justify-center">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <h3 className="font-semibold">Audit Manager</h3>
                    <p className="text-sm text-muted-foreground">Central audit orchestration</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
                    {moduleConfigs.map((module, index) => (
                      <div key={module.id} className="text-center">
                        <div className="relative">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-px h-16 bg-border"></div>
                            <div className="w-16 h-px bg-border"></div>
                          </div>
                          <div className={`p-3 ${module.bgColor} rounded-lg mx-auto w-fit`}>
                            <module.icon className={`h-6 w-6 ${module.color}`} />
                          </div>
                        </div>
                        <h4 className="font-medium text-sm mt-2">{module.title.split(' ')[0]}</h4>
                        <Badge 
                          variant={integrationStatus[module.id] ? "default" : "outline"} 
                          className="text-xs mt-1"
                        >
                          {integrationStatus[module.id] ? "Connected" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automation Rules
              </CardTitle>
              <CardDescription>
                Configure automatic audit triggers and workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    trigger: 'Equipment Maintenance Due',
                    action: 'Create Equipment Audit',
                    frequency: 'Daily',
                    status: 'Active'
                  },
                  {
                    trigger: 'Low Inventory Stock',
                    action: 'Schedule Inventory Audit',
                    frequency: 'Real-time',
                    status: 'Active'
                  },
                  {
                    trigger: 'Crew Certification Expiring',
                    action: 'Assign Compliance Audit',
                    frequency: 'Weekly',
                    status: 'Active'
                  },
                  {
                    trigger: 'Safety Incident Reported',
                    action: 'Trigger Safety Audit',
                    frequency: 'Immediate',
                    status: 'Active'
                  },
                  {
                    trigger: 'Maintenance Task Completed',
                    action: 'Generate Completion Audit',
                    frequency: 'On Completion',
                    status: 'Inactive'
                  }
                ].map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{rule.trigger} → {rule.action}</h4>
                      <p className="text-sm text-muted-foreground">
                        Frequency: {rule.frequency}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.status === 'Active' ? 'default' : 'outline'}>
                        {rule.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cross-Module Audits</p>
                    <p className="text-2xl font-bold">247</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <Progress value={85} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Integration Health</p>
                    <p className="text-2xl font-bold">96%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <Progress value={96} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Automation Rate</p>
                    <p className="text-2xl font-bold">78%</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
                <Progress value={78} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Data Accuracy</p>
                    <p className="text-2xl font-bold">99.2%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <Progress value={99} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrossModuleIntegration;