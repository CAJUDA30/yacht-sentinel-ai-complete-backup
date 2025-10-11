import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VoiceInterface } from '@/components/voice/VoiceInterface';
import { ElevenLabsVoiceInterface } from '@/components/voice/ElevenLabsVoiceInterface';
import { 
  Radio, 
  Volume2, 
  Mic, 
  MessageCircle,
  Zap,
  Globe,
  Settings
} from 'lucide-react';

const VoiceAssistant = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Radio className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Voice Assistant</h1>
          <p className="text-muted-foreground">
            Advanced voice AI with real-time conversation and high-quality speech synthesis
          </p>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <h3 className="font-semibold">Real-time Chat</h3>
            <p className="text-sm text-muted-foreground">Live voice conversations with AI</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Volume2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <h3 className="font-semibold">Premium TTS</h3>
            <p className="text-sm text-muted-foreground">ElevenLabs voice synthesis</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Mic className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <h3 className="font-semibold">Voice Recognition</h3>
            <p className="text-sm text-muted-foreground">OpenAI Whisper transcription</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="font-semibold">Smart Functions</h3>
            <p className="text-sm text-muted-foreground">Yacht-specific AI tools</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Real-time Voice Chat
          </TabsTrigger>
          <TabsTrigger value="synthesis" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Voice Synthesis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Voice Interface */}
            <div className="lg:col-span-2">
              <VoiceInterface />
            </div>

            {/* Features & Instructions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Voice Chat Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Natural Conversations</div>
                      <div className="text-sm text-muted-foreground">
                        Speak naturally with AI using real-time voice processing
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Yacht Operations</div>
                      <div className="text-sm text-muted-foreground">
                        Get real-time yacht status, weather, and navigation info
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Smart Functions</div>
                      <div className="text-sm text-muted-foreground">
                        Access yacht systems through voice commands
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Multi-modal Input</div>
                      <div className="text-sm text-muted-foreground">
                        Switch between voice and text seamlessly
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>1.</strong> Click "Connect Voice Chat" to start</p>
                  <p><strong>2.</strong> Allow microphone access when prompted</p>
                  <p><strong>3.</strong> Start speaking or type messages</p>
                  <p><strong>4.</strong> Ask about yacht status, weather, or operations</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="synthesis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ElevenLabs Interface */}
            <div className="lg:col-span-2">
              <ElevenLabsVoiceInterface />
            </div>

            {/* Voice Information */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Available Voices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Aria:</strong> Natural, conversational female voice</div>
                  <div><strong>Roger:</strong> Professional, authoritative male voice</div>
                  <div><strong>Sarah:</strong> Warm, friendly female voice</div>
                  <div><strong>Laura:</strong> Clear, articulate female voice</div>
                  <div><strong>Charlie:</strong> Casual, approachable male voice</div>
                  <div><strong>George:</strong> Deep, confident male voice</div>
                  <div><strong>Callum:</strong> Young, energetic male voice</div>
                  <div><strong>River:</strong> Neutral, versatile voice</div>
                  <div><strong>Liam:</strong> Smooth, professional male voice</div>
                  <div><strong>Charlotte:</strong> Elegant, sophisticated female voice</div>
                  <div><strong>Alice:</strong> Bright, cheerful female voice</div>
                  <div><strong>Matilda:</strong> Mature, wise female voice</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voice Synthesis Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>•</strong> Use punctuation for natural pauses</p>
                  <p><strong>•</strong> CAPS for emphasis on important words</p>
                  <p><strong>•</strong> Try different voices for various content types</p>
                  <p><strong>•</strong> Record your voice for easy text input</p>
                  <p><strong>•</strong> Download audio files for offline use</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceAssistant;