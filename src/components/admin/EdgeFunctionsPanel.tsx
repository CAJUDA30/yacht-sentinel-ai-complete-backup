
import React, { useState, useEffect } from "react";
import { useEdgeFunctionsAdmin } from "@/hooks/useEdgeFunctionsAdmin";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Save, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EdgeFunctionsPanel: React.FC = () => {
  const { list, upsert, warmCheck } = useEdgeFunctionsAdmin();
  const { toast } = useToast();
  const [local, setLocal] = useState<Record<string, any>>({});

  const settings = list.data?.settings ?? [];
  const health = list.data?.health ?? [];

  const getHealth = (name: string) => health.find(h => h.function_name === name);

  const onChangeField = (fn: string, key: string, value: any) => {
    setLocal(prev => ({
      ...prev,
      [fn]: { ...(prev[fn] ?? {}), [key]: value },
    }));
  };

  const onSave = async (fn: string) => {
    const patch = { function_name: fn, ...local[fn] };
    await upsert.mutateAsync(patch);
    toast({ title: "Saved", description: `${fn} settings updated` });
  };

  const onWarm = async (fn: string) => {
    const res = await warmCheck.mutateAsync(fn);
    const desc = res.status === "healthy"
      ? `Healthy in ${res.latency_ms ?? "—"} ms`
      : `Status: ${res.status}`;
    toast({ title: `Warm & Check ${fn}`, description: desc, variant: res.status === "healthy" ? "default" : "destructive" });
  };

  const onWarmAll = async () => {
    const names = settings.map(s => s.function_name);
    await Promise.all(names.map(n => warmCheck.mutateAsync(n).catch(() => null)));
    toast({ title: "Warm & Check", description: `Triggered for ${names.length} functions` });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Edge Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">
              Manage settings, warm-up, and check health. Protected functions (verify_jwt=true) are skipped for health checks.
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => list.refetch()} disabled={list.isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={onWarmAll} disabled={list.isLoading || warmCheck.isPending}>
                <Activity className="h-4 w-4 mr-2" />
                Warm All
              </Button>
            </div>
          </div>

          <div className="w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Timeout (ms)</TableHead>
                  <TableHead>Warm Cron</TableHead>
                  <TableHead>Verify JWT</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map(s => {
                  const h = getHealth(s.function_name);
                  const pending = upsert.isPending || warmCheck.isPending;
                  return (
                    <TableRow key={s.function_name}>
                      <TableCell className="font-medium">{s.function_name}</TableCell>
                      <TableCell>
                        <Switch
                          checked={(local[s.function_name]?.enabled ?? s.enabled) as boolean}
                          onCheckedChange={(v) => onChangeField(s.function_name, "enabled", v)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={(local[s.function_name]?.timeout_ms ?? s.timeout_ms) as number}
                          onChange={(e) => onChangeField(s.function_name, "timeout_ms", Number(e.target.value))}
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={(local[s.function_name]?.warm_schedule ?? s.warm_schedule ?? "") as string}
                          onChange={(e) => onChangeField(s.function_name, "warm_schedule", e.target.value)}
                          placeholder="*/10 * * * *"
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.verify_jwt ? "default" : "outline"}>
                          {s.verify_jwt ? "true" : "false"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={(local[s.function_name]?.department ?? s.department ?? "") as string}
                          onChange={(e) => onChangeField(s.function_name, "department", e.target.value)}
                          placeholder="Operations"
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        {h ? (
                          <div className="flex items-center gap-2">
                            <Badge variant={h.status === "healthy" ? "default" : (h.status?.includes("skip") ? "outline" : "destructive")}>
                              {h.status}
                            </Badge>
                            {typeof h.latency_ms === "number" && (
                              <span className="text-xs text-muted-foreground">{h.latency_ms} ms</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => onWarm(s.function_name)} disabled={pending}>
                            <Activity className="h-4 w-4 mr-2" />
                            Warm & Check
                          </Button>
                          <Button size="sm" onClick={() => onSave(s.function_name)} disabled={pending}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {settings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      No functions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionsPanel;
