
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useVisionStatus, useVisionConfigUpdate, useVisionTestConnection, useVisionCheckUpdates, useSmartScanSettings, useSaveSmartScanSettings } from '@/hooks/useVisionConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, Info } from 'lucide-react';

type FeatureKey = 'DOCUMENT_TEXT_DETECTION' | 'TEXT_DETECTION' | 'OBJECT_LOCALIZATION' | 'IMAGE_PROPERTIES';

const PROJECT_ID = 'vdjsfupbjtbkpuvwffbn';
const SUPABASE_EDGE_SECRETS_URL = `https://supabase.com/dashboard/project/${PROJECT_ID}/settings/functions`;

const defaultModules: { key: string; label: string }[] = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'finance', label: 'Finance' },
  { key: 'documents', label: 'Documents' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'procurement', label: 'Procurement' },
];

const VisionSettingsPanel: React.FC = () => {
  const { data: status, isLoading, refetch } = useVisionStatus();
  const { mutateAsync: saveConfig, isPending: savingConfig } = useVisionConfigUpdate();
  const { mutateAsync: testConnection, isPending: testing } = useVisionTestConnection();
  const { mutateAsync: checkUpdates, isPending: checking } = useVisionCheckUpdates();
  const { data: smartScanData, isLoading: loadingSmart } = useSmartScanSettings();
  const { mutateAsync: saveSmart, isPending: savingSmart } = useSaveSmartScanSettings();

  const [region, setRegion] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureKey[]>([]);
  const [sampleImageUrl, setSampleImageUrl] = useState<string>('');

  const config = status?.config;
  const secretPresent = !!status?.secretPresent;
  const logs = status?.logs || [];

  React.useEffect(() => {
    if (config) {
      setRegion(config.region || '');
      setFeatures(Array.isArray(config.features_enabled) ? config.features_enabled : []);
    }
  }, [config]);

  const featuresAvailable: FeatureKey[] = ['DOCUMENT_TEXT_DETECTION', 'TEXT_DETECTION', 'OBJECT_LOCALIZATION', 'IMAGE_PROPERTIES'];

  const smartSettingsMap = useMemo(() => {
    const map: Record<string, any> = {};
    (smartScanData?.settings || []).forEach((s: any) => { map[s.module] = s; });
    return map;
  }, [smartScanData]);

  const handleToggleFeature = (key: FeatureKey) => {
    setFeatures(prev => {
      const exists = prev.includes(key);
      if (exists) return prev.filter(f => f !== key);
      return [...prev, key];
    });
  };

  const handleSaveConfig = async () => {
    const payload = {
      region: region || null,
      features_enabled: features,
    };
    const res = await saveConfig(payload);
    if (res?.ok) {
      toast.success('Vision config saved');
      refetch();
    } else {
      toast.error('Failed to save config');
    }
  };

  const handleTest = async () => {
    const res = await testConnection(sampleImageUrl || undefined);
    if (res?.ok) {
      toast.success(`Connected (latency ${res.latency_ms}ms)`);
      refetch();
    } else {
      toast.error(res?.error || 'Test failed');
    }
  };

  const handleCheckUpdates = async () => {
    const res: any = await checkUpdates();
    if (res?.ok) {
      toast.success(`Version ${res.version} ${res.revision ? `(${res.revision})` : ''} fetched`);
    } else {
      toast.error('Failed to check updates');
    }
  };

  const handleSaveSmartScan = async () => {
    const settings = defaultModules.map(({ key }) => {
      const current = smartSettingsMap[key] || {};
      return {
        module: key,
        autofill_enabled: current.autofill_enabled ?? true,
        ocr_provider: current.ocr_provider || 'google_vision',
        confidence_threshold: current.confidence_threshold ?? 0.7,
        features: Array.isArray(current.features) ? current.features : [],
      };
    });
    const res: any = await saveSmart(settings);
    if (res?.ok) {
      toast.success('SmartScan settings saved');
      refetch();
    } else {
      toast.error('Failed to save SmartScan settings');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-4 h-4" /> Configure Vertex AI & Document AI
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Vertex AI (Gemini) and Document AI live in the Unified AI configuration.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/settings/unified-ai">Open Unified AI</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/superadmin">Dev Configuration</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Google Vision & SmartScan</CardTitle>
          <CardDescription>
            Securely configure Google Vision OCR and connect outputs to SmartScan for autofill.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {secretPresent ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Secret configured
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="w-4 h-4 mr-1" /> Secret missing
              </Badge>
            )}
            <a
              href={SUPABASE_EDGE_SECRETS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              Manage Edge Function secrets (GOOGLE_VISION_API_KEY)
            </a>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="test">Test Connection</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="smartscan">SmartScan</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="docs">Data Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Select region and enable features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Region (optional)</Label>
                  <Input
                    id="region"
                    placeholder="e.g. us-central1"
                    value={region ?? ''}
                    onChange={(e) => setRegion(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-medium">Features</div>
                <div className="grid md:grid-cols-2 gap-3">
                  {featuresAvailable.map((f) => (
                    <div key={f} className="flex items-center justify-between rounded-md border p-3">
                      <div className="text-sm">{f}</div>
                      <Switch checked={features.includes(f)} onCheckedChange={() => handleToggleFeature(f)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveConfig} disabled={savingConfig}>
                  {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Configuration
                </Button>
                <Button variant="outline" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Connection Test</CardTitle>
              <CardDescription>
                Runs a real Vision API request using a sample image (never exposes the key).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sampleUrl">Sample Image URL (optional)</Label>
                <Input
                  id="sampleUrl"
                  placeholder="https://..."
                  value={sampleImageUrl}
                  onChange={(e) => setSampleImageUrl(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleTest} disabled={testing || !secretPresent}>
                  {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Test Connection
                </Button>
                {!secretPresent && (
                  <div className="text-sm text-destructive flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Set GOOGLE_VISION_API_KEY to run test
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Version & Feature Updates</CardTitle>
              <CardDescription>Check Google Vision API version and discover features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCheckUpdates} disabled={checking}>
                {checking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Check for Updates
              </Button>
              <div className="text-sm text-muted-foreground">
                The update check queries Google’s public discovery doc and lists common OCR features.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smartscan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SmartScan Integration</CardTitle>
              <CardDescription>Enable or disable OCR auto-fill per module.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(loadingSmart || isLoading) && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading current settings...
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {defaultModules.map(({ key, label }) => {
                  const s = smartSettingsMap[key] || {};
                  return (
                    <div key={key} className="rounded-md border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{label}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Auto-fill</span>
                          <Switch
                            checked={s.autofill_enabled ?? true}
                            onCheckedChange={(val) => {
                              smartSettingsMap[key] = { ...s, module: key, autofill_enabled: val };
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Confidence threshold</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            max={1}
                            defaultValue={s.confidence_threshold ?? 0.7}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              smartSettingsMap[key] = { ...s, module: key, confidence_threshold: v };
                            }}
                          />
                        </div>
                        <div>
                          <Label>OCR Provider</Label>
                          <Input value="google_vision" readOnly />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSaveSmartScan} disabled={savingSmart}>
                  {savingSmart ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save SmartScan Settings
                </Button>
                <Button variant="outline" onClick={() => refetch()}>
                  Refresh
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                When enabled, OCR results from Google Vision feed into SmartScan extractors to autofill module forms.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Logs</CardTitle>
              <CardDescription>Recent Vision connection attempts and results.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Latency</th>
                      <th className="py-2 pr-4">Message</th>
                      <th className="py-2 pr-4">Tested At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l: any, idx: number) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          {l.status === 'success' ? (
                            <Badge className="bg-green-500 text-white">success</Badge>
                          ) : (
                            <Badge variant="destructive">error</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-4">{l.latency_ms ? `${l.latency_ms} ms` : '-'}</td>
                        <td className="py-2 pr-4">{l.message || '-'}</td>
                        <td className="py-2 pr-4">{new Date(l.tested_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-muted-foreground">
                          No logs yet. Run a test to see results.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Flow: Vision → SmartScan → DB</CardTitle>
              <CardDescription>How OCR data powers autofill and verification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ol className="list-decimal ml-5 space-y-1">
                <li>Images are uploaded from the app and queued for processing.</li>
                <li>Edge Function securely calls Google Vision (key never exposed to the browser).</li>
                <li>OCR text output is parsed and routed to SmartScan extractors.</li>
                <li>SmartScan maps fields to module forms and optionally autofills based on settings.</li>
                <li>Results and errors are logged; admins can review confidence and retry if needed.</li>
              </ol>
              <div className="pt-2">
                Security tips:
                <ul className="list-disc ml-5 mt-1">
                  <li>Restrict API key usage to IP/domain where possible.</li>
                  <li>Monitor quotas and set alerts to avoid rate limits.</li>
                  <li>Rotate keys regularly and store only in Supabase Edge Function secrets.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisionSettingsPanel;
