import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "./NotificationCenter";
import { useLocation } from "@/contexts/LocationContext";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Ship, 
  MapPin, 
  Wifi, 
  Battery, 
  Settings,
  User,
  Bell,
  Menu,
  Search,
  LogOut,
  UserCircle
} from "lucide-react";

const YachtHeader = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { formatLocationForDisplay, isLoading, rawPosition } = useLocation();
  const { isConnected } = useRealtime();
  const { user, signOut } = useSupabaseAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/auth");
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('universal-search', {
        body: {
          query: searchQuery,
          searchType: 'text'
        }
      });

      if (error) throw error;

      // Navigate to universal search with results
      navigate('/universal-search', { state: { searchQuery, results: data } });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, navigate, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="flex items-center justify-between w-full">
      {/* Logo and Brand */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-ocean rounded-lg shadow-glow">
            <Ship className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-foreground">YachtExcel</h1>
            <p className="text-xs text-muted-foreground">Superyacht Management</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search across all modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSearching}
            className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
          />
        </div>
      </div>

      {/* Status and Actions */}
      <div className="flex items-center space-x-3">
        {/* Yacht Status */}
        <div className="hidden lg:flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {rawPosition ? formatLocationForDisplay() : "GPS Required"}
          </Badge>
          
          <div className="flex items-center space-x-1">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
              isConnected ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <Wifi className={`h-3 w-3 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 rounded-md">
              <Battery className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-blue-600">98%</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <NotificationCenter />

        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <UserCircle className="h-4 w-4 mr-2" />
              {user?.email?.split('@')[0] || 'User'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default YachtHeader;