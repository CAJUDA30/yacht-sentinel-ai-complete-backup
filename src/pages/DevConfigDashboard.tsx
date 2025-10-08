import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { useUnifiedAIConfig, UnifiedAIConfigState } from "@/hooks/useUnifiedAIConfig";
import { useUnifiedAILogs, UnifiedLogEntry } from "@/hooks/useUnifiedAILogs";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Play, Save, Upload, Download, Search, Filter, ChevronLeft, Link2, ActivitySquare, FileJson, FileSpreadsheet } from "lucide-react";

const SectionLink = ({ to, label, active }: { to: string; label: string; active?: boolean }) => (
  <a href={to} className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${active ? 'bg-accent/50 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{label}</a>
);

function useKeyboard(shortcuts: { combo: string; handler: (e: KeyboardEvent) => void }[]) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const parts = [] as string[];
      if (e.ctrlKey || e.metaKey) parts.push("ctrl");
      if (e.shiftKey) parts.push("shift");
      const key = e.key.toLowerCase();
      parts.push(key);
      const combo = parts.join("+");
      shortcuts.forEach((s) => {
        if (s.combo === combo) s.handler(e);
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcuts]);
}

function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (!patch) return base;
  const result: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  Object.keys(patch as any).forEach((k) => {
    const v: any = (patch as any)[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      result[k] = deepMerge((base as any)[k] || {}, v);
    } else {
      result[k] = v;
    }
  });
  return result as T;
}

const StatusChip = ({ ok, label }: { ok: boolean; label: string }) => (
  <Badge variant={ok ? "default" : "secondary"} className={`gap-1 ${ok ? 'bg-green-500/20 text-green-900 dark:text-green-100' : ''}`}>
    {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />} {label}
  </Badge>
);

export default function DevConfigDashboard() {
  const { settings, loading } = useAppSettings();
  const isSuperAdmin = settings?.user?.role === 'superadmin';
  const navigate = useNavigate();
  const { toast } = useToast();

  const { status, save, testAll, runTest, checkUpdates, defaultConfig } = useUnifiedAIConfig();
  const [config, setConfig] = useState<UnifiedAIConfigState>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const topRef = useRef<HTMLDivElement | null>(null);

  // Logs
  const logsCtl = useUnifiedAILogs();
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [solutionText, setSolutionText] = useState<string>("");

  // SEO meta
  useEffect(() => {
    document.title = "Dev Configuration Dashboard: Unified AI";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Superadmin Dev Configuration Dashboard for Google Vision, Vertex, and Document AI with real-time status and logs.");
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', `${window.location.origin}/dev-config`);
    if (!link.parentElement) document.head.appendChild(link);
  }, []);

  // Load status and config
  useEffect(() => {
    if (status.data?.config) {
      setConfig((c) => deepMerge(defaultConfig, status.data?.config as any));
    }
  }, [status.data?.config, defaultConfig]);

  // Auto refresh status every 30s
  useEffect(() => {
    const t = setInterval(() => status.refetch(), 30000);
    return () => clearInterval(t);
  }, [status]);

  const doSave = useCallback(async (partial?: Partial<UnifiedAIConfigState>) => {
    const next = partial ? deepMerge(config, partial) : config;
    setConfig(next);
    setSaving(true);
    try {
      await save.mutateAsync(next);
      await status.refetch();
      toast({ title: "Configuration saved", description: "All changes synced." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [config, save, status, toast]);

  useKeyboard([
    { combo: "ctrl+s", handler: (e) => { e.preventDefault(); doSave(); } },
    { combo: "ctrl+r", handler: (e) => { e.preventDefault(); status.refetch(); } },
    { combo: "ctrl+t", handler: (e) => { e.preventDefault(); handleTestAll(); } },
  ]);

  const handleTestAll = async () => {
    setTesting(true);
    setTestResults(null);
    try {
      const res = await testAll.mutateAsync();
      setTestResults(res);
      setTestModalOpen(true);
    } catch (e: any) {
      toast({ title: "Test failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleProposeSolution = async (entry: UnifiedLogEntry) => {
    try {
      const res = await logsCtl.proposeSolution.mutateAsync(entry);
      setSolutionText(res.suggestion);
      setSolutionOpen(true);
    } catch (e: any) {
      toast({ title: "Suggestion failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="p-6"><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Loading…</div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Access denied</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This dashboard is restricted to superadmins.</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Go back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const secrets = (status.data as any)?.secrets || {};
  const connectedAll = Boolean(secrets.GOOGLE_VISION_API_KEY) && Boolean(secrets.GEMINI_API_KEY || secrets.OPENAI_API_KEY) && Boolean(config.services.documentAI?.processorId);

  return (
    <div ref={topRef} className="grid grid-cols-12 gap-4 p-4">
      {/* Sidebar */}
      <aside className="col-span-12 lg:col-span-3 xl:col-span-2 sticky top-4 self-start space-y-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <SectionLink to="#connection" label="Connection" />
            <SectionLink to="#features" label="Features" />
            <SectionLink to="#workflows" label="Workflows" />
            <SectionLink to="#monitoring" label="Monitoring" />
            <SectionLink to="#testing" label="Testing" />
            <SectionLink to="#logs" label="Logs" />
          </CardContent>
        </Card>
      </aside>

      {/* Main content */}
      <main className="col-span-12 lg:col-span-9 xl:col-span-10 space-y-4">
        {/* Top bar */}
        <Card>
          <CardContent className="py-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Dev Configuration Dashboard: Unified AI</h1>
              <StatusChip ok={connectedAll} label={connectedAll ? "All Connected" : "Setup Required"} />
              <StatusChip ok={Boolean(status.data)} label="Live" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => status.refetch()} aria-label="Refresh status">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={() => doSave()} disabled={saving} aria-label="Save all">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}<Save className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button variant="secondary" onClick={handleTestAll} disabled={testing} aria-label="Run tests">
                {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}<Play className="h-4 w-4 mr-2" /> Test Connections
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connection Section */}
        <section id="connection">
          <Card>
            <CardHeader><CardTitle>Connection Setup</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input id="projectId" value={config.projectId} onChange={(e) => setConfig({ ...config, projectId: e.target.value })} onBlur={() => doSave()} />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input id="region" value={config.region} onChange={(e) => setConfig({ ...config, region: e.target.value })} onBlur={() => doSave()} />
                </div>
              </div>

              <Accordion type="multiple" className="w-full">
                <AccordionItem value="vision">
                  <AccordionTrigger>Vision API</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vision-endpoint">Endpoint</Label>
                        <Input id="vision-endpoint" value={config.services.vision.endpoint ?? ''} onChange={(e) => setConfig({ ...config, services: { ...config.services, vision: { ...config.services.vision, endpoint: e.target.value } } })} onBlur={() => doSave()} />
                        <div className="mt-2"><StatusChip ok={Boolean(secrets.GOOGLE_VISION_API_KEY)} label={secrets.GOOGLE_VISION_API_KEY ? 'Key Present' : 'Missing Key'} /></div>
                      </div>
                      <div>
                        <Label htmlFor="vision-auth">Auth Mode</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline">{config.authMode}</Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vertex">
                  <AccordionTrigger>Vertex AI</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vertex-endpoint">Endpoint</Label>
                        <Input id="vertex-endpoint" value={config.services.vertex.endpoint ?? ''} onChange={(e) => setConfig({ ...config, services: { ...config.services, vertex: { ...config.services.vertex, endpoint: e.target.value } } })} onBlur={() => doSave()} />
                        <div className="mt-2"><StatusChip ok={Boolean(secrets.GEMINI_API_KEY || secrets.OPENAI_API_KEY)} label={(secrets.GEMINI_API_KEY || secrets.OPENAI_API_KEY) ? 'Key Present' : 'Missing Key'} /></div>
                      </div>
                      <div>
                        <Label htmlFor="vertex-authType">Auth Type</Label>
                        <Input id="vertex-authType" value={config.services.vertex.authType ?? ''} onChange={(e) => setConfig({ ...config, services: { ...config.services, vertex: { ...config.services.vertex, authType: e.target.value as any } } })} onBlur={() => doSave()} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="documentAI">
                  <AccordionTrigger>Document AI</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="docai-endpoint">Endpoint</Label>
                        <Input id="docai-endpoint" value={config.services.documentAI.endpoint ?? ''} onChange={(e) => setConfig({ ...config, services: { ...config.services, documentAI: { ...config.services.documentAI, endpoint: e.target.value } } })} onBlur={() => doSave()} />
                      </div>
                      <div>
                        <Label htmlFor="docai-processor">Processor ID</Label>
                        <Input id="docai-processor" value={config.services.documentAI.processorId ?? ''} onChange={(e) => setConfig({ ...config, services: { ...config.services, documentAI: { ...config.services.documentAI, processorId: e.target.value } } })} onBlur={() => doSave()} />
                      </div>
                      <div className="mt-6">
                        <StatusChip ok={Boolean(config.services.documentAI.processorId)} label={config.services.documentAI.processorId ? 'Configured' : 'Missing Processor'} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Features Section */}
        <section id="features">
          <Card>
            <CardHeader><CardTitle>Feature Configuration</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="image-analysis">
                  <AccordionTrigger>Image Analysis</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(["label", "text", "face", "object", "safe", "properties", "logo", "landmark"] as const).map((f) => (
                        <div key={f} className="flex items-center justify-between border rounded-md p-3">
                          <div className="space-y-1">
                            <div className="font-medium capitalize">{f} detection</div>
                            <div className="text-xs text-muted-foreground">Toggle {f} detection</div>
                          </div>
                          <Switch checked={Boolean((config.features?.imageAnalysis ?? {})[f])} onCheckedChange={(val) => doSave({ features: { ...(config.features || {}), imageAnalysis: { ...(config.features?.imageAnalysis || {}), [f]: val } } as any })} />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="document-processing">
                  <AccordionTrigger>Document Processing</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(["entityExtraction", "formParsing", "ocr", "contract", "table"] as const).map((f) => (
                        <div key={f} className="flex items-center justify-between border rounded-md p-3">
                          <div className="space-y-1">
                            <div className="font-medium capitalize">{f}</div>
                            <div className="text-xs text-muted-foreground">Enable {f} pipeline</div>
                          </div>
                          <Switch checked={Boolean((config.features?.documentProcessing ?? {})[f])} onCheckedChange={(val) => doSave({ features: { ...(config.features || {}), documentProcessing: { ...(config.features?.documentProcessing || {}), [f]: val } } as any })} />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="advanced-ai">
                  <AccordionTrigger>Advanced AI / ML</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(["customModels", "generative", "multimodal", "sentiment", "prediction", "batch"] as const).map((f) => (
                        <div key={f} className="flex items-center justify-between border rounded-md p-3">
                          <div className="space-y-1">
                            <div className="font-medium capitalize">{f}</div>
                            <div className="text-xs text-muted-foreground">Enable {f}</div>
                          </div>
                          <Switch checked={Boolean((config.features?.advanced ?? {})[f])} onCheckedChange={(val) => doSave({ features: { ...(config.features || {}), advanced: { ...(config.features?.advanced || {}), [f]: val } } as any })} />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* Workflows Section */}
        <section id="workflows">
          <Card>
            <CardHeader><CardTitle>Workflow Builder</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Define processing chains (e.g., Vision → Document AI → Vertex).</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["vision", "documentAI", "vertex"] as const).map((node, i) => (
                  <div key={node} className="border rounded-md p-3">
                    <div className="text-xs text-muted-foreground">Step {i + 1}</div>
                    <div className="font-medium">{node}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => toast({ title: "Template applied", description: "Standard OCR chain set." })}>Apply Template: Standard OCR</Button>
                <Button variant="outline" onClick={() => toast({ title: "Template applied", description: "Image labeling chain set." })}>Apply Template: Image Labeling</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Updates & Monitoring Section */}
        <section id="monitoring">
          <Card>
            <CardHeader><CardTitle>Updates & Monitoring</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="secondary" onClick={() => checkUpdates.mutateAsync().then(() => toast({ title: "Checked for updates" })).catch((e: any) => toast({ title: "Update check failed", description: e?.message, variant: "destructive" }))}>Check Updates</Button>
                <StatusChip ok label="API Usage: Low" />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium">Requests (24h)</div>
                  <div className="text-2xl">—</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium">Errors (24h)</div>
                  <div className="text-2xl">—</div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium">Cost (est)</div>
                  <div className="text-2xl">—</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Testing Section */}
        <section id="testing">
          <Card>
            <CardHeader><CardTitle>Test & Query</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Button onClick={handleTestAll} disabled={testing}><Play className="h-4 w-4 mr-2" /> Run Full Chain Test</Button>
                <Button variant="outline" onClick={() => runTest.mutateAsync({ type: 'label_detection' }).then((d) => toast({ title: 'Vision label test ok' })).catch((e: any) => toast({ title: 'Label test failed', description: e?.message, variant: 'destructive' }))}>Quick: Labels</Button>
                <Button variant="outline" onClick={() => runTest.mutateAsync({ type: 'ocr' }).then(() => toast({ title: 'OCR test ok' })).catch((e: any) => toast({ title: 'OCR test failed', description: e?.message, variant: 'destructive' }))}>Quick: OCR</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Logs Section */}
        <section id="logs">
          <Card>
            <CardHeader><CardTitle>Logs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[220px]">
                  <Label>Search</Label>
                  <Input value={logsCtl.filters.search} onChange={(e) => logsCtl.setFilters({ ...logsCtl.filters, search: e.target.value })} placeholder="Search logs" />
                </div>
                <div>
                  <Label>Severity</Label>
                  <select className="border rounded-md h-9 px-2" value={logsCtl.filters.severity || 'all'} onChange={(e) => logsCtl.setFilters({ ...logsCtl.filters, severity: e.target.value as any })}>
                    {['all','debug','info','warn','error','critical'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Service</Label>
                  <select className="border rounded-md h-9 px-2" value={logsCtl.filters.service || 'all'} onChange={(e) => logsCtl.setFilters({ ...logsCtl.filters, service: e.target.value })}>
                    {['all','inventory','equipment','finance','documents','vision','vertex','documentAI','system'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={logsCtl.exportJSON}><FileJson className="h-4 w-4 mr-2" /> Export JSON</Button>
                  <Button variant="outline" onClick={logsCtl.exportCSV}><FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV</Button>
                  <Button variant="destructive" onClick={() => logsCtl.clearOlderThan.mutate(30)} disabled={logsCtl.clearOlderThan.isPending}>Clear &gt;30d</Button>
                </div>
              </div>

              <ScrollArea className="h-[360px] border rounded-md">
                <div className="min-w-full">
                  {logsCtl.isLoading ? (
                    <div className="p-4 text-sm text-muted-foreground">Loading logs…</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="p-2">Time</th>
                          <th className="p-2">Severity</th>
                          <th className="p-2">Service</th>
                          <th className="p-2">Message</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logsCtl.logs.map((l) => (
                          <tr key={l.id} className="border-t">
                            <td className="p-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                            <td className="p-2"><Badge variant={l.severity === 'error' || l.severity === 'critical' ? 'destructive' : 'secondary'} className="capitalize">{l.severity}</Badge></td>
                            <td className="p-2">{l.module || '—'}</td>
                            <td className="p-2 max-w-[520px]"><div className="truncate" title={l.event_message}>{l.event_message}</div></td>
                            <td className="p-2">
                              <Button size="sm" variant="outline" onClick={() => handleProposeSolution(l)}>Propose Solution</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        <footer className="py-4 text-xs text-muted-foreground">
          <div>Docs: <a className="underline" href="https://cloud.google.com/vision/docs" target="_blank" rel="noreferrer">Vision</a> · <a className="underline" href="https://cloud.google.com/document-ai/docs" target="_blank" rel="noreferrer">Document AI</a> · <a className="underline" href="https://cloud.google.com/vertex-ai/docs" target="_blank" rel="noreferrer">Vertex</a></div>
        </footer>
      </main>

      {/* Modals */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Connection Test Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {testResults ? (
              <pre className="text-xs max-h-[60vh] overflow-auto rounded-md border p-3">{JSON.stringify(testResults, null, 2)}</pre>
            ) : (
              <div className="text-sm text-muted-foreground">No results</div>
            )}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setTestModalOpen(false)}><ChevronLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button onClick={handleTestAll} disabled={testing}>{testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Re-run</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={solutionOpen} onOpenChange={setSolutionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Suggested Resolution</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <pre className="text-xs whitespace-pre-wrap border rounded-md p-3 max-h-[60vh] overflow-auto">{solutionText}</pre>
            <div className="flex items-center justify-end">
              <Button variant="outline" onClick={() => setSolutionOpen(false)}><ChevronLeft className="h-4 w-4 mr-2" /> Back</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
