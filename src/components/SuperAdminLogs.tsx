import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { AISystemDashboard } from '@/components/AISystemDashboard';
import { AlertTriangle, Info, AlertCircle, CheckCircle, RefreshCw, Brain, Zap } from 'lucide-react';
import { useUnifiedAILogs, LogSeverity } from '@/hooks/useUnifiedAILogs';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'success';
  source: string;
  message: string;
  details?: any;
}

interface ScanLogEntry {
  id: string;
  sessionId: string;
  eventType: string;
  module: string;
  scanType: string;
  confidence?: number;
  processingTime?: number;
  aiModelResponses?: any;
  error?: string;
  timestamp: string;
  userId?: string;
  userAgent?: string;
}

interface LLMRecommendation {
  model: string;
  confidence: number;
  solution: string;
  reasoning: string;
}

export const SuperAdminLogs = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [consensus, setConsensus] = useState<LLMRecommendation[]>([]);
  const [consensusLoading, setConsensusLoading] = useState(false);

  // Centralized logs state and filters
  const [department, setDepartment] = useState<'all' | 'engineering' | 'operations' | 'finance' | 'marketing' | 'security' | 'system'>('all');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<'all' | LogSeverity>('all');

  // Analytics events via unified hook (canonical source)
  const {
    logs: aiLogs,
    isLoading: aiLoading,
    filters: aiFilters,
    setFilters: setAIFilters,
  } = useUnifiedAILogs({ severity: 'all', search: '' });

  const mapSeverity = (s: LogSeverity): 'error' | 'warning' | 'info' | 'success' => {
    switch (s) {
      case 'error':
      case 'critical':
        return 'error';
      case 'warn':
        return 'warning';
      case 'debug':
      case 'info':
      default:
        return 'info';
    }
  };

  const inferDepartment = (entry: LogEntry): 'engineering' | 'operations' | 'finance' | 'marketing' | 'security' | 'system' => {
    const src = (entry.source || '').toLowerCase();
    const msg = (entry.message || '').toLowerCase();
    const meta = (entry.details || {}) as any;
    const mod = String(meta.module || meta.table || meta.service || '').toLowerCase();

    if (mod.includes('finance') || mod.includes('procurement') || msg.includes('invoice') || msg.includes('transaction')) return 'finance';
    if (mod.includes('auth') || mod.includes('security') || msg.includes('policy') || msg.includes('permission')) return 'security';
    if (mod.includes('inventory') || mod.includes('maintenance') || mod.includes('crew') || mod.includes('navigation') || mod.includes('fleet') || mod.includes('charter') || mod.includes('documents')) return 'operations';
    if (mod.includes('marketing') || msg.includes('campaign') || msg.includes('crm')) return 'marketing';
    if (src.includes('edge') || src.includes('analytics') || mod.startsWith('ai_') || msg.includes('ai') || mod.includes('system') || src.includes('system')) return 'engineering';
    if (src.includes('system')) return 'system';
    return 'engineering';
  };

  // Fetch only edge function logs; analytics are handled by useUnifiedAILogs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: functionLogs } = await supabase.functions.invoke('system-monitor', {
        body: { action: 'getLogs', limit: 200 }
      });

      const functionMapped: LogEntry[] = (functionLogs?.logs || []).map((log: any) => ({
        id: log.id || `${Date.now()}-${Math.random()}`,
        timestamp: log.timestamp || new Date().toISOString(),
        level: (log.level || 'info') as any,
        source: 'Edge Functions',
        message: log.message || 'No message',
        details: log.metadata || {},
      }));

      setLogs(functionMapped);
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);
      setLogs([{
        id: 'error-' + Date.now(),
        timestamp: new Date().toISOString(),
        level: 'error',
        source: 'System',
        message: 'Failed to fetch system logs',
        details: { error: error?.message }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchScanLogs = async () => {
    setScanLoading(true);
    try {
      const { data: scanData } = await supabase.functions.invoke('system-monitor', {
        body: { action: 'getScanLogs', limit: 200 }
      });

      if (scanData?.scanLogs) {
        setScanLogs(scanData.scanLogs.sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
    } catch (error) {
      console.error('Failed to fetch scan logs:', error);
      setScanLogs([]);
    } finally {
      setScanLoading(false);
    }
  };

  // Normalize analytics logs to LogEntry and merge with function logs
  const analyticsMapped = useMemo<LogEntry[]>(() =>
    (aiLogs || []).map((l: any) => ({
      id: l.id,
      timestamp: l.created_at,
      level: mapSeverity(l.severity),
      source: (l.module || 'Analytics') as string,
      message: l.event_message,
      details: { module: l.module, ...(l.metadata || {}) },
    }))
  , [aiLogs]);

  const allLogs = useMemo<LogEntry[]>(() =>
    [...analyticsMapped, ...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  , [analyticsMapped, logs]);

  // Sync filters to analytics hook
  useEffect(() => {
    setAIFilters((f) => ({ ...f, search, severity }));
  }, [search, severity, setAIFilters]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((l) => {
      if (severity !== 'all' && l.level !== mapSeverity(severity as LogSeverity)) return false;
      if (search) {
        const s = search.toLowerCase();
        const text = `${l.message} ${l.source} ${JSON.stringify(l.details || {})}`.toLowerCase();
        if (!text.includes(s)) return false;
      }
      if (department !== 'all' && inferDepartment(l) !== department) return false;
      return true;
    });
  }, [allLogs, department, search, severity]);

  const exportCombinedJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCombinedCSV = () => {
    const headers = ['id','timestamp','level','source','message','department','details'];
    const esc = (val: any) => '"' + String(val ?? '').replace(/"/g, '""') + '"';
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.level,
      l.source,
      l.message,
      inferDepartment(l),
      JSON.stringify(l.details || {}),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const requestLLMConsensus = async () => {
    if (allLogs.length === 0) return;

    setConsensusLoading(true);
    try {
      const errorLogs = allLogs.filter(log => log.level === 'error').slice(0, 5);
      const { data } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          prompt: `Analyze these system errors and provide solutions:\n\n${JSON.stringify(errorLogs, null, 2)}`,
          models: ['gpt-4.1-2025-04-14', 'grok-beta', 'deepseek-chat'],
          consensus: true
        }
      });

      if (data?.responses) {
        const recommendations: LLMRecommendation[] = data.responses.map((response: any, index: number) => ({
          model: ['GPT-4.1', 'Grok', 'DeepSeek'][index] || 'Unknown',
          confidence: response.confidence || 0.8,
          solution: response.content || 'No solution provided',
          reasoning: response.reasoning || 'No reasoning provided'
        }));
        setConsensus(recommendations);
      }
    } catch (error) {
      console.error('Failed to get LLM consensus:', error);
    } finally {
      setConsensusLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchScanLogs();
    const interval = setInterval(() => {
      fetchLogs();
      fetchScanLogs();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'success': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('superadmin.title')}</h2>
          <p className="text-muted-foreground">Advanced system monitoring and AI-powered diagnostics</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchLogs} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
          <Button onClick={requestLLMConsensus} disabled={consensusLoading || logs.length === 0}>
            <Brain className={`h-4 w-4 mr-2 ${consensusLoading ? 'animate-pulse' : ''}`} />
            {consensusLoading ? 'Analyzing...' : 'Get AI Consensus'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">AI Dashboard</TabsTrigger>
          <TabsTrigger value="scans">Smart Scan Logs</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="consensus">{t('superadmin.consensus')}</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AISystemDashboard />
        </TabsContent>


        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Enterprise Smart Scan Logs</span>
                <Badge variant="outline">{scanLogs.length} sessions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <div className="space-y-3">
                  {scanLogs.map((scanLog) => (
                    <div
                      key={scanLog.id}
                      className="p-4 border rounded-lg bg-card/50 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{scanLog.module}</Badge>
                          <Badge variant="secondary">{scanLog.scanType}</Badge>
                          <Badge variant={scanLog.eventType === 'scan_error' ? 'destructive' : 'default'}>
                            {scanLog.eventType.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {scanLog.confidence && (
                            <Badge variant="default">
                              {Math.round(scanLog.confidence * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(scanLog.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div><strong>Session:</strong> {scanLog.sessionId}</div>
                        {scanLog.processingTime && (
                          <div><strong>Processing Time:</strong> {scanLog.processingTime}ms</div>
                        )}
                        {scanLog.error && (
                          <div className="text-destructive"><strong>Error:</strong> {scanLog.error}</div>
                        )}
                        {scanLog.userId && (
                          <div><strong>User:</strong> {scanLog.userId}</div>
                        )}
                      </div>
                      
                      {scanLog.aiModelResponses && (
                        <details className="mt-2 text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            AI Model Responses
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                            {JSON.stringify(scanLog.aiModelResponses, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                  {scanLogs.length === 0 && !scanLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No smart scan sessions recorded yet.</p>
                      <p className="text-sm">Scan logs will appear here for enterprise monitoring.</p>
                    </div>
                  )}
                  {scanLoading && (
                    <div className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading smart scan logs...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Centralized Logs</span>
                  <Badge variant="outline">{filteredLogs.length} entries</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search logs…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-52"
                    aria-label="Search logs"
                  />
                  <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                    <SelectTrigger className="w-40" aria-label="Severity filter">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severities</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={exportCombinedJSON}>Export JSON</Button>
                  <Button variant="outline" size="sm" onClick={exportCombinedCSV}>Export CSV</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {(['all','engineering','operations','finance','marketing','security','system'] as const).map((dep) => (
                  <Button
                    key={dep}
                    variant={department === dep ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDepartment(dep)}
                    aria-pressed={department === dep}
                  >
                    {dep.charAt(0).toUpperCase() + dep.slice(1)}
                  </Button>
                ))}
              </div>
              <Separator className="mb-3" />
              <ScrollArea className="h-[600px] w-full">
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg bg-card/50 backdrop-blur-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getLevelIcon(log.level)}
                          <Badge variant={getLevelColor(log.level) as any}>{String(log.level).toUpperCase()}</Badge>
                          <Badge variant="outline">{log.source}</Badge>
                          <Badge variant="secondary">{inferDepartment(log)}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{log.message}</p>
                      {log.details && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">Show details</summary>
                          <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  ))}

                  {filteredLogs.length === 0 && !(loading || aiLoading) && (
                    <div className="text-center py-8 text-muted-foreground">No logs match the current filters.</div>
                  )}
                  {(loading || aiLoading) && (
                    <div className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading logs…</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consensus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>AI Consensus Analysis</span>
                {consensus.length > 0 && (
                  <Badge variant="outline">{consensus.length} models</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consensus.length > 0 ? (
                <div className="space-y-4">
                  {consensus.map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-card/50 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{rec.model}</Badge>
                          <Badge variant="secondary">
                            {Math.round(rec.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium mb-1">Recommended Solution:</h4>
                          <p className="text-sm">{rec.solution}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Reasoning:</h4>
                          <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No AI analysis available yet.</p>
                  <p className="text-sm">Click "Get AI Consensus" to analyze current system issues.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};