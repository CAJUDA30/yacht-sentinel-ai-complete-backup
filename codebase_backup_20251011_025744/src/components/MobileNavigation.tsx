import { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Package, 
  Users, 
  Wrench, 
  DollarSign, 
  Navigation,
  Shield,
  FileText,
  UserCheck,
  Ship,
  BarChart3,
  Settings,
  Search,
  Mic
} from 'lucide-react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useOffline } from '@/contexts/OfflineContext';

interface MobileNavigationProps {
  onVoiceControl: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ onVoiceControl }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useRealtime();
  const { isOnline, pendingSync } = useOffline();

  const navigationItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/crew', icon: Users, label: 'Crew' },
    { path: '/maintenance', icon: Wrench, label: 'Maintenance' },
    { path: '/finance', icon: DollarSign, label: 'Finance' },
    { path: '/navigation', icon: Navigation, label: 'Navigation' },
    { path: '/safety', icon: Shield, label: 'Safety' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/guests', icon: UserCheck, label: 'Guests' },
    { path: '/charter', icon: Ship, label: 'Charter' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  const primaryNavItems = navigationItems.slice(0, 4);
  const secondaryNavItems = navigationItems.slice(4);

  return (
    <>
      {/* Enhanced Top Navigation Bar for Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-card backdrop-blur-md border-b border-border/30 px-4 py-3 shadow-soft">
        <div className="flex items-center justify-between animate-slide-down">
          {/* Enhanced Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-wave rounded-xl shadow-glow">
              <Ship className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg text-foreground">YachtExcel</span>
              <div className="text-xs text-muted-foreground">Maritime AI</div>
            </div>
          </div>

          {/* Enhanced Status Indicators */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-300 ${
              isOnline 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className={`text-xs font-medium ${
                isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {isConnected && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Live</span>
              </div>
            )}
            
            {pendingSync.length > 0 && (
              <Badge variant="outline" className="text-xs animate-bounce">
                {pendingSync.length} sync
              </Badge>
            )}

      {/* Enhanced Search and Voice */}
            <div className="flex items-center space-x-1 ml-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/search')}
                className="p-2.5 hover:bg-primary/10 hover:scale-105 transition-all duration-200 rounded-full"
              >
                <Search className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onVoiceControl}
                className="p-2.5 hover:bg-accent/10 hover:scale-105 transition-all duration-200 rounded-full"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Secondary Navigation Pills */}
        <div className="flex space-x-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {secondaryNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex-shrink-0 text-xs px-4 py-2.5 h-auto rounded-full transition-all duration-300 animate-fade-in ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-elegant scale-105' 
                    : 'hover:bg-muted/60 hover:scale-105'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Icon className="w-3.5 h-3.5 mr-1.5" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Enhanced Bottom Navigation Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-card backdrop-blur-md border-t border-border/30 shadow-elegant">
        <div className="safe-area-padding-bottom">
          <div className="grid grid-cols-4 gap-1 p-3">
            {primaryNavItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center space-y-1.5 py-3 px-2 h-auto rounded-xl transition-all duration-300 animate-slide-up ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-elegant scale-105' 
                      : 'hover:bg-muted/60 hover:scale-105 active:scale-95'
                  }`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    minHeight: '64px'
                  }}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <span className={`text-xs font-medium transition-all duration-300 ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Spacers with proper safe area handling */}
      <div className="lg:hidden h-28" /> {/* Top spacer - increased for better spacing */}
      <div className="lg:hidden h-24" /> {/* Bottom spacer with safe area */}
    </>
  );
};

export default MobileNavigation;