import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Save, Users, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrchestrationEngine } from '@/hooks/useOrchestrationEngine';
import { ConsensusConfig as ConsensusConfigType } from '@/types/orchestration';

export const ConsensusConfig: React.FC = () => {
  const { toast } = useToast();
  const { updateConsensus } = useOrchestrationEngine();

  const [config, setConfig] = useState<ConsensusConfigType>({
    enabled: false,
    min_models: 2,
    max_models: 4,
    confidence_threshold: 0.8,
    disagreement_handling: 'majority',
    similarity_threshold: 0.7
  });

  const handleSave = async () => {
    try {
      await updateConsensus.mutateAsync(config);
      toast({
        title: 'Consensus updated',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Consensus Configuration
          <Badge variant={config.enabled ? 'default' : 'secondary'}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
          />
          <Label>Enable Multi-Model Consensus</Label>
        </div>

        {config.enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_models">Minimum Models</Label>
                <Select
                  value={config.min_models.toString()}
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    min_models: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Models</SelectItem>
                    <SelectItem value="3">3 Models</SelectItem>
                    <SelectItem value="4">4 Models</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="max_models">Maximum Models</Label>
                <Select
                  value={config.max_models.toString()}
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    max_models: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Models</SelectItem>
                    <SelectItem value="4">4 Models</SelectItem>
                    <SelectItem value="5">5 Models</SelectItem>
                    <SelectItem value="6">6 Models</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Confidence Threshold</Label>
                  <Badge variant="outline">{Math.round(config.confidence_threshold * 100)}%</Badge>
                </div>
                <Slider
                  value={[config.confidence_threshold * 100]}
                  onValueChange={([value]) => setConfig(prev => ({ 
                    ...prev, 
                    confidence_threshold: value / 100 
                  }))}
                  max={100}
                  min={50}
                  step={5}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Similarity Threshold</Label>
                  <Badge variant="outline">{Math.round(config.similarity_threshold * 100)}%</Badge>
                </div>
                <Slider
                  value={[config.similarity_threshold * 100]}
                  onValueChange={([value]) => setConfig(prev => ({ 
                    ...prev, 
                    similarity_threshold: value / 100 
                  }))}
                  max={100}
                  min={30}
                  step={5}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="disagreement_handling">Disagreement Resolution</Label>
              <Select
                value={config.disagreement_handling}
                onValueChange={(value: ConsensusConfigType['disagreement_handling']) => 
                  setConfig(prev => ({ ...prev, disagreement_handling: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="majority">Majority Vote</SelectItem>
                  <SelectItem value="weighted">Weighted Average</SelectItem>
                  <SelectItem value="primary">Primary Model Wins</SelectItem>
                  <SelectItem value="human_review">Human Review Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Consensus Process</h4>
                  <p className="text-sm text-muted-foreground">
                    When enabled, {config.min_models}-{config.max_models} models will process each request. 
                    Results will be compared and consensus reached using {config.disagreement_handling} method.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={updateConsensus.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateConsensus.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};