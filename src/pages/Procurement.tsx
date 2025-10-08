import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  Users,
  FileText,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Clock,
  DollarSign,
  CheckCircle,
  Zap
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Procurement = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSmartScan, setShowSmartScan] = useState(false);

  const procurementData = {
    totalSuppliers: 24,
    activePOs: 8,
    pendingApprovals: 3,
    monthlyProcurement: 85000,
    averageLeadTime: "5.2 days",
    supplierRating: 4.2
  };

  const purchaseOrders = [
    {
      id: "PO-2024-001",
      supplier: "Marine Parts Ltd",
      items: "Engine Oil, Filters",
      amount: 2500,
      status: "pending",
      requestedBy: "Chief Engineer",
      deliveryDate: "2024-01-15",
      priority: "medium"
    },
    {
      id: "PO-2024-002", 
      supplier: "Nautical Supplies Co",
      items: "Safety Equipment",
      amount: 4200,
      status: "approved",
      requestedBy: "Captain",
      deliveryDate: "2024-01-12",
      priority: "high"
    },
    {
      id: "PO-2024-003",
      supplier: "Premium Provisions",
      items: "Food & Beverages",
      amount: 3800,
      status: "delivered",
      requestedBy: "Chef",
      deliveryDate: "2024-01-10", 
      priority: "low"
    }
  ];

  const suppliers = [
    {
      id: 1,
      name: "Marine Parts Ltd",
      category: "Engine & Mechanical",
      rating: 4.5,
      totalOrders: 156,
      averageDelivery: "3.2 days",
      contact: "john@marineparts.com",
      status: "active"
    },
    {
      id: 2,
      name: "Nautical Supplies Co",
      category: "Safety & Navigation",
      rating: 4.8,
      totalOrders: 89,
      averageDelivery: "2.1 days",
      contact: "sales@nauticalsupplies.com",
      status: "active"
    },
    {
      id: 3,
      name: "Premium Provisions",
      category: "Food & Beverage",
      rating: 4.2,
      totalOrders: 234,
      averageDelivery: "1.5 days",
      contact: "orders@premiumprovisions.com",
      status: "active"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved": return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-orange-100 text-orange-800 border-orange-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCreatePO = () => {
    toast({
      title: "Create Purchase Order",
      description: "Opening purchase order creation form..."
    });
  };

  const handleViewFinancials = () => {
    // This would navigate to the Finance module to view procurement-related expenses
    toast({
      title: "View in Finance",
      description: "Opening financial view for procurement data..."
    });
  };

  const handleQuickAction = (action: string) => {
    if (action === 'smart-scan') {
      setShowSmartScan(true);
      return;
    }
    toast({
      title: "Action Triggered",
      description: `${action} functionality will be implemented here.`,
    });
  };

  const handleSmartScanDetected = (productInfo: any, barcode: string, quantity?: number) => {
    // Auto-create purchase order from scanned product/invoice
    toast({
      title: "Product Scanned!",
      description: `Detected: ${productInfo.name}. Creating purchase order...`,
    });
    // Here you would normally process the scanned item and create appropriate purchase orders
  };

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
                <ShoppingCart className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Procurement Management
                </h1>
                <p className="text-muted-foreground">
                  Supplier management, purchase orders, and procurement analytics
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={() => handleQuickAction('smart-scan')} className="bg-gradient-primary text-white border-none hover:bg-gradient-primary/90">
              <Zap className="h-4 w-4 mr-2" />
              Smart Scan
            </Button>
            <Button variant="outline" onClick={handleViewFinancials}>
              <DollarSign className="h-4 w-4 mr-2" />
              View Financials
            </Button>
            <Button variant="ocean" onClick={handleCreatePO}>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suppliers</p>
                  <p className="text-2xl font-bold text-foreground">{procurementData.totalSuppliers}</p>
                </div>
                <Users className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active POs</p>
                  <p className="text-2xl font-bold text-blue-600">{procurementData.activePOs}</p>
                </div>
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-600">{procurementData.pendingApprovals}</p>
                </div>
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Spend</p>
                  <p className="text-xl font-bold text-green-600">${(procurementData.monthlyProcurement / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Lead Time</p>
                  <p className="text-xl font-bold text-purple-600">{procurementData.averageLeadTime}</p>
                </div>
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-xl font-bold text-indigo-600">{procurementData.supplierRating}/5</p>
                </div>
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Orders */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>Recent and active purchase orders</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-semibold text-foreground">{po.id}</p>
                      <p className="text-sm text-muted-foreground">{po.supplier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{po.items}</p>
                      <p className="text-xs text-muted-foreground">Requested by {po.requestedBy}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold">${po.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Due: {po.deliveryDate}</p>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <Badge className={`${getStatusColor(po.status)} border text-xs`}>
                        {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                      </Badge>
                      <Badge className={`${getPriorityColor(po.priority)} border text-xs`}>
                        {po.priority.charAt(0).toUpperCase() + po.priority.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Suppliers */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Supplier Management</CardTitle>
            <CardDescription>Manage vendor relationships and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className="border border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                        <p className="text-sm text-muted-foreground">{supplier.category}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {supplier.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Rating:</span>
                        <span className="font-medium">{supplier.rating}/5</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Orders:</span>
                        <span className="font-medium">{supplier.totalOrders}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Delivery:</span>
                        <span className="font-medium">{supplier.averageDelivery}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Inventory Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Auto-generate purchase orders based on inventory low stock alerts.
              </p>
              <Button variant="outline" className="w-full">
                View Inventory Needs
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Approval Workflow</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Streamlined approval process for purchase orders above threshold.
              </p>
              <Button variant="outline" className="w-full">
                Pending Approvals
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <span>Financial Sync</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time sync with Finance module for budget tracking and payments.
              </p>
              <Button variant="outline" className="w-full" onClick={handleViewFinancials}>
                View Budget Impact
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Smart Scanner for products and invoices */}
      <BarcodeScanner
        isOpen={showSmartScan}
        onClose={() => setShowSmartScan(false)}
        onProductDetected={handleSmartScanDetected}
      />
    </div>
  );
};

export default Procurement;