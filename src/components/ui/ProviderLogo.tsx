import React from 'react';
import { 
  Brain, 
  Rocket, 
  Settings, 
  Zap, 
  Building, 
  Globe,
  Code,
  Star
} from 'lucide-react';
import { getProviderLogo } from '@/data/provider-templates';

interface ProviderLogoProps {
  provider_type: string;
  logo?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const PROVIDER_LOGO_MAP: Record<string, { 
  icon: React.ComponentType<any>;
  fallbackEmoji: string;
  color: string;
  bgColor: string;
}> = {
  openai: {
    icon: Brain,
    fallbackEmoji: '🤖',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  anthropic: {
    icon: Brain,
    fallbackEmoji: '🧠',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  google: {
    icon: Star,
    fallbackEmoji: '🌟',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  google_vertex: {
    icon: Star,
    fallbackEmoji: '🌟',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  xai: {
    icon: Rocket,
    fallbackEmoji: '🚀',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  grok: {
    icon: Rocket,
    fallbackEmoji: '🚀',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  deepseek: {
    icon: Code,
    fallbackEmoji: '💻',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  azure: {
    icon: Building,
    fallbackEmoji: '☁️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  cohere: {
    icon: Zap,
    fallbackEmoji: '🔮',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  custom: {
    icon: Settings,
    fallbackEmoji: '⚙️',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
};

const SIZE_MAP = {
  sm: { icon: 'w-3 h-3', container: 'w-6 h-6', text: 'text-xs' },
  md: { icon: 'w-4 h-4', container: 'w-8 h-8', text: 'text-sm' },
  lg: { icon: 'w-5 h-5', container: 'w-10 h-10', text: 'text-base' },
  xl: { icon: 'w-6 h-6', container: 'w-12 h-12', text: 'text-lg' }
};

export const ProviderLogo: React.FC<ProviderLogoProps> = ({ 
  provider_type, 
  logo, 
  name, 
  size = 'md', 
  className = '',
  showFallback = true 
}) => {
  const [logoError, setLogoError] = React.useState(false);
  const [logoLoading, setLogoLoading] = React.useState(true);
  
  const sizeConfig = SIZE_MAP[size];
  const providerConfig = PROVIDER_LOGO_MAP[provider_type?.toLowerCase()] || PROVIDER_LOGO_MAP.custom;
  const IconComponent = providerConfig.icon;

  // Get the real logo path from provider templates if not provided
  const actualLogoPath = logo || getProviderLogo(provider_type);

  // Reset loading state when provider_type or logo changes
  React.useEffect(() => {
    if (actualLogoPath) {
      setLogoError(false);
      setLogoLoading(true);
    }
  }, [actualLogoPath, provider_type]);

  const handleImageLoad = () => {
    setLogoLoading(false);
    setLogoError(false);
  };

  const handleImageError = () => {
    setLogoLoading(false);
    setLogoError(true);
  };

  // If we have a logo path and it hasn't errored, try to display it
  if (actualLogoPath && !logoError) {
    return (
      <div className={`relative ${sizeConfig.container} ${className}`}>
        {logoLoading && (
          <div className={`absolute inset-0 ${providerConfig.bgColor} rounded-lg flex items-center justify-center animate-pulse`}>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        )}
        <img
          src={actualLogoPath}
          alt={`${name || provider_type} logo`}
          className={`${sizeConfig.container} rounded-lg object-contain object-center bg-white ${logoLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback to icon or emoji
  if (showFallback) {
    return (
      <div className={`${sizeConfig.container} ${providerConfig.bgColor} rounded-lg flex items-center justify-center ${className}`}>
        <IconComponent className={`${sizeConfig.icon} ${providerConfig.color}`} />
      </div>
    );
  }

  // Emoji fallback for even simpler display
  return (
    <span className={`${sizeConfig.text} ${className}`}>
      {providerConfig.fallbackEmoji}
    </span>
  );
};

export default ProviderLogo;