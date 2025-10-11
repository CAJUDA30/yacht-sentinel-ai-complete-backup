import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuditIntegration } from '@/contexts/AuditIntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Package,
  DollarSign,
  Mail,
  Brain
} from 'lucide-react';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    event: string;
    conditions: any;
  };
  actions: {
    type: string;
    module: string;
    config: any;
  }[];
  enabled: boolean;
  priority: number;
  created_at: string;
  last_executed?: string;
  execution_count: number;
}

const WorkflowAutomation: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowRule | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { config } = useAuditIntegration();
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_workflows')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;

      const workflowRules: WorkflowRule[] = (data || []).map(workflow => {
        const conditions = typeof workflow.conditions === 'object' && workflow.conditions ? workflow.conditions : {};
        const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
        
        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || '',
          trigger: {
            event: (conditions as any)?.event || 'audit_completed',
            conditions: (conditions as any)?.conditions || {}
          },
          actions: steps.map((step: any) => ({
            type: step?.type || 'send_notification',
            module: step?.module || 'email',
            config: step?.config || {}
          })),
          enabled: workflow.is_active,
          priority: 1,
          created_at: workflow.created_at,
          execution_count: 0
        };
      });

      setWorkflows(workflowRules);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflow automation rules',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (workflow: Partial<WorkflowRule>) => {
    try {
      const { data, error } = await supabase
        .from('audit_workflows')
        .insert({
          name: workflow.name,
          description: workflow.description,
          workflow_type: 'automation',
          conditions: {
            event: workflow.trigger?.event,
            conditions: workflow.trigger?.conditions
          },
          steps: workflow.actions,
          is_active: workflow.enabled
        })
        .select()
        .single();

      if (error) throw error;

      await loadWorkflows();
      setShowCreateDialog(false);
      
      toast({
        title: 'Workflow Created',
        description: `Automation rule "${workflow.name}" has been created successfully.`
      });
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to create workflow automation rule',
        variant: 'destructive'
      });
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<WorkflowRule>) => {
    try {
      const { error } = await supabase
        .from('audit_workflows')
        .update({
          name: updates.name,
          description: updates.description,
          conditions: {
            event: updates.trigger?.event,
            conditions: updates.trigger?.conditions
          },
          steps: updates.actions,
          is_active: updates.enabled
        })
        .eq('id', id);

      if (error) throw error;

      await loadWorkflows();
      setEditingWorkflow(null);
      
      toast({
        title: 'Workflow Updated',
        description: 'Automation rule has been updated successfully.'
      });
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update workflow automation rule',
        variant: 'destructive'
      });
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const { error } = await supabase
        .from('audit_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadWorkflows();
      
      toast({
        title: 'Workflow Deleted',
        description: 'Automation rule has been deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow automation rule',
        variant: 'destructive'
      });
    }
  };

  const toggleWorkflow = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('audit_workflows')
        .update({ is_active: enabled })
        .eq('id', id);

      if (error) throw error;

      await loadWorkflows();
      
      toast({
        title: enabled ? 'Workflow Enabled' : 'Workflow Disabled',
        description: `Automation rule has been ${enabled ? 'enabled' : 'disabled'}.`
      });
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle workflow state',
        variant: 'destructive'
      });
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'procurement': return <Package className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'documents': return <FileText className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'ai': return <Brain className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getEventDisplayName = (event: string) => {
    const eventNames: Record<string, string> = {
      'audit_completed': 'Audit Completed',
      'audit_approved': 'Audit Approved',
      'low_stock_detected': 'Low Stock Detected',
      'quote_received': 'Quote Received',
      'payment_required': 'Payment Required',
      'maintenance_due': 'Maintenance Due',
      'compliance_gap': 'Compliance Gap Found'
    };
    return eventNames[event] || event;
  };

  const predefinedWorkflows = [
    {
      name: 'Auto-Generate Procurement Tasks',
      description: 'Automatically create procurement tasks when audits identify supply needs',
      trigger: { event: 'audit_completed', conditions: { hasSupplyNeeds: true } },
      actions: [
        { type: 'create_task', module: 'procurement', config: { priority: 'medium' } }
      ]
    },
    {
      name: 'Send Reports to Suppliers',
      description: 'Automatically email audit reports to relevant suppliers',
      trigger: { event: 'audit_completed', conditions: { status: 'completed' } },
      actions: [
        { type: 'send_email', module: 'email', config: { template: 'audit_report' } }
      ]
    },
    {
      name: 'Process Quote Approvals',
      description: 'Auto-approve quotes below threshold and route others for approval',
      trigger: { event: 'quote_received', conditions: {} },
      actions: [
        { type: 'approve_quote', module: 'finance', config: { threshold: config.finance.autoApprovalThreshold } }
      ]
    },
    {
      name: 'Update Inventory Levels',
      description: 'Automatically update inventory quantities based on audit findings',
      trigger: { event: 'audit_completed', conditions: { hasInventoryUpdates: true } },
      actions: [
        { type: 'update_inventory', module: 'inventory', config: { autoReorder: config.inventory.reorderTrigger } }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Workflow Automation
          </h2>
          <p className="text-muted-foreground">
            Automate cross-module workflows based on audit events and conditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {workflows.filter(w => w.enabled).length} active
          </Badge>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automation Workflow</DialogTitle>
                <DialogDescription>
                  Set up automated actions that trigger based on audit events
                </DialogDescription>
              </DialogHeader>
              <WorkflowEditor
                workflow={null}
                onSave={createWorkflow}
                onCancel={() => setShowCreateDialog(false)}
                predefinedWorkflows={predefinedWorkflows}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Predefined Workflow Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Setup Templates</CardTitle>
          <CardDescription>
            Common workflow patterns for audit automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedWorkflows.map((template, index) => (
              <Card key={index} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getEventDisplayName(template.trigger.event)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createWorkflow({
                          ...template,
                          enabled: true
                        })}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Workflows */}
      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className={workflow.enabled ? 'border-primary/20' : 'border-muted'}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${workflow.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Zap className={`h-4 w-4 ${workflow.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={workflow.enabled ? "default" : "secondary"}>
                    {workflow.enabled ? "Active" : "Inactive"}
                  </Badge>
                  <Switch
                    checked={workflow.enabled}
                    onCheckedChange={(checked) => toggleWorkflow(workflow.id, checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Trigger */}
                <div>
                  <Label className="text-sm font-medium">Trigger Event</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {getEventDisplayName(workflow.trigger.event)}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <Label className="text-sm font-medium">Actions ({workflow.actions.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {workflow.actions.map((action, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {getModuleIcon(action.module)}
                        {action.type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {workflow.execution_count} executions
                    </div>
                    {workflow.last_executed && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last: {new Date(workflow.last_executed).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Workflow</DialogTitle>
                          <DialogDescription>
                            Modify the workflow automation rule
                          </DialogDescription>
                        </DialogHeader>
                        <WorkflowEditor
                          workflow={workflow}
                          onSave={(updates) => updateWorkflow(workflow.id, updates)}
                          onCancel={() => setEditingWorkflow(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Workflows Configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Set up automated workflows to streamline your audit processes across modules
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Workflow Editor Component
interface WorkflowEditorProps {
  workflow: WorkflowRule | null;
  onSave: (workflow: Partial<WorkflowRule>) => void;
  onCancel: () => void;
  predefinedWorkflows?: any[];
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ 
  workflow, 
  onSave, 
  onCancel, 
  predefinedWorkflows = [] 
}) => {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    trigger: {
      event: workflow?.trigger.event || 'audit_completed',
      conditions: workflow?.trigger.conditions || {}
    },
    actions: workflow?.actions || [],
    enabled: workflow?.enabled ?? true
  });

  const availableEvents = [
    'audit_completed',
    'audit_approved',
    'low_stock_detected',
    'quote_received',
    'payment_required',
    'maintenance_due',
    'compliance_gap'
  ];

  const availableModules = [
    'procurement',
    'finance', 
    'documents',
    'inventory',
    'email',
    'ai'
  ];

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        { type: 'send_notification', module: 'email', config: {} }
      ]
    });
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Workflow Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter workflow name"
          />
        </div>
        <div className="space-y-2">
          <Label>Trigger Event</Label>
          <Select
            value={formData.trigger.event}
            onValueChange={(value) => 
              setFormData({
                ...formData,
                trigger: { ...formData.trigger, event: value }
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableEvents.map(event => (
                <SelectItem key={event} value={event}>
                  {event.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this workflow does"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Actions</Label>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="h-4 w-4 mr-1" />
            Add Action
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.actions.map((action, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
              <Select
                value={action.module}
                onValueChange={(value) => updateAction(index, 'module', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModules.map(module => (
                    <SelectItem key={module} value={module}>
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                value={action.type}
                onChange={(e) => updateAction(index, 'type', e.target.value)}
                placeholder="Action type (e.g., send_email, create_task)"
                className="flex-1"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeAction(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
        <Label>Enable workflow immediately</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)}>
          {workflow ? 'Update' : 'Create'} Workflow
        </Button>
      </div>
    </div>
  );
};

export default WorkflowAutomation;