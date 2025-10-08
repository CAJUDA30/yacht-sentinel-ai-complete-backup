import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Settings, 
  Download, 
  Eye, 
  Trash2, 
  Archive,
  BarChart3,
  Zap,
  Brain,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VisualFieldMapper from './VisualFieldMapper';

interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'mapping';
  extractedFields: any[];
  mappings?: Record<string, string>;
  confidence: number;
  processorUsed: string;
  error?: string;
}

interface ProcessingStats {
  totalDocuments: number;
  successRate: number;
  avgProcessingTime: number;
  fieldsExtracted: number;
  mappingsSaved: number;
}

const DocumentProcessingDashboard: React.FC = () => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [showMapper, setShowMapper] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<ProcessingStats>({
    totalDocuments: 0,
    successRate: 0,
    avgProcessingTime: 0,
    fieldsExtracted: 0,
    mappingsSaved: 0
  });

  useEffect(() => {
    // Load documents from localStorage on component mount
    loadDocuments();
    calculateStats();
  }, [documents.length]);

  const loadDocuments = () => {
    const savedDocs = localStorage.getItem('processedDocuments');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }
  };

  const saveDocuments = (docs: ProcessedDocument[]) => {
    localStorage.setItem('processedDocuments', JSON.stringify(docs));
    setDocuments(docs);
  };

  const calculateStats = () => {
    if (documents.length === 0) return;

    const completed = documents.filter(d => d.status === 'completed');
    const totalFields = documents.reduce((sum, doc) => sum + (doc.extractedFields?.length || 0), 0);
    const totalMappings = documents.reduce((sum, doc) => sum + Object.keys(doc.mappings || {}).length, 0);

    setStats({
      totalDocuments: documents.length,
      successRate: documents.length > 0 ? (completed.length / documents.length) * 100 : 0,
      avgProcessingTime: 2.3, // Mock average - in real app this would be calculated
      fieldsExtracted: totalFields,
      mappingsSaved: totalMappings
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const newDoc: ProcessedDocument = {
      id: Date.now().toString(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      extractedFields: [],
      confidence: 0,
      processorUsed: 'Custom Extractor (8708cd1d9cd87cc1)'
    };

    const updatedDocs = [...documents, newDoc];
    saveDocuments(updatedDocs);
    setIsProcessing(true);

    // Simulate processing
    setTimeout(() => {
      simulateDocumentProcessing(newDoc.id);
    }, 1000);
  };

  const simulateDocumentProcessing = (docId: string) => {
    const updatedDocs = documents.map(doc => {
      if (doc.id === docId) {
        return {
          ...doc,
          status: 'processing' as const
        };
      }
      return doc;
    });
    saveDocuments(updatedDocs);

    // Simulate completion
    setTimeout(() => {
      const finalDocs = documents.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            status: 'completed' as const,
            processedAt: new Date().toISOString(),
            extractedFields: [
              { name: 'Vessel Name', value: 'HIGH ENERGY', confidence: 0.95 },
              { name: 'Call Sign', value: '9HB6493', confidence: 0.98 },
              { name: 'Official Number', value: '18742', confidence: 0.92 },
              { name: 'Length Overall', value: '25.82', confidence: 0.89 },
              { name: 'Owner', value: 'Y4ME HIGH ENERGY LTD', confidence: 0.94 }
            ],
            confidence: 0.94
          };
        }
        return doc;
      });
      saveDocuments(finalDocs);
      setIsProcessing(false);
    }, 3000);
  };

  const openFieldMapper = (document: ProcessedDocument) => {
    setSelectedDocument(document);
    setShowMapper(true);
  };

  const handleMappingUpdate = (mappings: Record<string, string>, metadata?: any) => {
    if (!selectedDocument) return;

    const updatedDocs = documents.map(doc => {
      if (doc.id === selectedDocument.id) {
        return {
          ...doc,
          mappings,
          status: 'completed' as const
        };
      }
      return doc;
    });

    saveDocuments(updatedDocs);
    setShowMapper(false);
    setSelectedDocument(null);
  };

  const deleteDocument = (docId: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== docId);
    saveDocuments(updatedDocs);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'uploading': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'mapping': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4 animate-spin" />;
      case 'uploading': return <Upload className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'mapping': return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Processing Dashboard</h1>
          <p className="text-gray-600 mt-1">AI-powered yacht document processing and field mapping</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            id="document-upload"
            accept=".pdf,.jpg,.jpeg,.png,.tiff"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <Button 
            onClick={() => document.getElementById('document-upload')?.click()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={isProcessing}
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgProcessingTime}s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Brain className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Fields Extracted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.fieldsExtracted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Archive className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mappings Saved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.mappingsSaved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="uploading">Uploading</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No documents found</p>
              <p className="text-sm text-gray-400 mt-1">Upload your first yacht document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <Card key={doc.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{doc.fileName}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <Badge className={getStatusColor(doc.status)}>
                              {getStatusIcon(doc.status)}
                              <span className="ml-1 capitalize">{doc.status}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleString()}
                            </span>
                            {doc.extractedFields.length > 0 && (
                              <span className="text-sm text-blue-600 font-medium">
                                {doc.extractedFields.length} fields extracted
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFieldMapper(doc)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Map Fields
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {doc.status === 'processing' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Processing document with AI...</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    )}

                    {doc.extractedFields.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600 mb-2">Sample extracted fields:</p>
                        <div className="flex flex-wrap gap-2">
                          {doc.extractedFields.slice(0, 4).map((field, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {field.name}: {field.value}
                            </Badge>
                          ))}
                          {doc.extractedFields.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{doc.extractedFields.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Field Mapper Dialog */}
      {showMapper && selectedDocument && (
        <VisualFieldMapper
          extractedData={selectedDocument.extractedFields}
          onMappingUpdate={handleMappingUpdate}
          onClose={() => {
            setShowMapper(false);
            setSelectedDocument(null);
          }}
          existingMappings={selectedDocument.mappings || {}}
        />
      )}
    </div>
  );
};

export default DocumentProcessingDashboard;