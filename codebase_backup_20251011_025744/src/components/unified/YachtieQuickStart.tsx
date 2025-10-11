import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Link as LinkIcon, Plus, Globe, Bot } from "lucide-react";
import { useYachtieMultiAI, type YachtieStatus } from "@/hooks/useYachtieMultiAI";
import { toast } from "@/components/ui/use-toast";

interface YachtieQuickStartProps {
  onComplete?: () => void;
}

const PROJECT_ID = 'vdjsfupbjtbkpuvwffbn';
const SUPABASE_EDGE_SECRETS_URL = `https://supabase.com/dashboard/project/${PROJECT_ID}/settings/functions`;

export const YachtieQuickStart: React.FC<YachtieQuickStartProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [newLanguage, setNewLanguage] = useState({ code: '', name: '' });
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  
  const { status, testConnections, addLanguage, updateProviderConfig } = useYachtieMultiAI();
  
  const steps = ["Setup", "Models", "Languages", "Test"]; // Removed Credentials step
  const pct = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  const statusData = status.data as YachtieStatus | undefined;
  
  const missing = useMemo(() => ({
    yachtie: !statusData?.yachtie_configured,
    models: statusData?.models?.length === 0,
    languages: statusData?.languages?.length === 0,
  }), [statusData]);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleAddLanguage = async () => {
    if (!newLanguage.code || !newLanguage.name) {
      toast({ title: "Error", description: "Please enter both language code and name", variant: "destructive" });
      return;
    }

    try {
      await addLanguage.mutateAsync({
        language_code: newLanguage.code.toLowerCase(),
        language_name: newLanguage.name,
      });
      
      toast({ title: "Success", description: `Language ${newLanguage.name} added successfully` });
      setNewLanguage({ code: '', name: '' });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleTestConnections = async () => {
    try {
      const result = await testConnections.mutateAsync();
      const success = result.overall_status === 'healthy';
      
      toast({ 
        title: success ? "Success" : "Warning", 
        description: success ? "All connections tested successfully" : "Some connections failed - check configuration",
        variant: success ? "default" : "destructive"
      });
      
      if (success && onComplete) {
        onComplete();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (status.isLoading) {
    return <div className="flex items-center justify-center p-8">Loading AI configuration...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Yachtie AI Quick Start Wizard
          </span>
          <span className="text-sm text-muted-foreground">{steps[step]}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={pct} className="w-full" />

        {step === 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Welcome to Yachtie AI Configuration</h3>
              <p className="text-muted-foreground">Set up your multi-language AI capabilities with advanced OCR, translation, and sentiment analysis</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Multi-Language Processing</div>
                  {statusData?.yachtie_configured ? 
                    <Badge><CheckCircle2 className="w-3 h-3 mr-1"/>Ready</Badge> : 
                    <Badge variant="destructive">Setup Required</Badge>
                  }
                </div>
                <div className="text-sm text-muted-foreground">Process text in {statusData?.total_languages || 0} languages</div>
              </div>
              
              <div className="rounded border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Smart OCR</div>
                  <Badge><CheckCircle2 className="w-3 h-3 mr-1"/>Available</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Extract text from yacht documents and forms</div>
              </div>
              
              <div className="rounded border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Translation Engine</div>
                  <Badge><CheckCircle2 className="w-3 h-3 mr-1"/>Active</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Translate crew documents and port formalities</div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available AI Models</h3>
            <div className="grid gap-3">
              {statusData?.models?.map((model) => (
                <div key={model.id} className="rounded border p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{model.model_name}</div>
                    <div className="text-sm text-muted-foreground">Type: {model.model_type} | Priority: {model.priority}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {model.is_active ? 
                      <Badge variant="default">Active</Badge> : 
                      <Badge variant="secondary">Inactive</Badge>
                    }
                  </div>
                </div>
              ))}
            </div>
            {statusData?.models?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No models configured. Default Yachtie models will be created automatically.
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Management
              </h3>
              <Badge variant="outline">{statusData?.languages?.length || 0} languages</Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label>Language Code (ISO 639-1)</Label>
                <Input 
                  placeholder="e.g. es, zh, ja" 
                  value={newLanguage.code}
                  onChange={(e) => setNewLanguage({...newLanguage, code: e.target.value})}
                />
              </div>
              <div>
                <Label>Language Name</Label>
                <Input 
                  placeholder="e.g. Español, 中文, 日本語" 
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({...newLanguage, name: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleAddLanguage} disabled={addLanguage.isPending} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Language
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-2">
              {statusData?.languages?.map((lang) => (
                <div key={lang.id} className="rounded border p-2 text-center">
                  <div className="font-medium">{lang.language_name}</div>
                  <div className="text-xs text-muted-foreground">{lang.language_code}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Test Your Configuration</h3>
              <p className="text-muted-foreground">Run a comprehensive test to verify all AI capabilities</p>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button onClick={handleTestConnections} disabled={testConnections.isPending}>
                {testConnections.isPending ? 'Testing...' : 'Run Full Test'}
              </Button>
            </div>

            <div className="text-center text-sm text-green-600">
              ✓ Yachtie AI is built-in and ready for yacht management tasks
            </div>
          </div>
        )}

        <Separator />
        
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1"/>Back
          </Button>
          <div className="text-sm text-muted-foreground">{pct}% complete</div>
          <Button onClick={next} disabled={step === steps.length - 1}>
            <ChevronRight className="w-4 h-4 mr-1"/>Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};