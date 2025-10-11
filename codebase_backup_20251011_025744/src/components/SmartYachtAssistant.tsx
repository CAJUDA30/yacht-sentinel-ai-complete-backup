import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Send, Mic, MicOff, Zap, Brain, User, Calendar, Navigation, Wrench, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
  actions?: AssistantAction[];
  confidence?: number;
}

interface AssistantAction {
  type: 'navigate' | 'execute' | 'schedule' | 'alert';
  label: string;
  action: string;
  data?: any;
}

interface YachtContext {
  location?: string;
  weather?: any;
  crew?: any[];
  equipment?: any[];
  schedule?: any[];
  alerts?: any[];
}

const SmartYachtAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [yachtContext, setYachtContext] = useState<YachtContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your Smart Yacht Assistant. I can help you with navigation, crew management, maintenance scheduling, safety protocols, and much more. How can I assist you today?",
      timestamp: new Date(),
      actions: [
        { type: 'navigate', label: 'Check Weather', action: 'weather', data: { module: 'navigation' } },
        { type: 'execute', label: 'Equipment Status', action: 'equipment_check', data: { module: 'maintenance' } },
        { type: 'schedule', label: 'Crew Schedule', action: 'crew_schedule', data: { module: 'crew' } }
      ]
    }]);

    loadYachtContext();
    scrollToBottom();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadYachtContext = async () => {
    try {
      // Load current yacht context for better AI responses
      const [crewData, equipmentData, weatherData] = await Promise.all([
        supabase.from('crew_members').select('*').limit(5),
        supabase.from('equipment').select('*').eq('status', 'active').limit(10),
        // Mock weather data - would integrate with real weather API
        Promise.resolve({ data: [{ temperature: 24, wind: 12, conditions: 'Clear' }] })
      ]);

      setYachtContext({
        crew: crewData.data || [],
        equipment: equipmentData.data || [],
        weather: weatherData.data?.[0],
        location: 'Mediterranean Sea', // Would get from GPS/navigation system
        alerts: [] // Would get from monitoring systems
      });
    } catch (error) {
      console.error('Error loading yacht context:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send to enhanced AI processor with yacht context
      const { data, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
        body: {
          type: 'yacht_assistant',
          content: input,
          context: {
            ...yachtContext,
            conversation_history: messages.slice(-5), // Last 5 messages for context
            user_intent: 'yacht_management',
            modules: ['navigation', 'crew', 'maintenance', 'safety', 'operations']
          },
          specialized_mode: true,
          enable_actions: true
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || data.consensus?.final_answer || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date(),
        confidence: data.consensus?.confidence || data.confidence,
        actions: data.suggested_actions || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Execute any automatic actions if confidence is high
      if (data.automatic_actions && data.consensus?.confidence > 0.85) {
        executeActions(data.automatic_actions);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const executeActions = async (actions: AssistantAction[]) => {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'navigate':
            // Handle navigation actions
            toast.success(`Navigating to ${action.label}`);
            break;
          case 'execute':
            // Handle system executions
            toast.success(`Executing ${action.label}`);
            break;
          case 'schedule':
            // Handle scheduling actions
            toast.success(`Scheduling ${action.label}`);
            break;
          case 'alert':
            // Handle alert actions
            toast.info(action.label);
            break;
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error);
      }
    }
  };

  const handleActionClick = (action: AssistantAction) => {
    executeActions([action]);
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      toast.success('Voice recognition started - speak now');
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      setIsListening(false);
      toast.error('Voice recognition error: ' + event.error);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const getContextualSuggestions = () => {
    const suggestions = [
      "What's the current weather forecast for our route?",
      "Show me today's crew schedule",
      "Check equipment maintenance status",
      "Any safety alerts I should know about?",
      "Plan the most efficient route to our next destination",
      "Schedule maintenance for the main engine"
    ];

    return suggestions.slice(0, 3); // Show 3 random suggestions
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/yacht-ai-avatar.png" />
                <AvatarFallback>
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Smart Yacht Assistant
                  <Badge variant="default" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    AI Powered
                  </Badge>
                </CardTitle>
                <CardDescription>Your intelligent yacht management companion</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{yachtContext.location || 'Unknown Location'}</Badge>
              {yachtContext.weather && (
                <Badge variant="outline">{yachtContext.weather.temperature}°C</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'assistant' && (
                        <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      {message.type === 'user' && (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        
                        {message.confidence && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              Confidence: {Math.round(message.confidence * 100)}%
                            </Badge>
                          </div>
                        )}

                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium">Suggested Actions:</p>
                            <div className="flex flex-wrap gap-2">
                              {message.actions.map((action, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleActionClick(action)}
                                  className="text-xs"
                                >
                                  {action.type === 'navigate' && <Navigation className="h-3 w-3 mr-1" />}
                                  {action.type === 'execute' && <Zap className="h-3 w-3 mr-1" />}
                                  {action.type === 'schedule' && <Calendar className="h-3 w-3 mr-1" />}
                                  {action.type === 'alert' && <Shield className="h-3 w-3 mr-1" />}
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Quick suggestions when no messages */}
          {messages.length <= 1 && (
            <div className="p-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {getContextualSuggestions().map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about yacht management..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                variant="outline"
                disabled={isLoading}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartYachtAssistant;