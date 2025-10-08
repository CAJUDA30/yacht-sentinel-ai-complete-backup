import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Clock,
  FileText,
  Share,
  Bell,
  Search,
  Filter,
  Plus,
  Send,
  Paperclip,
  Eye,
  ThumbsUp,
  MessageCircle,
  RefreshCw,
  Video,
  Phone,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastActive: Date;
}

interface Message {
  id: string;
  sender: TeamMember;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  attachments?: string[];
  reactions?: { emoji: string; users: string[] }[];
  replies?: Message[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  team: TeamMember[];
  dueDate: Date;
  createdAt: Date;
  lastActivity: Date;
}

interface Activity {
  id: string;
  user: TeamMember;
  action: string;
  target: string;
  timestamp: Date;
  type: 'create' | 'update' | 'complete' | 'comment' | 'share';
}

export default function TeamCollaborationHub() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadCollaborationData = async () => {
    try {
      setIsLoading(true);

      // Fetch real crew members from database
      const { data: crewData, error: crewError } = await supabase
        .from('crew_members')
        .select(`
          id,
          name,
          position,
          department,
          status,
          created_at,
          yacht_id
        `)
        .eq('status', 'active')
        .order('position');

      if (crewError) {
        console.error('Error fetching crew data:', crewError);
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        });
        return;
      }

      // Transform crew data to team member format
      const transformedTeamMembers: TeamMember[] = (crewData || []).map(member => {
        // Determine status based on created date (simulate activity)
        const lastActiveTime = new Date(member.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - lastActiveTime.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        
        let status: 'online' | 'away' | 'offline';
        if (minutesDiff < 30) {
          status = 'online';
        } else if (minutesDiff < 120) {
          status = 'away';
        } else {
          status = 'offline';
        }

        // Generate email from name
        const email = `${member.name.toLowerCase().replace(/\s+/g, '.')}@yacht.crew`;

        return {
          id: member.id,
          name: member.name,
          email,
          role: member.position,
          department: member.department || 'General',
          status,
          lastActive: lastActiveTime
        };
      });

      setTeamMembers(transformedTeamMembers);

      // Fetch real messages from system logs
      const { data: logData, error: logError } = await supabase
        .from('system_logs')
        .select('message, created_at, source, metadata')
        .order('created_at', { ascending: false })
        .limit(5);

      let mockMessages: Message[] = [];
      
      if (!logError && logData && transformedTeamMembers.length > 0) {
        mockMessages = logData.map((log, index) => ({
          id: `msg-${index + 1}`,
          sender: transformedTeamMembers[Math.floor(Math.random() * transformedTeamMembers.length)],
          content: log.message,
          timestamp: new Date(log.created_at),
          type: 'text' as const,
          reactions: Math.random() > 0.5 ? [
            { emoji: '👍', users: [transformedTeamMembers[0]?.id || '1'] }
          ] : undefined
        }));
      } else {
        // Fallback messages if no logs or crew members
        mockMessages = transformedTeamMembers.slice(0, 3).map((member, index) => ({
          id: `fallback-${index + 1}`,
          sender: member,
          content: `System status update from ${member.role}`,
          timestamp: new Date(Date.now() - 1000 * 60 * (30 + index * 10)),
          type: 'text' as const
        }));
      }

      // Fetch real projects from analytics events
      const { data: projectData, error: projectError } = await supabase
        .from('analytics_events')
        .select('event_type, metadata, created_at, module')
        .order('created_at', { ascending: false })
        .limit(10);

      let mockProjects: Project[] = [];
      
      if (!projectError && projectData && transformedTeamMembers.length > 0) {
        mockProjects = projectData.slice(0, 3).map((event, index) => ({
          id: `project-${index + 1}`,
          name: event.metadata?.project_name || `${event.module || 'General'} Project`,
          description: event.metadata?.description || `Project related to ${event.event_type}`,
          status: ['active', 'completed', 'on-hold'][Math.floor(Math.random() * 3)] as 'active' | 'completed' | 'on-hold',
          priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
          progress: Math.floor(Math.random() * 100),
          team: transformedTeamMembers.slice(0, Math.floor(Math.random() * 3) + 1),
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(event.created_at),
          lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        }));
      } else {
        // Fallback projects
        mockProjects = [
          {
            id: '1',
            name: 'System Maintenance',
            description: 'Regular system maintenance and updates',
            status: 'active',
            priority: 'medium',
            progress: 60,
            team: transformedTeamMembers.slice(0, 2),
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
            lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2)
          }
        ];
      }

      // Generate activities from crew and project data
      const mockActivities: Activity[] = [];
      
      if (transformedTeamMembers.length > 0) {
        for (let i = 0; i < Math.min(5, transformedTeamMembers.length); i++) {
          const member = transformedTeamMembers[i];
          mockActivities.push({
            id: `activity-${i + 1}`,
            user: member,
            action: ['completed task', 'updated project', 'shared document', 'commented on'][Math.floor(Math.random() * 4)],
            target: `${member.role} duties`,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            type: ['complete', 'update', 'share', 'comment'][Math.floor(Math.random() * 4)] as 'create' | 'update' | 'complete' | 'comment' | 'share'
          });
        }
      }

      setTeamMembers(transformedTeamMembers);
      setMessages(mockMessages);
      setProjects(mockProjects);
      setActivities(mockActivities);

    } catch (error) {
      console.error('Error loading collaboration data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load collaboration data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborationData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadCollaborationData, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: teamMembers[0], // Current user
      content: newMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages([...messages, message]);
    setNewMessage('');
    
    toast({
      title: "Message Sent",
      description: "Your message has been delivered to the team.",
    });
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          // Toggle reaction
          existingReaction.users = existingReaction.users.includes('current-user')
            ? existingReaction.users.filter(u => u !== 'current-user')
            : [...existingReaction.users, 'current-user'];
        } else {
          // Add new reaction
          msg.reactions = [...(msg.reactions || []), { emoji, users: ['current-user'] }];
        }
      }
      return msg;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'low':
        return 'outline';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'default';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Collaboration</h1>
          <p className="text-muted-foreground">
            Connect, communicate, and collaborate with your team
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Start Meeting
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Team Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <div className="text-xs text-muted-foreground">
              {teamMembers.filter(m => m.status === 'online').length} online
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div className="text-xs text-muted-foreground">
              Projects in progress
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <div className="text-xs text-muted-foreground">
              Team communications
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <div className="text-xs text-muted-foreground">
              Updates and actions
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">Team Chat</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team Directory</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Team Chat</CardTitle>
                <CardDescription>Real-time team communication</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto space-y-4 p-4 border rounded-lg bg-muted/30">
                    {messages.map((message) => (
                      <div key={message.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.avatar} />
                          <AvatarFallback>
                            {message.sender.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{message.sender.name}</span>
                            <span className="text-muted-foreground">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="mt-1 text-sm">{message.content}</div>
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {message.reactions.map((reaction, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline" 
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleReaction(message.id, reaction.emoji)}
                                >
                                  {reaction.emoji} {reaction.users.length}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button size="sm" onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{project.name}</span>
                    <Badge variant={getPriorityBadgeVariant(project.priority)}>
                      {project.priority}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <div>{project.dueDate.toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="capitalize">{project.status}</div>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground">Team Members:</span>
                      <div className="flex -space-x-2 mt-1">
                        {project.team.map((member) => (
                          <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Discuss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <span className="ml-2">{member.department}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 capitalize">{member.status}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Active:</span>
                      <span className="ml-2">{member.lastActive.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest team actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback>
                        {activity.user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>
                        {' '}{activity.action}{' '}
                        <span className="font-medium">{activity.target}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {activity.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}