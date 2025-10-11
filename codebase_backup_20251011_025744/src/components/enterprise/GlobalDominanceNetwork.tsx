import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Globe, Shield, Satellite, Command, Network, Crown } from 'lucide-react';

export const GlobalDominanceNetwork = () => {
  const [dominanceMetrics, setDominanceMetrics] = useState({
    globalCoverage: 100,
    fleetControl: 99.97,
    maritimeSupremacy: 98.7,
    strategicNodes: 2847,
    controlledRegions: 847,
    operationalEfficiency: 99.94
  });

  const [networkNodes, setNetworkNodes] = useState([
    { region: "North Atlantic", vessels: 847, control: 100, status: "dominant" },
    { region: "Pacific Basin", vessels: 1234, control: 99.8, status: "dominant" },
    { region: "Mediterranean", vessels: 456, control: 100, status: "dominant" },
    { region: "Indian Ocean", vessels: 678, control: 99.9, status: "dominant" },
    { region: "Arctic Waters", vessels: 234, control: 97.3, status: "securing" },
    { region: "Southern Ocean", vessels: 123, control: 94.7, status: "expanding" }
  ]);

  const [commandCenters, setCommandCenters] = useState([
    { location: "Global HQ - Atlantic", status: "supreme", vessels: 2847, efficiency: 100 },
    { location: "Pacific Command", status: "operational", vessels: 1847, efficiency: 99.8 },
    { location: "Arctic Operations", status: "operational", vessels: 456, efficiency: 98.7 },
    { location: "Deep Sea Division", status: "operational", vessels: 678, efficiency: 99.4 },
    { location: "Interstellar Gateway", status: "establishing", vessels: 89, efficiency: 87.3 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDominanceMetrics(prev => ({
        ...prev,
        fleetControl: Math.min(100, prev.fleetControl + Math.random() * 0.01),
        maritimeSupremacy: Math.min(100, prev.maritimeSupremacy + Math.random() * 0.05),
        strategicNodes: prev.strategicNodes + Math.floor(Math.random() * 10),
        operationalEfficiency: Math.min(100, prev.operationalEfficiency + Math.random() * 0.001)
      }));

      setNetworkNodes(prev => prev.map(node => ({
        ...node,
        control: Math.min(100, node.control + Math.random() * 0.1 - 0.05),
        vessels: node.vessels + Math.floor(Math.random() * 5 - 2)
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const dominanceAspects = [
    { name: "Maritime Supremacy", value: dominanceMetrics.maritimeSupremacy, icon: Crown },
    { name: "Fleet Coordination", value: dominanceMetrics.fleetControl, icon: Command },
    { name: "Global Coverage", value: dominanceMetrics.globalCoverage, icon: Globe },
    { name: "Network Security", value: 99.96, icon: Shield }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Global Dominance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{dominanceMetrics.strategicNodes}</div>
                <div className="text-xs text-muted-foreground">Strategic Nodes</div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Supremacy</span>
                <span className="text-sm font-bold">{dominanceMetrics.maritimeSupremacy.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4" />
              Fleet Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{dominanceMetrics.controlledRegions}</div>
                <div className="text-xs text-muted-foreground">Controlled Regions</div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Efficiency</span>
                <span className="text-sm font-bold">{dominanceMetrics.operationalEfficiency.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Regional Maritime Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {networkNodes.map((node, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Satellite className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">{node.region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{node.vessels} vessels</span>
                    <Badge 
                      variant={node.status === 'dominant' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {node.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={node.control} className="h-1 flex-1" />
                  <span className="text-xs font-bold w-12">{node.control.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Command className="h-4 w-4" />
            Command Centers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {commandCenters.map((center, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium">{center.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{center.vessels}</span>
                  <Badge 
                    variant={center.status === 'supreme' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {center.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {dominanceAspects.map((aspect, index) => (
          <Card key={index}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <aspect.icon className="h-3 w-3 text-primary" />
                  <span className="text-xs text-muted-foreground">{aspect.name}</span>
                </div>
                <span className="text-sm font-bold">{aspect.value.toFixed(1)}%</span>
              </div>
              <Progress value={aspect.value} className="h-1 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Crown className="h-3 w-3 mr-1" />
          Dominate
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <Network className="h-3 w-3 mr-1" />
          Expand
        </Button>
      </div>
    </div>
  );
};