/**
 * Fleet-Centric Service
 * Manages yacht-centric data architecture and fleet operations
 */

import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from './YachtieIntegrationService';

export interface YachtProfile {
  id: string;
  name: string;
  flag: string;
  imoNumber: string;
  length: number;
  grossTonnage: number;
  buildYear: number;
  builder: string;
  location: {
    latitude: number;
    longitude: number;
    port: string;
    country: string;
  };
  status: "active" | "maintenance" | "charter" | "transit" | "docked";
  owner: {
    name: string;
    contact: string;
  };
  management: {
    company: string;
    captain: string;
    contact: string;
  };
  specifications: {
    maxGuests: number;
    crewCapacity: number;
    cruisingSpeed: number;
    maxSpeed: number;
    fuelCapacity: number;
    waterCapacity: number;
  };
  isActive: boolean;
}

export interface FleetMetrics {
  totalYachts: number;
  activeYachts: number;
  maintenanceYachts: number;
  charterYachts: number;
  averageLength: number;
  totalGrossTonnage: number;
  fleetValue: number;
  utilizationRate: number;
}

export interface YachtComparison {
  yachtId: string;
  metrics: {
    operationalCost: number;
    revenueGenerated: number;
    maintenanceScore: number;
    utilizationRate: number;
    guestSatisfaction: number;
    crewEfficiency: number;
  };
  rankings: {
    profitability: number;
    efficiency: number;
    satisfaction: number;
    maintenance: number;
  };
}

class FleetCentricService {
  private currentYachtId: string | null = null;

  constructor() {
    // Initialize with stored yacht ID
    this.currentYachtId = localStorage.getItem('currentYachtId');
  }

  /**
   * Switch active yacht context
   */
  async switchActiveYacht(yachtId: string): Promise<{success: boolean, yacht?: YachtProfile, error?: string}> {
    try {
      // Verify yacht exists and user has access
      const yacht = await this.getYachtProfile(yachtId);
      if (!yacht) {
        return { success: false, error: 'Yacht not found or access denied' };
      }

      // Update current yacht context
      this.currentYachtId = yachtId;
      localStorage.setItem('currentYachtId', yachtId);

      // Emit yacht switch event for other modules
      window.dispatchEvent(new CustomEvent('yachtSwitched', { 
        detail: { yachtId, yacht } 
      }));

      return { success: true, yacht };

    } catch (error) {
      console.error('Error switching yacht:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get current active yacht ID
   */
  getCurrentYachtId(): string | null {
    return this.currentYachtId;
  }

  /**
   * Get fleet dashboard data
   */
  async getFleetDashboard(): Promise<{profiles: YachtProfile[], metrics: FleetMetrics}> {
    try {
      // Fetch real fleet profiles from database
      const { data: yachtsData, error: yachtsError } = await supabase
        .from('yacht_profiles')
        .select(`
          *,
          yacht_fleet_profiles(*)
        `);

      if (yachtsError) {
        console.error('Error fetching yacht profiles:', yachtsError);
        throw yachtsError;
      }

      // Convert database data to YachtProfile format
      const profiles: YachtProfile[] = (yachtsData || []).map(yacht => this.mapDatabaseYachtToProfile(yacht));

      // Calculate metrics using database function
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('calculate_fleet_metrics');

      if (metricsError) {
        console.error('Error calculating fleet metrics:', metricsError);
        throw metricsError;
      }

      const metrics: FleetMetrics = metricsData?.[0] || {
        totalYachts: 0,
        activeYachts: 0,
        maintenanceYachts: 0,
        charterYachts: 0,
        averageLength: 0,
        totalGrossTonnage: 0,
        fleetValue: 0,
        utilizationRate: 0
      };

      return { profiles, metrics };

    } catch (error) {
      console.error('Error getting fleet dashboard:', error);
      return { 
        profiles: [], 
        metrics: {
          totalYachts: 0,
          activeYachts: 0,
          maintenanceYachts: 0,
          charterYachts: 0,
          averageLength: 0,
          totalGrossTonnage: 0,
          fleetValue: 0,
          utilizationRate: 0
        }
      };
    }
  }

  /**
   * Get specific yacht profile
   */
  async getYachtProfile(yachtId: string): Promise<YachtProfile | null> {
    try {
      // Fetch from database with fleet profile data
      const { data: yacht, error } = await supabase
        .from('yacht_profiles')
        .select(`
          *,
          yacht_fleet_profiles(*)
        `)
        .eq('id', yachtId)
        .single();

      if (error || !yacht) {
        console.error('Yacht not found:', error);
        return null;
      }

      // Convert database yacht to YachtProfile
      return this.mapDatabaseYachtToProfile(yacht);

    } catch (error) {
      console.error('Error getting yacht profile:', error);
      return null;
    }
  }

  /**
   * Compare fleet performance
   */
  async compareFleetPerformance(metrics: string[], dateRange?: {start: string, end: string}): Promise<YachtComparison[]> {
    try {
      // Fetch real comparison metrics from database
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_yacht_comparison_metrics');

      if (metricsError) {
        console.error('Error fetching comparison metrics:', metricsError);
        throw metricsError;
      }

      if (!metricsData || metricsData.length === 0) {
        return [];
      }

      // Calculate rankings
      const sortedByProfit = [...metricsData].sort((a, b) => (b.revenue_generated - b.operational_cost) - (a.revenue_generated - a.operational_cost));
      const sortedByEfficiency = [...metricsData].sort((a, b) => b.utilization_rate - a.utilization_rate);
      const sortedBySatisfaction = [...metricsData].sort((a, b) => b.guest_satisfaction - a.guest_satisfaction);
      const sortedByMaintenance = [...metricsData].sort((a, b) => b.maintenance_score - a.maintenance_score);

      // Map to YachtComparison format with real rankings
      const comparisons: YachtComparison[] = metricsData.map(yacht => ({
        yachtId: yacht.yacht_id,
        metrics: {
          operationalCost: yacht.operational_cost || 0,
          revenueGenerated: yacht.revenue_generated || 0,
          maintenanceScore: yacht.maintenance_score || 0,
          utilizationRate: yacht.utilization_rate || 0,
          guestSatisfaction: yacht.guest_satisfaction || 0,
          crewEfficiency: yacht.crew_efficiency || 0
        },
        rankings: {
          profitability: sortedByProfit.findIndex(y => y.yacht_id === yacht.yacht_id) + 1,
          efficiency: sortedByEfficiency.findIndex(y => y.yacht_id === yacht.yacht_id) + 1,
          satisfaction: sortedBySatisfaction.findIndex(y => y.yacht_id === yacht.yacht_id) + 1,
          maintenance: sortedByMaintenance.findIndex(y => y.yacht_id === yacht.yacht_id) + 1
        }
      }));

      return comparisons;

    } catch (error) {
      console.error('Error comparing fleet performance:', error);
      return [];
    }
  }

  /**
   * Generate fleet reports
   */
  async generateFleetReports(
    reportType: 'operational' | 'financial' | 'maintenance' | 'compliance', 
    dateRange: {start: string, end: string}
  ): Promise<{success: boolean, reportData?: any, error?: string}> {
    try {
      let reportData: any = {};

      switch (reportType) {
        case 'operational':
          // Fetch operational metrics from database
          const { data: operationalData, error: opError } = await supabase
            .from('fleet_operational_metrics')
            .select('yacht_id, operational_cost, utilization_rate, crew_efficiency')
            .gte('metric_date', dateRange.start)
            .lte('metric_date', dateRange.end);

          if (opError) throw opError;

          const totalOperationalCost = operationalData?.reduce((sum, record) => sum + (record.operational_cost || 0), 0) || 0;
          const averageUtilization = operationalData?.length > 0 
            ? operationalData.reduce((sum, record) => sum + (record.utilization_rate || 0), 0) / operationalData.length 
            : 0;
          const topPerformer = operationalData?.sort((a, b) => (b.utilization_rate || 0) - (a.utilization_rate || 0))[0]?.yacht_id;

          reportData = {
            summary: {
              totalOperationalCost,
              averageUtilization,
              topPerformer
            },
            details: operationalData?.reduce((acc, record) => {
              const existing = acc.find((item: any) => item.yachtId === record.yacht_id);
              if (existing) {
                existing.operationalCost += record.operational_cost || 0;
                existing.utilizationRate = (existing.utilizationRate + (record.utilization_rate || 0)) / 2;
                existing.efficiency = (existing.efficiency + (record.crew_efficiency || 0)) / 2;
              } else {
                acc.push({
                  yachtId: record.yacht_id,
                  operationalCost: record.operational_cost || 0,
                  utilizationRate: record.utilization_rate || 0,
                  efficiency: record.crew_efficiency || 0
                });
              }
              return acc;
            }, []) || []
          };
          break;

        case 'financial':
          // Fetch financial records from database
          const { data: financialData, error: finError } = await supabase
            .from('fleet_financial_records')
            .select('yacht_id, transaction_type, amount')
            .gte('transaction_date', dateRange.start)
            .lte('transaction_date', dateRange.end);

          if (finError) throw finError;

          const totalRevenue = financialData?.filter(r => r.transaction_type.includes('income') || r.transaction_type === 'revenue')
            .reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
          const totalCosts = financialData?.filter(r => r.transaction_type.includes('cost'))
            .reduce((sum, record) => sum + (record.amount || 0), 0) || 0;
          const netProfit = totalRevenue - totalCosts;
          const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

          const financialByYacht = financialData?.reduce((acc, record) => {
            const existing = acc.find((item: any) => item.yachtId === record.yacht_id);
            const isRevenue = record.transaction_type.includes('income') || record.transaction_type === 'revenue';
            const isCost = record.transaction_type.includes('cost');
            
            if (existing) {
              if (isRevenue) existing.revenue += record.amount || 0;
              if (isCost) existing.costs += record.amount || 0;
            } else {
              acc.push({
                yachtId: record.yacht_id,
                revenue: isRevenue ? (record.amount || 0) : 0,
                costs: isCost ? (record.amount || 0) : 0,
                profit: 0
              });
            }
            return acc;
          }, []) || [];

          // Calculate profit for each yacht
          financialByYacht.forEach((yacht: any) => {
            yacht.profit = yacht.revenue - yacht.costs;
          });

          reportData = {
            summary: { totalRevenue, totalCosts, netProfit, profitMargin },
            details: financialByYacht
          };
          break;

        case 'maintenance':
          // Fetch maintenance scores from operational metrics
          const { data: maintenanceData, error: maintError } = await supabase
            .from('fleet_operational_metrics')
            .select('yacht_id, maintenance_score')
            .gte('metric_date', dateRange.start)
            .lte('metric_date', dateRange.end);

          if (maintError) throw maintError;

          const averageMaintenanceScore = maintenanceData?.length > 0 
            ? maintenanceData.reduce((sum, record) => sum + (record.maintenance_score || 0), 0) / maintenanceData.length 
            : 0;
          const yachtsRequiringAttention = maintenanceData?.filter(r => (r.maintenance_score || 0) < 70).length || 0;
          const bestMaintained = maintenanceData?.sort((a, b) => (b.maintenance_score || 0) - (a.maintenance_score || 0))[0]?.yacht_id;

          const maintenanceByYacht = maintenanceData?.reduce((acc, record) => {
            const existing = acc.find((item: any) => item.yachtId === record.yacht_id);
            if (existing) {
              existing.maintenanceScore = (existing.maintenanceScore + (record.maintenance_score || 0)) / 2;
            } else {
              const score = record.maintenance_score || 0;
              acc.push({
                yachtId: record.yacht_id,
                maintenanceScore: score,
                status: score > 80 ? 'Excellent' : score > 70 ? 'Good' : score > 50 ? 'Fair' : 'Poor'
              });
            }
            return acc;
          }, []) || [];

          reportData = {
            summary: { averageMaintenanceScore, yachtsRequiringAttention, bestMaintained },
            details: maintenanceByYacht
          };
          break;

        case 'compliance':
          // Fetch compliance records from database
          const { data: complianceData, error: compError } = await supabase
            .from('fleet_compliance_records')
            .select('yacht_id, status, compliance_score');

          if (compError) throw compError;

          const compliantYachts = complianceData?.filter(r => r.status === 'valid').length || 0;
          const pendingItems = complianceData?.filter(r => r.status === 'pending').length || 0;
          const overdueItems = complianceData?.filter(r => ['expired', 'overdue'].includes(r.status)).length || 0;

          const complianceByYacht = complianceData?.reduce((acc, record) => {
            const existing = acc.find((item: any) => item.yachtId === record.yacht_id);
            if (existing) {
              existing.complianceScore = (existing.complianceScore + (record.compliance_score || 0)) / 2;
              if (record.status === 'pending') existing.pendingCertifications++;
              if (['expired', 'overdue'].includes(record.status)) existing.overdueDocs++;
            } else {
              acc.push({
                yachtId: record.yacht_id,
                complianceScore: record.compliance_score || 0,
                pendingCertifications: record.status === 'pending' ? 1 : 0,
                overdueDocs: ['expired', 'overdue'].includes(record.status) ? 1 : 0
              });
            }
            return acc;
          }, []) || [];

          reportData = {
            summary: { compliantYachts, pendingItems, overdueItems },
            details: complianceByYacht
          };
          break;
      }

      return { success: true, reportData };

    } catch (error) {
      console.error('Error generating fleet report:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Sync fleet data across all yachts
   */
  async syncFleetData(yachtIds: string[]): Promise<{success: boolean, syncedCount?: number, error?: string}> {
    try {
      // Mock sync process
      console.log('Syncing fleet data for yachts:', yachtIds);
      
      // Use Yachtie to analyze sync requirements
      const syncRequest = {
        text: `Synchronize data for yacht fleet: ${yachtIds.join(', ')}`,
        task: 'analyze' as const,
        context: 'fleet_data_sync',
        options: {
          yachtIds,
          syncModules: ['crew', 'inventory', 'maintenance', 'financial'],
          conflictResolution: 'latest_timestamp'
        }
      };

      const syncResponse = await yachtieService.process(syncRequest);
      
      if (syncResponse.success) {
        return { 
          success: true, 
          syncedCount: yachtIds.length 
        };
      }

      return { 
        success: false, 
        error: 'Sync process failed' 
      };

    } catch (error) {
      console.error('Error syncing fleet data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get yacht-scoped data for any module
   */
  async getYachtScopedData(module: string, dataType: string, yachtId?: string): Promise<any[]> {
    try {
      const targetYachtId = yachtId || this.currentYachtId;
      if (!targetYachtId) {
        throw new Error('No yacht selected');
      }

      // Route to appropriate data based on module
      switch (module) {
        case 'crew':
          return this.getCrewData(targetYachtId);
        case 'inventory':
          return this.getInventoryData(targetYachtId);
        case 'maintenance':
          return this.getMaintenanceData(targetYachtId);
        case 'financial':
          return this.getFinancialData(targetYachtId);
        default:
          return [];
      }

    } catch (error) {
      console.error('Error getting yacht-scoped data:', error);
      return [];
    }
  }

  // Private helper methods

private mapDatabaseYachtToProfile(yacht: any): YachtProfile {
    const fleetProfile = yacht.yacht_fleet_profiles?.[0];
    
    return {
      id: yacht.id,
      name: yacht.name || 'Unnamed Yacht',
      flag: yacht.flag_state || 'Unknown',
      imoNumber: yacht.imo_number || 'N/A',
      length: yacht.length_meters || 0,
      grossTonnage: yacht.gross_tonnage || 0,
      buildYear: yacht.year_built || 0,
      builder: yacht.builder || 'Unknown',
      location: {
        latitude: fleetProfile?.location_latitude || 0,
        longitude: fleetProfile?.location_longitude || 0,
        port: fleetProfile?.current_port || 'Unknown',
        country: fleetProfile?.current_country || 'Unknown'
      },
      status: fleetProfile?.status || 'docked',
      owner: { 
        name: fleetProfile?.owner_name || 'Unknown', 
        contact: fleetProfile?.owner_contact || 'Unknown' 
      },
      management: { 
        company: fleetProfile?.management_company || 'Unknown', 
        captain: fleetProfile?.captain_name || 'Unknown', 
        contact: fleetProfile?.management_contact || 'Unknown' 
      },
      specifications: {
        maxGuests: yacht.max_guests || 0,
        crewCapacity: yacht.crew_capacity || 0,
        cruisingSpeed: fleetProfile?.cruising_speed || 0,
        maxSpeed: fleetProfile?.max_speed || 0,
        fuelCapacity: fleetProfile?.fuel_capacity_liters || 0,
        waterCapacity: fleetProfile?.water_capacity_liters || 0
      },
      isActive: fleetProfile?.is_active ?? yacht.is_active ?? true
    };
  }


  private async getCrewData(yachtId: string): Promise<any[]> {
      // Mock data query to avoid complex types
      const { data } = await supabase
        .from('crew_members')
        .select('id, name, position')
        .eq('yacht_id', yachtId)
        .eq('status', 'active');
    
    return data || [];
  }

  private async getInventoryData(yachtId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('fleet_inventory')
        .select('*')
        .eq('yacht_id', yachtId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      return [];
    }
  }

  private async getMaintenanceData(yachtId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('fleet_operational_metrics')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('metric_date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      return [];
    }
  }

  private async getFinancialData(yachtId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('fleet_financial_records')
        .select('*')
        .eq('yacht_id', yachtId)
        .order('transaction_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching financial data:', error);
      return [];
    }
  }
}

export const fleetCentricService = new FleetCentricService();