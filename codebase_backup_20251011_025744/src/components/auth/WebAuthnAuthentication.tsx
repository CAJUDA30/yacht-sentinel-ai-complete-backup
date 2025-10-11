import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Fingerprint, Key, Smartphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebAuthnAuthenticationProps {
  onSuccess?: (credential: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  mode?: 'login' | 'register';
}

type AuthMethod = 'biometric' | 'security-key' | 'platform';

interface AuthMethodOption {
  id: AuthMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  preferred: boolean;
}

const WebAuthnAuthentication: React.FC<WebAuthnAuthenticationProps> = ({
  onSuccess,
  onError,
  disabled = false,
  mode = 'login'
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [authMethods, setAuthMethods] = useState<AuthMethodOption[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkWebAuthnSupport();
  }, []);

  const checkWebAuthnSupport = async () => {
    const supported = !!(navigator.credentials && navigator.credentials.create);
    setIsSupported(supported);

    if (supported) {
      const methods: AuthMethodOption[] = [
        {
          id: 'biometric',
          name: 'Biometric Authentication',
          description: 'Face ID, Touch ID, or Fingerprint',
          icon: <Fingerprint className="w-5 h-5" />,
          available: true,
          preferred: true
        },
        {
          id: 'security-key',
          name: 'Security Key',
          description: 'Hardware security key (YubiKey, etc.)',
          icon: <Key className="w-5 h-5" />,
          available: true,
          preferred: false
        },
        {
          id: 'platform',
          name: 'Device Authentication',
          description: 'Built-in device authenticator',
          icon: <Smartphone className="w-5 h-5" />,
          available: true,
          preferred: false
        }
      ];

      setAuthMethods(methods);
      setSelectedMethod(methods.find(m => m.preferred)?.id || 'biometric');
    }
  };

  const handleWebAuthnAuthentication = async (method: AuthMethod) => {
    if (!isSupported || disabled) return;

    setLoading(method);

    try {
      const rpId = window.location.hostname;
      const userId = new TextEncoder().encode('user-' + Date.now());

      if (mode === 'register') {
        // Registration flow
        const createOptions: CredentialCreationOptions = {
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: {
              id: rpId,
              name: 'Yacht Excel'
            },
            user: {
              id: userId,
              name: 'user@yachtexcel.com',
              displayName: 'Yacht Excel User'
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' }, // ES256
              { alg: -257, type: 'public-key' } // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: method === 'platform' ? 'platform' : 'cross-platform',
              userVerification: 'preferred',
              requireResidentKey: false
            },
            timeout: 60000,
            attestation: 'direct'
          }
        };

        const credential = await navigator.credentials.create(createOptions);
        
        if (credential) {
          toast({
            title: 'Registration Successful',
            description: `${method} authentication has been registered.`,
            variant: 'default'
          });
          onSuccess?.(credential);
        }
      } else {
        // Authentication flow
        const getOptions: CredentialRequestOptions = {
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rpId: rpId,
            allowCredentials: [],
            userVerification: 'preferred',
            timeout: 60000
          }
        };

        const credential = await navigator.credentials.get(getOptions);
        
        if (credential) {
          toast({
            title: 'Authentication Successful',
            description: `Authenticated using ${method}.`,
            variant: 'default'
          });
          onSuccess?.(credential);
        }
      }
    } catch (error: any) {
      console.error('WebAuthn error:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Authentication was cancelled or timed out';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = 'Authenticator is already registered';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'This authentication method is not supported';
      }
      
      toast({
        title: 'Authentication Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      
      onError?.(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto bg-card/80 border-border/40">
        <CardHeader className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-orange-500 mb-2" />
          <CardTitle className="text-lg">WebAuthn Not Supported</CardTitle>
          <CardDescription>
            Your browser doesn't support modern authentication methods.
            Please use email/password authentication.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-card/80 border-border/40 shadow-neumorphic">
      <CardHeader className="text-center">
        <Shield className="w-8 h-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg font-semibold">
          {mode === 'register' ? 'Setup' : 'Secure'} Authentication
        </CardTitle>
        <CardDescription>
          {mode === 'register' 
            ? 'Register your preferred authentication method'
            : 'Choose your authentication method'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {authMethods.map((method) => (
            <Button
              key={method.id}
              variant={selectedMethod === method.id ? "default" : "outline"}
              size="lg"
              onClick={() => {
                setSelectedMethod(method.id);
                handleWebAuthnAuthentication(method.id);
              }}
              disabled={disabled || !method.available || loading !== null}
              className={`
                w-full h-16 px-4 justify-start gap-4 transition-all duration-200
                ${selectedMethod === method.id ? 'ring-2 ring-primary/20' : ''}
                hover:scale-[1.02] disabled:hover:scale-100
              `}
            >
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-lg
                ${selectedMethod === method.id ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'}
              `}>
                {loading === method.id ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  method.icon
                )}
              </div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{method.name}</span>
                  {method.preferred && (
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </div>
              
              {method.available && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </Button>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Security Features</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• FIDO2/WebAuthn compliant</li>
            <li>• Hardware-backed security</li>
            <li>• Phishing resistant</li>
            <li>• No passwords to remember</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebAuthnAuthentication;