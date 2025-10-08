import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Camera,
  Cube,
  Eye,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Play,
  Pause,
  StopCircle,
  Settings,
  Star,
  Zap,
  Target,
  BarChart3,
  MapPin,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useARTroubleshooting,
  useEquipmentManagement,
  useARAnchors,
  usePredictiveMaintenance,
  useSensorAnalysis,
  useTroubleshootingInstructions,
  useARCamera,
  Equipment,
  MaintenancePrediction
} from '@/hooks/useARTroubleshooting';

interface ARTroubleshootingDashboardProps {
  yachtId: string;
}

const ARTroubleshootingDashboard: React.FC<ARTroubleshootingDashboardProps> = ({ yachtId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [arViewActive, setArViewActive] = useState(false);
  const { toast } = useToast();

  // AR and maintenance hooks
  const arTroubleshooting = useARTroubleshooting();
  const equipmentMgmt = useEquipmentManagement(yachtId);
  const arAnchors = useARAnchors(yachtId);
  const predictiveMaintenance = usePredictiveMaintenance(yachtId);
  const sensorAnalysis = useSensorAnalysis();
  const troubleshootingInstructions = useTroubleshootingInstructions();
  const arCamera = useARCamera();

  const handleStartARSession = async (equipment?: Equipment, issueDescription?: string) => {
    try {
      if (!arCamera.hasPermission) {
        await arCamera.startCamera();
      }

      const result = await arTroubleshooting.startSession(
        yachtId,
        equipment?.id,
        issueDescription
      );

      setArViewActive(true);
      setSelectedEquipment(equipment || null);

      if (equipment && issueDescription) {
        await troubleshootingInstructions.loadInstructions(equipment.id, issueDescription);
      }
    } catch (error) {
      console.error('Failed to start AR session:', error);
    }
  };

  const handleStopARSession = async () => {
    if (arTroubleshooting.currentSession) {
      await arTroubleshooting.endSession(arTroubleshooting.currentSession.id, false);
    }
    arCamera.stopCamera();
    setArViewActive(false);
    setSelectedEquipment(null);
  };

  const criticalPredictions = predictiveMaintenance.getCriticalPredictions();
  const upcomingMaintenance = predictiveMaintenance.getUpcomingMaintenance(7);
  const maintenanceOverdue = equipmentMgmt.getMaintenanceOverdue();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AR Troubleshooting</h2>
          <p className="text-muted-foreground">
            Advanced AR diagnostics and predictive maintenance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {arViewActive ? (
            <Button onClick={handleStopARSession} variant="destructive">
              <StopCircle className="h-4 w-4 mr-2" />
              Stop AR Session
            </Button>
          ) : (
            <Button onClick={() => handleStartARSession()}>
              <Camera className="h-4 w-4 mr-2" />
              Start AR Session
            </Button>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalPredictions.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Maintenance Alerts</AlertTitle>
          <AlertDescription>
            {criticalPredictions.length} critical issues require immediate attention
            <Button variant="link" className="p-0 h-auto ml-2">
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* AR View */}
      {arViewActive && (
        <ARViewer
          camera={arCamera}
          session={arTroubleshooting.currentSession}
          selectedEquipment={selectedEquipment}
          anchors={arAnchors.anchors}
          instructions={troubleshootingInstructions.instructions}
          onSessionUpdate={arTroubleshooting.updateSession}
        />
      )}

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard
              title="Equipment Health"
              value={`${equipmentMgmt.equipment.filter(eq => eq.health_score >= 80).length}/${equipmentMgmt.equipment.length}`}
              subtitle="Good Health"
              icon={CheckCircle}
              color="green"
            />
            
            <OverviewCard
              title="Critical Alerts"
              value={criticalPredictions.length}
              subtitle="Require Attention"
              icon={AlertTriangle}
              color="red"
            />
            
            <OverviewCard
              title="Overdue Maintenance"
              value={maintenanceOverdue.length}
              subtitle="Past Due"
              icon={Clock}
              color="orange"
            />
            
            <OverviewCard
              title="AR Sessions"
              value="12"
              subtitle="This Month"
              icon={Cube}
              color="blue"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EquipmentHealthCard equipment={equipmentMgmt.equipment} />
            <UpcomingMaintenanceCard predictions={upcomingMaintenance} />
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <EquipmentInventoryCard
            equipment={equipmentMgmt.equipment}
            loading={equipmentMgmt.loading}
            onEquipmentSelect={setSelectedEquipment}
            onStartARSession={handleStartARSession}
          />
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <PredictiveMaintenanceCard
            predictions={predictiveMaintenance.predictions}
            loading={predictiveMaintenance.loading}
            onGeneratePredictions={predictiveMaintenance.generatePredictions}
            onCreateWorkOrder={predictiveMaintenance.createWorkOrder}
          />
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceScheduleCard
            equipment={equipmentMgmt.equipment}
            predictions={predictiveMaintenance.predictions}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsCard equipment={equipmentMgmt.equipment} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// AR Viewer Component
const ARViewer: React.FC<{
  camera: any;
  session: any;
  selectedEquipment: Equipment | null;
  anchors: any[];
  instructions: any[];
  onSessionUpdate: (sessionId: string, data: any) => void;
}> = ({ camera, session, selectedEquipment, anchors, instructions, onSessionUpdate }) => {
  return (
    <Card className="bg-black">
      <CardContent className="p-6">
        <div className="relative">
          {/* Camera Feed */}
          <video
            ref={camera.videoRef}
            className="w-full h-96 object-cover rounded-lg"
            autoPlay
            playsInline
            muted
          />
          
          {/* AR Overlays */}
          <div className="absolute inset-0 pointer-events-none">
            {anchors.map((anchor) => (
              <AROverlay key={anchor.id} anchor={anchor} />
            ))}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
            <div className="text-white bg-black bg-opacity-50 px-3 py-1 rounded">
              {selectedEquipment?.equipment_name || 'General Inspection'}
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" onClick={camera.capturePhoto}>
                <Camera className="h-4 w-4" />
              </Button>
              <Button size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions Panel */}
        {instructions.length > 0 && session && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Step {session.current_step}: {instructions[session.current_step - 1]?.title}</h4>
              <Progress value={(session.steps_completed / session.total_steps) * 100} className="w-32" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {instructions[session.current_step - 1]?.description}
            </p>
            <Button 
              size="sm" 
              onClick={() => onSessionUpdate(session.id, {
                step_completed: true,
                current_step: session.current_step,
                steps_completed: session.steps_completed
              })}
            >
              Complete Step
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// AR Overlay Component
const AROverlay: React.FC<{ anchor: any }> = ({ anchor }) => {
  const style = {
    position: 'absolute' as const,
    left: `${anchor.position_x * 100}%`,
    top: `${anchor.position_y * 100}%`,
    transform: `translate(-50%, -50%) scale(${anchor.scale_factor})`,
  };

  return (
    <div style={style} className="pointer-events-auto">
      {anchor.ar_content_type === 'text_label' && (
        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
          {anchor.anchor_name}
        </div>
      )}
      {anchor.ar_content_type === 'warning_indicator' && (
        <div className="bg-red-500 text-white p-2 rounded-full">
          <AlertTriangle className="h-4 w-4" />
        </div>
      )}
      {anchor.ar_content_type === 'diagnostic_data' && (
        <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
          <Target className="h-3 w-3 inline mr-1" />
          Check Point
        </div>
      )}
    </div>
  );
};

// Overview Card Component
const OverviewCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, subtitle, icon: Icon, color }) => {
  const colorClasses = {
    green: 'text-green-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
    blue: 'text-blue-500'
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
      </CardContent>
    </Card>
  );
};

// Equipment Health Card Component
const EquipmentHealthCard: React.FC<{ equipment: Equipment[] }> = ({ equipment }) => {
  const healthDistribution = equipment.reduce((acc, eq) => {
    const score = eq.health_score || 0;
    if (score >= 80) acc.good++;
    else if (score >= 60) acc.fair++;
    else if (score >= 40) acc.poor++;
    else acc.critical++;
    return acc;
  }, { good: 0, fair: 0, poor: 0, critical: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Equipment Health Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Good (80-100%)</span>
            <Badge variant="default">{healthDistribution.good}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Fair (60-79%)</span>
            <Badge variant="secondary">{healthDistribution.fair}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Poor (40-59%)</span>
            <Badge variant="outline">{healthDistribution.poor}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Critical (0-39%)</span>
            <Badge variant="destructive">{healthDistribution.critical}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Upcoming Maintenance Card Component
const UpcomingMaintenanceCard: React.FC<{ predictions: MaintenancePrediction[] }> = ({ predictions }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Maintenance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {predictions.slice(0, 4).map((prediction) => (
            <div key={prediction.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{prediction.equipment?.equipment_name}</p>
                <p className="text-xs text-muted-foreground">{prediction.recommended_action}</p>
              </div>
              <Badge variant={prediction.risk_level === 'critical' ? 'destructive' : 'outline'}>
                {prediction.risk_level}
              </Badge>
            </div>
          ))}
          
          {predictions.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No upcoming maintenance scheduled
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Equipment Inventory Card (simplified)
const EquipmentInventoryCard: React.FC<{
  equipment: Equipment[];
  loading: boolean;
  onEquipmentSelect: (equipment: Equipment) => void;
  onStartARSession: (equipment: Equipment, issue?: string) => void;
}> = ({ equipment, loading, onEquipmentSelect, onStartARSession }) => {
  if (loading) {
    return <div className="text-center py-8">Loading equipment...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {equipment.map((eq) => (
            <div key={eq.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <h4 className="font-medium">{eq.equipment_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {eq.equipment_type} • {eq.location_description}
                </p>
                {eq.health_score && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">Health:</span>
                    <Progress value={eq.health_score} className="w-20 h-2" />
                    <span className="text-xs">{eq.health_score.toFixed(0)}%</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={eq.operational_status === 'operational' ? 'default' : 'destructive'}>
                  {eq.operational_status}
                </Badge>
                <Button size="sm" onClick={() => onStartARSession(eq)}>
                  <Cube className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Additional components (simplified for brevity)
const PredictiveMaintenanceCard: React.FC<any> = ({ predictions, loading }) => (
  <Card>
    <CardHeader>
      <CardTitle>Predictive Maintenance</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Predictive maintenance interface would go here</p>
    </CardContent>
  </Card>
);

const MaintenanceScheduleCard: React.FC<any> = ({ equipment, predictions }) => (
  <Card>
    <CardHeader>
      <CardTitle>Maintenance Schedule</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Maintenance schedule would go here</p>
    </CardContent>
  </Card>
);

const AnalyticsCard: React.FC<any> = ({ equipment }) => (
  <Card>
    <CardHeader>
      <CardTitle>Analytics</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Analytics and insights would go here</p>
    </CardContent>
  </Card>
);

export default ARTroubleshootingDashboard;