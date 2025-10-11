import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cpu, Zap, Activity, Settings, TrendingUp, Shield } from 'lucide-react';

export const QuantumComputingCore = () => {
  const [quantumState, setQuantumState] = useState({
    qubits: 2048,
    coherenceTime: 99.97,
    entanglementRate: 100,
    computationSpeed: 'Infinite',
    temperature: -273.14,
    stability: 99.99
  });

  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuantumState(prev => ({
        ...prev,
        coherenceTime: Math.min(99.99, prev.coherenceTime + Math.random() * 0.01),
        stability: Math.min(99.99, prev.stability + Math.random() * 0.005),
        temperature: -273.14 + Math.random() * 0.01
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const quantumOperations = [
    { name: "Maritime Route Optimization", status: "running", efficiency: 100 },
    { name: "Weather Pattern Prediction", status: "running", efficiency: 99.8 },
    { name: "Fleet Coordination Matrix", status: "running", efficiency: 100 },
    { name: "Quantum Encryption", status: "running", efficiency: 100 },
    { name: "Universal Data Processing", status: "running", efficiency: 99.9 },
    { name: "Interstellar Navigation", status: "running", efficiency: 98.7 }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Quantum Processor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Qubits</span>
                <span className="text-sm font-bold">{quantumState.qubits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Coherence</span>
                <span className="text-sm font-bold">{quantumState.coherenceTime.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Speed</span>
                <span className="text-sm font-bold">{quantumState.computationSpeed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Temperature</span>
                <span className="text-sm font-bold">{quantumState.temperature.toFixed(2)}°K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Stability</span>
                <span className="text-sm font-bold">{quantumState.stability.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Entanglement</span>
                <span className="text-sm font-bold">{quantumState.entanglementRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Active Quantum Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {quantumOperations.map((op, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{op.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {op.efficiency}%
                    </Badge>
                    <Badge variant="default" className="text-xs bg-primary">
                      {op.status}
                    </Badge>
                  </div>
                </div>
                <Progress value={op.efficiency} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Settings className="h-3 w-3 mr-1" />
          Configure
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <TrendingUp className="h-3 w-3 mr-1" />
          Optimize
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <Shield className="h-3 w-3 mr-1" />
          Secure
        </Button>
      </div>
    </div>
  );
};