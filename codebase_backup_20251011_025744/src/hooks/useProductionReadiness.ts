import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ProductionMetrics, 
  DeploymentConfig, 
  BackupConfig, 
  LoadTestResult, 
  ComplianceReport,
  SystemAlert
} from '@/types/production';

export const useProductionReadiness = () => {
  const queryClient = useQueryClient();
  const [selectedEnvironment, setSelectedEnvironment] = useState<'development' | 'staging' | 'production'>('production');

  // Get production metrics
  const metrics = useQuery({
    queryKey: ['production-metrics', selectedEnvironment],
    queryFn: async (): Promise<ProductionMetrics> => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'get_metrics',
          environment: selectedEnvironment
        }
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get deployment configurations
  const deploymentConfigs = useQuery({
    queryKey: ['deployment-configs'],
    queryFn: async (): Promise<DeploymentConfig[]> => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'get_deployment_configs'
        }
      });

      if (error) throw error;
      return data || [];
    }
  });

  // Get system alerts
  const alerts = useQuery({
    queryKey: ['system-alerts', selectedEnvironment],
    queryFn: async (): Promise<SystemAlert[]> => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'get_alerts',
          environment: selectedEnvironment
        }
      });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Get backup status
  const backupStatus = useQuery({
    queryKey: ['backup-status'],
    queryFn: async (): Promise<BackupConfig[]> => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'get_backup_status'
        }
      });

      if (error) throw error;
      return data || [];
    }
  });

  // Run load test
  const runLoadTest = useMutation({
    mutationFn: async (testConfig: {
      test_name: string;
      environment: string;
      duration_minutes: number;
      concurrent_users: number;
      target_endpoint?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'run_load_test',
          config: testConfig
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-test-results'] });
    }
  });

  // Get load test results
  const loadTestResults = useQuery({
    queryKey: ['load-test-results'],
    queryFn: async (): Promise<LoadTestResult[]> => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'get_load_test_results'
        }
      });

      if (error) throw error;
      return data || [];
    }
  });

  // Update deployment config
  const updateDeploymentConfig = useMutation({
    mutationFn: async (config: DeploymentConfig) => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'update_deployment_config',
          config
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployment-configs'] });
    }
  });

  // Generate compliance report
  const generateComplianceReport = useMutation({
    mutationFn: async (reportType: 'gdpr' | 'hipaa' | 'sox' | 'iso27001' | 'pci_dss') => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'generate_compliance_report',
          report_type: reportType
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-reports'] });
    }
  });

  // Get compliance reports
  const complianceReports = useQuery({
    queryKey: ['compliance-reports'],
    queryFn: async (): Promise<ComplianceReport[]> => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'get_compliance_reports'
        }
      });

      if (error) throw error;
      return data || [];
    }
  });

  // Resolve alert
  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'resolve_alert',
          alert_id: alertId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
    }
  });

  // Trigger backup
  const triggerBackup = useMutation({
    mutationFn: async (backupType: 'full' | 'incremental' | 'differential') => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'trigger_backup',
          backup_type: backupType
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-status'] });
    }
  });

  // Check system health
  const checkSystemHealth = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'health_check'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
    }
  });

  return {
    // Data
    metrics: metrics.data,
    deploymentConfigs: deploymentConfigs.data || [],
    alerts: alerts.data || [],
    backupStatus: backupStatus.data || [],
    loadTestResults: loadTestResults.data || [],
    complianceReports: complianceReports.data || [],
    
    // Environment selection
    selectedEnvironment,
    setSelectedEnvironment,
    
    // Loading states
    isLoadingMetrics: metrics.isLoading,
    isLoadingConfigs: deploymentConfigs.isLoading,
    isLoadingAlerts: alerts.isLoading,
    
    // Mutations
    runLoadTest: runLoadTest.mutate,
    updateDeploymentConfig: updateDeploymentConfig.mutate,
    generateComplianceReport: generateComplianceReport.mutate,
    resolveAlert: resolveAlert.mutate,
    triggerBackup: triggerBackup.mutate,
    checkSystemHealth: checkSystemHealth.mutate,
    
    // Loading states for mutations
    isRunningLoadTest: runLoadTest.isPending,
    isUpdatingConfig: updateDeploymentConfig.isPending,
    isGeneratingReport: generateComplianceReport.isPending,
    isResolvingAlert: resolveAlert.isPending,
    isTriggeringBackup: triggerBackup.isPending,
    isCheckingHealth: checkSystemHealth.isPending,
  };
};