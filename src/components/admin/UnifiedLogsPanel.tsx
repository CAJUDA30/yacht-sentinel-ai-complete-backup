
import { useEffect, useMemo, useState } from "react";
import { useUnifiedLogs, Department, UnifiedLogRow } from "@/hooks/useUnifiedLogs";
import { useEnhancedErrorLogs } from "@/hooks/useEnhancedErrorLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, ExternalLink, Filter, AlertTriangle, Info, BarChart3, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProviderModal from "@/components/admin/ProviderModal";
import ErrorAnalyticsDashboard from "@/components/admin/ErrorAnalyticsDashboard";
import ErrorDetailsModal from "@/components/admin/ErrorDetailsModal";
import { supabase } from "@/integrations/supabase/client";

type Provider = { id: string; name: string };

const statusVariant = (s?: string | null) => {
  const val = (s || "").toLowerCase();
  if (val.includes("error") || val.includes("fail") || val.includes("critical")) return "destructive" as const;
  if (val.includes("success") || val.includes("ok") || val.includes("healthy")) return "default" as const;
  if (val.includes("warn") || val.includes("degraded")) return "outline" as const;
  return "secondary" as const;
};

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

const toCSV = (rows: UnifiedLogRow[]) => {
  const headers = [
    "id","created_at","source","status","event_message","provider_id","model_ref","provider_name","latency_ms","department","cost_usd","tokens_used"
  ];
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return `"${s.replace(/"/g, '""')}"`;
    };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      r.id, r.created_at, r.source, r.status, r.event_message, r.provider_id, r.model_ref, r.provider_name,
      r.latency_ms, r.department, r.cost_usd, r.tokens_used
    ].map(escape).join(","));
  }
  return lines.join("\n");
};

interface Props { initialDepartment?: Department | "All" }
const UnifiedLogsPanel: React.FC<Props> = ({ initialDepartment }) => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedError, setSelectedError] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data = [], isLoading, filters, setFilter, departments, refetch } = useUnifiedLogs(initialDepartment ? { department: initialDepartment } : {});
  const { 
    errorLogs, 
    analytics, 
    isLoading: enhancedLoading, 
    analyticsLoading,
    processRawLog 
  } = useEnhancedErrorLogs();

  useEffect(() => {
    supabase
      .from("ai_providers")
      .select("id,name")
      .order("name", { ascending: true })
      .then(({ data }) => setProviders((data as Provider[]) || []));
  }, []);

  // Realtime alert for critical analytics events via event_bus
  useEffect(() => {
    const channel = supabase
      .channel("unified-logs-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_bus" }, (payload) => {
        const row: any = payload?.new;
        if (row?.severity && String(row.severity).toLowerCase() === "critical") {
          toast({
            title: "Critical event detected",
            description: `${row?.event_type ?? "event"} — ${row?.module ?? "system"}`,
            variant: "destructive",
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  const filtered = data;

  const onExport = (format: "csv" | "json") => {
    if (!filtered || filtered.length === 0) {
      toast({ title: "Nothing to export", description: "No rows in current filter window.", variant: "default" });
      return;
    }
    const blob = new Blob(
      [format === "csv" ? toCSV(filtered) : JSON.stringify(filtered, null, 2)],
      { type: format === "csv" ? "text/csv" : "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0,19)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openProvider = (providerId: string | null) => {
    const p = providers.find(pp => pp.id === providerId);
    if (p) setSelectedProvider(p);
  };

  const providerOptions = useMemo(() => [{ id: "All", name: "All providers" }, ...providers], [providers]);

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard Toggle */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>Enhanced Error Logs System</span>
            <div className="flex items-center gap-2">
              <Button 
                variant={showAnalytics ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showAnalytics ? "Hide Analytics" : "Show Analytics"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={"h-4 w-4 mr-2 " + (isLoading ? "animate-spin" : "")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport("csv")}>
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport("json")}>
                <Download className="h-4 w-4 mr-2" /> JSON  
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <ErrorAnalyticsDashboard 
          analytics={analytics} 
          isLoading={analyticsLoading} 
        />
      )}

      {/* Enhanced Error Logs Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Enhanced Error Logs ({errorLogs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search errors..."
              className="w-64"
            />
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Occurred</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorLogs.map((error) => (
                  <TableRow key={error.id} className="cursor-pointer hover:bg-muted/40">
                    <TableCell>
                      <Badge variant={
                        error.severity === 'critical' ? 'destructive' :
                        error.severity === 'high' ? 'default' : 'secondary'
                      }>
                        {error.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="font-medium truncate">{error.title}</div>
                      {error.description && (
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {error.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {error.category && (
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: error.category.color + '20', 
                            color: error.category.color 
                          }}
                        >
                          {error.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{error.module || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{error.frequency_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        error.status === 'resolved' ? 'default' :
                        error.status === 'investigating' ? 'secondary' : 'outline'
                      }>
                        {error.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(error.last_occurred_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedError(error)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {errorLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">
                      {enhancedLoading ? 'Loading enhanced error logs...' : 'No enhanced error logs found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Original Unified Logs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>Raw System Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={(filters.department as string) || "All"}
            onValueChange={(v) => setFilter({ department: v as Department | "All" })}
          >
          <TabsList className="w-full overflow-x-auto">
            {departments.map((d) => (
              <TabsTrigger key={d} value={String(d)}>
                {String(d)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={String(filters.department || "All")} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search logs..."
                  value={filters.search || ""}
                  onChange={(e) => setFilter({ search: e.target.value })}
                  className="w-64"
                />
                <Button variant="ghost" size="icon" onClick={() => setFilter({ search: "" })} aria-label="Clear search">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Status (e.g., error, success)"
                value={(filters.status as string) === "All" ? "" : (filters.status as string) || ""}
                onChange={(e) => setFilter({ status: e.target.value || "All" })}
                className="w-56"
              />
              <select
                className="h-9 px-3 rounded-md border bg-background text-foreground"
                value={(filters.providerId as string) || "All"}
                onChange={(e) => setFilter({ providerId: e.target.value as any })}
              >
                {providerOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Realtime updates enabled</span>
              </div>
            </div>

            <div className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Msg / Error</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openProvider(r.provider_id)}>
                      <TableCell className="whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.source}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status || "—"}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {r.provider_name || (r.provider_id ? r.provider_id.slice(0,8) : "—")}
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate" title={r.event_message || ""}>
                        {r.event_message || (typeof r.metadata === "string" ? r.metadata : JSON.stringify(r.metadata ?? {}))}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{typeof r.latency_ms === "number" ? `${r.latency_ms} ms` : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.department || "—"}</TableCell>
                      <TableCell className="text-right">
                        {r.provider_id && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openProvider(r.provider_id); }} aria-label="Open provider">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">
                        No logs found for the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Critical events will trigger in-app alerts. Slack/Email connectors can be configured via edge functions later.</span>
            </div>
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>

      {selectedProvider && (
        <ProviderModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onUpdated={() => {
            // Reload providers and logs after updates from modal
            supabase.from("ai_providers").select("id,name").order("name", { ascending: true })
              .then(({ data }) => setProviders((data as Provider[]) || []));
          }}
        />
      )}

      {/* Error Details Modal */}
      <ErrorDetailsModal
        error={selectedError}
        isOpen={!!selectedError}
        onClose={() => setSelectedError(null)}
      />
    </div>
  );
};

export default UnifiedLogsPanel;

