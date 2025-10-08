import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Ship, BarChart } from "lucide-react";

const Fleet = () => {
  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <Globe className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Fleet Management</h1>
            <p className="text-muted-foreground">Multi-yacht fleet operations and monitoring</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Ship className="h-5 w-5" />
                <span>Fleet Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Centralized monitoring of multiple yacht operations</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart className="h-5 w-5" />
                <span>Performance Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Cross-fleet performance analytics and benchmarking</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Global Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Real-time location tracking for entire fleet</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Fleet;