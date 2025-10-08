interface EventHandler {
  id: string;
  module: string;
  event: string;
  callback: (event: any) => void | Promise<void>;
  priority: number;
}

interface EventData {
  id: string;
  type: string;
  module: string;
  payload: any;
  timestamp: Date;
  user_id?: string;
}

class UniversalEventBus {
  private handlers = new Map<string, EventHandler[]>();
  private eventHistory: EventData[] = [];
  private maxHistorySize = 1000;

  subscribe(
    event: string, 
    callback: (event: EventData) => void | Promise<void>,
    options: { module?: string; priority?: number } = {}
  ): string {
    const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const handler: EventHandler = {
      id: handlerId,
      module: options.module || 'global',
      event,
      callback,
      priority: options.priority || 50
    };

    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    const eventHandlers = this.handlers.get(event)!;
    eventHandlers.push(handler);
    
    // Sort by priority (higher priority first)
    eventHandlers.sort((a, b) => b.priority - a.priority);

    return handlerId;
  }

  unsubscribe(handlerId: string): void {
    for (const [event, handlers] of this.handlers.entries()) {
      const index = handlers.findIndex(h => h.id === handlerId);
      if (index !== -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          this.handlers.delete(event);
        }
        break;
      }
    }
  }

  async emit(
    event: string, 
    module: string, 
    payload: any, 
    options: { user_id?: string; async?: boolean } = {}
  ): Promise<void> {
    const eventData: EventData = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: event,
      module,
      payload,
      timestamp: new Date(),
      user_id: options.user_id
    };

    // Add to history
    this.eventHistory.unshift(eventData);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.splice(this.maxHistorySize);
    }

    // Get handlers for this specific event and wildcard handlers
    const specificHandlers = this.handlers.get(event) || [];
    const wildcardHandlers = this.handlers.get('*') || [];
    const allHandlers = [...specificHandlers, ...wildcardHandlers];

    if (options.async !== false) {
      // Process handlers asynchronously (don't wait)
      this.processHandlers(allHandlers, eventData);
    } else {
      // Process handlers synchronously (wait for completion)
      await this.processHandlers(allHandlers, eventData);
    }
  }

  private async processHandlers(handlers: EventHandler[], eventData: EventData): Promise<void> {
    const promises = handlers.map(async (handler) => {
      try {
        await handler.callback(eventData);
      } catch (error) {
        console.error(`Event handler error for ${handler.id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  getEventHistory(limit: number = 50): EventData[] {
    return this.eventHistory.slice(0, limit);
  }

  getSubscriptions(): Map<string, EventHandler[]> {
    return new Map(this.handlers);
  }

  clear(): void {
    this.handlers.clear();
    this.eventHistory = [];
  }

  // Utility methods for common event patterns
  emitUserAction(action: string, module: string, payload: any, userId?: string): Promise<void> {
    return this.emit(`user_${action}`, module, payload, { user_id: userId });
  }

  emitSystemEvent(event: string, module: string, payload: any): Promise<void> {
    return this.emit(`system_${event}`, module, payload);
  }

  emitDataChange(operation: string, table: string, data: any, userId?: string): Promise<void> {
    return this.emit(`data_${operation}`, 'database', { table, data }, { user_id: userId });
  }

  emitError(error: Error, module: string, context?: any): Promise<void> {
    return this.emit('error', module, { 
      message: error.message, 
      name: error.name, 
      stack: error.stack,
      context 
    });
  }

  // Real-time capabilities
  onAnyEvent(callback: (event: EventData) => void): string {
    return this.subscribe('*', callback);
  }

  onModuleEvents(module: string, callback: (event: EventData) => void): string {
    return this.subscribe('*', (event) => {
      if (event.module === module) {
        callback(event);
      }
    }, { module });
  }

  onUserEvents(userId: string, callback: (event: EventData) => void): string {
    return this.subscribe('*', (event) => {
      if (event.user_id === userId) {
        callback(event);
      }
    });
  }
}

export const universalEventBus = new UniversalEventBus();