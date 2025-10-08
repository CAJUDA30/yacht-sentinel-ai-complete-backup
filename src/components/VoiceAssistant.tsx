import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Brain,
  MessageSquare,
  Settings,
  Zap,
  Shield,
  CheckCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  verified?: boolean;
  confidence?: number;
  provider?: string;
}

const VoiceAssistant: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Aria');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const voices = [
    'Aria', 'Roger', 'Sarah', 'Laura', 'Charlie', 
    'George', 'Callum', 'River', 'Liam', 'Charlotte',
    'Alice', 'Matilda', 'Will', 'Jessica', 'Eric',
    'Chris', 'Brian', 'Daniel', 'Lily', 'Bill'
  ];

  // Initialize voice recognition
  useEffect(() => {
    const initializeVoiceRecognition = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          
          await processVoiceInput(audioBlob);
        };
      } catch (error) {
        console.error('Error initializing voice recognition:', error);
        toast({
          title: "Microphone Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };

    initializeVoiceRecognition();
  }, []);

  const startListening = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      setIsListening(true);
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      
      toast({
        title: "Listening",
        description: "Speak now, I'm listening...",
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setIsListening(false);
      mediaRecorderRef.current.stop();
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // Convert audio to base64 for processing
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // First, transcribe the audio using OpenAI Whisper
      const transcriptionResponse = await supabase.functions.invoke('voice-processor', {
        body: { 
          type: 'speech-to-text',
          content: base64Audio
        }
      });

      if (transcriptionResponse.error) {
        throw new Error('Transcription failed');
      }

      const userMessage = transcriptionResponse.data.text;
      
      // Add user message to conversation
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        type: 'user',
        content: userMessage,
        timestamp: new Date()
      }]);

      // Process with unified AI system (Grok + verification)
      const aiResponse = await supabase.functions.invoke('unified-voice-ai', {
        body: {
          prompt: userMessage,
          context: 'Voice assistant conversation for yacht management',
          action: 'chat'
        }
      });

      const assistantResponse = aiResponse.data?.consensus || 
        aiResponse.data?.primary?.response || 
        "I understand. How can I help you further?";

      // Generate speech from AI response
      const speechResponse = await supabase.functions.invoke('voice-assistant', {
        body: { 
          text: assistantResponse, 
          voice: selectedVoice,
          action: 'speak'
        }
      });

      if (speechResponse.data?.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${speechResponse.data.audioContent}`;
        
        // Add assistant message to conversation with verification data
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
          id: assistantMsgId,
          type: 'assistant',
          content: assistantResponse,
          timestamp: new Date(),
          audioUrl,
          verified: aiResponse.data?.verified,
          confidence: aiResponse.data?.confidence,
          provider: aiResponse.data?.primary?.provider || 'grok'
        }]);

        // Play the audio response
        await playAudio(audioUrl);
      }

    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Processing Error",
        description: "Could not process your voice input. Please try again.",
        variant: "destructive",
      });
    }
  };

  const playAudio = async (audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setIsSpeaking(true);

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        resolve();
      };

      audio.onerror = (error) => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        reject(error);
      };

      audio.play().catch(reject);
    });
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsSpeaking(false);
      setCurrentAudio(null);
    }
  };

  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      type: 'user',
      content: text,
      timestamp: new Date()
    }]);

    try {
      // Process with unified AI system (Grok + verification)
      const aiResponse = await supabase.functions.invoke('unified-voice-ai', {
        body: {
          prompt: text,
          context: 'Voice assistant conversation for yacht management',
          action: 'chat'
        }
      });

      const assistantResponse = aiResponse.data?.consensus || 
        aiResponse.data?.primary?.response || 
        "I understand. How can I help you further?";

      // Generate speech from AI response
      const speechResponse = await supabase.functions.invoke('voice-assistant', {
        body: { 
          text: assistantResponse, 
          voice: selectedVoice,
          action: 'speak'
        }
      });

      if (speechResponse.data?.audioContent) {
        const audioUrl = `data:audio/mpeg;base64,${speechResponse.data.audioContent}`;
        
        // Add assistant message with verification data
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
          id: assistantMsgId,
          type: 'assistant',
          content: assistantResponse,
          timestamp: new Date(),
          audioUrl,
          verified: aiResponse.data?.verified,
          confidence: aiResponse.data?.confidence,
          provider: aiResponse.data?.primary?.provider || 'grok'
        }]);

        // Play the audio response
        await playAudio(audioUrl);
      }
    } catch (error) {
      console.error('Error processing text message:', error);
      toast({
        title: "Processing Error",
        description: "Could not process your message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Voice Assistant
          </CardTitle>
          <CardDescription>
            Advanced voice-powered yacht management assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Voice:</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice} value={voice}>
                      {voice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? "Listening..." : "Ready"}
              </Badge>
              <Badge variant={isSpeaking ? "default" : "secondary"}>
                {isSpeaking ? "Speaking..." : "Quiet"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              size="lg"
              variant={isListening ? "destructive" : "default"}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing || isSpeaking}
              className="rounded-full w-16 h-16"
            >
              {isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            {isSpeaking && (
              <Button
                size="lg"
                variant="outline"
                onClick={stopSpeaking}
                className="rounded-full w-16 h-16"
              >
                <VolumeX className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sendTextMessage("What's the current status of all systems?")}
              disabled={isProcessing || isSpeaking}
            >
              System Status
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sendTextMessage("Show me the weather forecast")}
              disabled={isProcessing || isSpeaking}
            >
              Weather Update
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sendTextMessage("Check inventory levels")}
              disabled={isProcessing || isSpeaking}
            >
              Inventory Check
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => sendTextMessage("Any maintenance alerts?")}
              disabled={isProcessing || isSpeaking}
            >
              Maintenance
            </Button>
          </div>

          {/* Conversation History */}
          <div className="max-h-64 overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-lg">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start a conversation with your AI assistant</p>
                <p className="text-sm">Press the microphone button or use quick actions</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                         {message.type === 'assistant' && (
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {message.verified ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Shield className="h-3 w-3 text-blue-500" />
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{message.verified ? "AI Verified Response" : "Grok Primary Response"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="text-xs text-muted-foreground uppercase">
                              {message.provider}
                            </span>
                            {message.confidence && (
                              <span className="text-xs text-muted-foreground">
                                ({Math.round(message.confidence * 100)}%)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {message.audioUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => playAudio(message.audioUrl!)}
                          disabled={isSpeaking}
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceAssistant;