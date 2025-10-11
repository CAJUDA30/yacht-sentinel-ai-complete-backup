import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Ship, 
  Users, 
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  Anchor,
  LifeBuoy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceRequirement {
  id: string;
  regulation_code: string;
  requirement_title: string;
  description?: string;
  category: 'safety' | 'environmental' | 'technical' | 'operational';  
  severity: 'critical' | 'high' | 'medium' | 'low';
  applicable_modules: string[];
  verification_criteria: Record<string, any>;
  is_active: boolean;
}

interface ComplianceStatus {
  requirement_id: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
  last_checked?: string;
  next_review_date?: string;
  notes?: string;
  evidence_documents?: string[];
}

interface MaritimeComplianceTrackerProps {
  selectedJobId?: string;
  yachtId?: string;
}

export const MaritimeComplianceTracker: React.FC<MaritimeComplianceTrackerProps> = ({
  selectedJobId,
  yachtId
}) => {
  const { toast } = useToast();
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [complianceStatuses, setComplianceStatuses] = useState<ComplianceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Get all compliance requirements applicable to claims & repairs
      const { data: reqData, error: reqError } = await supabase
        .from('compliance_requirements')
        .select('*')
        .contains('applicable_modules', ['claims_repairs'])
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (reqError) throw reqError;
      setRequirements((reqData || []) as ComplianceRequirement[]);

      // Mock compliance statuses (in real implementation, this would come from a compliance_statuses table)
      const mockStatuses: ComplianceStatus[] = reqData?.map(req => ({
        requirement_id: req.id,
        status: Math.random() > 0.3 ? 'compliant' : 
                Math.random() > 0.5 ? 'pending' : 'non_compliant',
        last_checked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        next_review_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Compliance check for ${req.requirement_title}`,
        evidence_documents: []
      })) || [];

      setComplianceStatuses(mockStatuses);

    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, [selectedJobId, yachtId]);

  const getComplianceStatus = (requirementId: string): ComplianceStatus | undefined => {
    return complianceStatuses.find(s => s.requirement_id === requirementId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'non_compliant': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'compliant': return 'default';
      case 'non_compliant': return 'destructive';
      case 'pending': return 'outline';
      default: return 'secondary';
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return <LifeBuoy className="h-4 w-4" />;
      case 'environmental': return <Ship className="h-4 w-4" />;
      case 'technical': return <Wrench className="h-4 w-4" />;
      case 'operational': return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredRequirements = selectedCategory === 'all' 
    ? requirements 
    : requirements.filter(req => req.category === selectedCategory);

  const complianceStats = {
    total: requirements.length,
    compliant: complianceStatuses.filter(s => s.status === 'compliant').length,
    non_compliant: complianceStatuses.filter(s => s.status === 'non_compliant').length,
    pending: complianceStatuses.filter(s => s.status === 'pending').length,
    compliance_rate: requirements.length > 0 
      ? Math.round((complianceStatuses.filter(s => s.status === 'compliant').length / requirements.length) * 100)
      : 0
  };

  const criticalNonCompliant = requirements.filter(req => {
    const status = getComplianceStatus(req.id);
    return req.severity === 'critical' && status?.status === 'non_compliant';
  });

  return (
    <div className="space-y-6">
      {/* Header with compliance overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Maritime Compliance Tracker
          </CardTitle>
          <CardDescription>
            Monitor SIRE 2.0, DNV, ISM Code, MLC, and Port State Control compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-success">{complianceStats.compliant}</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-destructive">{complianceStats.non_compliant}</div>
              <div className="text-sm text-muted-foreground">Non-Compliant</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-warning">{complianceStats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{complianceStats.compliance_rate}%</div>
              <div className="text-sm text-muted-foreground">Compliance Rate</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Overall Compliance</span>
                <span className="text-sm text-muted-foreground">{complianceStats.compliance_rate}%</span>
              </div>
              <Progress value={complianceStats.compliance_rate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical alerts */}
      {criticalNonCompliant.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Compliance Issues:</strong> {criticalNonCompliant.length} critical requirements are non-compliant. 
            This may affect vessel operations and port entry permissions.
          </AlertDescription>
        </Alert>
      )}

      {/* Category filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </Button>
            <Button 
              variant={selectedCategory === 'safety' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('safety')}
              className="flex items-center gap-1"
            >
              <LifeBuoy className="h-4 w-4" />
              Safety
            </Button>
            <Button 
              variant={selectedCategory === 'environmental' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('environmental')}
              className="flex items-center gap-1"
            >
              <Ship className="h-4 w-4" />
              Environmental
            </Button>
            <Button 
              variant={selectedCategory === 'technical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('technical')}
              className="flex items-center gap-1"
            >
              <Wrench className="h-4 w-4" />
              Technical
            </Button>
            <Button 
              variant={selectedCategory === 'operational' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('operational')}
              className="flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Operational
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compliance requirements list */}
      <div className="space-y-4">
        {filteredRequirements.map((requirement) => {
          const status = getComplianceStatus(requirement.id);
          
          return (
            <Card key={requirement.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getCategoryIcon(requirement.category)}
                    <div>
                      <CardTitle className="text-lg">{requirement.requirement_title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{requirement.regulation_code}</Badge>
                        <Badge variant={getSeverityColor(requirement.severity)}>{requirement.severity}</Badge>
                        <Badge variant="outline" className="capitalize">{requirement.category}</Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status && getStatusIcon(status.status)}
                    <Badge variant={status ? getStatusColor(status.status) : 'secondary'}>
                      {status?.status.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{requirement.description}</p>
                
                {status && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Last Checked:</strong> {' '}
                      {status.last_checked ? new Date(status.last_checked).toLocaleDateString() : 'Never'}
                    </div>
                    <div>
                      <strong>Next Review:</strong> {' '}
                      {status.next_review_date ? new Date(status.next_review_date).toLocaleDateString() : 'Not scheduled'}
                    </div>
                    {status.notes && (
                      <div className="md:col-span-2">
                        <strong>Notes:</strong> {status.notes}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Update Status
                  </Button>
                  <Button variant="outline" size="sm">
                    <Anchor className="h-4 w-4 mr-1" />
                    Upload Evidence
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRequirements.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No compliance requirements found for the selected category
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};