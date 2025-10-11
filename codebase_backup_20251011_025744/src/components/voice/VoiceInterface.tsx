import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Trash2,
  Radio
} from 'lucide-react';
import { useRealtimeVoiceChat } from '@/hooks/useRealtimeVoiceChat';
import { useToast } from '@/components/ui/use-toast';

interface VoiceInterfaceProps {
  className?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ className }) => {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState('');
  
  const {
    messages,
    isConnected,
    isListening,
    isSpeaking,
    connect,
    disconnect,
    sendTextMessage,
    clearMessages,
    toggleListening
  } = useRealtimeVoiceChat();

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Voice Chat Connected",
        description: "You can now speak with Yachtie AI assistant",
      });
    } catch (error) {
      console.error('Voice connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to voice chat",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Voice Chat Disconnected",
      description: "Voice session ended",
    });
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      sendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'user_transcript': return 'bg-blue-100 dark:bg-blue-900/20';
      case 'assistant_transcript': return 'bg-green-100 dark:bg-green-900/20';
      case 'system': return 'bg-gray-100 dark:bg-gray-900/20';
      default: return 'bg-white dark:bg-gray-800';
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'user_transcript': return 'You';
      case 'assistant_transcript': return 'Yachtie AI';
      case 'system': return 'System';
      default: return 'Unknown';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Voice Assistant
          {isConnected && (
            <Badge variant={isSpeaking ? 'default' : 'secondary'}>
              {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Connected'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button onClick={handleConnect} className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Connect Voice Chat
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleListening}
                variant={isListening ? 'default' : 'outline'}
                size="sm"
              >
                {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
              <Button
                onClick={clearMessages}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Status Indicators */}
        {isConnected && (
          <div className="flex gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isListening ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {isListening ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
              {isListening ? 'Listening' : 'Muted'}
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isSpeaking ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 
              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {isSpeaking ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              {isSpeaking ? 'Speaking' : 'Quiet'}
            </div>
          </div>
        )}

        {/* Text Input for Manual Messages */}
        {isConnected && (
          <div className="flex gap-2">
            <Input
              placeholder="Type a message to Yachtie..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
              className="flex-1"
            />
            <Button onClick={handleSendText} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Messages Display */}
        <ScrollArea className="h-64 border rounded-lg">
          <div className="p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {isConnected ? 'Start speaking or type a message' : 'Connect to start voice chat'}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-2 rounded-lg ${getMessageTypeColor(message.type)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getMessageTypeLabel(message.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm">{message.content}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Help Information */}
        {!isConnected && (
          <Alert>
            <Radio className="h-4 w-4" />
            <AlertDescription>
              Connect to start voice conversations with Yachtie AI. You can speak naturally 
              about yacht operations, maintenance, navigation, and crew management.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};