import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus, Users, Clock } from "lucide-react";

const ChecklistsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <CheckSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Checklists</h1>
            <p className="text-muted-foreground">Operational procedures and safety checklists</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>Pre-Departure</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Essential safety and operational checks before departure</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Crew Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Daily crew responsibilities and task assignments</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Maintenance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Scheduled maintenance checks and procedures</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChecklistsPage;