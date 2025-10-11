import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Scan, Upload, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedMobileCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  module: string;
}

interface CameraCapability {
  available: boolean;
  permission: 'unknown' | 'granted' | 'denied' | 'prompt';
  error?: string;
}

const EnhancedMobileCamera: React.FC<EnhancedMobileCameraProps> = ({
  isOpen,
  onClose,
  onCapture,
  module
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraCapability, setCameraCapability] = useState<CameraCapability>({
    available: false,
    permission: 'unknown'
  });
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const [retryCount, setRetryCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  // Detect device capabilities on mount
  useEffect(() => {
    if (isOpen) {
      detectDeviceCapabilities();
    }
  }, [isOpen]);

  const detectDeviceCapabilities = useCallback(async () => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSecureContext = window.isSecureContext || location.hostname === 'localhost';
    
    const deviceDetails = {
      userAgent,
      isIOS,
      isAndroid,
      isMobile,
      isSecureContext,
      hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
      hasEnumerateDevices: !!navigator.mediaDevices?.enumerateDevices,
      timestamp: new Date().toISOString()
    };
    
    setDeviceInfo(deviceDetails);
    
    // Check basic camera availability
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraCapability({
        available: false,
        permission: 'denied',
        error: 'Camera API not supported in this browser'
      });
      return;
    }
    
    if (!isSecureContext) {
      setCameraCapability({
        available: false,
        permission: 'denied',
        error: 'HTTPS required for camera access'
      });
      return;
    }
    
    // Check camera permissions
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraCapability({
        available: true,
        permission: result.state as any
      });
      
      // Listen for permission changes
      result.onchange = () => {
        setCameraCapability(prev => ({
          ...prev,
          permission: result.state as any
        }));
      };
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      setCameraCapability({
        available: true,
        permission: 'unknown'
      });
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsScanning(true);
    
    try {
      // Progressive constraint sets for maximum compatibility
      const constraintsSets = [
        // High quality rear camera
        {
          video: {
            facingMode: { exact: 'environment' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 30, min: 15 }
          }
        },
        // Medium quality rear camera
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        // Front camera fallback
        {
          video: {
            facingMode: 'user',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        // Basic video - last resort
        { video: true }
      ];

      let stream: MediaStream | null = null;
      let lastError: Error | null = null;
      let usedConstraints = null;

      // Try each constraint set
      for (let i = 0; i < constraintsSets.length; i++) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraintsSets[i]);
          usedConstraints = constraintsSets[i];
          break;
        } catch (err) {
          lastError = err as Error;
          console.log(`Camera constraint set ${i + 1} failed:`, err);
        }
      }

      if (!stream) {
        throw lastError || new Error('All camera configurations failed');
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // iOS-specific optimizations
        if (deviceInfo.isIOS) {
          videoRef.current.setAttribute('playsInline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          videoRef.current.muted = true;
        }
        
        // Wait for video metadata and play with timeout
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            const video = videoRef.current!;
            
            video.onloadedmetadata = async () => {
              try {
                await video.play();
                setIsScanning(true);
                setRetryCount(0);
                
                // Log successful camera start
                console.log('Camera started successfully:', {
                  constraints: usedConstraints,
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  deviceInfo
                });
                
                toast({
                  title: "Camera Ready",
                  description: `${video.videoWidth}x${video.videoHeight} - Point at item to scan`,
                });
                
                resolve();
              } catch (playError) {
                reject(new Error(`Video play failed: ${playError.message}`));
              }
            };
            
            video.onerror = (e) => reject(new Error('Video stream error'));
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Camera timed out - please try again or use file upload'));
            }, 8000);
          })
        ]);
      }
    } catch (error: any) {
      console.error('Camera start error:', error);
      
      const errorMessages = {
        'NotAllowedError': 'Camera permission denied. Please allow camera access and try again.',
        'NotFoundError': 'No camera found. Please connect a camera or use file upload.',
        'NotSupportedError': 'Camera not supported. Please use file upload instead.',
        'NotReadableError': 'Camera in use by another app. Please close other apps.',
        'OverconstrainedError': 'Camera settings not supported. Trying simpler settings...',
        'SecurityError': 'Security error. Please ensure HTTPS connection.',
        'AbortError': 'Camera access aborted. Please try again.'
      };
      
      const message = errorMessages[error.name as keyof typeof errorMessages] || 
                     `Camera error: ${error.message}`;
      
      setCameraCapability(prev => ({
        ...prev,
        error: message
      }));
      
      toast({
        title: "Camera Error",
        description: message,
        variant: "destructive",
      });
      
      // Auto-retry for certain errors
      if (retryCount < 2 && ['NotReadableError', 'AbortError'].includes(error.name)) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          startCamera();
        }, 1000);
      }
    }
  }, [deviceInfo, retryCount, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.label);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to high-quality JPEG
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Log capture details
    console.log('Image captured:', {
      width: canvas.width,
      height: canvas.height,
      dataSize: imageData.length,
      module,
      timestamp: new Date().toISOString()
    });
    
    stopCamera();
    onCapture(imageData);
    
    toast({
      title: "Image Captured",
      description: `${canvas.width}x${canvas.height} image ready for AI analysis`,
    });
  }, [module, onCapture, stopCamera, toast]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      onCapture(imageData);
      
      toast({
        title: "Image Uploaded",
        description: "Image ready for AI analysis",
      });
    };
    reader.readAsDataURL(file);
  }, [onCapture, toast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Enterprise Scanner</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Device Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Device Status</span>
              <Badge variant={cameraCapability.available ? "default" : "destructive"}>
                {cameraCapability.available ? "Compatible" : "Limited"}
              </Badge>
            </div>
            
            {cameraCapability.error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{cameraCapability.error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Hidden video element - always rendered to prevent race conditions */}
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            autoPlay
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera View */}
          {isScanning ? (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />
              
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary w-64 h-40 rounded-lg">
                  <div className="w-full h-full border-2 border-dashed border-primary/50 rounded-lg" />
                </div>
              </div>
              
              {/* Controls overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button onClick={captureImage} size="lg" className="bg-primary text-white">
                  <Scan className="w-5 h-5 mr-2" />
                  Capture
                </Button>
                <Button onClick={stopCamera} variant="secondary" size="lg">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Button */}
              <Button
                onClick={startCamera}
                disabled={!cameraCapability.available}
                className="w-full h-12"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                {retryCount > 0 ? `Retry Camera (${retryCount}/2)` : 'Start Camera'}
              </Button>
              
              {/* File Upload Fallback */}
              <div className="relative">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full h-12"
                  size="lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {/* Retry Button */}
              {cameraCapability.error && retryCount < 2 && (
                <Button
                  onClick={() => {
                    setRetryCount(prev => prev + 1);
                    setCameraCapability(prev => ({ ...prev, error: undefined }));
                    detectDeviceCapabilities();
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Camera Detection
                </Button>
              )}
            </div>
          )}
          
          {/* Device Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Device:</span>
              <span>{deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Desktop'}</span>
            </div>
            <div className="flex justify-between">
              <span>Secure Context:</span>
              <span className={deviceInfo.isSecureContext ? 'text-green-600' : 'text-red-600'}>
                {deviceInfo.isSecureContext ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Permission:</span>
              <span className={
                cameraCapability.permission === 'granted' ? 'text-green-600' : 
                cameraCapability.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
              }>
                {cameraCapability.permission}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedMobileCamera;