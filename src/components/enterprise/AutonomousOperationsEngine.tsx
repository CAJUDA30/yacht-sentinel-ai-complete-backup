import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Brain, 
  Zap, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Cpu,
  Database
} from 'lucide-react';

interface AutonomousSystem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  autonomyLevel: number;
  lastAction: string;
  actionsPerformed: number;
  successRate: number;
  enabled: boolean;
  type: 'navigation' | 'maintenance' | 'optimization' | 'security' | 'communication';
}

interface DecisionLog {
  id: string;
  timestamp: string;
  system: string;
  decision: string;
  confidence: number;
  outcome: 'success' | 'pending' | 'failed';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export default function AutonomousOperationsEngine() {
  const [systems, setSystems] = useState<AutonomousSystem[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>([]);
  const [overallAutonomy, setOverallAutonomy] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAutonomousSystems();
    loadDecisionLogs();
  }, []);

  const loadAutonomousSystems = async () => {
    setIsLoading(true);
    try {
      // Mock autonomous systems data
      const mockSystems: AutonomousSystem[] = [
        {
          id: 'nav-pilot',
          name: 'Autonomous Navigation Pilot',
          description: 'AI-powered navigation and route optimization',
          status: 'active',
          autonomyLevel: 95,
          lastAction: 'Route optimized for weather conditions',
          actionsPerformed: 847,
          successRate: 98.7,
          enabled: true,
          type: 'navigation'
        },
        {
          id: 'maintenance-ai',
          name: 'Predictive Maintenance AI',
          description: 'Self-healing systems and predictive maintenance',
          status: 'active',
          autonomyLevel: 92,
          lastAction: 'Scheduled engine oil change',
          actionsPerformed: 1247,
          successRate: 96.3,
          enabled: true,
          type: 'maintenance'
        },
        {
          id: 'performance-optimizer',
          name: 'Performance Optimization Engine',
          description: 'Real-time system performance optimization',
          status: 'active',
          autonomyLevel: 88,
          lastAction: 'Power distribution optimized',
          actionsPerformed: 2156,
          successRate: 97.8,
          enabled: true,
          type: 'optimization'
        },
        {
          id: 'security-guardian',
          name: 'Autonomous Security Guardian',
          description: 'Intelligent threat detection and response',
          status: 'active',
          autonomyLevel: 91,
          lastAction: 'Anomaly detected and resolved',
          actionsPerformed: 534,
          successRate: 99.1,
          enabled: true,
          type: 'security'
        },
        {
          id: 'comms-manager',
          name: 'Communication Manager AI',
          description: 'Automated communication and coordination',
          status: 'active',
          autonomyLevel: 85,
          lastAction: 'Port clearance requested',
          actionsPerformed: 967,
          successRate: 94.5,
          enabled: true,
          type: 'communication'
        }
      ];

      setSystems(mockSystems);
      
      const totalAutonomy = mockSystems.reduce((sum, system) => sum + system.autonomyLevel, 0);
      setOverallAutonomy(totalAutonomy / mockSystems.length);
    } catch (error) {
      console.error('Failed to load autonomous systems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDecisionLogs = async () => {
    try {
      // Mock decision logs
      const mockLogs: DecisionLog[] = [
        {
          id: '1',
          timestamp: '2024-01-20 14:30:25',
          system: 'Navigation Pilot',
          decision: 'Adjusted course by 5° to avoid weather system',
          confidence: 94,
          outcome: 'success',
          impact: 'medium'
        },
        {
          id: '2',
          timestamp: '2024-01-20 14:25:18',
          system: 'Maintenance AI',
          decision: 'Scheduled preventive maintenance for port engine',
          confidence: 97,
          outcome: 'pending',
          impact: 'low'
        },
        {
          id: '3',
          timestamp: '2024-01-20 14:20:12',
          system: 'Security Guardian',
          decision: 'Blocked suspicious network activity',
          confidence: 99,
          outcome: 'success',
          impact: 'high'
        },
        {
          id: '4',
          timestamp: '2024-01-20 14:15:07',
          system: 'Performance Optimizer',
          decision: 'Optimized fuel consumption settings',
          confidence: 92,
          outcome: 'success',
          impact: 'medium'
        },
        {
          id: '5',
          timestamp: '2024-01-20 14:10:33',
          system: 'Communication Manager',
          decision: 'Automatically requested port clearance',
          confidence: 88,
          outcome: 'success',
          impact: 'low'
        }
      ];

      setDecisionLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load decision logs:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'navigation':
        return <Target className="w-5 h-5" />;
      case 'maintenance':
        return <Settings className="w-5 h-5" />;
      case 'optimization':
        return <TrendingUp className="w-5 h-5" />;
      case 'security':
        return <Shield className="w-5 h-5" />;
      case 'communication':
        return <Activity className="w-5 h-5" />;
      default:
        return <Bot className="w-5 h-5" />;
    }
  };

  const toggleSystem = (systemId: string) => {
    setSystems(prev => 
      prev.map(system => 
        system.id === systemId 
          ? { ...system, enabled: !system.enabled, status: !system.enabled ? 'active' : 'inactive' }
          : system
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading autonomous systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Autonomous Operations Engine</h2>
          <p className="text-muted-foreground">AI-powered autonomous yacht operations and decision making</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Bot className="w-4 h-4 mr-1" />
            {overallAutonomy.toFixed(1)}% Autonomous
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Overall Autonomy</p>
                <p className="text-2xl font-bold">{overallAutonomy.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Systems</p>
                <p className="text-2xl font-bold">{systems.filter(s => s.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Actions Today</p>
                <p className="text-2xl font-bold">{systems.reduce((sum, s) => sum + s.actionsPerformed, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {(systems.reduce((sum, s) => sum + s.successRate, 0) / systems.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="systems">Autonomous Systems</TabsTrigger>
          <TabsTrigger value="decisions">Decision Logs</TabsTrigger>
          <TabsTrigger value="controls">System Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {systems.map((system) => (
              <Card key={system.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getTypeIcon(system.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{system.name}</CardTitle>
                        <CardDescription>{system.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(system.status)}>
                      {system.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Autonomy Level</span>
                      <span className="font-medium">{system.autonomyLevel}%</span>
                    </div>
                    <Progress value={system.autonomyLevel} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium">{system.successRate}%</span>
                    </div>
                    <Progress value={system.successRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Actions Performed</span>
                      <div className="font-medium">{system.actionsPerformed.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Action</span>
                      <div className="font-medium text-xs">{system.lastAction}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">System Status</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={system.enabled}
                        onCheckedChange={() => toggleSystem(system.id)}
                      />
                      <span className="text-sm font-medium">
                        {system.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Autonomous Decisions</CardTitle>
              <CardDescription>Real-time log of AI-powered decisions and their outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {decisionLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      {getOutcomeIcon(log.outcome)}
                      <div>
                        <div className="font-medium">{log.decision}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.system} • {log.timestamp}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(log.impact)} variant="outline">
                        {log.impact} impact
                      </Badge>
                      <div className="text-sm font-medium">
                        {log.confidence}% confidence
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Master Controls</CardTitle>
                <CardDescription>Global autonomous system controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Emergency Override</span>
                  <Button variant="destructive" size="sm">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Override All
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Pause All Systems</span>
                  <Button variant="outline" size="sm">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Resume Operations</span>
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">System Reset</span>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>CPU Usage</span>
                    <span className="font-medium">23%</span>
                  </div>
                  <Progress value={23} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Network Load</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>AI Processing</span>
                    <span className="font-medium">89%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}