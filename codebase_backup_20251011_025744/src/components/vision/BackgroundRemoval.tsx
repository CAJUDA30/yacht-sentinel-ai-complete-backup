import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Scissors, 
  Upload, 
  Download, 
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ProcessedImage {
  id: string;
  original: string;
  processed: string;
  timestamp: Date;
  processingTime: number;
}

export const BackgroundRemoval: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const loadImage = (file: Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
    const { pipeline, env } = await import('@huggingface/transformers');
    
    // Configure transformers.js
    env.allowLocalModels = false;
    env.useBrowserCache = false;

    const MAX_IMAGE_DIMENSION = 1024;

    const resizeImageIfNeeded = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) => {
      let width = image.naturalWidth;
      let height = image.naturalHeight;

      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);
        return true;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0);
      return false;
    };

    try {
      console.log('Starting background removal process...');
      const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
        device: 'webgpu',
      });
      
      // Convert HTMLImageElement to canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      // Resize image if needed and draw it to canvas
      const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
      console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
      
      // Get image data as base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Image converted to base64');
      
      // Process the image with the segmentation model
      console.log('Processing with segmentation model...');
      const result = await segmenter(imageData);
      
      console.log('Segmentation result:', result);
      
      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        throw new Error('Invalid segmentation result');
      }
      
      // Create a new canvas for the masked image
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext('2d');
      
      if (!outputCtx) throw new Error('Could not get output canvas context');
      
      // Draw original image
      outputCtx.drawImage(canvas, 0, 0);
      
      // Apply the mask
      const outputImageData = outputCtx.getImageData(
        0, 0,
        outputCanvas.width,
        outputCanvas.height
      );
      const data = outputImageData.data;
      
      // Apply inverted mask to alpha channel
      for (let i = 0; i < result[0].mask.data.length; i++) {
        // Invert the mask value (1 - value) to keep the subject instead of the background
        const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
        data[i * 4 + 3] = alpha;
      }
      
      outputCtx.putImageData(outputImageData, 0, 0);
      console.log('Mask applied successfully');
      
      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('Successfully created final blob');
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          1.0
        );
      });
    } catch (error) {
      console.error('Error removing background:', error);
      throw error;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setSelectedImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select an image to process",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    const startTime = Date.now();

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 5, 95));
    }, 200);

    try {
      // Convert data URL to blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      
      // Load image
      const imageElement = await loadImage(blob);
      
      // Process image
      const processedBlob = await removeBackground(imageElement);
      const processedUrl = URL.createObjectURL(processedBlob);
      
      const processingTime = Date.now() - startTime;
      
      const newProcessedImage: ProcessedImage = {
        id: `processed_${Date.now()}`,
        original: selectedImage,
        processed: processedUrl,
        timestamp: new Date(),
        processingTime
      };

      setProcessedImages(prev => [newProcessedImage, ...prev]);
      setProcessingProgress(100);

      toast({
        title: "Background Removed",
        description: `Processing completed in ${(processingTime / 1000).toFixed(1)}s`,
      });

    } catch (error) {
      console.error('Background removal error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to remove background",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setTimeout(() => setProcessingProgress(0), 1000);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Background Removal
            <Badge variant="outline">AI-Powered</Badge>
          </CardTitle>
          <CardDescription>
            Remove backgrounds from yacht images using advanced AI segmentation for professional results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-32 border-dashed border-2"
            >
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected for processing"
                  className="w-full h-64 object-contain border rounded-lg bg-gray-50"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing image with AI segmentation...</span>
              </div>
              <Progress value={processingProgress} />
            </div>
          )}

          {/* Process Button */}
          <Button
            onClick={processImage}
            disabled={isProcessing || !selectedImage}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Removing Background...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4 mr-2" />
                Remove Background
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Processed Images Gallery */}
      {processedImages.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Processed Images ({processedImages.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showComparison ? 'Hide' : 'Show'} Comparison
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {processedImages.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            Processed {image.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {(image.processingTime / 1000).toFixed(1)}s
                        </Badge>
                      </div>

                      <div className={`grid gap-4 ${showComparison ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {showComparison && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-center">Original</p>
                            <img
                              src={image.original}
                              alt="Original"
                              className="w-full h-48 object-contain border rounded-lg bg-gray-50"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-center">Background Removed</p>
                          <div className="relative">
                            <img
                              src={image.processed}
                              alt="Processed"
                              className="w-full h-48 object-contain border rounded-lg"
                              style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
                            />
                            {/* Transparency checker pattern */}
                            <div 
                              className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
                              style={{
                                backgroundImage: `
                                  linear-gradient(45deg, #ccc 25%, transparent 25%), 
                                  linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                                  linear-gradient(45deg, transparent 75%, #ccc 75%), 
                                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                                `,
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => downloadImage(image.processed, `yacht_no_bg_${image.id}.png`)}
                          className="flex-1"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download PNG
                        </Button>
                        {showComparison && (
                          <Button
                            variant="outline"
                            onClick={() => downloadImage(image.original, `yacht_original_${image.id}.jpg`)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download Original
                          </Button>
                        )}
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
        <Layers className="h-4 w-4" />
        <AlertDescription>
          <strong>Background Removal:</strong> Uses advanced AI segmentation to automatically detect and remove 
          backgrounds from yacht images. Perfect for creating professional product photos, documentation, 
          and presentations. Results are saved as PNG files with transparency.
        </AlertDescription>
      </Alert>
    </div>
  );
};
