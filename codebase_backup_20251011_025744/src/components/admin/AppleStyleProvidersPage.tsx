import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Building2, 
  Plus, 
  Settings, 
  RefreshCw, 
  Search, 
  Filter,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Zap,
  Shield,
  Globe,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  TestTube,
  Wifi,
  WifiOff,
  Star,
  Copy,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

import { useAIProviderManagement } from '@/hooks/useAIProviderManagement';
import { useToast } from '@/hooks/use-toast';
import { AIProvider } from '@/types/ai-providers';

interface AppleStyleProvidersPageProps {
  className?: string;
}

// Apple-style status indicator
const AppleStatusIndicator = ({ status, pulse = false }: { 
  status: 'healthy' | 'degraded' | 'error' | 'unknown'; 
  pulse?: boolean;
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return { color: 'bg-green-500', ring: 'ring-green-200' };
      case 'degraded':
        return { color: 'bg-yellow-500', ring: 'ring-yellow-200' };
      case 'error':
        return { color: 'bg-red-500', ring: 'ring-red-200' };
      default:
        return { color: 'bg-gray-400', ring: 'ring-gray-200' };
    }
  };

  const { color, ring } = getStatusConfig();

  return (
    <div className={`relative w-3 h-3 ${color} rounded-full ${pulse ? 'animate-pulse' : ''}`}>
      <div className={`absolute inset-0 rounded-full ${ring} ring-2 opacity-75`}></div>
    </div>
  );
};

// Apple-style metric card
const AppleMetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = 'blue',
  onClick
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  onClick?: () => void;
}) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/10 border-blue-200/50',
    green: 'from-green-500/10 to-green-600/10 border-green-200/50',
    orange: 'from-orange-500/10 to-orange-600/10 border-orange-200/50',
    purple: 'from-purple-500/10 to-purple-600/10 border-purple-200/50',
    gray: 'from-gray-500/10 to-gray-600/10 border-gray-200/50'
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  };

  return (
    <div 
      className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 cursor-pointer group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] backdrop-blur-sm`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-3 h-3" />
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        <div className={`p-3 bg-white/60 rounded-xl ${iconColors[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Apple-style provider card
const AppleProviderCard = ({ 
  provider, 
  onConfigure, 
  onToggle,
  onTest,
  onDelete 
}: {
  provider: AIProvider;
  onConfigure: () => void;
  onToggle: () => void;
  onTest: () => void;
  onDelete: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getProviderIcon = () => {
    switch (provider.provider_type?.toLowerCase()) {
      case 'openai': return '🤖';
      case 'anthropic': return '🧠';
      case 'google': return '🌟';
      case 'azure': return '☁️';
      case 'cohere': return '🔮';
      default: return '⚡';
    }
  };

  return (
    <div 
      className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-2xl transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                {getProviderIcon()}
              </div>
              <AppleStatusIndicator 
                status={provider.is_active ? 'healthy' : 'unknown'} 
                pulse={provider.is_active}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-1">{provider.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{provider.provider_type} Provider</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              {isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-gray-50/80 rounded-xl backdrop-blur-sm">
            <div className="text-lg font-bold text-gray-900">
              {provider.capabilities?.length || 0}
            </div>
            <div className="text-xs text-gray-600">Capabilities</div>
          </div>
          <div className="text-center p-3 bg-gray-50/80 rounded-xl backdrop-blur-sm">
            <div className="text-lg font-bold text-green-600">99.2%</div>
            <div className="text-xs text-gray-600">Uptime</div>
          </div>
          <div className="text-center p-3 bg-gray-50/80 rounded-xl backdrop-blur-sm">
            <div className="text-lg font-bold text-blue-600">245ms</div>
            <div className="text-xs text-gray-600">Response</div>
          </div>
        </div>

        {/* Capabilities badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {provider.capabilities?.slice(0, 3).map((capability, index) => (
            <Badge 
              key={index}
              variant="secondary" 
              className="text-xs bg-gray-100/80 text-gray-700 border-0 rounded-full px-3 py-1"
            >
              {capability}
            </Badge>
          ))}
          {provider.capabilities && provider.capabilities.length > 3 && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-gray-100/80 text-gray-700 border-0 rounded-full px-3 py-1"
            >
              +{provider.capabilities.length - 3} more
            </Badge>
          )}
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-200/60 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(provider.created_at).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Auth Method:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">
                  {provider.auth_method?.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <Progress value={75} className="h-2 bg-gray-200/60" />
            <div className="text-xs text-gray-500">Usage: 75% of monthly quota</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 mt-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={provider.is_active || false}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-green-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onTest}
              className="h-8 px-3 text-xs font-medium rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <TestTube className="w-3 h-3 mr-1" />
              Test
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onConfigure}
              className="h-8 px-3 text-xs font-medium rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <Settings className="w-3 h-3 mr-1" />
              Configure
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 px-3 text-xs font-medium rounded-full hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AppleStyleProvidersPage: React.FC<AppleStyleProvidersPageProps> = ({ className }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const {
    providers,
    activeProviders,
    isLoading,
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider,
    syncProviderHealth
  } = useAIProviderManagement();

  // New provider form state
  const [newProvider, setNewProvider] = useState({
    name: '',
    provider_type: '',
    api_endpoint: '',
    auth_method: 'api_key' as 'api_key' | 'oauth' | 'service_account',
    api_key: '',
    capabilities: [] as string[],
    is_active: true
  });

  const handleCreateProvider = async () => {
    try {
      if (!newProvider.name || !newProvider.provider_type || !newProvider.api_endpoint) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      await createProvider.mutateAsync({
        name: newProvider.name,
        provider_type: newProvider.provider_type,
        auth_method: newProvider.auth_method,
        capabilities: newProvider.capabilities as any,
        is_active: newProvider.is_active,
        config: {
          endpoints: {
            chat: newProvider.api_endpoint,
            test: newProvider.api_endpoint
          },
          auth: {
            header_name: 'Authorization',
            token_prefix: 'Bearer',
            secret_name: newProvider.api_key
          },
          defaults: {
            temperature: 0.7,
            max_tokens: 2000,
            timeout: 30000,
            max_retries: 3
          },
          features: {
            streaming: false,
            function_calling: false,
            vision: false,
            embeddings: false,
            fine_tuning: false
          }
        }
      });

      toast({
        title: 'Provider Created Successfully ✨',
        description: `${newProvider.name} has been added to your AI operations`
      });

      setShowAddProvider(false);
      setNewProvider({
        name: '',
        provider_type: '',
        api_endpoint: '',
        auth_method: 'api_key',
        api_key: '',
        capabilities: [],
        is_active: true
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Create Provider',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  const filteredProviders = providers.data?.filter(provider => {
    const matchesSearch = provider.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.provider_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'active' && provider.is_active) ||
                         (selectedFilter === 'inactive' && !provider.is_active) ||
                         (selectedFilter === provider.provider_type);
    
    return matchesSearch && matchesFilter;
  }) || [];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 ${className}`}>
      {/* Header */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/50"></div>
        <div className="relative px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">AI Providers</h1>
              <p className="text-lg text-gray-600">Connect and manage your artificial intelligence services</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncProviderHealth.mutate()}
                disabled={isLoading}
                className="rounded-full border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AppleMetricCard
            title="Total Providers"
            value={providers.data?.length || 0}
            subtitle="Connected services"
            icon={Building2}
            color="blue"
          />
          <AppleMetricCard
            title="Active Providers"
            value={activeProviders.length}
            subtitle="Currently operational"
            icon={Activity}
            color="green"
          />
          <AppleMetricCard
            title="Success Rate"
            value="99.2%"
            subtitle="Last 30 days"
            icon={TrendingUp}
            trend={{ value: 2.3, isPositive: true }}
            color="purple"
          />
          <AppleMetricCard
            title="Monthly Cost"
            value="$342.75"
            subtitle="Current billing cycle"
            icon={DollarSign}
            trend={{ value: -12.5, isPositive: true }}
            color="orange"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 w-80 h-12 text-base border-gray-300 rounded-2xl focus:border-blue-500 focus:ring-blue-500/20 bg-white/80 backdrop-blur-sm"
              />
            </div>
            
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-48 h-12 border-gray-300 rounded-2xl bg-white/80 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="azure">Azure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 rounded-2xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                <Plus className="w-5 h-5 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl border-0 shadow-2xl">
              <DialogHeader className="pb-6">
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  Add New AI Provider
                </DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  Connect a new AI service to expand your capabilities. Configure endpoints, authentication, and features.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Provider Name</Label>
                    <Input
                      value={newProvider.name}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Custom OpenAI"
                      className="h-12 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Provider Type</Label>
                    <Select
                      value={newProvider.provider_type}
                      onValueChange={(value) => setNewProvider(prev => ({ ...prev, provider_type: value }))}
                    >
                      <SelectTrigger className="h-12 border-gray-300 rounded-xl">
                        <SelectValue placeholder="Select provider type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="azure">Azure OpenAI</SelectItem>
                        <SelectItem value="google">Google AI</SelectItem>
                        <SelectItem value="cohere">Cohere</SelectItem>
                        <SelectItem value="custom">Custom Provider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* API Configuration */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">API Endpoint</Label>
                    <Input
                      value={newProvider.api_endpoint}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, api_endpoint: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                      className="h-12 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Authentication</Label>
                      <Select
                        value={newProvider.auth_method}
                        onValueChange={(value: 'api_key' | 'oauth' | 'service_account') => 
                          setNewProvider(prev => ({ ...prev, auth_method: value }))}
                      >
                        <SelectTrigger className="h-12 border-gray-300 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api_key">API Key</SelectItem>
                          <SelectItem value="oauth">OAuth 2.0</SelectItem>
                          <SelectItem value="service_account">Service Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">API Key</Label>
                      <Input
                        type="password"
                        value={newProvider.api_key}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, api_key: e.target.value }))}
                        placeholder="Enter your API key"
                        className="h-12 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Capabilities */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Capabilities</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['text-generation', 'chat-completion', 'embeddings', 'image-generation', 'vision', 'function-calling'].map((capability) => (
                      <div key={capability} className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                        <input
                          type="checkbox"
                          id={capability}
                          checked={newProvider.capabilities.includes(capability)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProvider(prev => ({ 
                                ...prev, 
                                capabilities: [...prev.capabilities, capability] 
                              }));
                            } else {
                              setNewProvider(prev => ({ 
                                ...prev, 
                                capabilities: prev.capabilities.filter(c => c !== capability) 
                              }));
                            }
                          }}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Label htmlFor={capability} className="text-sm font-medium text-gray-700 capitalize cursor-pointer">
                          {capability.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button 
                  onClick={handleCreateProvider} 
                  disabled={!newProvider.name || !newProvider.provider_type || !newProvider.api_endpoint || createProvider.isPending}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                >
                  {createProvider.isPending ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create Provider
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddProvider(false)}
                  className="h-12 px-6 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Providers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white/60 rounded-2xl p-6 border border-gray-200/60">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <AppleProviderCard
                key={provider.id}
                provider={provider}
                onConfigure={() => {
                  toast({
                    title: 'Configuration',
                    description: `Opening configuration for ${provider.name}...`
                  });
                }}
                onToggle={() => {
                  updateProvider.mutate({
                    id: provider.id,
                    updates: { is_active: !provider.is_active }
                  });
                  toast({
                    title: 'Provider Updated',
                    description: `${provider.name} has been ${provider.is_active ? 'disabled' : 'enabled'}`
                  });
                }}
                onTest={() => {
                  testProvider.mutate(provider);
                  toast({
                    title: 'Testing Provider',
                    description: `Running connection test for ${provider.name}...`
                  });
                }}
                onDelete={() => {
                  if (confirm(`Are you sure you want to delete ${provider.name}?`)) {
                    deleteProvider.mutate(provider.id);
                    toast({
                      title: 'Provider Deleted',
                      description: `${provider.name} has been removed`,
                      variant: 'destructive'
                    });
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mb-6">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Providers Found</h3>
            <p className="text-gray-600 text-center max-w-md mb-8">
              {searchQuery ? 
                'No providers match your search criteria. Try adjusting your filters or search terms.' :
                'Get started by connecting your first AI provider to unlock powerful capabilities.'
              }
            </p>
            <Button 
              onClick={() => setShowAddProvider(true)}
              className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-8 py-3 font-medium transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Provider
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};