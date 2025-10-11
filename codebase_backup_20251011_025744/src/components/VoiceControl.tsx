import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Square } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface VoiceControlProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VoiceCommand {
  command: string;
  confidence: number;
  action: string;
  parameters?: any;
}

const VoiceControl: React.FC<VoiceControlProps> = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<string>('Ready');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Voice commands mapping
  const voiceCommands = {
    navigation: ['navigate to', 'go to', 'open', 'show me'],
    actions: ['start', 'stop', 'pause', 'resume', 'create', 'delete', 'update'],
    modules: {
      'dashboard': '/',
      'inventory': '/inventory',
      'crew': '/crew',
      'maintenance': '/maintenance',
      'finance': '/finance',
      'navigation': '/navigation',
      'safety': '/safety',
      'documents': '/documents',
      'guests': '/guests',
      'charter': '/charter',
      'analytics': '/analytics'
    }
  };

  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Setup audio level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      if (isListening) {
        updateAudioLevel();
      }

      // Setup MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        await processAudio(audioBlob);
      };

    } catch (error) {
      console.error('Error initializing audio:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [isListening]);

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setRecognitionStatus('Processing...');

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send to voice processor
      const { data, error } = await supabase.functions.invoke('voice-processor', {
        body: {
          type: 'speech-to-text',
          content: base64Audio,
          language: 'en',
          context: 'yacht management'
        }
      });

      if (error) throw error;

      const transcription = data.text.toLowerCase();
      const aiInterpretation = data.aiInterpretation;
      
      console.log('Voice transcription:', transcription);
      console.log('AI interpretation:', aiInterpretation);

      // Process the command
      const command = await processVoiceCommand(transcription, aiInterpretation);
      setLastCommand(command);

      if (command.confidence > 0.7) {
        await executeCommand(command);
        setRecognitionStatus(`Executed: ${command.action}`);
      } else {
        setRecognitionStatus(`Low confidence: ${command.command}`);
        toast({
          title: "Command Unclear",
          description: "Please try again with a clearer command",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      setRecognitionStatus('Error occurred');
      toast({
        title: "Voice Processing Error",
        description: "Failed to process voice command",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processVoiceCommand = async (transcription: string, aiInterpretation: any): Promise<VoiceCommand> => {
    // Check for navigation commands
    for (const [module, path] of Object.entries(voiceCommands.modules)) {
      if (transcription.includes(module) || 
          voiceCommands.navigation.some(nav => transcription.includes(`${nav} ${module}`))) {
        return {
          command: transcription,
          confidence: 0.9,
          action: 'navigate',
          parameters: { module, path }
        };
      }
    }

    // Check for specific actions
    if (transcription.includes('emergency') || transcription.includes('alert')) {
      return {
        command: transcription,
        confidence: 0.95,
        action: 'emergency_alert',
        parameters: { type: 'voice_activated' }
      };
    }

    if (transcription.includes('status') || transcription.includes('report')) {
      return {
        command: transcription,
        confidence: 0.8,
        action: 'status_report',
        parameters: { type: 'voice_request' }
      };
    }

    // Use AI interpretation for complex commands
    if (aiInterpretation && aiInterpretation.action) {
      return {
        command: transcription,
        confidence: aiInterpretation.confidence || 0.6,
        action: aiInterpretation.action,
        parameters: aiInterpretation.parameters
      };
    }

    return {
      command: transcription,
      confidence: 0.3,
      action: 'unknown',
      parameters: {}
    };
  };

  const executeCommand = async (command: VoiceCommand) => {
    switch (command.action) {
      case 'navigate':
        if (command.parameters?.path) {
          navigate(command.parameters.path);
          await speakResponse(`Navigating to ${command.parameters.module}`);
          onClose();
        }
        break;
        
      case 'emergency_alert':
        toast({
          title: "Emergency Alert Activated",
          description: "Emergency protocols initiated",
          variant: "destructive",
        });
        await speakResponse("Emergency alert activated. Notifying crew and authorities.");
        break;
        
      case 'status_report':
        await speakResponse("All systems operational. Vessel status nominal. Crew accounted for.");
        break;
        
      default:
        await speakResponse("Command recognized but no action configured");
    }
  };

  const speakResponse = async (text: string) => {
    setIsSpeaking(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('voice-processor', {
        body: {
          type: 'text-to-speech',
          content: text,
          voice: 'alloy'
        }
      });

      if (error) throw error;

      // Play the audio response
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.onended = () => setIsSpeaking(false);
      await audio.play();

    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    }
  };

  const startListening = useCallback(async () => {
    await initializeAudio();
    setIsListening(true);
    setRecognitionStatus('Listening...');
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
    }
  }, [initializeAudio]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setAudioLevel(0);
    setRecognitionStatus('Processing...');
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-card/95 backdrop-blur border-primary/20">
        <div className="flex flex-col items-center space-y-6">
          {/* Voice Status */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">Voice Control</h3>
            <Badge variant={isListening ? "default" : "secondary"} className="mb-2">
              {recognitionStatus}
            </Badge>
          </div>

          {/* Audio Visualizer */}
          <div className="relative">
            <div 
              className={`w-24 h-24 rounded-full border-4 transition-all duration-150 ${
                isListening 
                  ? 'border-primary bg-primary/10 animate-pulse' 
                  : 'border-muted bg-muted/20'
              }`}
              style={{
                transform: isListening ? `scale(${1 + audioLevel / 500})` : 'scale(1)'
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                {isSpeaking ? (
                  <Volume2 className="w-8 h-8 text-primary animate-pulse" />
                ) : isListening ? (
                  <Mic className="w-8 h-8 text-primary" />
                ) : (
                  <MicOff className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Last Command */}
          {lastCommand && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Last: "{lastCommand.command}"</p>
              <p>Confidence: {Math.round(lastCommand.confidence * 100)}%</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!isListening ? (
              <Button 
                onClick={startListening}
                disabled={isProcessing || isSpeaking}
                className="bg-primary hover:bg-primary/90"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Listening
              </Button>
            ) : (
              <Button 
                onClick={stopListening}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              variant="outline"
              disabled={isListening || isProcessing}
            >
              Close
            </Button>
          </div>

          {/* Voice Commands Help */}
          <div className="text-xs text-muted-foreground text-center">
            <p className="mb-1">Try saying:</p>
            <p>"Navigate to inventory" • "Show me the dashboard"</p>
            <p>"Emergency alert" • "Status report"</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceControl;