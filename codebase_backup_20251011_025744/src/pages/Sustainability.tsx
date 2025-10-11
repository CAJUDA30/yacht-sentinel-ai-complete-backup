import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Battery, TrendingDown } from "lucide-react";

const Sustainability = () => {
  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Sustainability Tracking</h1>
            <p className="text-muted-foreground">ESG compliance and environmental monitoring</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5" />
                <span>Carbon Footprint</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Real-time carbon emissions tracking and reduction strategies</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Battery className="h-5 w-5" />
                <span>Hybrid Systems</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Electric propulsion and fuel cell monitoring</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Leaf className="h-5 w-5" />
                <span>ESG Reporting</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Environmental, Social, and Governance reporting</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sustainability;