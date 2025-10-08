import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Share, 
  Calendar, 
  Clock,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Wrench,
  Ship,
  RefreshCw,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Report {
  id: string;
  title: string;
  description: string;
  type: 'operational' | 'financial' | 'compliance' | 'maintenance' | 'inventory';
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    nextRun: Date;
  };
  recipients: string[];
  dataSource: string[];
  format: 'pdf' | 'excel' | 'csv' | 'html';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: string[];
  parameters: any[];
  previewUrl?: string;
}

export default function AdvancedReportingDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<any>(null);
  const { toast } = useToast();

  const loadReportingData = async () => {
    try {
      setIsLoading(true);

      // Mock reports data
      const mockReports: Report[] = [
        {
          id: '1',
          title: 'Monthly Operations Summary',
          description: 'Comprehensive overview of operational performance and key metrics',
          type: 'operational',
          status: 'published',
          createdBy: 'operations.manager@yachtexcel.com',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          schedule: {
            frequency: 'monthly',
            nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25)
          },
          recipients: ['management@yachtexcel.com', 'operations@yachtexcel.com'],
          dataSource: ['audit_instances', 'equipment', 'crew_members'],
          format: 'pdf'
        },
        {
          id: '2',
          title: 'Financial Performance Report',
          description: 'Detailed financial analysis including costs, budgets, and projections',
          type: 'financial',
          status: 'scheduled',
          createdBy: 'finance.manager@yachtexcel.com',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
          lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          schedule: {
            frequency: 'quarterly',
            nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15)
          },
          recipients: ['cfo@yachtexcel.com', 'finance@yachtexcel.com'],
          dataSource: ['financial_transactions', 'procurement_requests'],
          format: 'excel'
        },
        {
          id: '3',
          title: 'Compliance Status Report',
          description: 'Current compliance status across all regulatory frameworks',
          type: 'compliance',
          status: 'draft',
          createdBy: 'compliance.officer@yachtexcel.com',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2),
          recipients: ['legal@yachtexcel.com', 'management@yachtexcel.com'],
          dataSource: ['audit_instances', 'compliance_records'],
          format: 'pdf'
        },
        {
          id: '4',
          title: 'Inventory Valuation Report',
          description: 'Complete inventory analysis with valuations and depreciation',
          type: 'inventory',
          status: 'published',
          createdBy: 'inventory.manager@yachtexcel.com',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          schedule: {
            frequency: 'weekly',
            nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
          },
          recipients: ['procurement@yachtexcel.com', 'finance@yachtexcel.com'],
          dataSource: ['inventory_items', 'suppliers'],
          format: 'excel'
        }
      ];

      // Mock templates data
      const mockTemplates: ReportTemplate[] = [
        {
          id: 't1',
          name: 'Executive Summary',
          description: 'High-level overview for executive stakeholders',
          category: 'operational',
          sections: ['Key Metrics', 'Performance Summary', 'Risk Assessment', 'Recommendations'],
          parameters: ['date_range', 'department', 'priority_level']
        },
        {
          id: 't2',
          name: 'Financial Analysis',
          description: 'Comprehensive financial performance analysis',
          category: 'financial',
          sections: ['Revenue Analysis', 'Cost Breakdown', 'Budget Variance', 'Projections'],
          parameters: ['fiscal_period', 'cost_centers', 'comparison_period']
        },
        {
          id: 't3',
          name: 'Maintenance Schedule',
          description: 'Detailed maintenance planning and execution report',
          category: 'maintenance',
          sections: ['Scheduled Tasks', 'Completed Work', 'Resource Utilization', 'Cost Analysis'],
          parameters: ['equipment_type', 'time_period', 'maintenance_type']
        },
        {
          id: 't4',
          name: 'Compliance Audit',
          description: 'Regulatory compliance status and audit results',
          category: 'compliance',
          sections: ['Compliance Status', 'Audit Findings', 'Corrective Actions', 'Timeline'],
          parameters: ['framework', 'audit_scope', 'compliance_level']
        }
      ];

      setReports(mockReports);
      setTemplates(mockTemplates);

    } catch (error) {
      console.error('Error loading reporting data:', error);
      toast({
        title: "Error Loading Reports",
        description: "Failed to load reporting data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportingData();
  }, []);

  const handleRefresh = () => {
    loadReportingData();
    toast({
      title: "Reports Refreshed",
      description: "Latest reporting data has been loaded.",
    });
  };

  const handleGenerateReport = (reportId: string) => {
    toast({
      title: "Generating Report",
      description: "Your report is being generated and will be available shortly.",
    });
  };

  const handleScheduleReport = (reportId: string) => {
    toast({
      title: "Report Scheduled",
      description: "Report has been scheduled for automatic generation.",
    });
  };

  const handleDeleteReport = (reportId: string) => {
    setReports(reports.filter(r => r.id !== reportId));
    toast({
      title: "Report Deleted",
      description: "Report has been successfully deleted.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-500';
      case 'scheduled':
        return 'text-blue-500';
      case 'draft':
        return 'text-yellow-500';
      case 'archived':
        return 'text-gray-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'published':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'draft':
        return 'outline';
      case 'archived':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'operational':
        return <Ship className="h-4 w-4" />;
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'compliance':
        return <FileText className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'inventory':
        return <Package className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredReports = selectedType === 'all' 
    ? reports 
    : reports.filter(report => report.type === selectedType);

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
          <h1 className="text-3xl font-bold">Advanced Reporting</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage comprehensive reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <div className="text-xs text-muted-foreground">
              {reports.filter(r => r.status === 'published').length} published
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => r.schedule).length}
            </div>
            <div className="text-xs text-muted-foreground">
              Automated reports
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <div className="text-xs text-muted-foreground">
              Available templates
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(reports.flatMap(r => r.recipients)).size}
            </div>
            <div className="text-xs text-muted-foreground">
              Unique recipients
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(report.type)}
                      <span>{report.title}</span>
                    </div>
                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created by:</span>
                        <div>{report.createdBy.split('@')[0]}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Format:</span>
                        <div className="uppercase">{report.format}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Recipients:</span>
                        <div>{report.recipients.length} users</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Modified:</span>
                        <div>{report.lastModified.toLocaleDateString()}</div>
                      </div>
                    </div>

                    {report.schedule && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>
                            Scheduled {report.schedule.frequency} - 
                            Next run: {report.schedule.nextRun.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleGenerateReport(report.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge variant="secondary">{template.category}</Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Sections:</span>
                      <div className="text-sm mt-1">
                        {template.sections.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Parameters:</span>
                      <div className="text-sm mt-1">
                        {template.parameters.join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automated report generation schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.filter(r => r.schedule).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(report.type)}
                      <div>
                        <div className="font-medium">{report.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {report.schedule?.frequency} • Next: {report.schedule?.nextRun.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(report.status)}>
                        {report.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Schedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Usage</CardTitle>
                <CardDescription>Most popular reports and templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Operations Summary</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20 h-2" />
                      <span className="text-sm">85%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Financial Performance Report</span>
                    <div className="flex items-center gap-2">
                      <Progress value={72} className="w-20 h-2" />
                      <span className="text-sm">72%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Inventory Valuation Report</span>
                    <div className="flex items-center gap-2">
                      <Progress value={58} className="w-20 h-2" />
                      <span className="text-sm">58%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generation Statistics</CardTitle>
                <CardDescription>Report generation metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Reports Generated (30 days)</span>
                    <span className="font-medium">142</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Generation Time</span>
                    <span className="font-medium">2.3 min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-medium">98.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Recipients</span>
                    <span className="font-medium">47</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}