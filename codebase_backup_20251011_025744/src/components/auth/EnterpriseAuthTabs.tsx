import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Smartphone, Shield, Mail, Key, QrCode } from 'lucide-react';

import EnterpriseOAuthButtons from './EnterpriseOAuthButtons';
import QRCodeAuthentication from './QRCodeAuthentication';
import WebAuthnAuthentication from './WebAuthnAuthentication';
import EnhancedAuthForm from './EnhancedAuthForm';

interface EnterpriseAuthTabsProps {
  onAuthenticated?: () => void;
}

const EnterpriseAuthTabs: React.FC<EnterpriseAuthTabsProps> = ({
  onAuthenticated
}) => {
  const [activeTab, setActiveTab] = useState<string>('sso');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

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

  const tabs = [
    {
      id: 'sso',
      label: 'Enterprise SSO',
      icon: <Building2 className="w-4 h-4" />,
      badge: 'Recommended',
      badgeVariant: 'default' as const,
      description: 'Single Sign-On with your organization'
    },
    {
      id: 'passwordless',
      label: 'Passwordless',
      icon: <Shield className="w-4 h-4" />,
      badge: 'Secure',
      badgeVariant: 'secondary' as const,
      description: 'Biometric & hardware key authentication'
    },
    {
      id: 'mobile',
      label: 'Mobile Auth',
      icon: <Smartphone className="w-4 h-4" />,
      badge: 'QR Code',
      badgeVariant: 'secondary' as const,
      description: 'Authenticate using your mobile device'
    },
    {
      id: 'traditional',
      label: 'Email',
      icon: <Mail className="w-4 h-4" />,
      badge: null,
      badgeVariant: 'secondary' as const,
      description: 'Traditional email and password'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 bg-muted/50 p-1 rounded-lg">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={isAuthenticating}
              className="flex flex-col items-center gap-2 py-3 px-2 text-xs font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-1">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </div>
              {tab.badge && (
                <Badge variant={tab.badgeVariant} className="text-xs px-1 py-0">
                  {tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-h-[400px]">
          <TabsContent value="sso" className="mt-0">
            <Card className="bg-card/80 border-border/40 shadow-neumorphic">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  Enterprise Single Sign-On
                </CardTitle>
                <CardDescription>
                  Authenticate using your organization's identity provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnterpriseOAuthButtons 
                  onStartAuth={handleAuthStart}
                  disabled={isAuthenticating}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passwordless" className="mt-0">
            <WebAuthnAuthentication
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              disabled={isAuthenticating}
              mode="login"
            />
          </TabsContent>

          <TabsContent value="mobile" className="mt-0">
            <QRCodeAuthentication
              onSuccess={handleAuthSuccess}
              disabled={isAuthenticating}
            />
          </TabsContent>

          <TabsContent value="traditional" className="mt-0">
            <Card className="bg-card/80 border-border/40 shadow-neumorphic">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  Email Authentication
                </CardTitle>
                <CardDescription>
                  Sign in with your email address and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedAuthForm onAuthenticated={handleAuthSuccess} />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Security Information */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Enterprise Security Standards
          </span>
        </div>
        <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
          All authentication methods use industry-standard security protocols including 
          OAuth 2.0, OIDC, SAML 2.0, and WebAuthn. Your credentials are encrypted and never stored locally.
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Key className="w-3 h-3" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            <span>FIDO2 Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <QrCode className="w-3 h-3" />
            <span>Zero Trust</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseAuthTabs;