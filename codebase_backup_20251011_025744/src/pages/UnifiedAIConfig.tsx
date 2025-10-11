import React, { useEffect, useMemo, useState } from "react";
import { useYachtieMultiAI } from "@/hooks/useYachtieMultiAI";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2, ArrowLeft, Info, Link2, PlayCircle, Wand2, Bot, Globe, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { YachtieQuickStart } from "@/components/unified/YachtieQuickStart";

const regions = ["us-central1", "us-east1", "us-west1", "europe-west1", "asia-east1"];

const SecretBadge: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <Badge variant={ok ? "default" : "destructive"}>{label}: {ok ? "Configured" : "Missing"}</Badge>
);

const UnifiedAIConfigPage: React.FC = () => {
  // SEO & canonical
  useEffect(() => {
    const title = "Yachtie Multi-AI Configuration: Multilingual AI for Yacht Management";
    document.title = title;
    const desc = "Superadmin: Configure Yachtie AI with multi-language support, OCR, translation, and sentiment analysis.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;
    const canonicalHref = `${window.location.origin}/superadmin?tab=unified-ai`;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonicalHref;
  }, []);

  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const isSuperAdmin = settings.user.role === 'superadmin';
  
  // Use the new Yachtie Multi-AI hook
  const { 
    status, 
    testConnections, 
    runInference, 
    addLanguage, 
    updateProviderConfig,
    yachtieConfigured,
    availableLanguages,
    availableModels,
    providers 
  } = useYachtieMultiAI();
  
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Redirect if not superadmin
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/settings');
    }
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    const needsSetup = !yachtieConfigured;
    setShowWizard(needsSetup);
  }, [yachtieConfigured]);

  const handleTestAll = async () => {
    try {
      const res = await testConnections.mutateAsync();
      setTestResult(res);
      setShowTestModal(true);
    } catch (e) {
      toast({ title: 'Test failed', description: 'See console for details.', variant: 'destructive' });
      console.error(e);
    }
  };

  const handleRunInference = async () => {
    try {
      let request: any = {
        task: imageDataUrl ? 'ocr' : 'infer',
        language: selectedLanguage,
        model: selectedModel,
      };

      if (imageDataUrl) {
        // Extract base64 from data URL
        const base64 = imageDataUrl.split(',')[1];
        request.imageBase64 = base64;
      }
      
      if (customPrompt) {
        request.text = customPrompt;
      }

      const res = await runInference.mutateAsync(request);
      setTestResult(res);
      setShowTestModal(true);
    } catch (e) {
      toast({ title: 'Inference failed', description: 'See console for details.', variant: 'destructive' });
      console.error(e);
    }
  };

  const loading = status.isLoading;

  return (
    <main className="container mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/superadmin')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to SuperAdmin
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Yachtie Multi-AI Configuration
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={yachtieConfigured ? "default" : "destructive"}>
            <Bot className="w-3 h-3 mr-1" />
            Yachtie: {yachtieConfigured ? "Connected" : "Not Connected"}
          </Badge>
          <Badge variant="outline">
            <Globe className="w-3 h-3 mr-1" />
            {availableLanguages.length} Languages
          </Badge>
          <Badge variant="outline">
            <Brain className="w-3 h-3 mr-1" />
            {availableModels.length} Models
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setShowWizard((v)=>!v)}>
            {showWizard ? <PlayCircle className="h-4 w-4 mr-1"/> : <Wand2 className="h-4 w-4 mr-1"/>}
            {showWizard ? 'Close Wizard' : 'Quick Start'}
          </Button>
        </div>
      </header>

      {showWizard && (
        <YachtieQuickStart onComplete={() => setShowWizard(false)} />
      )}

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="test">Test & Inference</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Models Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {availableModels.map((model) => (
                  <div key={model.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{model.model_name}</h3>
                        <p className="text-sm text-muted-foreground">Type: {model.model_type} | Priority: {model.priority}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={model.is_active ? "default" : "secondary"}>
                          {model.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Model ID:</span> {model.model_id}
                      </div>
                      <div>
                        <span className="font-medium">Rate Limit:</span> {model.rate_limits?.per_minute || 60}/min
                      </div>
                    </div>
                  </div>
                ))}
                
                {availableModels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No AI models configured. Set up Yachtie API key to see available models.
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={handleTestAll} disabled={testConnections.isPending}>
                  {testConnections.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Test All Models
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {availableLanguages.map((lang) => (
                  <div key={lang.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{lang.language_name}</h3>
                        <p className="text-sm text-muted-foreground">Code: {lang.language_code} | Direction: {lang.script_direction}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={lang.is_active ? "default" : "secondary"}>
                          {lang.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                {availableLanguages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No languages configured. Default languages will be added automatically.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Providers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                {providers.map((provider) => (
                  <div key={provider.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">Type: {provider.provider_type} | URL: {provider.base_url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {provider.is_primary && <Badge variant="default">Primary</Badge>}
                        <Badge variant={provider.has_credentials ? "default" : "destructive"}>
                          {provider.has_credentials ? "Configured" : "Missing Credentials"}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Capabilities:</span> {provider.capabilities.join(", ")}
                      </div>
                      <div>
                        <span className="font-medium">Languages:</span> {provider.supported_languages.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Test & Inference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="space-y-2">
                  <Label>Model Selection</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.id} value={model.model_id}>
                          {model.model_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Label>Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.language_code}>
                          {lang.language_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Upload Image for OCR</Label>
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => setImageDataUrl(reader.result as string);
                    reader.readAsDataURL(f);
                  }} />
                  {imageDataUrl && <img src={imageDataUrl} alt="Test input" className="max-h-48 rounded border" />}
                </div>
                
                <div className="space-y-2">
                  <Label>Text Prompt</Label>
                  <Textarea 
                    rows={6} 
                    value={customPrompt} 
                    onChange={(e) => setCustomPrompt(e.target.value)} 
                    placeholder="Enter text to process, translate, or analyze..."
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 justify-center">
                <Button onClick={handleRunInference} disabled={runInference.isPending}>
                  {runInference.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Run AI Inference
                </Button>
                <Button variant="outline" onClick={handleTestAll} disabled={testConnections.isPending}>
                  {testConnections.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Test All Connections
                </Button>
                <Button variant="outline" onClick={() => { setImageDataUrl(null); setCustomPrompt(""); setSelectedModel(""); }}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Test Results</DialogTitle></DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded max-h-[60vh] overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-background/60 backdrop-blur-sm rounded p-4 shadow">
            <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Saving…
          </div>
        </div>
      )}
    </main>
  );
};

export default UnifiedAIConfigPage;
