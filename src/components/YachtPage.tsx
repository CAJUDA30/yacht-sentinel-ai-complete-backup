/**
 * YachtPage - Central Dashboard and Core UI Node
 * Implements the master system prompt's yacht-centric architecture
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
  Ship, Users, DollarSign, Wrench, FileText, Calendar, Store, CheckSquare,
  Plus, Upload, ClipboardList, Receipt, MapPin, Wifi, WifiOff, Battery,
  Fuel, AlertTriangle, Clock, Star, Activity, Bell, TrendingUp, Shield, Navigation
} from 'lucide-react';

interface YachtData {
  id: string;
  yacht_name: string;
  yacht_type: string;
  flag_state: string;
  owner_name: string;
  captain_name: string;
  status: 'online' | 'offline' | 'in_port' | 'at_sea';
  current_location: { port?: string };
  specifications: { length_meters: number; beam_meters: number; gross_tonnage: number };
}

const YachtPage: React.FC = () => {
  const { yachtId } = useParams<{ yachtId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const [yachtData, setYachtData] = useState<YachtData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('overview');

  const loadYachtData = useCallback(async () => {
    if (!yachtId || !user) return;

    try {
      setIsLoading(true);

      const { data: yacht, error } = await supabase
        .from('yachts')
        .select('*, crew_members!inner(name, position)')
        .eq('id', yachtId)
        .single();

      if (error) throw error;

      const transformedYacht: YachtData = {
        id: yacht.id,
        yacht_name: yacht.yacht_name,
        yacht_type: yacht.yacht_type,
        flag_state: yacht.flag_country,
        owner_name: yacht.owner_name || 'Unknown',
        captain_name: yacht.crew_members?.find((c: any) => c.position === 'captain')?.name || 'TBD',
        status: yacht.is_online ? 'online' : 'offline',
        current_location: { port: yacht.current_port },
        specifications: {
          length_meters: yacht.length_meters,
          beam_meters: yacht.beam_meters,
          gross_tonnage: yacht.gross_tonnage
        }
      };

      setYachtData(transformedYacht);
    } catch (error) {
      console.error('Error loading yacht data:', error);
      toast({
        title: 'Error Loading Yacht Data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [yachtId, user, toast]);

  const handleAddCrew = () => navigate(`/crew?yacht=${yachtId}&action=add`);
  const handleUploadCertificate = () => navigate(`/certificates?yacht=${yachtId}&action=upload`);
  const handleLogMaintenance = () => navigate(`/maintenance?yacht=${yachtId}&action=log`);
  const handleAddExpense = () => navigate(`/finance?yacht=${yachtId}&action=add`);

  const navigateToModule = (module: string) => {
    navigate(`/${module}?yacht=${yachtId}`);
  };

  useEffect(() => {
    loadYachtData();
  }, [loadYachtData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!yachtData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Yacht Not Found</h2>
          <p className="text-muted-foreground mb-4">You don't have access to this yacht.</p>
          <Button onClick={() => navigate('/fleet')}>Back to Fleet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Yacht Identity Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Ship className="w-8 h-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{yachtData.yacht_name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm opacity-90">
                  <span>{yachtData.yacht_type}</span>
                  <span>•</span>
                  <span>Flag: {yachtData.flag_state}</span>
                  <span>•</span>
                  <span>Owner: {yachtData.owner_name}</span>
                  <span>•</span>
                  <span>Captain: {yachtData.captain_name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge className={`${yachtData.status === 'online' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {yachtData.status === 'online' ? (
                  <><Wifi className="w-3 h-3 mr-1" />Online</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" />Offline</>
                )}
              </Badge>
              
              <div className="text-white text-sm">
                <MapPin className="w-4 h-4 inline mr-1" />
                {yachtData.current_location.port || 'At Sea'}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleAddCrew}>
                  <Plus className="w-4 h-4 mr-1" />Add Crew
                </Button>
                <Button size="sm" variant="secondary" onClick={handleUploadCertificate}>
                  <Upload className="w-4 h-4 mr-1" />Upload Certificate
                </Button>
                <Button size="sm" variant="secondary" onClick={handleLogMaintenance}>
                  <ClipboardList className="w-4 h-4 mr-1" />Log Maintenance
                </Button>
                <Button size="sm" variant="secondary" onClick={handleAddExpense}>
                  <Receipt className="w-4 h-4 mr-1" />Add Expense
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Navigation Menu */}
          <div className="w-64 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground mb-4">MANAGEMENT MODULES</h3>
            
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'crew', label: 'Crew', icon: Users },
              { id: 'certificates', label: 'Certificates', icon: FileText },
              { id: 'finance', label: 'Finance', icon: DollarSign },
              { id: 'maintenance', label: 'Maintenance & Equipment', icon: Wrench },
              { id: 'itinerary', label: 'Itinerary & Guests', icon: Calendar },
              { id: 'documents', label: 'Documents & ISM', icon: FileText },
              { id: 'vendors', label: 'Vendors', icon: Store },
              { id: 'tasks', label: 'Tasks & Notifications', icon: CheckSquare }
            ].map((module) => (
              <Button
                key={module.id}
                variant={selectedModule === module.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedModule(module.id);
                  if (module.id !== 'overview') {
                    navigateToModule(module.id);
                  }
                }}
              >
                <module.icon className="w-4 h-4 mr-2" />
                {module.label}
              </Button>
            ))}
          </div>

          {/* Main Dashboard Panels */}
          <div className="flex-1">
            {selectedModule === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Crew Status Panel */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigateToModule('crew')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Crew Status
                        </div>
                        <Badge variant="outline">12</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Active Crew</span>
                        <span className="font-semibold">11/12</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>3 certificates expiring soon</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Finance Panel */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigateToModule('finance')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          Finance Summary
                        </div>
                        <Badge variant="destructive">3</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Monthly Budget</span>
                          <span className="font-semibold">$50,000</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Spent This Month</span>
                          <span className="font-semibold">$32,500</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Maintenance Panel */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => navigateToModule('maintenance')}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Maintenance
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-semibold">87%</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Engine service due in 12 hours</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Upcoming</span>
                          <div className="font-semibold">5</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Alerts</span>
                          <div className="font-semibold">3</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Assistant Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      AI Assistant Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-2 rounded-full bg-red-100 text-red-600">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Engine service due in 12 hours</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                        <Badge variant="destructive">urgent</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Sidebar - Quick Insights */}
          <div className="w-80 space-y-6">
            {/* Weather & Navigation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Navigation & Weather
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Wind</span>
                    <div className="font-semibold">12 kts NE</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Wave</span>
                    <div className="font-semibold">1.2m</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Visibility</span>
                    <div className="font-semibold">10+ nm</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Temp</span>
                    <div className="font-semibold">24°C</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4" />
                      <span className="text-sm">Battery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={98} className="w-20 h-2" />
                      <span className="text-sm font-semibold">98%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      <span className="text-sm">Fuel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="w-20 h-2" />
                      <span className="text-sm font-semibold">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Security</span>
                    </div>
                    <Badge variant="default" className="text-xs">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Length</span>
                  <span className="font-semibold">{yachtData.specifications.length_meters}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Beam</span>
                  <span className="font-semibold">{yachtData.specifications.beam_meters}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Gross Tonnage</span>
                  <span className="font-semibold">{yachtData.specifications.gross_tonnage}t</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YachtPage;