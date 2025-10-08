import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Download,
  Share,
  Settings,
  Eye,
  Save,
  Play,
  Filter,
  Database,
  Layout,
  Palette,
  Clock
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportConfig {
  id?: string;
  name: string;
  description: string;
  dataSources: string[];
  metrics: string[];
  filters: ReportFilter[];
  visualizations: VisualizationConfig[];
  schedule: ScheduleConfig;
  recipients: string[];
  format: 'pdf' | 'excel' | 'dashboard';
}

interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

interface VisualizationConfig {
  type: 'chart' | 'table' | 'kpi' | 'gauge';
  chartType?: 'line' | 'area' | 'bar' | 'pie' | 'scatter';
  dataKey: string;
  title: string;
  position: { x: number; y: number; width: number; height: number };
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

const CustomReportBuilder: React.FC = () => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    dataSources: [],
    metrics: [],
    filters: [],
    visualizations: [],
    schedule: {
      enabled: false,
      frequency: 'weekly',
      time: '09:00'
    },
    recipients: [],
    format: 'dashboard'
  });

  const [availableDataSources] = useState([
    { id: 'equipment', name: 'Equipment', fields: ['name', 'status', 'last_maintenance', 'next_maintenance_date', 'condition_score'] },
    { id: 'inventory_items', name: 'Inventory', fields: ['name', 'quantity', 'min_stock', 'purchase_price', 'category'] },
    { id: 'financial_transactions', name: 'Financial', fields: ['amount', 'transaction_type', 'category', 'created_at'] },
    { id: 'audit_instances', name: 'Audits', fields: ['status', 'score', 'created_at', 'completed_at'] },
    { id: 'crew_members', name: 'Crew', fields: ['name', 'position', 'status', 'license_expiry'] }
  ]);

  const [previewData, setPreviewData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedReports, setSavedReports] = useState<ReportConfig[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    try {
      // In a real implementation, this would load from the database
      const mockReports: ReportConfig[] = [
        {
          id: '1',
          name: 'Weekly Operations Summary',
          description: 'Comprehensive weekly report covering equipment status, crew performance, and operational metrics',
          dataSources: ['equipment', 'crew_members', 'audit_instances'],
          metrics: ['equipment_uptime', 'crew_utilization', 'audit_completion_rate'],
          filters: [],
          visualizations: [
            {
              type: 'chart',
              chartType: 'line',
              dataKey: 'equipment_uptime',
              title: 'Equipment Uptime Trend',
              position: { x: 0, y: 0, width: 6, height: 3 }
            }
          ],
          schedule: { enabled: true, frequency: 'weekly', time: '08:00' },
          recipients: ['operations@yacht.com'],
          format: 'pdf'
        },
        {
          id: '2',
          name: 'Financial Performance Dashboard',
          description: 'Real-time financial metrics and expense tracking',
          dataSources: ['financial_transactions'],
          metrics: ['total_revenue', 'total_expenses', 'profit_margin'],
          filters: [],
          visualizations: [
            {
              type: 'chart',
              chartType: 'area',
              dataKey: 'revenue_trend',
              title: 'Revenue Trend',
              position: { x: 0, y: 0, width: 8, height: 4 }
            }
          ],
          schedule: { enabled: false, frequency: 'daily', time: '06:00' },
          recipients: ['finance@yacht.com'],
          format: 'dashboard'
        }
      ];
      setSavedReports(mockReports);
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      
      // Simulate data fetching based on selected data sources
      const mockData = {
        chartData: Array.from({ length: 12 }, (_, i) => ({
          month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          value: Math.floor(Math.random() * 100) + 50,
          secondary: Math.floor(Math.random() * 80) + 40
        })),
        kpiData: [
          { name: 'Total Equipment', value: 42, change: 2.3, trend: 'up' },
          { name: 'Active Crew', value: 18, change: -1.2, trend: 'down' },
          { name: 'Completion Rate', value: 94.5, change: 5.8, trend: 'up' },
          { name: 'Revenue YTD', value: 1250000, change: 12.4, trend: 'up' }
        ],
        tableData: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          status: ['Active', 'Inactive', 'Maintenance'][Math.floor(Math.random() * 3)],
          value: Math.floor(Math.random() * 10000) + 1000,
          date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString()
        }))
      };

      setPreviewData(mockData);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate report preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveReport = async () => {
    try {
      if (!reportConfig.name) {
        toast.error('Please enter a report name');
        return;
      }

      // In a real implementation, this would save to the database
      const newReport = {
        ...reportConfig,
        id: Date.now().toString()
      };

      setSavedReports(prev => [...prev, newReport]);
      toast.success('Report saved successfully');
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = savedReports.find(report => report.id === templateId);
    if (template) {
      setReportConfig({ ...template, id: undefined });
      setSelectedTemplate(templateId);
      toast.success('Template loaded');
    }
  };

  const addVisualization = (type: VisualizationConfig['type']) => {
    const newViz: VisualizationConfig = {
      type,
      chartType: type === 'chart' ? 'line' : undefined,
      dataKey: reportConfig.dataSources[0] || 'equipment',
      title: `New ${type}`,
      position: { x: 0, y: reportConfig.visualizations.length * 3, width: 6, height: 3 }
    };

    setReportConfig(prev => ({
      ...prev,
      visualizations: [...prev.visualizations, newViz]
    }));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: reportConfig.dataSources[0] || 'equipment',
      operator: 'equals',
      value: ''
    };

    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map((filter, i) => 
        i === index ? { ...filter, ...updates } : filter
      )
    }));
  };

  const removeFilter = (index: number) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }));
  };

  const exportReport = (format: 'pdf' | 'excel') => {
    toast.success(`Exporting report as ${format.toUpperCase()}`);
    // Implementation for actual export would go here
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Custom Report Builder
          </h1>
          <p className="text-muted-foreground">
            Create custom reports and dashboards with drag-and-drop simplicity
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePreview} disabled={isGenerating}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={saveReport}>
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportConfig.name}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>

              <div>
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea
                  id="reportDescription"
                  value={reportConfig.description}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this report"
                  rows={3}
                />
              </div>

              <div>
                <Label>Data Sources</Label>
                <div className="space-y-2 mt-2">
                  {availableDataSources.map(source => (
                    <div key={source.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={source.id}
                        checked={reportConfig.dataSources.includes(source.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setReportConfig(prev => ({
                              ...prev,
                              dataSources: [...prev.dataSources, source.id]
                            }));
                          } else {
                            setReportConfig(prev => ({
                              ...prev,
                              dataSources: prev.dataSources.filter(id => id !== source.id)
                            }));
                          }
                        }}
                      />
                      <Label htmlFor={source.id} className="text-sm">
                        {source.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Report Format</Label>
                <Select
                  value={reportConfig.format}
                  onValueChange={(value: 'pdf' | 'excel' | 'dashboard') => 
                    setReportConfig(prev => ({ ...prev, format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Interactive Dashboard</SelectItem>
                    <SelectItem value="pdf">PDF Report</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedReports.map(report => (
                  <Button
                    key={report.id}
                    variant={selectedTemplate === report.id ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => loadTemplate(report.id!)}
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    {report.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Builder Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="design" className="space-y-4">
            <TabsList>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Visualizations</CardTitle>
                  <CardDescription>Drag and drop components to build your report</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addVisualization('chart')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Chart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addVisualization('table')}
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addVisualization('kpi')}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      KPI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addVisualization('gauge')}
                    >
                      <PieChart className="h-4 w-4 mr-2" />
                      Gauge
                    </Button>
                  </div>

                  {/* Visualization List */}
                  <div className="space-y-3">
                    {reportConfig.visualizations.map((viz, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <Input
                            value={viz.title}
                            onChange={(e) => {
                              const updatedViz = [...reportConfig.visualizations];
                              updatedViz[index] = { ...viz, title: e.target.value };
                              setReportConfig(prev => ({ ...prev, visualizations: updatedViz }));
                            }}
                            className="font-medium bg-transparent border-none p-0 h-auto"
                          />
                          <Badge variant="secondary">{viz.type}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <Label>Data Source</Label>
                            <Select
                              value={viz.dataKey}
                              onValueChange={(value) => {
                                const updatedViz = [...reportConfig.visualizations];
                                updatedViz[index] = { ...viz, dataKey: value };
                                setReportConfig(prev => ({ ...prev, visualizations: updatedViz }));
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {reportConfig.dataSources.map(source => (
                                  <SelectItem key={source} value={source}>
                                    {availableDataSources.find(ds => ds.id === source)?.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {viz.type === 'chart' && (
                            <div>
                              <Label>Chart Type</Label>
                              <Select
                                value={viz.chartType}
                                onValueChange={(value: any) => {
                                  const updatedViz = [...reportConfig.visualizations];
                                  updatedViz[index] = { ...viz, chartType: value };
                                  setReportConfig(prev => ({ ...prev, visualizations: updatedViz }));
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="line">Line</SelectItem>
                                  <SelectItem value="area">Area</SelectItem>
                                  <SelectItem value="bar">Bar</SelectItem>
                                  <SelectItem value="pie">Pie</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Filters</CardTitle>
                  <CardDescription>Add filters to refine your report data</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={addFilter} variant="outline" size="sm" className="mb-4">
                    <Filter className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>

                  <div className="space-y-3">
                    {reportConfig.filters.map((filter, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/50">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>Field</Label>
                            <Select
                              value={filter.field}
                              onValueChange={(value) => updateFilter(index, { field: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {reportConfig.dataSources.flatMap(sourceId => {
                                  const source = availableDataSources.find(ds => ds.id === sourceId);
                                  return source?.fields.map(field => (
                                    <SelectItem key={`${sourceId}.${field}`} value={`${sourceId}.${field}`}>
                                      {source.name}.{field}
                                    </SelectItem>
                                  )) || [];
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Operator</Label>
                            <Select
                              value={filter.operator}
                              onValueChange={(value: any) => updateFilter(index, { operator: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="greater_than">Greater Than</SelectItem>
                                <SelectItem value="less_than">Less Than</SelectItem>
                                <SelectItem value="between">Between</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label>Value</Label>
                              <Input
                                value={filter.value}
                                onChange={(e) => updateFilter(index, { value: e.target.value })}
                                className="h-8"
                                placeholder="Filter value"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFilter(index)}
                              className="mt-5 h-8 w-8 p-0"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Automated Scheduling</CardTitle>
                  <CardDescription>Set up automatic report generation and delivery</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scheduleEnabled"
                      checked={reportConfig.schedule.enabled}
                      onCheckedChange={(checked) => 
                        setReportConfig(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, enabled: checked as boolean }
                        }))
                      }
                    />
                    <Label htmlFor="scheduleEnabled">Enable automatic generation</Label>
                  </div>

                  {reportConfig.schedule.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={reportConfig.schedule.frequency}
                          onValueChange={(value: any) => 
                            setReportConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, frequency: value }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={reportConfig.schedule.time}
                          onChange={(e) => 
                            setReportConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, time: e.target.value }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Recipients</Label>
                    <Textarea
                      value={reportConfig.recipients.join(', ')}
                      onChange={(e) => 
                        setReportConfig(prev => ({
                          ...prev,
                          recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        }))
                      }
                      placeholder="Enter email addresses separated by commas"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Report Preview
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => exportReport('excel')}>
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!previewData ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Click "Preview" to generate a preview of your report</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* KPI Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {previewData.kpiData.map((kpi: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="text-2xl font-bold">{kpi.value.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">{kpi.name}</div>
                              <div className={`text-xs flex items-center ${
                                kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {kpi.change > 0 ? '+' : ''}{kpi.change}%
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Sample Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Sample Visualization</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={previewData.chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Area 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#3b82f6" 
                                  fill="#3b82f6" 
                                  fillOpacity={0.3}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="secondary" 
                                  stroke="#10b981" 
                                  fill="#10b981" 
                                  fillOpacity={0.3}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sample Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Sample Data Table</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">Name</th>
                                  <th className="text-left p-2">Status</th>
                                  <th className="text-right p-2">Value</th>
                                  <th className="text-left p-2">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previewData.tableData.slice(0, 5).map((row: any) => (
                                  <tr key={row.id} className="border-b">
                                    <td className="p-2">{row.name}</td>
                                    <td className="p-2">
                                      <Badge variant={row.status === 'Active' ? 'default' : 'secondary'}>
                                        {row.status}
                                      </Badge>
                                    </td>
                                    <td className="p-2 text-right">${row.value.toLocaleString()}</td>
                                    <td className="p-2">{row.date}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;