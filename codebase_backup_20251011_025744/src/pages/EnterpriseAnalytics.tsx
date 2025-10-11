import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain,
  BarChart3,
  TrendingUp,
  Target,
  FileText,
  Users,
  DollarSign,
  Activity,
  Zap,
  Eye,
  Settings,
  Download
} from 'lucide-react';

// Import analytics components
import ExecutiveReportingDashboard from '@/components/analytics/ExecutiveReportingDashboard';
import BusinessIntelligenceEngine from '@/components/analytics/BusinessIntelligenceEngine';
import CustomReportBuilder from '@/components/analytics/CustomReportBuilder';
import ComprehensiveAnalyticsDashboard from '@/components/analytics/ComprehensiveAnalyticsDashboard';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';

const EnterpriseAnalytics = () => {
  const [activeModule, setActiveModule] = useState('executive');

  const analyticsModules = [
    {
      id: 'executive',
      name: 'Executive Dashboard',
      description: 'C-level insights and strategic KPIs',
      icon: Target,
      color: 'bg-blue-500',
      component: ExecutiveReportingDashboard
    },
    {
      id: 'business-intelligence',
      name: 'Business Intelligence',
      description: 'AI-powered insights and predictions',
      icon: Brain,
      color: 'bg-purple-500',
      component: BusinessIntelligenceEngine
    },
    {
      id: 'custom-reports',
      name: 'Custom Reports',
      description: 'Build and schedule custom reports',
      icon: FileText,
      color: 'bg-green-500',
      component: CustomReportBuilder
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Analytics',
      description: 'Multi-module analytics overview',
      icon: BarChart3,
      color: 'bg-orange-500',
      component: ComprehensiveAnalyticsDashboard
    },
    {
      id: 'advanced',
      name: 'Advanced Analytics',
      description: 'Predictive analytics and ML insights',
      icon: Zap,
      color: 'bg-red-500',
      component: AdvancedAnalytics
    }
  ];

  const getCurrentComponent = () => {
    const module = analyticsModules.find(m => m.id === activeModule);
    if (!module) return null;
    
    const Component = module.component;
    return <Component />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            Enterprise Analytics & Business Intelligence
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics platform with AI-powered insights, predictive modeling, and executive reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Analytics Modules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {analyticsModules.map((module) => {
          const IconComponent = module.icon;
          const isActive = activeModule === module.id;
          
          return (
            <Card 
              key={module.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isActive ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setActiveModule(module.id)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{module.name}</h3>
                <p className="text-xs text-muted-foreground">{module.description}</p>
                {isActive && (
                <Badge className="mt-2">
                  Active
                </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Features Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Enterprise Analytics Features
          </CardTitle>
          <CardDescription>
            Comprehensive business intelligence platform with advanced AI capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Predictive Analytics</h4>
                <p className="text-xs text-muted-foreground">
                  AI-powered forecasting and trend analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Executive KPIs</h4>
                <p className="text-xs text-muted-foreground">
                  Strategic metrics and performance indicators
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Business Intelligence</h4>
                <p className="text-xs text-muted-foreground">
                  Market analysis and competitive insights
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Custom Reports</h4>
                <p className="text-xs text-muted-foreground">
                  Drag-and-drop report builder with automation
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Content */}
      <div className="min-h-[600px]">
        {getCurrentComponent()}
      </div>

      {/* Quick Stats Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Analytics Engine: Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Real-time Data: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-muted-foreground">AI Models: 12 Active</span>
              </div>
            </div>
            <Badge variant="secondary">
              Phase 7: Enterprise Analytics Complete
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterpriseAnalytics;