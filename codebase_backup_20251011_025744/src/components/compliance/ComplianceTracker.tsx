import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileCheck, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  FileText,
  Shield,
  Globe,
  Database,
  RefreshCw,
  Download,
  Plus,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'pending';
  score: number;
  requirements: number;
  completed: number;
  lastAssessment: Date;
  nextAssessment: Date;
  responsible: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceRequirement {
  id: string;
  framework: string;
  title: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  evidence: string[];
  responsible: string;
  dueDate: Date;
  lastReview: Date;
  notes: string;
}

interface AuditTrail {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  framework: string;
  requirement?: string;
  changes: string;
}

export default function ComplianceTracker() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const { toast } = useToast();

  const loadComplianceData = async () => {
    try {
      setIsLoading(true);

      // Mock compliance frameworks data
      const mockFrameworks: ComplianceFramework[] = [
        {
          id: 'gdpr',
          name: 'GDPR',
          description: 'General Data Protection Regulation',
          status: 'compliant',
          score: 95,
          requirements: 25,
          completed: 24,
          lastAssessment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          nextAssessment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 335),
          responsible: 'Data Protection Officer',
          priority: 'critical'
        },
        {
          id: 'iso27001',
          name: 'ISO 27001',
          description: 'Information Security Management',
          status: 'partial',
          score: 82,
          requirements: 35,
          completed: 29,
          lastAssessment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
          nextAssessment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 320),
          responsible: 'Security Manager',
          priority: 'high'
        },
        {
          id: 'soc2',
          name: 'SOC 2',
          description: 'Service Organization Control 2',
          status: 'compliant',
          score: 98,
          requirements: 20,
          completed: 20,
          lastAssessment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
          nextAssessment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 350),
          responsible: 'Compliance Team',
          priority: 'medium'
        },
        {
          id: 'marpol',
          name: 'MARPOL 73/78',
          description: 'International Convention for the Prevention of Pollution from Ships',
          status: 'partial',
          score: 78,
          requirements: 15,
          completed: 12,
          lastAssessment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
          nextAssessment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 305),
          responsible: 'Environmental Officer',
          priority: 'high'
        }
      ];

      // Mock requirements data
      const mockRequirements: ComplianceRequirement[] = [
        {
          id: 'gdpr-1',
          framework: 'gdpr',
          title: 'Data Processing Records',
          description: 'Maintain records of all data processing activities',
          status: 'compliant',
          evidence: ['processing-register.pdf', 'data-flow-diagram.pdf'],
          responsible: 'DPO',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          lastReview: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
          notes: 'Updated quarterly, next review due in 30 days'
        },
        {
          id: 'gdpr-2',
          framework: 'gdpr',
          title: 'Privacy Impact Assessments',
          description: 'Conduct PIAs for high-risk processing activities',
          status: 'partial',
          evidence: ['pia-template.pdf'],
          responsible: 'DPO',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          lastReview: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
          notes: 'Missing PIA for new mobile app features'
        }
      ];

      // Mock audit trail
      const mockAuditTrail: AuditTrail[] = [
        {
          id: '1',
          action: 'Framework Assessment Updated',
          user: 'compliance.officer@yachtexcel.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          framework: 'GDPR',
          changes: 'Updated compliance score from 93% to 95%'
        },
        {
          id: '2',
          action: 'Requirement Status Changed',
          user: 'security.manager@yachtexcel.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
          framework: 'ISO 27001',
          requirement: 'Access Control Reviews',
          changes: 'Status changed from partial to compliant'
        }
      ];

      setFrameworks(mockFrameworks);
      setRequirements(mockRequirements);
      setAuditTrail(mockAuditTrail);

    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: "Error Loading Compliance Data",
        description: "Failed to load compliance information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, []);

  const handleRefresh = () => {
    loadComplianceData();
    toast({
      title: "Compliance Data Refreshed",
      description: "Latest compliance information has been loaded.",
    });
  };

  const handleExportReport = () => {
    toast({
      title: "Compliance Report Export",
      description: "Generating comprehensive compliance report...",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-500';
      case 'partial':
        return 'text-yellow-500';
      case 'non-compliant':
        return 'text-red-500';
      case 'pending':
      case 'not-assessed':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'non-compliant':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'not-assessed':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'low':
        return 'outline';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'default';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredRequirements = selectedFramework
    ? requirements.filter(req => req.framework === selectedFramework)
    : requirements;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Tracker</h1>
          <p className="text-muted-foreground">
            Monitor and manage regulatory compliance across all frameworks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Framework
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map((framework) => (
          <Card key={framework.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedFramework(framework.id)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{framework.name}</CardTitle>
              <Badge variant={getPriorityBadgeVariant(framework.priority)} className="text-xs">
                {framework.priority}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{framework.score}%</div>
              <div className="flex items-center mt-2 text-xs">
                {getStatusIcon(framework.status)}
                <span className={`ml-1 ${getStatusColor(framework.status)}`}>
                  {framework.completed}/{framework.requirements} requirements
                </span>
              </div>
              <Progress value={framework.score} className="h-2 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="frameworks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{framework.name}</span>
                    {getStatusIcon(framework.status)}
                  </CardTitle>
                  <CardDescription>{framework.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Compliance Score</span>
                        <span>{framework.score}%</span>
                      </div>
                      <Progress value={framework.score} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Requirements</span>
                        <div>{framework.completed}/{framework.requirements}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Responsible</span>
                        <div>{framework.responsible}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Assessment</span>
                        <div>{framework.lastAssessment.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Assessment</span>
                        <div>{framework.nextAssessment.toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Requirements</CardTitle>
              <CardDescription>
                {selectedFramework 
                  ? `Requirements for ${frameworks.find(f => f.id === selectedFramework)?.name}`
                  : 'All compliance requirements across frameworks'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequirements.map((requirement) => (
                  <div key={requirement.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{requirement.title}</h4>
                          {getStatusIcon(requirement.status)}
                          <Badge variant="outline" className="text-xs">
                            {requirement.framework.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {requirement.description}
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">Responsible: </span>
                            {requirement.responsible}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due: </span>
                            {requirement.dueDate.toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Review: </span>
                            {requirement.lastReview.toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Evidence: </span>
                            {requirement.evidence.length} file(s)
                          </div>
                        </div>
                        {requirement.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <strong>Notes:</strong> {requirement.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assessments</CardTitle>
              <CardDescription>Scheduled compliance assessments and reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {frameworks
                  .sort((a, b) => a.nextAssessment.getTime() - b.nextAssessment.getTime())
                  .map((framework) => (
                    <div key={framework.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{framework.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {framework.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {framework.nextAssessment.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.ceil((framework.nextAssessment.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-trail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete history of compliance-related activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <FileCheck className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <div className="font-medium">{entry.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.framework}
                        {entry.requirement && ` - ${entry.requirement}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {entry.changes}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{entry.user}</div>
                      <div>{entry.timestamp.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}