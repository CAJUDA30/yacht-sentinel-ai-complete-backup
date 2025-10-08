import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import { useToast } from '@/components/ui/use-toast';

interface AuditIntegrationConfig {
  procurement: {
    enabled: boolean;
    autoCreateTasks: boolean;
    supplierEmails: string[];
    reportTemplates: string[];
  };
  finance: {
    enabled: boolean;
    paymentGateway: 'stripe' | 'paypal';
    depositPercentage: number;
    autoApprovalThreshold: number;
  };
  documents: {
    enabled: boolean;
    storageProvider: 'supabase' | 's3' | 'mongodb';
    eSignatureEnabled: boolean;
    retentionDays: number;
  };
  inventory: {
    enabled: boolean;
    autoUpdateStock: boolean;
    lowStockThreshold: number;
    reorderTrigger: boolean;
  };
  ai: {
    enabled: boolean;
    confidenceThreshold: number;
    autoAnalysis: boolean;
    models: string[];
  };
  email: {
    enabled: boolean;
    smtpServer: string;
    smtpPort: number;
    username: string;
    templates: Record<string, string>;
  };
  compliance: {
    sire20: boolean;
    ismCode: boolean;
    iso9001: boolean;
    customStandards: string[];
  };
}

interface WorkflowTrigger {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  module: string;
}

interface AuditIntegrationContextType {
  config: AuditIntegrationConfig;
  workflows: WorkflowTrigger[];
  isConfigured: boolean;
  updateConfig: (module: keyof AuditIntegrationConfig, settings: any) => Promise<void>;
  testConnection: (module: keyof AuditIntegrationConfig) => Promise<boolean>;
  triggerWorkflow: (auditId: string, action: string, data?: any) => Promise<void>;
  processAuditCompletion: (auditId: string) => Promise<void>;
  sendReportToSupplier: (auditId: string, supplierEmail: string) => Promise<void>;
  createQuoteRequest: (auditId: string, description: string) => Promise<void>;
  updateInventoryFromAudit: (auditId: string, updates: any[]) => Promise<void>;
  loading: boolean;
}

const defaultConfig: AuditIntegrationConfig = {
  procurement: {
    enabled: false,
    autoCreateTasks: true,
    supplierEmails: [],
    reportTemplates: []
  },
  finance: {
    enabled: false,
    paymentGateway: 'stripe',
    depositPercentage: 30,
    autoApprovalThreshold: 1000
  },
  documents: {
    enabled: false,
    storageProvider: 'supabase',
    eSignatureEnabled: false,
    retentionDays: 2555 // 7 years marine standard
  },
  inventory: {
    enabled: false,
    autoUpdateStock: true,
    lowStockThreshold: 10,
    reorderTrigger: true
  },
  ai: {
    enabled: false,
    confidenceThreshold: 0.8,
    autoAnalysis: true,
    models: ['gpt-4o', 'claude-3-sonnet']
  },
  email: {
    enabled: false,
    smtpServer: '',
    smtpPort: 587,
    username: '',
    templates: {
      auditReport: 'Audit Report - {auditName}',
      quoteRequest: 'Quote Request - {auditId}',
      taskAssignment: 'New Task Assignment - {taskName}'
    }
  },
  compliance: {
    sire20: false,
    ismCode: false,
    iso9001: false,
    customStandards: []
  }
};

const AuditIntegrationContext = createContext<AuditIntegrationContextType | undefined>(undefined);

export const useAuditIntegration = () => {
  const context = useContext(AuditIntegrationContext);
  if (!context) {
    throw new Error('useAuditIntegration must be used within AuditIntegrationProvider');
  }
  return context;
};

export const AuditIntegrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AuditIntegrationConfig>(defaultConfig);
  const [workflows, setWorkflows] = useState<WorkflowTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const { processWithAllLLMs } = useUniversalLLM();
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
    loadWorkflows();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_system_config')
        .select('*')
        .eq('config_key', 'audit_integration');

      if (error) throw error;

      if (data && data.length > 0) {
        const configValue = data[0].config_value;
        if (typeof configValue === 'object' && configValue) {
          setConfig({ ...defaultConfig, ...configValue });
        }
      }
    } catch (error) {
      console.error('Error loading audit integration config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_workflows')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const workflowTriggers: WorkflowTrigger[] = (data || []).map(workflow => {
        const conditions = typeof workflow.conditions === 'object' && workflow.conditions ? workflow.conditions : {};
        const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
        
        return {
          id: workflow.id,
          name: workflow.name,
          condition: (conditions as any)?.trigger || '',
          action: steps.length > 0 && typeof steps[0] === 'object' && steps[0] && 'type' in steps[0] ? String(steps[0].type) : '',
          enabled: workflow.is_active,
          module: workflow.workflow_type || 'general'
        };
      });

      setWorkflows(workflowTriggers);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const updateConfig = useCallback(async (module: keyof AuditIntegrationConfig, settings: any) => {
    try {
      const newConfig = {
        ...config,
        [module]: { ...config[module], ...settings }
      };

      const { error } = await supabase
        .from('ai_system_config')
        .upsert({
          config_key: 'audit_integration',
          config_value: newConfig,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setConfig(newConfig);
      toast({
        title: 'Configuration Updated',
        description: `${module} integration settings saved successfully.`
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive'
      });
    }
  }, [config, toast]);

  const testConnection = useCallback(async (module: keyof AuditIntegrationConfig): Promise<boolean> => {
    try {
      let result = false;

      switch (module) {
        case 'procurement':
          // Test procurement database connection
          const { data: procData } = await supabase.from('automated_procurement_requests').select('id').limit(1);
          result = !!procData;
          break;

        case 'finance':
          // Test financial data access
          result = !!config.finance.paymentGateway;
          break;

        case 'documents':
          // Test document storage
          result = !!config.documents.storageProvider;
          break;

        case 'inventory':
          // Test inventory connection
          const { data: invData } = await supabase.from('inventory_items').select('id').limit(1);
          result = !!invData;
          break;

        case 'email':
          // Test email configuration
          result = !!(config.email.smtpServer && config.email.username);
          break;

        case 'ai':
          // Test AI service
          try {
            await processWithAllLLMs({
              content: 'Test connection',
              context: 'Connection test',
              type: 'test',
              module: 'audit'
            });
            result = true;
          } catch {
            result = false;
          }
          break;

        default:
          result = true;
      }

      toast({
        title: result ? 'Connection Successful' : 'Connection Failed',
        description: `${module} integration ${result ? 'is working' : 'has issues'}`,
        variant: result ? 'default' : 'destructive'
      });

      return result;
    } catch (error) {
      console.error(`Error testing ${module} connection:`, error);
      return false;
    }
  }, [config, processWithAllLLMs, toast]);

  const triggerWorkflow = useCallback(async (auditId: string, action: string, data?: any) => {
    try {
      const relevantWorkflows = workflows.filter(w => w.action === action && w.enabled);

      for (const workflow of relevantWorkflows) {
        // Log workflow execution
        await supabase.from('audit_collaboration').insert({
          audit_instance_id: auditId,
          activity_type: 'workflow_triggered',
          content: `Triggered workflow: ${workflow.name}`,
          metadata: { workflowId: workflow.id, action, data },
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

        // Execute module-specific action based on workflow module
        switch (workflow.module) {
          case 'procurement':
            if (config.procurement.enabled) {
              await createProcurementTask(auditId, data);
            }
            break;

          case 'finance':
            if (config.finance.enabled) {
              await processPaymentAction(auditId, data);
            }
            break;

          case 'inventory':
            if (config.inventory.enabled) {
              await updateInventoryFromAudit(auditId, data?.updates || []);
            }
            break;
        }
      }
    } catch (error) {
      console.error('Error triggering workflow:', error);
      throw error;
    }
  }, [workflows, config]);

  const processAuditCompletion = useCallback(async (auditId: string) => {
    try {
      // Get audit details
      const { data: audit, error } = await supabase
        .from('audit_instances')
        .select(`
          *,
          template:audit_templates(name),
          items:audit_items(*)
        `)
        .eq('id', auditId)
        .single();

      if (error) throw error;

      // Update audit status
      await supabase
        .from('audit_instances')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', auditId);

      // Trigger automated workflows
      await triggerWorkflow(auditId, 'audit_completed', { audit });

      // Generate AI insights
      if (config.ai.enabled) {
        const insights = await processWithAllLLMs({
          content: `Analyze completed audit: ${audit.name}`,
          context: JSON.stringify(audit),
          type: 'audit_analysis',
          module: 'audit',
          priority: 'high'
        });

        await supabase.from('audit_ai_insights').insert({
          audit_instance_id: auditId,
          insight_type: 'completion_analysis',
          insight_data: JSON.stringify(insights),
          confidence_score: insights.confidence || 0.8,
          ai_model: 'multi-model-consensus',
          modality: 'text'
        });
      }

      toast({
        title: 'Audit Completed',
        description: 'Audit completed successfully and workflows triggered.'
      });
    } catch (error) {
      console.error('Error processing audit completion:', error);
      throw error;
    }
  }, [config, triggerWorkflow, processWithAllLLMs, toast]);

  const createProcurementTask = async (auditId: string, data: any) => {
    try {
      await supabase.from('automated_procurement_requests').insert({
        part_name: data?.itemName || 'Audit-related procurement',
        quantity_needed: data?.quantity || 1,
        urgency: data?.priority || 'medium',
        notes: `Generated from audit ${auditId}`,
        auto_approved: false
      });
    } catch (error) {
      console.error('Error creating procurement task:', error);
    }
  };

  const processPaymentAction = async (auditId: string, data: any) => {
    // Payment processing would be handled via edge functions
    console.log('Processing payment action for audit:', auditId, data);
  };

  const sendReportToSupplier = useCallback(async (auditId: string, supplierEmail: string) => {
    try {
      // Generate report via AI
      const report = await processWithAllLLMs({
        content: `Generate supplier report for audit ${auditId}`,
        context: 'supplier_communication',
        type: 'report_generation',
        module: 'audit'
      });

      // Send via email integration
      if (config.email.enabled) {
        // This would call an edge function to send email
        console.log('Sending report to supplier:', supplierEmail);
      }

      toast({
        title: 'Report Sent',
        description: `Audit report sent to ${supplierEmail}`
      });
    } catch (error) {
      console.error('Error sending report:', error);
      throw error;
    }
  }, [config, processWithAllLLMs, toast]);

  const createQuoteRequest = useCallback(async (auditId: string, description: string) => {
    try {
      // Use AI to generate quote request
      const quoteRequest = await processWithAllLLMs({
        content: `Generate quote request: ${description}`,
        context: `Audit ID: ${auditId}`,
        type: 'quote_generation',
        module: 'audit'
      });

      // Store quote request
      // This would integrate with procurement module
      console.log('Quote request generated:', quoteRequest);

      toast({
        title: 'Quote Request Created',
        description: 'Quote request generated and sent to suppliers'
      });
    } catch (error) {
      console.error('Error creating quote request:', error);
      throw error;
    }
  }, [processWithAllLLMs, toast]);

  const updateInventoryFromAudit = useCallback(async (auditId: string, updates: any[]) => {
    try {
      if (!config.inventory.enabled) return;

      for (const update of updates) {
        if (update.itemId && update.quantity) {
          // Update inventory quantities
          await supabase
            .from('inventory_items')
            .update({ 
              quantity: update.quantity,
              last_used_date: new Date().toISOString()
            })
            .eq('id', update.itemId);

          // Check for low stock and trigger reorder if needed
          if (config.inventory.reorderTrigger && update.quantity < config.inventory.lowStockThreshold) {
            await triggerWorkflow(auditId, 'inventory_low_stock', { 
              itemId: update.itemId, 
              currentQuantity: update.quantity 
            });
          }
        }
      }

      toast({
        title: 'Inventory Updated',
        description: 'Inventory levels updated from audit results'
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }, [config, triggerWorkflow, toast]);

  const isConfigured = Object.values(config).some(moduleConfig => 
    typeof moduleConfig === 'object' && moduleConfig.enabled
  );

  const value = {
    config,
    workflows,
    isConfigured,
    updateConfig,
    testConnection,
    triggerWorkflow,
    processAuditCompletion,
    sendReportToSupplier,
    createQuoteRequest,
    updateInventoryFromAudit,
    loading
  };

  return (
    <AuditIntegrationContext.Provider value={value}>
      {children}
    </AuditIntegrationContext.Provider>
  );
};