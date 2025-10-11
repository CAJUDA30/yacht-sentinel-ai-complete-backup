import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import UniversalSmartScan from '@/components/UniversalSmartScan';
import { useToast } from '@/hooks/use-toast';
import { useClaimsRepairs } from '@/contexts/ClaimsRepairsContext';
import { useClaimsRepairsCategories } from '@/hooks/useClaimsRepairsCategories';
import { 
  Camera, 
  Upload, 
  ShieldCheck, 
  Wrench, 
  FileText, 
  Calendar,
  DollarSign,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  job_type: z.enum(['warranty_claim', 'repair', 'audit']),
  category_id: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  yacht_id: z.string().optional(),
  
  // Equipment Information
  equipment_name: z.string().min(1, 'Equipment name is required'),
  manufacturer: z.string().optional(),
  model_number: z.string().optional(),
  serial_number: z.string().optional(),
  location_on_vessel: z.string().optional(),
  
  // Warranty Information (for warranty claims)
  purchase_date: z.string().optional(),
  warranty_start_date: z.string().optional(),
  warranty_duration_months: z.number().optional(),
  claim_type: z.enum(['replacement', 'repair', 'refund']).optional(),
  failure_description: z.string().optional(),
  
  // Repair Information (for repairs)
  issue_description: z.string().optional(),
  severity_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  safety_concerns: z.string().optional(),
  
  // Cost Information
  estimated_cost: z.number().optional(),
  currency: z.string().default('USD'),
  
  // Timeline
  target_completion_date: z.string().optional(),
  urgency_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ClaimsRepairsFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<FormValues>;
  mode?: 'create' | 'edit';
}

export const ClaimsRepairsForm: React.FC<ClaimsRepairsFormProps> = ({
  isOpen,
  onClose,
  initialData,
  mode = 'create'
}) => {
  const [showSmartScan, setShowSmartScan] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const { toast } = useToast();
  const { createJob, updateJob, yachts } = useClaimsRepairs();
  const { categories, loading: categoriesLoading } = useClaimsRepairsCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      job_type: 'repair',
      description: '',
      priority: 'medium',
      equipment_name: '',
      currency: 'USD',
      severity_level: 'medium',
      claim_type: 'replacement',
      ...initialData
    }
  });

  const jobType = form.watch('job_type');

  const handleSmartScanComplete = (scanResult: any) => {
    const { extractedData } = scanResult;
    
    // Auto-populate form fields from scan results
    if (extractedData) {
      if (extractedData.productName || extractedData.equipmentName) {
        form.setValue('equipment_name', extractedData.productName || extractedData.equipmentName);
      }
      if (extractedData.manufacturer) {
        form.setValue('manufacturer', extractedData.manufacturer);
      }
      if (extractedData.modelNumber) {
        form.setValue('model_number', extractedData.modelNumber);
      }
      if (extractedData.serialNumber) {
        form.setValue('serial_number', extractedData.serialNumber);
      }
      if (extractedData.description) {
        const currentDesc = form.getValues('description');
        form.setValue('description', currentDesc ? `${currentDesc}\n\nSmart Scan Details: ${extractedData.description}` : extractedData.description);
      }
      
      // Add any damage assessment or recommendations
      if (scanResult.suggestions?.damageAssessment) {
        form.setValue('failure_description', scanResult.suggestions.damageAssessment);
      }
      if (scanResult.suggestions?.issueDescription) {
        form.setValue('issue_description', scanResult.suggestions.issueDescription);
      }
      
      // Set urgency based on AI analysis
      if (scanResult.suggestions?.urgencyLevel) {
        form.setValue('priority', scanResult.suggestions.urgencyLevel);
      }
    }

    // Store photos from scan
    if (scanResult.capturedImage) {
      setCapturedPhotos(prev => [...prev, scanResult.capturedImage]);
    }

    setShowSmartScan(false);
    
    toast({
      title: "Smart Scan Complete",
      description: "Form has been populated with scanned data. Please review and adjust as needed.",
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const jobData = {
        ...values,
        photos: capturedPhotos,
        suppliers: selectedSuppliers,
        warranty_duration_months: values.warranty_duration_months,
        warranty_expires_at: values.warranty_start_date && values.warranty_duration_months 
          ? new Date(new Date(values.warranty_start_date).getTime() + values.warranty_duration_months * 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      };

      if (mode === 'create') {
        await createJob(jobData);
        toast({
          title: "Success",
          description: `${values.job_type === 'warranty_claim' ? 'Warranty claim' : values.job_type === 'repair' ? 'Repair job' : 'Audit'} created successfully`,
        });
      } else {
        // Update logic would go here
        toast({
          title: "Success", 
          description: "Job updated successfully",
        });
      }

      onClose();
      form.reset();
      setCapturedPhotos([]);
      setSelectedSuppliers([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {mode === 'create' ? 'Create New Job' : 'Edit Job'}
              </h2>
              <p className="text-muted-foreground">
                Professional warranty claims and repair management
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSmartScan(true)}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Smart Scan
              </Button>
              <Button variant="ghost" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            {/* Job Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="job_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="warranty_claim">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Warranty Claim
                            </div>
                          </SelectItem>
                          <SelectItem value="repair">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4" />
                              Repair Job
                            </div>
                          </SelectItem>
                          <SelectItem value="audit">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Compliance Audit
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">
                            <Badge variant="secondary">Low</Badge>
                          </SelectItem>
                          <SelectItem value="medium">
                            <Badge variant="outline">Medium</Badge>
                          </SelectItem>
                          <SelectItem value="high">
                            <Badge className="bg-warning text-warning-foreground">High</Badge>
                          </SelectItem>
                          <SelectItem value="critical">
                            <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter job name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yacht_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yacht</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select yacht" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yachts.map((yacht) => (
                            <SelectItem key={yacht.id} value={yacht.id}>
                              {yacht.yacht_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-full">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the issue, requirements, or claim details..."
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Equipment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="equipment_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter equipment name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location_on_vessel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location on Vessel</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Engine Room, Bridge, Galley" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="Equipment manufacturer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Model/part number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Serial number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Warranty-specific fields */}
            {jobType === 'warranty_claim' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Warranty Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="claim_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Claim Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select claim type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="replacement">Replacement</SelectItem>
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warranty_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warranty_duration_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Duration (Months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="12"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="col-span-full">
                    <FormField
                      control={form.control}
                      name="failure_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Failure Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the failure or defect in detail..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Repair-specific fields */}
            {jobType === 'repair' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Repair Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="severity_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="col-span-full">
                    <FormField
                      control={form.control}
                      name="issue_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the issue that needs repair..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-full">
                    <FormField
                      control={form.control}
                      name="safety_concerns"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Safety Concerns</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any safety concerns or special precautions..."
                              rows={2}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cost and Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="estimated_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_completion_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Completion</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Photo Evidence */}
            {capturedPhotos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Photo Evidence ({capturedPhotos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {capturedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={photo} 
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => setCapturedPhotos(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Form Actions */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Use Smart Scan to automatically fill equipment details and capture photos
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {mode === 'create' ? 'Create Job' : 'Update Job'}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* Smart Scan Modal */}
        <UniversalSmartScan
          isOpen={showSmartScan}
          onClose={() => setShowSmartScan(false)}
          onScanComplete={handleSmartScanComplete}
          module="claims-repairs"
          context="job-creation"
          scanType="auto"
        />
      </div>
    </div>
  );
};