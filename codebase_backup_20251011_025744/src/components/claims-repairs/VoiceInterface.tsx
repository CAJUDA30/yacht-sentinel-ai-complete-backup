import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeVoiceChat } from '@/hooks/useRealtimeVoiceChat';
import { 
  Mic, 
  MicOff, 
  MessageSquare, 
  Phone, 
  PhoneOff, 
  Send, 
  Volume2,
  VolumeX,
  Bot,
  User,
  Zap
} from 'lucide-react';

export const VoiceInterface: React.FC = () => {
  const { toast } = useToast();
  const [textInput, setTextInput] = useState('');
  const {
    isConnected,
    isRecording,
    isSpeaking,
    messages,
    currentTranscript,
    error,
    connect,
    disconnect,
    sendTextMessage
  } = useRealtimeVoiceChat();

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Connected",
        description: "Voice interface is ready for Claims & Repairs assistance",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to connect to voice chat',
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Disconnected",
      description: "Voice chat session ended",
    });
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      sendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Voice Assistant for Claims & Repairs
          </CardTitle>
          <CardDescription>
            Speak naturally to get help with repair jobs, equipment diagnostics, inventory management, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
                {isConnected ? <Phone className="h-3 w-3" /> : <PhoneOff className="h-3 w-3" />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              
              {/* Recording Status */}
              {isConnected && (
                <Badge variant={isRecording ? "destructive" : "outline"} className="flex items-center gap-1">
                  {isRecording ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  {isRecording ? 'Listening' : 'Idle'}
                </Badge>
              )}
              
              {/* Speaking Status */}
              {isConnected && (
                <Badge variant={isSpeaking ? "default" : "outline"} className="flex items-center gap-1">
                  {isSpeaking ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  {isSpeaking ? 'Speaking' : 'Silent'}
                </Badge>
              )}
            </div>
            
            {/* Connection Controls */}
            <div className="flex gap-2">
              {!isConnected ? (
                <Button onClick={handleConnect} className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Start Voice Chat
                </Button>
              ) : (
                <Button onClick={handleDisconnect} variant="destructive" className="flex items-center gap-2">
                  <PhoneOff className="h-4 w-4" />
                  End Call
                </Button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4 pr-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={`flex-1 max-w-xs md:max-w-md lg:max-w-lg ${
                    message.type === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.isTranscript && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Transcript
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Current transcript preview */}
              {currentTranscript && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-3 rounded-lg bg-muted border-2 border-dashed border-primary/30">
                      <p className="text-sm text-muted-foreground">{currentTranscript}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        Speaking...
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {messages.length === 0 && !currentTranscript && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation to get help with Claims & Repairs</p>
                  <p className="text-sm mt-1">You can speak directly or type a message below</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Text Input */}
      {isConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message or speak directly..."
                disabled={!isConnected}
                className="flex-1"
              />
              <Button 
                onClick={handleSendText} 
                disabled={!textInput.trim() || !isConnected}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send • Voice detection is automatic when connected
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What can I help you with?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="text-sm">
              <p className="font-medium mb-1">🔧 Repair Jobs</p>
              <p className="text-muted-foreground">Create, track, and manage repair jobs</p>
            </div>
            <div className="text-sm">
              <p className="font-medium mb-1">📊 Equipment Status</p>
              <p className="text-muted-foreground">Check equipment health and diagnostics</p>
            </div>
            <div className="text-sm">
              <p className="font-medium mb-1">📦 Inventory</p>
              <p className="text-muted-foreground">Check stock levels and parts availability</p>
            </div>
            <div className="text-sm">
              <p className="font-medium mb-1">👥 Crew Management</p>
              <p className="text-muted-foreground">Assign tasks and coordinate teams</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};