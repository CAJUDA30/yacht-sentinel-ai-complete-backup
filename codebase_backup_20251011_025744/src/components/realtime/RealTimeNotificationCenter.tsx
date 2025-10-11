import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Filter,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  Anchor,
  Navigation,
  Thermometer,
  Battery,
  Users
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'system' | 'navigation' | 'engine' | 'crew' | 'weather' | 'maintenance';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
  source: string;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  email: boolean;
  sms: boolean;
  pushNotifications: boolean;
  categories: {
    [key: string]: boolean;
  };
}

const RealTimeNotificationCenter = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'critical',
      category: 'engine',
      title: 'Engine Temperature Critical',
      message: 'Engine temperature has exceeded safe operating limits. Immediate attention required.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      priority: 'high',
      actionRequired: true,
      source: 'Engine Monitor'
    },
    {
      id: '2',
      type: 'warning',
      category: 'navigation',
      title: 'Weather Alert',
      message: 'Strong winds approaching from the northwest. Consider altering course.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      priority: 'medium',
      actionRequired: false,
      source: 'Weather Service'
    },
    {
      id: '3',
      type: 'info',
      category: 'crew',
      title: 'Crew Check-in',
      message: 'All crew members have completed their scheduled safety check-in.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      read: true,
      priority: 'low',
      actionRequired: false,
      source: 'Crew Management'
    },
    {
      id: '4',
      type: 'success',
      category: 'system',
      title: 'System Update Complete',
      message: 'Navigation system has been successfully updated to version 2.4.1.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      priority: 'low',
      actionRequired: false,
      source: 'System Manager'
    }
  ]);

  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    vibration: true,
    email: false,
    sms: true,
    pushNotifications: true,
    categories: {
      system: true,
      navigation: true,
      engine: true,
      crew: true,
      weather: true,
      maintenance: true
    }
  });

  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'today'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'critical') return AlertTriangle;
    if (type === 'warning') return Bell;
    if (type === 'success') return CheckCircle;
    
    switch (category) {
      case 'engine': return Thermometer;
      case 'navigation': return Navigation;
      case 'crew': return Users;
      case 'system': return Zap;
      case 'maintenance': return Battery;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'warning': return 'hsl(var(--warning))';
      case 'success': return 'hsl(var(--success))';
      default: return 'hsl(var(--primary))';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'critical' && notification.type !== 'critical') return false;
    if (filter === 'today') {
      const today = new Date();
      const notificationDate = notification.timestamp;
      if (notificationDate.toDateString() !== today.toDateString()) return false;
    }
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.type === 'critical' && !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateSettings = useCallback((key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Simulate real-time notifications
  useEffect(() => {
    if (!settings.enabled) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: Math.random() > 0.7 ? 'warning' : 'info',
          category: ['system', 'navigation', 'engine', 'crew', 'weather'][Math.floor(Math.random() * 5)] as any,
          title: 'System Alert',
          message: 'New automated system notification received.',
          timestamp: new Date(),
          read: false,
          priority: 'medium',
          actionRequired: Math.random() > 0.5,
          source: 'Auto Monitor'
        };

        setNotifications(prev => [newNotification, ...prev]);
        
        if (settings.sound) {
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [settings.enabled, settings.sound, toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BellRing className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">Notification Center</h2>
            <p className="text-muted-foreground">
              {unreadCount} unread notifications
              {criticalCount > 0 && (
                <span className="ml-2 text-red-600 font-medium">
                  ({criticalCount} critical)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark All Read
          </Button>
          <Badge variant={settings.enabled ? 'default' : 'secondary'}>
            {settings.enabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'critical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('critical')}
                >
                  Critical ({criticalCount})
                </Button>
                <Button
                  variant={filter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('today')}
                >
                  Today
                </Button>
              </div>
              
              <div className="flex gap-2 mt-3">
                <select
                  className="px-3 py-1 border rounded-md text-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="system">System</option>
                  <option value="navigation">Navigation</option>
                  <option value="engine">Engine</option>
                  <option value="crew">Crew</option>
                  <option value="weather">Weather</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type, notification.category);
                return (
                  <Card
                    key={notification.id}
                    className={`${!notification.read ? 'border-l-4' : ''}`}
                    style={{
                      borderLeftColor: !notification.read ? getNotificationColor(notification.type) : undefined
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <IconComponent 
                            className="h-4 w-4" 
                            style={{ color: getNotificationColor(notification.type) }}
                          />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{notification.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {notification.actionRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  Action Required
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {notification.priority}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {notification.timestamp.toLocaleString()}
                              <span>•</span>
                              <span>{notification.source}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                disabled={notification.read}
                              >
                                {notification.read ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredNotifications.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      You're all caught up! No notifications match your current filters.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">General</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>Enable Notifications</span>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateSettings('enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <span>Sound Alerts</span>
                    </div>
                    <Switch
                      checked={settings.sound}
                      onCheckedChange={(checked) => updateSettings('sound', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Vibration</span>
                    </div>
                    <Switch
                      checked={settings.vibration}
                      onCheckedChange={(checked) => updateSettings('vibration', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Methods */}
              <div className="space-y-4">
                <h4 className="font-medium">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Push Notifications</span>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => updateSettings('pushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Notifications</span>
                    </div>
                    <Switch
                      checked={settings.email}
                      onCheckedChange={(checked) => updateSettings('email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>SMS Alerts</span>
                    </div>
                    <Switch
                      checked={settings.sms}
                      onCheckedChange={(checked) => updateSettings('sms', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h4 className="font-medium">Categories</h4>
                <div className="space-y-3">
                  {Object.entries(settings.categories).map(([category, enabled]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize">{category}</span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => 
                          updateSettings('categories', { ...settings.categories, [category]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeNotificationCenter;