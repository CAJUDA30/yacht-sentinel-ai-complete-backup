import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Upload, Save, Edit3, Eye, Brain, FileText, CheckCircle,
  ArrowRight, Plus, Target, Database, Clock, Star,
  Trash2, Copy, Filter, Search, Calendar, User, Tag,
  Activity, AlertCircle, Loader2, Settings, TrendingUp, BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentAIMappingService } from '@/services/DocumentAIMappingService';
import { yachtOnboardingMappingService, type MappingIntegrationResult } from '@/services/YachtOnboardingMappingService';
import { supabase } from '@/integrations/supabase/client';
import { DialogTrigger } from '@/components/ui/dialog';

// Microsoft-level interfaces

interface ExtractedField {
  id: string;
  name: string;
  originalName: string;
  customName?: string; // Personalized name
  value: string;
  confidence: number;
  keyValuePair?: { key: string; value: string; confidence: number };
  extractionMethod: string;
}

interface YachtFormField {
  key: string;
  label: string;
  category: string;
  required: boolean;
}

interface MappingProfile {
  id: string;
  name: string;
  description: string;
  documentType: 'certificate_of_registry' | 'insurance' | 'survey' | 'technical' | 'other';
  rules: Array<{
    id: string;
    aiFieldId: string;
    yachtFieldKey: string;
    confidence: number;
    isActive: boolean;
  }>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  successRate: number;
  usage: number;
  tags: string[];
  author: string;
  version: string;
  isPublic: boolean;
  category: 'registry' | 'insurance' | 'technical' | 'survey' | 'custom';
}

const YACHT_FORM_FIELDS: YachtFormField[] = [
  { key: 'vesselName', label: 'Vessel Name', category: 'Basic Info', required: true },
  { key: 'officialNumber', label: 'Official Number', category: 'Basic Info', required: true },
  { key: 'lengthOverall', label: 'Length Overall (m)', category: 'Dimensions', required: true },
  { key: 'ownerName', label: 'Owner Name', category: 'Ownership', required: true },
  { key: 'certificateNumber', label: 'Certificate Number', category: 'Certification', required: true }
];

const ProfessionalVisualMappingSystem: React.FC = () => {
  // Core state management
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [yachtFields] = useState<YachtFormField[]>(YACHT_FORM_FIELDS);
  const [currentMappings, setCurrentMappings] = useState<Record<string, string>>({});
  const [mappingProfiles, setMappingProfiles] = useState<MappingProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<MappingProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateProfileDialog, setShowCreateProfileDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [newProfileType, setNewProfileType] = useState<'certificate_of_registry' | 'insurance' | 'survey' | 'technical' | 'other'>('certificate_of_registry');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [savedMappings, setSavedMappings] = useState<Array<{id: string, name: string, fieldMappings: any[]}>>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<string>('');

  const { toast } = useToast();

  // Load saved mappings on component mount
  useEffect(() => {
    const loadSavedMappings = async () => {
      try {
        // Mock saved mappings for now
        const mockMappings = [
          {
            id: 'preset-1',
            name: 'Certificate of Registry Standard',
            fieldMappings: [
              { googleFieldName: 'vessel_name', yachtFieldName: 'vesselName' },
              { googleFieldName: 'official_number', yachtFieldName: 'officialNumber' }
            ]
          }
        ];
        setSavedMappings(mockMappings);
      } catch (error) {
        console.error('Failed to load saved mappings:', error);
      }
    };
    loadSavedMappings();
  }, []);

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    
    toast({
      title: 'Files Uploaded',
      description: `${files.length} file(s) added for processing.`
    });
  };

  // Process documents with AI
  const processDocuments = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please upload documents first.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setProcessingProgress((i / uploadedFiles.length) * 50);
        
        // Convert file to base64
        const base64 = await fileToBase64(file);
        
        try {
          // Mock document processing for now
          const mockResult = {
            success: true,
            extractedFields: [
              {
                name: `Document ${i + 1} Field 1`,
                key: `doc_${i}_field_1`,
                value: 'Sample Vessel Name',
                confidence: 0.92
              },
              {
                name: `Document ${i + 1} Field 2`,
                key: `doc_${i}_field_2`,
                value: 'Sample Official Number',
                confidence: 0.88
              }
            ]
          };
          
          if (mockResult.success && mockResult.extractedFields) {
            const newFields: ExtractedField[] = mockResult.extractedFields.map((field: any, index: number) => ({
              id: `field-${i}-${index}`,
              name: field.name || field.key || `Field ${index + 1}`,
              originalName: field.originalName || field.name || field.key || `Field ${index + 1}`,
              value: field.value || '',
              confidence: field.confidence || 0.8,
              keyValuePair: field.keyValuePair,
              extractionMethod: 'Document AI'
            }));
            
            setExtractedFields(prev => [...prev, ...newFields]);
          }
        } catch (error) {
          console.error(`Failed to process file ${file.name}:`, error);
          toast({
            title: 'Processing Error',
            description: `Failed to process ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive'
          });
        }
        
        setProcessingProgress(((i + 1) / uploadedFiles.length) * 100);
      }
      
      setActiveTab('fields');
      toast({
        title: 'Processing Complete',
        description: `Successfully processed ${uploadedFiles.length} document(s).`
      });
    } catch (error) {
      console.error('Processing failed:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, part
      };
      reader.onerror = error => reject(error);
    });
  };

  // Create field mapping
  const createMapping = (aiFieldId: string, yachtFieldKey: string) => {
    setCurrentMappings(prev => ({
      ...prev,
      [aiFieldId]: yachtFieldKey
    }));
  };

  // Remove mapping
  const removeMapping = (aiFieldId: string) => {
    setCurrentMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[aiFieldId];
      return newMappings;
    });
  };

  // Apply saved mapping preset
  const applySavedMapping = async (mappingId: string) => {
    try {
      const mapping = savedMappings.find(m => m.id === mappingId);
      if (!mapping) {
        toast({
          title: 'Mapping Not Found',
          description: 'The selected mapping preset could not be found.',
          variant: 'destructive'
        });
        return;
      }

      // Convert the saved field mappings to current mappings format
      const newMappings: Record<string, string> = {};
      mapping.fieldMappings.forEach(fieldMapping => {
        // Find matching extracted field by name similarity
        const matchingField = extractedFields.find(field => 
          field.name.toLowerCase().includes(fieldMapping.googleFieldName.toLowerCase()) ||
          fieldMapping.googleFieldName.toLowerCase().includes(field.name.toLowerCase())
        );
        
        if (matchingField) {
          newMappings[matchingField.id] = fieldMapping.yachtFieldName;
        }
      });

      setCurrentMappings(newMappings);
      setSelectedMappingId(mappingId);
      
      toast({
        title: 'Mapping Applied',
        description: `Applied "${mapping.name}" preset with ${Object.keys(newMappings).length} mappings.`
      });
    } catch (error) {
      console.error('Failed to apply saved mapping:', error);
      toast({
        title: 'Apply Failed',
        description: 'Failed to apply the selected mapping preset.',
        variant: 'destructive'
      });
    }
  };

  // Generate preview data
  const generatePreview = async () => {
    if (Object.keys(currentMappings).length === 0) {
      toast({
        title: 'No Mappings',
        description: 'Please create some field mappings first.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create mapped data structure
      const mappedData: Record<string, any> = {};
      
      Object.entries(currentMappings).forEach(([aiFieldId, yachtFieldKey]) => {
        const aiField = extractedFields.find(f => f.id === aiFieldId);
        if (aiField) {
          mappedData[yachtFieldKey] = {
            value: aiField.value,
            confidence: aiField.confidence,
            source: aiField.name,
            extractionMethod: aiField.extractionMethod
          };
        }
      });

      // Mock preview generation for now
      const mockResult = {
        success: true,
        previewData: mappedData
      };
      
      setPreviewData({
        mappedData,
        integrationResult: mockResult,
        statistics: {
          totalFields: extractedFields.length,
          mappedFields: Object.keys(currentMappings).length,
          confidence: Object.values(currentMappings).reduce((sum, _, index, arr) => {
            const aiField = extractedFields.find(f => f.id === Object.keys(currentMappings)[index]);
            return sum + (aiField?.confidence || 0);
          }, 0) / Object.keys(currentMappings).length || 0
        }
      });
      
      setShowPreview(true);
      setActiveTab('preview');
      
      toast({
        title: 'Preview Generated',
        description: `Preview created with ${Object.keys(currentMappings).length} mapped fields.`
      });
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast({
        title: 'Preview Failed',
        description: 'Failed to generate preview data.',
        variant: 'destructive'
      });
    }
  };

  // Filter fields based on search and category
  const filteredFields = extractedFields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.value.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get categories for filtering
  const categories = ['all', ...Array.from(new Set(yachtFields.map(f => f.category)))];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visual Mapping System</h2>
          <p className="text-gray-600 mt-1">AI-powered document processing and field mapping</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePreview} disabled={Object.keys(currentMappings).length === 0}>
            <Eye className="h-4 w-4 mr-2" />
            Generate Preview
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fields
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Mapping
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Document Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Click to upload documents</p>
                  <p className="text-gray-500">Supports PDF, JPG, PNG, TIFF formats</p>
                </label>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
                  <div className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Processing documents...</span>
                    <span className="text-sm text-gray-500">{processingProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={processingProgress} className="w-full" />
                </div>
              )}
              
              <Button 
                onClick={processDocuments} 
                disabled={uploadedFiles.length === 0 || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Process with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fields Tab */}
        <TabsContent value="fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Extracted Fields ({extractedFields.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {extractedFields.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No fields extracted yet. Please upload and process documents first.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {filteredFields.map((field) => (
                        <div key={field.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{field.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{field.value}</p>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {(field.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Method: {field.extractionMethod}</span>
                            {currentMappings[field.id] && (
                              <>
                                <span>•</span>
                                <span className="text-green-600 font-medium">
                                  Mapped to: {yachtFields.find(f => f.key === currentMappings[field.id])?.label}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping Tab */}
        <TabsContent value="mapping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Field Mapping ({Object.keys(currentMappings).length} mapped)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {extractedFields.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No fields available for mapping. Please extract fields first.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Apply Saved Mapping */}
                  {savedMappings.length > 0 && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-blue-900 mb-3">Quick Apply Saved Mapping</h4>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 px-3 py-2 border rounded-md"
                          value={selectedMappingId}
                          onChange={(e) => setSelectedMappingId(e.target.value)}
                        >
                          <option value="">Select a saved mapping...</option>
                          {savedMappings.map(mapping => (
                            <option key={mapping.id} value={mapping.id}>
                              {mapping.name} ({mapping.fieldMappings.length} mappings)
                            </option>
                          ))}
                        </select>
                        <Button 
                          onClick={() => applySavedMapping(selectedMappingId)}
                          disabled={!selectedMappingId}
                          variant="outline"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Category Filter */}
                  <div className="flex gap-2 flex-wrap">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category === 'all' ? 'All Categories' : category}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Mapping Interface */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* AI Fields */}
                    <div>
                      <h4 className="font-medium mb-3">AI Extracted Fields</h4>
                      <ScrollArea className="h-[400px] border rounded-lg p-4">
                        <div className="space-y-2">
                          {filteredFields.map((field) => (
                            <div 
                              key={field.id} 
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                currentMappings[field.id] ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm">{field.name}</h5>
                                  <p className="text-xs text-gray-600 mt-1 truncate">{field.value}</p>
                                </div>
                                <div className="ml-2">
                                  <Badge variant="outline" className="text-xs">
                                    {(field.confidence * 100).toFixed(0)}%
                                  </Badge>
                                  {currentMappings[field.id] && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeMapping(field.id)}
                                      className="ml-1 h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {currentMappings[field.id] && (
                                <div className="mt-2 text-xs text-green-700 font-medium">
                                  Mapped to: {yachtFields.find(f => f.key === currentMappings[field.id])?.label}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Yacht Fields */}
                    <div>
                      <h4 className="font-medium mb-3">Yacht Form Fields</h4>
                      <ScrollArea className="h-[400px] border rounded-lg p-4">
                        <div className="space-y-2">
                          {yachtFields
                            .filter(yf => selectedCategory === 'all' || yf.category === selectedCategory)
                            .map((yachtField) => (
                            <div 
                              key={yachtField.key}
                              className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                              onClick={() => {
                                // Find unmapped AI field for quick mapping
                                const unmappedField = filteredFields.find(f => !currentMappings[f.id]);
                                if (unmappedField) {
                                  createMapping(unmappedField.id, yachtField.key);
                                  toast({
                                    title: 'Quick Mapping Created',
                                    description: `Mapped "${unmappedField.name}" to "${yachtField.label}"`
                                  });
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-sm">{yachtField.label}</h5>
                                  <p className="text-xs text-gray-600 mt-1">{yachtField.category}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {yachtField.required && (
                                    <Badge variant="secondary" className="text-xs">Required</Badge>
                                  )}
                                  {Object.values(currentMappings).includes(yachtField.key) && (
                                    <Badge variant="default" className="text-xs bg-green-600">
                                      Mapped
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Mapping Profiles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Save and reuse mapping configurations</p>
                  <Dialog open={showCreateProfileDialog} onOpenChange={setShowCreateProfileDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Mapping Profile</DialogTitle>
                        <DialogDescription>
                          Save your current field mappings as a reusable profile.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="profile-name">Profile Name</Label>
                          <Input
                            id="profile-name"
                            value={newProfileName}
                            onChange={(e) => setNewProfileName(e.target.value)}
                            placeholder="Enter profile name..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="profile-description">Description</Label>
                          <Input
                            id="profile-description"
                            value={newProfileDescription}
                            onChange={(e) => setNewProfileDescription(e.target.value)}
                            placeholder="Describe this mapping profile..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="profile-type">Document Type</Label>
                          <select
                            id="profile-type"
                            value={newProfileType}
                            onChange={(e) => setNewProfileType(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="certificate_of_registry">Certificate of Registry</option>
                            <option value="insurance">Insurance Document</option>
                            <option value="survey">Survey Report</option>
                            <option value="technical">Technical Document</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <Button
                          onClick={async () => {
                            if (!newProfileName.trim()) {
                              toast({
                                title: 'Profile Name Required',
                                description: 'Please enter a name for the profile.',
                                variant: 'destructive'
                              });
                              return;
                            }

                            if (Object.keys(currentMappings).length === 0) {
                              toast({
                                title: 'No Mappings',
                                description: 'Please create some field mappings first.',
                                variant: 'destructive'
                              });
                              return;
                            }

                            // Create new profile
                            const newProfile: MappingProfile = {
                              id: `profile-${Date.now()}`,
                              name: newProfileName,
                              description: newProfileDescription,
                              documentType: newProfileType,
                              rules: Object.entries(currentMappings).map(([aiFieldId, yachtFieldKey]) => ({
                                id: `rule-${aiFieldId}-${yachtFieldKey}`,
                                aiFieldId,
                                yachtFieldKey,
                                confidence: extractedFields.find(f => f.id === aiFieldId)?.confidence || 0.8,
                                isActive: true
                              })),
                              isDefault: false,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                              successRate: 0.85,
                              usage: 0,
                              tags: [newProfileType],
                              author: 'Current User',
                              version: '1.0.0',
                              isPublic: false,
                              category: newProfileType === 'certificate_of_registry' ? 'registry' : 
                                       newProfileType === 'insurance' ? 'insurance' :
                                       newProfileType === 'survey' ? 'survey' :
                                       newProfileType === 'technical' ? 'technical' : 'custom'
                            };
                            
                            // Save to DocumentAIMappingService
                            const fieldMappings = Object.entries(currentMappings).map(([aiFieldId, yachtFieldKey]) => {
                              const aiField = extractedFields.find(f => f.id === aiFieldId);
                              return {
                                id: `${aiFieldId}-${yachtFieldKey}`,
                                googleFieldName: aiFieldId,
                                yachtFieldName: yachtFieldKey,
                                fieldType: (aiField?.name?.includes('date') ? 'date' : 
                                           aiField?.name?.includes('number') || aiField?.name?.includes('length') ? 'number' : 'text') as 'text' | 'number' | 'date' | 'boolean',
                                category: 'basic' as 'basic' | 'specifications' | 'operations' | 'owner' | 'certificate',
                                confidence: aiField?.confidence || 0.8,
                                isActive: true,
                                description: `Maps ${aiField?.name || aiFieldId} to ${yachtFieldKey}`,
                                examples: [aiField?.value || 'Example value']
                              };
                            });
                            
                            try {
                              const success = await documentAIMappingService.savePreset(
                                newProfile.name,
                                newProfile.description,
                                fieldMappings
                              );
                              
                              if (success) {
                                // Also save with yacht onboarding integration
                                const integrationResult = await yachtOnboardingMappingService.saveMappingProfileWithIntegration(
                                  newProfile.name,
                                  newProfile.description,
                                  currentMappings,
                                  extractedFields.map(field => ({
                                    ...field,
                                    type: field.name?.includes('date') ? 'date' : 
                                          field.name?.includes('number') || field.name?.includes('length') ? 'number' : 'text',
                                    category: 'basic',
                                    isRequired: false,
                                    page: 1,
                                    isEditing: false,
                                    isSplitting: false,
                                    processorId: 'default'
                                  }))
                                );
                                
                                setMappingProfiles(prev => [...prev, newProfile]);
                                setSelectedProfile(newProfile);
                                setShowCreateProfileDialog(false);
                                setNewProfileName('');
                                setNewProfileDescription('');
                                setNewProfileType('certificate_of_registry');
                                
                                toast({ 
                                  title: 'Profile Created Successfully', 
                                  description: `"${newProfile.name}" has been saved with ${newProfile.rules.length} mapping rules and yacht onboarding integration.`
                                });
                              } else {
                                throw new Error('Failed to save preset to DocumentAIMappingService');
                              }
                            } catch (error) {
                              console.error('Failed to save profile:', error);
                              toast({
                                title: 'Save Failed',
                                description: 'Failed to save mapping profile. Please try again.',
                                variant: 'destructive'
                              });
                            }
                          }}
                          disabled={!newProfileName.trim() || Object.keys(currentMappings).length === 0}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Create Profile
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Profile List Placeholder */}
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No saved profiles yet. Create your first mapping profile above.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Mapping Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!previewData ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No preview generated yet. Create mappings and click "Generate Preview".</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Total Fields</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{previewData.statistics.totalFields}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Mapped Fields</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{previewData.statistics.mappedFields}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Avg. Confidence</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {(previewData.statistics.confidence * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Mapped Data */}
                  <div>
                    <h4 className="font-medium mb-3">Mapped Data Preview</h4>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {Object.entries(previewData.mappedData).map(([yachtField, data]) => {
                            const mappedData = data as { value: string; confidence: number; source: string; extractionMethod: string };
                            return (
                            <div key={yachtField} className="border-b pb-3">
                              <div className="flex justify-between items-start mb-1">
                                <h5 className="font-medium text-sm">
                                  {yachtFields.find(f => f.key === yachtField)?.label || yachtField}
                                </h5>
                                <Badge variant="outline" className="text-xs">
                                  {(mappedData.confidence * 100).toFixed(0)}%
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-900 mb-1">{mappedData.value}</p>
                              <p className="text-xs text-gray-500">
                                Source: {mappedData.source} • Method: {mappedData.extractionMethod}
                              </p>
                            </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessionalVisualMappingSystem;
