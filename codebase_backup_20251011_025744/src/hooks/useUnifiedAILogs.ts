import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type LogSeverity = "debug" | "info" | "warn" | "error" | "critical";

export interface UnifiedLogEntry {
  id: string;
  created_at: string;
  severity: LogSeverity;
  event_message: string;
  module?: string | null;
  metadata?: any;
}

export interface LogFilters {
  search?: string;
  severity?: LogSeverity | "all";
  service?: string | "all"; // maps to module
  startDate?: string; // ISO
  endDate?: string;   // ISO
}

const DEFAULT_LIMIT = 200;

export function useUnifiedAILogs(initialFilters?: Partial<LogFilters>) {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<LogFilters>({
    search: "",
    severity: "all",
    service: "all",
    ...initialFilters,
  });

  const fetchLogs = useCallback(async (): Promise<UnifiedLogEntry[]> => {
    let query = supabase
      .from("analytics_events")
      .select("id, created_at, severity, event_message, module, metadata")
      .order("created_at", { ascending: false })
      .limit(DEFAULT_LIMIT);

    if (filters.severity && filters.severity !== "all") {
      query = query.eq("severity", filters.severity);
    }
    if (filters.service && filters.service !== "all") {
      query = query.eq("module", filters.service);
    }
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as unknown as UnifiedLogEntry[];
  }, [filters.endDate, filters.severity, filters.service, filters.startDate]);

  const logsQuery = useQuery({
    queryKey: ["unified-ai", "logs", filters],
    queryFn: fetchLogs,
    refetchInterval: 15000,
  });

  const filtered = useMemo(() => {
    const list = logsQuery.data || [];
    if (!filters.search) return list;
    const s = filters.search.toLowerCase();
    return list.filter((l) =>
      `${l.event_message} ${l.module ?? ""} ${JSON.stringify(l.metadata ?? {})}`
        .toLowerCase()
        .includes(s)
    );
  }, [logsQuery.data, filters.search]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unified-ai-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const exportCSV = useCallback(() => {
    const headers = ["id", "created_at", "severity", "module", "event_message", "metadata"]; 
    const esc = (val: any) => {
      const s = String(val ?? "");
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const rows = filtered.map((l) => [
      l.id,
      l.created_at,
      l.severity,
      l.module ?? "",
      JSON.stringify(l.event_message),
      JSON.stringify(l.metadata ?? {}),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unified-ai-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const clearOlderThan = useMutation({
    mutationFn: async (days: number) => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("analytics_events")
        .delete()
        .lte("created_at", cutoff);
      if (error) throw error;
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unified-ai", "logs"] }),
  });

  const proposeSolution = useMutation({
    mutationFn: async (entry: UnifiedLogEntry) => {
      const { data, error } = await supabase.functions.invoke("logs-suggest-solution", {
        body: { log: entry },
      });
      if (error) throw error;
      return data as { suggestion: string };
    },
  });

  useEffect(() => {
    const id = setInterval(() => logsQuery.refetch(), 30000);
    return () => clearInterval(id);
  }, [logsQuery]);

  return {
    filters,
    setFilters,
    logs: filtered,
    isLoading: logsQuery.isLoading,
    error: logsQuery.error as any,
    refetch: logsQuery.refetch,
    exportJSON,
    exportCSV,
    clearOlderThan,
    proposeSolution,
  };
}
