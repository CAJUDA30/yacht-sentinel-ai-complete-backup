import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, TestTube, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentAIProcessor {
  id: string;
  name: string;
  processor_id: string;
  location: string;
  project_id: string;
  display_name: string;
  description: string;
  specialization: string;
  supported_formats?: string[];
  priority: number;
  is_active: boolean;
  accuracy?: number;
  configuration: Record<string, any>;
  last_tested_at: string | null;
  last_test_status: 'success' | 'error' | 'warning' | null;
  last_test_result: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

const EnhancedDocumentAIManager: React.FC = () => {
  const [processors, setProcessors] = useState<DocumentAIProcessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');
  const [selectedProcessor, setSelectedProcessor] = useState<DocumentAIProcessor | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DocumentAIProcessor>>({});

  useEffect(() => {
    loadProcessors();
  }, []);

  const loadProcessors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_ai_processors')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setProcessors((data || []) as unknown as DocumentAIProcessor[]);
    } catch (error) {
      console.error('Error loading processors:', error);
      toast.error('Failed to load processors');
    } finally {
      setLoading(false);
    }
  };

  const syncFromGoogleCloud = async () => {
    try {
      setSyncing(true);
      setSyncProgress('Discovering processors from Google Cloud...');
      
      const response = await supabase.functions.invoke('gcp-unified-config', {
        body: {
          action: 'list_processors',
          payload: {
            project_id: '338523806048',
            locations: ['us', 'eu', 'asia1']
          }
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      if (result.success) {
        setSyncProgress(`✅ Discovery complete! Found ${result.processors_discovered} processors`);
        
        toast.success(
          `Sync completed: ${result.sync_results.created} created, ${result.sync_results.updated} updated, ${result.sync_results.errors} errors`
        );
        
        await loadProcessors();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Error syncing processors:', error);
      setSyncProgress('❌ Sync failed');
      toast.error(`Failed to sync processors: ${error.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncProgress(''), 3000);
    }
  };

  const testProcessor = async (processor: DocumentAIProcessor) => {
    try {
      setTesting(prev => ({ ...prev, [processor.id]: true }));

      const response = await supabase.functions.invoke('gcp-unified-config', {
        body: {
          action: 'test_processor',
          processor_id: processor.processor_id,
          location: processor.location,
          project_id: processor.project_id
        }
      });

      if (response.error) throw response.error;

      const testResult = {
        status: response.data.success ? 'success' : 'error',
        message: response.data.message || 'Test completed',
        details: response.data.details,
        tested_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('document_ai_processors')
        .update({
          last_tested_at: testResult.tested_at,
          last_test_status: testResult.status,
          last_test_result: testResult as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', processor.id);

      if (updateError) throw updateError;

      toast.success(`Processor "${processor.display_name}" test completed`);
      loadProcessors();
    } catch (error: any) {
      console.error('Error testing processor:', error);
      toast.error(`Failed to test processor "${processor.display_name}"`);
    } finally {
      setTesting(prev => ({ ...prev, [processor.id]: false }));
    }
  };

  const getStatusIcon = (processor: DocumentAIProcessor) => {
    if (!processor.last_test_status) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    
    switch (processor.last_test_status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (processor: DocumentAIProcessor) => {
    if (!processor.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (!processor.last_test_status) {
      return <Badge variant="outline">Not Tested</Badge>;
    }
    
    switch (processor.last_test_status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const openEditDialog = (processor?: DocumentAIProcessor) => {
    setSelectedProcessor(processor || null);
    setEditForm(processor ? { ...processor } : {
      name: '',
      processor_id: '',
      location: 'us',
      project_id: '338523806048',
      display_name: '',
      description: '',
      specialization: 'Document Processing',
      priority: 1,
      is_active: true,
      configuration: {}
    });
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading processors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Document AI Processor Management</h2>
          <p className="text-muted-foreground">
            Manage and configure your Google Cloud Document AI processors
          </p>
          {syncProgress && (
            <p className="text-sm font-medium text-blue-600 mt-1">
              {syncProgress}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={syncFromGoogleCloud} 
            disabled={syncing}
            variant="outline"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Sync from Google Cloud
          </Button>
          <Button onClick={() => openEditDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Processor
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processors.map((processor) => (
              <Card key={processor.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{processor.display_name}</CardTitle>
                    {getStatusIcon(processor)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(processor)}
                    <Badge variant="outline">Priority {processor.priority}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{processor.description}</p>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {processor.specialization}
                    </Badge>
                    {processor.supported_formats && processor.supported_formats.slice(0, 2).map((format, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {format}
                      </Badge>
                    ))}
                    {processor.supported_formats && processor.supported_formats.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{processor.supported_formats.length - 2} more
                      </Badge>
                    )}
                  </div>

                  {processor.last_tested_at && (
                    <p className="text-xs text-muted-foreground">
                      Last tested: {new Date(processor.last_tested_at).toLocaleString()}
                    </p>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testProcessor(processor)}
                      disabled={testing[processor.id]}
                    >
                      {testing[processor.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <TestTube className="h-3 w-3 mr-1" />
                      )}
                      Test
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(processor)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Processor Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processor ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Last Tested</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processors.map((processor) => (
                    <TableRow key={processor.id}>
                      <TableCell className="font-medium">
                        {processor.display_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(processor)}
                          {getStatusBadge(processor)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {processor.processor_id}
                      </TableCell>
                      <TableCell>{processor.location}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {processor.specialization}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {processor.last_tested_at
                          ? new Date(processor.last_tested_at).toLocaleString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testProcessor(processor)}
                            disabled={testing[processor.id]}
                          >
                            {testing[processor.id] ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <TestTube className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(processor)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Use "Sync from Google Cloud" to automatically discover and sync processors from your Google Cloud Console.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Default Project ID</Label>
                  <Input value="338523806048" readOnly />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Processors:</span>
                    <span className="font-semibold">{processors.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Processors:</span>
                    <span className="font-semibold text-green-600">
                      {processors.filter(p => p.is_active).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-semibold text-green-600">
                      {processors.filter(p => p.last_test_status === 'success').length > 0
                        ? Math.round((processors.filter(p => p.last_test_status === 'success').length / 
                           processors.filter(p => p.last_test_status).length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDocumentAIManager;