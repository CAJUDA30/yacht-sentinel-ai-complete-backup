export interface ProductionMetrics {
  uptime_percentage: number;
  avg_response_time_ms: number;
  total_requests_24h: number;
  error_rate_percentage: number;
  cost_per_hour: number;
  provider_health: ProviderHealthStatus[];
  system_alerts: SystemAlert[];
}

export interface ProviderHealthStatus {
  provider_id: string;
  provider_name: string;
  status: 'healthy' | 'degraded' | 'down';
  last_check: string;
  response_time_ms: number;
  success_rate: number;
  error_count_1h: number;
  rate_limit_remaining: number;
  next_reset: string;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  component: string;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
  action_required: boolean;
  suggested_actions: string[];
}

export interface DeploymentConfig {
  id: string;
  name: string;
  environment: 'development' | 'staging' | 'production';
  auto_scaling: boolean;
  min_instances: number;
  max_instances: number;
  target_cpu_utilization: number;
  health_check_interval: number;
  failover_enabled: boolean;
  backup_providers: string[];
  monitoring_enabled: boolean;
  logging_level: 'debug' | 'info' | 'warn' | 'error';
  rate_limiting: RateLimitConfig;
  security_config: SecurityConfig;
  created_at: string;
  updated_at: string;
}

export interface RateLimitConfig {
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  burst_allowance: number;
  throttle_response: 'queue' | 'reject' | 'fallback';
}

export interface SecurityConfig {
  api_key_rotation_days: number;
  encryption_at_rest: boolean;
  encryption_in_transit: boolean;
  audit_logging: boolean;
  access_control: 'rbac' | 'abac' | 'custom';
  ip_whitelist: string[];
  geo_blocking: string[];
  ddos_protection: boolean;
}

export interface BackupConfig {
  id: string;
  backup_type: 'full' | 'incremental' | 'differential';
  schedule: string; // cron expression
  retention_days: number;
  encryption_enabled: boolean;
  compression_enabled: boolean;
  storage_location: string;
  notification_emails: string[];
  last_backup: string;
  next_backup: string;
  status: 'active' | 'failed' | 'in_progress';
}

export interface LoadTestResult {
  id: string;
  test_name: string;
  environment: string;
  start_time: string;
  duration_minutes: number;
  concurrent_users: number;
  total_requests: number;
  requests_per_second: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  error_rate: number;
  throughput_mb_s: number;
  cpu_usage_max: number;
  memory_usage_max: number;
  passed: boolean;
  bottlenecks: string[];
  recommendations: string[];
}

export interface ComplianceReport {
  id: string;
  report_type: 'gdpr' | 'hipaa' | 'sox' | 'iso27001' | 'pci_dss';
  generated_at: string;
  period_start: string;
  period_end: string;
  compliance_score: number;
  passed_controls: number;
  total_controls: number;
  failed_controls: ComplianceControl[];
  recommendations: string[];
  next_audit_date: string;
  certified_by: string;
}

export interface ComplianceControl {
  control_id: string;
  control_name: string;
  description: string;
  status: 'passed' | 'failed' | 'not_applicable';
  evidence: string[];
  remediation_required: boolean;
  remediation_steps: string[];
  due_date: string;
}