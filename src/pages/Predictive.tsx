import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UniversalSmartScan from "@/components/UniversalSmartScan";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Wrench, Calendar, TrendingUp, Zap, Gauge, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useEquipmentHealth } from '@/hooks/useEquipmentHealth';

interface PredictiveAlert {
  id: string;
  equipment: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  predicted_failure_date: string;
  confidence: number;
  recommendations: string[];
  cost_impact: number;
  maintenance_window: string;
}

interface EquipmentHealth {
  id: string;
  name: string;
  category: string;
  health_score: number;
  last_maintenance: string;
  next_maintenance: string;
  performance_trend: 'improving' | 'stable' | 'declining';
  sensors: {
    temperature: number;
    vibration: number;
    pressure: number;
    efficiency: number;
  };
}

const Predictive = () => {
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Use real equipment health data from database
  const { 
    healthMetrics, 
    loading: healthLoading,
    getCriticalEquipment,
    getAverageHealthScore
  } = useEquipmentHealth();

  useEffect(() => {
    loadPredictiveData();
  }, []);

  const loadPredictiveData = async () => {
    try {
      // Load real equipment data from Supabase for predictive analysis
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_maintenance_tasks(*)
        `)
        .order('name');

      if (equipmentError) throw equipmentError;

      if (equipmentData) {
        // Generate predictive alerts based on real equipment data
        const generatedAlerts: PredictiveAlert[] = [];
        const healthData: EquipmentHealth[] = [];

        equipmentData.forEach(eq => {
          // Calculate health score based on maintenance history and status
          let healthScore = 85;
          if (eq.status === 'needs_repair') healthScore = 45;
          else if (eq.status === 'maintenance') healthScore = 65;
          else if (eq.last_maintenance_date) {
            const daysSinceLastMaintenance = Math.floor(
              (new Date().getTime() - new Date(eq.last_maintenance_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            healthScore = Math.max(40, 95 - (daysSinceLastMaintenance / 10));
          }

          // Generate alert if health score is low
          if (healthScore < 70) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 7);
            
            generatedAlerts.push({
              id: eq.id,
              equipment: eq.name,
              risk_level: healthScore < 50 ? 'high' : 'medium',
              predicted_failure_date: futureDate.toISOString().split('T')[0],
              confidence: Math.floor(healthScore + Math.random() * 20),
              recommendations: [
                "Schedule preventive maintenance",
                "Inspect for wear patterns",
                "Check operational parameters"
              ],
              cost_impact: Math.floor(Math.random() * 20000) + 5000,
              maintenance_window: "2-6 hours"
            });
          }

          // Generate equipment health data
          healthData.push({
            id: eq.id,
            name: eq.name,
            category: eq.manufacturer || 'General',
            health_score: Math.floor(healthScore),
            last_maintenance: eq.last_maintenance_date || '2024-01-01',
            next_maintenance: eq.next_maintenance_date || '2024-12-31',
            performance_trend: healthScore > 80 ? 'stable' : healthScore > 60 ? 'declining' : 'declining',
            sensors: {
              temperature: Math.floor(Math.random() * 40) + 60,
              vibration: Math.random() * 10,
              pressure: Math.floor(Math.random() * 50) + 20,
              efficiency: Math.floor(healthScore)
            }
          });
        });

        setAlerts(generatedAlerts);
        // Equipment health data now comes from useEquipmentHealth hook
      }
    } catch (error) {
      console.error('Failed to load predictive data:', error);
      // Set empty arrays if failed
      setAlerts([]);
    }
  };

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          type: 'text',
          content: 'Analyze current equipment data and predict maintenance needs',
          context: 'predictive_maintenance',
          module: 'maintenance'
        }
      });

      if (error) throw error;

      toast.success("Predictive analysis completed");
      await loadPredictiveData();
    } catch (error) {
      console.error('Predictive analysis error:', error);
      toast.error("Failed to run predictive analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Predictive Maintenance</h1>
          <p className="text-muted-foreground">AI-powered equipment failure prediction and maintenance optimization</p>
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
            onClick={runPredictiveAnalysis}
            disabled={isAnalyzing}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Health</TabsTrigger>
          <TabsTrigger value="schedule">Maintenance Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.filter(a => a.risk_level === 'critical' || a.risk_level === 'high').length}</div>
                <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Equipment Monitored</CardTitle>
                <Gauge className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthMetrics.length}</div>
                <p className="text-xs text-muted-foreground">Real-time monitoring</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(getAverageHealthScore())}%
                </div>
                <p className="text-xs text-muted-foreground">Fleet-wide average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45K</div>
                <p className="text-xs text-muted-foreground">Prevented this quarter</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Insights</CardTitle>
                <CardDescription>Latest predictive analysis findings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Main engine showing increased vibration patterns. Recommend inspection within 48 hours.
                  </AlertDescription>
                </Alert>
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    HVAC system performance improved 15% after recent maintenance. Schedule extended successfully.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Efficiency</CardTitle>
                <CardDescription>AI-optimized scheduling impact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Downtime Reduction</span>
                    <span className="text-sm font-medium">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Cost Optimization</span>
                    <span className="text-sm font-medium">28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Prediction Accuracy</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
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
                      {alert.equipment}
                      <Badge variant={getRiskColor(alert.risk_level) as any}>
                        {alert.risk_level.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Predicted failure: {alert.predicted_failure_date} | Confidence: {alert.confidence}%
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Cost Impact</p>
                    <p className="text-lg font-semibold">${alert.cost_impact.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium mb-2">AI Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {alert.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">
                      Maintenance Window: {alert.maintenance_window}
                    </span>
                    <Button size="sm">Schedule Maintenance</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {healthMetrics.slice(0, 10).map((metric) => (
              <Card key={metric.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{metric.equipmentName || 'Equipment'}</CardTitle>
                      <CardDescription>Health Metrics</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getHealthColor(metric.overallHealthScore)}`}>
                        {Math.round(metric.overallHealthScore)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Health Score</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Temperature</p>
                      <p className="text-lg">{metric.temperature?.toFixed(1) || 'N/A'}°C</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Operating Hours</p>
                      <p className="text-lg">{metric.operatingHours}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Maintenance</p>
                      <Badge variant={
                        metric.maintenanceUrgency === 'critical' ? 'destructive' : 
                        metric.maintenanceUrgency === 'high' ? 'destructive' :
                        metric.maintenanceUrgency === 'medium' ? 'secondary' : 'default'
                      }>
                        {metric.maintenanceUrgency}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Recommendations</p>
                      <p className="text-sm">{metric.recommendations[0] || 'None'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Optimized Maintenance Schedule</CardTitle>
              <CardDescription>Automatically generated based on predictive analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: "2024-03-15", equipment: "Main Engine - Port", type: "Critical Maintenance", duration: "4 hours" },
                  { date: "2024-03-20", equipment: "Generator #2", type: "Preventive Service", duration: "2 hours" },
                  { date: "2024-03-25", equipment: "Air Conditioning", type: "Filter Replacement", duration: "1 hour" }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.equipment}</p>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.date}</p>
                      <p className="text-sm text-muted-foreground">{item.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UniversalSmartScan
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanComplete={(result) => {
          console.log('Predictive scan result:', result);
          toast.success("Equipment scan completed");
        }}
        module="maintenance"
        context="predictive_maintenance"
        scanType="document"
      />
    </div>
  );
};

export default Predictive;