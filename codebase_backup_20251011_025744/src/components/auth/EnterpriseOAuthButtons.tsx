import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  borderColor: string;
  hoverBg: string;
}

const providers: OAuthProvider[] = [
  {
    id: 'azure',
    name: 'azure',
    displayName: 'Microsoft',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
        <path d="M1 1h10v10H1V1zm11 0h10v10H12V1zM1 12h10v10H1V12zm11 0h10v10H12V12z"/>
      </svg>
    ),
    bgColor: 'bg-primary',
    textColor: 'text-primary-foreground',
    borderColor: 'border-primary/20',
    hoverBg: 'hover:bg-primary/90'
  },
  {
    id: 'google',
    name: 'google',
    displayName: 'Google Workspace',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    bgColor: 'bg-secondary',
    textColor: 'text-secondary-foreground',
    borderColor: 'border-secondary/30',
    hoverBg: 'hover:bg-secondary/80'
  },
  {
    id: 'github',
    name: 'github',
    displayName: 'GitHub Enterprise',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    bgColor: 'bg-accent',
    textColor: 'text-accent-foreground',
    borderColor: 'border-accent/30',
    hoverBg: 'hover:bg-accent/80'
  }
];

interface EnterpriseOAuthButtonsProps {
  onStartAuth?: () => void;
  disabled?: boolean;
}

const EnterpriseOAuthButtons: React.FC<EnterpriseOAuthButtonsProps> = ({
  onStartAuth,
  disabled = false
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    if (disabled) return;
    
    setLoading(provider.id);
    onStartAuth?.();
    
    try {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.name as any,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error(`${provider.displayName} OAuth error:`, error);
      toast({
        title: `${provider.displayName} Authentication Failed`,
        description: error.message || 'Please try again or contact your system administrator.',
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            size="lg"
            onClick={() => handleOAuthSignIn(provider)}
            disabled={disabled || loading !== null}
            className={`
              relative w-full h-14 px-6 font-medium transition-all duration-300
              ${provider.bgColor} ${provider.textColor} ${provider.borderColor} ${provider.hoverBg}
              border shadow-neumorphic hover:shadow-glow hover:scale-[1.02]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              focus:ring-2 focus:ring-ring focus:ring-offset-2
              rounded-lg group
            `}
            aria-label={`Sign in with ${provider.displayName}`}
          >
            {loading === provider.id ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span className="flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  {provider.icon}
                </span>
                <span className="text-base font-semibold">
                  Continue with {provider.displayName}
                </span>
              </>
            )}
          </Button>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Secure enterprise authentication with industry-standard protocols
        </p>
      </div>
    </div>
  );
};

export default EnterpriseOAuthButtons;