import { useState, useEffect, FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Upload, 
  Brain, 
  Camera, 
  FileText, 
  Ship, 
  Users, 
  Shield, 
  X, 
  Info,
  CheckCircle,
  ArrowRight,
  Eye,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import SmartScanService, { SmartScanOnboardingData } from '@/services/SmartScanService';
import { unifiedAIService } from '@/services/UnifiedAIService';

interface SmartScanOnboardingBannerProps {
  onStartScan?: () => void;
  onSkip?: () => void;
  onLearnMore?: () => void;
  autoHide?: boolean;
  hideDuration?: number;
}

const SmartScanOnboardingBanner: FC<SmartScanOnboardingBannerProps> = ({
  onStartScan,
  onSkip,
  onLearnMore,
  autoHide = true,
  hideDuration = 5000
}) => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<SmartScanOnboardingData>({});
  const [smartScanService] = useState(() => new SmartScanService());
  const [timeLeft, setTimeLeft] = useState(hideDuration / 1000);
  const [isAIInitialized, setIsAIInitialized] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserPreferences();
      initializeAI();
    }
  }, [user?.id]);

  const initializeAI = async () => {
    if (user?.id && !isAIInitialized) {
      console.log('[SmartScanOnboardingBanner] UNIFIED: Initializing AI service');
      const success = await unifiedAIService.initialize('yacht_onboarding_banner', {
        enableLogging: false
      });
      if (success) {
        setIsAIInitialized(true);
        console.log('[SmartScanOnboardingBanner] UNIFIED: AI service ready');
      }
    }
  };

  useEffect(() => {
    if (isVisible && autoHide) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSkip();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVisible, autoHide]);

  const loadUserPreferences = async () => {
    if (!user?.id) return;
    
    try {
      const prefs = await smartScanService.getOnboardingPreferences(user.id);
      setPreferences(prefs);
      
      // Show banner if not dismissed and first scan not completed
      if (prefs.show_banner !== false && !prefs.first_scan_completed) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Default to showing banner for new users
      setIsVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<SmartScanOnboardingData>) => {
    if (!user?.id) return;
    
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    
    await smartScanService.updateOnboardingPreferences(user.id, newPrefs);
  };

  const handleStartScan = async () => {
    if (!isAIInitialized) {
      toast({
        title: "AI Service Initializing",
        description: "Please wait a moment for the AI service to be ready.",
        variant: "default"
      });
      return;
    }

    await updatePreferences({ show_banner: false });
    setIsVisible(false);
    onStartScan?.();
    
    toast({
      title: "Welcome to SmartScan!",
      description: "Let's get started with AI-powered document scanning."
    });
  };

  const handleSkip = async () => {
    await updatePreferences({ show_banner: false });
    setIsVisible(false);
    onSkip?.();
  };

  const handleLearnMore = () => {
    setShowDetails(!showDetails);
    onLearnMore?.();
  };

  const handleConsentChange = async (type: 'ai_processing' | 'data_usage', value: boolean) => {
    await updatePreferences({
      [type === 'ai_processing' ? 'ai_processing_consent' : 'data_usage_consent']: value
    });
  };

  if (isLoading || !isVisible) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right-5 duration-500">
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="absolute top-2 right-2 h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-3 pr-8">
              <div className="relative">
                <div className="p-2 bg-white/20 rounded-full">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Badge variant="secondary" className="text-xs px-1 py-0 bg-yellow-400 text-yellow-900">
                    NEW
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg">Welcome to Yachtie!</h3>
                <p className="text-blue-100 text-sm">AI-powered yacht management</p>
              </div>
            </div>
            
            {autoHide && timeLeft > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-100">
                <Clock className="h-3 w-3" />
                <span>Auto-closing in {timeLeft}s</span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="p-4 space-y-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-900">SmartScan AI</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Scan your yacht or crew documents to auto-fill your profile data using our AI SmartScan.
              </p>
            </div>

            {/* Quick Benefits */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <div className="p-2 bg-blue-100 rounded-full w-fit mx-auto">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">Instant<br />Processing</p>
              </div>
              <div className="space-y-1">
                <div className="p-2 bg-green-100 rounded-full w-fit mx-auto">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">98%<br />Accuracy</p>
              </div>
              <div className="space-y-1">
                <div className="p-2 bg-purple-100 rounded-full w-fit mx-auto">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600">GDPR<br />Compliant</p>
              </div>
            </div>

            {/* Document Types */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Supported Documents:</p>
              <div className="flex flex-wrap gap-1">
                {[
                  { icon: Ship, label: 'Yacht Docs', color: 'bg-blue-100 text-blue-700' },
                  { icon: Users, label: 'Crew Certs', color: 'bg-green-100 text-green-700' },
                  { icon: FileText, label: 'Certificates', color: 'bg-purple-100 text-purple-700' }
                ].map((type, index) => (
                  <Badge key={index} variant="outline" className={`text-xs ${type.color} border-current`}>
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Detailed Information */}
            {showDetails && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Privacy & Security:</strong> Your data is processed securely, 
                    not stored without consent, and deleted after use. Full GDPR/CCPA compliance 
                    with maritime regulations (IMO).
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">AI Processing Examples:</p>
                  <ul className="text-xs text-gray-600 space-y-1 ml-2">
                    <li>• Extract IMO/VIN numbers from yacht registration</li>
                    <li>• STCW certifications from crew documents</li>
                    <li>• Owner details from registration certificates</li>
                    <li>• Validity dates for compliance tracking</li>
                  </ul>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-consent"
                      checked={preferences.ai_processing_consent}
                      onCheckedChange={(checked) => 
                        handleConsentChange('ai_processing', checked as boolean)
                      }
                    />
                    <label htmlFor="ai-consent" className="text-xs text-gray-600">
                      I consent to AI processing of my yacht/crew documents
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="data-consent"
                      checked={preferences.data_usage_consent}
                      onCheckedChange={(checked) => 
                        handleConsentChange('data_usage', checked as boolean)
                      }
                    />
                    <label htmlFor="data-consent" className="text-xs text-gray-600">
                      I agree to data usage for profile auto-filling
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleStartScan}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={(!preferences.ai_processing_consent && showDetails) || !isAIInitialized}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isAIInitialized ? 'Start Scan Now' : 'Initializing AI...'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleLearnMore}
                  className="flex-1 text-xs"
                  size="sm"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {showDetails ? 'Less Info' : 'Learn More'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleSkip}
                  className="flex-1 text-xs"
                  size="sm"
                >
                  Skip for Now
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                You can always access SmartScan later from the document upload areas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartScanOnboardingBanner;