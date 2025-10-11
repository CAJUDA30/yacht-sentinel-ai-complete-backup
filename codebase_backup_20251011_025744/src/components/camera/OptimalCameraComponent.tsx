/**
 * Optimal Camera Component for Yacht Sentinel AI
 * Standardized camera implementation with enhanced features for cross-app usage
 * 
 * Features:
 * - Progressive constraint fallback for maximum device compatibility
 * - Enhanced error handling with user-friendly messages
 * - AI guidance capabilities (edge detection, glare detection, focus assist)
 * - Resource management and cleanup
 * - Security context validation
 * - Permission management
 * - Device enumeration
 * - Image capture and processing
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Square, 
  Circle, 
  Zap, 
  Eye, 
  Focus, 
  Sun, 
  Volume2, 
  VolumeX,
  CheckCircle, 
  AlertTriangle, 
  X, 
  RotateCcw,
  Settings,
  Target,
  Crosshair,
  Maximize,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOptimalCamera, optimalCameraService } from '@/services/OptimalCameraService';
import { CameraAnalysisData } from '@/services/OptimalCameraService';

interface OptimalCameraProps {
  onCapture?: (imageData: string | Blob, analysisData?: CameraAnalysisData) => void;
  onClose?: () => void;
  documentType?: string;
  showGuidance?: boolean;
  autoCapture?: boolean;
  enableAIAnalysis?: boolean;
  className?: string;
  constraints?: Partial<{
    facingMode?: 'user' | 'environment' | { ideal: string };
    width?: { ideal: number; min?: number; max?: number };
    height?: { ideal: number; min?: number; max?: number };
    frameRate?: { ideal: number; min?: number; max?: number };
    aspectRatio?: { ideal: number };
  }>;
}

const OptimalCameraComponent: React.FC<OptimalCameraProps> = ({
  onCapture,
  onClose,
  documentType = 'document',
  showGuidance = true,
  autoCapture = false,
  enableAIAnalysis = true,
  className = '',
  constraints
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    isActive,
    isLoading,
    error,
    capabilities,
    stream,
    analysis,
    startCamera,
    stopCamera,
    captureImage,
    setupVideoElement
  } = useOptimalCamera({
    componentId: 'optimal-camera-component',
    constraints,
    autoStart: autoCapture,
    enableAIAnalysis
  });

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Setup video element when stream is available
  useEffect(() => {
    if (isActive && stream && videoRef.current) {
      setupVideoElement(videoRef.current)
        .catch(err => {
          toast({
            title: "Video Setup Error",
            description: err.message,
            variant: "destructive"
          });
        });
    }
  }, [isActive, stream, setupVideoElement, toast]);

  // Handle auto-capture logic
  useEffect(() => {
    if (autoCapture && analysis && shouldAutoCapture(analysis)) {
      if (captureCountdown === 0) {
        startCaptureCountdown();
      }
    } else {
      setCaptureCountdown(0);
    }
  }, [autoCapture, analysis, captureCountdown]);

  const startCaptureCountdown = () => {
    setCaptureCountdown(3);
    const countdownInterval = setInterval(() => {
      setCaptureCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const shouldAutoCapture = (analysisData: CameraAnalysisData): boolean => {
    // Auto-capture when document is detected with good quality
    return analysisData.documentDetection.detected && 
           analysisData.documentDetection.confidence > 0.8 &&
           analysisData.lighting.quality !== 'poor' &&
           analysisData.focusAnalysis.inFocus;
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    setIsCapturing(true);
    
    try {
      const imageData = captureImage(videoRef.current, { 
        quality: 0.9, 
        format: 'image/jpeg',
        maxWidth: 1920,
        maxHeight: 1080
      });
      
      if (imageData) {
        onCapture?.(imageData, analysis || undefined);
        
        toast({
          title: "Photo Captured",
          description: "Image captured successfully"
        });
      } else {
        throw new Error('Failed to capture image');
      }
    } catch (err: any) {
      toast({
        title: "Capture Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const getAnalysisBadge = (type: 'edge' | 'glare' | 'focus' | 'lighting') => {
    if (!analysis) return null;
    
    switch (type) {
      case 'edge':
        return (
          <Badge variant={analysis.edgeDetection.detected ? "default" : "destructive"}>
            {analysis.edgeDetection.detected ? "Edges Detected" : "No Edges"}
          </Badge>
        );
      case 'glare':
        const glareSeverity = analysis.glareDetection.severity;
        const glareVariant = glareSeverity === 'high' ? "destructive" : 
                            glareSeverity === 'medium' ? "secondary" : 
                            glareSeverity === 'low' ? "outline" : "default";
        return (
          <Badge variant={glareVariant}>
            {glareSeverity === 'none' ? "No Glare" : `${glareSeverity} Glare`}
          </Badge>
        );
      case 'focus':
        return (
          <Badge variant={analysis.focusAnalysis.inFocus ? "default" : "destructive"}>
            {analysis.focusAnalysis.inFocus ? "In Focus" : "Out of Focus"}
          </Badge>
        );
      case 'lighting':
        const lightingQuality = analysis.lighting.quality;
        const lightingVariant = lightingQuality === 'excellent' ? "default" : 
                               lightingQuality === 'good' ? "secondary" : 
                               lightingQuality === 'fair' ? "outline" : "destructive";
        return (
          <Badge variant={lightingVariant}>
            {lightingQuality} Lighting
          </Badge>
        );
      default:
        return null;
    }
  };

  const getGuidanceMessage = () => {
    if (!analysis) return "Position your document in the frame";
    
    // Priority: Focus > Lighting > Glare > Edges
    if (!analysis.focusAnalysis.inFocus) {
      return analysis.focusAnalysis.recommendation;
    }
    
    if (analysis.lighting.quality === 'poor') {
      return analysis.lighting.recommendation;
    }
    
    if (analysis.glareDetection.severity === 'high') {
      return "Reduce glare by adjusting lighting angle";
    }
    
    if (!analysis.documentDetection.detected) {
      return "Position document fully in frame";
    }
    
    return "Document detected - ready to capture";
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            SmartScan Camera
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Camera View */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {!isActive && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2" />
                <p>Camera not active</p>
                <Button 
                  onClick={startCamera} 
                  className="mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Starting..." : "Start Camera"}
                </Button>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                <p>Starting camera...</p>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isActive ? 'hidden' : ''}`}
          />
          
          {/* AI Guidance Overlay */}
          {showGuidance && analysis && isActive && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Document detection corners */}
              {analysis.documentDetection.detected && analysis.documentDetection.boundingBox && (
                <>
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white"></div>
                </>
              )}
              
              {/* Focus indicator */}
              {!analysis.focusAnalysis.inFocus && (
                <div className="absolute top-4 left-4">
                  <Focus className="h-6 w-6 text-yellow-400" />
                </div>
              )}
              
              {/* Glare indicator */}
              {analysis.glareDetection.severity !== 'none' && (
                <div className="absolute top-4 right-4">
                  <Sun className="h-6 w-6 text-orange-400" />
                </div>
              )}
            </div>
          )}
          
          {/* Capture countdown overlay */}
          {captureCountdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-white text-6xl font-bold animate-pulse">
                {captureCountdown}
              </div>
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* AI Analysis Badges */}
        {showGuidance && analysis && (
          <div className="flex flex-wrap gap-2">
            {getAnalysisBadge('edge')}
            {getAnalysisBadge('glare')}
            {getAnalysisBadge('focus')}
            {getAnalysisBadge('lighting')}
          </div>
        )}
        
        {/* Guidance Message */}
        {showGuidance && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{getGuidanceMessage()}</AlertDescription>
          </Alert>
        )}
        
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {!isActive ? (
            <Button 
              onClick={startCamera} 
              disabled={isLoading}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isLoading ? "Starting..." : "Start Camera"}
            </Button>
          ) : (
            <>
              <Button 
                onClick={capturePhoto} 
                disabled={isCapturing || isLoading}
                className="flex-1"
              >
                {isCapturing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Capture Photo
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={stopCamera}
                disabled={isLoading}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
        
        {/* Hidden canvas for analysis */}
        <canvas 
          ref={analysisCanvasRef} 
          className="hidden" 
          width="640" 
          height="480" 
        />
      </CardContent>
    </Card>
  );
};

export default OptimalCameraComponent;