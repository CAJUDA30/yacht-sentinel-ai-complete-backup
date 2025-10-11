import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, PlugZap, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProviderModal from './ProviderModal';
import { useToast } from '@/hooks/use-toast';

interface ProviderRow {
  id: string;
  name: string;
  base_url: string | null;
  connection_status?: string | null;
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

const AIProvidersPanel: React.FC = () => {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProviderRow | null>(null);
  const { toast } = useToast();

  const [isGrokPrimary, setIsGrokPrimary] = useState(false);

  useEffect(() => {
    supabase
      .from('ai_system_config')
      .select('config_value')
      .eq('config_key', 'feature_flags')
      .limit(1)
      .then(({ data }) => {
        const flags = (data?.[0] as any)?.config_value || {};
        setIsGrokPrimary(Boolean(flags?.grok_primary));
      });
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('ai-admin', {
      body: { action: 'list_providers' }
    });
    if (error) {
      toast({ title: 'Failed to load providers', description: String(error.message || error), variant: 'destructive' });
    } else {
      setProviders((data?.data as ProviderRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('ai-providers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_providers' }, (payload) => {
        // Optimistic refresh
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_health' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const content = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((p) => (
        <Card key={p.id} className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {p.name}
                {isGrokPrimary && p.name.toLowerCase().includes('xai') && (
                  <Badge variant="default">Primary</Badge>
                )}
              </span>
              <Badge variant={statusVariant(p.connection_status)}>
                {p.connection_status ? p.connection_status : 'Unknown'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setSelected(p)}>
              <Settings2 className="h-4 w-4 mr-2" /> Configure
            </Button>
            <Button variant="ghost" size="icon" onClick={load} aria-label="Refresh">
              <RefreshCw className={"h-4 w-4 " + (loading ? 'animate-spin' : '')} />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  ), [providers, loading]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PlugZap className="h-5 w-5 mr-2" /> AI Providers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">Providers</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            {content}
          </TabsContent>
        </Tabs>
      </CardContent>
      {selected && (
        <ProviderModal provider={selected} onClose={() => setSelected(null)} onUpdated={load} />
      )}
    </Card>
  );
};

export default AIProvidersPanel;
