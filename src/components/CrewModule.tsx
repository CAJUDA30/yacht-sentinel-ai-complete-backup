import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { 
  Users, 
  UserPlus, 
  Clock, 
  Shield, 
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Star,
  QrCode
} from "lucide-react";

interface CrewMember {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  nationality: string;
  status: "on-duty" | "off-duty" | "shore-leave" | "emergency";
  hoursWorked: number;
  hoursRest: number;
  certificates: string[];
  nextDuty: string;
  performance: number;
  experience: string;
  joinDate: string;
}

const CrewModule = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const crewMembers: CrewMember[] = [
    {
      id: "CREW001",
      name: "Captain James Smith",
      position: "Captain",
      email: "captain@yacht.com",
      phone: "+1-555-0101",
      nationality: "British",
      status: "on-duty",
      hoursWorked: 8,
      hoursRest: 16,
      certificates: ["MCA Master 3000GT", "STCW Advanced"],
      nextDuty: "06:00 Tomorrow",
      performance: 95,
      experience: "15 years",
      joinDate: "2020-03-15"
    },
    {
      id: "CREW002",
      name: "Elena Rodriguez",
      position: "Chief Engineer",
      email: "engineer@yacht.com",
      phone: "+1-555-0102",
      nationality: "Spanish",
      status: "on-duty",
      hoursWorked: 6,
      hoursRest: 18,
      certificates: ["Engineering Officer", "STCW", "MEOL"],
      nextDuty: "14:00 Today",
      performance: 92,
      experience: "12 years",
      joinDate: "2021-01-20"
    },
    {
      id: "CREW003",
      name: "Marcus Thompson",
      position: "First Officer",
      email: "firstofficer@yacht.com",
      phone: "+1-555-0103",
      nationality: "Australian",
      status: "off-duty",
      hoursWorked: 12,
      hoursRest: 12,
      certificates: ["OOW 3000GT", "STCW", "ENG1"],
      nextDuty: "22:00 Today",
      performance: 88,
      experience: "8 years",
      joinDate: "2022-06-10"
    },
    {
      id: "CREW004",
      name: "Sophie Martin",
      position: "Chief Stewardess",
      email: "stewardess@yacht.com",
      phone: "+1-555-0104",
      nationality: "French",
      status: "shore-leave",
      hoursWorked: 0,
      hoursRest: 24,
      certificates: ["Guest Services", "Wine Service", "STCW Basic"],
      nextDuty: "08:00 Monday",
      performance: 96,
      experience: "10 years",
      joinDate: "2019-11-05"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-duty": return "bg-green-500/10 text-green-600 border-green-200";
      case "off-duty": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "shore-leave": return "bg-orange-500/10 text-orange-600 border-orange-200";
      case "emergency": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-duty": return <CheckCircle className="h-4 w-4" />;
      case "off-duty": return <Clock className="h-4 w-4" />;
      case "shore-leave": return <MapPin className="h-4 w-4" />;
      case "emergency": return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const filteredCrew = crewMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || member.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const onDutyCrew = crewMembers.filter(m => m.status === "on-duty").length;
  const avgPerformance = Math.round(crewMembers.reduce((sum, m) => sum + m.performance, 0) / crewMembers.length);
  const restCompliance = Math.round((crewMembers.filter(m => m.hoursRest >= 10).length / crewMembers.length) * 100);

  const handleCrewScan = (productInfo: any, barcode: string) => {
    console.log('Crew document scanned:', { productInfo, barcode });
    // Handle crew certification or ID scanning
  };

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Crew Management
                </h1>
                <p className="text-muted-foreground">
                  Manage crew schedules, certifications, and rest compliance
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="ocean">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Crew Member
            </Button>
            <Button variant="captain">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Duty
            </Button>
            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Scan ID/Cert
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Crew</p>
                  <p className="text-2xl font-bold text-foreground">{crewMembers.length}</p>
                </div>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">On Duty</p>
                  <p className="text-2xl font-bold text-green-600">{onDutyCrew}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                  <p className="text-2xl font-bold text-foreground">{avgPerformance}%</p>
                </div>
                <Star className="h-5 w-5 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rest Compliance</p>
                  <p className="text-2xl font-bold text-foreground">{restCompliance}%</p>
                </div>
                <Shield className="h-5 w-5 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search crew members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                {["all", "on-duty", "off-duty", "shore-leave"].map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                    className="whitespace-nowrap capitalize"
                  >
                    {filter.replace("-", " ")}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crew Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrew.map((member) => (
            <Card 
              key={member.id} 
              className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <CardDescription className="font-medium text-primary">
                      {member.position}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(member.status)} border`}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(member.status)}
                      <span className="capitalize">{member.status.replace("-", " ")}</span>
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hours Worked</span>
                      <span className="font-medium">{member.hoursWorked}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hours Rest</span>
                      <span className={`font-medium ${member.hoursRest >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                        {member.hoursRest}h
                      </span>
                    </div>
                    <Progress 
                      value={(member.hoursRest / 24) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Performance</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={member.performance} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{member.performance}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Certificates</span>
                    <div className="flex flex-wrap gap-1">
                      {member.certificates.slice(0, 2).map((cert, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                      {member.certificates.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.certificates.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                    <Button variant="captain" size="sm" className="flex-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rest Hours Compliance Alert */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>MLC Rest Hours Compliance</span>
            </CardTitle>
            <CardDescription>
              International Maritime Labour Convention requirements monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{restCompliance}%</p>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">10h</p>
                <p className="text-sm text-muted-foreground">Min Rest Required</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">77h</p>
                <p className="text-sm text-muted-foreground">Max Weekly Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barcode Scanner */}
        <BarcodeScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onProductDetected={handleCrewScan}
        />
      </div>
    </div>
  );
};

export default CrewModule;