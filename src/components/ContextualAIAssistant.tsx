import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Brain, 
  Lightbulb,
  X,
  MessageCircle,
  Zap
} from 'lucide-react';
import { useContextualAI } from '@/contexts/ContextualAIContext';
import { useLocation } from 'react-router-dom';

interface ContextualAIAssistantProps {
  module: string;
  isOpen: boolean;
  onClose: () => void;
}

const ContextualAIAssistant: React.FC<ContextualAIAssistantProps> = ({ 
  module, 
  isOpen, 
  onClose 
}) => {
  const [query, setQuery] = useState('');
  const [currentContext, setCurrentContext] = useState<any>({});
  const location = useLocation();
  
  const {
    activeAssistant,
    aiResponses,
    isProcessing,
    setActiveAssistant,
    askAI,
    getModuleAssistant
  } = useContextualAI();

  // Set the assistant when component mounts or module changes
  useEffect(() => {
    const assistant = getModuleAssistant(module);
    setActiveAssistant(assistant);
    
    // Set context based on current location and module
    setCurrentContext({
      currentPage: location.pathname,
      module,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
  }, [module, location.pathname, getModuleAssistant, setActiveAssistant]);

  const handleSendQuery = async () => {
    if (!query.trim() || isProcessing) return;
    
    const userQuery = query;
    setQuery('');
    
    await askAI(userQuery, currentContext);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const handleActionClick = async (action: any) => {
    await askAI(`Execute action: ${action.label}`, {
      ...currentContext,
      action: action
    });
  };

  const getQuickSuggestions = () => {
    const suggestions: Record<string, string[]> = {
      inventory: [
        "What items are running low on stock?",
        "Suggest optimal reorder quantities",
        "Analyze inventory costs this month",
        "Show me expired items"
      ],
      crew: [
        "Who is on duty today?",
        "Check certification status",
        "Optimize crew scheduling",
        "Review performance metrics"
      ],
      maintenance: [
        "What maintenance is due?",
        "Predict upcoming failures",
        "Show critical alerts",
        "Generate maintenance report"
      ],
      finance: [
        "Analyze this month's expenses",
        "Identify cost savings opportunities",
        "Budget vs actual comparison",
        "Forecast next quarter"
      ],
      navigation: [
        "Optimize route to destination",
        "Check weather conditions",
        "Calculate fuel efficiency",
        "Assess navigation risks"
      ],
      safety: [
        "Run safety compliance check",
        "Review emergency procedures",
        "Assess current risk levels",
        "Update safety protocols"
      ]
    };
    
    return suggestions[module] || suggestions.inventory;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-end p-4">
      <Card className="w-full max-w-md h-[70vh] bg-card/95 backdrop-blur border-primary/20 shadow-glow flex flex-col">
        {/* Header */}
        <CardHeader className="flex-shrink-0 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              {activeAssistant?.name || 'AI Assistant'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {activeAssistant && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {activeAssistant.module}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {Math.round(activeAssistant.confidence * 100)}% confident
              </Badge>
            </div>
          )}
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-hidden flex flex-col p-4 pt-0">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {aiResponses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                <p className="text-sm">
                  I'm {activeAssistant?.name}, your {module} specialist.
                </p>
                <p className="text-xs mt-1">
                  Ask me anything about {module} management!
                </p>
              </div>
            ) : (
              aiResponses.map((response) => (
                <div key={response.id} className="space-y-2">
                  {/* AI Response */}
                  <div className="bg-primary/10 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{response.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(response.confidence * 100)}% confident
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(response.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {response.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {response.suggestions.slice(0, 3).map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="h-auto text-xs py-1 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Lightbulb className="w-3 h-3 mr-1" />
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {response.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {response.actions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleActionClick(action)}
                          className="h-auto text-xs py-1 px-3"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Suggestions */}
          {aiResponses.length === 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
              <div className="grid grid-cols-1 gap-1">
                {getQuickSuggestions().slice(0, 3).map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="h-auto text-xs py-2 px-3 text-left justify-start text-muted-foreground hover:text-foreground"
                  >
                    <MessageCircle className="w-3 h-3 mr-2" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask ${activeAssistant?.name || 'AI'} anything...`}
              className="resize-none min-h-[40px] max-h-[80px]"
              disabled={isProcessing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuery();
                }
              }}
            />
            <Button
              onClick={handleSendQuery}
              disabled={!query.trim() || isProcessing}
              size="sm"
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContextualAIAssistant;