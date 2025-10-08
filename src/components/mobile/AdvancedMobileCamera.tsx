import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Scan, CheckCircle, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SmartScanService from '@/services/SmartScanService';
import { supabase } from '@/integrations/supabase/client';

interface ScanResult {
  id: string;
  type: 'unified_document_scan';
  data: any;
  confidence: number;
  timestamp: Date;
  image?: string;
  location?: string;
}

const AdvancedMobileCamera: React.FC = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // UNIFIED SCANNING FUNCTION - Single approach only
  const performUnifiedScan = async (imageData: string): Promise<any> => {
    try {
      const smartScanService = new SmartScanService();
      
      const result = await smartScanService.scanDocument({
        imageData: imageData.split(',')[1] || imageData,
        documentType: 'auto_detect',
        context: {
          module: 'mobile_camera',
          hint: 'Mobile camera document scan'
        }
      });
      
      return {
        type: 'unified_document_scan',
        data: result.extracted_data,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Unified scan failed:', error);
      return {
        type: 'error',
        data: { error: error.message },
        confidence: 0
      };
    }
  };

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      
      setStream(mediaStream);
      setIsActive(true);
      
      toast({
        title: "Camera Active",
        description: "Unified document scanner ready",
      });
    } catch (error: any) {
      toast({
        title: "Camera Error",
        description: error.message || "Camera access failed",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    
    toast({
      title: "Camera Stopped",
      description: "Camera deactivated",
    });
  }, [stream, toast]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const performScan = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const imageData = await captureImage();
      if (!imageData) throw new Error('Failed to capture image');

      const scanResult = await performUnifiedScan(imageData);

      if (scanResult) {
        const result: ScanResult = {
          id: Date.now().toString(),
          type: 'unified_document_scan',
          data: scanResult.data,
          confidence: scanResult.confidence,
          timestamp: new Date(),
          image: imageData,
          location: 'Current position'
        };

        setScanResults(prev => [result, ...prev.slice(0, 9)]);
        
        toast({
          title: "Scan Complete",
          description: `Document processed with ${Math.round(scanResult.confidence * 100)}% confidence`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Unable to process image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureImage, toast]);

  const saveResult = async (result: ScanResult) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'unified_camera_scan',
        event_message: `Unified scan completed with ${Math.round(result.confidence * 100)}% confidence`,
        module: 'mobile-camera',
        severity: 'info',
        metadata: {
          scan_data: result.data,
          confidence: result.confidence,
          location: result.location
        }
      });

      toast({
        title: "Result Saved",
        description: "Scan result saved to analytics",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save scan result",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* UNIFIED Camera Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Unified Document Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {isActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Scan className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                      <p>Processing with Document AI...</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={performScan}
                    disabled={isAnalyzing}
                    size="lg"
                    className="rounded-full"
                  >
                    <Scan className="h-6 w-6" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4" />
                  <p>Unified Scanner</p>
                  <p className="text-sm">Document AI Processor 8708cd1d9cd87cc1</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={isActive ? stopCamera : startCamera}
              variant={isActive ? "destructive" : "default"}
              className="flex-1"
            >
              {isActive ? "Stop Camera" : "Start Camera"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Scans ({scanResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scanResults.map((result) => (
              <div key={result.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Unified Document Scan</Badge>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-muted-foreground">
                      {Math.round(result.confidence * 100)}% confidence
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveResult(result)}
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {result.timestamp.toLocaleTimeString()}
                </div>
                {result.data && (
                  <div className="text-xs font-mono bg-muted p-2 rounded">
                    {JSON.stringify(result.data, null, 2).substring(0, 200)}...
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedMobileCamera;