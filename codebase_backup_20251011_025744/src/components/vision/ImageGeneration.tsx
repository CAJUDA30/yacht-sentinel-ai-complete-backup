import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wand2, 
  Image as ImageIcon, 
  Download, 
  Sparkles,
  Zap,
  Palette,
  Settings,
  RefreshCw,
  Eye,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  timestamp: Date;
  size?: string;
  style?: string;
}

export const ImageGeneration: React.FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [selectedStyle, setSelectedStyle] = useState('vivid');
  const [selectedQuality, setSelectedQuality] = useState('high');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'huggingface' | 'runware'>('openai');

  const imageModels = {
    openai: [
      { id: 'gpt-image-1', name: 'GPT Image 1 (Latest)', description: 'Most advanced model with detailed control' },
      { id: 'dall-e-3', name: 'DALL-E 3', description: 'High quality, creative images' },
      { id: 'dall-e-2', name: 'DALL-E 2', description: 'Fast, reliable generation' }
    ],
    huggingface: [
      { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell', description: 'Fast, high quality' },
      { id: 'stabilityai/stable-diffusion-xl', name: 'Stable Diffusion XL', description: 'Versatile image generation' },
      { id: 'runwayml/stable-diffusion-v1-5', name: 'Stable Diffusion 1.5', description: 'Classic model' }
    ],
    runware: [
      { id: 'runware:100@1', name: 'Runware Fast', description: 'Ultra-fast generation' },
      { id: 'flux1-schnell', name: 'Flux Schnell', description: 'High quality, fast' }
    ]
  };

  const yachtPromptSuggestions = [
    'Luxury yacht sailing at sunset in calm mediterranean waters',
    'Modern yacht interior with sleek furniture and ocean views',
    'Yacht maintenance crew working on engine systems',
    'Elegant yacht dining room setup for evening dinner',
    'Yacht navigation bridge with advanced technology displays',
    'Crew quarters with comfortable beds and storage solutions',
    'Yacht deck setup for entertainment and relaxation',
    'Professional yacht galley with modern cooking equipment'
  ];

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter a description for the image to generate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      let response;
      const requestBody: any = {
        prompt: prompt.trim(),
        model: selectedModel,
        size: selectedSize,
        quality: selectedQuality,
        style: selectedStyle
      };

      switch (selectedProvider) {
        case 'openai':
          response = await supabase.functions.invoke('generate-image-openai', {
            body: requestBody
          });
          break;
        case 'huggingface':
          response = await supabase.functions.invoke('generate-image-huggingface', {
            body: { prompt: prompt.trim(), model: selectedModel }
          });
          break;
        case 'runware':
          response = await supabase.functions.invoke('generate-image-runware', {
            body: requestBody
          });
          break;
        default:
          throw new Error('Invalid provider selected');
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.error) {
        throw new Error(response.error.message || 'Generation failed');
      }

      const imageUrl = response.data?.image || response.data?.imageURL || response.data?.url;
      if (!imageUrl) {
        throw new Error('No image URL received from the API');
      }

      const newImage: GeneratedImage = {
        id: `img_${Date.now()}`,
        url: imageUrl,
        prompt: prompt.trim(),
        model: selectedModel,
        timestamp: new Date(),
        size: selectedSize,
        style: selectedStyle
      };

      setGeneratedImages(prev => [newImage, ...prev]);

      toast({
        title: "Image Generated Successfully",
        description: `Created with ${selectedProvider} using ${selectedModel}`,
      });

    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Image Downloaded",
        description: `Saved as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the image",
        variant: "destructive",
      });
    }
  };

  const copyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast({
      title: "Prompt Copied",
      description: "Prompt copied to clipboard",
    });
  };

  const useSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            AI Image Generation
            <Badge variant="outline">Multi-Provider</Badge>
          </CardTitle>
          <CardDescription>
            Generate high-quality images using advanced AI models from multiple providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="grid grid-cols-3 gap-2">
            {(['openai', 'huggingface', 'runware'] as const).map((provider) => (
              <Button
                key={provider}
                variant={selectedProvider === provider ? 'default' : 'outline'}
                onClick={() => setSelectedProvider(provider)}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </Button>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Image Description</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Yacht-Specific Suggestions */}
          <div className="space-y-2">
            <Label>Yacht-Specific Suggestions</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {yachtPromptSuggestions.slice(0, 4).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => useSuggestion(suggestion)}
                  className="text-left h-auto p-2 justify-start"
                >
                  <Eye className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="text-xs">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Model and Settings */}
          <Tabs defaultValue="model" className="space-y-4">
            <TabsList>
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="model" className="space-y-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels[selectedProvider].map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-sm text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                      <SelectItem value="1536x1024">Landscape (1536x1024)</SelectItem>
                      <SelectItem value="1024x1536">Portrait (1024x1536)</SelectItem>
                      <SelectItem value="1792x1024">Wide (1792x1024)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="medium">Medium Quality</SelectItem>
                      <SelectItem value="low">Low Quality (Faster)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedProvider === 'openai' && (
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivid">Vivid (Dramatic)</SelectItem>
                      <SelectItem value="natural">Natural (Realistic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating image with {selectedProvider}...</span>
              </div>
              <Progress value={generationProgress} />
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Generated Images ({generatedImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-3 rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {image.model}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {image.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {image.prompt}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyPrompt(image.prompt)}
                          className="flex-1"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadImage(image.url, `yacht_image_${image.id}.png`)}
                          className="flex-1"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Save
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

      {/* Help and Tips */}
      <Alert>
        <Palette className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro Tips:</strong> Be specific in your descriptions, include lighting and style preferences, 
          and try different providers for varied results. Use yacht-specific terms for maritime accuracy.
        </AlertDescription>
      </Alert>
    </div>
  );
};