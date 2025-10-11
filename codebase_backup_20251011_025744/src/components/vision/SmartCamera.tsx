import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  Square, 
  RotateCcw,
  Zap,
  Eye,
  FileText,
  Save,
  Settings,
  ScanLine,
  Target,
  Download,
  Trash2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CapturedImage {
  id: string;
  url: string;
  timestamp: Date;
  analysis?: string;
  ocrText?: string;
  detectedObjects?: Array<{ name: string; confidence: number }>;
}

interface CameraConstraints {
  facingMode: 'user' | 'environment';
  width?: { ideal: number };
  height?: { ideal: number };
}

export const SmartCamera: React.FC = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsActive(true);
        
        toast({
          title: "Camera Started",
          description: `Using ${facingMode} camera`,
        });
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
    
    toast({
      title: "Camera Stopped",
      description: "Camera has been turned off",
    });
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const newImage: CapturedImage = {
      id: `capture_${Date.now()}`,
      url: imageDataUrl,
      timestamp: new Date()
    };

    setCapturedImages(prev => [newImage, ...prev]);

    toast({
      title: "Image Captured",
      description: "Photo saved successfully",
    });
  };

  const analyzeImage = async (imageId: string) => {
    const image = capturedImages.find(img => img.id === imageId);
    if (!image) return;

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('vision-analyzer', {
        body: {
          image: image.url,
          analysisType: 'yacht-specific',
          prompt: 'Analyze this yacht-related image for equipment, safety, and maintenance insights.',
          includeOCR: true,
          includeObjectDetection: true
        }
      });

      if (error) throw error;

      // Update the captured image with analysis results
      setCapturedImages(prev => prev.map(img => 
        img.id === imageId ? {
          ...img,
          analysis: data.analysis || data.description,
          ocrText: data.ocrText,
          detectedObjects: data.objects
        } : img
      ));

      toast({
        title: "Analysis Complete",
        description: "Image analyzed with AI vision",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.click();
    
    toast({
      title: "Image Downloaded",
      description: `Saved as ${filename}`,
    });
  };

  const deleteImage = (imageId: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
    toast({
      title: "Image Deleted",
      description: "Image removed from gallery",
    });
  };

  useEffect(() => {
    return () => {
      // Cleanup camera on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" />
            Smart Camera
            <Badge variant="outline">AI-Enhanced</Badge>
          </CardTitle>
          <CardDescription>
            Capture yacht images with real-time AI analysis and instant OCR processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Controls */}
          <div className="flex gap-2">
            {!isActive ? (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button onClick={captureImage} variant="default" className="flex-1">
                  <Square className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button onClick={switchCamera} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Camera Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full aspect-video object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {isActive && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Viewfinder overlay */}
                <div className="absolute inset-4 border-2 border-white/30 rounded-lg"></div>
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <Badge className="bg-black/50 text-white">
                    <Target className="h-3 w-3 mr-1" />
                    {facingMode === 'environment' ? 'Rear' : 'Front'}
                  </Badge>
                  <Badge className="bg-black/50 text-white">
                    <ScanLine className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                </div>
              </div>
            )}

            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white/60">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                  <p>Camera Preview</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Captured Images Gallery */}
      {capturedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Captured Images ({capturedImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capturedImages.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-3 rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt="Captured"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {image.timestamp.toLocaleTimeString()}
                        </Badge>
                        {image.analysis && (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            <Eye className="h-2 w-2 mr-1" />
                            Analyzed
                          </Badge>
                        )}
                      </div>

                      {image.analysis && (
                        <Tabs defaultValue="analysis" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="analysis" className="text-xs">AI</TabsTrigger>
                            <TabsTrigger value="ocr" className="text-xs" disabled={!image.ocrText}>OCR</TabsTrigger>
                            <TabsTrigger value="objects" className="text-xs" disabled={!image.detectedObjects?.length}>Objects</TabsTrigger>
                          </TabsList>

                          <TabsContent value="analysis" className="mt-2">
                            <div className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded text-muted-foreground">
                              {image.analysis?.substring(0, 100)}...
                            </div>
                          </TabsContent>

                          {image.ocrText && (
                            <TabsContent value="ocr" className="mt-2">
                              <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                {image.ocrText.substring(0, 100)}...
                              </div>
                            </TabsContent>
                          )}

                          {image.detectedObjects && (
                            <TabsContent value="objects" className="mt-2">
                              <div className="space-y-1">
                                {image.detectedObjects.slice(0, 3).map((obj, index) => (
                                  <div key={index} className="flex justify-between text-xs">
                                    <span>{obj.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {Math.round(obj.confidence * 100)}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          )}
                        </Tabs>
                      )}

                      <div className="flex gap-2">
                        {!image.analysis ? (
                          <Button
                            size="sm"
                            onClick={() => analyzeImage(image.id)}
                            disabled={isAnalyzing}
                            className="flex-1"
                          >
                            {isAnalyzing ? (
                              <Zap className="h-3 w-3 animate-pulse" />
                            ) : (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Analyze
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadImage(image.url, `yacht_capture_${image.id}.jpg`)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteImage(image.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Information */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Smart Camera Features:</strong> Capture high-quality yacht images with instant AI analysis. 
          Switch between front and rear cameras, get real-time OCR text detection, object recognition, 
          and yacht-specific equipment analysis. Perfect for inspections and documentation.
        </AlertDescription>
      </Alert>
    </div>
  );
};