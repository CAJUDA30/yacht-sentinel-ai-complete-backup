
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Department =
  | "Engineering"
  | "Operations"
  | "Finance"
  | "Security"
  | "Marketing"
  | "HR"
  | "Sales"
  | "Compliance"
  | "General";

export type UnifiedLogRow = {
  id: string;
  created_at: string;
  source: string; // 'model_logs' | 'performance_logs' | 'processing_logs' | 'analytics_events'
  status: string | null;
  event_message: string | null;
  provider_id: string | null;
  model_ref: string | null;
  provider_name: string | null;
  latency_ms: number | null;
  metadata: any | null;
  department: Department | null;
  cost_usd: number | null;
  tokens_used: number | null;
};

export type UnifiedLogsFilters = {
  department?: Department | "All";
  status?: string | "All";
  providerId?: string | "All";
  search?: string;
  limit?: number;
};

const DEFAULT_LIMIT = 100;

export function useUnifiedLogs(initial: UnifiedLogsFilters = {}) {
  const [filters, setFilters] = useState<UnifiedLogsFilters>({
    department: "All",
    status: "All",
    providerId: "All",
    search: "",
    limit: DEFAULT_LIMIT,
    ...initial,
  });

  const qc = useQueryClient();

  const query = useQuery<UnifiedLogRow[], Error>({
    queryKey: [
      "unified-logs",
      filters.department ?? "All",
      filters.status ?? "All",
      filters.providerId ?? "All",
      filters.search ?? "",
      filters.limit ?? DEFAULT_LIMIT,
    ],
    queryFn: async () => {
      const limit = filters.limit ?? DEFAULT_LIMIT;
      let q: any = supabase.from("unified_ai_logs").select("*").order("created_at", { ascending: false }).limit(limit);

      // Department filter
      if (filters.department && filters.department !== "All") {
        q = q.eq("department", filters.department);
      }

      // Status filter
      if (filters.status && filters.status !== "All") {
        q = q.ilike("status", `%${filters.status}%`);
      }

      // Provider filter
      if (filters.providerId && filters.providerId !== "All") {
        q = q.eq("provider_id", filters.providerId);
      }

      // Simple full-text like search across event_message, status, and metadata
      if (filters.search && filters.search.trim().length > 0) {
        const s = filters.search.trim();
        // Use ilike on event_message and status; metadata::text also searched
        q = q.or([
          `event_message.ilike.%${s}%`,
          `status.ilike.%${s}%`,
          `provider_name.ilike.%${s}%`,
        ].join(","));
      }

      const { data, error } = await q;
      if (error) throw error;
      return ((data || []) as unknown) as UnifiedLogRow[];
    },
    staleTime: 10_000,
  });

  // Realtime refetch on any of the source tables or event_bus changes
  useEffect(() => {
    const channel = supabase
      .channel("unified-logs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_bus" }, () => {
        qc.invalidateQueries({ queryKey: ["unified-logs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_model_logs" }, () => {
        qc.invalidateQueries({ queryKey: ["unified-logs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_performance_logs" }, () => {
        qc.invalidateQueries({ queryKey: ["unified-logs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_processing_logs" }, () => {
        qc.invalidateQueries({ queryKey: ["unified-logs"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "analytics_events" }, () => {
        qc.invalidateQueries({ queryKey: ["unified-logs"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const setFilter = (patch: Partial<UnifiedLogsFilters>) => setFilters(prev => ({ ...prev, ...patch }));

  const departments: (Department | "All")[] = useMemo(
    () => ["All", "Engineering", "Operations", "Finance", "Security", "Marketing", "HR", "Sales", "Compliance", "General"],
    []
  );

  return { ...query, filters, setFilter, departments };
}

