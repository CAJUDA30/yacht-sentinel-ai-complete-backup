import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import SystemStatusIndicator from "@/components/SystemStatusIndicator";
import AdvancedAnalytics from "@/components/AdvancedAnalytics";
import LLMAnalyticsPanel from "@/components/LLMAnalyticsPanel";
import MaritimeWeatherIntegration from "@/components/MaritimeWeatherIntegration";
import AdvancedSecurityDashboard from "@/components/AdvancedSecurityDashboard";
import ComprehensiveAnalyticsDashboard from "@/components/ComprehensiveAnalyticsDashboard";
import PerformanceOptimizer from "@/components/PerformanceOptimizer";
import VoiceAssistant from "@/components/VoiceAssistant";
import ARTroubleshootingViewer from "@/components/ARTroubleshootingViewer";
import BlockchainContracts from "@/components/BlockchainContracts";
import PredictiveMaintenance from "@/components/PredictiveMaintenance";
import GlobalFleetManagement from "@/components/GlobalFleetManagement";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useOffline } from "@/contexts/OfflineContext";
import { useLocation } from "@/contexts/LocationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEnterpriseData } from "@/hooks/useEnterpriseData";
import { 
  Ship, 
  Users, 
  Package, 
  Wrench, 
  DollarSign, 
  Navigation, 
  Shield, 
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
  MapPin,
  Fuel,
  Thermometer,
  Wifi,
  WifiOff,
  BarChart3,
  Settings,
  ChevronRight,
  Anchor,
  Waves,
  Compass,
  CheckSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImage from "@/assets/yacht-hero.jpg";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const YachtDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isConnected } = useRealtime();
  const { isOnline, pendingSync } = useOffline();
  const { currentLocation, coordinates, weatherData, rawPosition } = useLocation();
  const { metrics: dashboardData, isLoading: metricsLoading, error } = useEnterpriseData();

  const moduleData = [
    { 
      id: 'inventory', 
      title: 'Inventory Management', 
      icon: Package, 
      description: 'Smart tracking with predictive analytics',
      stats: { items: dashboardData.inventoryCount.toString(), alerts: dashboardData.lowStockItems.toString(), critical: dashboardData.criticalAlerts.toString() },
      color: 'primary'
    },
    { 
      id: 'crew', 
      title: 'Crew Management', 
      icon: Users, 
      description: 'Scheduling and performance tracking',
      stats: { active: dashboardData.crewCount, certifications: 'Valid', insights: '92%' },
      color: 'accent'
    },
    { 
      id: 'maintenance', 
      title: 'Maintenance AI', 
      icon: Wrench, 
      description: 'Predictive maintenance scheduling',
      stats: { pending: dashboardData.maintenanceAlerts, predictive: '2', health: '95%' },
      color: 'warning'
    },
    { 
      id: 'finance', 
      title: 'Financial Analytics', 
      icon: DollarSign, 
      description: 'Cost optimization and insights',
      stats: { savings: dashboardData.financialSummary, budget: 'Excellent', optimization: '96%' },
      color: 'success'
    },
    { 
      id: 'navigation', 
      title: 'Navigation AI', 
      icon: Compass, 
      description: 'Route optimization and weather analysis',
      stats: { location: rawPosition ? currentLocation : 'GPS Required', weather: rawPosition ? weatherData.seaConditions : 'GPS Required', gps: rawPosition ? 'Active' : 'Required' },
      color: 'info'
    },
    { 
      id: 'safety', 
      title: 'Safety Systems', 
      icon: Shield, 
      description: 'Risk assessment and monitoring',
      stats: { score: '98%', compliance: 'Full', risk: 'Low' },
      color: 'danger'
    },
    { 
      id: 'audit-manager', 
      title: 'Enterprise Audit Manager', 
      icon: CheckSquare, 
      description: 'Multi-modal AI-powered audit management with import/export',
      stats: { 
        active: `0 Active`, 
        compliance: `95%`, 
        aiInsights: `12 Insights`,
        importExport: 'Ready'
      },
      color: 'primary'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Professional Header */}
      <div className="relative bg-gradient-ocean overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary-glow/70" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-glow">
                <Anchor className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">YachtExcel AI</h1>
                <p className="text-white/90 text-base lg:text-lg">Professional Maritime Management Platform</p>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center gap-4">
              {/* Enhanced Status Indicators */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ${
                isOnline 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                {isOnline ? <Wifi className="w-4 h-4 text-green-300" /> : <WifiOff className="w-4 h-4 text-red-300" />}
                <span className="text-white text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              
              {isConnected && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/30 border border-green-500/40 rounded-full">
                  <Activity className="w-4 h-4 text-green-300 animate-pulse" />
                  <span className="text-white text-sm font-medium">Live Data</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Location & Weather Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 text-white/90 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="p-2 bg-white/20 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-80 font-medium">Current Location</p>
                <p className="font-semibold text-lg">{rawPosition ? currentLocation : "GPS Required"}</p>
                <p className="text-xs opacity-70">{rawPosition ? coordinates : "Enable location access"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white/90 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="p-2 bg-white/20 rounded-lg">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-80 font-medium">Weather</p>
                <p className="font-semibold text-lg">{rawPosition ? weatherData.temperature : "GPS Required"}</p>
                <p className="text-xs opacity-70">{rawPosition ? `Wind ${weatherData.windSpeed}` : "Enable GPS for weather"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white/90 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div className="p-2 bg-white/20 rounded-lg">
                <Waves className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-80 font-medium">Sea Conditions</p>
                <p className="font-semibold text-lg">{rawPosition ? weatherData.seaConditions : "GPS Required"}</p>
                <p className="text-xs opacity-70">{rawPosition ? `Wave height ${weatherData.waveHeight}` : "Enable GPS for sea data"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 -mt-8 relative z-10">
        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: Fuel,
              title: "Fuel Level",
              value: `${dashboardData.fuelLevel}%`,
              progress: dashboardData.fuelLevel,
              badge: "Live",
              color: "primary",
              delay: 0
            },
            {
              icon: Users,
              title: "Personnel",
              value: dashboardData.crewCount + dashboardData.guestCount,
              badges: [`${dashboardData.crewCount} Crew`, `${dashboardData.guestCount} Guests`],
              badge: "Active",
              color: "accent",
              delay: 100
            },
            {
              icon: AlertTriangle,
              title: "Maintenance",
              value: `${dashboardData.maintenanceAlerts} Tasks`,
              subtitle: "2 Scheduled, 1 Urgent",
              badge: dashboardData.maintenanceAlerts,
              color: "destructive",
              delay: 200
            },
            {
              icon: TrendingUp,
              title: "Efficiency",
              value: dashboardData.financialSummary,
              subtitle: "Monthly savings vs target",
              badge: "+12%",
              color: "success",
              delay: 300
            }
          ].map((metric, index) => (
            <Card 
              key={index} 
              className={`bg-gradient-card backdrop-blur-sm border-primary/20 shadow-soft hover:shadow-elegant transition-all duration-300 animate-scale-in group cursor-pointer`}
              style={{ animationDelay: `${metric.delay}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 ${
                    metric.color === 'primary' ? 'bg-primary/10 group-hover:bg-primary/20' :
                    metric.color === 'accent' ? 'bg-accent/20 group-hover:bg-accent/30' :
                    metric.color === 'destructive' ? 'bg-destructive/10 group-hover:bg-destructive/20' :
                    'bg-green-500/10 group-hover:bg-green-500/20'
                  }`}>
                    <metric.icon className={`w-6 h-6 ${
                      metric.color === 'primary' ? 'text-primary' :
                      metric.color === 'accent' ? 'text-accent-foreground' :
                      metric.color === 'destructive' ? 'text-destructive' :
                      'text-green-600'
                    }`} />
                  </div>
                  <Badge 
                    variant={metric.color === 'destructive' ? 'destructive' : 'secondary'} 
                    className={`text-xs ${
                      metric.color === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''
                    }`}
                  >
                    {metric.badge}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">{metric.title}</p>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  {metric.progress && (
                    <Progress value={metric.progress} className="h-2" />
                  )}
                  {metric.badges && (
                    <div className="flex gap-2">
                      {metric.badges.map((badge, badgeIndex) => (
                        <Badge key={badgeIndex} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {metric.subtitle && (
                    <p className={`text-xs font-medium ${
                      metric.color === 'success' ? 'text-green-600' :
                      metric.color === 'destructive' ? 'text-muted-foreground' :
                      'text-muted-foreground'
                    }`}>
                      {metric.subtitle}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enhanced Navigation Modules */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground">Management Modules</h2>
              <p className="text-sm text-muted-foreground mt-1">Access all yacht management systems</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 hover:scale-105 transition-all duration-200">
              <Settings className="w-4 h-4" />
              Customize Layout
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moduleData.map((module, index) => (
              <Card 
                key={module.id} 
                className="group hover:shadow-elegant transition-all duration-300 bg-gradient-card backdrop-blur-sm border-primary/20 cursor-pointer animate-scale-in overflow-hidden" 
                onClick={() => navigate(`/${module.id}`)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4 relative">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-soft ${
                      module.color === 'primary' ? 'bg-primary/10 group-hover:bg-primary/20 group-hover:shadow-primary/25' :
                      module.color === 'accent' ? 'bg-accent/20 group-hover:bg-accent/30 group-hover:shadow-accent/25' :
                      module.color === 'warning' ? 'bg-yellow-100 group-hover:bg-yellow-200 group-hover:shadow-yellow-400/25' :
                      module.color === 'success' ? 'bg-green-100 group-hover:bg-green-200 group-hover:shadow-green-400/25' :
                      module.color === 'info' ? 'bg-blue-100 group-hover:bg-blue-200 group-hover:shadow-blue-400/25' :
                      'bg-red-100 group-hover:bg-red-200 group-hover:shadow-red-400/25'
                    }`}>
                      <module.icon className={`w-6 h-6 transition-all duration-300 ${
                        module.color === 'primary' ? 'text-primary group-hover:text-primary-glow' :
                        module.color === 'accent' ? 'text-accent-foreground' :
                        module.color === 'warning' ? 'text-yellow-600' :
                        module.color === 'success' ? 'text-green-600' :
                        module.color === 'info' ? 'text-blue-600' :
                        'text-red-600'
                      }`} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <div className="mt-4">
                    <CardTitle className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {Object.entries(module.stats).map(([key, value], statIndex) => (
                      <div 
                        key={key} 
                        className="flex justify-between items-center animate-fade-in"
                        style={{ animationDelay: `${(index * 100) + (statIndex * 50)}ms` }}
                      >
                        <span className="text-sm text-muted-foreground capitalize font-medium">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className="text-xs font-medium hover:scale-105 transition-transform duration-200"
                        >
                          {value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                {/* Subtle hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Card>
            ))}
          </div>
        </div>

        {/* Enhanced Advanced Systems */}
        <div className="mb-8">
          <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
            <h2 className="text-2xl font-bold text-foreground mb-2">Advanced Systems</h2>
            <p className="text-sm text-muted-foreground mb-6">Professional AI-powered tools and analytics</p>
          </div>
          
          <Tabs defaultValue="analytics" className="space-y-6">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9 bg-gradient-subtle border border-border/40 shadow-soft min-w-max">
                {[
                  { value: "analytics", label: "Analytics", delay: 700 },
                  { value: "weather", label: "Weather", delay: 750 },
                  { value: "security", label: "Security", delay: 800 },
                  { value: "performance", label: "Performance", delay: 850 },
                  { value: "voice", label: "Voice AI", delay: 900 },
                  { value: "ar", label: "AR/VR", delay: 950 },
                  { value: "blockchain", label: "Blockchain", delay: 1000 },
                  { value: "predictive", label: "Predictive", delay: 1050 },
                  { value: "global", label: "Global Fleet", delay: 1100 }
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className={`text-xs whitespace-nowrap px-4 py-2.5 rounded-lg transition-all duration-300 
                      data-[state=active]:bg-primary data-[state=active]:text-primary-foreground 
                      data-[state=active]:shadow-elegant animate-fade-in hover:scale-105`}
                    style={{ animationDelay: `${tab.delay}ms` }}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Content with enhanced animations */}
            <div className="animate-fade-in" style={{ animationDelay: '1200ms' }}>
              <TabsContent value="analytics" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="animate-scale-in" style={{ animationDelay: '1300ms' }}>
                    <AdvancedAnalytics module="dashboard" />
                  </div>
                  <div className="animate-scale-in" style={{ animationDelay: '1400ms' }}>
                    <LLMAnalyticsPanel module="dashboard" data={dashboardData} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="weather" className="animate-scale-in">
                <MaritimeWeatherIntegration />
              </TabsContent>
              
              <TabsContent value="security" className="animate-scale-in">
                <AdvancedSecurityDashboard />
              </TabsContent>
              
              <TabsContent value="performance" className="animate-scale-in">
                <PerformanceOptimizer />
              </TabsContent>
              
              <TabsContent value="voice" className="animate-scale-in">
                <VoiceAssistant />
              </TabsContent>
              
              <TabsContent value="ar" className="animate-scale-in">
                <ARTroubleshootingViewer />
              </TabsContent>
              
              <TabsContent value="blockchain" className="animate-scale-in">
                <BlockchainContracts />
              </TabsContent>
              
              <TabsContent value="predictive" className="animate-scale-in">
                <PredictiveMaintenance />
              </TabsContent>
              
              <TabsContent value="global" className="animate-scale-in">
                <GlobalFleetManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* System Status */}
        {!isMobile && (
          <div className="mt-8">
            <SystemStatusIndicator />
          </div>
        )}
      </div>
    </div>
  );
};

export default YachtDashboard;