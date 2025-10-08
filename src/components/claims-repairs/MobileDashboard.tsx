import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClaimsRepairs } from '@/contexts/ClaimsRepairsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Plus, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Phone,
  MapPin,
  DollarSign,
  Users,
  Mic,
  ArrowRight
} from 'lucide-react';

export const MobileDashboard: React.FC = () => {
  const { jobs, refreshData } = useClaimsRepairs();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    critical: 0,
    totalCost: 0
  });

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (jobs) {
      const active = jobs.filter(job => ['draft', 'in_progress', 'pending_approval'].includes(job.status)).length;
      const completed = jobs.filter(job => job.status === 'completed').length;
      const critical = jobs.filter(job => job.priority === 'critical').length;
      const totalCost = jobs.reduce((sum, job) => sum + (job.actual_cost || job.estimated_cost || 0), 0);

      setStats({
        total: jobs.length,
        active,
        completed,
        critical,
        totalCost
      });
    }
  }, [jobs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'pending_approval':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'draft':
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const recentJobs = jobs?.slice(0, 5) || [];

  return (
    <div className="space-y-4 p-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <Wrench className="h-8 w-8 text-primary opacity-60" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500 opacity-60" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 opacity-60" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-xl font-bold">${stats.totalCost.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500 opacity-60" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button className="flex items-center gap-2 h-12">
              <Plus className="h-4 w-4" />
              New Job
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-12">
              <Mic className="h-4 w-4" />
              Voice Chat
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-12">
              <Phone className="h-4 w-4" />
              Emergency
            </Button>
            <Button variant="outline" className="flex items-center gap-2 h-12">
              <MapPin className="h-4 w-4" />
              Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Jobs</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">
              View All
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{job.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {job.description}
                      </p>
                    </div>
                    <Badge 
                      variant={getPriorityColor(job.priority || 'medium')}
                      className="ml-2 text-xs"
                    >
                      {job.priority || 'medium'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(job.status)} text-xs`}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {job.estimated_cost && (
                        <span>${job.estimated_cost.toLocaleString()}</span>
                      )}
                      <Clock className="h-3 w-3" />
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {job.assigned_to && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>Assigned to crew</span>
                    </div>
                  )}
                </div>
              ))}
              
              {recentJobs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No repair jobs yet</p>
                  <p className="text-xs">Create your first job to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Mobile-Specific Features */}
      {isMobile && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Mobile Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Voice Commands</p>
                    <p className="text-xs text-muted-foreground">Control app with voice</p>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Location Services</p>
                    <p className="text-xs text-muted-foreground">Auto-tag job locations</p>
                  </div>
                </div>
                <Badge variant="outline">Available</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Real-time updates</p>
                  </div>
                </div>
                <Badge variant="secondary">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};