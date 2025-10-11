import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cpu, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Wrench,
  Gauge,
  Battery,
  Thermometer,
  Activity,
  Brain,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PredictiveAlert {
  id: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  prediction: string;
  confidence: number;
  estimatedFailureDate: Date;
  recommendedAction: string;
  costImpact: number;
  preventiveMeasures: string[];
}

interface IoTSensor {
  id: string;
  name: string;
  type: 'temperature' | 'vibration' | 'pressure' | 'flow' | 'electrical';
  location: string;
  status: 'online' | 'offline' | 'warning';
  value: number;
  unit: string;
  normalRange: [number, number];
  lastUpdate: Date;
}

interface MaintenanceSchedule {
  id: string;
  component: string;
  type: 'preventive' | 'predictive' | 'corrective';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: Date;
  estimatedHours: number;
  cost: number;
  parts: string[];
  aiGenerated: boolean;
}

const PredictiveMaintenance: React.FC = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Initialize sample data
    setAlerts([
      {
        id: '1',
        component: 'Main Engine - Port',
        severity: 'high',
        prediction: 'Bearing wear detected. Likely failure in 15-20 days based on vibration patterns.',
        confidence: 89,
        estimatedFailureDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Schedule bearing replacement during next port visit',
        costImpact: 8500,
        preventiveMeasures: ['Monitor vibration hourly', 'Check oil quality', 'Reduce RPM when possible']
      },
      {
        id: '2',
        component: 'Generator #2',
        severity: 'medium',
        prediction: 'Cooling system efficiency declining. Temperature rising gradually.',
        confidence: 76,
        estimatedFailureDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Clean cooling system and replace coolant',
        costImpact: 2200,
        preventiveMeasures: ['Monitor coolant levels', 'Check for leaks', 'Clean air filters']
      },
      {
        id: '3',
        component: 'Hydraulic System',
        severity: 'low',
        prediction: 'Gradual pressure drop indicates possible seal deterioration.',
        confidence: 65,
        estimatedFailureDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Inspect hydraulic seals and plan replacement',
        costImpact: 1500,
        preventiveMeasures: ['Check hydraulic fluid levels', 'Monitor pressure readings', 'Inspect for leaks']
      }
    ]);

    setSensors([
      {
        id: '1',
        name: 'Engine Temperature',
        type: 'temperature',
        location: 'Main Engine',
        status: 'warning',
        value: 92,
        unit: '°C',
        normalRange: [75, 85],
        lastUpdate: new Date()
      },
      {
        id: '2',
        name: 'Vibration Monitor',
        type: 'vibration',
        location: 'Port Engine',
        status: 'online',
        value: 4.2,
        unit: 'mm/s',
        normalRange: [0, 3.5],
        lastUpdate: new Date()
      },
      {
        id: '3',
        name: 'Oil Pressure',
        type: 'pressure',
        location: 'Starboard Engine',
        status: 'online',
        value: 4.1,
        unit: 'bar',
        normalRange: [3.5, 5.0],
        lastUpdate: new Date()
      },
      {
        id: '4',
        name: 'Fuel Flow',
        type: 'flow',
        location: 'Fuel System',
        status: 'online',
        value: 125,
        unit: 'L/h',
        normalRange: [100, 150],
        lastUpdate: new Date()
      }
    ]);

    setSchedules([
      {
        id: '1',
        component: 'Main Engine - Port',
        type: 'predictive',
        priority: 'high',
        scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        estimatedHours: 12,
        cost: 8500,
        parts: ['Engine bearing set', 'Gaskets', 'Oil filter'],
        aiGenerated: true
      },
      {
        id: '2',
        component: 'Air Conditioning',
        type: 'preventive',
        priority: 'medium',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        estimatedHours: 4,
        cost: 800,
        parts: ['Air filters', 'Refrigerant'],
        aiGenerated: false
      }
    ]);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSensorStatus = (sensor: IoTSensor) => {
    if (sensor.status === 'offline') return 'offline';
    if (sensor.value < sensor.normalRange[0] || sensor.value > sensor.normalRange[1]) {
      return 'warning';
    }
    return 'online';
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    toast({
      title: "AI Analysis Started",
      description: "Running predictive analysis on all yacht systems...",
    });

    // Simulate AI analysis
    setTimeout(() => {
      // Add a new AI-generated alert
      const newAlert: PredictiveAlert = {
        id: Date.now().toString(),
        component: 'Water Maker',
        severity: 'medium',
        prediction: 'AI detected unusual membrane pressure patterns. Potential clogging developing.',
        confidence: 82,
        estimatedFailureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        recommendedAction: 'Schedule membrane cleaning and inspection',
        costImpact: 1200,
        preventiveMeasures: ['Monitor water quality', 'Check pressure gauges', 'Flush system regularly']
      };

      setAlerts(prev => [newAlert, ...prev]);
      setIsAnalyzing(false);
      
      toast({
        title: "AI Analysis Complete",
        description: "New predictive insights have been generated.",
      });
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Predictive Maintenance
          </CardTitle>
          <CardDescription>
            Machine learning-powered maintenance predictions and IoT monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button 
              onClick={runAIAnalysis} 
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Run AI Analysis
                </>
              )}
            </Button>
            <div className="text-sm text-muted-foreground">
              Last analysis: 2 hours ago
            </div>
          </div>

          <Tabs defaultValue="alerts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="alerts">Predictions</TabsTrigger>
              <TabsTrigger value="sensors">IoT Sensors</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-4">
              <div className="grid gap-4">
                {alerts.map((alert) => (
                  <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{alert.component}</h4>
                          <p className="text-sm mt-1">{alert.prediction}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            {alert.confidence}% confidence
                          </Badge>
                          <div className="text-sm font-medium">
                            Cost Impact: ${alert.costImpact.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <h5 className="font-medium mb-2">Recommended Action</h5>
                          <p className="text-sm">{alert.recommendedAction}</p>
                          <div className="mt-2">
                            <span className="text-sm font-medium">Expected Date: </span>
                            <span className="text-sm">
                              {alert.estimatedFailureDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2">Preventive Measures</h5>
                          <ul className="text-sm space-y-1">
                            {alert.preventiveMeasures.map((measure, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                {measure}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm">Schedule Maintenance</Button>
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm" variant="outline">Dismiss</Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sensors" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sensors.map((sensor) => {
                  const status = getSensorStatus(sensor);
                  const isOutOfRange = sensor.value < sensor.normalRange[0] || sensor.value > sensor.normalRange[1];
                  
                  return (
                    <Card key={sensor.id} className={status === 'warning' ? 'border-orange-200' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{sensor.name}</CardTitle>
                          <Badge 
                            variant={status === 'warning' ? 'destructive' : status === 'offline' ? 'secondary' : 'default'}
                          >
                            {status === 'warning' ? (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            ) : status === 'offline' ? (
                              <Activity className="h-3 w-3 mr-1" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {status}
                          </Badge>
                        </div>
                        <CardDescription>{sensor.location}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold flex items-center justify-center gap-1">
                              {sensor.type === 'temperature' && <Thermometer className="h-5 w-5" />}
                              {sensor.type === 'pressure' && <Gauge className="h-5 w-5" />}
                              {sensor.type === 'vibration' && <Activity className="h-5 w-5" />}
                              {sensor.type === 'electrical' && <Battery className="h-5 w-5" />}
                              {sensor.value} {sensor.unit}
                            </div>
                            {isOutOfRange && (
                              <div className="text-sm text-orange-600 mt-1">
                                Out of normal range
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Normal Range</span>
                              <span>{sensor.normalRange[0]} - {sensor.normalRange[1]} {sensor.unit}</span>
                            </div>
                            <Progress 
                              value={((sensor.value - sensor.normalRange[0]) / (sensor.normalRange[1] - sensor.normalRange[0])) * 100} 
                              className="h-2"
                            />
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Last update: {sensor.lastUpdate.toLocaleTimeString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="grid gap-4">
                {schedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{schedule.component}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {schedule.type}
                          </Badge>
                          <Badge 
                            variant={schedule.priority === 'urgent' || schedule.priority === 'high' ? 'destructive' : 'secondary'}
                          >
                            {schedule.priority}
                          </Badge>
                          {schedule.aiGenerated && (
                            <Badge variant="default">
                              <Brain className="h-3 w-3 mr-1" />
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${schedule.cost.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {schedule.estimatedHours} hours
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Scheduled:</span>
                          <span>{schedule.scheduledDate.toLocaleDateString()}</span>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Required Parts</h4>
                          <div className="flex flex-wrap gap-1">
                            {schedule.parts.map((part, index) => (
                              <Badge key={index} variant="outline">
                                {part}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm">Schedule Now</Button>
                          <Button size="sm" variant="outline">Modify</Button>
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Predictions</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{alerts.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length} high priority
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">IoT Sensors</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{sensors.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {sensors.filter(s => s.status === 'online').length} online
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$24.5K</div>
                    <p className="text-xs text-muted-foreground">
                      Prevented failures this year
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Prediction Accuracy</CardTitle>
                  <CardDescription>AI model performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Engine Components</span>
                      <span>94% accuracy</span>
                    </div>
                    <Progress value={94} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Hydraulic Systems</span>
                      <span>87% accuracy</span>
                    </div>
                    <Progress value={87} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Electrical Systems</span>
                      <span>91% accuracy</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveMaintenance;