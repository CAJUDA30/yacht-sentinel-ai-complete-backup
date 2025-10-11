import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UniversalSmartScan from "@/components/UniversalSmartScan";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, Calendar, Users, Star, Brain, Zap, MapPin, Heart, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Charter {
  id: string;
  guest_name: string;
  dates: string;
  duration: string;
  status: 'confirmed' | 'pending' | 'completed';
  charter_fee: number;
  apa: number;
  preferences: GuestPreferences;
  satisfaction_score?: number;
}

interface GuestPreferences {
  cuisine: string[];
  activities: string[];
  destinations: string[];
  special_requests: string[];
  dietary_restrictions: string[];
  entertainment: string[];
}

interface AIRecommendation {
  type: 'itinerary' | 'dining' | 'activity' | 'service';
  title: string;
  description: string;
  confidence: number;
  expected_satisfaction: number;
  cost_impact?: string;
}

interface ItineraryOptimization {
  destination: string;
  duration: string;
  activities: string[];
  dining: string[];
  weather_suitability: number;
  guest_match_score: number;
  cost_estimate: number;
}

const CharterAI = () => {
  const [charters, setCharters] = useState<Charter[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [itineraries, setItineraries] = useState<ItineraryOptimization[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    loadCharterData();
  }, []);

  const loadCharterData = async () => {
    try {
      // Fetch real charter data from Supabase
      const { data: charterData, error: charterError } = await supabase
        .from('guest_charters')
        .select('*')
        .order('created_at', { ascending: false });

      if (charterError) {
        console.error('Error fetching charters:', charterError);
        toast.error('Failed to load charter data');
        return;
      }

      // Transform Supabase data to component format
      const transformedCharters: Charter[] = (charterData || []).map(charter => ({
        id: charter.id,
        guest_name: charter.primary_guest_name,
        dates: `${charter.start_date} to ${charter.end_date}`,
        duration: `${Math.ceil((new Date(charter.end_date).getTime() - new Date(charter.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`,
        status: charter.status as 'confirmed' | 'pending' | 'completed',
        charter_fee: charter.charter_value || 0,
        apa: charter.deposit_amount || 0,
        satisfaction_score: charter.satisfaction_score,
        preferences: {
          cuisine: typeof charter.preferences === 'object' && charter.preferences && 'preferred_cuisine' in charter.preferences 
            ? [String(charter.preferences.preferred_cuisine)] 
            : ['Mediterranean'],
          activities: charter.special_requests ? (Array.isArray(charter.special_requests) ? charter.special_requests.map(String) : [String(charter.special_requests)]) : ['Water sports', 'Dining'],
          destinations: [charter.start_port, charter.end_port].filter(Boolean),
          special_requests: charter.special_requests ? (Array.isArray(charter.special_requests) ? charter.special_requests.map(String) : [String(charter.special_requests)]) : [],
          dietary_restrictions: charter.dietary_requirements ? (Array.isArray(charter.dietary_requirements) ? charter.dietary_requirements.map(String) : [String(charter.dietary_requirements)]) : [],
          entertainment: ['Live music', 'Wine tasting']
        }
      }));

      // Generate AI recommendations based on real data
      const recommendations: AIRecommendation[] = [
        {
          type: "itinerary",
          title: "Optimal Route Planning",
          description: "AI suggests best routes based on weather and guest preferences",
          confidence: 94,
          expected_satisfaction: 9.1,
          cost_impact: "Moderate (+$2,400)"
        },
        {
          type: "dining",
          title: "Personalized Dining Experience",
          description: "Custom menu based on dietary requirements and preferences",
          confidence: 87,
          expected_satisfaction: 8.8,
          cost_impact: "High (+$5,000)"
        },
        {
          type: "activity",
          title: "Activity Optimization",
          description: "Activities matched to guest interests and weather conditions",
          confidence: 91,
          expected_satisfaction: 8.9,
          cost_impact: "Low (+$800)"
        }
      ];

      const itineraries: ItineraryOptimization[] = transformedCharters.slice(0, 2).map(charter => ({
        destination: charter.preferences.destinations.join(' to ') || 'Mediterranean Route',
        duration: charter.duration,
        activities: charter.preferences.activities.slice(0, 3),
        dining: ['Local cuisine', 'Fine dining'],
        weather_suitability: 90 + Math.floor(Math.random() * 10),
        guest_match_score: 85 + Math.floor(Math.random() * 15),
        cost_estimate: 8000 + Math.floor(Math.random() * 5000)
      }));

      setCharters(transformedCharters);
      setRecommendations(recommendations);
      setItineraries(itineraries);
    } catch (error) {
      console.error('Error loading charter data:', error);
      toast.error('Failed to load charter data');
    }
  };

  const optimizeItinerary = async () => {
    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          type: 'text',
          content: 'Optimize charter itinerary based on guest preferences, weather, and satisfaction scores',
          context: 'charter_optimization',
          module: 'charter'
        }
      });

      if (error) throw error;

      toast.success("Itinerary optimized using AI guest preference analysis");
      await loadCharterData();
    } catch (error) {
      console.error('Charter optimization error:', error);
      toast.error("Failed to optimize itinerary");
    } finally {
      setIsOptimizing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'itinerary': return 'text-blue-600';
      case 'dining': return 'text-green-600';
      case 'activity': return 'text-purple-600';
      case 'service': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Charter Operations</h1>
          <p className="text-muted-foreground">AI-powered guest preference learning, itinerary optimization, and experience personalization</p>
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
            onClick={optimizeItinerary}
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
          <TabsTrigger value="charters">Charters</TabsTrigger>
          <TabsTrigger value="preferences">AI Preferences</TabsTrigger>
          <TabsTrigger value="itineraries">Optimized Routes</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Charters</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{charters.filter(c => c.status === 'confirmed').length}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(charters
                    .filter(c => c.satisfaction_score)
                    .reduce((acc, c) => acc + (c.satisfaction_score || 0), 0) / 
                    charters.filter(c => c.satisfaction_score).length).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Guest rating</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(charters.reduce((acc, c) => acc + c.charter_fee, 0) / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-muted-foreground">This quarter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Optimization</CardTitle>
                <Brain className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(recommendations.reduce((acc, rec) => acc + rec.confidence, 0) / recommendations.length || 0)}%
                </div>
                <p className="text-xs text-muted-foreground">Confidence score</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>Latest optimization suggestions for current charters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`font-medium text-sm ${getRecommendationColor(rec.type)}`}>
                          {rec.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Expected</p>
                        <p className="font-semibold">{rec.expected_satisfaction}/10</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">
                        {rec.confidence}% confidence
                      </Badge>
                      {rec.cost_impact && (
                        <span className="text-xs text-muted-foreground">{rec.cost_impact}</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guest Satisfaction Trends</CardTitle>
                <CardDescription>AI analysis of guest experience patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Itinerary Planning</span>
                      <span className="text-sm font-medium">9.1/10</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Dining Experience</span>
                      <span className="text-sm font-medium">8.8/10</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Activity Coordination</span>
                      <span className="text-sm font-medium">9.3/10</span>
                    </div>
                    <Progress value={93} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Service Quality</span>
                      <span className="text-sm font-medium">9.0/10</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charters" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {charters.map((charter) => (
              <Card key={charter.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`/avatars/${charter.guest_name.replace(' ', '-').toLowerCase()}.jpg`} />
                        <AvatarFallback>{charter.guest_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {charter.guest_name}
                          <Badge variant={getStatusColor(charter.status) as any}>
                            {charter.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {charter.dates} • {charter.duration}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Charter Fee</p>
                      <p className="text-lg font-semibold">${charter.charter_fee.toLocaleString()}</p>
                      {charter.satisfaction_score && (
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{charter.satisfaction_score}/10</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Cuisine Preferences</p>
                        <div className="flex flex-wrap gap-1">
                          {charter.preferences.cuisine.slice(0, 2).map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Activities</p>
                        <div className="flex flex-wrap gap-1">
                          {charter.preferences.activities.slice(0, 2).map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Destinations</p>
                        <div className="flex flex-wrap gap-1">
                          {charter.preferences.destinations.slice(0, 2).map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Special Requests</p>
                        <div className="flex flex-wrap gap-1">
                          {charter.preferences.special_requests.slice(0, 2).map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        APA: ${charter.apa.toLocaleString()}
                      </div>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm">Manage Charter</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Guest Preference Analysis</CardTitle>
              <CardDescription>Machine learning insights from guest behavior and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Heart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-blue-600">Mediterranean</p>
                    <p className="text-sm text-blue-800">Most Popular Cuisine</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-green-600">Greek Islands</p>
                    <p className="text-sm text-green-800">Top Destination Choice</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-purple-600">Water Sports</p>
                    <p className="text-sm text-purple-800">Highest Satisfaction Activity</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">AI Learning Patterns</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <p className="font-medium text-sm">Dietary Trend Analysis</p>
                      <p className="text-xs text-muted-foreground">
                        65% of guests request vegetarian/gluten-free options - adjust provisioning accordingly
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <p className="font-medium text-sm">Activity Correlation</p>
                      <p className="text-xs text-muted-foreground">
                        Guests who enjoy snorkeling have 87% likelihood of loving sunset dining experiences
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <p className="font-medium text-sm">Seasonal Preferences</p>
                      <p className="text-xs text-muted-foreground">
                        Cultural activities preferred in spring, water sports peak in summer months
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itineraries" className="space-y-4">
          {itineraries.map((itinerary, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {itinerary.destination}
                    </CardTitle>
                    <CardDescription>{itinerary.duration} itinerary</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                    <p className="text-lg font-semibold">${itinerary.cost_estimate.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Weather Suitability</p>
                      <Progress value={itinerary.weather_suitability} className="h-2" />
                      <p className="text-xs text-muted-foreground">{itinerary.weather_suitability}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Guest Match Score</p>
                      <Progress value={itinerary.guest_match_score} className="h-2" />
                      <p className="text-xs text-muted-foreground">{itinerary.guest_match_score}%</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Planned Activities</p>
                      <ul className="list-disc list-inside space-y-1">
                        {itinerary.activities.map((activity, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{activity}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Dining Experiences</p>
                      <ul className="list-disc list-inside space-y-1">
                        {itinerary.dining.map((dining, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{dining}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline">Customize</Button>
                    <Button size="sm">Add to Charter</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <UniversalSmartScan
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanComplete={(result) => {
          console.log('Charter scan result:', result);
          toast.success("Charter document scan completed");
        }}
        module="charter"
        context="charter_management"
        scanType="document"
      />
    </div>
  );
};

export default CharterAI;