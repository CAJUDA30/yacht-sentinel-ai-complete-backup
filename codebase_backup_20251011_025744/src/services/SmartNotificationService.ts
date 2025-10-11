import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from "./YachtieIntegrationService";
import { universalEventBus } from "./UniversalEventBus";

interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  userId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
  expiresAt?: Date;
  actions?: NotificationAction[];
  isRead: boolean;
  isDismissed: boolean;
  deliveryChannels: DeliveryChannel[];
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'callback';
  action: string;
  style?: 'primary' | 'secondary' | 'destructive';
}

interface DeliveryChannel {
  type: 'browser' | 'email' | 'sms' | 'push' | 'sound' | 'webhook';
  address?: string;
  enabled: boolean;
  deliveredAt?: Date;
  status: 'pending' | 'delivered' | 'failed';
}

interface NotificationRule {
  id: string;
  name: string;
  conditions: Record<string, any>;
  template: {
    title: string;
    message: string;
    type: SmartNotification['type'];
    priority: SmartNotification['priority'];
  };
  channels: DeliveryChannel['type'][];
  isActive: boolean;
  cooldownMinutes?: number;
  lastTriggered?: Date;
}

interface NotificationPreferences {
  userId: string;
  globalEnabled: boolean;
  channels: {
    browser: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    sound: boolean;
  };
  categories: Record<string, {
    enabled: boolean;
    priority: SmartNotification['priority'];
    channels: DeliveryChannel['type'][];
  }>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  frequency: {
    maxPerHour: number;
    maxPerDay: number;
    groupSimilar: boolean;
  };
}

class SmartNotificationService {
  private notifications = new Map<string, SmartNotification>();
  private rules = new Map<string, NotificationRule>();
  private preferences = new Map<string, NotificationPreferences>();
  private isInitialized = false;
  private deliveredCounts = new Map<string, { hour: number; day: number; lastReset: Date }>();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.setupDefaultRules();
    this.setupEventListeners();
    this.requestNotificationPermission();
    this.setupPeriodicCleanup();
    
    this.isInitialized = true;
    console.log('SmartNotificationService initialized');
  }

  private async setupDefaultRules(): Promise<void> {
    const defaultRules: NotificationRule[] = [
      {
        id: 'equipment_failure',
        name: 'Equipment Failure Alert',
        conditions: {
          module: 'equipment',
          event_type: 'failure_detected',
          severity: ['high', 'critical']
        },
        template: {
          title: 'Equipment Failure Detected',
          message: 'Critical equipment failure requires immediate attention',
          type: 'error',
          priority: 'critical'
        },
        channels: ['browser', 'push', 'sound'],
        isActive: true
      },
      {
        id: 'maintenance_due',
        name: 'Maintenance Due Reminder',
        conditions: {
          module: 'maintenance',
          event_type: 'maintenance_due',
          days_until_due: { '<=': 3 }
        },
        template: {
          title: 'Maintenance Due Soon',
          message: 'Scheduled maintenance is due within 3 days',
          type: 'warning',
          priority: 'high'
        },
        channels: ['browser', 'email'],
        isActive: true,
        cooldownMinutes: 1440 // 24 hours
      },
      {
        id: 'low_inventory',
        name: 'Low Inventory Alert',
        conditions: {
          module: 'inventory',
          event_type: 'stock_below_threshold',
          criticality: ['high', 'medium']
        },
        template: {
          title: 'Low Inventory Alert',
          message: 'Critical inventory items are running low',
          type: 'warning',
          priority: 'medium'
        },
        channels: ['browser', 'email'],
        isActive: true,
        cooldownMinutes: 360 // 6 hours
      },
      {
        id: 'weather_alert',
        name: 'Weather Alert',
        conditions: {
          module: 'weather',
          event_type: 'severe_weather',
          severity: ['high', 'extreme']
        },
        template: {
          title: 'Severe Weather Alert',
          message: 'Severe weather conditions detected in your area',
          type: 'alert',
          priority: 'high'
        },
        channels: ['browser', 'push', 'sound'],
        isActive: true
      },
      {
        id: 'crew_emergency',
        name: 'Crew Emergency',
        conditions: {
          module: 'crew',
          event_type: 'emergency',
          priority: 'critical'
        },
        template: {
          title: 'Crew Emergency',
          message: 'Emergency situation reported by crew member',
          type: 'error',
          priority: 'critical'
        },
        channels: ['browser', 'push', 'sound'],
        isActive: true
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private setupEventListeners(): void {
    // Listen to all system events for potential notifications
    universalEventBus.subscribe('*', async (event) => {
      await this.processEventForNotifications(event);
    });

    // Listen for notification-specific events
    universalEventBus.subscribe('notification_*', async (event) => {
      if (event.type === 'notification_action') {
        await this.handleNotificationAction(event.payload);
      } else if (event.type === 'notification_read') {
        await this.markAsRead(event.payload.notificationId, event.payload.userId);
      } else if (event.type === 'notification_dismiss') {
        await this.dismissNotification(event.payload.notificationId, event.payload.userId);
      }
    });
  }

  private async processEventForNotifications(event: any): Promise<void> {
    try {
      // Find matching rules
      const matchingRules = Array.from(this.rules.values())
        .filter(rule => rule.isActive && this.matchesConditions(event, rule.conditions));

      for (const rule of matchingRules) {
        // Check cooldown
        if (rule.cooldownMinutes && rule.lastTriggered) {
          const cooldownMs = rule.cooldownMinutes * 60 * 1000;
          const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
          
          if (timeSinceLastTrigger < cooldownMs) {
            continue; // Skip due to cooldown
          }
        }

        // Generate notification using AI for contextual content
        const notification = await this.generateSmartNotification(rule, event);
        
        if (notification) {
          await this.sendNotification(notification);
          rule.lastTriggered = new Date();
        }
      }
    } catch (error) {
      console.error('Failed to process event for notifications:', error);
    }
  }

  private matchesConditions(event: any, conditions: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const eventValue = event.payload?.[key] || event[key];
      
      if (typeof expectedValue === 'object' && expectedValue !== null) {
        // Handle operators like { '<=': 3 }
        for (const [operator, operandValue] of Object.entries(expectedValue)) {
          switch (operator) {
            case '<=':
              if (!(eventValue <= operandValue)) return false;
              break;
            case '>=':
              if (!(eventValue >= operandValue)) return false;
              break;
            case '<':
              if (!(eventValue < operandValue)) return false;
              break;
            case '>':
              if (!(eventValue > operandValue)) return false;
              break;
            case '!=':
              if (eventValue === operandValue) return false;
              break;
            default:
              if (eventValue !== operandValue) return false;
          }
        }
      } else if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(eventValue)) return false;
      } else if (expectedValue !== eventValue) {
        return false;
      }
    }
    return true;
  }

  private async generateSmartNotification(rule: NotificationRule, event: any): Promise<SmartNotification | null> {
    try {
      // Use AI to generate contextual notification content
      const aiRequest = {
        text: `Generate notification for ${rule.name}`,
        task: 'summarize' as const,
        context: JSON.stringify({
          rule: rule.template,
          event: event,
          eventType: event.type,
          module: event.module,
          payload: event.payload
        })
      };

      const response = await yachtieService.process(aiRequest);
      
      let aiContent;
      try {
        aiContent = JSON.parse(response.result || '{}');
      } catch {
        aiContent = {
          title: rule.template.title,
          message: response.result || rule.template.message
        };
      }

      const notification: SmartNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: aiContent.title || rule.template.title,
        message: aiContent.message || rule.template.message,
        type: rule.template.type,
        priority: rule.template.priority,
        category: event.module || 'system',
        userId: event.user_id,
        metadata: {
          ruleId: rule.id,
          eventId: event.id,
          eventType: event.type,
          module: event.module,
          originalEvent: event
        },
        createdAt: new Date(),
        isRead: false,
        isDismissed: false,
        deliveryChannels: rule.channels.map(channel => ({
          type: channel,
          enabled: true,
          status: 'pending' as const
        })),
        actions: this.generateNotificationActions(rule, event)
      };

      // Set expiration based on priority
      if (rule.template.priority === 'low') {
        notification.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      } else if (rule.template.priority === 'medium') {
        notification.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }
      // High and critical notifications don't expire automatically

      return notification;

    } catch (error) {
      console.error('Failed to generate smart notification:', error);
      
      // Fallback to basic notification
      return {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: rule.template.title,
        message: rule.template.message,
        type: rule.template.type,
        priority: rule.template.priority,
        category: event.module || 'system',
        userId: event.user_id,
        metadata: { ruleId: rule.id, eventType: event.type },
        createdAt: new Date(),
        isRead: false,
        isDismissed: false,
        deliveryChannels: rule.channels.map(channel => ({
          type: channel,
          enabled: true,
          status: 'pending' as const
        }))
      };
    }
  }

  private generateNotificationActions(rule: NotificationRule, event: any): NotificationAction[] {
    const actions: NotificationAction[] = [];

    // Add common actions based on notification type
    if (rule.id === 'equipment_failure') {
      actions.push(
        {
          id: 'view_equipment',
          label: 'View Equipment',
          type: 'link',
          action: '/equipment',
          style: 'primary'
        },
        {
          id: 'create_maintenance',
          label: 'Schedule Repair',
          type: 'callback',
          action: 'create_maintenance_task',
          style: 'secondary'
        }
      );
    } else if (rule.id === 'maintenance_due') {
      actions.push(
        {
          id: 'view_maintenance',
          label: 'View Schedule',
          type: 'link',
          action: '/maintenance',
          style: 'primary'
        },
        {
          id: 'snooze_reminder',
          label: 'Remind Later',
          type: 'callback',
          action: 'snooze_notification',
          style: 'secondary'
        }
      );
    } else if (rule.id === 'low_inventory') {
      actions.push(
        {
          id: 'view_inventory',
          label: 'View Inventory',
          type: 'link',
          action: '/inventory',
          style: 'primary'
        },
        {
          id: 'create_order',
          label: 'Create Order',
          type: 'callback',
          action: 'create_procurement_order',
          style: 'secondary'
        }
      );
    }

    // Always add dismiss action
    actions.push({
      id: 'dismiss',
      label: 'Dismiss',
      type: 'callback',
      action: 'dismiss_notification',
      style: 'secondary'
    });

    return actions;
  }

  private async sendNotification(notification: SmartNotification): Promise<void> {
    // Check user preferences and rate limits
    const canSend = await this.canSendNotification(notification);
    if (!canSend) return;

    // Store notification
    this.notifications.set(notification.id, notification);

    // Deliver through enabled channels
    for (const channel of notification.deliveryChannels) {
      if (channel.enabled) {
        await this.deliverThroughChannel(notification, channel);
      }
    }

    // Log notification
    await this.logNotification(notification, 'sent');

    // Emit notification event
    universalEventBus.emit('notification_sent', 'notifications', notification);

    // Update delivery counts
    this.updateDeliveryCount(notification.userId || 'system');
  }

  private async canSendNotification(notification: SmartNotification): Promise<boolean> {
    // Check user preferences
    if (notification.userId) {
      const prefs = this.preferences.get(notification.userId);
      if (prefs && !prefs.globalEnabled) return false;

      // Check category preferences
      if (prefs?.categories[notification.category]?.enabled === false) return false;

      // Check quiet hours
      if (prefs?.quietHours.enabled && this.isInQuietHours(prefs.quietHours)) {
        // Only allow critical notifications during quiet hours
        if (notification.priority !== 'critical') return false;
      }

      // Check rate limits
      const count = this.deliveredCounts.get(notification.userId);
      if (count && prefs) {
        const now = new Date();
        
        // Reset counters if needed
        if (now.getHours() !== count.lastReset.getHours()) {
          count.hour = 0;
        }
        if (now.getDate() !== count.lastReset.getDate()) {
          count.day = 0;
        }

        if (count.hour >= prefs.frequency.maxPerHour) return false;
        if (count.day >= prefs.frequency.maxPerDay) return false;
      }
    }

    return true;
  }

  private isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }

  private async deliverThroughChannel(notification: SmartNotification, channel: DeliveryChannel): Promise<void> {
    try {
      switch (channel.type) {
        case 'browser':
          await this.deliverBrowserNotification(notification);
          break;
        case 'email':
          await this.deliverEmailNotification(notification, channel.address);
          break;
        case 'push':
          await this.deliverPushNotification(notification);
          break;
        case 'sound':
          await this.playNotificationSound(notification);
          break;
        case 'sms':
          await this.deliverSMSNotification(notification, channel.address);
          break;
        case 'webhook':
          await this.deliverWebhookNotification(notification, channel.address);
          break;
      }

      channel.status = 'delivered';
      channel.deliveredAt = new Date();

    } catch (error) {
      console.error(`Failed to deliver notification through ${channel.type}:`, error);
      channel.status = 'failed';
    }
  }

  private async deliverBrowserNotification(notification: SmartNotification): Promise<void> {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        data: notification,
        requireInteraction: notification.priority === 'critical'
      });

      browserNotif.onclick = () => {
        // Handle notification click
        universalEventBus.emit('notification_clicked', 'notifications', {
          notificationId: notification.id,
          userId: notification.userId
        });
        browserNotif.close();
      };

      // Auto-close non-critical notifications
      if (notification.priority !== 'critical') {
        setTimeout(() => browserNotif.close(), 5000);
      }
    }
  }

  private async deliverEmailNotification(notification: SmartNotification, email?: string): Promise<void> {
    if (!email) return;

    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: notification.title,
          template: 'notification',
          data: {
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            actions: notification.actions,
            metadata: notification.metadata
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  private async deliverPushNotification(notification: SmartNotification): Promise<void> {
    // Implementation would depend on push service (FCM, etc.)
    console.log('Push notification delivery not implemented yet');
  }

  private async playNotificationSound(notification: SmartNotification): Promise<void> {
    try {
      const audio = new Audio();
      
      // Different sounds for different priorities
      switch (notification.priority) {
        case 'critical':
          audio.src = '/sounds/critical-alert.wav';
          break;
        case 'high':
          audio.src = '/sounds/high-priority.wav';
          break;
        case 'medium':
          audio.src = '/sounds/medium-priority.wav';
          break;
        default:
          audio.src = '/sounds/notification.wav';
      }
      
      audio.volume = notification.priority === 'critical' ? 0.8 : 0.5;
      await audio.play();
    } catch (error) {
      // Ignore audio errors (user might have disabled autoplay, etc.)
      console.warn('Could not play notification sound:', error);
    }
  }

  private async deliverSMSNotification(notification: SmartNotification, phoneNumber?: string): Promise<void> {
    // Implementation would depend on SMS service
    console.log('SMS notification delivery not implemented yet');
  }

  private async deliverWebhookNotification(notification: SmartNotification, webhookUrl?: string): Promise<void> {
    if (!webhookUrl) return;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification,
          timestamp: new Date().toISOString(),
          source: 'yacht-management-system'
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook delivery failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to deliver webhook notification:', error);
      throw error;
    }
  }

  private updateDeliveryCount(userId: string): void {
    const now = new Date();
    const existing = this.deliveredCounts.get(userId);

    if (existing) {
      // Reset counters if needed
      if (now.getHours() !== existing.lastReset.getHours()) {
        existing.hour = 0;
      }
      if (now.getDate() !== existing.lastReset.getDate()) {
        existing.day = 0;
      }

      existing.hour++;
      existing.day++;
      existing.lastReset = now;
    } else {
      this.deliveredCounts.set(userId, {
        hour: 1,
        day: 1,
        lastReset: now
      });
    }
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Failed to request notification permission:', error);
      }
    }
  }

  private setupPeriodicCleanup(): void {
    // Clean up old notifications every hour
    setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 60 * 60 * 1000); // 1 hour
  }

  private cleanupExpiredNotifications(): void {
    const now = new Date();
    
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
      }
    }

    // Also clean old read/dismissed notifications (keep for 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    for (const [id, notification] of this.notifications.entries()) {
      if ((notification.readAt || notification.dismissedAt) && 
          notification.createdAt < thirtyDaysAgo) {
        this.notifications.delete(id);
      }
    }
  }

  // Public API methods
  async sendCustomNotification(notification: Partial<SmartNotification>): Promise<string> {
    const fullNotification: SmartNotification = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info',
      priority: notification.priority || 'medium',
      category: notification.category || 'custom',
      userId: notification.userId,
      metadata: notification.metadata || {},
      createdAt: new Date(),
      isRead: false,
      isDismissed: false,
      deliveryChannels: notification.deliveryChannels || [
        { type: 'browser', enabled: true, status: 'pending' }
      ],
      actions: notification.actions
    };

    await this.sendNotification(fullNotification);
    return fullNotification.id;
  }

  async markAsRead(notificationId: string, userId?: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification || (userId && notification.userId !== userId)) return;

    notification.isRead = true;
    notification.readAt = new Date();

    await this.logNotification(notification, 'read');
    universalEventBus.emit('notification_read', 'notifications', { notificationId, userId });
  }

  async dismissNotification(notificationId: string, userId?: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification || (userId && notification.userId !== userId)) return;

    notification.isDismissed = true;
    notification.dismissedAt = new Date();

    await this.logNotification(notification, 'dismissed');
    universalEventBus.emit('notification_dismissed', 'notifications', { notificationId, userId });
  }

  private async handleNotificationAction(payload: any): Promise<void> {
    const { notificationId, actionId, userId } = payload;
    const notification = this.notifications.get(notificationId);
    
    if (!notification) return;

    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) return;

    // Execute action
    switch (action.type) {
      case 'callback':
        await this.executeActionCallback(action.action, notification, userId);
        break;
      case 'link':
        // Link actions are handled by the UI
        break;
    }

    await this.logNotification(notification, 'action_taken', { actionId, action: action.action });
  }

  private async executeActionCallback(actionName: string, notification: SmartNotification, userId?: string): Promise<void> {
    switch (actionName) {
      case 'dismiss_notification':
        await this.dismissNotification(notification.id, userId);
        break;
      case 'snooze_notification':
        await this.snoozeNotification(notification.id, 60); // 1 hour
        break;
      case 'create_maintenance_task':
        universalEventBus.emit('create_maintenance_task', 'maintenance', {
          equipmentId: notification.metadata.equipmentId,
          priority: 'urgent',
          triggeredBy: notification.id
        });
        break;
      case 'create_procurement_order':
        universalEventBus.emit('create_procurement_order', 'procurement', {
          itemId: notification.metadata.itemId,
          triggeredBy: notification.id
        });
        break;
    }
  }

  private async snoozeNotification(notificationId: string, minutes: number): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Temporarily dismiss and reschedule
    notification.isDismissed = true;
    notification.dismissedAt = new Date();

    // Create a new notification for later
    const snoozedNotification = {
      ...notification,
      id: `snoozed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(Date.now() + minutes * 60 * 1000),
      isDismissed: false,
      dismissedAt: undefined,
      metadata: {
        ...notification.metadata,
        snoozedFrom: notificationId,
        snoozeMinutes: minutes
      }
    };

    // Schedule the snoozed notification
    setTimeout(() => {
      this.sendNotification(snoozedNotification);
    }, minutes * 60 * 1000);
  }

  async getUserNotifications(userId: string, options: {
    includeRead?: boolean;
    includeDismissed?: boolean;
    category?: string;
    limit?: number;
  } = {}): Promise<SmartNotification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);

    if (!options.includeRead) {
      notifications = notifications.filter(n => !n.isRead);
    }

    if (!options.includeDismissed) {
      notifications = notifications.filter(n => !n.isDismissed);
    }

    if (options.category) {
      notifications = notifications.filter(n => n.category === options.category);
    }

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    const existing = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...existing, ...preferences, userId };
    
    this.preferences.set(userId, updated);
    
    // Save to storage
    localStorage.setItem(`notification-preferences-${userId}`, JSON.stringify(updated));

    universalEventBus.emit('notification_preferences_updated', 'notifications', { userId, preferences: updated });
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      globalEnabled: true,
      channels: {
        browser: true,
        email: false,
        sms: false,
        push: true,
        sound: true
      },
      categories: {
        equipment: { enabled: true, priority: 'high', channels: ['browser', 'push', 'sound'] },
        maintenance: { enabled: true, priority: 'medium', channels: ['browser', 'email'] },
        inventory: { enabled: true, priority: 'medium', channels: ['browser', 'email'] },
        weather: { enabled: true, priority: 'high', channels: ['browser', 'push'] },
        crew: { enabled: true, priority: 'high', channels: ['browser', 'push', 'sound'] },
        system: { enabled: true, priority: 'low', channels: ['browser'] }
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      frequency: {
        maxPerHour: 10,
        maxPerDay: 50,
        groupSimilar: true
      }
    };
  }

  getUserPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  async getNotificationStats(userId?: string): Promise<{
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    let notifications = Array.from(this.notifications.values());
    
    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }

    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;

    const byCategory = notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentNotifications = notifications.filter(n => n.createdAt >= sevenDaysAgo);
    
    const recentActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = recentNotifications.filter(n => 
        n.createdAt.toISOString().split('T')[0] === dateStr
      ).length;
      
      return { date: dateStr, count };
    }).reverse();

    return {
      total,
      unread,
      byCategory,
      byPriority,
      recentActivity
    };
  }

  private async logNotification(notification: SmartNotification, action: string, metadata?: any): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: `notification_${action}`,
        module: 'notifications',
        event_message: `Notification ${action}: ${notification.title}`,
        severity: 'info',
        user_id: notification.userId,
        metadata: {
          notification_id: notification.id,
          title: notification.title,
          type: notification.type,
          priority: notification.priority,
          category: notification.category,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  // Cleanup
  cleanup(): void {
    this.notifications.clear();
    this.preferences.clear();
    this.deliveredCounts.clear();
    console.log('SmartNotificationService cleaned up');
  }
}

export const smartNotificationService = new SmartNotificationService();
