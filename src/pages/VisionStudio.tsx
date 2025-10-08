import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageGeneration } from '@/components/vision/ImageGeneration';
import { VisionAnalyzer } from '@/components/vision/VisionAnalyzer';
import { BackgroundRemoval } from '@/components/vision/BackgroundRemoval';
import { SmartCamera } from '@/components/vision/SmartCamera';
import { 
  Eye, 
  Wand2, 
  Scissors, 
  Camera,
  Sparkles,
  Zap,
  Target,
  Layers
} from 'lucide-react';

const VisionStudio = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Eye className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Vision Studio</h1>
          <p className="text-muted-foreground">
            Multi-modal AI and visual intelligence for yacht operations and documentation
          </p>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Wand2 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-semibold">AI Generation</h3>
            <p className="text-sm text-muted-foreground">Create yacht images with AI</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold">Vision Analysis</h3>
            <p className="text-sm text-muted-foreground">AI-powered image analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Scissors className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold">Background Removal</h3>
            <p className="text-sm text-muted-foreground">Professional image editing</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <h3 className="font-semibold">Smart Camera</h3>
            <p className="text-sm text-muted-foreground">Real-time capture & analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Vision Tools */}
      <Tabs defaultValue="generation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            AI Generation
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Vision Analysis
          </TabsTrigger>
          <TabsTrigger value="editing" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Image Editing
          </TabsTrigger>
          <TabsTrigger value="camera" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Smart Camera
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Image Generation Interface */}
            <div className="lg:col-span-3">
              <ImageGeneration />
            </div>

            {/* Generation Features & Tips */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Providers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">OpenAI</div>
                      <div className="text-sm text-muted-foreground">
                        GPT Image 1, DALL-E 3 & 2 for highest quality
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Hugging Face</div>
                      <div className="text-sm text-muted-foreground">
                        FLUX models for fast, versatile generation
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Runware</div>
                      <div className="text-sm text-muted-foreground">
                        Ultra-fast processing and generation
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generation Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>•</strong> Be specific with yacht terminology</p>
                  <p><strong>•</strong> Include lighting preferences (sunset, bright, etc.)</p>
                  <p><strong>•</strong> Specify camera angles and perspectives</p>
                  <p><strong>•</strong> Mention materials and finishes</p>
                  <p><strong>•</strong> Try different models for varied results</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Vision Analyzer Interface */}
            <div className="lg:col-span-3">
              <VisionAnalyzer />
            </div>

            {/* Analysis Features */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Analysis Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">General Analysis</div>
                      <div className="text-sm text-muted-foreground">
                        Comprehensive image understanding
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">OCR Text Extraction</div>
                      <div className="text-sm text-muted-foreground">
                        Extract text from documents and labels
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Safety Assessment</div>
                      <div className="text-sm text-muted-foreground">
                        Identify hazards and safety equipment
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Yacht-Specific</div>
                      <div className="text-sm text-muted-foreground">
                        Equipment, maintenance, and inventory
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Use Cases</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>•</strong> Equipment condition assessment</p>
                  <p><strong>•</strong> Safety compliance checking</p>
                  <p><strong>•</strong> Inventory documentation</p>
                  <p><strong>•</strong> Maintenance planning</p>
                  <p><strong>•</strong> Insurance documentation</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="editing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Background Removal Interface */}
            <div className="lg:col-span-3">
              <BackgroundRemoval />
            </div>

            {/* Editing Features */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Editing Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">AI Segmentation</div>
                      <div className="text-sm text-muted-foreground">
                        Advanced subject detection and isolation
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Transparent Output</div>
                      <div className="text-sm text-muted-foreground">
                        PNG files with alpha transparency
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Batch Processing</div>
                      <div className="text-sm text-muted-foreground">
                        Process multiple images efficiently
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional Uses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>•</strong> Product photography</p>
                  <p><strong>•</strong> Marketing materials</p>
                  <p><strong>•</strong> Documentation cleanup</p>
                  <p><strong>•</strong> Presentation graphics</p>
                  <p><strong>•</strong> Catalog images</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="camera" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Smart Camera Interface */}
            <div className="lg:col-span-3">
              <SmartCamera />
            </div>

            {/* Camera Features */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Smart Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Real-time Capture</div>
                      <div className="text-sm text-muted-foreground">
                        High-resolution photo capture
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Instant Analysis</div>
                      <div className="text-sm text-muted-foreground">
                        AI processing immediately after capture
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">OCR Integration</div>
                      <div className="text-sm text-muted-foreground">
                        Extract text from captured images
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Object Detection</div>
                      <div className="text-sm text-muted-foreground">
                        Identify equipment and objects
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Camera Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>•</strong> Front/rear camera switching</p>
                  <p><strong>•</strong> High-resolution capture (1080p+)</p>
                  <p><strong>•</strong> Viewfinder with guides</p>
                  <p><strong>•</strong> Instant save and analysis</p>
                  <p><strong>•</strong> Gallery management</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisionStudio;