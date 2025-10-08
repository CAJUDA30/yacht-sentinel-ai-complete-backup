import React, { useState, useEffect } from 'react';
import { 
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
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

import { MS365Layout, MS365LayoutContent } from '@/components/ui/microsoft365/ms365-layout';
import { MS365CommandBar } from '@/components/ui/microsoft365/ms365-command-bar';
import { MS365Card, MS365CardHeader, MS365CardTitle, MS365CardDescription, MS365CardContent, MS365CardActions } from '@/components/ui/microsoft365/ms365-card';
import { MS365Button } from '@/components/ui/microsoft365/ms365-button';
import { useAIProviderManagement } from '@/hooks/useAIProviderManagement';
import { useToast } from '@/hooks/use-toast';
import { AIProvider } from '@/types/ai-providers';

interface ProviderMetrics {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  costThisMonth: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
}

const mockMetrics: Record<string, ProviderMetrics> = {
  openai: {
    totalRequests: 12450,
    successRate: 98.7,
    avgResponseTime: 245,
    costThisMonth: 127.50,
    healthStatus: 'healthy'
  },
  anthropic: {
    totalRequests: 8920,
    successRate: 99.2,
    avgResponseTime: 189,
    costThisMonth: 89.20,
    healthStatus: 'healthy'
  },
  local: {
    totalRequests: 340,
    successRate: 94.1,
    avgResponseTime: 1240,
    costThisMonth: 0,
    healthStatus: 'degraded'
  }
};

const ProviderStatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', text: 'Healthy' };
      case 'degraded':
        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Degraded' };
      case 'critical':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Critical' };
      default:
        return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50', text: 'Unknown' };
    }
  };

  const { icon: Icon, color, bg, text } = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color} ${bg}`}>
      <Icon className="w-3 h-3" />
      {text}
    </div>
  );
};

const ProviderConfigurationPanel = ({ 
  provider, 
  onClose, 
  onSave 
}: { 
  provider: AIProvider; 
  onClose: () => void; 
  onSave: (provider: AIProvider) => void; 
}) => {
  const [config, setConfig] = useState(provider);
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <MS365Layout variant="masterDetail">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#323130]">Configure Provider</h2>
            <p className="text-sm text-[#605e5c] mt-1">{provider.name} settings and configuration</p>
          </div>
          <div className="flex gap-2">
            <MS365Button variant="standard" text="Cancel" onClick={onClose} />
            <MS365Button variant="primary" text="Save Changes" onClick={() => onSave(config)} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <MS365Card variant="standard">
            <MS365CardHeader>
              <MS365CardTitle>Basic Information</MS365CardTitle>
              <MS365CardDescription>
                Configure basic provider settings and metadata
              </MS365CardDescription>
            </MS365CardHeader>
            <MS365CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#323130] mb-2">Provider Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#8a8886] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#323130] mb-2">Provider Type</label>
                  <select
                    value={config.provider_type}
                    onChange={(e) => setConfig({ ...config, provider_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-[#8a8886] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                    <option value="local">Local</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
            </MS365CardContent>
          </MS365Card>

          {/* Authentication */}
          <MS365Card variant="standard">
            <MS365CardHeader>
              <MS365CardTitle>Authentication</MS365CardTitle>
              <MS365CardDescription>
                Configure API keys and authentication methods
              </MS365CardDescription>
            </MS365CardHeader>
            <MS365CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#323130] mb-2">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value="sk-..." 
                      className="w-full px-3 py-2 pr-10 border border-[#8a8886] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                      placeholder="Enter API key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#605e5c] hover:text-[#323130]"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#323130] mb-2">Base URL</label>
                  <input
                    type="text"
                    value={config.base_url || ''}
                    onChange={(e) => setConfig({ ...config, base_url: e.target.value })}
                    className="w-full px-3 py-2 border border-[#8a8886] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
              </div>
            </MS365CardContent>
          </MS365Card>

          {/* Rate Limiting */}
          <MS365Card variant="standard">
            <MS365CardHeader>
              <MS365CardTitle>Rate Limiting</MS365CardTitle>
              <MS365CardDescription>
                Configure request limits and throttling
              </MS365CardDescription>
            </MS365CardHeader>
            <MS365CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#323130] mb-2">Requests per Minute</label>
                  <input
                    type="number"
                    value={config.rate_limit_per_minute}
                    onChange={(e) => setConfig({ ...config, rate_limit_per_minute: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#8a8886] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#323130] mb-2">Priority</label>
                  <select
                    value={(config as any).priority || 5}
                    onChange={(e) => setConfig({ ...config, priority: parseInt(e.target.value) } as any)}
                    className="w-full px-3 py-2 border border-[#8a8886] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
                  >
                    <option value={1}>Low</option>
                    <option value={5}>Medium</option>
                    <option value={10}>High</option>
                  </select>
                </div>
              </div>
            </MS365CardContent>
          </MS365Card>
        </div>
      </div>
    </MS365Layout>
  );
};

export const MS365AIProvidersManager: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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

  const commandBarItems = [
    {
      key: 'new',
      text: 'New Provider',
      icon: <Plus className="w-4 h-4" />,
      primary: true,
      onClick: () => {
        toast({ title: 'Create Provider', description: 'Opening provider creation wizard...' });
      }
    },
    {
      key: 'refresh',
      text: 'Refresh',
      icon: <RefreshCw className="w-4 h-4" />,
      onClick: async () => {
        await syncProviderHealth.mutateAsync();
        toast({ title: 'Refreshed', description: 'Provider health status updated' });
      }
    },
    {
      key: 'filter',
      text: 'Filter',
      icon: <Filter className="w-4 h-4" />,
      onClick: () => {}
    }
  ];

  const farItems = [
    {
      key: 'settings',
      text: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => {}
    }
  ];

  const searchBox = (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#605e5c] w-4 h-4" />
      <input
        type="text"
        placeholder="Search providers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-[#8a8886] rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#0078d4] focus:border-transparent"
      />
    </div>
  );

  const ProviderCard = ({ provider }: { provider: AIProvider }) => {
    const metrics = mockMetrics[provider.provider_type] || mockMetrics.local;
    const providerModels = models.data?.filter(m => m.provider_id === provider.id) || [];

    return (
      <MS365Card 
        variant="interactive" 
        className="h-full"
        onCardClick={() => setSelectedProvider(provider)}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0078d4] rounded-md flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[#323130]">{provider.name}</h3>
                <p className="text-sm text-[#605e5c]">{provider.provider_type}</p>
              </div>
            </div>
            <ProviderStatusBadge status={metrics.healthStatus} />
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-[#f3f2f1] rounded-sm">
              <div className="text-lg font-semibold text-[#323130]">{metrics.totalRequests.toLocaleString()}</div>
              <div className="text-xs text-[#605e5c]">Total Requests</div>
            </div>
            <div className="text-center p-3 bg-[#f3f2f1] rounded-sm">
              <div className="text-lg font-semibold text-[#323130]">{metrics.successRate}%</div>
              <div className="text-xs text-[#605e5c]">Success Rate</div>
            </div>
          </div>

          {/* Models */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#323130]">Models</span>
              <span className="text-sm text-[#605e5c]">{providerModels.length} active</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {providerModels.slice(0, 3).map(model => (
                <span key={model.id} className="px-2 py-1 bg-[#deecf9] text-[#005a9e] text-xs rounded-sm">
                  {model.model_name}
                </span>
              ))}
              {providerModels.length > 3 && (
                <span className="px-2 py-1 bg-[#f3f2f1] text-[#605e5c] text-xs rounded-sm">
                  +{providerModels.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#edebe9]">
            <div className="flex items-center gap-2">
              {provider.is_primary && (
                <span className="px-2 py-1 bg-[#107c10] text-white text-xs rounded-sm font-medium">
                  Primary
                </span>
              )}
              {provider.is_active && (
                <span className="px-2 py-1 bg-[#deecf9] text-[#005a9e] text-xs rounded-sm">
                  Active
                </span>
              )}
            </div>
            <MS365Button
              variant="action"
              icon={<MoreHorizontal className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                // Show context menu
              }}
            />
          </div>
        </div>
      </MS365Card>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-[#deecf9] rounded-full flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-[#0078d4]" />
      </div>
      <h3 className="text-lg font-semibold text-[#323130] mb-2">No AI Providers</h3>
      <p className="text-[#605e5c] mb-6 max-w-sm mx-auto">
        Get started by adding your first AI provider to unlock intelligent capabilities across your yacht management system.
      </p>
      <MS365Button
        variant="primary"
        text="Add Your First Provider"
        icon={<Plus className="w-4 h-4" />}
        onClick={() => {
          toast({ title: 'Create Provider', description: 'Opening provider creation wizard...' });
        }}
      />
    </div>
  );

  if (selectedProvider) {
    return (
      <ProviderConfigurationPanel
        provider={selectedProvider}
        onClose={() => setSelectedProvider(null)}
        onSave={(provider) => {
          toast({ title: 'Provider Updated', description: `${provider.name} configuration saved successfully` });
          setSelectedProvider(null);
        }}
      />
    );
  }

  return (
    <MS365Layout variant="application">
      <MS365CommandBar
        items={commandBarItems}
        farItems={farItems}
        searchBox={searchBox}
      />
      
      <MS365LayoutContent>
        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <MS365Card variant="elevated">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#323130]">{providers.data?.length || 0}</div>
                <div className="text-sm text-[#605e5c]">Total Providers</div>
              </div>
              <div className="w-10 h-10 bg-[#deecf9] rounded-md flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#0078d4]" />
              </div>
            </div>
          </MS365Card>
          
          <MS365Card variant="elevated">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#323130]">{activeProviders.length}</div>
                <div className="text-sm text-[#605e5c]">Active Providers</div>
              </div>
              <div className="w-10 h-10 bg-[#d4f3d0] rounded-md flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#107c10]" />
              </div>
            </div>
          </MS365Card>
          
          <MS365Card variant="elevated">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#323130]">{totalModels}</div>
                <div className="text-sm text-[#605e5c]">AI Models</div>
              </div>
              <div className="w-10 h-10 bg-[#fff4ce] rounded-md flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#ca5010]" />
              </div>
            </div>
          </MS365Card>
          
          <MS365Card variant="elevated">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#323130]">98.7%</div>
                <div className="text-sm text-[#605e5c]">Success Rate</div>
              </div>
              <div className="w-10 h-10 bg-[#e1dfdd] rounded-md flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#605e5c]" />
              </div>
            </div>
          </MS365Card>
        </div>

        {/* Providers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MS365Card key={i} loading />
            ))}
          </div>
        ) : providers.data?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.data
              .filter(provider => 
                provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                provider.provider_type.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </MS365LayoutContent>
    </MS365Layout>
  );
};