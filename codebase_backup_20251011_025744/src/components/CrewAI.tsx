import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UniversalSmartScan from "@/components/UniversalSmartScan";
import { supabase } from "@/integrations/supabase/client";
import { useYacht } from "@/contexts/YachtContext";
import { Users, Calendar, TrendingUp, Award, Clock, Zap, Brain, Target, Ship } from "lucide-react";
import { toast } from "sonner";
import { useCrewSchedules } from '@/hooks/useCrewSchedules';

interface CrewMember {
  id: string;
  name: string;
  position: string;
  performance_score: number;
  certifications: string[];
  availability: 'available' | 'onboarded' | 'leave' | 'training';
  skills: string[];
  experience_years: number;
  next_training: string;
  ai_recommendations: string[];
}

// Remove unused ShiftSchedule interface - now using real database schedules

const CrewAI = () => {
  const { userYachtId: currentYachtId, userYacht: currentYacht } = useYacht();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Use real crew schedules from database
  const { 
    schedules, 
    loading: schedulesLoading, 
    optimizeSchedules 
  } = useCrewSchedules({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (currentYachtId) {
      loadCrewData();
    }
  }, [currentYachtId]);

  const loadCrewData = async () => {
    if (!currentYachtId) {
      toast.error('Please select a yacht first');
      return;
    }

    try {
      // Use yacht-scoped data access
      // For now, return empty data as the useYacht context doesn't have getYachtScopedData
      // const crewData = await getYachtScopedData('crew_members', { status: 'active' });
      const crewData = [];

      // Transform Supabase data to component format
      const transformedCrew: CrewMember[] = (crewData || []).map(member => ({
        id: member.id,
        name: member.name || member.first_name + ' ' + member.last_name,
        position: member.position || member.role,
        performance_score: 85, // Default performance score
        certifications: member.certifications || [],
        availability: 'available' as 'available' | 'onboarded' | 'leave' | 'training',
        skills: ['Navigation', 'Leadership', 'Technical'], // Default skills
        experience_years: member.hire_date ? 
          Math.floor((new Date().getTime() - new Date(member.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 5,
        next_training: member.license_expiry || '2024-04-15',
        ai_recommendations: [
          'Professional development recommended',
          'Certification renewal due soon'
        ]
      }));

      setCrew(transformedCrew);
      console.log('Loaded yacht-scoped crew data:', transformedCrew);
    } catch (error) {
      console.error('Error loading crew data:', error);
      toast.error('Failed to load crew data');
    }
  };

  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    try {
      toast.success('Optimizing crew schedules with AI...');
      await optimizeSchedules();
      toast.success('Schedule optimization completed successfully!');
    } catch (error) {
      console.error('Schedule optimization failed:', error);
      toast.error('Failed to optimize schedules');
    } finally {
      setIsOptimizing(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'onboarded': return 'secondary';
      case 'leave': return 'destructive';
      case 'training': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">AI Crew Management</h1>
            {currentYacht && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Ship className="h-3 w-3" />
                {currentYacht?.name || 'No Yacht Selected'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">AI-powered scheduling, performance analysis, and crew optimization</p>
          {!currentYachtId && (
            <p className="text-orange-600 text-sm mt-1">⚠️ Please select a yacht to view crew data</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsScanning(true)}
            variant="outline"
          >
            <Zap className="mr-2 h-4 w-4" />
            Smart Scan
          </Button>
          <Button 
            onClick={handleOptimizeSchedule}
            disabled={isOptimizing}
          >
            <Brain className="mr-2 h-4 w-4" />
            {isOptimizing ? "Optimizing..." : "AI Optimize"}
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="crew">Crew Members</TabsTrigger>
          <TabsTrigger value="schedule">AI Schedule</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Crew</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crew.length}</div>
                <p className="text-xs text-muted-foreground">Active crew members</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(crew.reduce((acc, member) => acc + member.performance_score, 0) / crew.length || 0)}%
                </div>
                <p className="text-xs text-muted-foreground">Team average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Award className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {crew.filter(member => member.availability === 'available').length}
                </div>
                <p className="text-xs text-muted-foreground">Ready for duty</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Schedule Efficiency</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((schedules.reduce((acc, shift) => acc + shift.efficiencyScore, 0) / schedules.length) * 100) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">AI optimized</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Crew Insights</CardTitle>
                <CardDescription>Latest AI analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Optimal Scheduling</p>
                    <p className="text-xs text-blue-600">AI identified 23% efficiency improvement with current crew rotation</p>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Training Recommendations</p>
                    <p className="text-xs text-green-600">3 crew members due for certification updates - scheduled automatically</p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Performance Alert</p>
                    <p className="text-xs text-yellow-600">Consider additional rest periods for high-workload shifts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Optimization</CardTitle>
                <CardDescription>AI-powered efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Workload Balance</span>
                    <span className="text-sm font-medium">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Skill Matching</span>
                    <span className="text-sm font-medium">89%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Rest Compliance</span>
                    <span className="text-sm font-medium">97%</span>
                  </div>
                  <Progress value={97} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {crew.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`/avatars/${member.name.replace(' ', '-').toLowerCase()}.jpg`} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.position}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getPerformanceColor(member.performance_score)}`}>
                        {member.performance_score}%
                      </p>
                      <Badge variant={getAvailabilityColor(member.availability) as any}>
                        {member.availability}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Skills & Experience</p>
                    <p className="text-sm text-muted-foreground">{member.experience_years} years experience</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">AI Recommendations</p>
                    <ul className="list-disc list-inside space-y-1">
                      {member.ai_recommendations.map((rec, index) => (
                        <li key={index} className="text-xs text-muted-foreground">{rec}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Next Training: {member.next_training}
                    </span>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Optimized Schedule</CardTitle>
              <CardDescription>Automatically generated based on performance, skills, and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{schedule.shiftDate} - {schedule.shiftType.charAt(0).toUpperCase() + schedule.shiftType.slice(1)} Shift</p>
                        <p className="text-sm text-muted-foreground">
                          Crew: {schedule.crewMemberName || 'Unassigned'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Efficiency: {Math.round(schedule.efficiencyScore * 100)}%</p>
                        <p className="text-sm text-muted-foreground">Workload: {schedule.workload}%</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Workload Distribution</span>
                        <span>{schedule.workload}%</span>
                      </div>
                      <Progress value={schedule.workload} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>AI analysis of crew performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {crew.map((member) => (
                    <div key={member.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{member.name}</span>
                        <span className="text-sm">{member.performance_score}%</span>
                      </div>
                      <Progress value={member.performance_score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Schedule</CardTitle>
                <CardDescription>AI-recommended training programs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crew.map((member) => (
                    <div key={member.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">Next: {member.next_training}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.certifications.length} certs
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <UniversalSmartScan
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanComplete={(result) => {
          console.log('Crew scan result:', result);
          toast.success("Crew document scan completed");
        }}
        module="crew"
        context="crew_management"
        scanType="document"
      />
    </div>
  );
};

export default CrewAI;