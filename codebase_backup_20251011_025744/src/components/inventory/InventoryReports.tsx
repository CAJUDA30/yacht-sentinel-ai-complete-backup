import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  BarChart3,
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Mail,
  Clock,
  Plus
} from "lucide-react";
import { InventoryItemType, InventoryReport, InventoryFilter } from "@/types/inventory";

interface InventoryReportsProps {
  items: InventoryItemType[];
  onExport: (format: string, data: any) => void;
}

export const InventoryReports = ({ items, onExport }: InventoryReportsProps) => {
  const [activeReport, setActiveReport] = useState("stock-levels");
  const [reportFilters, setReportFilters] = useState<InventoryFilter>({});
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [reportSettings, setReportSettings] = useState({
    name: "",
    type: "stock-levels" as const,
    format: "pdf" as const,
    schedule: undefined as string | undefined,
    recipients: [] as string[]
  });

  // Calculate report data
  const getStockLevelsData = () => {
    const totalItems = items.length;
    const inStock = items.filter(item => item.status === "in-stock").length;
    const lowStock = items.filter(item => item.status === "low-stock").length;
    const outOfStock = items.filter(item => item.status === "out-of-stock").length;
    const expired = items.filter(item => item.status === "expired").length;

    return {
      summary: { totalItems, inStock, lowStock, outOfStock, expired },
      byCategory: items.reduce((acc, item) => {
        if (!acc[item.folder]) {
          acc[item.folder] = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };
        }
        acc[item.folder].total++;
        if (item.status === "in-stock") acc[item.folder].inStock++;
        if (item.status === "low-stock") acc[item.folder].lowStock++;
        if (item.status === "out-of-stock") acc[item.folder].outOfStock++;
        return acc;
      }, {} as Record<string, any>),
      items: items.map(item => ({
        name: item.name,
        sku: item.sku,
        category: item.folder,
        location: item.location,
        quantity: item.quantity,
        minStock: item.minStock,
        status: item.status,
        value: (item.purchasePrice || 0) * (item.quantity || 0)
      }))
    };
  };

  const getValuationData = () => {
    const totalValue = items.reduce((sum, item) => sum + ((item.purchasePrice || 0) * (item.quantity || 0)), 0);
    const totalCost = items.reduce((sum, item) => sum + (item.purchasePrice || 0) * item.quantity, 0);
    
    const byCategory = items.reduce((acc, item) => {
      if (!acc[item.folder]) {
        acc[item.folder] = { value: 0, cost: 0, items: 0 };
      }
      acc[item.folder].value += (item.purchasePrice || 0) * (item.quantity || 0);
      acc[item.folder].cost += (item.purchasePrice || 0) * item.quantity;
      acc[item.folder].items++;
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: { totalValue, totalCost, profit: totalValue - totalCost },
      byCategory,
      items: items.map(item => ({
        name: item.name,
        sku: item.sku,
        category: item.folder,
        quantity: item.quantity,
        unitValue: (item.purchasePrice || 0),
        totalValue: ((item.purchasePrice || 0) * (item.quantity || 0)),
        unitCost: item.purchasePrice,
        totalCost: (item.purchasePrice || 0) * item.quantity
      }))
    };
  };

  const getLowStockData = () => {
    const lowStockItems = items.filter(item => 
      item.minStock && item.quantity <= item.minStock
    );

    const critical = lowStockItems.filter(item => item.quantity === 0);
    const warning = lowStockItems.filter(item => 
      item.quantity > 0 && item.quantity <= (item.minStock || 0) * 0.5
    );
    const low = lowStockItems.filter(item => 
      item.quantity > (item.minStock || 0) * 0.5 && item.quantity <= (item.minStock || 0)
    );

    return {
      summary: { 
        total: lowStockItems.length, 
        critical: critical.length, 
        warning: warning.length, 
        low: low.length 
      },
      items: lowStockItems.map(item => ({
        name: item.name,
        sku: item.sku,
        category: item.folder,
        location: item.location,
        currentStock: item.quantity,
        minStock: item.minStock,
        priority: item.quantity === 0 ? "Critical" : 
                 item.quantity <= (item.minStock || 0) * 0.5 ? "High" : "Medium",
        supplier: item.supplier,
        lastUpdated: item.lastUpdated
      }))
    };
  };

  const getExpiryData = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringItems = items.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= thirtyDaysFromNow;
    });

    const expired = expiringItems.filter(item => new Date(item.expiryDate!) <= now);
    const expiringSoon = expiringItems.filter(item => {
      const expiryDate = new Date(item.expiryDate!);
      return expiryDate > now && expiryDate <= thirtyDaysFromNow;
    });

    return {
      summary: { 
        total: expiringItems.length, 
        expired: expired.length, 
        expiringSoon: expiringSoon.length 
      },
      items: expiringItems.map(item => ({
        name: item.name,
        sku: item.sku,
        category: item.folder,
        location: item.location,
        expiryDate: item.expiryDate,
        daysUntilExpiry: Math.ceil((new Date(item.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: new Date(item.expiryDate!) <= now ? "Expired" : "Expiring Soon",
        supplier: item.supplier
      }))
    };
  };

  const handleExport = (reportType: string, format: string) => {
    let data;
    
    switch (reportType) {
      case "stock-levels":
        data = getStockLevelsData();
        break;
      case "valuation":
        data = getValuationData();
        break;
      case "low-stock":
        data = getLowStockData();
        break;
      case "expiry":
        data = getExpiryData();
        break;
      default:
        data = getStockLevelsData();
    }

    onExport(format, { type: reportType, data });
    
    toast({
      title: "Export Started",
      description: `Generating ${reportType} report in ${format.toUpperCase()} format...`
    });
  };

  const renderStockLevelsReport = () => {
    const data = getStockLevelsData();
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{data.summary.totalItems}</p>
                </div>
                <Package className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">{data.summary.inStock}</p>
                </div>
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">{data.summary.lowStock}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{data.summary.outOfStock}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.byCategory).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{category}</h4>
                    <p className="text-sm text-muted-foreground">{stats.total} items</p>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-600">{stats.inStock} In Stock</span>
                    <span className="text-orange-600">{stats.lowStock} Low</span>
                    <span className="text-red-600">{stats.outOfStock} Out</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderValuationReport = () => {
    const data = getValuationData();
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${data.summary.totalValue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">${data.summary.totalCost.toLocaleString()}</p>
                </div>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit/Loss</p>
                  <p className={`text-2xl font-bold ${data.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${data.summary.profit.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className={`h-5 w-5 ${data.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle>Valuation by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.byCategory).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{category}</h4>
                    <p className="text-sm text-muted-foreground">{stats.items} items</p>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span>Value: ${stats.value.toLocaleString()}</span>
                    <span>Cost: ${stats.cost.toLocaleString()}</span>
                    <span className={stats.value - stats.cost >= 0 ? "text-green-600" : "text-red-600"}>
                      {stats.value - stats.cost >= 0 ? "+" : ""}${(stats.value - stats.cost).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderLowStockReport = () => {
    const data = getLowStockData();
    
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Low Stock</p>
                  <p className="text-2xl font-bold">{data.summary.total}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{data.summary.critical}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">{data.summary.warning}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Medium Priority</p>
                  <p className="text-2xl font-bold text-yellow-600">{data.summary.low}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge 
                        className={
                          item.priority === "Critical" ? "bg-red-600 text-white" :
                          item.priority === "High" ? "bg-orange-600 text-white" :
                          "bg-yellow-600 text-white"
                        }
                      >
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.category} • {item.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{item.currentStock} / {item.minStock}</p>
                    <p className="text-sm text-muted-foreground">{item.supplier}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderExpiryReport = () => {
    const data = getExpiryData();
    
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{data.summary.total}</p>
                </div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Already Expired</p>
                  <p className="text-2xl font-bold text-red-600">{data.summary.expired}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{data.summary.expiringSoon}</p>
                </div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Expiring Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge 
                        className={item.status === "Expired" ? "bg-red-600 text-white" : "bg-orange-600 text-white"}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.category} • {item.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {item.daysUntilExpiry > 0 ? `${item.daysUntilExpiry} days` : "Expired"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventory Reports</h2>
          <p className="text-muted-foreground">Generate comprehensive inventory reports and analytics</p>
        </div>
        
        <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Report</DialogTitle>
            </DialogHeader>
            {/* Report creation form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stock-levels">Stock Levels</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="expiry">Expiry</TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport(activeReport, "csv")}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport(activeReport, "pdf")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <TabsContent value="stock-levels">
          {renderStockLevelsReport()}
        </TabsContent>

        <TabsContent value="valuation">
          {renderValuationReport()}
        </TabsContent>

        <TabsContent value="low-stock">
          {renderLowStockReport()}
        </TabsContent>

        <TabsContent value="expiry">
          {renderExpiryReport()}
        </TabsContent>
      </Tabs>
    </div>
  );
};