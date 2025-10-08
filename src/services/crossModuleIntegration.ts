import { supabase } from '@/integrations/supabase/client';

export interface CrossModuleRelationship {
  id: string;
  primary_module: string;
  primary_record_id: string;
  related_module: string;
  related_record_id: string;
  relationship_type: 'depends_on' | 'triggers' | 'references' | 'consumes';
  metadata: Record<string, any>;
  created_at: string;
  is_active: boolean;
}

export interface FinanceTransaction {
  id: string;
  reference_id: string;
  reference_type: string;
  transaction_type: 'expense' | 'invoice' | 'payment' | 'refund';
  amount: number;
  currency: string;
  description?: string;
  supplier_contractor_id?: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  due_date?: string;
  paid_date?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface ComplianceRequirement {
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

export interface IntegratedJobData {
  job: any;
  related_equipment?: any[];
  related_inventory?: any[];
  maintenance_schedules?: any[];
  finance_transactions?: FinanceTransaction[];
  compliance_requirements?: ComplianceRequirement[];
  cross_module_relationships?: CrossModuleRelationship[];
}

class CrossModuleIntegrationService {
  
  /**
   * Get comprehensive job data with all cross-module relationships
   */
  async getIntegratedJobData(jobId: string): Promise<IntegratedJobData | null> {
    
    // Get base job data
    const { data: job, error: jobError } = await supabase
      .from('audit_instances')
      .select(`
        *,
        yacht_profiles!yacht_id(*)
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Error fetching job:', jobError);
      return null;
    }

    // Get cross-module relationships
    const { data: relationships } = await supabase
      .from('cross_module_integrations')
      .select('*')
      .or(`primary_record_id.eq.${jobId},related_record_id.eq.${jobId}`)
      .eq('is_active', true);

    // Get related equipment if linked
    let related_equipment = [];
    if (job.equipment_id) {
      const { data: equipment } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', job.equipment_id);
      related_equipment = equipment || [];
    }

    // Get related inventory items
    let related_inventory = [];
    if (job.inventory_item_id) {
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', job.inventory_item_id);
      related_inventory = inventory || [];
    }

    // Get maintenance schedules
    let maintenance_schedules = [];
    if (job.maintenance_schedule_id) {
      const { data: schedules } = await supabase
        .from('maintenance_schedules')
        .select(`
          *,
          equipment(*)
        `)
        .eq('id', job.maintenance_schedule_id);
      maintenance_schedules = schedules || [];
    }

    // Get finance transactions
    const { data: finance_transactions } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('reference_id', jobId)
      .eq('reference_type', 'claims_repair');

    // Get applicable compliance requirements
    const { data: compliance_requirements } = await supabase
      .from('compliance_requirements')
      .select('*')
      .contains('applicable_modules', ['claims_repairs'])
      .eq('is_active', true);

    return {
      job,
      related_equipment,
      related_inventory,
      maintenance_schedules,
      finance_transactions: (finance_transactions || []) as FinanceTransaction[],
      compliance_requirements: (compliance_requirements || []) as ComplianceRequirement[],
      cross_module_relationships: (relationships || []) as CrossModuleRelationship[]
    };
  }

  /**
   * Create cross-module relationship
   */
  async createRelationship(
    primaryModule: string,
    primaryRecordId: string,
    relatedModule: string,
    relatedRecordId: string,
    relationshipType: CrossModuleRelationship['relationship_type'],
    metadata: Record<string, any> = {}
  ): Promise<CrossModuleRelationship | null> {
    
    const { data, error } = await supabase
      .from('cross_module_integrations')
      .insert({
        primary_module: primaryModule,
        primary_record_id: primaryRecordId,
        related_module: relatedModule,
        related_record_id: relatedRecordId,
        relationship_type: relationshipType,
        metadata,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating relationship:', error);
      return null;
    }

    return data as CrossModuleRelationship;
  }

  /**
   * Create finance transaction for a job
   */
  async createFinanceTransaction(
    referenceId: string,
    referenceType: string,
    transactionType: FinanceTransaction['transaction_type'],
    amount: number,
    currency: string,
    description?: string,
    supplierContractorId?: string,
    dueDate?: string
  ): Promise<FinanceTransaction | null> {
    
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({
        reference_id: referenceId,
        reference_type: referenceType,
        transaction_type: transactionType,
        amount,
        currency,
        description,
        supplier_contractor_id: supplierContractorId,
        status: 'pending',
        due_date: dueDate
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating finance transaction:', error);
      return null;
    }

    return data as FinanceTransaction;
  }

  /**
   * Get equipment maintenance history for claims/repairs context
   */
  async getEquipmentMaintenanceContext(equipmentId: string): Promise<any> {
    const { data: equipment } = await supabase
      .from('equipment')
      .select(`
        *,
        maintenance_schedules(*)
      `)
      .eq('id', equipmentId)
      .single();

    // Get related audit instances for this equipment
    const { data: relatedJobs } = await supabase
      .from('audit_instances')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get procurement requests for this equipment
    const { data: procurementRequests } = await supabase
      .from('automated_procurement_requests')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      equipment,
      recent_jobs: relatedJobs || [],
      procurement_requests: procurementRequests || []
    };
  }

  /**
   * Get inventory usage context for jobs
   */
  async getInventoryUsageContext(inventoryItemId: string): Promise<any> {
    const { data: item } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .single();

    // Get related jobs that used this inventory item
    const { data: relatedJobs } = await supabase
      .from('audit_instances')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      item,
      usage_history: relatedJobs || [],
      current_stock: item?.quantity || 0,
      low_stock_alert: (item?.quantity || 0) <= (item?.min_stock || 0)
    };
  }

  /**
   * Get compliance status for a job
   */
  async getComplianceStatus(jobId: string, jobType: string): Promise<any> {
    // Get applicable compliance requirements
    const { data: requirements } = await supabase
      .from('compliance_requirements')
      .select('*')
      .contains('applicable_modules', ['claims_repairs'])
      .eq('is_active', true);

    // Check existing compliance records for this job
    const complianceChecks = requirements?.map(req => ({
      requirement: req,
      status: 'pending', // This would typically be calculated based on job data
      last_checked: null,
      compliant: null
    })) || [];

    return {
      total_requirements: requirements?.length || 0,
      pending_checks: complianceChecks.filter(c => c.status === 'pending').length,
      compliance_score: 0, // Would be calculated based on completed checks
      requirements: complianceChecks
    };
  }

  /**
   * Auto-link related records based on common attributes
   */
  async autoLinkRelatedRecords(jobId: string, jobData: any): Promise<void> {
    // Auto-link equipment based on warranty claims
    if (jobData.job_type === 'warranty_claim' && jobData.description) {
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id, name, model_number, serial_number')
        .or(`name.ilike.%${jobData.description.split(' ')[0]}%,model_number.ilike.%${jobData.description.split(' ')[0]}%`);

      if (equipment && equipment.length > 0) {
        // Create relationship with first matching equipment
        await this.createRelationship(
          'claims_repairs',
          jobId,
          'equipment',
          equipment[0].id,
          'references',
          { auto_linked: true, match_criteria: 'description_match' }
        );
      }
    }

    // Auto-link inventory based on repair type
    if (jobData.job_type === 'repair') {
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('id, name, part_number')
        .eq('quantity', 0) // Items that might need restocking for repair
        .limit(5);

      if (inventory && inventory.length > 0) {
        // Create relationships with low-stock items that might be needed
        for (const item of inventory) {
          await this.createRelationship(
            'claims_repairs',
            jobId,
            'inventory',
            item.id,
            'consumes',
            { auto_linked: true, reason: 'potential_repair_requirement' }
          );
        }
      }
    }
  }

  /**
   * Generate cross-module insights and suggestions
   */
  async generateInsights(jobId: string): Promise<any> {
    const integratedData = await this.getIntegratedJobData(jobId);
    if (!integratedData) return null;

    const insights = {
      cost_optimization: [],
      preventive_suggestions: [],
      compliance_alerts: [],
      resource_recommendations: []
    };

    // Cost optimization insights
    if (integratedData.finance_transactions?.length > 0) {
      const totalCost = integratedData.finance_transactions.reduce((sum, t) => sum + t.amount, 0);
      if (totalCost > 10000) {
        insights.cost_optimization.push({
          type: 'high_cost_alert',
          message: `This job has accumulated ${totalCost} in costs. Consider reviewing for optimization opportunities.`,
          severity: 'medium'
        });
      }
    }

    // Preventive maintenance suggestions
    if (integratedData.related_equipment?.length > 0) {
      for (const equipment of integratedData.related_equipment) {
        if (equipment.next_maintenance_date && new Date(equipment.next_maintenance_date) < new Date()) {
          insights.preventive_suggestions.push({
            type: 'overdue_maintenance',
            message: `Equipment ${equipment.name} has overdue maintenance. This may be related to the current issue.`,
            severity: 'high',
            equipment_id: equipment.id
          });
        }
      }
    }

    // Compliance alerts
    const complianceStatus = await this.getComplianceStatus(jobId, integratedData.job.job_type);
    if (complianceStatus.pending_checks > 0) {
      insights.compliance_alerts.push({
        type: 'pending_compliance',
        message: `${complianceStatus.pending_checks} compliance requirements need verification.`,
        severity: 'medium'
      });
    }

    // Resource recommendations
    if (integratedData.related_inventory?.length > 0) {
      for (const item of integratedData.related_inventory) {
        if (item.quantity <= (item.min_stock || 0)) {
          insights.resource_recommendations.push({
            type: 'low_stock_alert',
            message: `Inventory item ${item.name} is running low and may be needed for this job.`,
            severity: 'medium',
            inventory_id: item.id
          });
        }
      }
    }

    return insights;
  }
}

export const crossModuleIntegration = new CrossModuleIntegrationService();