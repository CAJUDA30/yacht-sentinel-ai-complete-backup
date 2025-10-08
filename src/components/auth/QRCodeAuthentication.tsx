import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Smartphone, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRCodeLib from 'qrcode';

interface QRCodeAuthenticationProps {
  onSuccess?: () => void;
  disabled?: boolean;
}

type QRAuthStatus = 'generating' | 'waiting' | 'scanning' | 'success' | 'expired' | 'error';

const QRCodeAuthentication: React.FC<QRCodeAuthenticationProps> = ({
  onSuccess,
  disabled = false
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<QRAuthStatus>('generating');
  const [sessionId, setSessionId] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes
  const { toast } = useToast();

  // Generate QR code for mobile authentication
  const generateQRCode = async () => {
    try {
      setStatus('generating');
      
      // Generate a unique session ID
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      
      // Create authentication URL with session ID
      const authUrl = new URL(`${window.location.origin}/mobile-auth`);
      authUrl.searchParams.set('session', newSessionId);
      authUrl.searchParams.set('timestamp', Date.now().toString());
      
      // Generate QR code data
      const qrData = {
        action: 'yacht_auth',
        url: authUrl.toString(),
        session: newSessionId,
        domain: window.location.hostname,
        timestamp: Date.now()
      };
      
      // Generate actual QR code
      const qrCodeData = await QRCodeLib.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#205585', // Primary color
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCode(qrCodeData);
      setStatus('waiting');
      setTimeLeft(300);
      
      // Start polling for authentication status
      startPolling(newSessionId);
      
    } catch (error) {
      console.error('QR code generation failed:', error);
      setStatus('error');
      toast({
        title: 'QR Code Generation Failed',
        description: 'Unable to generate QR code. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Poll for authentication status
  const startPolling = (sessionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // In a real implementation, you'd check the authentication status
        // via your backend API or Supabase realtime subscriptions
        
        // Simulate random success for demo (remove in production)
        if (Math.random() > 0.95 && status === 'waiting') {
          setStatus('success');
          clearInterval(pollInterval);
          toast({
            title: 'Authentication Successful',
            description: 'You have been authenticated via mobile device.',
            variant: 'default'
          });
          onSuccess?.();
          return;
        }
        
        // Check if session has expired
        if (timeLeft <= 0) {
          setStatus('expired');
          clearInterval(pollInterval);
          return;
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        setStatus('error');
        clearInterval(pollInterval);
      }
    }, 2000);

    // Cleanup interval after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (status === 'waiting') {
        setStatus('expired');
      }
    }, 300000);
  };

  // Countdown timer
  useEffect(() => {
    if (status === 'waiting' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && status === 'waiting') {
      setStatus('expired');
    }
  }, [status, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'generating':
        return {
          icon: <RefreshCw className="w-5 h-5 animate-spin text-primary" />,
          title: 'Generating QR Code',
          description: 'Creating secure authentication code...',
          badge: { text: 'Loading', variant: 'secondary' as const }
        };
      case 'waiting':
        return {
          icon: <QrCode className="w-5 h-5 text-primary" />,
          title: 'Scan QR Code',
          description: 'Use your mobile device to scan and authenticate',
          badge: { text: `Expires in ${formatTime(timeLeft)}`, variant: 'default' as const }
        };
      case 'scanning':
        return {
          icon: <Smartphone className="w-5 h-5 text-orange-500" />,
          title: 'Authenticating',
          description: 'Processing mobile authentication...',
          badge: { text: 'Scanning', variant: 'secondary' as const }
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          title: 'Authentication Successful',
          description: 'You have been successfully authenticated',
          badge: { text: 'Success', variant: 'default' as const }
        };
      case 'expired':
        return {
          icon: <Clock className="w-5 h-5 text-orange-500" />,
          title: 'QR Code Expired',
          description: 'The authentication code has expired',
          badge: { text: 'Expired', variant: 'secondary' as const }
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-destructive" />,
          title: 'Authentication Error',
          description: 'Unable to complete authentication',
          badge: { text: 'Error', variant: 'destructive' as const }
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="w-full max-w-md mx-auto bg-card/80 border-border/40 shadow-neumorphic">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          {statusInfo.icon}
        </div>
        <CardTitle className="text-lg font-semibold text-foreground">
          {statusInfo.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {statusInfo.description}
        </CardDescription>
        <Badge variant={statusInfo.badge.variant} className="w-fit mx-auto">
          {statusInfo.badge.text}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status === 'waiting' && qrCode && (
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-border/20">
              <img 
                src={qrCode} 
                alt="QR Code for Mobile Authentication" 
                className="w-48 h-48"
              />
            </div>
          </div>
        )}
        
        {status === 'waiting' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              1. Open your mobile authenticator app
            </p>
            <p className="text-sm text-muted-foreground">
              2. Scan the QR code above
            </p>
            <p className="text-sm text-muted-foreground">
              3. Approve the authentication request
            </p>
          </div>
        )}
        
        {(status === 'expired' || status === 'error') && (
          <Button 
            onClick={generateQRCode}
            disabled={disabled}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate New QR Code
          </Button>
        )}
        
        {status === 'generating' && (
          <div className="flex justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeAuthentication;