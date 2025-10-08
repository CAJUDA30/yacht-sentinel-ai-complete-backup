import { FC } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FLAG_KEYS = [
  "grok_primary",
  "provider_endpoints_ui",
  "llm_streaming",
  "edge_warmups",
  "dept_log_cards",
] as const;

type Flags = Partial<Record<(typeof FLAG_KEYS)[number], boolean>>;

const FeatureFlagsCard: React.FC = () => {
  const { toast } = useToast();
  const [flags, setFlags] = React.useState<Flags>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    supabase
      .from("ai_system_config")
      .select("config_value")
      .eq("config_key", "feature_flags")
      .limit(1)
      .then(({ data }) => {
        if (!mounted) return;
        const v = (data?.[0] as any)?.config_value || {};
        setFlags(v as Flags);
      });
    return () => { mounted = false; };
  }, []);

  const toggle = async (key: (typeof FLAG_KEYS)[number]) => {
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    setLoading(true);
    const { error } = await supabase
      .from("ai_system_config")
      .upsert({ config_key: "feature_flags", config_value: next }, { onConflict: "config_key" });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to update flags", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Feature flags updated" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {FLAG_KEYS.map((k) => (
          <div key={k} className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor={`flag-${k}`} className="capitalize">
              {String(k).replace(/_/g, " ")}
            </Label>
            <Switch id={`flag-${k}`} checked={Boolean(flags[k])} onCheckedChange={() => toggle(k)} disabled={loading} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default FeatureFlagsCard;
