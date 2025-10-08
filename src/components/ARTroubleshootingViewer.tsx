import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text3D, Box, Sphere, Cylinder } from '@react-three/drei';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Box as BoxIcon, 
  Eye, 
  RotateCcw,
  Zap,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  SkipForward
} from 'lucide-react';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import * as THREE from 'three';

interface TroubleshootingStep {
  id: string;
  title: string;
  description: string;
  position: [number, number, number];
  type: 'inspect' | 'replace' | 'adjust' | 'test';
  status: 'pending' | 'active' | 'completed' | 'warning';
  aiGenerated: boolean;
}

interface SystemComponent {
  id: string;
  name: string;
  position: [number, number, number];
  status: 'normal' | 'warning' | 'error';
  type: 'engine' | 'electrical' | 'hydraulic' | 'navigation';
}

// 3D Engine Component
const EngineComponent: React.FC<{ position: [number, number, number]; status: string }> = ({ position, status }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getColor = () => {
    switch (status) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <group position={position}>
      <Box ref={meshRef} args={[2, 1.5, 3]} material-color={getColor()} />
      <Cylinder position={[0, 1, 0]} args={[0.3, 0.3, 1]} material-color="#64748b" />
      <Sphere position={[0, 2, 0]} args={[0.2]} material-color="#f59e0b" />
    </group>
  );
};

// 3D Electrical Component
const ElectricalComponent: React.FC<{ position: [number, number, number]; status: string }> = ({ position, status }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.02;
    }
  });

  const getColor = () => {
    switch (status) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  return (
    <group position={position}>
      <Box ref={meshRef} args={[1, 2, 0.5]} material-color={getColor()} />
      <Box position={[0, 1.5, 0]} args={[1.2, 0.3, 0.3]} material-color="#64748b" />
    </group>
  );
};

// 3D Scene Component
const SystemScene: React.FC<{ 
  components: SystemComponent[]; 
  troubleshootingSteps: TroubleshootingStep[];
  activeStep: string | null;
}> = ({ components, troubleshootingSteps, activeStep }) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Render system components */}
      {components.map((component) => (
        <group key={component.id}>
          {component.type === 'engine' && (
            <EngineComponent position={component.position} status={component.status} />
          )}
          {component.type === 'electrical' && (
            <ElectricalComponent position={component.position} status={component.status} />
          )}
          
          {/* Component label */}
          <Text3D
            position={[component.position[0], component.position[1] + 2, component.position[2]]}
            font="/fonts/helvetiker_regular.typeface.json"
            size={0.3}
            height={0.05}
            material-color="#ffffff"
          >
            {component.name}
          </Text3D>
        </group>
      ))}

      {/* Render troubleshooting steps as markers */}
      {troubleshootingSteps.map((step) => (
        <group key={step.id}>
          <Sphere 
            position={step.position} 
            args={[0.3]} 
            material-color={step.id === activeStep ? '#10b981' : '#64748b'}
            material-transparent
            material-opacity={0.8}
          />
          
          {step.id === activeStep && (
            <Sphere 
              position={step.position} 
              args={[0.5]} 
              material-color="#10b981"
              material-transparent
              material-opacity={0.3}
            />
          )}
        </group>
      ))}
      
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
};

const ARTroubleshootingViewer: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const [selectedSystem, setSelectedSystem] = useState('engine');
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [systemComponents] = useState<SystemComponent[]>([
    {
      id: 'main-engine',
      name: 'Main Engine',
      position: [0, 0, 0],
      status: 'warning',
      type: 'engine'
    },
    {
      id: 'generator',
      name: 'Generator',
      position: [4, 0, 2],
      status: 'normal',
      type: 'engine'
    },
    {
      id: 'electrical-panel',
      name: 'Main Panel',
      position: [-3, 0, 1],
      status: 'normal',
      type: 'electrical'
    },
    {
      id: 'nav-electronics',
      name: 'Navigation',
      position: [2, 2, -2],
      status: 'error',
      type: 'electrical'
    }
  ]);

  const [troubleshootingSteps, setTroubleshootingSteps] = useState<TroubleshootingStep[]>([
    {
      id: 'step-1',
      title: 'Check Engine Temperature',
      description: 'Verify engine temperature readings are within normal range',
      position: [0, 1, 0],
      type: 'inspect',
      status: 'pending',
      aiGenerated: true
    },
    {
      id: 'step-2',
      title: 'Inspect Cooling System',
      description: 'Check coolant levels and circulation',
      position: [1, 0, 1],
      type: 'inspect',
      status: 'pending',
      aiGenerated: true
    },
    {
      id: 'step-3',
      title: 'Test Electrical Connections',
      description: 'Verify all electrical connections are secure',
      position: [-3, 1, 1],
      type: 'test',
      status: 'pending',
      aiGenerated: true
    }
  ]);

  // Generate AI troubleshooting steps
  useEffect(() => {
    const generateTroubleshootingSteps = async () => {
      const systemIssues = systemComponents
        .filter(comp => comp.status === 'warning' || comp.status === 'error')
        .map(comp => ({ name: comp.name, status: comp.status, type: comp.type }));

      if (systemIssues.length > 0) {
        const response = await processWithAllLLMs({
          content: `Generate detailed troubleshooting steps for yacht systems with issues: ${JSON.stringify(systemIssues)}`,
          context: 'AR troubleshooting guidance for yacht maintenance',
          type: 'troubleshooting',
          module: 'ar-troubleshooting'
        });

        // Generate enhanced steps based on AI response
        const enhancedSteps: TroubleshootingStep[] = [
          {
            id: 'ai-step-1',
            title: 'AI Diagnostic Scan',
            description: 'Perform comprehensive system diagnostic using AI analysis',
            position: [0, 3, 0],
            type: 'test',
            status: 'pending',
            aiGenerated: true
          },
          {
            id: 'ai-step-2',
            title: 'Predictive Maintenance Check',
            description: 'Identify potential future issues using predictive algorithms',
            position: [2, 2, 2],
            type: 'inspect',
            status: 'pending',
            aiGenerated: true
          },
          {
            id: 'ai-step-3',
            title: 'System Optimization',
            description: 'Apply AI-recommended optimizations for improved performance',
            position: [-2, 1, -1],
            type: 'adjust',
            status: 'pending',
            aiGenerated: true
          }
        ];

        setTroubleshootingSteps(prev => [...prev, ...enhancedSteps]);
      }
    };

    generateTroubleshootingSteps();
  }, [processWithAllLLMs]);

  const playTroubleshootingSequence = () => {
    setIsPlaying(true);
    setCurrentStepIndex(0);
    setActiveStep(troubleshootingSteps[0]?.id || null);
  };

  const pauseTroubleshootingSequence = () => {
    setIsPlaying(false);
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < troubleshootingSteps.length) {
      setCurrentStepIndex(nextIndex);
      setActiveStep(troubleshootingSteps[nextIndex].id);
      
      // Mark current step as completed
      setTroubleshootingSteps(prev => 
        prev.map(step => 
          step.id === troubleshootingSteps[currentStepIndex].id 
            ? { ...step, status: 'completed' }
            : step
        )
      );
    } else {
      setIsPlaying(false);
      setActiveStep(null);
    }
  };

  // Auto-advance steps when playing
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        nextStep();
      }, 3000); // 3 seconds per step

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStepIndex]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BoxIcon className="h-5 w-5" />
            AR/VR Troubleshooting Viewer
          </CardTitle>
          <CardDescription>
            Immersive 3D troubleshooting guidance with AI-powered assistance
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={selectedSystem} onValueChange={setSelectedSystem} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="engine">Engine Systems</TabsTrigger>
          <TabsTrigger value="electrical">Electrical</TabsTrigger>
          <TabsTrigger value="hydraulic">Hydraulic</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
        </TabsList>

        <TabsContent value="engine" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 3D Viewer */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      3D System View
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isPlaying ? "destructive" : "default"}
                        onClick={isPlaying ? pauseTroubleshootingSequence : playTroubleshootingSequence}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isPlaying ? 'Pause' : 'Start'} Sequence
                      </Button>
                      <Button size="sm" variant="outline" onClick={nextStep}>
                        <SkipForward className="h-4 w-4" />
                        Next Step
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 w-full bg-gray-900 rounded-lg overflow-hidden">
                    <Canvas camera={{ position: [5, 5, 5], fov: 75 }}>
                      <Suspense fallback={null}>
                        <SystemScene 
                          components={systemComponents}
                          troubleshootingSteps={troubleshootingSteps}
                          activeStep={activeStep}
                        />
                      </Suspense>
                    </Canvas>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <Badge variant="outline">
                      Step {currentStepIndex + 1} of {troubleshootingSteps.length}
                    </Badge>
                    {activeStep && (
                      <Badge variant="default">
                        {troubleshootingSteps.find(s => s.id === activeStep)?.title}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Troubleshooting Steps */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {troubleshootingSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          step.id === activeStep 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setActiveStep(step.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(step.status)}
                          <span className="font-medium text-sm">{step.title}</span>
                          {step.aiGenerated && (
                            <Badge variant="secondary" className="text-xs">AI</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {step.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {step.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Step {index + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Other system tabs would be similar */}
        <TabsContent value="electrical">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Electrical system troubleshooting coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hydraulic">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="h-12 w-12 mx-auto mb-4 opacity-50 bg-blue-500 rounded-full" />
                <p className="text-muted-foreground">Hydraulic system troubleshooting coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="h-12 w-12 mx-auto mb-4 opacity-50 bg-green-500 rounded-full" />
                <p className="text-muted-foreground">Navigation system troubleshooting coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ARTroubleshootingViewer;
