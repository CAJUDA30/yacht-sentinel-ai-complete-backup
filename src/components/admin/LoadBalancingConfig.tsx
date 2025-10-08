import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrchestrationEngine } from '@/hooks/useOrchestrationEngine';
import { LoadBalancingConfig as LoadBalancingConfigType } from '@/types/orchestration';

export const LoadBalancingConfig: React.FC = () => {
  const { toast } = useToast();
  const { updateLoadBalancing } = useOrchestrationEngine();

  const [config, setConfig] = useState<LoadBalancingConfigType>({
    strategy: 'performance',
    weights: {
      'performance': 0.4,
      'cost': 0.3,
      'latency': 0.3
    },
    health_check_interval: 60,
    failure_threshold: 3,
    recovery_threshold: 2
  });

  const handleSave = async () => {
    try {
      await updateLoadBalancing.mutateAsync(config);
      toast({
        title: 'Load balancing updated',
        description: 'Configuration saved successfully'
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: String(error),
        variant: 'destructive'
      });
    }
  };

  const handleReset = () => {
    setConfig({
      strategy: 'performance',
      weights: {
        'performance': 0.4,
        'cost': 0.3,
        'latency': 0.3
      },
      health_check_interval: 60,
      failure_threshold: 3,
      recovery_threshold: 2
    });
  };

  const updateWeight = (metric: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [metric]: value / 100
      }
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Load Balancing Configuration
          <Badge variant="outline">{config.strategy.replace('_', ' ')}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="strategy">Balancing Strategy</Label>
          <Select
            value={config.strategy}
            onValueChange={(value: LoadBalancingConfigType['strategy']) => 
              setConfig(prev => ({ ...prev, strategy: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">Round Robin</SelectItem>
              <SelectItem value="weighted">Weighted Distribution</SelectItem>
              <SelectItem value="performance">Performance Based</SelectItem>
              <SelectItem value="cost">Cost Optimized</SelectItem>
              <SelectItem value="latency">Latency Optimized</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.strategy === 'weighted' && (
          <div className="space-y-4">
            <Label>Weight Distribution</Label>
            {Object.entries(config.weights || {}).map(([metric, weight]) => (
              <div key={metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="capitalize">{metric}</Label>
                  <Badge variant="outline">{Math.round(weight * 100)}%</Badge>
                </div>
                <Slider
                  value={[weight * 100]}
                  onValueChange={([value]) => updateWeight(metric, value)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="health_interval">Health Check Interval (seconds)</Label>
            <Input
              id="health_interval"
              type="number"
              value={config.health_check_interval}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                health_check_interval: parseInt(e.target.value) 
              }))}
            />
          </div>
          <div>
            <Label htmlFor="failure_threshold">Failure Threshold</Label>
            <Input
              id="failure_threshold"
              type="number"
              value={config.failure_threshold}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                failure_threshold: parseInt(e.target.value) 
              }))}
            />
          </div>
          <div>
            <Label htmlFor="recovery_threshold">Recovery Threshold</Label>
            <Input
              id="recovery_threshold"
              type="number"
              value={config.recovery_threshold}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                recovery_threshold: parseInt(e.target.value) 
              }))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={updateLoadBalancing.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateLoadBalancing.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};