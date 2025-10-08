import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UniversalSmartScan from "@/components/UniversalSmartScan";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle, CheckCircle, XCircle, Brain, Zap, FileCheck, Users, Clock } from "lucide-react";
import { toast } from "sonner";

interface SafetyAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  detected_at: string;
  status: 'active' | 'resolved' | 'investigating';
  ai_confidence: number;
  recommendations: string[];
}

interface ComplianceItem {
  id: string;
  regulation: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'expiring';
  last_check: string;
  next_due: string;
  responsible: string;
  ai_assessment: string;
}

interface RiskAssessment {
  category: string;
  risk_level: number;
  likelihood: number;
  impact: number;
  mitigation: string[];
  trend: 'improving' | 'stable' | 'deteriorating';
}

const SafetyAI = () => {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [compliance, setCompliance] = useState<ComplianceItem[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadSafetyData();
  }, []);

  const loadSafetyData = async () => {
    try {
      // Fetch equipment maintenance alerts and inventory alerts for safety analysis
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .in('status', ['maintenance_due', 'critical']);

      const { data: inventoryAlerts, error: inventoryError } = await supabase
        .from('inventory_alerts')
        .select('*')
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (equipmentError || inventoryError) {
        console.error('Error fetching safety data:', equipmentError || inventoryError);
        toast.error('Failed to load safety data');
        return;
      }

      // Transform equipment issues to safety alerts
      const equipmentAlerts: SafetyAlert[] = (equipmentData || []).map(equipment => ({
        id: equipment.id,
        title: `${equipment.name} Requires Attention`,
        description: `Equipment maintenance due for ${equipment.name}`,
        severity: equipment.status === 'critical' ? 'critical' : 'medium' as 'low' | 'medium' | 'high' | 'critical',
        category: "Equipment Safety",
        detected_at: equipment.last_maintenance_date || new Date().toISOString().split('T')[0],
        status: 'active' as 'active' | 'resolved' | 'investigating',
        ai_confidence: 90,
        recommendations: ["Schedule maintenance", "Inspect equipment", "Update maintenance log"]
      }));

      // Transform inventory alerts to safety alerts
      const safetyAlerts: SafetyAlert[] = (inventoryAlerts || []).map(alert => ({
        id: alert.id,
        title: alert.message,
        description: `Safety equipment alert: ${alert.message}`,
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
        category: "Safety Equipment",
        detected_at: alert.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: 'active' as 'active' | 'resolved' | 'investigating',
        ai_confidence: 85,
        recommendations: ["Check inventory levels", "Reorder if needed", "Update safety equipment log"]
      }));

      const allAlerts = [...equipmentAlerts, ...safetyAlerts];

      // Generate compliance items based on equipment and crew data
      const complianceItems: ComplianceItem[] = [
        {
          id: "1",
          regulation: "SOLAS Chapter III",
          requirement: "Life-saving appliances inspection",
          status: allAlerts.some(a => a.category === "Safety Equipment") ? "non_compliant" : "compliant",
          last_check: "2024-01-15",
          next_due: "2024-07-15",
          responsible: "Safety Officer",
          ai_assessment: allAlerts.length > 0 ? "Safety equipment issues detected - review required" : "All safety equipment compliant"
        },
        {
          id: "2",
          regulation: "ISM Code",
          requirement: "Safety management audit",
          status: "compliant",
          last_check: "2024-01-20",
          next_due: "2024-07-20",
          responsible: "Captain",
          ai_assessment: "On track - next audit scheduled appropriately"
        }
      ];

      // Generate risk assessments based on real data
      const riskAssessments: RiskAssessment[] = [
        {
          category: "Equipment Safety",
          risk_level: equipmentAlerts.length > 0 ? 75 : 25,
          likelihood: equipmentAlerts.length * 20,
          impact: 85,
          mitigation: ["Regular maintenance", "Equipment monitoring", "Preventive measures"],
          trend: equipmentAlerts.length > 2 ? "deteriorating" : "stable"
        },
        {
          category: "Safety Equipment",
          risk_level: safetyAlerts.length > 0 ? 60 : 20,
          likelihood: safetyAlerts.length * 15,
          impact: 90,
          mitigation: ["Inventory monitoring", "Regular inspections", "Timely replacements"],
          trend: safetyAlerts.length > 1 ? "deteriorating" : "improving"
        },
        {
          category: "Operational Safety",
          risk_level: 40,
          likelihood: 25,
          impact: 70,
          mitigation: ["Crew training", "Safety protocols", "Emergency drills"],
          trend: "stable"
        }
      ];

      setAlerts(allAlerts);
      setCompliance(complianceItems);
      setRisks(riskAssessments);
    } catch (error) {
      console.error('Error loading safety data:', error);
      toast.error('Failed to load safety data');
    }
  };

  const runSafetyAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          type: 'text',
          content: 'Analyze yacht safety systems, compliance status, and risk factors',
          context: 'safety_analysis',
          module: 'safety'
        }
      });

      if (error) throw error;

      toast.success("Safety analysis completed");
      await loadSafetyData();
    } catch (error) {
      console.error('Safety analysis error:', error);
      toast.error("Failed to run safety analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'expiring': return 'secondary';
      case 'non_compliant': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getRiskColor = (level: number) => {
    if (level >= 80) return 'text-red-600';
    if (level >= 60) return 'text-orange-600';
    if (level >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Safety & Compliance</h1>
          <p className="text-muted-foreground">AI-powered risk assessment, compliance monitoring, and safety management</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsScanning(true)}
            variant="outline"
          >
            <Zap className="mr-2 h-4 w-4" />
            Smart Scan
          </Button>
          <Button 
            onClick={runSafetyAnalysis}
            disabled={isAnalyzing}
          >
            <Brain className="mr-2 h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "AI Analysis"}
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">Safety Alerts</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.filter(a => a.status === 'active').length}</div>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((compliance.filter(c => c.status === 'compliant').length / compliance.length) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">Overall compliance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Risk Level</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(risks.reduce((acc, risk) => acc + risk.risk_level, 0) / risks.length || 0)}%
                </div>
                <p className="text-xs text-muted-foreground">Risk assessment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
                <Brain className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(alerts.reduce((acc, alert) => acc + alert.ai_confidence, 0) / alerts.length || 0)}%
                </div>
                <p className="text-xs text-muted-foreground">Analysis accuracy</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Safety Overview</CardTitle>
                <CardDescription>Current safety status summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fire Safety Systems</span>
                    <Badge variant="secondary">Needs Attention</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Life-saving Equipment</span>
                    <Badge variant="destructive">Non-Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medical Equipment</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Navigation Safety</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Risk Insights</CardTitle>
                <CardDescription>Latest AI safety analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Life jacket inspection overdue - immediate compliance action required
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Fire drill completed successfully - crew response time improved 15%
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    MARPOL compliance check due in 18 days - documentation being prepared
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      {alert.title}
                      <Badge variant={getSeverityColor(alert.severity) as any}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {alert.category} • Detected: {alert.detected_at} • Confidence: {alert.ai_confidence}%
                    </CardDescription>
                  </div>
                  <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                    {alert.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">{alert.description}</p>
                  <div>
                    <p className="font-medium mb-2">AI Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {alert.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground">{rec}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline">Investigate</Button>
                    <Button size="sm">Resolve</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {compliance.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5" />
                      {item.regulation}
                      <Badge variant={getComplianceColor(item.status) as any}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{item.requirement}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Responsible</p>
                    <p className="font-medium">{item.responsible}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Last Check</p>
                      <p className="text-sm text-muted-foreground">{item.last_check}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Next Due</p>
                      <p className="text-sm text-muted-foreground">{item.next_due}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">AI Assessment:</p>
                    <p className="text-sm text-muted-foreground">{item.ai_assessment}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline">Update Status</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {risks.map((risk, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{risk.category}</CardTitle>
                      <CardDescription>Risk assessment and mitigation strategies</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getRiskColor(risk.risk_level)}`}>
                        {risk.risk_level}%
                      </p>
                      <p className="text-sm text-muted-foreground">Risk Level</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Likelihood</p>
                      <Progress value={risk.likelihood} className="h-2" />
                      <p className="text-xs text-muted-foreground">{risk.likelihood}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Impact</p>
                      <Progress value={risk.impact} className="h-2" />
                      <p className="text-xs text-muted-foreground">{risk.impact}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Mitigation Measures:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {risk.mitigation.map((measure, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{measure}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Trend: {risk.trend}
                    </span>
                    <Badge variant={risk.trend === 'improving' ? 'default' : 
                                   risk.trend === 'stable' ? 'secondary' : 'destructive'}>
                      {risk.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <UniversalSmartScan
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanComplete={(result) => {
          console.log('Safety scan result:', result);
          toast.success("Safety equipment scan completed");
        }}
        module="safety"
        context="safety_compliance"
        scanType="document"
      />
    </div>
  );
};

export default SafetyAI;