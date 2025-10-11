import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  Database,
  Cpu,
  Wifi,
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { enterpriseHealthOrchestrator } from '@/services/enterpriseHealthOrchestrator';
import { debugConsole } from '@/services/debugConsole';

interface AutomatedHealthStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  lastChecked: Date;
  issues: string[];
  metrics: Record<string, any>;
  verificationId?: string;
  changeDetected?: boolean;
}

/**
 * Automated System Status Display
 * Fully automated, no manual controls - enterprise-grade monitoring display
 */
const AutomatedSystemStatus: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<AutomatedHealthStatus | null>(null);
  const [orchestratorState, setOrchestratorState] = useState<any>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Subscribe to automated health updates
  useEffect(() => {
    const unsubscribe = enterpriseHealthOrchestrator.subscribe((status) => {
      setHealthStatus(status);
      setLastUpdateTime(new Date());
      
      debugConsole.info('SYSTEM', '📊 Automated status update received', {
        status: status.status,
        issues_count: status.issues?.length || 0,
        verification_id: status.verificationId
      });
    });

    // Get initial orchestrator state
    const initialState = enterpriseHealthOrchestrator.getAutomatedHealthStatus();
    setOrchestratorState(initialState);

    // Update orchestrator state every 30 seconds
    const stateInterval = setInterval(() => {
      const currentState = enterpriseHealthOrchestrator.getAutomatedHealthStatus();
      setOrchestratorState(currentState);
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(stateInterval);
    };
  }, []);

  // Get overall system status
  const getSystemStatus = () => {
    if (!healthStatus) {
      return { 
        status: 'unknown', 
        label: 'System Initializing...', 
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 border-gray-200'
      };
    }
    
    switch (healthStatus.status) {
      case 'healthy':
        return { 
          status: 'healthy', 
          label: 'All Systems Operational', 
          color: 'text-green-700',
          bgColor: 'bg-green-50 border-green-200'
        };
      case 'degraded':
        return { 
          status: 'degraded', 
          label: 'System Performance Degraded', 
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50 border-yellow-200'
        };
      case 'critical':
        return { 
          status: 'critical', 
          label: 'Critical System Issues', 
          color: 'text-red-700',
          bgColor: 'bg-red-50 border-red-200'
        };
      default:
        return { 
          status: 'unknown', 
          label: 'System Status Unknown', 
          color: 'text-gray-700',
          bgColor: 'bg-gray-50 border-gray-200'
        };
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    const status = getSystemStatus();
    
    switch (status.status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Activity className="w-6 h-6 text-gray-500 animate-pulse" />;
    }
  };

  const systemStatus = getSystemStatus();
  const criticalIssues = healthStatus?.issues?.filter(issue => 
    issue.toLowerCase().includes('critical') || 
    issue.toLowerCase().includes('failed') ||
    issue.toLowerCase().includes('down')
  ) || [];

  return (
    <div className="space-y-4">
      {/* Main Status Display */}
      <Card className={`p-6 border-2 ${systemStatus.bgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h2 className={`text-xl font-bold ${systemStatus.color}`}>
                {systemStatus.label}
              </h2>
              <p className="text-sm text-gray-600">
                Enterprise Automated Monitoring • Last verified: {healthStatus ? healthStatus.lastChecked.toLocaleTimeString() : 'Initializing...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Automated
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Enterprise
            </Badge>
          </div>
        </div>

        {/* Orchestrator Status */}
        {orchestratorState && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {orchestratorState.orchestrationState}
              </div>
              <div className="text-xs text-gray-500">Orchestration State</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {orchestratorState.isMonitoring ? 'Active' : 'Inactive'}
              </div>
              <div className="text-xs text-gray-500">Monitoring Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {orchestratorState.criticalIssueCount}
              </div>
              <div className="text-xs text-gray-500">Critical Issues</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {orchestratorState.lastVerification ? 
                  orchestratorState.lastVerification.toLocaleTimeString() : 
                  'Pending'
                }
              </div>
              <div className="text-xs text-gray-500">Last Verification</div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {healthStatus?.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <Database className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <div className="text-sm font-medium">Database</div>
              <div className="text-xs text-gray-600">
                {healthStatus.metrics.database_response ? `${healthStatus.metrics.database_response}ms` : 'N/A'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <Wifi className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <div className="text-sm font-medium">Realtime</div>
              <div className="text-xs text-gray-600">
                {healthStatus.metrics.realtime_connection ? `${healthStatus.metrics.realtime_connection}ms` : 'N/A'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <Cpu className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <div className="text-sm font-medium">AI Providers</div>
              <div className="text-xs text-gray-600">
                {healthStatus.metrics.ai_provider_response ? `${healthStatus.metrics.ai_provider_response}ms` : 'N/A'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <Server className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <div className="text-sm font-medium">Processors</div>
              <div className="text-xs text-gray-600">
                {healthStatus.metrics.processor_response ? `${healthStatus.metrics.processor_response}ms` : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Issues Display */}
      {healthStatus?.issues && healthStatus.issues.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Automated Issue Detection</h3>
          </div>
          
          <div className="space-y-2">
            {criticalIssues.slice(0, 3).map((issue, index) => (
              <div key={index} className="p-2 bg-red-100 rounded border border-red-300">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">Critical:</span>
                  <span className="text-sm text-red-700">{issue}</span>
                </div>
              </div>
            ))}
            
            {healthStatus.issues.filter(issue => !criticalIssues.includes(issue)).slice(0, 2).map((issue, index) => (
              <div key={`warning-${index}`} className="p-2 bg-yellow-100 rounded border border-yellow-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800 font-medium">Warning:</span>
                  <span className="text-sm text-yellow-700">{issue}</span>
                </div>
              </div>
            ))}
            
            {healthStatus.issues.length > 5 && (
              <div className="text-center text-sm text-gray-600">
                +{healthStatus.issues.length - 5} additional issues detected
              </div>
            )}
          </div>
        </Card>
      )}

      {/* System Information */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Last Update: {lastUpdateTime.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-green-600">Autonomous Monitoring Active</span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Enterprise Health Orchestrator • Systematic Verification • Zero Manual Intervention
        </div>
      </Card>
    </div>
  );
};

export default AutomatedSystemStatus;