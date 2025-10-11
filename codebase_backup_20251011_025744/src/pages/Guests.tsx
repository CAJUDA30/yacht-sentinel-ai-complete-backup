import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users as GuestIcon, Wine } from "lucide-react";

const Guests = () => {
  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <GuestIcon className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Guest Management</h1>
            <p className="text-muted-foreground">VIP guest services and preferences</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Bookings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Guest booking management and scheduling</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GuestIcon className="h-5 w-5" />
                <span>Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Guest preference tracking and personalization</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wine className="h-5 w-5" />
                <span>Concierge</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>AI-powered concierge services and recommendations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Guests;