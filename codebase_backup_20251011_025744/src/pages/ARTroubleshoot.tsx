import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Smartphone, Wrench } from "lucide-react";

const ARTroubleshoot = () => {
  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <Camera className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">AR Troubleshooting</h1>
            <p className="text-muted-foreground">Augmented reality maintenance assistance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Equipment Recognition</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>AI-powered equipment identification through camera</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>AR Overlays</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Step-by-step maintenance instructions overlaid on real equipment</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5" />
                <span>Remote Assistance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Real-time expert guidance through AR annotations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ARTroubleshoot;