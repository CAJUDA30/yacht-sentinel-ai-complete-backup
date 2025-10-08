import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Clock, 
  Shield, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  AlertTriangle,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Award
} from 'lucide-react';

interface SupplierQuote {
  id: string;
  supplier_name: string;
  supplier_email?: string;
  supplier_phone?: string;
  supplier_company?: string;
  quote_reference?: string;
  quote_date: string;
  valid_until?: string;
  currency: string;
  labor_cost: number;
  parts_cost: number;
  travel_cost: number;
  other_costs: number;
  total_cost: number;
  estimated_duration_days?: number;
  warranty_offered_months?: number;
  payment_terms?: string;
  special_conditions?: string;
  attachments?: string[];
  status: 'pending' | 'received' | 'selected' | 'rejected';
  selected: boolean;
  response_time_hours?: number;
  created_at: string;
  updated_at: string;
}

interface QuoteAnalysis {
  best_value: string;
  fastest_delivery: string;
  longest_warranty: string;
  most_experienced: string;
  price_range: {
    min: number;
    max: number;
    average: number;
  };
  recommendations: {
    quote_id: string;
    reason: string;
    score: number;
  }[];
}

interface QuoteComparisonProps {
  jobId: string;
  jobTitle: string;
  quotes: SupplierQuote[];
  onQuoteSelected?: (quoteId: string) => void;
  onQuoteRejected?: (quoteId: string, reason: string) => void;
}

export const QuoteComparison: React.FC<QuoteComparisonProps> = ({
  jobId,
  jobTitle,
  quotes,
  onQuoteSelected,
  onQuoteRejected
}) => {
  const [analysis, setAnalysis] = useState<QuoteAnalysis | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (quotes.length > 0) {
      analyzeQuotes();
    }
  }, [quotes]);

  const analyzeQuotes = () => {
    if (quotes.length === 0) return;

    const costs = quotes.map(q => q.total_cost);
    const bestValue = quotes.reduce((best, current) => 
      current.total_cost < best.total_cost ? current : best
    );
    
    const fastestDelivery = quotes.reduce((fastest, current) => 
      (current.estimated_duration_days || 999) < (fastest.estimated_duration_days || 999) ? current : fastest
    );
    
    const longestWarranty = quotes.reduce((longest, current) => 
      (current.warranty_offered_months || 0) > (longest.warranty_offered_months || 0) ? current : longest
    );

    // Mock experience-based selection (in real app, this would use supplier history)
    const mostExperienced = quotes[0]; // Placeholder

    const priceRange = {
      min: Math.min(...costs),
      max: Math.max(...costs),
      average: costs.reduce((sum, cost) => sum + cost, 0) / costs.length
    };

    // Generate AI-like recommendations
    const recommendations = quotes.map(quote => {
      let score = 0;
      let reason = '';

      // Price scoring (40% weight)
      const priceScore = (priceRange.max - quote.total_cost) / (priceRange.max - priceRange.min) * 40;
      score += priceScore;

      // Speed scoring (30% weight)
      if (quote.estimated_duration_days) {
        const maxDays = Math.max(...quotes.map(q => q.estimated_duration_days || 0));
        const speedScore = (maxDays - quote.estimated_duration_days) / maxDays * 30;
        score += speedScore;
      }

      // Warranty scoring (20% weight)
      if (quote.warranty_offered_months) {
        const maxWarranty = Math.max(...quotes.map(q => q.warranty_offered_months || 0));
        const warrantyScore = (quote.warranty_offered_months / maxWarranty) * 20;
        score += warrantyScore;
      }

      // Response time scoring (10% weight)
      if (quote.response_time_hours) {
        const maxResponseTime = Math.max(...quotes.map(q => q.response_time_hours || 24));
        const responseScore = (maxResponseTime - quote.response_time_hours) / maxResponseTime * 10;
        score += responseScore;
      }

      // Generate reason based on strengths
      const strengths = [];
      if (quote.id === bestValue.id) strengths.push('Best price');
      if (quote.id === fastestDelivery.id) strengths.push('Fastest delivery');
      if (quote.id === longestWarranty.id) strengths.push('Best warranty');
      
      reason = strengths.length > 0 ? strengths.join(', ') : 'Balanced option';

      return { quote_id: quote.id, reason, score: Math.round(score) };
    }).sort((a, b) => b.score - a.score);

    setAnalysis({
      best_value: bestValue.id,
      fastest_delivery: fastestDelivery.id,
      longest_warranty: longestWarranty.id,
      most_experienced: mostExperienced.id,
      price_range: priceRange,
      recommendations
    });
  };

  const handleSelectQuote = async (quoteId: string) => {
    try {
      // Update database to mark quote as selected
      const { error } = await supabase
        .from('supplier_quotes')
        .update({ selected: true, status: 'selected' })
        .eq('id', quoteId);

      if (error) throw error;

      // Mark other quotes as not selected
      await supabase
        .from('supplier_quotes')
        .update({ selected: false })
        .eq('job_id', jobId)
        .neq('id', quoteId);

      setSelectedQuoteId(quoteId);
      onQuoteSelected?.(quoteId);

      toast({
        title: "Quote Selected",
        description: "The selected supplier has been notified.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select quote",
        variant: "destructive",
      });
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this quote",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('supplier_quotes')
        .update({ status: 'rejected' })
        .eq('id', quoteId);

      if (error) throw error;

      onQuoteRejected?.(quoteId, rejectionReason);
      setShowRejectDialog(null);
      setRejectionReason('');

      toast({
        title: "Quote Rejected",
        description: "The supplier has been notified of the rejection.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject quote",
        variant: "destructive",
      });
    }
  };

  const getQuoteHighlight = (quoteId: string) => {
    if (!analysis) return null;
    
    const highlights = [];
    if (analysis.best_value === quoteId) highlights.push('Best Price');
    if (analysis.fastest_delivery === quoteId) highlights.push('Fastest');
    if (analysis.longest_warranty === quoteId) highlights.push('Best Warranty');
    if (analysis.most_experienced === quoteId) highlights.push('Most Experienced');
    
    return highlights;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No quotes received yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quotes will appear here once suppliers respond
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quote Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-success" />
                <p className="text-sm font-medium">Price Range</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(analysis.price_range.min, quotes[0].currency)} - {formatCurrency(analysis.price_range.max, quotes[0].currency)}
                </p>
              </div>
              <div className="text-center p-3 bg-info/10 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-info" />
                <p className="text-sm font-medium">Avg Timeline</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(quotes.reduce((sum, q) => sum + (q.estimated_duration_days || 0), 0) / quotes.length)} days
                </p>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <Shield className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="text-sm font-medium">Max Warranty</p>
                <p className="text-xs text-muted-foreground">
                  {Math.max(...quotes.map(q => q.warranty_offered_months || 0))} months
                </p>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Total Quotes</p>
                <p className="text-xs text-muted-foreground">{quotes.length} received</p>
              </div>
            </div>

            {/* Top Recommendation */}
            {analysis.recommendations.length > 0 && (
              <Alert className="border-primary bg-primary/5">
                <Award className="h-4 w-4" />
                <AlertDescription>
                  <strong>AI Recommendation:</strong> {' '}
                  {quotes.find(q => q.id === analysis.recommendations[0].quote_id)?.supplier_name} - {' '}
                  {analysis.recommendations[0].reason} (Score: {analysis.recommendations[0].score}/100)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quote Cards */}
      <div className="grid gap-4">
        {quotes.map((quote) => {
          const highlights = getQuoteHighlight(quote.id);
          const recommendation = analysis?.recommendations.find(r => r.quote_id === quote.id);
          const isSelected = quote.selected || selectedQuoteId === quote.id;
          const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();

          return (
            <Card key={quote.id} className={`transition-all ${
              isSelected ? 'ring-2 ring-primary shadow-lg' : 
              isExpired ? 'opacity-60' : ''
            }`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {quote.supplier_name}
                      {quote.supplier_company && (
                        <Badge variant="outline">{quote.supplier_company}</Badge>
                      )}
                      {isSelected && (
                        <Badge className="bg-success text-success-foreground">
                          SELECTED
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {quote.supplier_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {quote.supplier_email}
                        </div>
                      )}
                      {quote.supplier_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {quote.supplier_phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(quote.total_cost, quote.currency)}
                    </div>
                    {recommendation && (
                      <Badge variant="secondary" className="mt-1">
                        Score: {recommendation.score}/100
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Highlights */}
                {highlights && highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {highlights.map((highlight, index) => (
                      <Badge key={index} className="bg-warning text-warning-foreground">
                        ⭐ {highlight}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Cost Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Labor</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(quote.labor_cost, quote.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Parts</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(quote.parts_cost, quote.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Travel</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(quote.travel_cost, quote.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Other</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(quote.other_costs, quote.currency)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-muted-foreground">
                        {quote.estimated_duration_days ? `${quote.estimated_duration_days} days` : 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Warranty</p>
                      <p className="text-muted-foreground">
                        {quote.warranty_offered_months ? `${quote.warranty_offered_months} months` : 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Valid Until</p>
                      <p className={`text-muted-foreground ${isExpired ? 'text-destructive font-medium' : ''}`}>
                        {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'No expiry'}
                        {isExpired && ' (EXPIRED)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Special Conditions */}
                {quote.special_conditions && (
                  <div>
                    <p className="font-medium text-sm mb-1">Special Conditions:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {quote.special_conditions}
                    </p>
                  </div>
                )}

                {/* Payment Terms */}
                {quote.payment_terms && (
                  <div>
                    <p className="font-medium text-sm mb-1">Payment Terms:</p>
                    <p className="text-sm text-muted-foreground">
                      {quote.payment_terms}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {!isSelected && quote.status !== 'rejected' && !isExpired && (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleSelectQuote(quote.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Select Quote
                    </Button>
                    <Dialog open={showRejectDialog === quote.id} onOpenChange={(open) => 
                      setShowRejectDialog(open ? quote.id : null)
                    }>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Quote</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Please provide a reason for rejecting this quote from {quote.supplier_name}:
                          </p>
                          <Textarea
                            placeholder="e.g., Price too high, timeline too long, terms not acceptable..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowRejectDialog(null)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleRejectQuote(quote.id)}
                            >
                              Reject Quote
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                )}

                {/* Status indicators */}
                {quote.status === 'rejected' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>This quote has been rejected.</AlertDescription>
                  </Alert>
                )}

                {isExpired && !isSelected && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>This quote has expired. Contact the supplier for an updated quote.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};