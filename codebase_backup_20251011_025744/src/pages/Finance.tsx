import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarcodeScanner } from "@/components/inventory/BarcodeScanner";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedYachtSentinel } from "@/contexts/UnifiedYachtSentinelContext";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  CreditCard,
  Receipt,
  Calculator,
  FileText,
  AlertTriangle,
  Plus,
  ShoppingCart,
  ExternalLink,
  Zap,
  Ship
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Finance = () => {
  const { toast } = useToast();
  const { state: { currentYachtId, currentYacht }, actions } = useUnifiedYachtSentinel();
  const [showSmartScan, setShowSmartScan] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load yacht-scoped financial data
  const loadFinancialData = async () => {
    if (!currentYachtId) {
      toast({
        title: "No Yacht Selected",
        description: "Please select a yacht to view financial data.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Fetch yacht-scoped financial transactions
      const transactionData = await getYachtScopedData('financial_transactions', {
        created_at: `gte.${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()}`
      });

      // Fetch yacht-scoped expense categories
      const expenseData = await getYachtScopedData('expense_categories');

      // Calculate financial metrics from real data
      const totalSpent = transactionData
        .filter((t: any) => t.transaction_type === 'expense')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      const totalIncome = transactionData
        .filter((t: any) => t.transaction_type === 'income')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      // Group expenses by category
      const expenseByCategory = transactionData
        .filter((t: any) => t.transaction_type === 'expense')
        .reduce((acc: any, t: any) => {
          const category = t.category || 'Other';
          acc[category] = (acc[category] || 0) + t.amount;
          return acc;
        }, {});

      const processedExpenses = Object.entries(expenseByCategory).map(([category, amount]: [string, any]) => ({
        category,
        amount,
        percentage: Math.round((amount / totalSpent) * 100),
        color: getCategoryColor(category),
        trend: "+2%" // Would be calculated from historical data
      }));

      setFinancialData({
        totalBudget: currentYacht?.annual_budget || 2500000,
        spent: totalSpent,
        remaining: (currentYacht?.annual_budget || 2500000) - totalSpent,
        monthlyOperating: totalSpent,
        totalIncome,
        netPosition: totalIncome - totalSpent
      });

      setExpenses(processedExpenses);
      setTransactions(transactionData.slice(0, 10)); // Latest 10 transactions

    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load yacht financial data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Fuel': 'bg-red-500',
      'Maintenance': 'bg-orange-500', 
      'Crew': 'bg-blue-500',
      'Insurance': 'bg-green-500',
      'Docking': 'bg-purple-500',
      'Food': 'bg-yellow-500',
      'Other': 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const aiRecommendations = [
    {
      type: "cost_saving",
      title: "Fuel Optimization",
      description: "Switch to Marina A for 12% fuel cost savings",
      impact: "$5,400/month",
      confidence: 87
    },
    {
      type: "budget_alert",
      title: "Maintenance Budget Risk", 
      description: "Projected to exceed maintenance budget by 15%",
      impact: "$5,250 over budget",
      confidence: 92
    },
    {
      type: "opportunity",
      title: "Bulk Purchase Discount",
      description: "Combine procurement orders for 8% discount",
      impact: "$2,100 savings",
      confidence: 78
    }
  ];

  const runFinancialAnalysis = async () => {
    if (!currentYachtId) {
      toast({
        title: "No Yacht Selected",
        description: "Please select a yacht first.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          type: 'text',
          content: `Analyze yacht financial data for yacht ${currentYacht?.yacht_name} and provide budget optimization recommendations`,
          context: 'financial_analysis',
          module: 'finance',
          yacht_id: currentYachtId
        }
      });

      if (error) throw error;

      // Log the analysis activity
      await createYachtScopedRecord('yacht_activity_log', {
        module_name: 'finance',
        action_type: 'ai_analysis',
        resource_type: 'financial_analysis',
        new_values: { analysis_type: 'budget_optimization' }
      });

      toast({
        title: "AI Analysis Complete",
        description: "Financial insights and recommendations generated",
      });
    } catch (error) {
      console.error('Financial analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to complete financial AI analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };



  const handleViewProcurement = () => {
    // Navigate to procurement module
    window.location.href = '/procurement';
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
    // Auto-create expense or invoice from scanned receipt/document
    toast({
      title: "Document Scanned!",
      description: `Detected: ${productInfo.name}. Creating financial record...`,
    });
    // Here you would normally process the scanned document and create appropriate financial records
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
                  <DollarSign className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                      Finance
                    </h1>
                    {currentYacht && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Ship className="h-3 w-3" />
                        {currentYacht.yacht_name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    Budget tracking, expense management, and financial reporting with Stripe integration
                  </p>
                  {!currentYachtId && (
                    <p className="text-orange-600 text-sm mt-1">⚠️ Please select a yacht to view financial data</p>
                  )}
                </div>
              </div>
            </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={() => handleQuickAction('smart-scan')} className="bg-gradient-primary text-white border-none hover:bg-gradient-primary/90">
              <Zap className="h-4 w-4 mr-2" />
              Smart Scan
            </Button>
            <Button 
              onClick={runFinancialAnalysis}
              disabled={isAnalyzing}
              variant="outline"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {isAnalyzing ? "Analyzing..." : "AI Analysis"}
            </Button>
            <Button variant="outline" onClick={handleViewProcurement}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Procurement
            </Button>
            <Button variant="ocean">
              <Plus className="h-4 w-4 mr-2" />
              New Expense
            </Button>
            <Button variant="captain">
              <Receipt className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        )}

        {/* No Yacht Selected State */}
        {!currentYachtId && !isLoading && (
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Ship className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Yacht Selected</h3>
              <p className="text-muted-foreground">Please select a yacht to view financial data and manage expenses.</p>
            </CardContent>
          </Card>
        )}

        {/* Financial Overview */}
        {currentYachtId && !isLoading && financialData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${(financialData.totalBudget / 1000000).toFixed(1)}M
                  </p>
                </div>
                <PieChart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-2xl font-bold text-destructive">
                    ${(financialData.spent / 1000000).toFixed(1)}M
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(financialData.remaining / 1000000).toFixed(1)}M
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Operating</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${(financialData.monthlyOperating / 1000).toFixed(0)}K
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Budget Progress */}
        {currentYachtId && !isLoading && financialData && (
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Current spending vs allocated budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Spent: ${(financialData.spent / 1000000).toFixed(1)}M</span>
                <span>Budget: ${(financialData.totalBudget / 1000000).toFixed(1)}M</span>
              </div>
              <Progress value={(financialData.spent / financialData.totalBudget) * 100} className="h-4" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{((financialData.spent / financialData.totalBudget) * 100).toFixed(1)}% utilized</span>
                <span>{((financialData.remaining / financialData.totalBudget) * 100).toFixed(1)}% remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Expense Breakdown */}
        {currentYachtId && !isLoading && expenses.length > 0 && (
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Monthly Expense Breakdown</CardTitle>
            <CardDescription>Operating costs by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${expense.color}`}></div>
                    <span className="font-medium">{expense.category}</span>
                    <Badge variant="outline" className="text-xs">{expense.trend}</Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">{expense.percentage}%</span>
                    <span className="font-bold">${expense.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* AI Recommendations Section */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>AI Financial Insights</span>
            </CardTitle>
            <CardDescription>AI-powered recommendations for cost optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiRecommendations.map((rec, index) => (
                <div key={index} className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {rec.confidence}% confidence
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-600">{rec.impact}</span>
                    <Button size="sm" variant="outline">Apply</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Procurement Financial Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Procurement Transactions</span>
                <Button variant="ghost" size="sm" onClick={handleViewProcurement}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>Recent supplier payments and pending transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{transaction.description || 'Financial Transaction'}</p>
                      <p className="text-xs text-muted-foreground">{transaction.category || 'General'}</p>
                      <p className="text-xs text-muted-foreground">Date: {new Date(transaction.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${transaction.amount?.toLocaleString() || '0'}</p>
                      <Badge className={`${getTransactionStatusColor(transaction.status || 'pending')} border text-xs mt-1`}>
                        {transaction.transaction_type || 'expense'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No recent transactions</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Procurement Budget</CardTitle>
              <CardDescription>Monthly procurement spending vs budget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly Budget</span>
                  <span className="font-semibold">${financialData ? Math.round(financialData.totalBudget / 12).toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Month Spend</span>
                  <span className="font-semibold text-orange-600">${financialData ? financialData.monthlyOperating.toLocaleString() : '0'}</span>
                </div>
                <Progress value={financialData ? (financialData.monthlyOperating / (financialData.totalBudget / 12)) * 100 : 0} className="h-3" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Remaining Budget</span>
                  <span className="font-semibold text-green-600">${financialData ? Math.max(0, (financialData.totalBudget / 12) - financialData.monthlyOperating).toLocaleString() : '0'}</span>
                </div>
                <Button variant="outline" className="w-full" onClick={handleViewProcurement}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Manage Procurement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Processing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Stripe integration for automated supplier payments and expense management.
              </p>
              <Button variant="outline" className="w-full">
                Configure Payments
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Procurement Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time synchronization with procurement module for seamless financial tracking.
              </p>
              <Button variant="outline" className="w-full" onClick={handleViewProcurement}>
                View Procurement
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>Budget Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time budget monitoring with intelligent spending alerts.
              </p>
              <Button variant="outline" className="w-full">
                View Alerts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Smart Scanner for receipts and invoices */}
      <BarcodeScanner
        isOpen={showSmartScan}
        onClose={() => setShowSmartScan(false)}
        onProductDetected={handleSmartScanDetected}
      />
    </div>
  );
};

export default Finance;