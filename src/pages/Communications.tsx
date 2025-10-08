import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Phone, Mail } from "lucide-react";

const Communications = () => {
  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <MessageSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Communications</h1>
            <p className="text-muted-foreground">Integrated communication systems</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>WhatsApp Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Automated WhatsApp notifications for crew and suppliers</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Email Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Automated email templates and notifications</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Satellite Communications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Integration with satellite communication systems</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Communications;