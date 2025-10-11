import { useState, useCallback, FC } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SmartScanService, { SmartScanResult } from '@/services/SmartScanService';

interface DocumentUpload {
  file: File;
  documentType: string;
  category: string;
  description?: string;
  tags?: string[];
}

interface UploadResult {
  success: boolean;
  documentId?: string;
  url?: string;
  error?: string;
  scanResult?: SmartScanResult;
}

interface YachtDocumentUploaderProps {
  yachtId?: string;
  userId: string;
  documentType: string;
  category: string;
  title: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadStart?: () => void;
  existingDocument?: {
    id: string;
    name: string;
    url: string;
  };
}

interface PendingUpload extends DocumentUpload {
  id: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: UploadResult;
}

const YachtDocumentUploader: FC<YachtDocumentUploaderProps> = ({
  yachtId,
  userId,
  documentType,
  category,
  title,
  description,
  required = false,
  multiple = false,
  maxFiles = 1,
  onUploadComplete,
  onUploadStart,
  existingDocument
}) => {
  const { toast } = useToast();
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [smartScanService] = useState(() => new SmartScanService());

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!multiple && acceptedFiles.length > 1) {
      toast({
        title: "Multiple Files Not Allowed",
        description: "Please select only one file for this document type.",
        variant: "destructive"
      });
      return;
    }

    if (acceptedFiles.length + pendingUploads.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} file(s) allowed.`,
        variant: "destructive"
      });
      return;
    }

    const newUploads: PendingUpload[] = acceptedFiles.map((file, index) => ({
      id: `upload_${Date.now()}_${index}`,
      file,
      documentType,
      category,
      description: `${title} - ${file.name}`,
      tags: [category, documentType],
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      progress: 0,
      status: 'pending'
    }));

    setPendingUploads(prev => [...prev, ...newUploads]);
  }, [documentType, category, title, multiple, maxFiles, pendingUploads.length, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple,
    maxFiles,
    disabled: isUploading || (!multiple && pendingUploads.length >= maxFiles)
  });

  const uploadFiles = async () => {
    if (!yachtId) {
      toast({
        title: "Yacht ID Required",
        description: "Cannot upload documents without yacht context.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    onUploadStart?.();

    const results: UploadResult[] = [];

    for (const upload of pendingUploads) {
      if (upload.status !== 'pending') continue;

      setPendingUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'uploading', progress: 10 } : u
      ));

      try {
        const progressInterval = setInterval(() => {
          setPendingUploads(prev => prev.map(u => 
            u.id === upload.id && u.progress < 90 
              ? { ...u, progress: u.progress + 20 } 
              : u
          ));
        }, 200);

        const scanResult = await smartScanService.scanFile(upload.file, {
          auto_populate: false,
          confidence_threshold: 0.7
        });

        const result: UploadResult = {
          success: scanResult.success,
          documentId: `doc_${Date.now()}`,
          url: `data:${upload.file.type};base64,placeholder`,
          error: scanResult.error,
          scanResult
        };
        
        clearInterval(progressInterval);

        setPendingUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { 
                ...u, 
                status: result.success ? 'success' : 'error',
                progress: 100,
                error: result.error,
                result
              } 
            : u
        ));

        results.push(result);

        if (result.success) {
          toast({
            title: "Upload Successful",
            description: `${upload.file.name} processed successfully.`
          });
        } else {
          toast({
            title: "Upload Failed",
            description: result.error || "Failed to process document.",
            variant: "destructive"
          });
        }

      } catch (error: any) {
        setPendingUploads(prev => prev.map(u => 
          u.id === upload.id 
            ? { 
                ...u, 
                status: 'error',
                progress: 0,
                error: error.message
              } 
            : u
        ));

        results.push({
          success: false,
          error: error.message
        });

        toast({
          title: "Upload Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive"
        });
      }
    }

    setIsUploading(false);
    onUploadComplete?.(results);
  };

  const removeUpload = (uploadId: string) => {
    setPendingUploads(prev => {
      const upload = prev.find(u => u.id === uploadId);
      if (upload?.preview) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter(u => u.id !== uploadId);
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusIcon = (status: PendingUpload['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Upload className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>

      {existingDocument && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{existingDocument.name}</span>
                <Badge variant="outline" className="text-xs">Uploaded</Badge>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <a href={existingDocument.url} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(!existingDocument || multiple) && (
        <Card>
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
                ${isUploading || (!multiple && pendingUploads.length >= maxFiles) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm">
                {isDragActive ? (
                  <p className="text-primary">Drop files here...</p>
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
          </CardContent>
        </Card>
      )}

      {pendingUploads.length > 0 && (
        <div className="space-y-2">
          {pendingUploads.map((upload) => (
            <Card key={upload.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(upload.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{upload.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(upload.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUpload(upload.id)}
                    disabled={upload.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {upload.status === 'uploading' && (
                <Progress value={upload.progress} className="mt-2" />
              )}

              {upload.error && (
                <p className="text-xs text-red-600 mt-1">{upload.error}</p>
              )}
            </Card>
          ))}

          {pendingUploads.some(u => u.status === 'pending') && (
            <Button onClick={uploadFiles} disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Process Documents
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default YachtDocumentUploader;