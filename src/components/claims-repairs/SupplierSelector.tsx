import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Send, Phone, Mail, MessageSquare, Clock, CheckCircle } from 'lucide-react';

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  company: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  specialties: z.string().optional(),
  location: z.string().optional(),
  response_time_hours: z.number().optional(),
});

const messageSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  include_attachments: z.boolean().default(false),
  request_quote: z.boolean().default(true),
  deadline: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;
type MessageFormValues = z.infer<typeof messageSchema>;

interface Supplier {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  specialties?: string[];
  location?: string;
  response_time_hours?: number;
  last_contact?: string;
  success_rate?: number;
}

interface SupplierSelectorProps {
  jobId: string;
  jobTitle: string;
  selectedSuppliers: string[];
  onSuppliersChange: (supplierIds: string[]) => void;
  onMessageSent?: (supplierIds: string[], message: string) => void;
}

export const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  jobId,
  jobTitle,
  selectedSuppliers,
  onSuppliersChange,
  onMessageSent
}) => {
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();

  const supplierForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      specialties: '',
      location: '',
    }
  });

  const messageForm = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: `Quote Request: ${jobTitle}`,
      message: `Dear Supplier,

We are requesting a quote for the following job:

Job Title: ${jobTitle}

Please provide your best quote including:
- Labor costs
- Parts/materials costs
- Timeline for completion
- Warranty terms

Thank you for your prompt response.

Best regards,`,
      include_attachments: false,
      request_quote: true,
    }
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      
      // Fetch real suppliers from database
      const { data: suppliersData, error } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          company,
          email,
          phone,
          specialties,
          location,
          response_time_hours,
          success_rate,
          rating,
          verified,
          status
        `)
        .eq('status', 'active')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching suppliers:', error);
        toast({
          title: "Error",
          description: "Failed to load suppliers",
          variant: "destructive",
        });
        return;
      }

      // Transform database data to component format
      const transformedSuppliers: Supplier[] = (suppliersData || []).map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        company: supplier.company,
        email: supplier.email,
        phone: supplier.phone || '',
        specialties: supplier.specialties || [],
        location: supplier.location || '',
        response_time_hours: supplier.response_time_hours || 24,
        success_rate: supplier.success_rate || 95
      }));
      
      setAvailableSuppliers(transformedSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierToggle = (supplierId: string, checked: boolean) => {
    if (checked) {
      onSuppliersChange([...selectedSuppliers, supplierId]);
    } else {
      onSuppliersChange(selectedSuppliers.filter(id => id !== supplierId));
    }
  };

  const handleAddSupplier = async (values: SupplierFormValues) => {
    try {
      // In a real implementation, this would save to database
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        ...values,
        specialties: values.specialties ? values.specialties.split(',').map(s => s.trim()) : [],
      };

      setAvailableSuppliers(prev => [...prev, newSupplier]);
      supplierForm.reset();
      setShowAddSupplier(false);
      
      toast({
        title: "Success",
        description: "Supplier added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add supplier",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (values: MessageFormValues) => {
    if (selectedSuppliers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one supplier",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      // In a real implementation, this would call an edge function to send emails
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      onMessageSent?.(selectedSuppliers, values.message);
      
      toast({
        title: "Messages Sent",
        description: `Quote request sent to ${selectedSuppliers.length} supplier(s)`,
      });
      
      setShowMessageDialog(false);
      messageForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send messages",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const selectedSuppliersData = availableSuppliers.filter(s => selectedSuppliers.includes(s.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Supplier Selection</h3>
          <p className="text-sm text-muted-foreground">
            Select suppliers to request quotes from
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              <Form {...supplierForm}>
                <form onSubmit={supplierForm.handleSubmit(handleAddSupplier)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={supplierForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supplierForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Marine Solutions Ltd" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={supplierForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={supplierForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1-555-0123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={supplierForm.control}
                    name="specialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialties (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="Electronics, Navigation, Engines" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={supplierForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Fort Lauderdale, FL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddSupplier(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Supplier</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {selectedSuppliers.length > 0 && (
            <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send Quote Request ({selectedSuppliers.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Quote Request</DialogTitle>
                </DialogHeader>
                <Form {...messageForm}>
                  <form onSubmit={messageForm.handleSubmit(handleSendMessage)} className="space-y-4">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium mb-2">Sending to:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSuppliersData.map(supplier => (
                          <Badge key={supplier.id} variant="outline">
                            {supplier.name} ({supplier.company})
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={messageForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={messageForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea rows={8} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={messageForm.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Response Deadline</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowMessageDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={sendingMessage}>
                        {sendingMessage ? 'Sending...' : 'Send Quote Request'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Supplier List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading suppliers...</p>
          </div>
        ) : availableSuppliers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-muted-foreground">No suppliers available</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowAddSupplier(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Supplier
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          availableSuppliers.map((supplier) => (
            <Card key={supplier.id} className={`transition-colors ${selectedSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedSuppliers.includes(supplier.id)}
                      onCheckedChange={(checked) => handleSupplierToggle(supplier.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{supplier.name}</h4>
                        {supplier.company && (
                          <Badge variant="outline">{supplier.company}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                        {supplier.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>

                      {supplier.specialties && supplier.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {supplier.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {supplier.location && (
                          <span>📍 {supplier.location}</span>
                        )}
                        {supplier.response_time_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ~{supplier.response_time_hours}h response
                          </div>
                        )}
                        {supplier.success_rate && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {supplier.success_rate}% success rate
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedSuppliers.length > 0 && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary">
            {selectedSuppliers.length} supplier(s) selected for quote requests
          </p>
        </div>
      )}
    </div>
  );
};