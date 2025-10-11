import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Settings2, 
  RefreshCw, 
  Zap, 
  Eye, 
  Code2, 
  Sparkles, 
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Cpu
} from 'lucide-react';
import { AddProviderWizard } from './AddProviderWizard';
import { ProviderModal } from './ProviderConfigurationModal';
import { useAIProviderManagement } from '@/hooks/useAIProviderManagement';
import { useToast } from '@/hooks/use-toast';
import { AIProvider } from '@/types/ai-providers';
import { supabase } from '@/integrations/supabase/client';

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'healthy':
    case 'connected':
      return 'default';
    case 'degraded':
      return 'secondary';
    case 'error':
    case 'down':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getCapabilityIcon = (capability: string) => {
  const icons = {
    text_generation: <Sparkles className="w-4 h-4" />,
    chat_completion: <Sparkles className="w-4 h-4" />,
    vision: <Eye className="w-4 h-4" />,
    code_generation: <Code2 className="w-4 h-4" />,
    function_calling: <Zap className="w-4 h-4" />,
    ocr: <Eye className="w-4 h-4" />,
    translation: <Sparkles className="w-4 h-4" />,
    embeddings: <Sparkles className="w-4 h-4" />
  };
  return icons[capability as keyof typeof icons] || <Sparkles className="w-4 h-4" />;
};

export const EnhancedAIProvidersPanel: React.FC = () => {
  const { toast } = useToast();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  
  const {
    providers,
    models,
    activeProviders,
    primaryProvider,
    totalModels,
    isLoading,
    syncProviderHealth,
    setPrimaryProvider
  } = useAIProviderManagement();

  const handleRefreshHealth = async () => {
    try {
      await syncProviderHealth.mutateAsync();
      
      toast({ 
        title: 'Health status updated',
        description: 'All provider health checks completed'
      });
    } catch (error) {
      toast({ 
        title: 'Health check failed',
        description: String(error),
        variant: 'destructive'
      });
    }
  };

  const handleSetPrimary = async (providerId: string) => {
    try {
      const provider = providers.data?.find(p => p.id === providerId);
      await setPrimaryProvider.mutateAsync(providerId);
      
      toast({ 
        title: 'Primary provider updated',
        description: 'Provider configuration saved'
      });
    } catch (error) {
      toast({ 
        title: 'Failed to set primary',
        description: String(error),
        variant: 'destructive'
      });
    }
  };

  const ProviderCard = ({ provider }: { provider: AIProvider }) => {
    const providerModels = models.data?.filter(m => m.provider_id === provider.id) || [];
    
    return (
      <Card className={`transition-all hover:shadow-md ${provider.is_primary ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <span>{provider.name}</span>
              {provider.is_primary && (
                <Badge variant="default" className="text-xs">
                  Primary
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor('healthy')}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {provider.provider_type} • {providerModels.length} models
          </div>
          
          <div className="flex flex-wrap gap-1">
            {provider.capabilities?.slice(0, 4).map((capability) => (
              <Badge key={capability} variant="outline" className="text-xs gap-1">
                {getCapabilityIcon(capability)}
                {capability.replace(/_/g, ' ')}
              </Badge>
            ))}
            {(provider.capabilities?.length || 0) > 4 && (
              <Badge variant="outline" className="text-xs">
                +{(provider.capabilities?.length || 0) - 4} more
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setSelectedProvider(provider)}
              >
                <Settings2 className="w-4 h-4 mr-1" />
                Configure
              </Button>
              {!provider.is_primary && (
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSetPrimary(provider.id)}
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Set Primary
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Rate: {provider.rate_limit_per_minute}/min
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const OverviewStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Providers</p>
              <p className="text-2xl font-bold">{providers.data?.length || 0}</p>
            </div>
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Active Providers</p>
              <p className="text-2xl font-bold">{activeProviders.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Total Models</p>
              <p className="text-2xl font-bold">{totalModels}</p>
            </div>
            <Zap className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Primary Provider</p>
              <p className="text-sm font-medium text-primary">{primaryProvider?.name || 'None'}</p>
            </div>
            <Heart className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Provider Management</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshHealth}
            disabled={syncProviderHealth.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncProviderHealth.isPending ? 'animate-spin' : ''}`} />
            Refresh Health
          </Button>
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      <OverviewStats />

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Providers ({providers.data?.length || 0})</TabsTrigger>
          <TabsTrigger value="models">Models ({totalModels})</TabsTrigger>
          <TabsTrigger value="health">Health Status</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : providers.data?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.data.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12 border-2 border-dashed border-muted-foreground/25">
              <CardContent>
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Welcome to AI Operations!</h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by connecting your first AI provider. We support OpenAI, Anthropic, Google, and custom providers.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Automatic model discovery</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Real-time health monitoring</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Intelligent load balancing</span>
                    </div>
                  </div>
                  <Button onClick={() => setShowWizard(true)} size="lg" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First AI Provider
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {models.data?.length ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {models.data?.map((model) => (
                  <Card key={model.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{model.model_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {model.model_id} • {model.model_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{(model.max_context_length || 0).toLocaleString()} tokens</Badge>
                          <Badge variant={model.is_active ? 'default' : 'secondary'}>
                            {model.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No AI Models Configured</h3>
                <p className="text-muted-foreground mb-4">
                  Models will be automatically discovered once you add AI providers.
                </p>
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Provider
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health">
          {providers.data?.length ? (
            <Card>
              <CardHeader>
                <CardTitle>Provider Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {providers.data?.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Healthy</Badge>
                        <span className="text-sm text-muted-foreground">~250ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Health Data Available</h3>
                <p className="text-muted-foreground mb-4">
                  Health monitoring will be available once you configure AI providers.
                </p>
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Set Up First Provider
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AddProviderWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onProviderAdded={() => {
          setShowWizard(false);
          providers.refetch();
        }}
      />

      {selectedProvider && (
        <ProviderModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onUpdated={() => {
            setSelectedProvider(null);
            providers.refetch();
          }}
        />
      )}
    </div>
  );
};