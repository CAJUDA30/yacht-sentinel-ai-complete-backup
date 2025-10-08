/**
 * UNIFIED SmartScanUploader - Single Source of Truth Component
 * Uses only SmartScanService with processor 4ab65e484eb85038
 * Edge Function: gcp-unified-config
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Camera, 
  Scan,
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Brain,
  Sparkles,
  Loader2,
  Eye,
  Download,
  RotateCcw,
  Image as ImageIcon,
  Zap,
  Ship,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import SmartScanService, { SmartScanResult, SmartScanRequest } from '@/services/SmartScanService';
import { unifiedAIService } from '@/services/UnifiedAIService';

interface SmartScanUploaderProps {
  yachtId?: string;
  documentType?: 'auto_detect' | 'yacht_registration' | 'insurance_certificate' | 'crew_license';
  category?: string;
  title: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  autoScan?: boolean;
  autoPopulate?: boolean;
  showCameraCapture?: boolean;
  onScanComplete?: (results: SmartScanResult[]) => void;
  onUploadComplete?: (results: any[]) => void;
  onDataExtracted?: (extractedData: any, documentType: string) => void;
  className?: string;
}

interface ProcessingFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'scanning' | 'success' | 'error';
  progress: number;
  scanResult?: SmartScanResult;
  error?: string;
}

const DOCUMENT_TYPES = [
  { value: 'auto_detect', label: 'Auto-Detect (Recommended)', icon: Brain, description: 'Let AI determine document type' },
  { value: 'yacht_registration', label: 'Yacht Registration', icon: Ship, description: 'Official yacht registration certificate' },
  { value: 'insurance_certificate', label: 'Insurance Certificate', icon: FileText, description: 'Yacht insurance documentation' },
  { value: 'crew_license', label: 'Crew License', icon: Users, description: 'STCW or other crew certification' }
];

const SmartScanUploader: React.FC<SmartScanUploaderProps> = ({
  yachtId,
  documentType = 'auto_detect',
  category = 'general',
  title,
  description,
  required = false,
  multiple = false,
  maxFiles = 1,
  autoScan = true,
  autoPopulate = false,
  showCameraCapture = true,
  onScanComplete,
  onUploadComplete,
  onDataExtracted,
  className
}) => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useSupabaseAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [selectedDocType, setSelectedDocType] = useState(documentType);
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [contextHint, setContextHint] = useState('');
  
  // UNIFIED: Using UnifiedAIService for standardized AI initialization
  const [isAIInitialized, setIsAIInitialized] = useState(false);

  // Initialize AI service when user is authenticated
  useEffect(() => {
    const initializeAI = async () => {
      if (user?.id && !isAIInitialized) {
        console.log('[SmartScanUploader] UNIFIED: Initializing AI service for:', user.email);
        const success = await unifiedAIService.initialize('yacht_onboarding');
        if (success) {
          setIsAIInitialized(true);
          console.log('[SmartScanUploader] UNIFIED: AI service initialized successfully');
        } else {
          console.error('[SmartScanUploader] UNIFIED: Failed to initialize AI service');
        }
      }
    };

    initializeAI();
  }, [user?.id, isAIInitialized]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!multiple && acceptedFiles.length > 1) {
      toast({
        title: "Multiple Files Not Allowed",
        description: "Please select only one file for this document type.",
        variant: "destructive"
      });
      return;
    }

    if (acceptedFiles.length + processingFiles.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} file(s) allowed.`,
        variant: "destructive"
      });
      return;
    }

    const newFiles: ProcessingFile[] = acceptedFiles.map((file, index) => ({
      id: `file_${Date.now()}_${index}`,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending',
      progress: 0
    }));

    setProcessingFiles(prev => [...prev, ...newFiles]);

    // Auto-scan if enabled and AI is initialized
    if (autoScan && isAIInitialized) {
      console.log('[SmartScanUploader] UNIFIED: Auto-scanning with initialized AI service');
      newFiles.forEach(processFile => scanFile(processFile));
    }
  }, [multiple, maxFiles, processingFiles.length, autoScan, user?.id, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple,
    maxFiles,
    disabled: isScanning || (!multiple && processingFiles.length >= maxFiles)
  });

  const scanFile = async (processFile: ProcessingFile) => {
    if (!isAIInitialized) {
      console.log('[SmartScanUploader] UNIFIED: AI service not initialized');
      toast({
        title: "AI Service Not Ready",
        description: "Please wait for the AI service to initialize.",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    
    // Update status to scanning
    setProcessingFiles(prev => prev.map(f => 
      f.id === processFile.id ? { ...f, status: 'scanning', progress: 10 } : f
    ));

    try {
      console.log('[SmartScanUploader] UNIFIED: Starting scan with Custom Extractor processor 8708cd1d9cd87cc1');
      
      // Convert file to base64
      const base64Data = await fileToBase64(processFile.file);
      
      // Progress update
      setProcessingFiles(prev => prev.map(f => 
        f.id === processFile.id ? { ...f, progress: 30 } : f
      ));

      // UNIFIED: Single Document AI scanning request
      const scanRequest: SmartScanRequest = {
        imageData: base64Data,
        documentType: selectedDocType,
        context: {
          yacht_id: yachtId,
          user_id: user.id,
          module: 'yacht_management',
          hint: contextHint || `${selectedDocType} document for yacht onboarding`
        },
        options: {
          auto_populate: autoPopulate,
          confidence_threshold: 0.8,
          extract_only: false
        }
      };

      // Progress update
      setProcessingFiles(prev => prev.map(f => 
        f.id === processFile.id ? { ...f, progress: 60 } : f
      ));

      // UNIFIED: Call through UnifiedAIService for standardized processing
      console.log('[SmartScanUploader] UNIFIED: Calling through unified AI service');
      const scanResult = await unifiedAIService.scanDocument(scanRequest);

      // Progress update
      setProcessingFiles(prev => prev.map(f => 
        f.id === processFile.id ? { ...f, progress: 90 } : f
      ));

      // Finalize scan result
      setProcessingFiles(prev => prev.map(f => 
        f.id === processFile.id 
          ? { 
              ...f, 
              status: scanResult.success ? 'success' : 'error',
              progress: 100,
              scanResult,
              error: scanResult.error
            }
          : f
      ));

      // Log results
      console.log('[SmartScanUploader] UNIFIED: Scan completed:', {
        success: scanResult.success,
        documentType: scanResult.document_type,
        confidence: scanResult.confidence,
        processorId: scanResult.processor_id
      });

      // Success feedback
      if (scanResult.success) {
        toast({
          title: "✨ SmartScan Complete",
          description: `Document processed successfully with ${Math.round(scanResult.confidence * 100)}% confidence`,
          variant: "default"
        });

        // Call callbacks
        if (onScanComplete) {
          onScanComplete([scanResult]);
        }

        if (onDataExtracted && scanResult.auto_populate_data) {
          onDataExtracted(scanResult.auto_populate_data, scanResult.document_type);
        }
      } else {
        toast({
          title: "⚠️ Scan Failed",
          description: scanResult.error || "Failed to process document",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('[SmartScanUploader] UNIFIED: Scan error:', error);
      
      setProcessingFiles(prev => prev.map(f => 
        f.id === processFile.id 
          ? { 
              ...f, 
              status: 'error',
              progress: 100,
              error: error.message || 'Scan failed'
            }
          : f
      ));

      toast({
        title: "❌ Scan Error",
        description: error.message || "An unexpected error occurred during scanning",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (fileId: string) => {
    setProcessingFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      // Revoke object URLs to prevent memory leaks
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return newFiles;
    });
  };

  const retryFile = (fileId: string) => {
    const file = processingFiles.find(f => f.id === fileId);
    if (file) {
      scanFile(file);
    }
  };

  const startCamera = async () => {
    if (!showCameraCapture) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      toast({
        title: "Camera Access Failed",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onDrop([file]);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const renderFilePreview = (file: ProcessingFile) => {
    const IconComponent = getStatusIcon(file.status);
    const statusColor = getStatusColor(file.status);

    return (
      <div key={file.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconComponent className={`h-5 w-5 ${statusColor}`} />
            <span className="text-sm font-medium truncate max-w-48">
              {file.file.name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {file.status === 'success' && file.scanResult && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(file.scanResult.confidence * 100)}% confidence
              </Badge>
            )}
            {file.status === 'error' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => retryFile(file.id)}
                className="h-6 px-2"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => removeFile(file.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {file.status === 'scanning' && (
          <Progress value={file.progress} className="h-2" />
        )}

        {/* Error message */}
        {file.status === 'error' && file.error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {file.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success results */}
        {file.status === 'success' && file.scanResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Document Type: {file.scanResult.document_type}</span>
              <span>Processor: {file.scanResult.processor_id}</span>
            </div>
            
            {file.scanResult.suggestions.length > 0 && (
              <div className="text-xs text-green-600">
                {file.scanResult.suggestions[0]}
              </div>
            )}

            {file.scanResult.auto_populate_data && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full h-8 text-xs"
                onClick={() => onDataExtracted?.(file.scanResult?.auto_populate_data, file.scanResult?.document_type || '')}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Auto-Populate Form
              </Button>
            )}
          </div>
        )}

        {/* File preview */}
        {file.preview && (
          <div className="mt-2">
            <img 
              src={file.preview} 
              alt="Preview" 
              className="max-w-full h-24 object-cover rounded border"
            />
          </div>
        )}
      </div>
    );
  };

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'pending': return Upload;
      case 'scanning': return Loader2;
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      default: return FileText;
    }
  };

  const getStatusColor = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'pending': return 'text-blue-500';
      case 'scanning': return 'text-orange-500 animate-spin';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Scan className="h-5 w-5 text-blue-600" />
          <span>{title}</span>
          <Badge variant="outline" className="text-xs">
            UNIFIED AI
          </Badge>
          {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Processor Selection Section - Required by memory */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">AI Processor</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast({ title: "Processor Selection", description: "Custom Extractor - Yacht Documents is the optimized processor for maritime documents." })}
            >
              Change Processor
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Custom Extractor - Yacht Documents</div>
                <div className="text-sm text-gray-600">Specialized for Maritime Documents, Certificates of Registry, Yacht Specifications</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">98% Accuracy</Badge>
                <Badge variant="outline">PDF, PNG, JPG, TIFF</Badge>
              </div>
            </div>
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Processor ID: 8708cd1d9cd87cc1</span>
            </div>
          </div>
        </div>
        {/* Document Type Selection */}
        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select 
            value={selectedDocType} 
            onValueChange={(value: string) => 
              setSelectedDocType(value as SmartScanUploaderProps['documentType'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => {
                const IconComponent = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Context Hint */}
        <div className="space-y-2">
          <Label>Context Hint (Optional)</Label>
          <Textarea
            placeholder="Add any specific context about this document..."
            value={contextHint}
            onChange={(e) => setContextHint(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Upload Area */}
        <div className="space-y-3">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <div className="text-sm">
                {isDragActive ? (
                  <p className="text-blue-600">Drop files here...</p>
                ) : (
                  <>
                    <p className="font-medium">Drop files here or click to browse</p>
                    <p className="text-muted-foreground">
                      Support PDF and image files • Max {maxFiles} file{maxFiles > 1 ? 's' : ''}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Alternative Browse Button */}
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline" 
            className="w-full"
            disabled={isScanning}
          >
            <Upload className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
          
          {/* Hidden file input for the browse button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept="application/pdf,image/*"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                onDrop(files);
                // Reset the input to allow selecting the same file again
                e.target.value = '';
              }
            }}
            className="hidden"
          />
        </div>

        {/* Camera Capture */}
        {showCameraCapture && (
          <div className="space-y-2">
            {!showCamera ? (
              <Button 
                onClick={startCamera} 
                variant="outline" 
                className="w-full"
                disabled={isScanning}
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture with Camera
              </Button>
            ) : (
              <div className="space-y-2">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full max-h-64 bg-black rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex space-x-2">
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Files */}
        {processingFiles.length > 0 && (
          <div className="space-y-3">
            <Label>Processing Queue</Label>
            <div className="space-y-2">
              {processingFiles.map(renderFilePreview)}
            </div>
          </div>
        )}

        {/* Status Information */}
        {isScanning && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Processing document with AI processor 4ab65e484eb85038...
            </AlertDescription>
          </Alert>
        )}

        {/* AI Service Status */}
        {user?.id && !isAIInitialized && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Initializing AI service...
            </AlertDescription>
          </Alert>
        )}

        {/* Authentication Warning */}
        {!user?.id && !authLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to use SmartScan features.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartScanUploader;