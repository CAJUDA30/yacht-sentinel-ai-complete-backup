import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Eye,
  Edit3,
  MessageSquare,
  Clock,
  Activity,
  Zap,
  Bell,
  UserCheck,
  UserX
} from 'lucide-react';

interface UserPresence {
  user_id: string;
  online_at: string;
  status: 'online' | 'away' | 'busy';
  current_job?: string;
  current_action?: string;
  display_name?: string;
  avatar_url?: string;
}

interface CollaborationActivity {
  id: string;
  user_id: string;
  action: string;
  details: string;
  job_id?: string;
  timestamp: string;
  display_name?: string;
}

export const LiveCollaboration: React.FC = () => {
  const { toast } = useToast();
  const [presenceData, setPresenceData] = useState<UserPresence[]>([]);
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Set up presence tracking
    const setupPresence = async () => {
      const channel = supabase.channel('claims-repairs-presence');

      // Track user presence
      channel
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          const users: UserPresence[] = [];
          
          Object.keys(newState).forEach((key) => {
            const presences = newState[key] as any[];
            presences.forEach((presence) => {
              users.push({
                user_id: key,
                online_at: presence.online_at,
                status: presence.status || 'online',
                current_job: presence.current_job,
                current_action: presence.current_action,
                display_name: presence.display_name || 'Unknown User',
                avatar_url: presence.avatar_url
              });
            });
          });
          
          setPresenceData(users);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
          // Add activity log
          const newActivity: CollaborationActivity = {
            id: Math.random().toString(36).substr(2, 9),
            user_id: key,
            action: 'joined',
            details: 'Started working on Claims & Repairs',
            timestamp: new Date().toISOString(),
            display_name: newPresences[0]?.display_name || 'Unknown User'
          };
          setActivities(prev => [newActivity, ...prev.slice(0, 19)]); // Keep last 20
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
          // Add activity log
          const newActivity: CollaborationActivity = {
            id: Math.random().toString(36).substr(2, 9),
            user_id: key,
            action: 'left',
            details: 'Stopped working on Claims & Repairs',
            timestamp: new Date().toISOString(),
            display_name: leftPresences[0]?.display_name || 'Unknown User'
          };
          setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
        });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          const userStatus = {
            user_id: currentUser.id,
            online_at: new Date().toISOString(),
            status: 'online',
            current_job: null,
            current_action: 'viewing_dashboard',
            display_name: currentUser.user_metadata?.display_name || currentUser.email,
            avatar_url: currentUser.user_metadata?.avatar_url
          };

          await channel.track(userStatus);
          setIsTracking(true);
          
          toast({
            title: "Live Collaboration Active",
            description: "You're now visible to other team members",
          });
        }
      });

      return channel;
    };

    const channel = setupPresence();

    return () => {
      channel.then(ch => ch.unsubscribe());
    };
  }, [currentUser, toast]);

  const updatePresence = async (updates: Partial<UserPresence>) => {
    if (!currentUser) return;

    const channel = supabase.channel('claims-repairs-presence');
    
    const userStatus = {
      user_id: currentUser.id,
      online_at: new Date().toISOString(),
      status: 'online',
      display_name: currentUser.user_metadata?.display_name || currentUser.email,
      avatar_url: currentUser.user_metadata?.avatar_url,
      ...updates
    };

    await channel.track(userStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'joined':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'left':
        return <UserX className="h-4 w-4 text-red-500" />;
      case 'editing':
        return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'viewing':
        return <Eye className="h-4 w-4 text-gray-500" />;
      case 'commenting':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const simulateActivity = (action: string, details: string) => {
    if (!currentUser) return;

    const activity: CollaborationActivity = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: currentUser.id,
      action,
      details,
      timestamp: new Date().toISOString(),
      display_name: currentUser.user_metadata?.display_name || currentUser.email
    };

    setActivities(prev => [activity, ...prev.slice(0, 19)]);
    
    // Update presence with current action
    updatePresence({ current_action: action });
  };

  const onlineUsers = presenceData.filter(user => user.status === 'online');
  const activeUsers = presenceData.length;

  return (
    <div className="space-y-6">
      {/* Presence Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Presence
            <Badge variant={isTracking ? "default" : "secondary"} className="ml-2">
              {isTracking ? 'Live' : 'Offline'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time collaboration for Claims & Repairs • {activeUsers} active users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {presenceData.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.display_name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                  </div>
                  
                  <div>
                    <p className="font-medium text-sm">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.current_action?.replace('_', ' ') || 'Active'}
                      {user.current_job && ` • Job ${user.current_job}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {user.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.online_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {presenceData.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">No team members online</p>
                <p className="text-xs">Invite your team to collaborate in real-time</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Live updates from your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActionIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.display_name}</span>
                      {' '}
                      <span className="text-muted-foreground">{activity.details}</span>
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                      {activity.job_id && (
                        <Badge variant="outline" className="text-xs">
                          Job #{activity.job_id.slice(0, 8)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {activities.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs">Team actions will appear here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Collaboration Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Collaboration Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button 
              onClick={() => simulateActivity('editing', 'Started editing a repair job')}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Simulate Edit
            </Button>
            
            <Button 
              onClick={() => simulateActivity('viewing', 'Opened job details')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Simulate View
            </Button>
            
            <Button 
              onClick={() => simulateActivity('commenting', 'Added a comment')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Simulate Comment
            </Button>
            
            <Button 
              onClick={() => updatePresence({ status: 'busy', current_action: 'in_meeting' })}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Set Busy
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Real-time collaboration powered by Supabase Realtime
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};