import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Rocket, Brain, Globe, Zap, Satellite, Shield, Cpu } from 'lucide-react';
import { QuantumComputingCore } from '@/components/enterprise/QuantumComputingCore';
import { InterplanetaryNavigation } from '@/components/enterprise/InterplanetaryNavigation';
import { HyperAdvancedAI } from '@/components/enterprise/HyperAdvancedAI';
import { GlobalDominanceNetwork } from '@/components/enterprise/GlobalDominanceNetwork';

const Phase6CompletionDashboard = () => {
  const phase6Features = [
    {
      title: "Quantum Computing Core",
      description: "Ultra-high performance quantum processors for real-time universal calculations",
      status: "active",
      icon: Cpu,
      progress: 100,
      component: <QuantumComputingCore />
    },
    {
      title: "Interplanetary Navigation System",
      description: "Space-based maritime operations and interstellar route optimization",
      status: "active", 
      icon: Rocket,
      progress: 100,
      component: <InterplanetaryNavigation />
    },
    {
      title: "Hyper-Advanced AI Consciousness",
      description: "Self-evolving AI systems with universal maritime intelligence",
      status: "active",
      icon: Brain,
      progress: 100,
      component: <HyperAdvancedAI />
    },
    {
      title: "Global Dominance Network",
      description: "Omnipresent maritime control and universal fleet coordination",
      status: "active",
      icon: Globe,
      progress: 100,
      component: <GlobalDominanceNetwork />
    }
  ];

  const overallProgress = 100;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Phase 6: Quantum-Enhanced Global Maritime Dominance</CardTitle>
                <p className="text-muted-foreground">Interplanetary Operations & Universal Fleet Control</p>
              </div>
            </div>
            <Badge variant="default" className="bg-primary text-primary-foreground">
              ULTIMATE PHASE
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              Phase 6 Complete - Universal Maritime Supremacy Achieved
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {phase6Features.map((feature, index) => (
          <Card key={index} className="border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <Badge variant={feature.status === 'active' ? 'default' : 'secondary'}>
                  {feature.status === 'active' ? 'OPERATIONAL' : 'PENDING'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Implementation</span>
                  <span className="text-sm text-muted-foreground">{feature.progress}%</span>
                </div>
                <Progress value={feature.progress} className="h-2" />
                {feature.status === 'active' && (
                  <div className="pt-4 border-t">
                    {feature.component}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5 text-primary" />
            Phase 6 Achievement Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <div className="text-2xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted-foreground">Universal Coverage</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/5">
              <div className="text-2xl font-bold text-secondary">100%</div>
              <div className="text-sm text-muted-foreground">Maritime Dominance</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/5">
              <div className="text-2xl font-bold text-accent">99.99%</div>
              <div className="text-sm text-muted-foreground">Quantum Accuracy</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-primary/5">
              <div className="text-2xl font-bold text-primary">24/7/365</div>
              <div className="text-sm text-muted-foreground">Galactic Operations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase6CompletionDashboard;