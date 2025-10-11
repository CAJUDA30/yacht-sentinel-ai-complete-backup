import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Box, DollarSign } from "lucide-react";

const DigitalTwin = () => {
  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <Smartphone className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Digital Twin Marketplace</h1>
            <p className="text-muted-foreground">Blockchain-verified digital yacht twins</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Box className="h-5 w-5" />
                <span>3D Yacht Models</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>High-fidelity 3D digital representations of yacht systems</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Blockchain Verification</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Secure, immutable records of yacht specifications and history</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Digital Trading</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Marketplace for trading verified digital yacht assets</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;