import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  AlertCircle,
  CheckCircle,
  Eye,
  Settings,
  Zap,
  Globe,
  Shield,
  Calendar,
  Users,
  Package,
  Wrench,
  Leaf
} from 'lucide-react';

interface ImportData {
  headers: string[];
  data: any[];
  mapping: Record<string, string>;
  preview: any[];
}

interface ExportOptions {
  format: 'xlsx' | 'csv' | 'json' | 'pdf';
  includeMedia: boolean;
  dateRange: string;
  categories: string[];
  includeAIInsights: boolean;
  includeCollaboration: boolean;
}

const ImportExportManager: React.FC = () => {
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    includeMedia: true,
    dateRange: 'all',
    categories: [],
    includeAIInsights: true,
    includeCollaboration: false
  });
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        let parsedData: any[] = [];
        let headers: string[] = [];

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          headers = jsonData[0] as string[];
          parsedData = jsonData.slice(1).map(row => 
            headers.reduce((obj, header, index) => ({
              ...obj,
              [header]: (row as any[])[index]
            }), {})
          );
        } else if (file.name.endsWith('.csv')) {
          Papa.parse(file, {
            header: true,
            complete: (results) => {
              headers = results.meta.fields || [];
              parsedData = results.data;
            }
          });
        }

        setProgress(50);

        // AI-powered field mapping
        const intelligentMapping = await performIntelligentMapping(headers);
        
        setImportData({
          headers,
          data: parsedData,
          mapping: intelligentMapping,
          preview: parsedData.slice(0, 5)
        });

        setProgress(100);
        toast({
          title: 'File Processed',
          description: `Successfully processed ${parsedData.length} records`,
        });
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Error',
        description: 'Failed to process file',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const performIntelligentMapping = async (headers: string[]) => {
    // AI-powered field mapping using enhanced-multi-ai-processor
    try {
      const { data } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
        body: {
          content: `Map these CSV headers to audit database fields: ${headers.join(', ')}`,
          context: 'Field mapping for audit data import',
          module: 'audit',
          action_type: 'field_mapping',
          risk_level: 'low'
        }
      });

      return data?.field_mapping || {};
    } catch (error) {
      console.error('AI mapping error:', error);
      return {};
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: false
  });

  const handleImport = async () => {
    if (!importData) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const batchSize = 100;
      const totalRecords = importData.data.length;
      
      // Map and process data for audit instances
      for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = importData.data.slice(i, i + batchSize);
        const processedBatch = batch.map((record, batchIndex) => {
          // Apply field mapping and ensure required fields
          const mappedRecord: any = Object.entries(importData.mapping).reduce((mapped, [csvField, dbField]) => ({
            ...mapped,
            [dbField]: record[csvField]
          }), {});
          
          return {
            name: mappedRecord.name || record.name || `Imported Audit ${i + batchIndex + 1}`,
            template_id: mappedRecord.template_id || null,
            description: mappedRecord.description || record.description || '',
            status: mappedRecord.status || record.status || 'draft',
            priority: mappedRecord.priority || record.priority || 'medium',
            risk_level: mappedRecord.risk_level || record.risk_level || 'medium',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              imported: true,
              import_date: new Date().toISOString(),
              original_data: record
            }
          };
        });

        const { error } = await supabase.from('audit_instances').insert(processedBatch);
        if (error) throw error;
        
        setProgress((i + batchSize) / totalRecords * 100);
      }

      toast({
        title: 'Import Successful',
        description: `Imported ${totalRecords} audit records`,
      });

      setImportData(null);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import data',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      // Fetch audit data with cross-module integration
      const { data: audits } = await supabase
        .from('audit_instances')
        .select(`
          *,
          template:audit_templates(*),
          items:audit_items(*),
          responses:audit_responses(*),
          insights:audit_ai_insights(*),
          collaboration:audit_collaboration(*)
        `)
        .order('created_at', { ascending: false });

      setProgress(30);

      // Include cross-module data
      const enrichedData = await Promise.all(audits?.map(async (audit) => {
        const enriched: any = { ...audit };
        
        // Add equipment data if linked (handle Json type safely)
        try {
          const metadata = typeof audit.metadata === 'object' && audit.metadata !== null 
            ? audit.metadata as any 
            : {};
          
          if (metadata.equipment_id) {
            const { data: equipment } = await supabase
              .from('equipment')
              .select('*')
              .eq('id', metadata.equipment_id)
              .maybeSingle();
            if (equipment) enriched.equipment_name = equipment.name;
          }
        } catch (error) {
          console.warn('Error loading equipment data:', error);
        }

        // Add crew data if assigned
        if (audit.assigned_to) {
          try {
            const { data: crew } = await supabase
              .from('crew_members')
              .select('*')
              .eq('user_id', audit.assigned_to)
              .maybeSingle();
            if (crew) enriched.assignee_name = crew.name;
          } catch (error) {
            console.warn('Error loading crew data:', error);
          }
        }

        return enriched;
      }) || []);

      setProgress(60);

      let exportContent: any;
      let filename: string;
      let mimeType: string;

      switch (exportOptions.format) {
        case 'xlsx':
          const worksheet = XLSX.utils.json_to_sheet(enrichedData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Audits');
          
          if (exportOptions.includeAIInsights) {
            const insights = enrichedData.flatMap(audit => audit.insights || []);
            const insightsSheet = XLSX.utils.json_to_sheet(insights);
            XLSX.utils.book_append_sheet(workbook, insightsSheet, 'AI Insights');
          }

          exportContent = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          filename = `audit-export-${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'csv':
          exportContent = Papa.unparse(enrichedData);
          filename = `audit-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;

        case 'json':
          exportContent = JSON.stringify(enrichedData, null, 2);
          filename = `audit-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;

        default:
          throw new Error('Unsupported format');
      }

      setProgress(90);

      const blob = new Blob([exportContent], { type: mimeType });
      saveAs(blob, filename);

      setProgress(100);
      toast({
        title: 'Export Successful',
        description: `Exported ${enrichedData.length} audit records`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Import/Export Manager</h2>
          <p className="text-muted-foreground">Professional data management with AI-powered field mapping</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            AI-Powered
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Enterprise
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="api">API Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Audit Data
              </CardTitle>
              <CardDescription>
                Upload Excel, CSV, or JSON files with intelligent field mapping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Drop Zone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop file here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports Excel (.xlsx), CSV (.csv), and JSON (.json) files
                    </p>
                  </div>
                  <Button variant="outline">
                    Browse Files
                  </Button>
                </div>
              </div>

              {/* Processing Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Data Preview & Mapping */}
              {importData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Data Preview & Field Mapping</h3>
                    <Badge variant="secondary">{importData.data.length} records</Badge>
                  </div>
                  
                  {/* Field Mapping */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {importData.headers.map((header, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input value={header} disabled className="flex-1" />
                        <span className="text-muted-foreground">→</span>
                        <Select 
                          value={importData.mapping[header] || ''} 
                          onValueChange={(value) => 
                            setImportData(prev => prev ? ({
                              ...prev,
                              mapping: { ...prev.mapping, [header]: value }
                            }) : null)
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Map to field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Audit Name</SelectItem>
                            <SelectItem value="description">Description</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                            <SelectItem value="risk_level">Risk Level</SelectItem>
                            <SelectItem value="scheduled_date">Scheduled Date</SelectItem>
                            <SelectItem value="compliance_score">Compliance Score</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  {/* Preview Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 border-b">
                      <h4 className="font-medium">Preview (First 5 records)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            {importData.headers.map((header, index) => (
                              <th key={index} className="px-4 py-2 text-left font-medium">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importData.preview.map((row, index) => (
                            <tr key={index} className="border-b">
                              {importData.headers.map((header, headerIndex) => (
                                <td key={headerIndex} className="px-4 py-2">
                                  {row[header]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setImportData(null)}>
                      Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={isProcessing}>
                      {isProcessing ? 'Importing...' : 'Import Data'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Audit Data
              </CardTitle>
              <CardDescription>
                Export comprehensive audit data with cross-module integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Export Options</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Format</label>
                    <Select 
                      value={exportOptions.format} 
                      onValueChange={(value: any) => 
                        setExportOptions(prev => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                        <SelectItem value="json">JSON (.json)</SelectItem>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <Select 
                      value={exportOptions.dateRange} 
                      onValueChange={(value) => 
                        setExportOptions(prev => ({ ...prev, dateRange: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="last30">Last 30 Days</SelectItem>
                        <SelectItem value="last90">Last 90 Days</SelectItem>
                        <SelectItem value="thisyear">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Include Data</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeMedia"
                        checked={exportOptions.includeMedia}
                        onCheckedChange={(checked) => 
                          setExportOptions(prev => ({ ...prev, includeMedia: !!checked }))
                        }
                      />
                      <label htmlFor="includeMedia" className="text-sm">Media files (images, videos)</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeAI"
                        checked={exportOptions.includeAIInsights}
                        onCheckedChange={(checked) => 
                          setExportOptions(prev => ({ ...prev, includeAIInsights: !!checked }))
                        }
                      />
                      <label htmlFor="includeAI" className="text-sm">AI insights & analysis</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeCollab"
                        checked={exportOptions.includeCollaboration}
                        onCheckedChange={(checked) => 
                          setExportOptions(prev => ({ ...prev, includeCollaboration: !!checked }))
                        }
                      />
                      <label htmlFor="includeCollab" className="text-sm">Collaboration data</label>
                    </div>
                  </div>

                  <Button onClick={handleExport} disabled={isProcessing} className="w-full">
                    {isProcessing ? 'Exporting...' : 'Export Data'}
                  </Button>
                </div>
              </div>

              {/* Export Progress */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Exporting...</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maritime Compliance Templates</CardTitle>
              <CardDescription>
                Industry-standard audit templates for regulatory compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'SOLAS Compliance', icon: Shield, desc: 'Safety of Life at Sea regulations' },
                  { name: 'ISM Code', icon: Settings, desc: 'International Safety Management' },
                  { name: 'MLC Convention', icon: Users, desc: 'Maritime Labour Convention' },
                  { name: 'Port State Control', icon: Globe, desc: 'PSC inspection checklist' },
                  { name: 'Equipment Safety', icon: Wrench, desc: 'Equipment compliance audit' },
                  { name: 'Environmental', icon: Leaf, desc: 'Environmental regulations' },
                ].map((template, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      <template.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                      <p className="text-xs text-muted-foreground">{template.desc}</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        Download Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Integration
              </CardTitle>
              <CardDescription>
                Connect with external audit systems and regulatory platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">REST API Endpoints</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code>/api/audits</code>
                      <span className="text-muted-foreground">- Fetch audit data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code>/api/audits/import</code>
                      <span className="text-muted-foreground">- Bulk import audits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code>/api/audits/export</code>
                      <span className="text-muted-foreground">- Export audit data</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Third-Party Integrations</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connect with maritime authorities, classification societies, and regulatory platforms
                    </p>
                    <Button variant="outline" className="w-full">
                      Configure Integrations
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportExportManager;