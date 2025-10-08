import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import { MenuItem as MenuItemType } from '@/contexts/NavigationContext';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface EnhancedMenuItemProps {
  item: MenuItemType;
  collapsed: boolean;
  userRole?: string;
}

export const EnhancedMenuItem: React.FC<EnhancedMenuItemProps> = ({ 
  item, 
  collapsed, 
  userRole = 'user' 
}) => {
  const { 
    navigationState, 
    toggleExpanded, 
    setHoveredItem 
  } = useNavigation();
  
  const location = useLocation();
  const [isHovering, setIsHovering] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const leaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const isExpanded = navigationState.expandedItems.includes(item.id);
  const isActive = location.pathname === item.path;
  const hasActiveSubmenu = item.submenus?.some(sub => location.pathname === sub.path);
  
  // Role-based visibility
  if (item.roles && !item.roles.includes(userRole)) {
    return null;
  }
  
  // User customization visibility
  if (item.isVisible === false) {
    return null;
  }
  
  const IconComponent = React.useMemo(() => {
    const Icon = (LucideIcons as any)[item.icon];
    return Icon || LucideIcons.Circle;
  }, [item.icon]);
  
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);
  
  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    
    setIsHovering(true);
    setHoveredItem(item.id);
    
    if (collapsed && item.submenus?.length) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowSubmenu(true);
      }, 300);
    }
  };
  
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setIsHovering(false);
    setHoveredItem(null);
    
    leaveTimeoutRef.current = setTimeout(() => {
      setShowSubmenu(false);
    }, 200);
  };
  
  const handleClick = () => {
    if (item.submenus?.length) {
      toggleExpanded(item.id);
    }
  };
  
  const getNavClassName = ({ isActive }: { isActive: boolean }) => {
    return cn(
      'w-full justify-start transition-all duration-200',
      'hover:bg-gradient-to-r hover:from-sidebar-accent/50 hover:to-sidebar-accent/20',
      'hover:shadow-soft hover:scale-[1.02]',
      'group relative overflow-hidden',
      isActive && 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow',
      hasActiveSubmenu && !isActive && 'bg-sidebar-accent/30',
      item.isFavorite && 'ring-1 ring-yellow-400/20',
      collapsed ? 'px-2' : 'px-3'
    );
  };
  
  const renderMainItem = () => {
    const content = (
      <div className="flex items-center gap-2 w-full min-w-0">
        <div className="flex-shrink-0 relative">
          <IconComponent className={cn(
            'transition-all duration-200',
            navigationState.customization.compactMode ? 'h-4 w-4' : 'h-5 w-5',
            isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-primary'
          )} />
          {item.isFavorite && (
            <Star className="absolute -top-1 -right-1 h-2 w-2 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <span className={cn(
                'block truncate font-medium transition-colors duration-200',
                navigationState.customization.compactMode ? 'text-sm' : 'text-sm',
                isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground'
              )}>
                {item.title}
              </span>
              {navigationState.customization.showSubtitles && item.submenus && (
                <span className="text-xs text-muted-foreground truncate block">
                  {item.submenus.length} items
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {navigationState.customization.showBadges && item.badge && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
              
              {item.isNew && (
                <Badge variant="destructive" className="h-4 px-1 text-xs">
                  New
                </Badge>
              )}
              
              {item.submenus?.length && (
                <ChevronRight className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isExpanded && 'rotate-90',
                  isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground'
                )} />
              )}
            </div>
          </>
        )}
      </div>
    );
    
    if (item.path && !item.submenus?.length) {
      return (
        <SidebarMenuButton asChild className={getNavClassName({ isActive })}>
          <NavLink to={item.path}>
            {content}
          </NavLink>
        </SidebarMenuButton>
      );
    }
    
    return (
      <SidebarMenuButton 
        onClick={handleClick}
        className={getNavClassName({ isActive: isActive || hasActiveSubmenu })}
      >
        {content}
      </SidebarMenuButton>
    );
  };
  
  const renderTooltip = (children: React.ReactNode) => {
    if (!collapsed) return children;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          <div className="space-y-1">
            <p className="font-medium">{item.title}</p>
            {item.submenus && (
              <p className="text-xs text-muted-foreground">
                {item.submenus.length} items
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };
  
  const renderSubmenu = () => {
    if (!item.submenus?.length) return null;
    
    return (
      <CollapsibleContent className="animate-accordion-down">
        <SidebarMenuSub>
          {item.submenus.map((subItem) => {
            const SubIcon = subItem.icon ? (LucideIcons as any)[subItem.icon] || LucideIcons.Dot : LucideIcons.Dot;
            const isSubActive = location.pathname === subItem.path;
            
            return (
              <SidebarMenuSubItem key={subItem.id}>
                <SidebarMenuSubButton 
                  asChild 
                  className={cn(
                    'transition-all duration-200 hover:bg-sidebar-accent/50',
                    'hover:translate-x-1 hover:shadow-soft',
                    isSubActive && 'bg-sidebar-primary/20 text-sidebar-primary font-medium'
                  )}
                >
                  <NavLink to={subItem.path}>
                    <div className="flex items-center gap-2 w-full">
                      <SubIcon className="h-3 w-3" />
                      <span className="flex-1 truncate text-xs">
                        {subItem.title}
                      </span>
                      {navigationState.customization.showBadges && subItem.badge && (
                        <Badge variant="secondary" className="h-4 px-1 text-xs">
                          {subItem.badge}
                        </Badge>
                      )}
                      {subItem.isNew && (
                        <Badge variant="destructive" className="h-3 px-0.5 text-xs">
                          •
                        </Badge>
                      )}
                    </div>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    );
  };
  
  // Floating submenu for collapsed state
  const renderFloatingSubmenu = () => {
    if (!collapsed || !showSubmenu || !item.submenus?.length) return null;
    
    return (
      <div 
        className="fixed z-50 ml-2 animate-scale-in"
        style={{ 
          left: '60px', // Adjust based on sidebar width
          top: '50%',
          transform: 'translateY(-50%)'
        }}
        onMouseEnter={() => setShowSubmenu(true)}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-card border border-border rounded-lg shadow-elegant p-2 min-w-48">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b mb-1">
            {item.title}
          </div>
          {item.submenus.map((subItem) => {
            const SubIcon = subItem.icon ? (LucideIcons as any)[subItem.icon] || LucideIcons.Dot : LucideIcons.Dot;
            const isSubActive = location.pathname === subItem.path;
            
            return (
              <NavLink
                key={subItem.id}
                to={subItem.path}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                  'hover:bg-sidebar-accent/50',
                  isSubActive && 'bg-sidebar-primary/20 text-sidebar-primary font-medium'
                )}
              >
                <SubIcon className="h-3 w-3" />
                <span className="flex-1">{subItem.title}</span>
                {subItem.badge && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    {subItem.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <>
      <SidebarMenuItem
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.id)}>
          <CollapsibleTrigger className="w-full">
            {renderTooltip(renderMainItem())}
          </CollapsibleTrigger>
          {!collapsed && renderSubmenu()}
        </Collapsible>
      </SidebarMenuItem>
      
      {renderFloatingSubmenu()}
    </>
  );
};