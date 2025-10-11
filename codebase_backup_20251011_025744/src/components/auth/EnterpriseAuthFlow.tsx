import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Building2, Shield, Smartphone, Mail, ChevronDown, ChevronUp } from 'lucide-react';

import EnterpriseOAuthButtons from './EnterpriseOAuthButtons';
import QRCodeAuthentication from './QRCodeAuthentication';
import WebAuthnAuthentication from './WebAuthnAuthentication';
import EnhancedAuthForm from './EnhancedAuthForm';

interface EnterpriseAuthFlowProps {
  onAuthenticated?: () => void;
}

const EnterpriseAuthFlow: React.FC<EnterpriseAuthFlowProps> = ({
  onAuthenticated
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthStart = () => {
    setIsAuthenticating(true);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticating(false);
    onAuthenticated?.();
  };

  const handleAuthError = () => {
    setIsAuthenticating(false);
  };

  const alternativeMethods = [
    {
      id: 'sso',
      label: 'Single Sign-On',
      description: 'Sign in with your organization account',
      icon: <Building2 className="w-5 h-5" />,
      badge: 'SSO',
      component: (
        <Card className="bg-card/60 border-border/40">
          <CardContent className="pt-6">
            <EnterpriseOAuthButtons 
              onStartAuth={handleAuthStart}
              disabled={isAuthenticating}
            />
          </CardContent>
        </Card>
      )
    },
    {
      id: 'passwordless',
      label: 'Passwordless Authentication',
      description: 'Use biometric or hardware key authentication',
      icon: <Shield className="w-5 h-5" />,
      badge: 'Secure',
      component: (
        <WebAuthnAuthentication
          onSuccess={handleAuthSuccess}
          onError={handleAuthError}
          disabled={isAuthenticating}
          mode="login"
        />
      )
    },
    {
      id: 'mobile',
      label: 'Mobile QR Authentication',
      description: 'Scan QR code with your mobile device',
      icon: <Smartphone className="w-5 h-5" />,
      badge: 'Mobile',
      component: (
        <QRCodeAuthentication
          onSuccess={handleAuthSuccess}
          disabled={isAuthenticating}
        />
      )
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Primary Email/Password Authentication */}
      <Card className="bg-card/80 border-border/40 shadow-neumorphic backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-3">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-wave rounded-full shadow-glow">
                <Mail className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm animate-pulse-soft"></div>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Sign In
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedAuthForm onAuthenticated={handleAuthSuccess} />
        </CardContent>
      </Card>

      {/* Advanced Authentication Methods */}
      <Card className="bg-card/60 border-border/40 shadow-neumorphic backdrop-blur-sm">
        <CardHeader className="pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full justify-between text-left hover:bg-secondary/20 transition-all duration-200 p-4 h-auto"
            disabled={isAuthenticating}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-subtle rounded-full">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Advanced Authentication</div>
                <div className="text-sm text-muted-foreground">SSO, Biometric & Mobile options</div>
              </div>
            </div>
            {showAlternatives ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CardHeader>
      </Card>

      {/* Advanced Authentication Options */}
      {showAlternatives && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          
          <div className="space-y-3">
            {alternativeMethods.map((method) => (
              <div key={method.id} className="space-y-3">
                {activeMethod !== method.id ? (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setActiveMethod(method.id)}
                    disabled={isAuthenticating || activeMethod !== null}
                    className="w-full h-auto p-4 justify-start text-left hover:bg-secondary/50 transition-all duration-200"
                  >
                    <div className="flex items-center w-full">
                      <div className="flex items-center justify-center w-10 h-10 bg-secondary/30 rounded-full mr-4">
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{method.label}</span>
                          {method.badge && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              {method.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  </Button>
                ) : (
                  <Card className="bg-card/60 border-border/40">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                            {method.icon}
                          </div>
                          <CardTitle className="text-lg">{method.label}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveMethod(null)}
                          disabled={isAuthenticating}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {method.component}
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Footer */}
      <div className="text-center pt-6 border-t border-border/40">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Secure Authentication
          </span>
        </div>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          All authentication methods use end-to-end encryption and comply with industry security standards
        </p>
      </div>
    </div>
  );
};

export default EnterpriseAuthFlow;