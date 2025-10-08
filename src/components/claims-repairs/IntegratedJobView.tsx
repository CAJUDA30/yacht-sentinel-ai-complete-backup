import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useClaimsRepairs, ClaimsRepairsJob } from '@/contexts/ClaimsRepairsContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Wrench, 
  Package, 
  Users, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Settings
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IntegratedData {
  equipment?: any;
  inventory?: any[];
  crew?: any[];
  finance?: any;
  maintenance?: any[];
  compliance?: any[];
}

interface IntegratedJobViewProps {
  job: ClaimsRepairsJob;
  onJobUpdate?: (job: ClaimsRepairsJob) => void;
}

export const IntegratedJobView: React.FC<IntegratedJobViewProps> = ({ job, onJobUpdate }) => {
  const [integratedData, setIntegratedData] = useState<IntegratedData>({});
  const [loading, setLoading] = useState(false);
  const { getIntegratedJobData, performFullIntegration } = useClaimsRepairs();
  const { toast } = useToast();

  useEffect(() => {
    loadIntegratedData();
  }, [job.id]);

  const loadIntegratedData = async () => {
    try {
      setLoading(true);
      const data = await getIntegratedJobData(job.id);
      setIntegratedData(data || {});
    } catch (error) {
      console.error('Error loading integrated data:', error);
      toast({
        title: "Warning",
        description: "Some integrated data could not be loaded",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFullIntegration = async () => {
    try {
      setLoading(true);
      await performFullIntegration(job.id, {
        syncEquipment: true,
        updateInventory: true,
        createFinanceRecords: true,
        assignCrew: true,
        scheduleMaintenance: true
      });

      toast({
        title: "Success",
        description: "Full integration completed successfully"
      });

      // Reload data to show updates
      await loadIntegratedData();
      
      if (onJobUpdate) {
        onJobUpdate({ ...job, updated_at: new Date().toISOString() });
      }
    } catch (error) {
      console.error('Error performing full integration:', error);
      toast({
        title: "Error",
        description: "Failed to complete full integration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getIntegrationHealth = (): { score: number; issues: string[] } => {
    const issues: string[] = [];
    let score = 100;

    if (!integratedData.equipment) {
      issues.push('Equipment data not linked');
      score -= 20;
    }

    if (!integratedData.inventory || integratedData.inventory.length === 0) {
      issues.push('No inventory reservations');
      score -= 15;
    }

    if (!integratedData.crew || integratedData.crew.length === 0) {
      issues.push('No crew assigned');
      score -= 15;
    }

    if (!integratedData.finance) {
      issues.push('Financial tracking not enabled');
      score -= 20;
    }

    if (!integratedData.compliance || integratedData.compliance.length === 0) {
      issues.push('Compliance requirements missing');
      score -= 10;
    }

    return { score: Math.max(0, score), issues };
  };

  const { score: integrationScore, issues } = getIntegrationHealth();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Integration Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Integration Health
              </CardTitle>
              <CardDescription>
                Cross-module integration status for this job
              </CardDescription>
            </div>
            <Button 
              onClick={handleFullIntegration}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Settings className="h-4 w-4" />
              Full Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Integration Score</span>
              <span className="text-2xl font-bold">{integrationScore}%</span>
            </div>
            <Progress value={integrationScore} className="h-2" />
            
            {issues.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Integration Issues:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Details Tabs */}
      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.equipment ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{integratedData.equipment.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {integratedData.equipment.category} • {integratedData.equipment.model}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusIcon(integratedData.equipment.status)}
                        <Badge variant="outline">
                          {integratedData.equipment.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No equipment linked to this repair job. Consider linking relevant equipment for better tracking.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.inventory && integratedData.inventory.length > 0 ? (
                <div className="space-y-3">
                  {integratedData.inventory.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.reserved_quantity || item.quantity} • {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === 'reserved' ? 'secondary' : 'outline'}>
                          {item.status || 'Available'}
                        </Badge>
                        <span className="text-sm font-medium">
                          ${(item.unit_cost || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No inventory items reserved for this repair. Parts may need to be ordered.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Crew Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.crew && integratedData.crew.length > 0 ? (
                <div className="space-y-3">
                  {integratedData.crew.map((member: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.role} • {member.certifications?.join(', ')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {member.status || 'Assigned'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No crew members assigned to this repair. Consider assigning qualified personnel.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Finance Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.finance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Estimated Cost</p>
                      <p className="text-2xl font-bold">
                        ${(integratedData.finance.estimated_cost || job.estimated_cost || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Actual Cost</p>
                      <p className="text-2xl font-bold">
                        ${(integratedData.finance.actual_cost || job.actual_cost || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  {integratedData.finance.transactions && (
                    <div className="space-y-2">
                      <p className="font-medium">Recent Transactions</p>
                      {integratedData.finance.transactions.map((transaction: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{transaction.description}</span>
                          <span className="font-medium">
                            ${transaction.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No financial tracking enabled for this repair. Enable budget tracking for cost management.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Maintenance Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.maintenance && integratedData.maintenance.length > 0 ? (
                <div className="space-y-3">
                  {integratedData.maintenance.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.task_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {new Date(item.scheduled_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <Badge variant="outline">
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No follow-up maintenance scheduled. Consider scheduling preventive maintenance after repair completion.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Compliance Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.compliance && integratedData.compliance.length > 0 ? (
                <div className="space-y-3">
                  {integratedData.compliance.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.requirement_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.standard_type} • Due: {new Date(item.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <Badge variant={item.severity === 'critical' ? 'destructive' : 'outline'}>
                          {item.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No specific compliance requirements identified. Check if regulatory requirements apply to this repair.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};