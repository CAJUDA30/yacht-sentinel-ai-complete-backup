import { universalEventBus } from "./UniversalEventBus";

interface UITheme {
  id: string;
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

interface UIPreferences {
  userId?: string;
  theme: string;
  language: string;
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  accessibility: {
    highContrast: boolean;
    reduceMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
    screenReader: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list' | 'cards';
    columns: number;
    widgets: string[];
    customizations: Record<string, any>;
  };
  notifications: {
    desktop: boolean;
    sound: boolean;
    vibration: boolean;
    priority: 'all' | 'high' | 'critical';
  };
}

interface SmartWidget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
  isVisible: boolean;
  isEditable: boolean;
  refreshInterval?: number;
  lastUpdated: Date;
}

interface UIAnalytics {
  pageViews: Record<string, number>;
  interactions: Record<string, number>;
  timeSpent: Record<string, number>;
  errors: Array<{ page: string; error: string; timestamp: Date }>;
  performance: {
    loadTimes: Record<string, number[]>;
    renderTimes: Record<string, number[]>;
  };
}

class AdvancedUIService {
  private preferences = new Map<string, UIPreferences>();
  private themes = new Map<string, UITheme>();
  private widgets = new Map<string, SmartWidget[]>();
  private analytics: UIAnalytics = {
    pageViews: {},
    interactions: {},
    timeSpent: {},
    errors: [],
    performance: { loadTimes: {}, renderTimes: {} }
  };
  private currentUserId?: string;
  private isInitialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    this.currentUserId = userId;
    await this.loadDefaultThemes();
    await this.loadUserPreferences(userId);
    this.setupAnalytics();
    this.setupKeyboardShortcuts();
    this.setupAccessibility();
    
    this.isInitialized = true;
    console.log('AdvancedUIService initialized');
  }

  private async loadDefaultThemes(): Promise<void> {
    const defaultThemes: UITheme[] = [
      {
        id: 'yacht-light',
        name: 'Yacht Light',
        colors: {
          primary: 'hsl(210, 100%, 45%)',
          secondary: 'hsl(200, 85%, 35%)',
          accent: 'hsl(190, 90%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(222, 25%, 12%)',
          muted: 'hsl(210, 40%, 96%)',
          'muted-foreground': 'hsl(215, 16%, 47%)',
          destructive: 'hsl(0, 84%, 60%)',
          border: 'hsl(214, 32%, 91%)',
          input: 'hsl(214, 32%, 91%)',
          ring: 'hsl(210, 100%, 45%)'
        },
        fonts: {
          sans: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem'
        },
        borderRadius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
        }
      },
      {
        id: 'yacht-dark',
        name: 'Yacht Dark',
        colors: {
          primary: 'hsl(210, 100%, 55%)',
          secondary: 'hsl(200, 85%, 45%)',
          accent: 'hsl(190, 90%, 50%)',
          background: 'hsl(222, 25%, 8%)',
          foreground: 'hsl(210, 40%, 98%)',
          muted: 'hsl(217, 33%, 17%)',
          'muted-foreground': 'hsl(215, 20%, 65%)',
          destructive: 'hsl(0, 84%, 60%)',
          border: 'hsl(217, 33%, 17%)',
          input: 'hsl(217, 33%, 17%)',
          ring: 'hsl(210, 100%, 55%)'
        },
        fonts: {
          sans: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem'
        },
        borderRadius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.3)'
        }
      },
      {
        id: 'ocean-blue',
        name: 'Ocean Blue',
        colors: {
          primary: 'hsl(200, 100%, 50%)',
          secondary: 'hsl(180, 80%, 40%)',
          accent: 'hsl(220, 90%, 60%)',
          background: 'hsl(200, 20%, 98%)',
          foreground: 'hsl(200, 50%, 10%)',
          muted: 'hsl(200, 30%, 92%)',
          'muted-foreground': 'hsl(200, 25%, 45%)',
          destructive: 'hsl(0, 84%, 60%)',
          border: 'hsl(200, 30%, 85%)',
          input: 'hsl(200, 30%, 85%)',
          ring: 'hsl(200, 100%, 50%)'
        },
        fonts: {
          sans: 'Inter, system-ui, sans-serif',
          mono: 'JetBrains Mono, monospace'
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem'
        },
        borderRadius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 50 100 / 0.1)',
          md: '0 4px 6px -1px rgb(0 50 100 / 0.15)',
          lg: '0 10px 15px -3px rgb(0 50 100 / 0.15)',
          xl: '0 20px 25px -5px rgb(0 50 100 / 0.15)'
        }
      }
    ];

    defaultThemes.forEach(theme => {
      this.themes.set(theme.id, theme);
    });
  }

  private async loadUserPreferences(userId?: string): Promise<void> {
    const defaultPreferences: UIPreferences = {
      userId,
      theme: 'yacht-light',
      language: 'en',
      density: 'comfortable',
      animations: true,
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        fontSize: 'medium',
        screenReader: false
      },
      dashboard: {
        layout: 'grid',
        columns: 3,
        widgets: ['system-overview', 'recent-activity', 'quick-actions', 'notifications'],
        customizations: {}
      },
      notifications: {
        desktop: true,
        sound: true,
        vibration: false,
        priority: 'high'
      }
    };

    // Load from localStorage if available
    if (userId) {
      const stored = localStorage.getItem(`ui-preferences-${userId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.preferences.set(userId, { ...defaultPreferences, ...parsed });
          return;
        } catch (error) {
          console.error('Failed to parse stored preferences:', error);
        }
      }
    }

    const key = userId || 'default';
    this.preferences.set(key, defaultPreferences);
  }

  private setupAnalytics(): void {
    // Track page views
    universalEventBus.subscribe('page_view', (event) => {
      const page = event.payload?.page || 'unknown';
      this.analytics.pageViews[page] = (this.analytics.pageViews[page] || 0) + 1;
    });

    // Track interactions
    universalEventBus.subscribe('ui_interaction', (event) => {
      const interaction = event.payload?.type || 'unknown';
      this.analytics.interactions[interaction] = (this.analytics.interactions[interaction] || 0) + 1;
    });

    // Track errors
    universalEventBus.subscribe('ui_error', (event) => {
      this.analytics.errors.push({
        page: event.payload?.page || 'unknown',
        error: event.payload?.error || 'Unknown error',
        timestamp: new Date()
      });

      // Keep only last 100 errors
      if (this.analytics.errors.length > 100) {
        this.analytics.errors = this.analytics.errors.slice(-100);
      }
    });

    // Track performance
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navigationEntry = entry as PerformanceNavigationTiming;
            const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
            const page = window.location.pathname;
            
            if (!this.analytics.performance.loadTimes[page]) {
              this.analytics.performance.loadTimes[page] = [];
            }
            this.analytics.performance.loadTimes[page].push(loadTime);
            
            // Keep only last 10 measurements per page
            if (this.analytics.performance.loadTimes[page].length > 10) {
              this.analytics.performance.loadTimes[page] = this.analytics.performance.loadTimes[page].slice(-10);
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation', 'measure'] });
    }
  }

  private setupKeyboardShortcuts(): void {
    const shortcuts = {
      'ctrl+k': () => this.openCommandPalette(),
      'ctrl+shift+t': () => this.toggleTheme(),
      'ctrl+shift+d': () => this.toggleDashboard(),
      'ctrl+shift+n': () => this.toggleNotifications(),
      'escape': () => this.closeModals(),
      'ctrl+/': () => this.showShortcuts()
    };

    document.addEventListener('keydown', (event) => {
      const key = this.getKeyCombo(event);
      const handler = shortcuts[key as keyof typeof shortcuts];
      
      if (handler) {
        event.preventDefault();
        handler();
      }
    });
  }

  private getKeyCombo(event: KeyboardEvent): string {
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    
    if (event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt' && event.key !== 'Meta') {
      parts.push(event.key.toLowerCase());
    }
    
    return parts.join('+');
  }

  private setupAccessibility(): void {
    // Monitor system preferences
    if (window.matchMedia) {
      // Detect high contrast preference
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      const updateHighContrast = () => {
        const prefs = this.getCurrentPreferences();
        if (prefs) {
          prefs.accessibility.highContrast = highContrastQuery.matches;
          this.savePreferences(prefs);
          this.applyAccessibilitySettings(prefs);
        }
      };
      
      highContrastQuery.addEventListener('change', updateHighContrast);
      updateHighContrast();

      // Detect reduced motion preference
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const updateReducedMotion = () => {
        const prefs = this.getCurrentPreferences();
        if (prefs) {
          prefs.accessibility.reduceMotion = reducedMotionQuery.matches;
          this.savePreferences(prefs);
          this.applyAccessibilitySettings(prefs);
        }
      };
      
      reducedMotionQuery.addEventListener('change', updateReducedMotion);
      updateReducedMotion();
    }
  }

  private applyAccessibilitySettings(preferences: UIPreferences): void {
    const root = document.documentElement;
    
    // Apply high contrast
    if (preferences.accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (preferences.accessibility.reduceMotion || !preferences.animations) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${preferences.accessibility.fontSize}`);

    // Apply density
    root.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    root.classList.add(`density-${preferences.density}`);
  }

  // Public API methods
  async updatePreferences(userId: string, updates: Partial<UIPreferences>): Promise<void> {
    const current = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...current, ...updates, userId };
    
    this.preferences.set(userId, updated);
    this.savePreferences(updated);
    
    // Apply changes immediately
    if (updates.theme) await this.applyTheme(updates.theme);
    this.applyAccessibilitySettings(updated);
    
    // Emit preference change event
    universalEventBus.emit('ui_preferences_changed', 'ui', { userId, preferences: updated });
  }

  private getDefaultPreferences(userId: string): UIPreferences {
    return {
      userId,
      theme: 'yacht-light',
      language: 'en',
      density: 'comfortable',
      animations: true,
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        fontSize: 'medium',
        screenReader: false
      },
      dashboard: {
        layout: 'grid',
        columns: 3,
        widgets: ['system-overview', 'recent-activity', 'quick-actions', 'notifications'],
        customizations: {}
      },
      notifications: {
        desktop: true,
        sound: true,
        vibration: false,
        priority: 'high'
      }
    };
  }

  private savePreferences(preferences: UIPreferences): void {
    if (preferences.userId) {
      localStorage.setItem(`ui-preferences-${preferences.userId}`, JSON.stringify(preferences));
    }
  }

  getCurrentPreferences(): UIPreferences | undefined {
    const key = this.currentUserId || 'default';
    return this.preferences.get(key);
  }

  async applyTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      console.error(`Theme not found: ${themeId}`);
      return;
    }

    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Apply font families
    root.style.setProperty('--font-sans', theme.fonts.sans);
    root.style.setProperty('--font-mono', theme.fonts.mono);

    // Update theme class
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${themeId}`);

    console.log(`Applied theme: ${theme.name}`);
  }

  getAvailableThemes(): UITheme[] {
    return Array.from(this.themes.values());
  }

  // Widget management
  async updateWidgetLayout(userId: string, widgets: SmartWidget[]): Promise<void> {
    this.widgets.set(userId, widgets);
    
    // Save to preferences
    const prefs = this.getCurrentPreferences();
    if (prefs) {
      prefs.dashboard.widgets = widgets.map(w => w.id);
      prefs.dashboard.customizations = widgets.reduce((acc, w) => {
        acc[w.id] = { position: w.position, config: w.config };
        return acc;
      }, {} as Record<string, any>);
      
      await this.updatePreferences(userId, prefs);
    }

    universalEventBus.emit('widget_layout_changed', 'ui', { userId, widgets });
  }

  getUserWidgets(userId: string): SmartWidget[] {
    return this.widgets.get(userId) || [];
  }

  // Command palette and shortcuts
  private openCommandPalette(): void {
    universalEventBus.emit('command_palette_open', 'ui', {});
  }

  private toggleTheme(): void {
    const prefs = this.getCurrentPreferences();
    if (!prefs) return;

    const currentTheme = prefs.theme;
    const availableThemes = Array.from(this.themes.keys());
    const currentIndex = availableThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    const nextTheme = availableThemes[nextIndex];

    this.updatePreferences(prefs.userId || 'default', { theme: nextTheme });
  }

  private toggleDashboard(): void {
    universalEventBus.emit('dashboard_toggle', 'ui', {});
  }

  private toggleNotifications(): void {
    universalEventBus.emit('notifications_toggle', 'ui', {});
  }

  private closeModals(): void {
    universalEventBus.emit('modals_close', 'ui', {});
  }

  private showShortcuts(): void {
    universalEventBus.emit('shortcuts_show', 'ui', {});
  }

  // Analytics methods
  trackPageView(page: string): void {
    universalEventBus.emit('page_view', 'ui', { page });
  }

  trackInteraction(type: string, details?: Record<string, any>): void {
    universalEventBus.emit('ui_interaction', 'ui', { type, details });
  }

  trackError(page: string, error: string): void {
    universalEventBus.emit('ui_error', 'ui', { page, error });
  }

  getAnalytics(): UIAnalytics {
    return { ...this.analytics };
  }

  // Performance monitoring
  measureRenderTime(componentName: string, renderTime: number): void {
    if (!this.analytics.performance.renderTimes[componentName]) {
      this.analytics.performance.renderTimes[componentName] = [];
    }
    
    this.analytics.performance.renderTimes[componentName].push(renderTime);
    
    // Keep only last 20 measurements per component
    if (this.analytics.performance.renderTimes[componentName].length > 20) {
      this.analytics.performance.renderTimes[componentName] = 
        this.analytics.performance.renderTimes[componentName].slice(-20);
    }
  }

  getPerformanceMetrics(): {
    avgLoadTime: number;
    slowestPages: Array<{ page: string; avgTime: number }>;
    slowestComponents: Array<{ component: string; avgTime: number }>;
  } {
    // Calculate average load times
    const loadTimes = Object.values(this.analytics.performance.loadTimes).flat();
    const avgLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    // Find slowest pages
    const slowestPages = Object.entries(this.analytics.performance.loadTimes)
      .map(([page, times]) => ({
        page,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    // Find slowest components
    const slowestComponents = Object.entries(this.analytics.performance.renderTimes)
      .map(([component, times]) => ({
        component,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    return {
      avgLoadTime,
      slowestPages,
      slowestComponents
    };
  }

  // Cleanup
  cleanup(): void {
    // Clear intervals, remove event listeners, etc.
    this.preferences.clear();
    this.widgets.clear();
    console.log('AdvancedUIService cleaned up');
  }
}

export const advancedUIService = new AdvancedUIService();
