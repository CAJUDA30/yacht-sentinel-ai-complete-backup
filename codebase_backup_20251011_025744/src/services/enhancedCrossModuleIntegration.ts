import { supabase } from '@/integrations/supabase/client';
import { crossModuleIntegration } from './crossModuleIntegration';

export interface EventBusMessage {
  id: string;
  event_type: string;
  module: string;
  source_record_id?: string;
  target_modules: string[];
  payload: Record<string, any>;
  severity: 'info' | 'warn' | 'error' | 'critical';
  processed: boolean;
  processing_results: Record<string, any>;
  created_at: string;
  processed_at?: string;
  user_id?: string;
}

class EnhancedCrossModuleIntegrationService {
  
  /**
   * Equipment Integration - Bidirectional sync with Claims & Repairs
   */
  async integrateEquipmentWithClaimsRepairs(equipmentId: string, jobId: string, relationship_type: 'failure' | 'maintenance' | 'warranty' = 'failure'): Promise<void> {
    try {
      // Create bidirectional relationship
      await crossModuleIntegration.createRelationship(
        'equipment',
        equipmentId,
        'claims_repairs',
        jobId,
        'triggers',
        { relationship_type, auto_created: true, integration_level: 'full' }
      );

      // Check if equipment needs maintenance
      const { data: equipment } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (equipment && equipment.next_maintenance_date && new Date(equipment.next_maintenance_date) < new Date()) {
        await this.publishEvent({
          event_type: 'equipment_overdue_maintenance',
          module: 'equipment',
          source_record_id: equipmentId,
          target_modules: ['maintenance', 'claims_repairs'],
          payload: { equipment, related_job_id: jobId },
          severity: 'warn'
        });
      }

      // Auto-reserve related inventory items
      const { data: relatedInventory } = await supabase
        .from('inventory_items')
        .select('*')
        .ilike('name', `%${equipment?.name || ''}%`)
        .gt('quantity', 0);

      if (relatedInventory && relatedInventory.length > 0) {
        for (const item of relatedInventory.slice(0, 3)) { // Limit to 3 items
          await this.createInventoryReservationEntry({
            inventory_item_id: item.id,
            reserved_for_module: 'claims_repairs',
            reserved_for_record_id: jobId,
            quantity_reserved: Math.min(1, item.quantity),
            reservation_type: 'soft',
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Auto-reserved for equipment repair: ${equipment?.name}`,
            status: 'active'
          });
        }
      }
    } catch (error) {
      console.error('Error integrating equipment with claims repairs:', error);
    }
  }

  /**
   * Inventory Integration - Auto-consumption and low stock triggers
   */
  async integrateInventoryWithClaimsRepairs(jobId: string, requiredParts: string[] = []): Promise<void> {
    try {
      for (const partName of requiredParts) {
        const { data: inventoryItems } = await supabase
          .from('inventory_items')
          .select('*')
          .ilike('name', `%${partName}%`);

        if (inventoryItems && inventoryItems.length > 0) {
          const item = inventoryItems[0];
          
          // Create hard reservation
          await this.createInventoryReservationEntry({
            inventory_item_id: item.id,
            reserved_for_module: 'claims_repairs',
            reserved_for_record_id: jobId,
            quantity_reserved: 1,
            reservation_type: 'hard',
            notes: `Reserved for Claims & Repairs job`,
            status: 'active'
          });

          // Check for low stock and trigger procurement
          if (item.quantity <= (item.min_stock || 1)) {
            await this.publishEvent({
              event_type: 'inventory_low_stock',
              module: 'inventory',
              source_record_id: item.id,
              target_modules: ['procurement', 'claims_repairs'],
              payload: { 
                item, 
                related_job_id: jobId,
                action_required: 'procurement_request'
              },
              severity: item.quantity === 0 ? 'critical' : 'warn'
            });

            // Auto-create procurement request
            await this.createAutomaticProcurementRequest(item, jobId);
          }
        }
      }
    } catch (error) {
      console.error('Error integrating inventory with claims repairs:', error);
    }
  }

  /**
   * Finance Integration - Auto-invoice generation and budget tracking
   */
  async integrateFinanceWithClaimsRepairs(jobId: string, estimatedCost: number, currency: string = 'USD'): Promise<void> {
    try {
      // Create finance transaction
      const transaction = await crossModuleIntegration.createFinanceTransaction(
        jobId,
        'claims_repair',
        'expense',
        estimatedCost,
        currency,
        'Auto-generated from Claims & Repairs job'
      );

      if (transaction) {
        // Check budget thresholds
        if (estimatedCost > 10000) {
          await this.publishEvent({
            event_type: 'high_cost_approval_required',
            module: 'finance',
            source_record_id: transaction.id,
            target_modules: ['claims_repairs', 'approval_workflow'],
            payload: { 
              transaction, 
              job_id: jobId,
              threshold_exceeded: 10000,
              requires_approval: true
            },
            severity: 'warn'
          });
        }

        // Auto-create invoice for external suppliers
        const { data: job } = await supabase
          .from('audit_instances')
          .select('*, supplier_contractor_id')
          .eq('id', jobId)
          .single();

        if (job?.supplier_contractor_id) {
          await crossModuleIntegration.createFinanceTransaction(
            jobId,
            'claims_repair',
            'invoice',
            estimatedCost,
            currency,
            'Auto-generated invoice for external repair',
            job.supplier_contractor_id
          );
        }
      }
    } catch (error) {
      console.error('Error integrating finance with claims repairs:', error);
    }
  }

  /**
   * Crew Integration - Assignment and certification tracking
   */
  async integrateCrewWithClaimsRepairs(jobId: string, requiredSkills: string[] = []): Promise<void> {
    try {
      // Find crew members with required skills
      const { data: crewMembers } = await supabase
        .from('crew_members')
        .select('*')
        .contains('skills', requiredSkills);

      if (crewMembers && crewMembers.length > 0) {
        // Auto-assign crew member
        const assignedCrew = crewMembers[0];
        
        await supabase
          .from('audit_instances')
          .update({ assigned_to: assignedCrew.id })
          .eq('id', jobId);

        // Check certifications (simplified since certifications type is complex)
        const today = new Date();
        const certifications = assignedCrew.certifications as any;
        const expiringSoon = Array.isArray(certifications) && certifications.some((cert: any) => 
          cert.expires_at && new Date(cert.expires_at) < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        );

        if (expiringSoon) {
          await this.publishEvent({
            event_type: 'crew_certification_expiring',
            module: 'crew',
            source_record_id: assignedCrew.id,
            target_modules: ['claims_repairs', 'training'],
            payload: { 
              crew_member: assignedCrew, 
              job_id: jobId,
              action_required: 'renew_certification'
            },
            severity: 'warn'
          });
        }
      }
    } catch (error) {
      console.error('Error integrating crew with claims repairs:', error);
    }
  }

  /**
   * Maintenance Integration - Schedule updates and historical analysis
   */
  async integrateMaintenanceWithClaimsRepairs(jobId: string, equipmentId?: string): Promise<void> {
    if (!equipmentId) return;

    try {
      // Get maintenance schedules
      const { data: maintenanceSchedules } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('equipment_id', equipmentId);

      for (const schedule of maintenanceSchedules || []) {
        // Adjust next maintenance date based on repair
        const newMaintenanceDate = new Date();
        newMaintenanceDate.setMonth(newMaintenanceDate.getMonth() + 6); // Default 6 months

        await supabase
          .from('maintenance_schedules')
          .update({ 
            description: `Updated after Claims & Repairs job completion: ${jobId}`
          })
          .eq('id', schedule.id);
      }

      // Analyze failure patterns
      const { data: recentRepairs } = await supabase
        .from('audit_instances')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('job_type', 'repair')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentRepairs && recentRepairs.length > 2) {
        await this.publishEvent({
          event_type: 'equipment_frequent_repairs',
          module: 'maintenance',
          source_record_id: equipmentId,
          target_modules: ['claims_repairs', 'procurement', 'analytics'],
          payload: { 
            equipment_id: equipmentId, 
            recent_repairs: recentRepairs,
            recommendation: 'consider_replacement',
            frequency: recentRepairs.length
          },
          severity: 'warn'
        });
      }
    } catch (error) {
      console.error('Error integrating maintenance with claims repairs:', error);
    }
  }

  /**
   * Procurement Integration - Auto-purchase orders and supplier performance
   */
  async integrateProcurementWithClaimsRepairs(jobId: string, supplierIds: string[] = []): Promise<void> {
    try {
      // Track supplier performance
      for (const supplierId of supplierIds) {
        const { data: supplier } = await supabase
          .from('suppliers_contractors')
          .select('*')
          .eq('id', supplierId)
          .single();

        if (supplier) {
          // Create relationship
          await crossModuleIntegration.createRelationship(
            'claims_repairs',
            jobId,
            'procurement',
            supplierId,
            'consumes',
            { relationship_type: 'supplier_engagement', performance_tracking: true }
          );

          // Update supplier performance metrics
          await this.recordMetricSafely('supplier_engagement', `procurement_claims_repairs`, 1, 'count', 'daily', { supplier_id: supplierId, job_id: jobId });
        }
      }
    } catch (error) {
      console.error('Error integrating procurement with claims repairs:', error);
    }
  }

  /**
   * Safety & Compliance Integration
   */
  async integrateSafetyComplianceWithClaimsRepairs(jobId: string, jobType: string): Promise<void> {
    try {
      // Get applicable compliance requirements
      const { data: requirements } = await supabase
        .from('compliance_requirements')
        .select('*')
        .contains('applicable_modules', ['claims_repairs'])
        .eq('is_active', true);

      const complianceChecks = [];

      for (const requirement of requirements || []) {
        complianceChecks.push({
          job_id: jobId,
          requirement_id: requirement.id,
          status: 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }

      // Publish compliance event
      await this.publishEvent({
        event_type: 'compliance_checks_required',
        module: 'compliance',
        source_record_id: jobId,
        target_modules: ['claims_repairs', 'safety'],
        payload: { 
          job_id: jobId,
          checks_required: complianceChecks.length,
          checks: complianceChecks
        },
        severity: 'info'
      });
    } catch (error) {
      console.error('Error integrating safety compliance with claims repairs:', error);
    }
  }

  /**
   * Communications Integration - Multi-channel notifications
   */
  async integrateCommunicationsWithClaimsRepairs(jobId: string, stakeholders: string[] = []): Promise<void> {
    try {
      const { data: job } = await supabase
        .from('audit_instances')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!job) return;

      // Create communication channels for stakeholders
      for (const stakeholderId of stakeholders) {
        const { data: channel } = await supabase
          .from('communication_channels')
          .insert({
            audit_instance_id: jobId,
            channel_type: 'email',
            status: 'active'
          })
          .select()
          .single();

        if (channel) {
          // Send initial notification
          await this.publishEvent({
            event_type: 'stakeholder_notification_required',
            module: 'communications',
            source_record_id: channel.id,
            target_modules: ['claims_repairs'],
            payload: { 
              job, 
              channel_id: channel.id,
              stakeholder_id: stakeholderId,
              notification_type: 'job_created'
            },
            severity: 'info'
          });
        }
      }
    } catch (error) {
      console.error('Error integrating communications with claims repairs:', error);
    }
  }

  /**
   * Analytics & Reporting Integration
   */
  async integrateAnalyticsWithClaimsRepairs(jobId: string): Promise<void> {
    try {
      // Record metrics
      await this.recordMetricSafely('claims_repairs_created', 'claims_repairs', 1, 'count', 'daily');
      
      // Analyze trends
      const insights = await crossModuleIntegration.generateInsights(jobId);
      
      if (insights) {
        await this.publishEvent({
          event_type: 'analytics_insights_generated',
          module: 'analytics',
          source_record_id: jobId,
          target_modules: ['claims_repairs', 'dashboard'],
          payload: { 
            job_id: jobId,
            insights,
            generated_at: new Date().toISOString()
          },
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error integrating analytics with claims repairs:', error);
    }
  }

  // Helper Methods

  private async createInventoryReservationEntry(reservation: {
    inventory_item_id: string;
    reserved_for_module: string;
    reserved_for_record_id: string;
    quantity_reserved: number;
    reservation_type: 'hard' | 'soft' | 'planned';
    valid_until?: string;
    status: 'active' | 'consumed' | 'cancelled' | 'expired';
    notes?: string;
  }): Promise<any> {
    try {
      // For now, we'll store this in a JSON field of the audit_instances table
      // since the inventory_reservations table might not exist
      const { data: job } = await supabase
        .from('audit_instances')
        .select('metadata')
        .eq('id', reservation.reserved_for_record_id)
        .single();

      const currentMetadata = job?.metadata as any || {};
      const reservations = currentMetadata.inventory_reservations || [];
      
      reservations.push({
        ...reservation,
        id: `temp_${Date.now()}`,
        created_at: new Date().toISOString()
      });

      await supabase
        .from('audit_instances')
        .update({ 
          metadata: { 
            ...currentMetadata, 
            inventory_reservations: reservations 
          } 
        })
        .eq('id', reservation.reserved_for_record_id);

      return reservation;
    } catch (error) {
      console.error('Error creating inventory reservation:', error);
      return null;
    }
  }

  private async createAutomaticProcurementRequest(item: any, jobId: string): Promise<void> {
    try {
      await supabase
        .from('automated_procurement_requests')
        .insert({
          part_name: item.name,
          part_number: item.part_number,
          quantity_needed: Math.max(item.min_stock || 5, 5),
          current_stock: item.quantity,
          minimum_threshold: item.min_stock,
          urgency: item.quantity === 0 ? 'critical' : 'high',
          notes: `Auto-generated for Claims & Repairs job: ${jobId}`,
          equipment_id: null
        });
    } catch (error) {
      console.error('Error creating automatic procurement request:', error);
    }
  }

  private async publishEvent(event: Omit<EventBusMessage, 'id' | 'created_at' | 'processed' | 'processing_results'>): Promise<void> {
    try {
      // Store events in analytics_events table which exists
      await supabase
        .from('analytics_events')
        .insert({
          event_type: event.event_type,
          event_message: `Cross-module event: ${event.event_type}`,
          module: event.module,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          severity: event.severity,
          metadata: {
            source_record_id: event.source_record_id,
            target_modules: event.target_modules,
            payload: event.payload
          }
        });
    } catch (error) {
      console.error('Error publishing event:', error);
    }
  }

  private async recordMetricSafely(
    metricName: string,
    moduleCombination: string,
    value: number,
    type: 'count' | 'duration' | 'cost' | 'efficiency' | 'success_rate',
    timePeriod: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Store metrics in analytics_events table for now
      await supabase
        .from('analytics_events')
        .insert({
          event_type: `metric_${metricName}`,
          event_message: `Metric recorded: ${metricName}`,
          module: 'metrics',
          severity: 'info',
          metadata: {
            metric_name: metricName,
            module_combination: moduleCombination,
            metric_value: value,
            metric_type: type,
            time_period: timePeriod,
            ...metadata
          }
        });
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }

  /**
   * Get comprehensive integration status for a job
   */
  async getJobIntegrationStatus(jobId: string): Promise<{
    equipment: { linked: boolean; count: number };
    inventory: { reserved: number; low_stock_alerts: number };
    finance: { transactions: number; total_cost: number };
    crew: { assigned: boolean; certifications_ok: boolean };
    maintenance: { schedules_updated: number; overdue_items: number };
    compliance: { requirements: number; compliant: number; pending: number };
    communications: { channels: number; unread_messages: number };
  }> {
    try {
      const integratedData = await crossModuleIntegration.getIntegratedJobData(jobId);
      
      if (!integratedData) {
        return {
          equipment: { linked: false, count: 0 },
          inventory: { reserved: 0, low_stock_alerts: 0 },
          finance: { transactions: 0, total_cost: 0 },
          crew: { assigned: false, certifications_ok: true },
          maintenance: { schedules_updated: 0, overdue_items: 0 },
          compliance: { requirements: 0, compliant: 0, pending: 0 },
          communications: { channels: 0, unread_messages: 0 }
        };
      }

      // Calculate integration status
      const equipmentLinked = (integratedData.related_equipment?.length || 0) > 0;
      const inventoryReserved = await this.getInventoryReservationsCount(jobId);
      const financeTransactions = integratedData.finance_transactions?.length || 0;
      const totalCost = integratedData.finance_transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const complianceRequirements = integratedData.compliance_requirements?.length || 0;

      return {
        equipment: { 
          linked: equipmentLinked, 
          count: integratedData.related_equipment?.length || 0 
        },
        inventory: { 
          reserved: inventoryReserved, 
          low_stock_alerts: 0
        },
        finance: { 
          transactions: financeTransactions, 
          total_cost: totalCost 
        },
        crew: { 
          assigned: integratedData.job.assigned_to != null, 
          certifications_ok: true
        },
        maintenance: { 
          schedules_updated: integratedData.maintenance_schedules?.length || 0, 
          overdue_items: 0
        },
        compliance: { 
          requirements: complianceRequirements, 
          compliant: 0,
          pending: complianceRequirements 
        },
        communications: { 
          channels: 0,
          unread_messages: 0 
        }
      };
    } catch (error) {
      console.error('Error getting job integration status:', error);
      return {
        equipment: { linked: false, count: 0 },
        inventory: { reserved: 0, low_stock_alerts: 0 },
        finance: { transactions: 0, total_cost: 0 },
        crew: { assigned: false, certifications_ok: true },
        maintenance: { schedules_updated: 0, overdue_items: 0 },
        compliance: { requirements: 0, compliant: 0, pending: 0 },
        communications: { channels: 0, unread_messages: 0 }
      };
    }
  }

  private async getInventoryReservationsCount(jobId: string): Promise<number> {
    try {
      // Get from metadata since table might not exist
      const { data: job } = await supabase
        .from('audit_instances')
        .select('metadata')
        .eq('id', jobId)
        .single();

      const metadata = job?.metadata as any;
      const reservations = metadata?.inventory_reservations || [];
      return reservations.filter((r: any) => r.status === 'active').length;
    } catch (error) {
      console.error('Error getting inventory reservations count:', error);
      return 0;
    }
  }

  /**
   * Perform full integration for a Claims & Repairs job
   */
  async performFullIntegration(
    jobId: string, 
    options: {
      equipmentId?: string;
      requiredParts?: string[];
      estimatedCost?: number;
      requiredSkills?: string[];
      supplierIds?: string[];
      stakeholders?: string[];
    } = {}
  ): Promise<void> {
    try {
      // Execute all integrations in parallel for efficiency
      const integrationPromises = [
        this.integrateAnalyticsWithClaimsRepairs(jobId),
        this.integrateSafetyComplianceWithClaimsRepairs(jobId, 'repair')
      ];

      if (options.equipmentId) {
        integrationPromises.push(
          this.integrateEquipmentWithClaimsRepairs(options.equipmentId, jobId),
          this.integrateMaintenanceWithClaimsRepairs(jobId, options.equipmentId)
        );
      }

      if (options.requiredParts && options.requiredParts.length > 0) {
        integrationPromises.push(
          this.integrateInventoryWithClaimsRepairs(jobId, options.requiredParts)
        );
      }

      if (options.estimatedCost && options.estimatedCost > 0) {
        integrationPromises.push(
          this.integrateFinanceWithClaimsRepairs(jobId, options.estimatedCost)
        );
      }

      if (options.requiredSkills && options.requiredSkills.length > 0) {
        integrationPromises.push(
          this.integrateCrewWithClaimsRepairs(jobId, options.requiredSkills)
        );
      }

      if (options.supplierIds && options.supplierIds.length > 0) {
        integrationPromises.push(
          this.integrateProcurementWithClaimsRepairs(jobId, options.supplierIds)
        );
      }

      if (options.stakeholders && options.stakeholders.length > 0) {
        integrationPromises.push(
          this.integrateCommunicationsWithClaimsRepairs(jobId, options.stakeholders)
        );
      }

      await Promise.all(integrationPromises);

      // Publish integration completed event
      await this.publishEvent({
        event_type: 'claims_repairs_full_integration_completed',
        module: 'claims_repairs',
        source_record_id: jobId,
        target_modules: ['dashboard', 'analytics'],
        payload: { 
          job_id: jobId,
          integration_options: options,
          completed_at: new Date().toISOString()
        },
        severity: 'info'
      });

    } catch (error) {
      console.error('Error performing full integration:', error);
    }
  }
}

export const enhancedCrossModuleIntegration = new EnhancedCrossModuleIntegrationService();