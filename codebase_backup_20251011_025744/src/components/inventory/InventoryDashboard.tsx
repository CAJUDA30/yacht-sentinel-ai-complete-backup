import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Zap,
  Shield,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  Edit3,
  ArrowUpDown,
  FolderOpen,
  Plus,
  Minus,
  MoreVertical,
  History,
  Download,
  Copy,
  Trash2,
  QrCode,
  Lock
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { InventoryItemType, LowStockAlert } from "@/types/inventory";
import { useInventorySettings } from "./InventorySettingsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { UnifiedInventoryCard } from "./UnifiedInventoryCard";

interface InventoryDashboardProps {
  items: InventoryItemType[];
  onQuickAction: (action: string, data?: any) => void;
  onFilterItems: (filterType: string, filterValue?: any) => void;
  onEditItem?: (item: InventoryItemType) => void;
  onDeleteItem?: (itemId: string) => void;
  onDuplicateItem?: (item: InventoryItemType) => void;
  onViewItemDetail?: (item: InventoryItemType) => void;
}

export const InventoryDashboard = ({ 
  items, 
  onQuickAction, 
  onFilterItems, 
  onEditItem, 
  onDeleteItem, 
  onDuplicateItem, 
  onViewItemDetail 
}: InventoryDashboardProps) => {
  const { isLowStock, settings } = useInventorySettings();
  const { formatPrice } = useCurrency();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);

  useEffect(() => {
    // Generate low stock alerts
    const lowStockItems = items.filter(item => 
      item.minStock && item.quantity <= item.minStock
    ).map(item => ({
      id: `alert-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      currentStock: item.quantity,
      minStock: item.minStock || 0,
      location: item.location,
      priority: item.quantity === 0 ? "critical" as const : 
                item.quantity <= (item.minStock || 0) * 0.5 ? "high" as const : "medium" as const,
      createdAt: new Date().toISOString(),
      acknowledged: false
    }));
    setAlerts(lowStockItems);
  }, [items]);

  const stats = {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    uniqueItems: items.length,
    totalValue: items.reduce((sum, item) => sum + ((item.purchasePrice || 0) * (item.quantity || 0)), 0),
    lowStock: items.filter(item => item.status === "low-stock" || item.status === "out-of-stock").length,
    expired: items.filter(item => item.status === "expired").length,
    categories: new Set(items.map(item => item.folder)).size,
    locations: new Set(items.map(item => item.location)).size,
    criticalItems: items.filter(item => item.priority === "critical").length,
    maintenanceDue: items.filter(item => item.nextMaintenanceDate && new Date(item.nextMaintenanceDate) <= new Date()).length
  };

  // Get most recent items (sorted by creation date or ID)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 3);

  const criticalItems = items.filter(item => item.priority === "critical").slice(0, 4);

  const locationBreakdown = items.reduce((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topLocations = Object.entries(locationBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);

  const categoryBreakdown = items.reduce((acc, item) => {
    acc[item.folder] = (acc[item.folder] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate category breakdown by total quantity (not unique items)
  const categoryBreakdownByQuantity = items.reduce((acc, item) => {
    acc[item.folder] = (acc[item.folder] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryBreakdownByQuantity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const lowStockPercentage = (stats.lowStock / stats.totalItems) * 100;
  const utilizationRate = 85; // This would be calculated based on actual usage data

  return (
    <div className="space-y-8">
      {/* Hero Statistics Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-elegant rounded-2xl opacity-10"></div>
        <Card className="relative shadow-glow border-primary/20 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Inventory Overview
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Real-time insights and performance metrics
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-background/50 backdrop-blur-sm"
                onClick={() => onQuickAction('settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div 
                className="group p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => onFilterItems('all')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Items</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalItems}</p>
                  <p className="text-xs text-green-600 mt-1">+12% this month</p>
                </div>
              </div>

              <div 
                className="group p-6 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => onFilterItems('sort-by-value')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-full bg-emerald-500/20">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-foreground">{formatPrice(stats.totalValue)}</p>
                  <p className="text-xs text-green-600 mt-1">+8.2% this week</p>
                </div>
              </div>

              <div 
                className="group p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => onFilterItems('low-stock')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-full bg-amber-500/20">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <TrendingDown className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Low Stock Items</p>
                  <p className="text-3xl font-bold text-foreground">{stats.lowStock}</p>
                  <p className="text-xs text-amber-600 mt-1">Needs attention</p>
                </div>
              </div>

              <div 
                className="group p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                onClick={() => onFilterItems('categories')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-full bg-purple-500/20">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Categories</p>
                  <p className="text-3xl font-bold text-foreground">{stats.categories}</p>
                  <p className="text-xs text-purple-600 mt-1">Well organized</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Inventory Health & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Items with Quick Actions - Horizontal Scroll */}
          <Card className="shadow-elegant border-border/50 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-primary">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span>Recent Items</span>
              </CardTitle>
              <CardDescription>Latest additions with quick action shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="flex space-x-4 pb-4" style={{ width: 'max-content' }}>
                  {[...items]
                    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
                    .slice(0, 15)
                    .map((item) => {
                      const itemCount = item.quantity || 0;
                      const totalValue = (item.purchasePrice || 0) * itemCount;
                      const imageUrl = item.photos && item.photos.length > 0 ? item.photos[0] : undefined;
                      
                      return (
                        <div key={item.id} className="flex-shrink-0 w-64">
                          <UnifiedInventoryCard
                            item={item}
                            title={item.name}
                            imageUrl={imageUrl}
                            itemCount={itemCount}
                            totalValue={totalValue}
                            description={item.description || item.folder}
                            type="recent"
                            onClick={() => onViewItemDetail?.(item)}
                            onEdit={onEditItem}
                            onDelete={onDeleteItem}
                            onDuplicate={onDuplicateItem}
                            onViewHistory={(id) => toast({ title: "Item History", description: "Opening history view..." })}
                            onSetAlerts={(item) => toast({ title: "Set Alerts", description: `Managing alerts for ${item.name}...` })}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card className="shadow-elegant border-border/50 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-secondary">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span>Category Distribution</span>
              </CardTitle>
              <CardDescription>Most stocked categories in your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCategories.map(([category, count], index) => {
                  const percentage = (count / stats.totalItems) * 100;
                  const colors = [
                    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'
                  ];
                  return (
                    <div 
                      key={category} 
                      className="group cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-all duration-200"
                      onClick={() => onFilterItems('category', category)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${colors[index] || 'bg-gray-500'}`}></div>
                          <span className="font-medium text-foreground">{category}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">{count} items</span>
                          <span className="text-xs text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-elegant border-border/50 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-accent">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Latest inventory movements and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Added new item: <span className="text-primary">{item.name}</span></p>
                      <p className="text-xs text-muted-foreground">
                        {item.folder} • {item.location} • {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">New</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <Card className="shadow-elegant border-border/50 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-primary">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Common inventory tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                  onClick={() => onQuickAction('add-item')}
                >
                  <Package className="h-4 w-4 mr-3" />
                  Add New Item
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-primary/20 hover:bg-primary/5"
                  onClick={() => onQuickAction('photo-scan')}
                >
                  <Package className="h-4 w-4 mr-3" />
                  Smart Scan
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-secondary/20 hover:bg-secondary/5"
                  onClick={() => onQuickAction('bulk-import')}
                >
                  <TrendingUp className="h-4 w-4 mr-3" />
                  Bulk Import
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-accent/20 hover:bg-accent/5"
                  onClick={() => onQuickAction('generate-report')}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Critical Items */}
          <Card className="shadow-elegant border-border/50 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span>Critical Items</span>
              </CardTitle>
              <CardDescription>Take immediate action on priority items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-all duration-200"
                  onClick={() => onFilterItems('priority', 'critical')}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">Critical Priority</p>
                    <p className="text-xs text-muted-foreground">Items requiring attention</p>
                  </div>
                  <span className="text-3xl font-bold text-orange-600">{stats.criticalItems}</span>
                </div>
                
                <div 
                  className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 cursor-pointer hover:bg-purple-500/20 transition-all duration-200"
                  onClick={() => onFilterItems('maintenance-due')}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">Maintenance Due</p>
                    <p className="text-xs text-muted-foreground">Equipment service needed</p>
                  </div>
                  <span className="text-3xl font-bold text-purple-600">{stats.maintenanceDue}</span>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 rounded-xl"
                  onClick={() => onQuickAction('manage-critical')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Critical Items
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Storage Locations */}
          <Card className="shadow-elegant border-border/50 bg-card/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span>Storage Locations</span>
              </CardTitle>
              <CardDescription>Navigate to specific locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/5 border border-teal-500/20">
                  <span className="text-4xl font-bold text-foreground">{stats.locations}</span>
                  <p className="text-sm text-muted-foreground mt-1">Active storage locations</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {topLocations.map(([location, count]) => {
                    const locationItems = items.filter(item => item.location === location);
                    const locationValue = locationItems.reduce((sum, item) => sum + ((item.purchasePrice || 0) * (item.quantity || 0)), 0);
                    return (
                      <div
                        key={location}
                        className="group p-4 rounded-xl bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/50 dark:to-slate-700/30 border border-border/50 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all duration-200"
                        onClick={() => onFilterItems('location', location)}
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground mb-1">{location}</p>
                          <p className="text-xs text-muted-foreground">{count} item{count !== 1 ? 's' : ''}</p>
                          <p className="text-sm font-bold text-primary mt-1">{formatPrice(locationValue)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl border-teal-500/20 hover:bg-teal-500/5 text-teal-700 dark:text-teal-300"
                  onClick={() => onFilterItems('locations')}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  View All Locations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};
