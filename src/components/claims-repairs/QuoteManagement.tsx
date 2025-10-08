import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useClaimsRepairs } from '@/contexts/ClaimsRepairsContext';
import { useSuppliers } from '@/hooks/useSuppliers';
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Bot,
  Calculator,
  Send,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  ExternalLink,
  ShoppingCart,
  Award,
  Star
} from 'lucide-react';

interface QuoteManagementProps {
  selectedJobId?: string;
}

export const QuoteManagement: React.FC<QuoteManagementProps> = ({ selectedJobId }) => {
  const { toast } = useToast();
  const { jobs, createCostEstimate, approveQuote } = useClaimsRepairs();
  const { suppliers } = useSuppliers();
  
  const [selectedJob, setSelectedJob] = useState(selectedJobId || '');
  const [activeTab, setActiveTab] = useState('quotes');
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [quoteData, setQuoteData] = useState({
    estimate_type: 'initial',
    labor_cost: 0,
    parts_cost: 0,
    supplier_quote_ref: '',
    valid_until: ''
  });
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedJob) {
      loadQuotes(selectedJob);
    }
  }, [selectedJob]);

  const loadQuotes = async (jobId: string) => {
    setLoading(true);
    try {
      // This would typically fetch from the database
      // For now, we'll simulate some quotes
      setQuotes([
        {
          id: '1',
          estimate_type: 'initial',
          labor_cost: 2500,
          parts_cost: 1200,
          total_cost: 3700,
          currency: 'USD',
          valid_until: '2024-09-15',
          supplier_quote_ref: 'SUP-2024-001',
          ai_extracted: true,
          created_at: '2024-08-14T10:00:00Z',
          supplier: suppliers[0]
        },
        {
          id: '2',
          estimate_type: 'revised',
          labor_cost: 2200,
          parts_cost: 1000,
          total_cost: 3200,
          currency: 'USD',
          valid_until: '2024-09-20',
          supplier_quote_ref: 'SUP-2024-002',
          ai_extracted: false,
          created_at: '2024-08-13T14:30:00Z',
          supplier: suppliers[1]
        }
      ]);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedJob) return;

    setLoading(true);
    try {
      const totalCost = quoteData.labor_cost + quoteData.parts_cost;
      const newQuote = await createCostEstimate(selectedJob, {
        ...quoteData,
        estimate_type: quoteData.estimate_type as 'initial' | 'revised' | 'final',
        total_cost: totalCost,
        currency: 'USD'
      });

      if (newQuote) {
        setShowCreateQuote(false);
        setQuoteData({
          estimate_type: 'initial',
          labor_cost: 0,
          parts_cost: 0,
          supplier_quote_ref: '',
          valid_until: ''
        });
        await loadQuotes(selectedJob);
        toast({
          title: "Success",
          description: "Quote created successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create quote",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveQuote = async (quoteId: string, routeToProcurement = false) => {
    setLoading(true);
    try {
      const success = await approveQuote(quoteId, routeToProcurement);
      if (success) {
        await loadQuotes(selectedJob);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve quote",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIQuote = async () => {
    setLoading(true);
    try {
      // Simulate AI quote generation
      setTimeout(() => {
        setQuoteData({
          estimate_type: 'initial',
          labor_cost: Math.floor(Math.random() * 3000) + 1000,
          parts_cost: Math.floor(Math.random() * 2000) + 500,
          supplier_quote_ref: `AI-${Date.now()}`,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        setLoading(false);
        toast({
          title: "AI Quote Generated",
          description: "AI has generated a cost estimate based on historical data"
        });
      }, 2000);
    } catch (error) {
      setLoading(false);
    }
  };

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  const getQuoteStatusColor = (quote: any) => {
    const isExpired = new Date(quote.valid_until) < new Date();
    if (isExpired) return 'bg-destructive';
    
    const daysUntilExpiry = Math.ceil((new Date(quote.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 7) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quote Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage cost estimates and supplier quotes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bot className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
          <Dialog open={showCreateQuote} onOpenChange={setShowCreateQuote}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Quote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Cost Estimate</DialogTitle>
                <DialogDescription>
                  Generate a new cost estimate for the selected job
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estimate Type</label>
                    <Select 
                      value={quoteData.estimate_type} 
                      onValueChange={(value) => setQuoteData(prev => ({ ...prev, estimate_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">Initial Estimate</SelectItem>
                        <SelectItem value="revised">Revised Estimate</SelectItem>
                        <SelectItem value="final">Final Quote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valid Until</label>
                    <Input
                      type="date"
                      value={quoteData.valid_until}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, valid_until: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Labor Cost (USD)</label>
                    <Input
                      type="number"
                      value={quoteData.labor_cost}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, labor_cost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Parts Cost (USD)</label>
                    <Input
                      type="number"
                      value={quoteData.parts_cost}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, parts_cost: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier Quote Reference</label>
                  <Input
                    value={quoteData.supplier_quote_ref}
                    onChange={(e) => setQuoteData(prev => ({ ...prev, supplier_quote_ref: e.target.value }))}
                    placeholder="Enter supplier reference number"
                  />
                </div>

                <div className="border rounded-lg p-4 bg-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Total Cost</span>
                    <span className="text-lg font-bold">
                      ${(quoteData.labor_cost + quoteData.parts_cost).toLocaleString()} USD
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Labor: ${quoteData.labor_cost.toLocaleString()}</div>
                    <div>Parts: ${quoteData.parts_cost.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={generateAIQuote}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Generate AI Estimate
                  </Button>
                  <Button onClick={handleCreateQuote} disabled={loading} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quote
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Job Selection */}
      <div className="flex gap-4">
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a job" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map(job => (
              <SelectItem key={job.id} value={job.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{job.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {job.yacht?.yacht_name} • {job.job_type}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedJob ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Select a Job</h3>
            <p className="text-muted-foreground">
              Choose a job to view and manage quotes
            </p>
          </div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="quotes">Cost Estimates</TabsTrigger>
            <TabsTrigger value="comparison">Quote Comparison</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quotes.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Lowest Quote</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    ${Math.min(...quotes.map(q => q.total_cost)).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${Math.round(quotes.reduce((sum, q) => sum + q.total_cost, 0) / quotes.length).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {quotes.filter(q => new Date(q.valid_until) > new Date()).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quotes List */}
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          ${quote.total_cost.toLocaleString()} {quote.currency}
                        </CardTitle>
                        <Badge variant="outline">{quote.estimate_type}</Badge>
                        {quote.ai_extracted && (
                          <Badge variant="secondary">
                            <Bot className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                      </div>
                      <Badge className={getQuoteStatusColor(quote)}>
                        {new Date(quote.valid_until) < new Date() ? 'Expired' : 'Valid'}
                      </Badge>
                    </div>
                    <CardDescription>
                      Quote ref: {quote.supplier_quote_ref} • 
                      Valid until: {new Date(quote.valid_until).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Labor Cost</div>
                        <div className="font-medium">${quote.labor_cost.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Parts Cost</div>
                        <div className="font-medium">${quote.parts_cost.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Supplier</div>
                        <div className="font-medium flex items-center gap-1">
                          {quote.supplier?.name || 'Unknown'}
                          {quote.supplier?.performance_rating && (
                          <Badge variant="outline">
                            <Star className="h-3 w-3 mr-1" />
                            {quote.supplier.performance_rating}/5
                          </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApproveQuote(quote.id)}
                        disabled={new Date(quote.valid_until) < new Date()}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleApproveQuote(quote.id, true)}
                        disabled={new Date(quote.valid_until) < new Date()}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Route to Procurement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Quote Comparison</CardTitle>
                <CardDescription>Compare quotes side by side</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Quote comparison view will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analytics</CardTitle>
                <CardDescription>Analyze quote trends and supplier performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Analytics dashboard will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};