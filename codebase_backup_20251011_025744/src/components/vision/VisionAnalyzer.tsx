import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  Upload, 
  Camera, 
  Search, 
  FileText,
  Scan,
  Zap,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AnalysisResult {
  id: string;
  image: string;
  analysis: string;
  ocrText?: string;
  objects?: Array<{ name: string; confidence: number; bbox?: number[] }>;
  safety?: { safe: boolean; categories: string[] };
  timestamp: Date;
  analysisType: 'general' | 'ocr' | 'safety' | 'yacht-specific';
}

export const VisionAnalyzer: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<'general' | 'ocr' | 'safety' | 'yacht-specific'>('general');
  const [customPrompt, setCustomPrompt] = useState('');

  const yachtAnalysisPrompts = {
    'general': 'Analyze this yacht-related image and provide detailed information about what you see.',
    'equipment': 'Identify and analyze yacht equipment, machinery, and systems visible in this image. Note any maintenance needs or safety concerns.',
    'safety': 'Perform a safety analysis of this yacht image. Identify potential hazards, safety equipment, and compliance with maritime safety standards.',
    'maintenance': 'Analyze this image for maintenance-related information. Identify equipment condition, wear patterns, and potential maintenance requirements.',
    'inventory': 'Catalog and identify items visible in this yacht inventory image. List equipment, supplies, and their apparent condition.',
    'damage': 'Assess any damage, wear, or issues visible in this yacht image. Provide detailed analysis for insurance or repair purposes.'
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

  const captureFromCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(imageDataUrl);
        
        // Stop camera
        stream.getTracks().forEach(track => track.stop());
        
        toast({
          title: "Photo Captured",
          description: "Image captured successfully",
        });
      };
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please select or capture an image to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      const prompt = customPrompt || yachtAnalysisPrompts[selectedAnalysisType] || yachtAnalysisPrompts.general;
      
      const { data, error } = await supabase.functions.invoke('vision-analyzer', {
        body: {
          image: selectedImage,
          analysisType: selectedAnalysisType,
          prompt: prompt,
          includeOCR: selectedAnalysisType === 'ocr',
          includeObjectDetection: true,
          includeSafetyAnalysis: selectedAnalysisType === 'safety'
        }
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (error) {
        throw new Error(error.message || 'Analysis failed');
      }

      const result: AnalysisResult = {
        id: `analysis_${Date.now()}`,
        image: selectedImage,
        analysis: data.analysis || data.description || 'No analysis available',
        ocrText: data.ocrText,
        objects: data.objects,
        safety: data.safety,
        timestamp: new Date(),
        analysisType: selectedAnalysisType
      };

      setAnalysisResults(prev => [result, ...prev]);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed image using ${selectedAnalysisType} analysis`,
      });

    } catch (error) {
      console.error('Vision analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const clearResults = () => {
    setAnalysisResults([]);
    toast({
      title: "Results Cleared",
      description: "All analysis results have been cleared",
    });
  };

  const downloadResults = () => {
    const results = analysisResults.map(result => ({
      timestamp: result.timestamp.toISOString(),
      analysisType: result.analysisType,
      analysis: result.analysis,
      ocrText: result.ocrText,
      objects: result.objects?.length || 0,
      safety: result.safety
    }));

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yacht_vision_analysis_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Vision Analyzer
            <Badge variant="outline">AI Vision</Badge>
          </CardTitle>
          <CardDescription>
            Analyze yacht images with AI-powered computer vision for equipment, safety, and maintenance insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Input */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <Button
                onClick={captureFromCamera}
                variant="outline"
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
            </div>
            
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
                  alt="Selected for analysis"
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

          {/* Analysis Type Selection */}
          <div className="space-y-2">
            <Label>Analysis Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['general', 'ocr', 'safety', 'yacht-specific'] as const).map((type) => (
                <Button
                  key={type}
                  variant={selectedAnalysisType === type ? 'default' : 'outline'}
                  onClick={() => setSelectedAnalysisType(type)}
                  size="sm"
                >
                  {type === 'general' && <Eye className="h-3 w-3 mr-1" />}
                  {type === 'ocr' && <FileText className="h-3 w-3 mr-1" />}
                  {type === 'safety' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {type === 'yacht-specific' && <Settings className="h-3 w-3 mr-1" />}
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Yacht-Specific Prompts */}
          {selectedAnalysisType === 'yacht-specific' && (
            <div className="space-y-2">
              <Label>Specialized Analysis</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(yachtAnalysisPrompts).slice(1).map(([key, prompt]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomPrompt(prompt)}
                    className="text-left h-auto p-2 justify-start"
                  >
                    <Scan className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="text-xs capitalize">{key}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Custom Analysis Prompt (Optional)</Label>
            <Textarea
              id="custom-prompt"
              placeholder="Enter specific instructions for the AI analysis..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
            />
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 animate-pulse text-blue-500" />
                <span className="text-sm">Analyzing image with AI vision...</span>
              </div>
              <Progress value={analysisProgress} />
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={analyzeImage}
            disabled={isAnalyzing || !selectedImage}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Analyze Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Analysis Results ({analysisResults.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={downloadResults}>
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <Button size="sm" variant="outline" onClick={clearResults}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResults.map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={result.image}
                          alt="Analyzed"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">
                            {result.analysisType.replace('-', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleString()}
                          </span>
                        </div>

                        <Tabs defaultValue="analysis" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="analysis">Analysis</TabsTrigger>
                            <TabsTrigger value="ocr" disabled={!result.ocrText}>OCR</TabsTrigger>
                            <TabsTrigger value="objects" disabled={!result.objects?.length}>Objects</TabsTrigger>
                            <TabsTrigger value="safety" disabled={!result.safety}>Safety</TabsTrigger>
                          </TabsList>

                          <TabsContent value="analysis" className="mt-3">
                            <div className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                              {result.analysis}
                            </div>
                          </TabsContent>

                          {result.ocrText && (
                            <TabsContent value="ocr" className="mt-3">
                              <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <p className="font-medium mb-2">Detected Text:</p>
                                <p className="whitespace-pre-wrap">{result.ocrText}</p>
                              </div>
                            </TabsContent>
                          )}

                          {result.objects && (
                            <TabsContent value="objects" className="mt-3">
                              <div className="space-y-2">
                                {result.objects.map((obj, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                    <span className="font-medium">{obj.name}</span>
                                    <Badge variant="secondary">
                                      {Math.round(obj.confidence * 100)}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                          )}

                          {result.safety && (
                            <TabsContent value="safety" className="mt-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {result.safety.safe ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {result.safety.safe ? 'Safe Content' : 'Safety Concerns'}
                                  </span>
                                </div>
                                {result.safety.categories.length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {result.safety.categories.map((category, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {category}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                          )}
                        </Tabs>
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
        <Search className="h-4 w-4" />
        <AlertDescription>
          <strong>Vision Analysis Features:</strong> Upload yacht images for AI-powered analysis including 
          equipment identification, safety assessments, OCR text extraction, and maintenance insights. 
          Perfect for inspections, inventory, and documentation.
        </AlertDescription>
      </Alert>
    </div>
  );
};