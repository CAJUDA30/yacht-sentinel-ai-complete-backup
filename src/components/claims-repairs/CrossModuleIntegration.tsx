import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Wrench, 
  Package, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  TrendingUp,
  AlertTriangle,
  Link,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { crossModuleIntegration, IntegratedJobData } from '@/services/crossModuleIntegration';

interface CrossModuleIntegrationProps {
  selectedJobId?: string;
}

export const CrossModuleIntegration: React.FC<CrossModuleIntegrationProps> = ({
  selectedJobId
}) => {
  const { toast } = useToast();
  const [integratedData, setIntegratedData] = useState<IntegratedJobData | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadIntegratedData = async () => {
    if (!selectedJobId) return;

    setLoading(true);
    try {
      const data = await crossModuleIntegration.getIntegratedJobData(selectedJobId);
      setIntegratedData(data);

      if (data) {
        const generatedInsights = await crossModuleIntegration.generateInsights(selectedJobId);
        setInsights(generatedInsights);
      }
    } catch (error) {
      console.error('Error loading integrated data:', error);
      toast({
        title: "Error",
        description: "Failed to load cross-module data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegratedData();
  }, [selectedJobId]);

  const createFinanceTransaction = async (type: 'expense' | 'invoice', amount: number, description: string) => {
    if (!selectedJobId) return;

    try {
      await crossModuleIntegration.createFinanceTransaction(
        selectedJobId,
        'claims_repair',
        type,
        amount,
        'USD',
        description
      );
      
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`
      });
      
      loadIntegratedData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create ${type}`,
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (!selectedJobId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Cross-Module Integration
          </CardTitle>
          <CardDescription>
            View related data from Equipment, Inventory, Finance, and Compliance modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Link className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Select a job to view cross-module integrations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading integrated data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!integratedData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Failed to load integrated data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with key metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Cross-Module Integration
              </CardTitle>
              <CardDescription>
                Job: {integratedData.job.name}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadIntegratedData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Wrench className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{integratedData.related_equipment?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Equipment</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{integratedData.related_inventory?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Inventory</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{integratedData.finance_transactions?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{integratedData.compliance_requirements?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Compliance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.cost_optimization?.map((insight: any, index: number) => (
              <Alert key={`cost-${index}`}>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>{insight.message}</AlertDescription>
              </Alert>
            ))}
            {insights.preventive_suggestions?.map((insight: any, index: number) => (
              <Alert key={`preventive-${index}`} variant="default">
                <Calendar className="h-4 w-4" />
                <AlertDescription>{insight.message}</AlertDescription>
              </Alert>
            ))}
            {insights.compliance_alerts?.map((insight: any, index: number) => (
              <Alert key={`compliance-${index}`} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{insight.message}</AlertDescription>
              </Alert>
            ))}
            {insights.resource_recommendations?.map((insight: any, index: number) => (
              <Alert key={`resource-${index}`}>
                <Package className="h-4 w-4" />
                <AlertDescription>{insight.message}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Related Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.related_equipment?.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No related equipment found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {integratedData.related_equipment?.map((equipment) => (
                    <div key={equipment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{equipment.name}</h4>
                        <Badge variant={equipment.status === 'operational' ? 'default' : 'destructive'}>
                          {equipment.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div><strong>Model:</strong> {equipment.model_number || 'N/A'}</div>
                        <div><strong>Serial:</strong> {equipment.serial_number || 'N/A'}</div>
                        <div><strong>Location:</strong> {equipment.location || 'N/A'}</div>
                        <div><strong>Last Maintenance:</strong> {equipment.last_maintenance_date || 'N/A'}</div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View in Equipment
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Related Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.related_inventory?.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No related inventory items found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {integratedData.related_inventory?.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <div className="flex gap-2">
                          <Badge variant={item.quantity > (item.min_stock || 0) ? 'default' : 'destructive'}>
                            Stock: {item.quantity}
                          </Badge>
                          <Badge variant="outline">{item.status}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div><strong>Part Number:</strong> {item.part_number || 'N/A'}</div>
                        <div><strong>Location:</strong> {item.location || 'N/A'}</div>
                        <div><strong>Unit Cost:</strong> ${item.unit_cost || 0}</div>
                        <div><strong>Min Stock:</strong> {item.min_stock || 'N/A'}</div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View in Inventory
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Finance Transactions
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => createFinanceTransaction('expense', 1000, 'Repair materials')}
                  >
                    Add Expense
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => createFinanceTransaction('invoice', 2500, 'Service invoice')}
                  >
                    Create Invoice
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {integratedData.finance_transactions?.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No finance transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {integratedData.finance_transactions?.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold capitalize">{transaction.transaction_type}</h4>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {transaction.amount} {transaction.currency}
                          </Badge>
                          <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{transaction.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div><strong>Created:</strong> {new Date(transaction.created_at).toLocaleDateString()}</div>
                        <div><strong>Due:</strong> {transaction.due_date ? new Date(transaction.due_date).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Compliance Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {integratedData.compliance_requirements?.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No compliance requirements found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {integratedData.compliance_requirements?.map((requirement) => (
                    <div key={requirement.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{requirement.requirement_title}</h4>
                        <div className="flex gap-2">
                           <Badge variant={getSeverityColor(requirement.severity)}>
                             {requirement.severity}
                           </Badge>
                          <Badge variant="outline">{requirement.regulation_code}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{requirement.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span className="text-muted-foreground">Category: {requirement.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};