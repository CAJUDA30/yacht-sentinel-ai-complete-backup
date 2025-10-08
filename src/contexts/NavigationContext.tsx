import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path?: string;
  submenus?: SubMenuItem[];
  roles?: string[];
  badge?: number;
  isNew?: boolean;
  isFavorite?: boolean;
  isVisible?: boolean;
  category: 'core' | 'operations' | 'analytics' | 'advanced' | 'settings';
}

export interface SubMenuItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  badge?: number;
  isNew?: boolean;
  description?: string;
}

export interface NavigationState {
  menuItems: MenuItem[];
  expandedItems: string[];
  hoveredItem: string | null;
  customization: {
    showBadges: boolean;
    showSubtitles: boolean;
    compactMode: boolean;
    groupByCategory: boolean;
    showFavorites: boolean;
  };
  workspaceProfile: string;
}

interface NavigationContextType {
  navigationState: NavigationState;
  setMenuItems: (items: MenuItem[]) => void;
  toggleExpanded: (itemId: string) => void;
  setHoveredItem: (itemId: string | null) => void;
  updateCustomization: (customization: Partial<NavigationState['customization']>) => void;
  toggleFavorite: (itemId: string) => void;
  reorderMenuItems: (sourceIndex: number, destinationIndex: number) => void;
  setWorkspaceProfile: (profile: string) => void;
  saveNavigationState: () => void;
  resetToDefault: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const defaultMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'Gauge',
    path: '/',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'overview', title: 'Overview', path: '/', icon: 'BarChart3' },
      { id: 'quick-stats', title: 'Quick Stats', path: '/#stats', icon: 'TrendingUp' },
      { id: 'system-health', title: 'System Health', path: '/system-monitoring', icon: 'Activity' },
    ]
  },
  {
    id: 'todos',
    title: 'To-Do Manager',
    icon: 'CheckSquare',
    path: '/todos',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'my-tasks', title: 'My Tasks', path: '/todos?filter=my', icon: 'User' },
      { id: 'team-tasks', title: 'Team Tasks', path: '/todos?filter=team', icon: 'Users' },
      { id: 'overdue', title: 'Overdue', path: '/todos?filter=overdue', icon: 'AlertTriangle' },
      { id: 'completed', title: 'Completed', path: '/todos?filter=completed', icon: 'CheckCircle' },
      { id: 'assign-tasks', title: 'Assign Tasks', path: '/todos?action=assign', icon: 'UserPlus' },
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: 'Package',
    path: '/inventory',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'all-items', title: 'All Items', path: '/inventory', icon: 'Package' },
      { id: 'low-stock', title: 'Low Stock', path: '/inventory?filter=low-stock', icon: 'AlertCircle' },
      { id: 'categories', title: 'Categories', path: '/inventory?view=categories', icon: 'Grid3X3' },
    ]
  },
  {
    id: 'equipment',
    title: 'Equipment',
    icon: 'Settings',
    path: '/equipment',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'all-equipment', title: 'All Equipment', path: '/equipment', icon: 'Settings' },
      { id: 'maintenance-due', title: 'Maintenance Due', path: '/equipment?filter=maintenance', icon: 'Wrench' },
      { id: 'equipment-health', title: 'Equipment Health', path: '/equipment?view=health', icon: 'Heart' },
    ]
  },
  {
    id: 'crew',
    title: 'Crew',
    icon: 'Users',
    path: '/crew',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'crew-list', title: 'Crew List', path: '/crew', icon: 'Users' },
      { id: 'schedules', title: 'Schedules', path: '/crew?view=schedules', icon: 'Calendar' },
      { id: 'certifications', title: 'Certifications', path: '/crew?view=certifications', icon: 'Award' },
    ]
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    icon: 'Wrench',
    path: '/maintenance',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'scheduled', title: 'Scheduled', path: '/maintenance?type=scheduled', icon: 'Calendar' },
      { id: 'urgent', title: 'Urgent', path: '/maintenance?type=urgent', icon: 'AlertTriangle' },
      { id: 'history', title: 'History', path: '/maintenance?view=history', icon: 'History' },
    ]
  },
  {
    id: 'safety',
    title: 'Safety',
    icon: 'Shield',
    path: '/safety',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'protocols', title: 'Protocols', path: '/safety?view=protocols', icon: 'BookOpen' },
      { id: 'incidents', title: 'Incidents', path: '/safety?view=incidents', icon: 'AlertTriangle' },
      { id: 'training', title: 'Training', path: '/safety?view=training', icon: 'GraduationCap' },
    ]
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: 'FileText',
    path: '/documents',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'certificates', title: 'Certificates', path: '/documents?type=certificates', icon: 'Award' },
      { id: 'manuals', title: 'Manuals', path: '/documents?type=manuals', icon: 'Book' },
      { id: 'reports', title: 'Reports', path: '/documents?type=reports', icon: 'FileText' },
    ]
  },
  {
    id: 'communications',
    title: 'Communications',
    icon: 'MessageSquare',
    path: '/communications',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'messages', title: 'Messages', path: '/communications?view=messages', icon: 'MessageSquare' },
      { id: 'emergency', title: 'Emergency', path: '/communications?type=emergency', icon: 'Phone' },
      { id: 'weather-alerts', title: 'Weather Alerts', path: '/communications?type=weather', icon: 'CloudRain' },
    ]
  },
  {
    id: 'procurement',
    title: 'Procurement',
    icon: 'ShoppingCart',
    path: '/procurement',
    category: 'core',
    isVisible: true,
    submenus: [
      { id: 'orders', title: 'Orders', path: '/procurement?view=orders', icon: 'ShoppingCart' },
      { id: 'suppliers', title: 'Suppliers', path: '/procurement?view=suppliers', icon: 'Building' },
      { id: 'budgets', title: 'Budgets', path: '/procurement?view=budgets', icon: 'DollarSign' },
    ]
  },
  {
    id: 'navigation',
    title: 'Navigation',
    icon: 'Compass',
    path: '/navigation',
    category: 'operations',
    isVisible: true,
    submenus: [
      { id: 'route-planning', title: 'Route Planning', path: '/navigation?view=routes', icon: 'Map' },
      { id: 'weather', title: 'Weather Integration', path: '/navigation?view=weather', icon: 'CloudRain' },
      { id: 'vessel-tracking', title: 'Vessel Tracking', path: '/navigation?view=tracking', icon: 'MapPin' },
    ]
  },
  {
    id: 'checklists',
    title: 'Checklists',
    icon: 'CheckSquare',
    path: '/checklists',
    category: 'operations',
    isVisible: true,
    submenus: [
      { id: 'pre-departure', title: 'Pre-Departure', path: '/checklists?type=pre-departure', icon: 'Ship' },
      { id: 'safety-checks', title: 'Safety Checks', path: '/checklists?type=safety', icon: 'Shield' },
      { id: 'maintenance-checks', title: 'Maintenance Checks', path: '/checklists?type=maintenance', icon: 'Wrench' },
    ]
  },
  {
    id: 'formalities',
    title: 'Port Formalities',
    icon: 'FileCheck',
    path: '/formalities',
    category: 'operations',
    isVisible: true,
    submenus: [
      { id: 'customs', title: 'Customs', path: '/formalities?type=customs', icon: 'Stamp' },
      { id: 'immigration', title: 'Immigration', path: '/formalities?type=immigration', icon: 'Users' },
      { id: 'port-clearance', title: 'Port Clearance', path: '/formalities?type=clearance', icon: 'CheckCircle' },
    ]
  },
  {
    id: 'logbook',
    title: 'Logbook',
    icon: 'BookOpen',
    path: '/logbook',
    category: 'operations',
    isVisible: true,
    submenus: [
      { id: 'daily-entries', title: 'Daily Entries', path: '/logbook?view=daily', icon: 'Calendar' },
      { id: 'weather-log', title: 'Weather Log', path: '/logbook?type=weather', icon: 'CloudRain' },
      { id: 'engine-log', title: 'Engine Log', path: '/logbook?type=engine', icon: 'Gauge' },
    ]
  },
  {
    id: 'guests',
    title: 'Guest Management',
    icon: 'UserCheck',
    path: '/guests',
    category: 'operations',
    isVisible: true,
    submenus: [
      { id: 'guest-profiles', title: 'Guest Profiles', path: '/guests?view=profiles', icon: 'User' },
      { id: 'preferences', title: 'Preferences', path: '/guests?view=preferences', icon: 'Heart' },
      { id: 'feedback', title: 'Feedback', path: '/guests?view=feedback', icon: 'MessageSquare' },
    ]
  },
  {
    id: 'charter',
    title: 'Charter Management',
    icon: 'Calendar',
    path: '/charter',
    category: 'operations',
    isVisible: true,
    submenus: [
      { id: 'bookings', title: 'Charter Bookings', path: '/charter?view=bookings', icon: 'Calendar' },
      { id: 'itineraries', title: 'Itineraries', path: '/charter?view=itineraries', icon: 'Map' },
      { id: 'availability', title: 'Availability', path: '/charter?view=availability', icon: 'CalendarCheck' },
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: 'BarChart3',
    path: '/analytics',
    category: 'analytics',
    isVisible: true,
    submenus: [
      { id: 'performance-reports', title: 'Performance Reports', path: '/analytics?view=performance', icon: 'TrendingUp' },
      { id: 'cost-analysis', title: 'Cost Analysis', path: '/analytics?view=costs', icon: 'DollarSign' },
      { id: 'operational-metrics', title: 'Operational Metrics', path: '/analytics?view=operations', icon: 'Activity' },
    ]
  },
  {
    id: 'predictive',
    title: 'Predictive Analytics',
    icon: 'Brain',
    path: '/predictive',
    category: 'analytics',
    isVisible: true,
    submenus: [
      { id: 'maintenance-prediction', title: 'Maintenance Prediction', path: '/predictive?type=maintenance', icon: 'Wrench' },
      { id: 'weather-forecasting', title: 'Weather Forecasting', path: '/predictive?type=weather', icon: 'CloudRain' },
      { id: 'fuel-optimization', title: 'Fuel Optimization', path: '/predictive?type=fuel', icon: 'Fuel' },
    ]
  },
  {
    id: 'yachtie',
    title: 'YachtieAI',
    icon: 'Bot',
    path: '/yachtie',
    category: 'analytics',
    isVisible: true,
    submenus: [
      { id: 'ai-assistant', title: 'AI Assistant', path: '/yachtie?view=assistant', icon: 'MessageSquare' },
      { id: 'ai-insights', title: 'AI Insights', path: '/yachtie?view=insights', icon: 'Lightbulb' },
      { id: 'smart-recommendations', title: 'Smart Recommendations', path: '/yachtie?view=recommendations', icon: 'Star' },
    ]
  },
  {
    id: 'fleet',
    title: 'Fleet Management',
    icon: 'Ship',
    path: '/fleet',
    category: 'advanced',
    isVisible: true,
    submenus: [
      { id: 'vessel-overview', title: 'Vessel Overview', path: '/fleet?view=overview', icon: 'Ship' },
      { id: 'fleet-performance', title: 'Fleet Performance', path: '/fleet?view=performance', icon: 'TrendingUp' },
      { id: 'resource-allocation', title: 'Resource Allocation', path: '/fleet?view=resources', icon: 'Users' },
    ]
  },
  {
    id: 'digital-twin',
    title: 'Digital Twin',
    icon: 'Layers',
    path: '/digital-twin',
    category: 'advanced',
    isVisible: true,
    submenus: [
      { id: 'vessel-model', title: 'Vessel Model', path: '/digital-twin?view=model', icon: 'Box' },
      { id: 'system-simulation', title: 'System Simulation', path: '/digital-twin?view=simulation', icon: 'Play' },
      { id: 'performance-analysis', title: 'Performance Analysis', path: '/digital-twin?view=analysis', icon: 'BarChart3' },
    ]
  },
  {
    id: 'search',
    title: 'Universal Search',
    icon: 'Search',
    path: '/search',
    category: 'advanced',
    isVisible: true,
    submenus: [
      { id: 'global-search', title: 'Global Search', path: '/search', icon: 'Search' },
      { id: 'smart-filters', title: 'Smart Filters', path: '/search?view=filters', icon: 'Filter' },
      { id: 'saved-searches', title: 'Saved Searches', path: '/search?view=saved', icon: 'Bookmark' },
    ]
  },
  {
    id: 'sustainability',
    title: 'Sustainability',
    icon: 'Leaf',
    path: '/sustainability',
    category: 'advanced',
    isVisible: true,
    submenus: [
      { id: 'environmental-impact', title: 'Environmental Impact', path: '/sustainability?view=impact', icon: 'Leaf' },
      { id: 'efficiency-metrics', title: 'Efficiency Metrics', path: '/sustainability?view=efficiency', icon: 'TrendingUp' },
      { id: 'green-initiatives', title: 'Green Initiatives', path: '/sustainability?view=initiatives', icon: 'Sprout' },
    ]
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'DollarSign',
    path: '/finance',
    category: 'advanced',
    isVisible: true,
    submenus: [
      { id: 'budgets', title: 'Budgets', path: '/finance?view=budgets', icon: 'PieChart' },
      { id: 'expenses', title: 'Expenses', path: '/finance?view=expenses', icon: 'CreditCard' },
      { id: 'financial-reports', title: 'Financial Reports', path: '/finance?view=reports', icon: 'FileText' },
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'Settings',
    path: '/settings',
    category: 'settings',
    isVisible: true,
    submenus: [
      { id: 'general', title: 'General Settings', path: '/settings?tab=general', icon: 'Settings' },
      { id: 'user-management', title: 'User Management', path: '/settings?tab=security', icon: 'Users' },
      { id: 'notifications', title: 'Notifications', path: '/settings?tab=system', icon: 'Bell' },
      { id: 'security', title: 'Account Security', path: '/settings?tab=modules', icon: 'Shield' },
    ]
  }
];

const defaultNavigationState: NavigationState = {
  menuItems: defaultMenuItems,
  expandedItems: ['dashboard'],
  hoveredItem: null,
  customization: {
    showBadges: true,
    showSubtitles: true,
    compactMode: false,
    groupByCategory: true,
    showFavorites: true,
  },
  workspaceProfile: 'default',
};

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<NavigationState>(defaultNavigationState);
  const location = useLocation();

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('yacht-navigation-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setNavigationState(prev => ({
          ...prev,
          ...parsed,
          // Always merge with default menu items to ensure new items appear
          menuItems: mergeMenuItems(defaultMenuItems, parsed.menuItems || []),
        }));
      } catch (error) {
        console.warn('Failed to parse saved navigation state:', error);
      }
    }
  }, []);

  // Auto-expand parent menu based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const parentItem = navigationState.menuItems.find(item => 
      item.path === currentPath || 
      item.submenus?.some(sub => sub.path === currentPath)
    );
    
    if (parentItem && !navigationState.expandedItems.includes(parentItem.id)) {
      setNavigationState(prev => ({
        ...prev,
        expandedItems: [...prev.expandedItems, parentItem.id]
      }));
    }
  }, [location.pathname, navigationState.menuItems]);

  const mergeMenuItems = (defaultItems: MenuItem[], savedItems: MenuItem[]): MenuItem[] => {
    const merged = [...defaultItems];
    
    savedItems.forEach(savedItem => {
      const index = merged.findIndex(item => item.id === savedItem.id);
      if (index >= 0) {
        // Merge saved customizations with default item
        merged[index] = {
          ...merged[index],
          isVisible: savedItem.isVisible,
          isFavorite: savedItem.isFavorite,
        };
      }
    });
    
    return merged;
  };

  const setMenuItems = (items: MenuItem[]) => {
    setNavigationState(prev => ({ ...prev, menuItems: items }));
  };

  const toggleExpanded = (itemId: string) => {
    setNavigationState(prev => ({
      ...prev,
      expandedItems: prev.expandedItems.includes(itemId)
        ? prev.expandedItems.filter(id => id !== itemId)
        : [...prev.expandedItems, itemId]
    }));
  };

  const setHoveredItem = (itemId: string | null) => {
    setNavigationState(prev => ({ ...prev, hoveredItem: itemId }));
  };

  const updateCustomization = (customization: Partial<NavigationState['customization']>) => {
    setNavigationState(prev => ({
      ...prev,
      customization: { ...prev.customization, ...customization }
    }));
  };

  const toggleFavorite = (itemId: string) => {
    setNavigationState(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item =>
        item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    }));
  };

  const reorderMenuItems = (sourceIndex: number, destinationIndex: number) => {
    setNavigationState(prev => {
      const newItems = [...prev.menuItems];
      const [removed] = newItems.splice(sourceIndex, 1);
      newItems.splice(destinationIndex, 0, removed);
      return { ...prev, menuItems: newItems };
    });
  };

  const setWorkspaceProfile = (profile: string) => {
    setNavigationState(prev => ({ ...prev, workspaceProfile: profile }));
  };

  const saveNavigationState = () => {
    localStorage.setItem('yacht-navigation-state', JSON.stringify(navigationState));
  };

  const resetToDefault = () => {
    setNavigationState(defaultNavigationState);
    localStorage.removeItem('yacht-navigation-state');
  };

  // Auto-save state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveNavigationState();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [navigationState]);

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        setMenuItems,
        toggleExpanded,
        setHoveredItem,
        updateCustomization,
        toggleFavorite,
        reorderMenuItems,
        setWorkspaceProfile,
        saveNavigationState,
        resetToDefault,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};