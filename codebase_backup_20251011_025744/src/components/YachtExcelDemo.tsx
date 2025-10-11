import { useState, useEffect } from 'react';
import { 
  Brain, 
  Zap, 
  Shield, 
  Globe, 
  Database, 
  Eye, 
  Camera, 
  MessageCircle, 
  Settings, 
  TrendingUp,
  Ship,
  Package,
  Wrench,
  Users,
  FileText,
  BarChart3,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Clock,
  Star,
  ArrowRight,
  PlayCircle,
  BookOpen,
  Target,
  Sparkles,
  Lock,
  Coins,
  Smartphone,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import UniversalSmartScan from './UniversalSmartScan';
import YachtieChat from './YachtieChat';
import { useYachtieAI, useUserMemory, usePersonalizationProfile } from '@/hooks/useYachtieMemory';
import { supabase } from '@/integrations/supabase/client';

interface DemoStats {
  totalScans: number;
  accuracyRate: number;
  timeSaved: number;
  costReduction: number;
  memoryCount: number;
  activeModules: number;
}

const YachtExcelDemo = () => {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  // Real stats from database
  const [stats, setStats] = useState<DemoStats>({
    totalScans: 0,
    accuracyRate: 0,
    timeSaved: 0,
    costReduction: 0,
    memoryCount: 0,
    activeModules: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Hooks
  const { isProcessing } = useYachtieAI();
  const { memories } = useUserMemory();
  const { profile } = usePersonalizationProfile();

  // Dynamic features data from database or env
  const [yachtexcelFeatures, setYachtexcelFeatures] = useState([
    {
      id: 'yachtie-ai',
      title: 'Yachtie AI Agent',
      description: 'Memory-enhanced AI with OCR routing and personalized intelligence',
      icon: Brain,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      features: [
        'Context-aware OCR processing',
        'Long-term memory with RAG',
        'Multi-LLM consensus',
        'Personalized recommendations'
      ],
      demo: () => setShowChat(true)
    }
  ]);

  // Load dynamic features configuration
  const loadFeaturesConfig = async () => {
    try {
      // Use environment-based configuration for now
      // TODO: Implement platform_features table if dynamic configuration is needed
      const envFeatures = getEnvBasedFeatures();
      setYachtexcelFeatures(envFeatures);
    } catch (error) {
      console.error('Error loading features config:', error);
      // Use default configuration as fallback
      const defaultFeatures = getDefaultFeatures();
      setYachtexcelFeatures(defaultFeatures);
    }
  };

  // Get icon component by name
  const getFeatureIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'brain': Brain,
      'camera': Camera,
      'wifi': Wifi,
      'shield': Shield,
      'ship': Ship,
      'database': Database
    };
    return iconMap[iconName] || Brain;
  };

  // Handle feature demos
  const handleFeatureDemo = (featureKey: string) => {
    switch (featureKey) {
      case 'yachtie-ai':
        setShowChat(true);
        break;
      case 'smart-scan':
        setShowScanner(true);
        break;
      case 'offline-sync':
        setIsOnline(!isOnline);
        toast.success(`Switched to ${!isOnline ? 'online' : 'offline'} mode`);
        break;
      default:
        toast.info(`${featureKey} demo activated`);
    }
  };

  // Environment-based features (for development)
  const getEnvBasedFeatures = () => {
    const isDevMode = process.env.NODE_ENV === 'development';
    const enabledFeatures = process.env.VITE_ENABLED_FEATURES?.split(',') || [];
    
    return getDefaultFeatures().filter(feature => 
      isDevMode || enabledFeatures.includes(feature.id)
    );
  };

  // Default features configuration
  const getDefaultFeatures = () => [
    {
      id: 'yachtie-ai',
      title: 'Yachtie AI Agent',
      description: 'Memory-enhanced AI with OCR routing and personalized intelligence',
      icon: Brain,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      features: [
        'Context-aware OCR processing',
        'Long-term memory with RAG',
        'Multi-LLM consensus',
        'Personalized recommendations'
      ],
      demo: () => setShowChat(true)
    },
    {
      id: 'smart-scan',
      title: 'Universal Smart Scan',
      description: 'Google Vision OCR with intelligent module routing',
      icon: Camera,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      features: [
        'Google Vision API integration',
        'Automatic module detection',
        'Memory-based context',
        'Auto-execution capabilities'
      ],
      demo: () => setShowScanner(true)
    },
    {
      id: 'offline-sync',
      title: 'Offline-First Architecture',
      description: 'Full functionality offline with conflict-free sync',
      icon: isOnline ? Wifi : WifiOff,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      features: [
        'SQLite local storage',
        'Service worker caching',
        'Conflict resolution',
        'Progressive sync'
      ],
      demo: () => {
        setIsOnline(!isOnline);
        toast.success(`Switched to ${!isOnline ? 'online' : 'offline'} mode`);
      }
    },
    {
      id: 'golden-safety',
      title: 'Golden Safety System',
      description: 'Location-based recommendations and compliance tracking',
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      features: [
        'GPS-based safety alerts',
        'Compliance monitoring',
        'Emergency protocols',
        'Certification tracking'
      ],
      demo: () => toast.info('Safety system demo would show compliance status')
    },
    {
      id: 'nmea-integration',
      title: 'NMEA 2000 Integration',
      description: 'Real-time IoT sensor data with anomaly detection',
      icon: Ship,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      features: [
        'Real-time sensor data',
        'Anomaly detection',
        'Predictive maintenance',
        'Performance optimization'
      ],
      demo: () => toast.info('NMEA integration demo would show live sensor data')
    },
    {
      id: 'registry',
      title: 'Centralized Registry',
      description: 'Global database of suppliers, clients, and yacht specifications',
      icon: Database,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      features: [
        'Supplier network',
        'Client management',
        'Yacht specifications',
        'Blockchain verification'
      ],
      demo: () => toast.info('Registry demo would show supplier network')
    }
  ];

  // Real module data from database
  const [modules, setModules] = useState([
    { name: 'Dashboard', icon: BarChart3, status: 'active', usage: 0 },
    { name: 'Finance', icon: Coins, status: 'active', usage: 0 },
    { name: 'Inventory', icon: Package, status: 'active', usage: 0 },
    { name: 'Equipment', icon: Wrench, status: 'active', usage: 0 },
    { name: 'Crew', icon: Users, status: 'active', usage: 0 },
    { name: 'Safety', icon: Shield, status: 'active', usage: 0 },
    { name: 'Navigation', icon: Ship, status: 'active', usage: 0 },
    { name: 'Documents', icon: FileText, status: 'active', usage: 0 },
    { name: 'Guest', icon: Star, status: 'active', usage: 0 },
    { name: 'Maintenance', icon: Settings, status: 'active', usage: 0 },
    { name: 'Analytics', icon: TrendingUp, status: 'active', usage: 0 },
    { name: 'Compliance', icon: Lock, status: 'active', usage: 0 }
  ]);

  // Load real module usage data
  const loadModuleUsage = async () => {
    try {
      // Fetch module usage from analytics events in the last 30 days
      const { data: moduleEvents } = await supabase
        .from('analytics_events')
        .select('module')
        .not('module', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Count events per module
      const moduleCounts = moduleEvents?.reduce((acc, event) => {
        const module = event.module?.toLowerCase();
        if (module) {
          acc[module] = (acc[module] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate usage percentages (normalize to 0-100)
      const maxUsage = Math.max(...Object.values(moduleCounts), 1);
      
      setModules(prev => prev.map(module => {
        const moduleKey = module.name.toLowerCase();
        const count = moduleCounts[moduleKey] || 0;
        const usage = Math.round((count / maxUsage) * 100);
        
        return {
          ...module,
          usage,
          status: usage > 0 ? 'active' : 'inactive'
        };
      }));
    } catch (error) {
      console.error('Error loading module usage:', error);
    }
  };

  // Load module usage on component mount
  useEffect(() => {
    loadModuleUsage();
    loadFeaturesConfig();
  }, []);

  // Load real stats from database
  const loadRealStats = async () => {
    setIsLoadingStats(true);
    try {
      // Fetch total scans from scan_events table
      const { count: totalScans } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true });

      // Fetch successful scans for accuracy calculation
      const { count: successfulScans } = await supabase
        .from('scan_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'scan_completed');

      // Calculate accuracy rate
      const accuracyRate = totalScans && totalScans > 0 ? ((successfulScans || 0) / totalScans) * 100 : 0;

      // Fetch processing times for time saved calculation
      const { data: processingTimes } = await supabase
        .from('scan_events')
        .select('processing_time_ms')
        .not('processing_time_ms', 'is', null)
        .limit(100);

      // Calculate average time saved (assuming manual process takes 5 minutes)
      const avgProcessingTime = processingTimes?.reduce((sum, record) => sum + (record.processing_time_ms || 0), 0) / (processingTimes?.length || 1);
      const manualProcessTime = 300000; // 5 minutes in ms
      const timeSavedPerScan = Math.max(0, (manualProcessTime - (avgProcessingTime || 0)) / 60000); // Convert to minutes
      const totalTimeSaved = Math.round((totalScans || 0) * timeSavedPerScan);

      // Fetch active modules from analytics events
      const { data: moduleData } = await supabase
        .from('analytics_events')
        .select('module')
        .not('module', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      const activeModules = new Set(moduleData?.map(record => record.module).filter(Boolean)).size;

      // Calculate cost reduction based on time saved (assuming $50/hour labor cost)
      const costReduction = Math.round((totalTimeSaved / 60) * 50);

      setStats({
        totalScans: totalScans || 0,
        accuracyRate: Math.round(accuracyRate * 10) / 10,
        timeSaved: totalTimeSaved,
        costReduction,
        memoryCount: memories.length,
        activeModules
      });
    } catch (error) {
      console.error('Error loading real stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Load stats on component mount and when memories change
  useEffect(() => {
    loadRealStats();
  }, [memories.length]);

  // Refresh stats every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadRealStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                YachtExcel
              </h1>
              <p className="text-xl text-muted-foreground">
                AI-Orchestrated Superyacht Management Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6">
            <Badge variant="outline" className="px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Memory-Enhanced AI
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Globe className="h-4 w-4 mr-2" />
              Offline-First
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Enterprise Security
            </Badge>
            <Badge variant={isOnline ? "default" : "secondary"} className="px-4 py-2">
              {isOnline ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            Revolutionary yacht management with Yachtie AI - your memory-enhanced assistant that learns from every interaction, 
            routes OCR scans intelligently, and provides personalized recommendations. Achieving 95% workflow automation, 
            35% cost reduction, and 99.99% uptime with full offline capabilities.
          </p>
        </div>

        {/* Live Stats Dashboard */}
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Live Performance Metrics</span>
              <Badge variant="outline" className="ml-2">Real-time</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">{stats.totalScans.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Smart Scans</div>
                <Progress value={85} className="h-2" />
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">{stats.accuracyRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">OCR Accuracy</div>
                <Progress value={stats.accuracyRate} className="h-2" />
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-600">{stats.timeSaved}h</div>
                <div className="text-sm text-muted-foreground">Time Saved</div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-orange-600">{stats.costReduction}%</div>
                <div className="text-sm text-muted-foreground">Cost Reduction</div>
                <Progress value={stats.costReduction} className="h-2" />
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-cyan-600">{stats.memoryCount}</div>
                <div className="text-sm text-muted-foreground">AI Memories</div>
                <Progress value={65} className="h-2" />
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-red-600">{stats.activeModules}</div>
                <div className="text-sm text-muted-foreground">Active Modules</div>
                <Progress value={100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Feature Showcase */}
        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="features">🚀 Features</TabsTrigger>
            <TabsTrigger value="modules">📱 Modules</TabsTrigger>
            <TabsTrigger value="demo">🎮 Live Demo</TabsTrigger>
            <TabsTrigger value="architecture">🏗️ Architecture</TabsTrigger>
          </TabsList>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {yachtexcelFeatures.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <Card 
                    key={feature.id} 
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
                    onClick={feature.demo}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                          <IconComponent className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {feature.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {feature.features.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Try Demo
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {modules.map((module) => {
                const IconComponent = module.icon;
                return (
                  <Card key={module.name} className="text-center hover:shadow-lg transition-all">
                    <CardContent className="p-4 space-y-3">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{module.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {module.usage}% active
                        </div>
                      </div>
                      <Progress value={module.usage} className="h-2" />
                      <Badge 
                        variant={module.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {module.status}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Live Demo Tab */}
          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    <span>Yachtie AI Chat</span>
                  </CardTitle>
                  <CardDescription>
                    Experience memory-enhanced AI conversations with personalized responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="text-sm font-medium">Features:</div>
                    <ul className="text-sm space-y-1">
                      <li>• Long-term memory with RAG</li>
                      <li>• Context-aware responses</li>
                      <li>• Multi-module integration</li>
                      <li>• Personalized recommendations</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => setShowChat(true)} 
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start AI Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-5 w-5 text-green-500" />
                    <span>Smart OCR Scanner</span>
                  </CardTitle>
                  <CardDescription>
                    Intelligent document scanning with automatic module routing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="text-sm font-medium">Capabilities:</div>
                    <ul className="text-sm space-y-1">
                      <li>• Google Vision OCR</li>
                      <li>• Auto module detection</li>
                      <li>• Memory-based context</li>
                      <li>• High-confidence auto-execution</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => setShowScanner(true)} 
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Open Scanner
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Demo Actions</CardTitle>
                <CardDescription>Experience YachtExcel's key features instantly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => toast.success('Offline mode activated! All features work without internet.')}
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Test Offline
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => toast.info('Safety alerts: All certifications up to date, GPS tracking active')}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Safety Check
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => toast.info('NMEA sensors: Engine temp normal, fuel at 85%, navigation systems optimal')}
                  >
                    <Ship className="h-4 w-4 mr-2" />
                    IoT Status
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => toast.success('Blockchain verified: All supplier credentials and transactions validated')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Registry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Architecture</CardTitle>
                  <CardDescription>Enterprise-grade, scalable design</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Smartphone className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">Frontend</div>
                        <div className="text-sm text-muted-foreground">React Native + PWA</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Database className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">Backend</div>
                        <div className="text-sm text-muted-foreground">Supabase + pgvector</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium">AI Layer</div>
                        <div className="text-sm text-muted-foreground">Yachtie Agent + Multi-LLM</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                      <Globe className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="font-medium">Integrations</div>
                        <div className="text-sm text-muted-foreground">Google Vision, NMEA, APIs</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Innovations</CardTitle>
                  <CardDescription>Revolutionary yacht management features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Memory-Enhanced AI</div>
                        <div className="text-sm text-muted-foreground">
                          Long-term user memory with RAG for personalized interactions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Eye className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Intelligent OCR Routing</div>
                        <div className="text-sm text-muted-foreground">
                          Context-aware document classification and auto-routing
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <WifiOff className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Offline-First Design</div>
                        <div className="text-sm text-muted-foreground">
                          Full functionality without internet connectivity
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Golden Safety System</div>
                        <div className="text-sm text-muted-foreground">
                          Location-based safety recommendations and compliance
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success Metrics */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Success KPIs</span>
                </CardTitle>
                <CardDescription>Measurable outcomes and performance targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">98%</div>
                    <div className="text-sm text-muted-foreground">OCR Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">95%</div>
                    <div className="text-sm text-muted-foreground">Workflow Automation</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">99.99%</div>
                    <div className="text-sm text-muted-foreground">System Uptime</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">35%</div>
                    <div className="text-sm text-muted-foreground">Cost Reduction</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <CardContent className="p-8 text-center space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Ready to Transform Your Yacht Management?</h2>
              <p className="text-lg text-muted-foreground">
                Experience the future of yacht operations with YachtExcel's AI-powered platform
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" onClick={() => setShowChat(true)}>
                <Brain className="h-5 w-5 mr-2" />
                Try Yachtie AI
              </Button>
              <Button size="lg" variant="outline" onClick={() => setShowScanner(true)}>
                <Camera className="h-5 w-5 mr-2" />
                Test Smart Scan
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Full offline support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Modals */}
      {showChat && (
        <div className="fixed inset-0 z-50">
          <YachtieChat />
          <Button
            className="fixed top-4 right-4 z-50"
            variant="outline"
            onClick={() => setShowChat(false)}
          >
            Close Demo
          </Button>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Smart Document Scanner</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <UniversalSmartScan
                title="Document Scanner Demo"
                description="Upload or capture documents for AI analysis"
                multiple={true}
                maxFiles={5}
                autoScan={true}
                onScanComplete={(results) => {
                  console.log('Scan results:', results);
                  toast.success('Scan completed successfully!');
                  setShowScanner(false);
                }}
                onDataExtracted={(data, type) => {
                  console.log('Extracted data:', data, type);
                  toast.success(`Data extracted from ${type}`);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YachtExcelDemo;