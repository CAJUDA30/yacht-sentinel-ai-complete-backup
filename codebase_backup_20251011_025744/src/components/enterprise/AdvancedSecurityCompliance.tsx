import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Eye,
  AlertTriangle,
  CheckCircle,
  FileText,
  Globe,
  Users,
  Database,
  Activity,
  Bell,
  Download
} from 'lucide-react';

interface SecurityMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastCheck: string;
  details: string[];
}

interface ComplianceFramework {
  name: string;
  standard: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  score: number;
  requirements: number;
  implemented: number;
  lastAudit: string;
  nextAudit: string;
}

interface SecurityThreat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
  actions: string[];
}

export default function AdvancedSecurityCompliance() {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetric[]>([]);
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([]);
  const [securityThreats, setSecurityThreats] = useState<SecurityThreat[]>([]);
  const [overallSecurityScore, setOverallSecurityScore] = useState(0);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = () => {
    // Mock security metrics
    const metrics: SecurityMetric[] = [
      {
        name: 'Access Control',
        score: 98,
        status: 'excellent',
        lastCheck: '2024-01-15 10:30:00',
        details: [
          'Multi-factor authentication enabled',
          'Role-based access control active',
          'Zero-trust architecture implemented',
          'Regular access reviews conducted'
        ]
      },
      {
        name: 'Data Encryption',
        score: 96,
        status: 'excellent',
        lastCheck: '2024-01-15 09:45:00',
        details: [
          'AES-256 encryption at rest',
          'TLS 1.3 for data in transit',
          'End-to-end encryption for sensitive data',
          'Key rotation automated'
        ]
      },
      {
        name: 'Network Security',
        score: 94,
        status: 'excellent',
        lastCheck: '2024-01-15 11:15:00',
        details: [
          'Web Application Firewall active',
          'DDoS protection enabled',
          'Intrusion detection system operational',
          'Network segmentation implemented'
        ]
      },
      {
        name: 'Vulnerability Management',
        score: 92,
        status: 'good',
        lastCheck: '2024-01-15 08:20:00',
        details: [
          'Regular security scans',
          'Automated patch management',
          'Penetration testing quarterly',
          'Vulnerability assessment ongoing'
        ]
      },
      {
        name: 'Incident Response',
        score: 89,
        status: 'good',
        lastCheck: '2024-01-15 07:30:00',
        details: [
          'Incident response plan active',
          '24/7 security monitoring',
          'Automated threat detection',
          'Security team on standby'
        ]
      }
    ];

    // Mock compliance frameworks
    const frameworks: ComplianceFramework[] = [
      {
        name: 'GDPR',
        standard: 'General Data Protection Regulation',
        status: 'compliant',
        score: 97,
        requirements: 99,
        implemented: 96,
        lastAudit: '2023-12-15',
        nextAudit: '2024-06-15'
      },
      {
        name: 'SOC 2',
        standard: 'Service Organization Control 2',
        status: 'compliant',
        score: 95,
        requirements: 64,
        implemented: 61,
        lastAudit: '2023-11-20',
        nextAudit: '2024-05-20'
      },
      {
        name: 'ISO 27001',
        standard: 'Information Security Management',
        status: 'partial',
        score: 88,
        requirements: 114,
        implemented: 100,
        lastAudit: '2023-10-30',
        nextAudit: '2024-04-30'
      },
      {
        name: 'PCI DSS',
        standard: 'Payment Card Industry Data Security',
        status: 'compliant',
        score: 93,
        requirements: 12,
        implemented: 11,
        lastAudit: '2023-12-01',
        nextAudit: '2024-06-01'
      }
    ];

    // Mock security threats
    const threats: SecurityThreat[] = [
      {
        id: '1',
        type: 'Suspicious Login Attempt',
        severity: 'medium',
        description: 'Multiple failed login attempts from unusual location',
        source: 'Authentication System',
        timestamp: '2024-01-15 12:45:00',
        status: 'investigating',
        actions: ['Account locked', 'User notified', 'Investigation ongoing']
      },
      {
        id: '2',
        type: 'Unusual API Usage',
        severity: 'low',
        description: 'API rate limit exceeded by 15%',
        source: 'API Gateway',
        timestamp: '2024-01-15 11:30:00',
        status: 'resolved',
        actions: ['Rate limiting adjusted', 'Client contacted', 'Monitoring increased']
      },
      {
        id: '3',
        type: 'Outdated Dependency',
        severity: 'medium',
        description: 'Security vulnerability detected in npm package',
        source: 'Dependency Scanner',
        timestamp: '2024-01-15 09:15:00',
        status: 'active',
        actions: ['Package update scheduled', 'Risk assessment completed']
      }
    ];

    setSecurityMetrics(metrics);
    setComplianceFrameworks(frameworks);
    setSecurityThreats(threats);

    // Calculate overall security score
    const avgScore = metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length;
    setOverallSecurityScore(Math.round(avgScore));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'compliant':
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
      case 'partial':
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'warning':
      case 'active':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
      case 'non-compliant':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateSecurityReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      overallScore: overallSecurityScore,
      metrics: securityMetrics,
      compliance: complianceFrameworks,
      threats: securityThreats,
      summary: {
        totalThreats: securityThreats.length,
        activeThreats: securityThreats.filter(t => t.status === 'active').length,
        complianceScore: Math.round(complianceFrameworks.reduce((sum, f) => sum + f.score, 0) / complianceFrameworks.length)
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'security-compliance-report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Advanced Security & Compliance</h2>
          <p className="text-muted-foreground">Enterprise-grade security monitoring and regulatory compliance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{overallSecurityScore}%</div>
            <div className="text-sm text-muted-foreground">Security Score</div>
          </div>
          <Button onClick={generateSecurityReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Security Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold text-green-600">{overallSecurityScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold text-blue-600">
                  {complianceFrameworks.filter(f => f.status === 'compliant').length}/{complianceFrameworks.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {securityThreats.filter(t => t.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-purple-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Monitoring</p>
                <p className="text-2xl font-bold text-purple-600">24/7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security">Security Metrics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="threats">Threat Detection</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-6">
            {securityMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{metric.name}</CardTitle>
                        <CardDescription>Last checked: {metric.lastCheck}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">{metric.score}%</div>
                      </div>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={metric.score} className="h-3" />
                  <div>
                    <h4 className="font-semibold mb-2">Security Controls:</h4>
                    <ul className="space-y-1">
                      {metric.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4">
            {complianceFrameworks.map((framework, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{framework.name}</CardTitle>
                      <CardDescription>{framework.standard}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(framework.status)}>
                      {framework.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{framework.score}%</div>
                      <div className="text-sm text-muted-foreground">Compliance Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{framework.implemented}/{framework.requirements}</div>
                      <div className="text-sm text-muted-foreground">Requirements Met</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Next Audit</div>
                      <div className="text-sm text-muted-foreground">{framework.nextAudit}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Implementation Progress</span>
                      <span>{Math.round((framework.implemented / framework.requirements) * 100)}%</span>
                    </div>
                    <Progress value={(framework.implemented / framework.requirements) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          {securityThreats.length > 0 ? (
            <div className="space-y-4">
              {securityThreats.map((threat) => (
                <Card key={threat.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <div>
                          <CardTitle className="text-lg">{threat.type}</CardTitle>
                          <CardDescription>{threat.timestamp} • {threat.source}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(threat.status)}>
                          {threat.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{threat.description}</p>
                    <div>
                      <h4 className="font-semibold mb-2">Actions Taken:</h4>
                      <ul className="space-y-1">
                        {threat.actions.map((action, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="border-green-200 bg-green-50/50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                No active security threats detected. All systems are secure and monitoring is operational.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Trail</CardTitle>
              <CardDescription>Comprehensive security event logging and audit history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  All security events are logged and monitored in real-time. Audit trails are maintained for compliance and forensic analysis.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Audit Features:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Comprehensive event logging</li>
                    <li>• Real-time monitoring and alerts</li>
                    <li>• Tamper-proof audit trails</li>
                    <li>• Automated compliance reporting</li>
                    <li>• Forensic analysis capabilities</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Retention Policy:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Security logs: 7 years</li>
                    <li>• Access logs: 2 years</li>
                    <li>• System logs: 1 year</li>
                    <li>• Compliance reports: 10 years</li>
                    <li>• Incident reports: Permanent</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}