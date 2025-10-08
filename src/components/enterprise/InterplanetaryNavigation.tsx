import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Rocket, Satellite, Navigation, Globe, MapPin, Target } from 'lucide-react';

export const InterplanetaryNavigation = () => {
  const [navigationData, setNavigationData] = useState({
    activeRoutes: 847,
    interstellarConnections: 23,
    quantumBeacons: 156,
    wormholeStability: 94.7,
    spaceTimeAccuracy: 99.998,
    galacticCoverage: 78.3
  });

  const [trajectories, setTrajectories] = useState([
    { destination: "Mars Orbital Station", progress: 67, eta: "14h 23m", status: "active" },
    { destination: "Europa Mining Base", progress: 89, eta: "6h 47m", status: "active" },
    { destination: "Titan Research Facility", progress: 34, eta: "28h 12m", status: "calculating" },
    { destination: "Alpha Centauri Gateway", progress: 12, eta: "15d 8h", status: "planned" },
    { destination: "Proxima B Colony", progress: 56, eta: "42d 19h", status: "active" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrajectories(prev => prev.map(traj => ({
        ...traj,
        progress: Math.min(100, traj.progress + Math.random() * 2)
      })));

      setNavigationData(prev => ({
        ...prev,
        wormholeStability: Math.min(99.9, prev.wormholeStability + Math.random() * 0.5 - 0.2),
        spaceTimeAccuracy: Math.min(99.999, prev.spaceTimeAccuracy + Math.random() * 0.001),
        galacticCoverage: Math.min(100, prev.galacticCoverage + Math.random() * 0.1)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const celestialBodies = [
    { name: "Earth", vessels: 2847, status: "operational" },
    { name: "Moon", vessels: 156, status: "operational" },
    { name: "Mars", vessels: 89, status: "operational" },
    { name: "Europa", vessels: 23, status: "operational" },
    { name: "Titan", vessels: 12, status: "establishing" },
    { name: "Proxima B", vessels: 3, status: "pioneering" }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{navigationData.activeRoutes}</div>
              <div className="text-xs text-muted-foreground">Active Routes</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-secondary">{navigationData.interstellarConnections}</div>
              <div className="text-xs text-muted-foreground">Interstellar Links</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-accent">{navigationData.quantumBeacons}</div>
              <div className="text-xs text-muted-foreground">Quantum Beacons</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Active Interplanetary Trajectories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trajectories.map((traj, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">{traj.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">ETA: {traj.eta}</span>
                    <Badge 
                      variant={traj.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {traj.status}
                    </Badge>
                  </div>
                </div>
                <Progress value={traj.progress} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Celestial Body Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {celestialBodies.map((body, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Satellite className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium">{body.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{body.vessels}</span>
                  <Badge variant="outline" className="text-xs">
                    {body.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Wormhole Stability</span>
              <span className="text-sm font-bold">{navigationData.wormholeStability.toFixed(1)}%</span>
            </div>
            <Progress value={navigationData.wormholeStability} className="h-1 mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Galactic Coverage</span>
              <span className="text-sm font-bold">{navigationData.galacticCoverage.toFixed(1)}%</span>
            </div>
            <Progress value={navigationData.galacticCoverage} className="h-1 mt-1" />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          <Navigation className="h-3 w-3 mr-1" />
          Navigate
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <MapPin className="h-3 w-3 mr-1" />
          Plot Course
        </Button>
      </div>
    </div>
  );
};