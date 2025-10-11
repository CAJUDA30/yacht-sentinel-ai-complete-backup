import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Link2, Beaker, ListChecks, Boxes, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Provider {
  id: string;
  name: string;
}

interface Props {
  provider: Provider;
  onClose: () => void;
  onUpdated: () => void;
}

const modules = [
  'Inventory','Maintenance','Finance','Documents','Crew','Navigation','Analytics','Safety','Charter','Fleet'
];

const ProviderModal: React.FC<Props> = ({ provider, onClose, onUpdated }) => {
  const { toast } = useToast();
  const [secretName, setSecretName] = useState('');
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<'connected'|'degraded'|'error'|'unknown'>('unknown');
  const [latency, setLatency] = useState<number | null>(null);
  const [models, setModels] = useState<{ model_id: string; model_name: string }[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<any[]>([]);

  const [endpointForm, setEndpointForm] = useState({
    base_url: '',
    chat_endpoint: '',
    models_endpoint: '',
    test_endpoint: '',
    auth_type: 'bearer',
    auth_header_name: 'Authorization'
  });

  const loadProviderDetails = async () => {
    const { data } = await supabase
      .from('ai_providers')
      .select('base_url,models_endpoint,chat_endpoint,test_endpoint,auth_type,auth_header_name')
      .eq('id', provider.id)
      .maybeSingle();
    if (data) {
      setEndpointForm((prev) => ({
        ...prev,
        base_url: data.base_url || '',
        models_endpoint: data.models_endpoint || '',
        chat_endpoint: (data as any).chat_endpoint || '',
        test_endpoint: data.test_endpoint || '',
        auth_type: data.auth_type || 'bearer',
        auth_header_name: data.auth_header_name || 'Authorization',
      }));
    }
  };

  const saveEndpoints = async () => {
    const { data, error } = await supabase.functions.invoke('ai-admin', {
      body: {
        action: 'update_endpoints',
        providerId: provider.id,
        ...endpointForm
      }
    });
    if (error) {
      toast({ title: 'Save failed', description: String((error as any).message || error), variant: 'destructive' });
    } else {
      toast({ title: 'Endpoints saved', description: 'Provider endpoints updated.' });
      onUpdated();
    }
  };

  const testChat = async () => {
    const { data, error } = await supabase.functions.invoke('ai-admin', {
      body: {
        action: 'test_chat_endpoint',
        providerId: provider.id,
        model: 'grok-3-mini',
        prompt: 'Connectivity test from admin panel'
      }
    });
    if (error) {
      toast({ title: 'Chat test failed', description: String((error as any).message || error), variant: 'destructive' });
    } else {
      toast({ title: data?.ok ? 'Chat OK' : 'Chat issue', description: data?.preview || '' });
    }
  };

  const loadLogs = async () => {
    const { data, error } = await supabase.functions.invoke('ai-admin', { body: { action: 'get_logs', providerId: provider.id } });
    if (!error) setLogs(data?.data || []);
  };

  const refreshModels = async () => {
    const { data, error } = await supabase.functions.invoke('ai-admin', { body: { action: 'fetch_models', providerId: provider.id, forceRefresh: true } });
    if (error) {
      toast({ title: 'Model refresh failed', description: String(error.message || error), variant: 'destructive' });
    } else {
      setModels((data?.models || []).map((m: any) => ({ model_id: m.model_id, model_name: m.model_name })));
      setLatency(data?.latency ?? null);
      toast({ title: 'Model list updated', description: `${(data?.models || []).length} models` });
    }
  };

  const saveSecret = async () => {
    if (!secretName) return;
    const { data, error } = await supabase.functions.invoke('ai-admin', { body: { action: 'update_credentials', providerId: provider.id, secretName } });
    if (error) {
      toast({ title: 'Failed to update credentials', description: String(error.message || error), variant: 'destructive' });
    } else {
      const status = data?.status === 'ok' ? 'Secret found' : 'Secret missing in project';
      toast({ title: 'Credentials updated', description: status });
      onUpdated();
    }
  };

  const testConnection = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke('ai-admin', { body: { action: 'test_connection', providerId: provider.id } });
    setTesting(false);
    if (error) {
      toast({ title: 'Test failed', description: String(error.message || error), variant: 'destructive' });
      setConnected('error');
    } else {
      setConnected(data?.connected ? 'connected' : 'degraded');
      setLatency(data?.latency ?? null);
      toast({ title: data?.connected ? 'Connected' : 'Not Connected', description: data?.details || '' });
      loadLogs();
    }
  };

  const loadMappings = async () => {
    const { data, error } = await supabase.functions.invoke('ai-admin', { body: { action: 'list_module_mappings' } });
    if (!error) {
      const map: Record<string, string> = {};
      (data?.data || []).filter((m: any) => m.provider_id === provider.id).forEach((m: any) => map[m.module] = m.model_id);
      setMappings(map);
    }
  };

  useEffect(() => {
    refreshModels();
    loadLogs();
    loadMappings();
    loadProviderDetails();
  }, []);

  const assign = async (mod: string, modelId: string) => {
    const { error } = await supabase.functions.invoke('ai-admin', { body: { action: 'map_module', module: mod, providerId: provider.id, modelId } });
    if (error) {
      toast({ title: 'Mapping failed', description: String(error.message || error), variant: 'destructive' });
    } else {
      setMappings({ ...mappings, [mod]: modelId });
      toast({ title: 'Module mapped', description: `${mod} → ${modelId}` });
      onUpdated();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{provider.name} — Configuration</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="auth">
          <TabsList className="mb-4">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="models">Model List</TabsTrigger>
            <TabsTrigger value="test">Test Connection</TabsTrigger>
            <TabsTrigger value="modules">Assigned Modules</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="auth">
            <div className="space-y-3">
              <Label htmlFor="secret">Secret name (Supabase Function Secret)</Label>
              <div className="flex items-center gap-2">
                <Input id="secret" placeholder="OPENAI_API_KEY" value={secretName} onChange={(e) => setSecretName(e.target.value)} />
                <Button onClick={saveSecret}>Save</Button>
              </div>
              <p className="text-sm text-muted-foreground">Keys are not stored in DB. Only the secret name reference is saved.</p>
            </div>
          </TabsContent>

          <TabsContent value="features">
            <div className="text-sm text-muted-foreground">Feature toggles will appear here based on provider capabilities.</div>
          </TabsContent>

          <TabsContent value="endpoints">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Base URL</Label>
                  <Input value={endpointForm.base_url} onChange={(e) => setEndpointForm({ ...endpointForm, base_url: e.target.value })} placeholder="https://api.x.ai" />
                </div>
                <div>
                  <Label>Auth Type</Label>
                  <Select value={endpointForm.auth_type} onValueChange={(v) => setEndpointForm({ ...endpointForm, auth_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auth type" />
                    </SelectTrigger>
                    <SelectContent className="z-[60] bg-popover">
                      <SelectItem value="bearer">Bearer</SelectItem>
                      <SelectItem value="api-key">API Key Header</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Auth Header Name</Label>
                  <Input value={endpointForm.auth_header_name} onChange={(e) => setEndpointForm({ ...endpointForm, auth_header_name: e.target.value })} placeholder="Authorization or X-API-Key" />
                </div>
                <div>
                  <Label>Models Endpoint</Label>
                  <Input value={endpointForm.models_endpoint} onChange={(e) => setEndpointForm({ ...endpointForm, models_endpoint: e.target.value })} placeholder="/v1/models" />
                </div>
                <div>
                  <Label>Chat Endpoint</Label>
                  <Input value={endpointForm.chat_endpoint} onChange={(e) => setEndpointForm({ ...endpointForm, chat_endpoint: e.target.value })} placeholder="/v1/chat/completions" />
                </div>
                <div>
                  <Label>Test Endpoint</Label>
                  <Input value={endpointForm.test_endpoint} onChange={(e) => setEndpointForm({ ...endpointForm, test_endpoint: e.target.value })} placeholder="/v1/chat/completions" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveEndpoints}>Save</Button>
                <Button variant="outline" onClick={testChat}><Beaker className="h-4 w-4 mr-2" /> Test Chat</Button>
                <a href="https://x.ai/api" target="_blank" rel="noreferrer" className="text-primary underline text-sm">xAI API docs</a>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Latency: {latency ?? '—'} ms</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={refreshModels}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh models
              </Button>
            </div>
            <ScrollArea className="h-64 rounded-md border p-3">
              <ul className="space-y-2">
                {models.map((m) => (
                  <li key={m.model_id} className="flex items-center justify-between">
                    <span className="font-mono text-sm">{m.model_id}</span>
                    <Badge variant="secondary">{m.model_name}</Badge>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="test">
            <div className="flex items-center gap-3">
              <Button onClick={testConnection} disabled={testing}>
                <Link2 className="h-4 w-4 mr-2" /> {testing ? 'Testing…' : 'Run Test'}
              </Button>
              <Badge variant={connected === 'connected' ? 'default' : connected === 'degraded' ? 'outline' : 'secondary'}>
                {connected.toUpperCase()}
              </Badge>
              {latency !== null && <Badge variant="secondary">{latency} ms</Badge>}
            </div>
          </TabsContent>

          <TabsContent value="modules">
            <div className="space-y-3">
              {modules.map((mod) => (
                <div key={mod} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    <span>{mod}</span>
                  </div>
                  <Select value={mappings[mod] || ''} onValueChange={(v) => assign(mod, v)}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className="z-[60] bg-popover">
                      {models.map((m) => (
                        <SelectItem key={m.model_id} value={m.model_id}>
                          {m.model_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <ScrollArea className="h-64 rounded-md border p-3">
              <ul className="space-y-2">
                {logs.map((l) => (
                  <li key={l.id} className="text-sm flex items-center justify-between">
                    <span>{new Date(l.tested_at).toLocaleString()}</span>
                    <Badge variant={l.status === 'connected' ? 'default' : l.status === 'error' ? 'destructive' : 'outline'}>{l.status}</Badge>
                    <span className="text-muted-foreground">{l.message}</span>
                    {typeof l.latency_ms === 'number' && <Badge variant="secondary">{l.latency_ms} ms</Badge>}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderModal;
