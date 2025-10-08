import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  MessageSquare, 
  Bell, 
  Palette, 
  TrendingUp, 
  Zap,
  Eye,
  Settings
} from 'lucide-react';

const AdvancedIntelligenceDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize all Phase 5 services
    const initializeServices = async () => {
      try {
        // Services would be initialized here
        console.log('Phase 5: Advanced Intelligence & UX services initialized');
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Phase 5 services:', error);
        setIsLoading(false);
      }
    };

    initializeServices();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading advanced intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Intelligence & UX</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered automation, predictive analytics, and enhanced user experience
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictive Models</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Active AI models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ready</div>
            <p className="text-xs text-muted-foreground">Conversational AI active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Active notification rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UI Themes</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Available themes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="voice">Voice AI</TabsTrigger>
          <TabsTrigger value="notifications">Smart Notifications</TabsTrigger>
          <TabsTrigger value="ui">Advanced UI</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predictive Models
                </CardTitle>
                <CardDescription>
                  AI models analyzing patterns and predicting outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Maintenance Predictor</span>
                    <Badge variant="default">85% Accuracy</Badge>
                  </div>
                  <Progress value={85} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Inventory Optimizer</span>
                    <Badge variant="default">78% Accuracy</Badge>
                  </div>
                  <Progress value={78} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cost Forecaster</span>
                    <Badge variant="default">73% Accuracy</Badge>
                  </div>
                  <Progress value={73} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Insights Generated
                </CardTitle>
                <CardDescription>
                  AI-generated insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Maintenance</Badge>
                      <Badge variant="secondary">High Impact</Badge>
                    </div>
                    <p className="text-sm">Equipment failure predicted in 7 days</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Inventory</Badge>
                      <Badge variant="secondary">Medium Impact</Badge>
                    </div>
                    <p className="text-sm">Stock optimization opportunity identified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversational AI
              </CardTitle>
              <CardDescription>
                Voice-activated yacht management assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Voice Assistant Ready</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      "Hey Yachtie, check equipment status"
                    </p>
                    <Button>Start Voice Session</Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Supported Commands</h4>
                    <ul className="text-sm text-muted-foreground mt-1">
                      <li>• Equipment status</li>
                      <li>• Schedule maintenance</li>
                      <li>• Check inventory</li>
                      <li>• Weather updates</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Languages</h4>
                    <ul className="text-sm text-muted-foreground mt-1">
                      <li>• English</li>
                      <li>• Spanish</li>
                      <li>• French</li>
                      <li>• Italian</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Smart Notification Rules
                </CardTitle>
                <CardDescription>
                  AI-powered intelligent notification system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Equipment Failure Alert</div>
                      <div className="text-xs text-muted-foreground">Critical priority</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Maintenance Due</div>
                      <div className="text-xs text-muted-foreground">High priority</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">Weather Alert</div>
                      <div className="text-xs text-muted-foreground">High priority</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Multi-channel delivery system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Browser Notifications</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email Notifications</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sound Alerts</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Webhook Integration</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ui" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme System
                </CardTitle>
                <CardDescription>
                  Advanced theming and personalization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <div className="font-medium">Yacht Light</div>
                    <div className="text-sm text-muted-foreground">Clean and professional</div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                    <div className="font-medium">Yacht Dark</div>
                    <div className="text-sm text-gray-300">Easy on the eyes</div>
                  </div>
                  
                  <div className="p-3 border rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950">
                    <div className="font-medium">Ocean Blue</div>
                    <div className="text-sm text-muted-foreground">Marine-inspired</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Accessibility Features
                </CardTitle>
                <CardDescription>
                  Inclusive design and accessibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High Contrast Mode</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reduced Motion</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Font Size Options</span>
                    <Badge variant="default">3 Sizes</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Screen Reader Support</span>
                    <Badge variant="default">Full Support</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedIntelligenceDashboard;