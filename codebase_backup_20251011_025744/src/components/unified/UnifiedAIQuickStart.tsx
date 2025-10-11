import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Link as LinkIcon } from "lucide-react";

interface QuickStartProps {
  secrets?: Record<string, any>;
  config: any;
  setConfig: (cfg: any) => void;
  onSave: () => void;
  onTestAll: () => Promise<void>;
}

const PROJECT_ID = 'vdjsfupbjtbkpuvwffbn';
const SUPABASE_EDGE_SECRETS_URL = `https://supabase.com/dashboard/project/${PROJECT_ID}/settings/functions`;

export const UnifiedAIQuickStart: React.FC<QuickStartProps> = ({ secrets, config, setConfig, onSave, onTestAll }) => {
  const [step, setStep] = useState(0);
  const steps = ["Services", "Project & Region", "Document AI", "Secrets", "Verify"];
  const pct = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  const missing = useMemo(() => ({
    vision: !secrets?.GOOGLE_VISION_API_KEY,
    vertex: !(secrets?.VERTEX_API_KEY || secrets?.GEMINI_API_KEY),
    docai: !(secrets?.DOC_AI_API_KEY || secrets?.GOOGLE_SERVICE_ACCOUNT_JSON),
    project: !config?.projectId,
  }), [secrets, config]);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quick Start Wizard</span>
          <span className="text-sm text-muted-foreground">{steps[step]}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={pct} />

        {step === 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded border p-4 space-y-2">
              <div className="flex items-center justify-between"><div className="font-medium">Vision AI</div>{missing.vision ? <Badge variant="destructive">Missing</Badge> : <Badge><CheckCircle2 className="w-3 h-3 mr-1"/>OK</Badge>}</div>
              <div className="text-sm text-muted-foreground">OCR, label & object detection</div>
              <div className="flex items-center justify-between">
                <Label>Enable OCR</Label>
                <Switch checked={!!config.features?.ocr} onCheckedChange={(v)=>setConfig({ ...config, features: { ...config.features, ocr: v }})} />
              </div>
            </div>
            <div className="rounded border p-4 space-y-2">
              <div className="flex items-center justify-between"><div className="font-medium">Vertex AI (Gemini)</div>{missing.vertex ? <Badge variant="destructive">Missing</Badge> : <Badge><CheckCircle2 className="w-3 h-3 mr-1"/>OK</Badge>}</div>
              <div className="text-sm text-muted-foreground">Multimodal/NLP on extracted text</div>
              <div className="flex items-center justify-between">
                <Label>Enable Multimodal</Label>
                <Switch checked={!!config.features?.multimodal} onCheckedChange={(v)=>setConfig({ ...config, features: { ...config.features, multimodal: v }})} />
              </div>
            </div>
            <div className="rounded border p-4 space-y-2">
              <div className="flex items-center justify-between"><div className="font-medium">Document AI</div>{missing.docai ? <Badge variant="destructive">Missing</Badge> : <Badge><CheckCircle2 className="w-3 h-3 mr-1"/>OK</Badge>}</div>
              <div className="text-sm text-muted-foreground">Form/table parsing for PDFs</div>
              <div className="flex items-center justify-between">
                <Label>Enable Forms</Label>
                <Switch checked={!!config.features?.formParsing} onCheckedChange={(v)=>setConfig({ ...config, features: { ...config.features, formParsing: v }})} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>GCP Project ID</Label>
              <Input placeholder="your-project-id" value={config.projectId || ""} onChange={(e)=>setConfig({ ...config, projectId: e.target.value })} />
              {missing.project && <div className="text-xs text-destructive mt-1">Project ID required</div>}
            </div>
            <div>
              <Label>Region</Label>
              <Input placeholder="us-central1" value={config.region || ""} onChange={(e)=>setConfig({ ...config, region: e.target.value })} />
            </div>
            <div>
              <Label>Vertex Endpoint</Label>
              <Input placeholder="vertex-ai.googleapis.com" value={config.services?.vertex?.endpoint || ""} onChange={(e)=>setConfig({ ...config, services: { ...config.services, vertex: { ...config.services.vertex, endpoint: e.target.value }}})} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Document AI Processor ID</Label>
              <Input placeholder="locations/us/processors/XXXX" value={config.services?.documentAI?.processorId || ""} onChange={(e)=>setConfig({ ...config, services: { ...config.services, documentAI: { ...config.services.documentAI, processorId: e.target.value }}})} />
            </div>
            <div>
              <Label>Processor Type</Label>
              <Input placeholder="OCR_PROCESSOR or FORM_PARSER" value={config.services?.documentAI?.processorType || ""} onChange={(e)=>setConfig({ ...config, services: { ...config.services, documentAI: { ...config.services.documentAI, processorType: e.target.value }}})} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              Manage secrets securely in Supabase Edge Function secrets.
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <a href={SUPABASE_EDGE_SECRETS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary underline">
                <LinkIcon className="w-4 h-4" /> Open Supabase Secrets
              </a>
              <div className="text-sm text-muted-foreground">Required: GOOGLE_VISION_API_KEY, GEMINI_API_KEY (or VERTEX_API_KEY), and either DOC_AI_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON.</div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="rounded border p-3 flex items-center justify-between"><div>Vision</div>{missing.vision ? <Badge variant="destructive">Missing</Badge> : <Badge>OK</Badge>}</div>
              <div className="rounded border p-3 flex items-center justify-between"><div>Vertex/Gemini</div>{missing.vertex ? <Badge variant="destructive">Missing</Badge> : <Badge>OK</Badge>}</div>
              <div className="rounded border p-3 flex items-center justify-between"><div>Document AI</div>{missing.docai ? <Badge variant="destructive">Missing</Badge> : <Badge>OK</Badge>}</div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Save your configuration and run a live connectivity test.</div>
            <div className="flex gap-2">
              <Button onClick={onSave}>Save Configuration</Button>
              <Button variant="outline" onClick={onTestAll}>Test All Connections</Button>
            </div>
          </div>
        )}

        <Separator />
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 0}><ChevronLeft className="w-4 h-4 mr-1"/>Back</Button>
          <div className="text-sm text-muted-foreground">{pct}%</div>
          <Button onClick={next} disabled={step === steps.length - 1}><ChevronRight className="w-4 h-4 mr-1"/>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
};
