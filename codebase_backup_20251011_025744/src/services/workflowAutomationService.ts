import { supabase } from '@/integrations/supabase/client';
import { enhancedCrossModuleIntegration } from './enhancedCrossModuleIntegration';

export interface WorkflowTrigger {
  id: string;
  name: string;
  module: string;
  event_type: string;
  conditions: any;
  actions: WorkflowAction[];
  is_active: boolean;
  priority: number;
}

export interface WorkflowAction {
  type: 'create_job' | 'update_inventory' | 'send_notification' | 'create_transaction' | 'assign_crew' | 'schedule_maintenance';
  target_module: string;
  parameters: any;
  delay_minutes?: number;
}

export interface WorkflowExecution {
  id: string;
  trigger_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  results: any;
  error_message?: string;
  metadata?: any;
}

class WorkflowAutomationService {
  // Pre-defined workflow templates using analytics events for tracking
  async createEquipmentFailureWorkflow(): Promise<string> {
    console.log('Creating Equipment Failure Workflow...');
    
    // Log workflow creation
    const { data, error } = await supabase.from('analytics_events').insert({
      event_type: 'workflow_created',
      event_message: 'Equipment Failure Response workflow initialized',
      module: 'workflow_automation',
      severity: 'info',
      metadata: {
        workflow_type: 'equipment_failure',
        triggers: ['equipment_status_critical', 'equipment_malfunction'],
        actions: ['create_repair_job', 'assign_crew', 'notify_management'],
        automated: true
      }
    }).select('id').single();

    if (error) throw error;
    return data.id;
  }

  async createLowInventoryWorkflow(): Promise<string> {
    console.log('Creating Low Inventory Workflow...');
    
    const { data, error } = await supabase.from('analytics_events').insert({
      event_type: 'workflow_created',
      event_message: 'Low Inventory Auto-Procurement workflow initialized',
      module: 'workflow_automation',
      severity: 'info',
      metadata: {
        workflow_type: 'low_inventory',
        triggers: ['inventory_low_stock', 'critical_part_shortage'],
        actions: ['create_procurement_request', 'financial_pre_approval', 'supplier_notification'],
        automated: true
      }
    }).select('id').single();

    if (error) throw error;
    return data.id;
  }

  async createRepairCompletionWorkflow(): Promise<string> {
    console.log('Creating Repair Completion Workflow...');
    
    const { data, error } = await supabase.from('analytics_events').insert({
      event_type: 'workflow_created',
      event_message: 'Repair Completion Follow-up workflow initialized',
      module: 'workflow_automation',
      severity: 'info',
      metadata: {
        workflow_type: 'repair_completion',
        triggers: ['repair_job_completed', 'equipment_restored'],
        actions: ['update_inventory', 'financial_reconciliation', 'schedule_followup'],
        automated: true
      }
    }).select('id').single();

    if (error) throw error;
    return data.id;
  }

  // Execute equipment failure workflow
  async executeEquipmentFailureWorkflow(jobData: any): Promise<void> {
    console.log('Executing Equipment Failure Workflow for job:', jobData.id);

    try {
      // Step 1: Create critical alert
      await supabase.from('analytics_events').insert({
        event_type: 'critical_failure_alert',
        event_message: `Critical Equipment Failure: ${jobData.name || 'Unknown Equipment'}`,
        module: 'equipment',
        severity: 'error',
        metadata: {
          job_id: jobData.id,
          equipment_id: jobData.equipment_id,
          failure_type: jobData.job_type_specific,
          automated: true
        }
      });

      // Step 2: Log finance event if equipment replacement needed
      if (jobData.estimated_cost && jobData.estimated_cost > 5000) {
        await supabase.from('analytics_events').insert({
          event_type: 'finance_transaction_needed',
          event_message: `Equipment failure requires finance transaction - $${jobData.estimated_cost}`,
          module: 'finance',
          severity: 'warn',
          metadata: {
            amount: jobData.estimated_cost,
            type: 'expense',
            category: 'equipment_replacement',
            reference: `Equipment failure repair - Job #${jobData.id}`,
            automated: true
          }
        });
      }

      // Step 3: Log crew assignment event
      await supabase.from('analytics_events').insert({
        event_type: 'crew_assignment',
        event_message: 'Auto-assigned maintenance crew for equipment failure',
        module: 'crew',
        severity: 'info',
        metadata: {
          job_id: jobData.id,
          crew_member_id: 'auto_assigned_maintenance_lead',
          role: 'lead_technician',
          automated: true
        }
      });

      console.log('Equipment failure workflow executed successfully');
    } catch (error) {
      console.error('Error executing equipment failure workflow:', error);
      throw error;
    }
  }

  // Execute low inventory workflow
  async executeLowInventoryWorkflow(inventoryData: any): Promise<void> {
    console.log('Executing Low Inventory Workflow for item:', inventoryData.id);

    try {
      // Log inventory alert
      await supabase.from('analytics_events').insert({
        event_type: 'inventory_low_stock_alert',
        event_message: `Low inventory alert: ${inventoryData.name}`,
        module: 'inventory',
        severity: 'warn',
        metadata: {
          item_id: inventoryData.id,
          current_stock: inventoryData.quantity,
          minimum_threshold: inventoryData.min_stock,
          automated: true
        }
      });

      // Create automated procurement request if table exists
      try {
        await supabase.from('automated_procurement_requests').insert({
          part_name: inventoryData.name,
          part_number: inventoryData.part_number || `AUTO-${inventoryData.id}`,
          quantity_needed: Math.max(inventoryData.min_stock * 2, 10),
          current_stock: inventoryData.quantity,
          minimum_threshold: inventoryData.min_stock,
          urgency: inventoryData.quantity === 0 ? 'critical' : 'high',
          notes: 'Automatically generated due to low stock levels - Workflow Automation'
        });
      } catch (procurementError) {
        console.log('Automated procurement table not available, logging event instead');
        await supabase.from('analytics_events').insert({
          event_type: 'procurement_request_needed',
          event_message: `Procurement request needed for ${inventoryData.name}`,
          module: 'procurement',
          severity: 'warn',
          metadata: {
            item_id: inventoryData.id,
            quantity_needed: Math.max(inventoryData.min_stock * 2, 10),
            automated: true
          }
        });
      }

      console.log('Low inventory workflow executed successfully');
    } catch (error) {
      console.error('Error executing low inventory workflow:', error);
      throw error;
    }
  }

  // Execute repair completion workflow
  async executeRepairCompletionWorkflow(jobData: any): Promise<void> {
    console.log('Executing Repair Completion Workflow for job:', jobData.id);

    try {
      // Log completion event
      await supabase.from('analytics_events').insert({
        event_type: 'repair_completion',
        event_message: `Repair job completed: ${jobData.name}`,
        module: 'claims_repairs',
        severity: 'info',
        metadata: {
          job_id: jobData.id,
          completion_date: new Date().toISOString(),
          final_cost: jobData.actual_cost || jobData.estimated_cost,
          automated: true
        }
      });

      // Trigger cross-module integration
      if (enhancedCrossModuleIntegration && enhancedCrossModuleIntegration.performFullIntegration) {
        await enhancedCrossModuleIntegration.performFullIntegration(jobData.id);
      }

      console.log('Repair completion workflow executed successfully');
    } catch (error) {
      console.error('Error executing repair completion workflow:', error);
      throw error;
    }
  }

  // Get workflow executions (simulated using analytics events)
  async getWorkflowExecutions(): Promise<WorkflowExecution[]> {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .in('event_type', ['workflow_created', 'critical_failure_alert', 'inventory_low_stock_alert', 'repair_completion'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching workflow executions:', error);
      return [];
    }

    // Transform analytics events to workflow executions
    const executions: WorkflowExecution[] = data?.map(event => {
      const metadata = event.metadata as any || {};
      return {
        id: event.id,
        trigger_id: metadata.trigger_id || 'auto-trigger',
        status: event.severity === 'error' ? 'failed' : 'completed',
        started_at: event.created_at,
        completed_at: event.created_at,
        results: metadata,
        error_message: event.severity === 'error' ? event.event_message : undefined,
        metadata: {
          workflow_name: metadata.workflow_type ? 
            `${metadata.workflow_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Workflow` :
            'Automated Workflow',
          event_type: event.event_type,
          module: event.module,
          ...metadata
        }
      };
    }) || [];

    return executions.sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  // Process workflow trigger (main entry point)
  async processWorkflowTrigger(trigger: { event_type: string; module: string }, data: any): Promise<void> {
    console.log('Processing workflow trigger:', trigger.event_type, 'for module:', trigger.module);

    try {
      switch (trigger.event_type) {
        case 'equipment_failure':
          await this.executeEquipmentFailureWorkflow(data);
          break;
        
        case 'low_inventory':
          await this.executeLowInventoryWorkflow(data);
          break;
        
        case 'repair_completed':
          await this.executeRepairCompletionWorkflow(data);
          break;
        
        default:
          console.log('Unknown workflow trigger:', trigger.event_type);
      }
    } catch (error) {
      console.error('Error processing workflow trigger:', error);
      
      // Log workflow execution error
      await supabase.from('analytics_events').insert({
        event_type: 'workflow_execution_error',
        event_message: `Workflow execution failed: ${error}`,
        module: 'workflow_automation',
        severity: 'error',
        metadata: {
          trigger: trigger.event_type,
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }
}

export const workflowAutomationService = new WorkflowAutomationService();