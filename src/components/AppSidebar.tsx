import { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useSuperAdmin } from "@/contexts/UserRoleContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Ship,
  Package,
  Users,
  Wrench,
  DollarSign,
  ShoppingCart,
  MapPin,
  FileText,
  Calendar,
  Leaf,
  BookOpen,
  MessageSquare,
  Bot,
  Activity,
  BarChart3,
  Search,
  Camera,
  Settings,
  Anchor,
  Waves,
  Battery,
  CheckSquare,
  Globe,
  Smartphone,
  ScrollText,
  Cog,
  Home,
  ClipboardList,
  Compass,
  UserCheck,
  TrendingUp,
  Brain,
  Gauge,
  ChevronRight,
  LogOut,
  PieChart,
  Route,
  Cloud,
  HardDrive,
  Radar,
  CalendarDays,
  Star,
  ThumbsUp,
  BarChart2,
  Lightbulb,
  Settings2,
  Puzzle,
  Zap,
  Code2,
  Bell,
  Palette,
  Lock,
  Plus,
  Upload,
  Mic,
  Monitor,
  Shield,
  FileCheck,
  Plug,
  CheckCircle,
  Rocket,
  Radio,
  Eye
} from "lucide-react";

// Enhanced navigation structure with hover-to-expand submenus
const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "Overview", url: "/", icon: Gauge },
      { title: "Quick Stats", url: "/analytics", icon: BarChart2 },
    ]
  },
  {
    title: "To-Do Manager", 
    url: "/todos",
    icon: ClipboardList,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "My Tasks", url: "/todos", icon: CheckSquare },
      { title: "Team Tasks", url: "/todos?filter=team", icon: Users },
      { title: "Overdue", url: "/todos?filter=overdue", icon: Battery },
      { title: "Completed", url: "/todos?filter=completed", icon: CheckSquare },
      { title: "Assign Tasks", url: "/todos/assign", icon: UserCheck },
    ]
  },
  {
    title: "Navigation",
    url: "/navigation",
    icon: Compass,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "Routes", url: "/navigation", icon: Route },
      { title: "Maps", url: "/navigation/maps", icon: MapPin },
      { title: "Weather Integration", url: "/navigation/weather", icon: Cloud },
      { title: "Vessel Tracking", url: "/navigation/tracking", icon: Radar },
    ]
  },
  {
    title: "Audit Manager",
    url: "/audit-manager",
    icon: ClipboardList,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "Active Audits", url: "/audit-manager", icon: CheckSquare },
      { title: "Create New Audit", url: "/audit-manager?tab=create", icon: Plus },
      { title: "Templates", url: "/audit-manager?tab=templates", icon: FileText },
      { title: "Import/Export", url: "/audit-manager?tab=import", icon: Upload },
      { title: "AI Insights", url: "/audit-manager?tab=analytics", icon: Brain },
      { title: "Compliance Reports", url: "/audit-manager?tab=reports", icon: BarChart3 },
      { title: "Collaboration", url: "/audit-manager?tab=collaboration", icon: Users },
    ]
  },
  {
    title: "Guest & Charter",
    url: "/guests",
    icon: Calendar,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "Guest Profiles", url: "/guests", icon: Users },
      { title: "Charter Bookings", url: "/charter", icon: Anchor },
      { title: "Itineraries", url: "/charter/itineraries", icon: CalendarDays },
      { title: "Preferences", url: "/guests/preferences", icon: Star },
      { title: "Feedback", url: "/guests/feedback", icon: ThumbsUp },
    ]
  },
  {
    title: "Analytics & Monitoring",
    url: "/analytics",
    icon: BarChart3,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "Analytics Dashboard", url: "/analytics", icon: BarChart3 },
      { title: "System Monitoring", url: "/system-monitoring", icon: Monitor },
      { title: "Security Dashboard", url: "/security-dashboard", icon: Shield },
      { title: "Compliance Tracker", url: "/compliance-tracker", icon: FileCheck },
      { title: "Performance Reports", url: "/predictive", icon: TrendingUp },
    ]
  },
  {
    title: "Reporting & Collaboration",
    url: "/advanced-reporting",
    icon: FileText,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "Advanced Reporting", url: "/advanced-reporting", icon: FileText },
      { title: "Team Collaboration", url: "/team-collaboration", icon: Users },
      { title: "Document Sharing", url: "/documents", icon: FileText },
      { title: "Communication Hub", url: "/communications", icon: MessageSquare },
    ]
  },
  {
    title: "Mobile & IoT",
    url: "/mobile-dashboard",
    icon: Smartphone,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "Mobile Center", url: "/mobile-center", icon: Gauge },
      { title: "Mobile Dashboard", url: "/mobile-dashboard", icon: Gauge },
      { title: "Real-Time Tracker", url: "/real-time-tracker", icon: MapPin },
      { title: "Advanced Camera", url: "/advanced-camera", icon: Camera },
      { title: "Notification Center", url: "/notification-center", icon: Bell },
      { title: "Offline Manager", url: "/offline-manager", icon: HardDrive },
      { title: "IoT Devices", url: "/iot-devices", icon: Activity },
      { title: "Voice Assistant", url: "/voice-assistant", icon: Mic },
    ]
  },
  {
    title: "System & Operations",
    url: "/system-overview",
    icon: Monitor,
    roles: ["admin", "superadmin"],
    submenus: [
      { title: "System Overview", url: "/system-overview", icon: Monitor },
      { title: "Performance Center", url: "/performance-center", icon: Activity },
      { title: "Integration Hub", url: "/integration-hub", icon: Settings },
      { title: "Production Readiness", url: "/production-readiness", icon: CheckCircle },
      { title: "Deployment Dashboard", url: "/deployment-dashboard", icon: Rocket },
      { title: "Voice Assistant", url: "/voice-assistant", icon: Radio },
      { title: "Vision Studio", url: "/vision-studio", icon: Eye },
    ]
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["user", "admin", "superadmin"],
    submenus: [
      { title: "User Management", url: "/crew", icon: Users },
      { title: "Notifications", url: "/settings/notifications", icon: Bell },
      { title: "Theme Toggle", url: "/settings/appearance", icon: Palette },
      { title: "Account Security", url: "/settings/security", icon: Lock },
    ]
  }
];

// Additional core operations - shown as separate section
const coreOperations = [
  { title: "Inventory", url: "/inventory", icon: Package, roles: ["user", "admin", "superadmin"] },
  { title: "Equipment", url: "/equipment", icon: Wrench, roles: ["user", "admin", "superadmin"] },
  { title: "Crew", url: "/crew", icon: Users, roles: ["user", "admin", "superadmin"] },
  { title: "Maintenance", url: "/maintenance", icon: Wrench, roles: ["user", "admin", "superadmin"] },
  { title: "Finance", url: "/finance", icon: DollarSign, roles: ["admin", "superadmin"] },
  { title: "Procurement", url: "/procurement", icon: ShoppingCart, roles: ["user", "admin", "superadmin"] },
  { title: "Safety & Compliance", url: "/safety", icon: Shield, roles: ["user", "admin", "superadmin"] },
  { title: "Claims & Repairs", url: "/claims-repairs", icon: Wrench, roles: ["user", "admin", "superadmin"] },
  { title: "Operations Center", url: "/operations", icon: Activity, roles: ["user", "admin", "superadmin"] },
  { title: "Documents", url: "/documents", icon: FileText, roles: ["user", "admin", "superadmin"] },
  { title: "Communications", url: "/communications", icon: MessageSquare, roles: ["user", "admin", "superadmin"] },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { settings } = useAppSettings();
  const { isSuperAdmin, userRole: superAdminRole, loading: superAdminLoading } = useSuperAdmin();
  const userRole = isSuperAdmin ? 'superadmin' : (settings?.user?.role || 'user');
  
  // Only log once when superadmin status is confirmed
  useEffect(() => {
    if (isSuperAdmin) {
      console.log('[AppSidebar] Superadmin access confirmed:', userRole);
    }
  }, [isSuperAdmin]);

  // State management for hover and expanded menus
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist expanded state
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify([...expandedItems]));
  }, [expandedItems]);

  // Filter items based on user role
  const filterByRole = useCallback((items: any[]) => {
    return items.filter(item => {
      if (!item.roles) return true;
      // Allow global_superadmin to access anything that superadmin can access
      const roles = item.roles.includes('superadmin') && userRole === 'global_superadmin' 
        ? [...item.roles, 'global_superadmin'] 
        : item.roles;
      return roles.includes(userRole);
    });
  }, [userRole]);

  const filteredNavItems = filterByRole(navigationItems);
  const filteredCoreOps = filterByRole(coreOperations);

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const isSubmenuItemActive = (item: any) => {
    return item.submenus?.some((submenu: any) => isActive(submenu.url));
  };

  const getNavCls = (active: boolean, isSubmenu = false) => {
    const baseClasses = `group flex items-center gap-3 rounded-lg transition-all duration-300 ease-out relative`;
    const paddingClasses = isSubmenu ? "pl-8 pr-4 py-2" : "px-4 py-3";
    const activeClasses = active 
      ? "bg-primary/15 text-primary font-semibold shadow-soft border-l-4 border-primary" 
      : "text-sidebar-foreground hover:bg-primary/8 hover:text-primary hover:shadow-soft hover:scale-[1.02]";
    
    return `${baseClasses} ${paddingClasses} ${activeClasses}`;
  };

  const handleMouseEnter = (itemTitle: string) => {
    if (!collapsed) {
      setHoveredItem(itemTitle);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  const toggleExpanded = (itemTitle: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemTitle)) {
      newExpanded.delete(itemTitle);
    } else {
      newExpanded.add(itemTitle);
    }
    setExpandedItems(newExpanded);
  };

  const shouldShowSubmenu = (itemTitle: string) => {
    return !collapsed && (hoveredItem === itemTitle || expandedItems.has(itemTitle));
  };

  const handleLogout = async () => {
    // Implementation would go here
    console.log('Logout clicked');
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar shadow-elegant">
      <SidebarContent className="p-0">
        {/* Enhanced Logo Section */}
        <div className={`flex items-center gap-3 p-6 border-b border-sidebar-border bg-gradient-subtle ${collapsed ? "justify-center px-3" : ""}`}>
          <div className="p-2 bg-gradient-ocean rounded-xl shadow-glow">
            <Ship className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-sidebar-foreground">YachtExcel</h1>
              <p className="text-xs text-sidebar-foreground/60">Professional Yacht Management</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
          {/* Enhanced Navigation Items with Submenus */}
          {filteredNavItems.map((item) => {
            const active = isActive(item.url) || isSubmenuItemActive(item);
            const showSubmenu = shouldShowSubmenu(item.title);
            
            return (
              <div 
                key={item.title}
                className="relative"
                onMouseEnter={() => handleMouseEnter(item.title)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="flex items-center w-full">
                  <SidebarMenuButton asChild className="flex-1 p-0 h-auto">
                    <NavLink to={item.url} className={getNavCls(active)}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar rounded-md shadow-elegant opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                          <span className="text-xs whitespace-nowrap text-sidebar-foreground">{item.title}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                  
                  {/* Separate chevron button for submenu toggle */}
                  {item.submenus && !collapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(item.title);
                      }}
                      className="p-1 hover:bg-sidebar-accent rounded-sm transition-colors"
                    >
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform duration-300 ${showSubmenu ? 'rotate-90' : ''}`} 
                      />
                    </button>
                  )}
                </div>

                {/* Submenu with smooth animation */}
                {item.submenus && showSubmenu && (
                  <div className="mt-1 ml-4 space-y-1 animate-slide-down">
                    {item.submenus.map((submenu) => (
                      <SidebarMenuButton key={submenu.title} asChild className="w-full p-0 h-auto">
                        <NavLink 
                          to={submenu.url}
                          className={getNavCls(isActive(submenu.url), true)}
                        >
                          <submenu.icon className="h-4 w-4 shrink-0 opacity-70" />
                          <span className="text-xs truncate">{submenu.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Core Operations Section */}
          {!collapsed && (
            <div className="pt-6">
              <div className="px-4 mb-3">
                <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                  Core Operations
                </h3>
              </div>
              <div className="space-y-1">
                {filteredCoreOps.map((item) => (
                  <SidebarMenuButton key={item.title} asChild className="w-full p-0 h-auto">
                    <NavLink 
                      to={item.url}
                      className={getNavCls(isActive(item.url))}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section with Logout */}
        <div className="border-t border-sidebar-border p-4 space-y-2">
          {isSuperAdmin && (
            <SidebarMenuButton asChild className="w-full p-0 h-auto">
              <NavLink 
                to="/superadmin"
                className={getNavCls(isActive("/superadmin"))}
              >
                <Cog className="h-5 w-5 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium">Dev Configuration</span>
                )}
              </NavLink>
            </SidebarMenuButton>
          )}
          
          <SidebarMenuButton 
            className="w-full p-0 h-auto"
            onClick={handleLogout}
          >
            <div className="group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive hover:shadow-soft">
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </div>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}