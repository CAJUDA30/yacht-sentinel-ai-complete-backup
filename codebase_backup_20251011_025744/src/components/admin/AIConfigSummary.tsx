import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProviderSummary {
  id: string;
  name: string;
  is_active: boolean;
  models_endpoint: string | null;
  status: string;
  last_checked_at: string | null;
  models_count: number;
  secret_name: string | null;
  secret_configured: boolean;
  updated_at?: string | null;
}

interface ConfigItem {
  id: string;
  module: string;
  provider_id: string;
  model_id: string;
  active: boolean;
  priority: number;
  params: any;
  updated_at?: string | null;
}

const statusVariant = (s?: string | null) => {
  switch ((s || '').toLowerCase()) {
    case 'healthy':
    case 'connected':
      return 'default' as const;
    case 'degraded':
      return 'outline' as const;
    case 'error':
    case 'down':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

const AIConfigSummary: React.FC = () => {
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('ai-admin', { body: { action: 'get_config_summary' } });
    setLoading(false);
    if (!error) {
      setProviders(data?.providers || []);
      setConfigs(data?.configs || []);
    }
  };

  useEffect(() => { load(); }, []);

  const byId = useMemo(() => Object.fromEntries(providers.map(p => [p.id, p])), [providers]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center"><PlugZap className="h-5 w-5 mr-2"/> Providers Status</span>
            <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh">
              <RefreshCw className={"h-4 w-4 " + (loading ? 'animate-spin' : '')} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[360px]">
            <div className="space-y-2">
              {providers.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">Models: {p.models_count} • Secret: {p.secret_name || '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.secret_configured ? 'default' : 'secondary'}>{p.secret_configured ? 'Secret OK' : 'Secret Missing'}</Badge>
                    <Badge variant={statusVariant(p.status)}>{p.status || 'unknown'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Module → Model Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[360px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.module}</TableCell>
                    <TableCell>{byId[c.provider_id]?.name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.model_id}</TableCell>
                    <TableCell>
                      <Badge variant={c.active ? 'default' : 'secondary'}>{c.active ? 'Active' : 'Disabled'}</Badge>
                    </TableCell>
                    <TableCell>{c.priority}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIConfigSummary;
