import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Clock } from "lucide-react";

const Logbook = () => {
  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Digital Logbook</h1>
            <p className="text-muted-foreground">Electronic logging with anomaly detection</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Engine Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Automated engine performance logging with AI anomaly detection</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Navigation Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Automatic position and navigation data recording</p>
            </CardContent>
          </Card>
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Watch Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Crew watch schedules and duty logs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Logbook;