import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, FileCheck, Globe, Anchor, Send, Download, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { enhancedFormalitiesService, type FormalitiesDocument, type PortAuthority } from "@/services/EnhancedFormalitiesService";
import { fleetCentricService } from "@/services/FleetCentricService";

const FormalitiesPage = () => {
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [documents, setDocuments] = useState<FormalitiesDocument[]>([]);
  const [portAuthorities, setPortAuthorities] = useState<PortAuthority[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPortAuthorities();
    loadDocuments();
  }, []);

  const loadPortAuthorities = () => {
    const ports = enhancedFormalitiesService.getPortAuthorities();
    setPortAuthorities(ports);
    if (ports.length > 0) {
      setSelectedPort(ports[0].id);
    }
  };

  const loadDocuments = async () => {
    // In a real implementation, this would fetch from database
    // For now, we'll manage documents in component state
    setDocuments([]);
  };

  const generateCrewList = async () => {
    if (!selectedPort) {
      toast.error("Please select a port authority");
      return;
    }

    setIsGenerating(true);
    try {
      const currentYachtId = fleetCentricService.getCurrentYachtId();
      const yachtId = currentYachtId || 'default_yacht';
      
      const document = await enhancedFormalitiesService.generateCrewList(
        yachtId,
        selectedPort,
        selectedLanguage
      );
      
      setDocuments(prev => [...prev, document]);
      toast.success(`Crew list generated for ${selectedLanguage.toUpperCase()}`);
    } catch (error) {
      console.error('Error generating crew list:', error);
      toast.error('Failed to generate crew list');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCargoManifest = async () => {
    if (!selectedPort) {
      toast.error("Please select a port authority");
      return;
    }

    setIsGenerating(true);
    try {
      const currentYachtId = fleetCentricService.getCurrentYachtId();
      const yachtId = currentYachtId || 'default_yacht';
      
      const document = await enhancedFormalitiesService.generateCargoManifest(
        yachtId,
        selectedPort
      );
      
      setDocuments(prev => [...prev, document]);
      toast.success("Cargo manifest generated");
    } catch (error) {
      console.error('Error generating cargo manifest:', error);
      toast.error('Failed to generate cargo manifest');
    } finally {
      setIsGenerating(false);
    }
  };

  const submitDocuments = async (documentIds: string[]) => {
    if (documentIds.length === 0) {
      toast.error("Please select documents to submit");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await enhancedFormalitiesService.submitPortClearance(documentIds);
      
      if (result.success) {
        toast.success(`Documents submitted successfully. Reference: ${result.submissionReference}`);
        
        // Update document status
        setDocuments(prev => prev.map(doc => 
          documentIds.includes(doc.id) 
            ? { ...doc, status: 'submitted' as const, submissionReference: result.submissionReference }
            : doc
        ));
      } else {
        toast.error(`Submission failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast.error('Failed to submit documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      case 'submitted': return 'bg-blue-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const selectedPortData = portAuthorities.find(p => p.id === selectedPort);

  return (
    <div className="min-h-screen bg-gradient-wave p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-ocean rounded-xl shadow-glow">
              <ScrollText className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">Enhanced Formalities</h1>
              <p className="text-muted-foreground">Intelligent port documentation and compliance management</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="nl">Nederlands</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPort} onValueChange={setSelectedPort}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Port Authority" />
              </SelectTrigger>
              <SelectContent>
                {portAuthorities.map((port) => (
                  <SelectItem key={port.id} value={port.id}>
                    {port.name} - {port.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate Documents</TabsTrigger>
            <TabsTrigger value="documents">My Documents</TabsTrigger>
            <TabsTrigger value="tracking">Track Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {selectedPortData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {selectedPortData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Required Documents:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPortData.documentRequirements.map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {req.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Processing Time:</p>
                      <p className="text-sm text-muted-foreground">{selectedPortData.processingTime}</p>
                      <p className="text-sm font-medium mt-2">Fees:</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPortData.fees.currency} {selectedPortData.fees.clearanceFee}
                        {selectedPortData.fees.overtimeFee && ` (+${selectedPortData.fees.overtimeFee} overtime)`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileCheck className="h-5 w-5" />
                    <span>Crew List</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate official crew list with AI translation for port authorities
                  </p>
                  <Button 
                    onClick={generateCrewList} 
                    disabled={isGenerating || !selectedPort}
                    className="w-full"
                  >
                    {isGenerating ? "Generating..." : "Generate Crew List"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Cargo Manifest</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate cargo manifest from inventory data
                  </p>
                  <Button 
                    onClick={generateCargoManifest} 
                    disabled={isGenerating || !selectedPort}
                    className="w-full"
                  >
                    {isGenerating ? "Generating..." : "Generate Manifest"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Anchor className="h-5 w-5" />
                    <span>Port Clearance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Complete port clearance documentation package
                  </p>
                  <Button 
                    onClick={() => toast.info("Port clearance package coming soon")}
                    disabled={true}
                    className="w-full"
                    variant="outline"
                  >
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No documents generated yet</p>
                    <p className="text-sm text-muted-foreground">Use the Generate Documents tab to create formalities documentation</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {doc.type.replace('_', ' ').toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(doc.status)} text-white`}>
                            {doc.status}
                          </Badge>
                          <Badge variant="outline">{doc.language.toUpperCase()}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Port: {portAuthorities.find(p => p.id === doc.portId)?.name || 'Unknown'}
                          </p>
                          {doc.submissionReference && (
                            <p className="text-sm text-muted-foreground">
                              Reference: {doc.submissionReference}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {doc.status === 'draft' && (
                            <Button 
                              size="sm" 
                              onClick={() => submitDocuments([doc.id])}
                              disabled={isSubmitting}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Submit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Submission Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track the status of your submitted documents with port authorities
                </p>
                {documents.filter(d => d.submissionReference).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No submitted documents to track</p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {documents
                      .filter(d => d.submissionReference)
                      .map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{doc.type.replace('_', ' ').toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground">
                                Reference: {doc.submissionReference}
                              </p>
                            </div>
                            <Badge className={`${getStatusColor(doc.status)} text-white`}>
                              {doc.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FormalitiesPage;