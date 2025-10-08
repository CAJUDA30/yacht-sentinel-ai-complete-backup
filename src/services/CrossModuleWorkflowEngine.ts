import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from "./YachtieIntegrationService";
import { universalEventBus } from "./UniversalEventBus";

interface WorkflowTrigger {
  id: string;
  module: string;
  event: string;
  conditions: Record<string, any>;
  actions: WorkflowAction[];
  priority: number;
  isActive: boolean;
}

interface WorkflowAction {
  type: 'create' | 'update' | 'notify' | 'ai_process' | 'schedule';
  targetModule: string;
  params: Record<string, any>;
  delay?: number;
}

interface WorkflowExecution {
  id: string;
  triggerId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  results: Record<string, any>;
  errors?: string[];
}

class CrossModuleWorkflowEngine {
  private workflows = new Map<string, WorkflowTrigger>();
  private executions = new Map<string, WorkflowExecution>();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Load workflows from database
    await this.loadWorkflows();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Register default workflows
    await this.registerDefaultWorkflows();
    
    this.isInitialized = true;
    console.log('CrossModuleWorkflowEngine initialized');
  }

  private async loadWorkflows(): Promise<void> {
    try {
      const { data: workflows } = await supabase
        .from('audit_workflows')
        .select('*')
        .eq('is_active', true);

      workflows?.forEach(workflow => {
        this.workflows.set(workflow.id, {
          id: workflow.id,
          module: 'audit',
          event: workflow.workflow_type,
          conditions: (workflow.conditions as any) || {},
          actions: (workflow.steps as any) || [],
          priority: 50,
          isActive: true
        });
      });
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen to all module events
    universalEventBus.subscribe('*', async (event) => {
      await this.processEvent(event);
    });
  }

  private async registerDefaultWorkflows(): Promise<void> {
    const defaultWorkflows: WorkflowTrigger[] = [
      {
        id: 'equipment-failure-response',
        module: 'equipment',
        event: 'failure_detected',
        conditions: { severity: ['high', 'critical'] },
        actions: [
          {
            type: 'create',
            targetModule: 'maintenance',
            params: { priority: 'urgent', type: 'emergency_repair' }
          },
          {
            type: 'notify',
            targetModule: 'crew',
            params: { type: 'emergency_alert', channel: 'immediate' }
          },
          {
            type: 'ai_process',
            targetModule: 'ai',
            params: { task: 'generate_repair_plan', context: 'emergency' }
          }
        ],
        priority: 100,
        isActive: true
      },
      {
        id: 'inventory-low-stock',
        module: 'inventory',
        event: 'stock_below_threshold',
        conditions: { criticality: ['high', 'medium'] },
        actions: [
          {
            type: 'create',
            targetModule: 'procurement',
            params: { priority: 'auto', type: 'restock_order' }
          },
          {
            type: 'ai_process',
            targetModule: 'ai',
            params: { task: 'optimize_procurement', analysis: 'usage_patterns' }
          }
        ],
        priority: 75,
        isActive: true
      },
      {
        id: 'maintenance-completion',
        module: 'maintenance',
        event: 'task_completed',
        conditions: { affects_other_modules: true },
        actions: [
          {
            type: 'update',
            targetModule: 'equipment',
            params: { status: 'operational', last_maintenance: 'now' }
          },
          {
            type: 'create',
            targetModule: 'audit',
            params: { type: 'compliance_check', trigger: 'maintenance_completion' }
          }
        ],
        priority: 60,
        isActive: true
      }
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  private async processEvent(event: any): Promise<void> {
    const relevantWorkflows = Array.from(this.workflows.values())
      .filter(workflow => 
        workflow.isActive &&
        (workflow.module === event.module || workflow.module === '*') &&
        (workflow.event === event.type || workflow.event === '*') &&
        this.matchesConditions(event, workflow.conditions)
      )
      .sort((a, b) => b.priority - a.priority);

    for (const workflow of relevantWorkflows) {
      try {
        await this.executeWorkflow(workflow, event);
      } catch (error) {
        console.error(`Workflow execution failed for ${workflow.id}:`, error);
      }
    }
  }

  private matchesConditions(event: any, conditions: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const eventValue = event.payload?.[key] || event[key];
      
      if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(eventValue)) return false;
      } else if (expectedValue !== eventValue) {
        return false;
      }
    }
    return true;
  }

  private async executeWorkflow(workflow: WorkflowTrigger, triggerEvent: any): Promise<void> {
    const executionId = `exec_${workflow.id}_${Date.now()}`;
    const execution: WorkflowExecution = {
      id: executionId,
      triggerId: workflow.id,
      status: 'running',
      startedAt: new Date(),
      results: {}
    };

    this.executions.set(executionId, execution);

    try {
      for (const action of workflow.actions) {
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        const result = await this.executeAction(action, triggerEvent);
        execution.results[action.type] = result;
      }

      execution.status = 'completed';
      execution.completedAt = new Date();

      // Log successful execution
      await this.logExecution(execution, workflow);

    } catch (error) {
      execution.status = 'failed';
      execution.errors = [error instanceof Error ? error.message : String(error)];
      console.error(`Workflow execution failed:`, error);
    }
  }

  private async executeAction(action: WorkflowAction, triggerEvent: any): Promise<any> {
    switch (action.type) {
      case 'create':
        return await this.createRecord(action, triggerEvent);
      
      case 'update':
        return await this.updateRecord(action, triggerEvent);
      
      case 'notify':
        return await this.sendNotification(action, triggerEvent);
      
      case 'ai_process':
        return await this.processWithAI(action, triggerEvent);
      
      case 'schedule':
        return await this.scheduleTask(action, triggerEvent);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async createRecord(action: WorkflowAction, triggerEvent: any): Promise<any> {
    const tableMap: Record<string, string> = {
      'maintenance': 'maintenance_schedules',
      'procurement': 'automated_procurement_requests',
      'audit': 'audit_instances',
      'inventory': 'inventory_items'
    };

    const table = tableMap[action.targetModule];
    if (!table) throw new Error(`Unknown target module: ${action.targetModule}`);

    const record = {
      ...action.params,
      created_by: triggerEvent.user_id,
      metadata: {
        workflow_generated: true,
        trigger_event: triggerEvent.type,
        source_module: triggerEvent.module
      }
    };

    const { data, error } = await (supabase as any).from(table).insert(record).select().single();
    if (error) throw error;

    return data;
  }

  private async updateRecord(action: WorkflowAction, triggerEvent: any): Promise<any> {
    // Implementation for updating records
    const updates = {
      ...action.params,
      updated_at: new Date().toISOString(),
      updated_by: triggerEvent.user_id
    };

    // This would need specific logic based on the target module
    return updates;
  }

  private async sendNotification(action: WorkflowAction, triggerEvent: any): Promise<any> {
    const notification = {
      type: action.params.type,
      title: `Workflow Notification: ${triggerEvent.type}`,
      message: `Automated action from ${triggerEvent.module} module`,
      priority: action.params.priority || 'medium',
      channel: action.params.channel || 'app',
      metadata: {
        workflow_generated: true,
        source_event: triggerEvent.type
      }
    };

    // Emit notification event
    universalEventBus.emit('notification', 'system', notification);

    return notification;
  }

  private async processWithAI(action: WorkflowAction, triggerEvent: any): Promise<any> {
    try {
      const aiRequest = {
        text: `Process workflow action: ${action.params.task}`,
        task: action.params.task,
        context: JSON.stringify({
          ...action.params,
          trigger_event: triggerEvent,
          timestamp: new Date().toISOString()
        })
      };

      const response = await yachtieService.process(aiRequest);
      return response;
    } catch (error) {
      console.error('AI processing failed:', error);
      throw error;
    }
  }

  private async scheduleTask(action: WorkflowAction, triggerEvent: any): Promise<any> {
    const task = {
      action: action.params.action,
      scheduled_for: new Date(Date.now() + (action.delay || 0)),
      params: action.params,
      created_by: triggerEvent.user_id
    };

    // This would integrate with a task scheduler
    return task;
  }

  private async logExecution(execution: WorkflowExecution, workflow: WorkflowTrigger): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'workflow_executed',
        module: 'workflows',
        event_message: `Workflow ${workflow.id} executed successfully`,
        severity: 'info',
        metadata: {
          workflow_id: workflow.id,
          execution_id: execution.id,
          duration_ms: execution.completedAt && execution.startedAt 
            ? execution.completedAt.getTime() - execution.startedAt.getTime()
            : null,
          results: execution.results
        }
      });
    } catch (error) {
      console.error('Failed to log workflow execution:', error);
    }
  }

  // Public API methods
  async registerWorkflow(workflow: WorkflowTrigger): Promise<void> {
    this.workflows.set(workflow.id, workflow);
    
    // Persist to database if needed
    console.log(`Registered workflow: ${workflow.id}`);
  }

  async getActiveWorkflows(): Promise<WorkflowTrigger[]> {
    return Array.from(this.workflows.values()).filter(w => w.isActive);
  }

  async getExecutionHistory(limit: number = 50): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  async triggerWorkflow(workflowId: string, eventData: any): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

    await this.executeWorkflow(workflow, eventData);
  }
}

export const crossModuleWorkflowEngine = new CrossModuleWorkflowEngine();