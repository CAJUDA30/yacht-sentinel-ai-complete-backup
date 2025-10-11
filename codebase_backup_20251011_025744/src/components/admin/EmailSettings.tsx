import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailSettings: React.FC = () => {
  const [senderName, setSenderName] = useState('YachtExcel');
  const [senderEmail, setSenderEmail] = useState('onboarding@resend.dev');
  const [testRecipient, setTestRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendTest = async () => {
    if (!testRecipient) {
      toast({ title: 'Enter test email', description: 'Please provide an email address to send the test.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testRecipient,
          subject: 'Test email from YachtExcel',
          html: `<h1>Email OK</h1><p>This is a test sent via configured provider.</p>`,
          from: `${senderName} <${senderEmail}>`
        }
      });
      if (error) throw error;
      toast({ title: 'Test email sent', description: 'Please check your inbox (and spam).'});
    } catch (e: any) {
      toast({ title: 'Email failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Settings</CardTitle>
        <CardDescription>Configure provider and send test email. Secrets are stored server-side.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="senderName">Sender Name</Label>
            <Input id="senderName" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="senderEmail">Sender Email</Label>
            <Input id="senderEmail" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
          </div>
        </div>

        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          Provider: Resend (via RESEND_API_KEY). Add the secret to enable sending.
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <div>
            <Label htmlFor="testRecipient">Test recipient</Label>
            <Input id="testRecipient" type="email" placeholder="you@example.com" value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} />
          </div>
          <Button onClick={sendTest} disabled={loading}>
            {loading ? 'Sending…' : 'Send Test'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Access restricted to SuperAdmins. All send attempts are logged to Compliance/Security.
        </p>
      </CardContent>
    </Card>
  );
};

export default EmailSettings;
