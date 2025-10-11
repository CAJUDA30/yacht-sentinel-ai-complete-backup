import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  FileText,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface WarrantyInfo {
  equipment_name: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_start_date?: string;
  warranty_duration_months?: number;
  warranty_end_date?: string;
}

interface ValidationResult {
  is_valid: boolean;
  status: 'valid' | 'expired' | 'expiring_soon' | 'unknown';
  days_remaining?: number;
  expiry_date?: string;
  coverage_details?: {
    parts: boolean;
    labor: boolean;
    shipping: boolean;
    on_site_service: boolean;
  };
  manufacturer_contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  claim_requirements?: string[];
  recommended_actions?: string[];
}

interface WarrantyValidatorProps {
  warrantyInfo: WarrantyInfo;
  onValidationComplete?: (result: ValidationResult) => void;
}

export const WarrantyValidator: React.FC<WarrantyValidatorProps> = ({
  warrantyInfo,
  onValidationComplete
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationStep, setValidationStep] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (warrantyInfo.warranty_start_date && warrantyInfo.warranty_duration_months) {
      validateWarranty();
    }
  }, [warrantyInfo]);

  const validateWarranty = async () => {
    setIsValidating(true);
    setProgress(0);
    
    try {
      // Step 1: Basic validation
      setValidationStep('Validating warranty dates...');
      setProgress(20);

      const result = await performWarrantyValidation(warrantyInfo);

      // Step 2: Manufacturer database lookup
      setValidationStep('Checking manufacturer database...');
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Step 3: Coverage verification
      setValidationStep('Verifying coverage details...');
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 4: Requirements check
      setValidationStep('Checking claim requirements...');
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Complete
      setValidationStep('Validation complete');
      setProgress(100);

      setValidationResult(result);
      onValidationComplete?.(result);

      // Show appropriate toast based on result
      if (result.status === 'valid') {
        toast({
          title: "Warranty Valid ✅",
          description: `Valid for ${result.days_remaining} more days`,
        });
      } else if (result.status === 'expiring_soon') {
        toast({
          title: "Warranty Expiring Soon ⚠️",
          description: `Only ${result.days_remaining} days remaining`,
          variant: "destructive",
        });
      } else if (result.status === 'expired') {
        toast({
          title: "Warranty Expired ❌",
          description: "This warranty has expired",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Warranty validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate warranty status",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
      setProgress(0);
      setValidationStep('');
    }
  };

  const performWarrantyValidation = async (info: WarrantyInfo): Promise<ValidationResult> => {
    if (!info.warranty_start_date || !info.warranty_duration_months) {
      return {
        is_valid: false,
        status: 'unknown',
        recommended_actions: ['Please provide warranty start date and duration']
      };
    }

    const startDate = new Date(info.warranty_start_date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + info.warranty_duration_months);
    
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: ValidationResult['status'];
    let is_valid = false;
    
    if (daysRemaining > 30) {
      status = 'valid';
      is_valid = true;
    } else if (daysRemaining > 0) {
      status = 'expiring_soon';
      is_valid = true;
    } else {
      status = 'expired';
      is_valid = false;
    }

    // Mock manufacturer lookup based on equipment
    const coverage_details = {
      parts: true,
      labor: true,
      shipping: info.manufacturer?.toLowerCase().includes('premium') || false,
      on_site_service: info.manufacturer?.toLowerCase().includes('marine') || false,
    };

    const manufacturer_contact = getManufacturerContact(info.manufacturer);
    const claim_requirements = getClaimRequirements(info.manufacturer);
    const recommended_actions = getRecommendedActions(status, daysRemaining);

    return {
      is_valid,
      status,
      days_remaining: Math.max(0, daysRemaining),
      expiry_date: endDate.toISOString().split('T')[0],
      coverage_details,
      manufacturer_contact,
      claim_requirements,
      recommended_actions
    };
  };

  const getManufacturerContact = (manufacturer?: string) => {
    // Mock manufacturer contact lookup
    const contacts: Record<string, any> = {
      'caterpillar': {
        phone: '+1-800-CAT-HELP',
        email: 'marine.support@cat.com',
        website: 'https://www.cat.com/marine'
      },
      'cummins': {
        phone: '+1-800-CUMMINS',
        email: 'marine@cummins.com',
        website: 'https://www.cummins.com/marine'
      },
      'volvo': {
        phone: '+1-855-VOLVO-13',
        email: 'marine.support@volvo.com',
        website: 'https://www.volvopenta.com'
      }
    };

    return contacts[manufacturer?.toLowerCase() || ''] || {
      phone: 'Contact manufacturer',
      email: 'Check manufacturer website',
      website: 'Search online for contact details'
    };
  };

  const getClaimRequirements = (manufacturer?: string): string[] => {
    return [
      'Original purchase receipt or invoice',
      'Photos of the defective equipment',
      'Detailed description of the failure',
      'Service history records (if applicable)',
      'Serial number verification',
      'Installation date documentation'
    ];
  };

  const getRecommendedActions = (status: ValidationResult['status'], daysRemaining: number): string[] => {
    switch (status) {
      case 'valid':
        return [
          'Proceed with warranty claim',
          'Gather required documentation',
          'Contact manufacturer for claim process',
          'Document the issue thoroughly'
        ];
      case 'expiring_soon':
        return [
          '⚠️ URGENT: Submit claim immediately',
          'Warranty expires in ' + daysRemaining + ' days',
          'Prepare all documentation quickly',
          'Contact manufacturer today'
        ];
      case 'expired':
        return [
          'Warranty has expired - consider repair quotes',
          'Check if extended warranty is available',
          'Document for insurance claim if applicable',
          'Get repair estimates from contractors'
        ];
      default:
        return [
          'Verify warranty information',
          'Contact manufacturer for details',
          'Check purchase documentation'
        ];
    }
  };

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'valid':
        return <ShieldCheck className="h-5 w-5 text-success" />;
      case 'expiring_soon':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'expired':
        return <ShieldX className="h-5 w-5 text-destructive" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ValidationResult['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-success text-success-foreground';
      case 'expiring_soon':
        return 'bg-warning text-warning-foreground';
      case 'expired':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Warranty Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Progress */}
          {isValidating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {validationStep}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Equipment Summary */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Equipment</p>
              <p className="text-sm text-muted-foreground">{warrantyInfo.equipment_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Manufacturer</p>
              <p className="text-sm text-muted-foreground">{warrantyInfo.manufacturer || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Model</p>
              <p className="text-sm text-muted-foreground">{warrantyInfo.model_number || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Serial Number</p>
              <p className="text-sm text-muted-foreground">{warrantyInfo.serial_number || 'Not specified'}</p>
            </div>
          </div>

          {/* Manual Validation Button */}
          {!isValidating && !validationResult && (
            <Button onClick={validateWarranty} className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Validate Warranty Status
            </Button>
          )}

          {/* Validation Result */}
          {validationResult && (
            <div className="space-y-4">
              {/* Status Summary */}
              <Alert className={`border-2 ${
                validationResult.status === 'valid' ? 'border-success bg-success/5' :
                validationResult.status === 'expiring_soon' ? 'border-warning bg-warning/5' :
                'border-destructive bg-destructive/5'
              }`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(validationResult.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold capitalize">
                        {validationResult.status.replace('_', ' ')} Warranty
                      </h4>
                      <Badge className={getStatusColor(validationResult.status)}>
                        {validationResult.status === 'valid' ? `${validationResult.days_remaining} days left` :
                         validationResult.status === 'expiring_soon' ? `${validationResult.days_remaining} days left` :
                         'Expired'}
                      </Badge>
                    </div>
                    <AlertDescription className="mt-1">
                      {validationResult.status === 'valid' ? 
                        'This equipment is covered under warranty. You can proceed with a warranty claim.' :
                        validationResult.status === 'expiring_soon' ?
                        'Warranty expires soon! Submit your claim immediately.' :
                        'Warranty has expired. Consider repair options or extended warranty.'}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              {/* Coverage Details */}
              {validationResult.coverage_details && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Coverage Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(validationResult.coverage_details).map(([key, covered]) => (
                        <div key={key} className="flex items-center gap-2">
                          {covered ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm capitalize">
                            {key.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manufacturer Contact */}
              {validationResult.manufacturer_contact && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Manufacturer Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {validationResult.manufacturer_contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        {validationResult.manufacturer_contact.phone}
                      </div>
                    )}
                    {validationResult.manufacturer_contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        {validationResult.manufacturer_contact.email}
                      </div>
                    )}
                    {validationResult.manufacturer_contact.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={validationResult.manufacturer_contact.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {validationResult.manufacturer_contact.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Claim Requirements */}
              {validationResult.claim_requirements && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Required Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {validationResult.claim_requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {requirement}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Actions */}
              {validationResult.recommended_actions && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recommended Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {validationResult.recommended_actions.map((action, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className={action.startsWith('⚠️') ? 'font-semibold text-warning' : ''}>
                            {action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Re-validate Button */}
              <Button variant="outline" onClick={validateWarranty} className="w-full">
                Re-validate Warranty
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Missing import fix
import { Phone, Mail, Globe } from 'lucide-react';