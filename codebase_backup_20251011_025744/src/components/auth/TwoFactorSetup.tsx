import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Smartphone, 
  Key, 
  QrCode, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react';

interface TwoFactorSetupProps {
  onSetupComplete?: (enabled: boolean) => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup'>('status');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user has 2FA enabled (this would typically be in user metadata or separate table)
        const is2FAActive = user.user_metadata?.two_factor_enabled === true;
        setIs2FAEnabled(is2FAActive);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const initiateTwoFactorSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Call edge function to generate 2FA setup data
      const { data, error } = await supabase.functions.invoke('setup-2fa', {
        body: { action: 'generate' }
      });

      if (error) throw error;

      setSecret(data.secret);
      setQrCode(data.qr_code);
      setStep('setup');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize 2FA setup');
      toast({
        title: '2FA Setup Error',
        description: err.message || 'Failed to initialize setup',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactorCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('setup-2fa', {
        body: { 
          action: 'verify',
          code: verificationCode,
          secret: secret
        }
      });

      if (error) throw error;

      if (data.valid) {
        setBackupCodes(data.backup_codes);
        setStep('backup');
        toast({
          title: '2FA Verified!',
          description: 'Two-factor authentication has been successfully set up'
        });
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      toast({
        title: 'Verification Failed',
        description: err.message || 'Invalid code entered',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const finalizeTwoFactorSetup = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('setup-2fa', {
        body: { action: 'finalize' }
      });

      if (error) throw error;

      setIs2FAEnabled(true);
      setStep('status');
      onSetupComplete?.(true);
      
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication is now active on your account'
      });
    } catch (err: any) {
      toast({
        title: 'Setup Error',
        description: err.message || 'Failed to finalize 2FA setup',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('setup-2fa', {
        body: { action: 'disable' }
      });

      if (error) throw error;

      setIs2FAEnabled(false);
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to disable 2FA',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Copied to clipboard' });
  };

  const downloadBackupCodes = () => {
    const content = `Yacht Excel - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Security Note: Keep these codes secure and never share them.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yacht-excel-2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Two-Factor Authentication</CardTitle>
          {is2FAEnabled && <Badge variant="secondary" className="bg-green-100 text-green-800">Enabled</Badge>}
        </div>
        <CardDescription>
          Add an extra layer of security to your Yacht Excel account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status View */}
        {step === 'status' && (
          <div className="space-y-4">
            {is2FAEnabled ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Two-factor authentication is enabled and protecting your account
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setStep('backup')}
                    variant="outline"
                    className="flex-1"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    View Backup Codes
                  </Button>
                  <Button 
                    onClick={disableTwoFactor}
                    variant="destructive"
                    disabled={loading}
                  >
                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 'Disable 2FA'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Two-factor authentication is not enabled. Enable it now to secure your account.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Authenticator App</h4>
                      <p className="text-sm text-muted-foreground">
                        Use Google Authenticator, Authy, or similar apps
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Key className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Backup Codes</h4>
                      <p className="text-sm text-muted-foreground">
                        Recovery codes for account access
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={initiateTwoFactorSetup}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Enable Two-Factor Authentication
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Setup View */}
        {step === 'setup' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use your authenticator app to scan this QR code
              </p>
            </div>

            {qrCode && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Manual Entry Key</Label>
              <div className="flex gap-2">
                <Input
                  value={secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(secret)}
                  variant="outline"
                  size="icon"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter this key manually if you can't scan the QR code
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setStep('status')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('verify')}
                className="flex-1"
              >
                Next: Verify Code
              </Button>
            </div>
          </div>
        )}

        {/* Verification View */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Verify Setup</h3>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-lg font-mono tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setStep('setup')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={verifyTwoFactorCode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Backup Codes View */}
        {step === 'backup' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Backup Codes</h3>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a safe place. Each can only be used once.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Store these codes securely. You'll need them if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {backupCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                  <span className="font-mono text-sm">{code}</span>
                  <Button
                    onClick={() => copyToClipboard(code)}
                    variant="ghost"
                    size="sm"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={downloadBackupCodes}
                variant="outline"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Codes
              </Button>
              <Button 
                onClick={finalizeTwoFactorSetup}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;