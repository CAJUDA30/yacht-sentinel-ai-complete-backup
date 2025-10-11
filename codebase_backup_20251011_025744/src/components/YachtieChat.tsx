import { useState, useEffect, useRef } from "react";
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff,
  User,
  Sparkles,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Ship,
  Package,
  Wrench,
  Brain,
  History,
  Settings,
  Upload,
  Eye
} from "lucide-react";
import { toast } from 'sonner';
import { useYachtieAI, useUserMemory, usePersonalizationProfile } from '@/hooks/useYachtieMemory';

interface ChatMessage {
  id: string;
  type: "user" | "yachtie";
  content: string;
  timestamp: string;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    type: "primary" | "secondary";
    icon?: any;
    onClick?: () => void;
  }>;
  memory_context?: any[];
  confidence?: number;
  processing_time?: number;
}

interface MemoryInsight {
  memory: any;
  similarity_score: number;
  relevance_context: string;
}

const YachtieChat = () => {
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [sessionId] = useState(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [memoryInsights, setMemoryInsights] = useState<MemoryInsight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Yachtie AI hooks
  const { chatWithYachtie, isProcessing } = useYachtieAI();
  const { memories, searchMemories, loadMemories } = useUserMemory();
  const { profile } = usePersonalizationProfile();

  const handleSendMessage = async () => {
    if (!message.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");

    try {
      // Search for related memories
      const relatedMemories = await searchMemories(currentMessage, 3);
      setMemoryInsights(relatedMemories);

      // Get response from Yachtie
      const response = await chatWithYachtie(currentMessage, {
        session_id: sessionId
      });

      // Process the response based on Yachtie's capabilities
      let yachtieContent = "I understand your request. Let me help you with that based on your history and current yacht status.";
      let suggestions: string[] = [];
      let actions: any[] = [];
      
      if (response.success) {
        if (response.routing_decision) {
          yachtieContent = `I can help with that! Based on your request, I think this relates to **${response.routing_decision.target_module}** (${(response.routing_decision.confidence * 100).toFixed(1)}% confidence). ${response.routing_decision.reasoning}`;
        }
        
        if (response.recommendations) {
          suggestions = response.recommendations.slice(0, 4);
        }
        
        if (response.extracted_data) {
          actions.push({
            label: "View Details",
            type: "secondary" as const,
            icon: Eye,
            onClick: () => {
              setActiveTab('details');
              toast.success('Details panel opened');
            }
          });
        }
      }

      // Add contextual suggestions based on user query
      if (currentMessage.toLowerCase().includes('scan')) {
        suggestions.push("Open camera scanner", "Upload an image");
        actions.push({
          label: "Start Scan",
          type: "primary" as const,
          icon: Upload,
          onClick: () => {
            toast.success('Scanner would open here');
          }
        });
      }

      if (currentMessage.toLowerCase().includes('maintenance')) {
        suggestions.push("Show maintenance schedule", "Check equipment status");
        actions.push({
          label: "Maintenance Dashboard",
          type: "secondary" as const,
          icon: Wrench,
          onClick: () => {
            toast.success('Maintenance dashboard would open');
          }
        });
      }

      if (currentMessage.toLowerCase().includes('inventory')) {
        suggestions.push("Check stock levels", "Add new item", "View recent additions");
        actions.push({
          label: "Inventory Overview",
          type: "secondary" as const,
          icon: Package,
          onClick: () => {
            toast.success('Inventory overview would open');
          }
        });
      }

      const yachtieResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "yachtie",
        content: yachtieContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: suggestions.length > 0 ? suggestions : [
          "Tell me more",
          "Show related information",
          "What's next?"
        ],
        actions: actions,
        memory_context: relatedMemories,
        confidence: response.routing_decision?.confidence,
        processing_time: response.processing_time_ms
      };
      
      setMessages(prev => [...prev, yachtieResponse]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "yachtie",
        content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment. In the meantime, you can use the manual functions or contact support if this persists.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          "Try again",
          "Use manual mode",
          "Contact support"
        ]
      };
      
      setMessages(prev => [...prev, errorResponse]);
      toast.error('Failed to get response from Yachtie');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // In a real app, this would start/stop speech recognition
  };

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
                  <Bot className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Yachtie AI Assistant
                </h1>
                <p className="text-muted-foreground">
                  Your intelligent yacht management companion
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-sm">
              <Sparkles className="h-4 w-4 mr-1" />
              AI Powered
            </Badge>
            <Badge variant="outline" className="text-sm">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              Online
            </Badge>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat with Yachtie</span>
              </span>
              <Badge variant="secondary" className="text-xs">
                GPT-4 Powered
              </Badge>
            </CardTitle>
            <CardDescription>
              Ask questions, get insights, and manage your yacht with AI assistance
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-xs md:max-w-md ${msg.type === "user" ? "order-2" : "order-1"}`}>
                    <div
                      className={`p-4 rounded-lg ${
                        msg.type === "user"
                          ? "bg-primary text-primary-foreground shadow-neumorphic"
                          : "bg-muted/50 text-foreground shadow-neumorphic-inset"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    
                    <div className={`flex items-center mt-2 space-x-2 ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`flex items-center space-x-1 ${msg.type === "user" ? "order-2" : "order-1"}`}>
                        {msg.type === "user" ? (
                          <User className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary-glow" />
                        )}
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {msg.suggestions && msg.type === "yachtie" && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground">Suggested responses:</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {msg.actions && msg.type === "yachtie" && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground">Quick actions:</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant={action.type === "primary" ? "captain" : "outline"}
                              size="sm"
                              className="text-xs"
                            >
                              {action.icon && <action.icon className="h-3 w-3 mr-1" />}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-border/50 p-6">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask Yachtie anything about your yacht..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-background/50 backdrop-blur-sm border-border/50"
                  />
                </div>
                
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleListening}
                  className={isListening ? "animate-pulse" : ""}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleSuggestionClick("What's my fuel status?")}>
                  <Ship className="h-3 w-3 mr-1" />
                  Fuel Status
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleSuggestionClick("Show maintenance schedule")}>
                  <Wrench className="h-3 w-3 mr-1" />
                  Maintenance
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleSuggestionClick("Check inventory levels")}>
                  <Package className="h-3 w-3 mr-1" />
                  Inventory
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleSuggestionClick("What's the weather forecast?")}>
                  <Clock className="h-3 w-3 mr-1" />
                  Weather
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="p-3 bg-primary-glow/10 rounded-lg mx-auto w-fit mb-3">
                <Sparkles className="h-6 w-6 text-primary-glow" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Predictive Analytics</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered insights for maintenance, fuel consumption, and operational efficiency.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="p-3 bg-accent/20 rounded-lg mx-auto w-fit mb-3">
                <MessageCircle className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Natural Language</h3>
              <p className="text-sm text-muted-foreground">
                Communicate naturally with voice commands and conversational queries.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="p-3 bg-secondary/30 rounded-lg mx-auto w-fit mb-3">
                <CheckCircle className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Smart Automation</h3>
              <p className="text-sm text-muted-foreground">
                Automated ordering, scheduling, and system monitoring with intelligent alerts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default YachtieChat;