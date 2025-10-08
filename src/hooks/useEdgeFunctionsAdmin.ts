import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EdgeFunctionSetting {
  function_name: string;
  enabled: boolean;
  timeout_ms: number;
  warm_schedule: string | null;
  verify_jwt: boolean | null;
  department: string | null;
  feature_flag: string | null;
  updated_at?: string;
}

export interface EdgeFunctionHealth {
  function_name: string;
  status: string;
  last_checked_at?: string | null;
  latency_ms?: number | null;
  region?: string | null;
  version?: string | null;
  error?: any;
  metadata?: any;
  updated_at?: string;
}

export function useEdgeFunctionsAdmin() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["edge-functions", "settings-health"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("edge-control", {
        body: { action: "list_settings" },
      });
      if (error) throw error;
      return data as { settings: EdgeFunctionSetting[]; health: EdgeFunctionHealth[] };
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<EdgeFunctionSetting> & { function_name: string }) => {
      const { data, error } = await supabase.functions.invoke("edge-control", {
        body: { action: "upsert_setting", payload },
      });
      if (error) throw error;
      return data as { updated: EdgeFunctionSetting };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edge-functions", "settings-health"] }),
  });

  const warmCheck = useMutation({
    mutationFn: async (function_name: string) => {
      const { data, error } = await supabase.functions.invoke("edge-control", {
        body: { action: "warm_and_check", function_name },
      });
      if (error) throw error;
      return data as { function: string; status: string; latency_ms?: number; error?: any };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["edge-functions", "settings-health"] }),
  });

  // Realtime refetch when events about edge-control or health are emitted
  useEffect(() => {
    const channel = supabase
      .channel("edge-functions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "edge_function_settings" }, () => {
        qc.invalidateQueries({ queryKey: ["edge-functions", "settings-health"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "edge_function_health" }, () => {
        qc.invalidateQueries({ queryKey: ["edge-functions", "settings-health"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "event_bus" }, (payload) => {
        const evt: any = payload?.new;
        if (evt?.event_type && (String(evt.event_type).includes("edge") || String(evt.module) === "edge_function_health")) {
          qc.invalidateQueries({ queryKey: ["edge-functions", "settings-health"] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return { list, upsert, warmCheck };
}

