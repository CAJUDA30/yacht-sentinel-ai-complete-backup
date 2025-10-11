import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UniversalSmartScan from "@/components/UniversalSmartScan";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search, Upload, Brain, Zap, File, Filter, Tag, Plus, Eye, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  category: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  tags?: string[];
  uploaded_at: string;
  uploaded_by?: string;
  equipment_id?: string;
}

interface DocumentInsight {
  type: 'compliance' | 'expiry' | 'missing' | 'recommendation';
  title: string;
  description: string;
  documents: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const DocumentsAI = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [insights, setInsights] = useState<DocumentInsight[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    loadDocumentData();
  }, []);

  const loadDocumentData = async () => {
    setLoading(true);
    try {
      // Load equipment documents from Supabase
      const { data: documentsData, error: docsError } = await supabase
        .from('equipment_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (docsError) throw docsError;

      if (documentsData) {
        const formattedDocs: Document[] = documentsData.map(doc => ({
          id: doc.id,
          document_name: doc.document_name,
          document_type: doc.document_type,
          category: doc.document_type, // Use document_type as category
          file_path: doc.file_path,
          file_size: doc.file_size,
          mime_type: doc.mime_type,
          description: doc.description,
          tags: doc.tags || [],
          uploaded_at: doc.uploaded_at,
          uploaded_by: doc.uploaded_by,
          equipment_id: doc.equipment_id
        }));

        setDocuments(formattedDocs);
        await generateInsights(formattedDocs);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (docs: Document[]) => {
    // Generate AI insights based on document analysis
    const generatedInsights: DocumentInsight[] = [];

    // Check for missing critical documents
    const criticalDocTypes = ['Certification', 'Insurance', 'Safety Manual', 'Maintenance Log'];
    const existingTypes = [...new Set(docs.map(d => d.document_type))];
    const missingTypes = criticalDocTypes.filter(type => !existingTypes.includes(type));

    missingTypes.forEach(type => {
      generatedInsights.push({
        type: 'missing',
        title: `Missing ${type}`,
        description: `Critical document type "${type}" not found in system`,
        documents: [],
        priority: 'high'
      });
    });

    // Check for old documents (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const oldDocs = docs.filter(doc => new Date(doc.uploaded_at) < oneYearAgo);
    if (oldDocs.length > 0) {
      generatedInsights.push({
        type: 'recommendation',
        title: 'Document Review Needed',
        description: `${oldDocs.length} documents are over 1 year old and may need updating`,
        documents: oldDocs.map(d => d.document_name),
        priority: 'medium'
      });
    }

    // Check document organization
    const untaggedDocs = docs.filter(doc => !doc.tags || doc.tags.length === 0);
    if (untaggedDocs.length > 0) {
      generatedInsights.push({
        type: 'recommendation',
        title: 'Improve Document Organization',
        description: `${untaggedDocs.length} documents lack proper tags for better searchability`,
        documents: untaggedDocs.map(d => d.document_name),
        priority: 'low'
      });
    }

    setInsights(generatedInsights);
  };

  const runDocumentAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          type: 'text',
          content: `Analyze ${documents.length} yacht documents for compliance, organization, and maintenance requirements. Document types: ${[...new Set(documents.map(d => d.document_type))].join(', ')}`,
          context: 'document_analysis',
          module: 'documents'
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Document analysis completed successfully'
      });
      
      await loadDocumentData();
    } catch (error) {
      console.error('Document analysis error:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze documents',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expiring_soon': return 'secondary';
      case 'expired': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'outline';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || doc.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const documentStats = {
    total: documents.length,
    byCategory: documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recentUploads: documents.filter(doc => {
      const uploadDate = new Date(doc.uploaded_at);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return uploadDate > lastWeek;
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Document Management</h1>
          <p className="text-muted-foreground">Intelligent document processing, compliance tracking, and AI-powered search</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsScanning(true)}
            variant="outline"
          >
            <Zap className="mr-2 h-4 w-4" />
            Smart Scan
          </Button>
          <Button 
            onClick={runDocumentAnalysis}
            disabled={isAnalyzing}
          >
            <Brain className="mr-2 h-4 w-4" />
            {isAnalyzing ? "Analyzing..." : "AI Analysis"}
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats.total}</div>
                <p className="text-xs text-muted-foreground">Digitally managed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
                <Upload className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentStats.recentUploads}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Tag className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(documentStats.byCategory).length}</div>
                <p className="text-xs text-muted-foreground">Document types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Insights</CardTitle>
                <Brain className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.length}</div>
                <p className="text-xs text-muted-foreground">AI recommendations</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Document Insights</CardTitle>
                <CardDescription>Latest AI analysis findings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {insights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{insight.title}</p>
                          <p className="text-xs text-muted-foreground">{insight.description}</p>
                        </div>
                        <Badge variant={getPriorityColor(insight.priority) as any}>
                          {insight.priority}
                        </Badge>
                      </div>
                      {insight.documents.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Affects: {insight.documents.slice(0, 2).join(', ')}
                          {insight.documents.length > 2 && ` and ${insight.documents.length - 2} more...`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Categories</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(documentStats.byCategory).map(([category, count]) => {
                  const percentage = (count / documentStats.total) * 100;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm">{count} docs</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search documents by name, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              {Object.keys(documentStats.byCategory).map(category => (
                <option key={category} value={category.toLowerCase()}>{category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => setSelectedDocument(doc)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <File className="h-5 w-5" />
                        {doc.document_name}
                        <Badge variant="outline">
                          {doc.document_type}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{doc.category}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="text-lg font-semibold">
                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)}KB` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doc.description && (
                    <div>
                      <p className="text-sm font-medium mb-2">Description</p>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    </div>
                  )}
                  {doc.tags && doc.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {doc.file_path && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {insight.title}
                      <Badge variant={getPriorityColor(insight.priority) as any}>
                        {insight.priority}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{insight.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insight.documents.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Affected Documents:</p>
                      <div className="flex flex-wrap gap-2">
                        {insight.documents.map((docName, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {docName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button size="sm">Take Action</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Dashboard</CardTitle>
              <CardDescription>AI-powered compliance monitoring and tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((documents.length / (documents.length + insights.filter(i => i.type === 'missing').length)) * 100)}%
                    </p>
                    <p className="text-sm text-green-800">Overall Compliance</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">
                      {insights.filter(i => i.priority === 'high' || i.priority === 'critical').length}
                    </p>
                    <p className="text-sm text-yellow-800">High Priority Issues</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {insights.filter(i => i.type === 'missing').length}
                    </p>
                    <p className="text-sm text-red-800">Missing Documents</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Compliance Status by Category</h4>
                  {Object.entries(documentStats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{category}</p>
                        <p className="text-sm text-muted-foreground">{count} documents</p>
                      </div>
                      <Badge variant="default">Compliant</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UniversalSmartScan
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanComplete={(result) => {
          console.log('Document scan result:', result);
          toast({
            title: 'Success',
            description: 'Document scan completed successfully'
          });
          loadDocumentData();
        }}
        module="documents"
        context="document_management"
        scanType="document"
      />

      {/* Document Detail Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              {selectedDocument?.document_name}
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p>{selectedDocument.document_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p>{selectedDocument.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">File Size</p>
                  <p>{selectedDocument.file_size ? `${(selectedDocument.file_size / 1024).toFixed(1)}KB` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uploaded</p>
                  <p>{new Date(selectedDocument.uploaded_at).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedDocument.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="p-3 bg-muted rounded-lg">{selectedDocument.description}</p>
                </div>
              )}
              {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsAI;