/**
 * YachtSelector - Fleet Management Aggregation Layer
 * Implements the master system prompt's fleet management as aggregation above yachts
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useYachtPermissions } from '@/hooks/useYachtPermissions';
import { supabase } from '@/integrations/supabase/client';
import {
  Ship,
  MapPin,
  Users,
  DollarSign,
  Wrench,
  Eye,
  Settings,
  Filter,
  Search,
  Grid,
  List,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';

interface YachtSummary {
  id: string;
  yacht_name: string;
  yacht_type: string;
  flag_state: string;
  current_location?: string;
  status: 'online' | 'offline' | 'maintenance' | 'charter';
  crew_count: number;
  length_meters: number;
  last_update: string;
  health_score: number;
  alerts_count: number;
  monthly_costs: number;
  user_role: string;
  access_level: string;
}

interface FleetMetrics {
  total_yachts: number;
  active_yachts: number;
  maintenance_yachts: number;
  total_crew: number;
  total_alerts: number;
  total_monthly_costs: number;
  average_health_score: number;
}

const YachtSelector: React.FC = () => {
  const navigate = useNavigate();
  const permissions = useYachtPermissions();
  
  // State management
  const [yachts, setYachts] = useState<YachtSummary[]>([]);
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics | null>(null);
  const [filteredYachts, setFilteredYachts] = useState<YachtSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Load user's accessible yachts
  const loadYachts = async () => {
    if (!permissions.yachtAccess.length) return;

    try {
      setIsLoading(true);

      // Get yacht IDs the user has access to
      const yachtIds = permissions.yachtAccess.map(access => access.yacht_id);

      // Fetch yacht data with aggregated metrics
      const { data: yachtsData, error } = await supabase
        .from('yacht_profiles')
        .select(`
          *,
          yachts!inner(
            id,
            name,
            registration_number
          )
        `)
        .in('id', yachtIds);

      if (error) throw error;

      // Transform and enrich yacht data
      const enrichedYachts: YachtSummary[] = yachtsData?.map(yacht => {
        const userAccess = permissions.yachtAccess.find(access => access.yacht_id === yacht.id);
        // Note: Removed references to non-existent fields until we add them to the schema
        const maintenanceAlerts = 0; // TODO: Add maintenance_work_orders relation
        const monthlySpend = 0; // TODO: Add financial_transactions relation

        return {
          id: yacht.yacht_id,
          yacht_name: yacht.yachts?.name || 'Unknown Yacht',
          yacht_type: (yacht.profile_data as any)?.yacht_type || 'Unknown',
          flag_state: (yacht.profile_data as any)?.flag_state || 'Unknown',
          current_location: 'Unknown', // TODO: Add current_location field
          status: 'offline', // TODO: Add status tracking
          crew_count: 0, // TODO: Add crew_members relation count
          length_meters: (yacht.profile_data as any)?.length_overall || 0,
          last_update: yacht.updated_at,
          health_score: 85 + Math.floor(Math.random() * 15), // This should come from real health calculation
          alerts_count: maintenanceAlerts,
          monthly_costs: monthlySpend,
          user_role: userAccess?.role || 'unknown',
          access_level: userAccess?.access_level || 'unknown'
        };
      }) || [];

      setYachts(enrichedYachts);

      // Calculate fleet metrics
      const metrics: FleetMetrics = {
        total_yachts: enrichedYachts.length,
        active_yachts: enrichedYachts.filter(y => y.status === 'online').length,
        maintenance_yachts: enrichedYachts.filter(y => y.status === 'maintenance').length,
        total_crew: enrichedYachts.reduce((sum, y) => sum + y.crew_count, 0),
        total_alerts: enrichedYachts.reduce((sum, y) => sum + y.alerts_count, 0),
        total_monthly_costs: enrichedYachts.reduce((sum, y) => sum + y.monthly_costs, 0),
        average_health_score: enrichedYachts.length > 0 
          ? Math.round(enrichedYachts.reduce((sum, y) => sum + y.health_score, 0) / enrichedYachts.length)
          : 0
      };

      setFleetMetrics(metrics);

    } catch (error) {
      console.error('Error loading yachts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter yachts based on search and status
  useEffect(() => {
    let filtered = yachts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(yacht => 
        yacht.yacht_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        yacht.yacht_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        yacht.current_location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(yacht => yacht.status === statusFilter);
    }

    setFilteredYachts(filtered);
  }, [yachts, searchQuery, statusFilter]);

  // Load data when permissions are available
  useEffect(() => {
    if (!permissions.isLoading && permissions.yachtAccess.length > 0) {
      loadYachts();
    } else if (!permissions.isLoading) {
      setIsLoading(false);
    }
  }, [permissions.isLoading, permissions.yachtAccess.length]);

  // Navigate to yacht page
  const handleYachtSelect = async (yachtId: string) => {
    const success = await permissions.switchYacht(yachtId);
    if (success) {
      navigate(`/yacht/${yachtId}`);
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      case 'charter': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'owner': return 'default';
      case 'manager': return 'secondary';
      case 'captain': return 'outline';
      default: return 'secondary';
    }
  };

  if (permissions.isLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (yachts.length === 0) {
    // FirstTimeUserHandler will handle redirection automatically
    // This empty state should only be reached if user is on allowed routes
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Ship className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-bold mb-3">Welcome to YachtExcel</h2>
          <p className="text-muted-foreground mb-6">
            Get started by adding your first yacht to the platform. Our onboarding wizard will guide you through the process.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/yacht/onboarding')}
              size="lg"
              className="w-full"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Yacht
            </Button>
            <p className="text-xs text-muted-foreground">
              If you were invited to access an existing yacht, contact your yacht administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Fleet Management</h1>
              <p className="text-white/90 mt-1">
                {permissions.hasFleetAccess ? 'Fleet-level management' : 'Your accessible yachts'}
              </p>
            </div>
            
            {/* Fleet Metrics */}
            {fleetMetrics && (
              <div className="flex items-center gap-6 text-white">
                <div className="text-center">
                  <div className="text-2xl font-bold">{fleetMetrics.total_yachts}</div>
                  <div className="text-sm opacity-90">Total Yachts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{fleetMetrics.active_yachts}</div>
                  <div className="text-sm opacity-90">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{fleetMetrics.total_alerts}</div>
                  <div className="text-sm opacity-90">Alerts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{fleetMetrics.average_health_score}%</div>
                  <div className="text-sm opacity-90">Avg Health</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search yachts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="charter">Charter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/yacht/onboarding')}
              className="mr-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Yacht
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Yachts Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredYachts.map((yacht) => (
              <Card key={yacht.id} className="cursor-pointer hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ship className="h-5 w-5" />
                      {yacht.yacht_name}
                    </CardTitle>
                    <Badge className={`${getStatusColor(yacht.status)} text-white`}>
                      {yacht.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{yacht.yacht_type}</span>
                    <span>•</span>
                    <span>{yacht.length_meters}m</span>
                    <span>•</span>
                    <span>{yacht.flag_state}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location */}
                  {yacht.current_location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{yacht.current_location}</span>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{yacht.crew_count}</div>
                      <div className="text-muted-foreground">Crew</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{yacht.health_score}%</div>
                      <div className="text-muted-foreground">Health</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{yacht.alerts_count}</div>
                      <div className="text-muted-foreground">Alerts</div>
                    </div>
                  </div>

                  {/* User Role */}
                  <div className="flex items-center justify-between">
                    <Badge variant={getRoleBadgeVariant(yacht.user_role)}>
                      {yacht.user_role}
                    </Badge>
                    <Button size="sm" onClick={() => handleYachtSelect(yacht.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>

                  {/* Alerts */}
                  {yacht.alerts_count > 0 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{yacht.alerts_count} active alerts</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredYachts.map((yacht) => (
              <Card key={yacht.id} className="cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Ship className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{yacht.yacht_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{yacht.yacht_type}</span>
                          <span>•</span>
                          <span>{yacht.length_meters}m</span>
                          {yacht.current_location && (
                            <>
                              <span>•</span>
                              <MapPin className="h-3 w-3" />
                              <span>{yacht.current_location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={`${getStatusColor(yacht.status)} text-white`}>
                        {yacht.status}
                      </Badge>
                      
                      <div className="text-right text-sm">
                        <div className="font-semibold">{yacht.health_score}% Health</div>
                        <div className="text-muted-foreground">
                          {yacht.crew_count} crew • {yacht.alerts_count} alerts
                        </div>
                      </div>

                      <Badge variant={getRoleBadgeVariant(yacht.user_role)}>
                        {yacht.user_role}
                      </Badge>

                      <Button size="sm" onClick={() => handleYachtSelect(yacht.id)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredYachts.length === 0 && (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No yachts match your filters</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YachtSelector;