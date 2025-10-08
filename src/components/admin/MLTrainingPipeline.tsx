import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Play, 
  Pause, 
  X, 
  Download, 
  Upload, 
  Database, 
  TrendingUp, 
  Settings, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  BarChart3,
  Target,
  Layers,
  RefreshCw,
  Trash2,
  Eye,
  Copy,
  Edit3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EnhancedSmartScanService, { 
  MLTrainingJob, 
  SmartScanSystemConfig 
} from '@/services/EnhancedSmartScanService';

interface MLTrainingPipelineProps {
  className?: string;
}

interface TrainingDataset {
  name: string;
  description: string;
  documentCount: number;
  yachtDocuments: number;
  crewDocuments: number;
  customDocuments: number;
  quality: 'low' | 'medium' | 'high' | 'excellent';
  lastUpdated: string;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  classificationReport: any;
  trainingLoss: number[];
  validationLoss: number[];
}

const MLTrainingPipeline: React.FC<MLTrainingPipelineProps> = ({ className }) => {
  const { toast } = useToast();
  const [service] = useState(() => new EnhancedSmartScanService());
  
  const [trainingJobs, setTrainingJobs] = useState<MLTrainingJob[]>([]);
  const [config, setConfig] = useState<SmartScanSystemConfig | null>(null);
  const [activeTab, setActiveTab] = useState('datasets');
  const [isLoading, setIsLoading] = useState(true);
  
  // Training job creation
  const [newJobName, setNewJobName] = useState('');
  const [selectedTrainingType, setSelectedTrainingType] = useState<'fine_tune' | 'custom_model' | 'domain_adaptation'>('fine_tune');
  const [selectedBaseModel, setSelectedBaseModel] = useState('yachtie-enhanced-orchestrator');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 10,
    learning_rate: 0.001,
    batch_size: 16,
    validation_split: 0.2
  });
  
  // Mock data
  const [availableDatasets] = useState<TrainingDataset[]>([
    {
      name: 'yacht_documents_v2',
      description: 'Comprehensive yacht registration and insurance documents',
      documentCount: 1250,
      yachtDocuments: 850,
      crewDocuments: 0,
      customDocuments: 400,
      quality: 'excellent',
      lastUpdated: '2024-01-15'
    },
    {
      name: 'crew_certifications_v1',
      description: 'STCW certificates and crew licensing documents',
      documentCount: 890,
      yachtDocuments: 0,
      crewDocuments: 890,
      customDocuments: 0,
      quality: 'high',
      lastUpdated: '2024-01-10'
    },
    {
      name: 'maritime_mixed_dataset',
      description: 'Mixed yacht and crew documents for general training',
      documentCount: 2100,
      yachtDocuments: 1100,
      crewDocuments: 800,
      customDocuments: 200,
      quality: 'medium',
      lastUpdated: '2024-01-20'
    }
  ]);

  const [mockJobs] = useState<MLTrainingJob[]>([
    {
      id: 'job_1',
      job_name: 'Yacht Registration Fine-tuning v2.1',
      training_type: 'fine_tune',
      base_model: 'yachtie-enhanced-orchestrator',
      training_dataset: { name: 'yacht_documents_v2' },
      training_config: {
        epochs: 15,
        learning_rate: 0.0005,
        batch_size: 16,
        validation_split: 0.2
      },
      status: 'running',
      progress_percentage: 67,
      training_metrics: {
        current_epoch: 10,
        current_loss: 0.245,
        validation_accuracy: 0.874
      },
      estimated_completion: '2024-01-25T14:30:00Z'
    },
    {
      id: 'job_2',
      job_name: 'STCW Document Classifier',
      training_type: 'custom_model',
      base_model: 'general-ocr-base',
      training_dataset: { name: 'crew_certifications_v1' },
      training_config: {
        epochs: 20,
        learning_rate: 0.001,
        batch_size: 32,
        validation_split: 0.15
      },
      status: 'completed',
      progress_percentage: 100,
      training_metrics: {
        final_accuracy: 0.923,
        final_loss: 0.187,
        training_time_hours: 4.2
      },
      model_artifact_path: '/models/stcw_classifier_v1.0'
    }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const systemConfig = await service.getSystemConfig();
      setConfig(systemConfig);
      
      // Load training jobs (mock for now)
      setTrainingJobs(mockJobs);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load ML training pipeline data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startTrainingJob = async () => {
    if (!newJobName.trim() || !selectedDataset) {
      toast({
        title: "Invalid Input",
        description: "Please provide job name and select a dataset.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await service.startMLTrainingJob(
        newJobName,
        selectedTrainingType,
        selectedBaseModel,
        { dataset_name: selectedDataset },
        trainingConfig
      );

      if (result.success) {
        toast({
          title: "Training Job Started",
          description: `ML training job "${newJobName}" has been queued.`
        });
        
        // Reset form
        setNewJobName('');
        setSelectedDataset('');
        
        // Reload jobs
        loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error Starting Training",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-blue-100 text-blue-800';
      case 'good':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading ML training pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            ML Training Pipeline
          </h2>
          <p className="text-muted-foreground">
            Train custom AI models for yacht-specific document processing
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {trainingJobs.filter(j => j.status === 'running').length} Active Jobs
          </Badge>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="datasets">
            <Database className="h-4 w-4 mr-2" />
            Datasets
          </TabsTrigger>
          <TabsTrigger value="training">
            <Play className="h-4 w-4 mr-2" />
            Training Jobs
          </TabsTrigger>
          <TabsTrigger value="models">
            <Target className="h-4 w-4 mr-2" />
            Models
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Datasets Tab */}
        <TabsContent value="datasets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Datasets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableDatasets.map((dataset) => (
                  <Card key={dataset.name} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{dataset.name}</CardTitle>
                        <Badge className={getQualityColor(dataset.quality)}>
                          {dataset.quality}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">{dataset.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-medium">Total Docs</div>
                          <div className="text-blue-600">{dataset.documentCount.toLocaleString()}</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="font-medium">Yacht Docs</div>
                          <div className="text-green-600">{dataset.yachtDocuments.toLocaleString()}</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="font-medium">Crew Docs</div>
                          <div className="text-purple-600">{dataset.crewDocuments.toLocaleString()}</div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="font-medium">Custom</div>
                          <div className="text-orange-600">{dataset.customDocuments.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Updated: {dataset.lastUpdated}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Jobs Tab */}
        <TabsContent value="training" className="space-y-4">
          {/* Create New Job */}
          <Card>
            <CardHeader>
              <CardTitle>Create Training Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Name</Label>
                  <Input
                    value={newJobName}
                    onChange={(e) => setNewJobName(e.target.value)}
                    placeholder="e.g., Yacht Registration Classifier v3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Training Type</Label>
                  <Select value={selectedTrainingType} onValueChange={(value: any) => setSelectedTrainingType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fine_tune">Fine-tuning</SelectItem>
                      <SelectItem value="custom_model">Custom Model</SelectItem>
                      <SelectItem value="domain_adaptation">Domain Adaptation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Base Model</Label>
                  <Select value={selectedBaseModel} onValueChange={setSelectedBaseModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yachtie-enhanced-orchestrator">Yachtie Enhanced Orchestrator</SelectItem>
                      <SelectItem value="general-ocr-base">General OCR Base</SelectItem>
                      <SelectItem value="document-classifier-v2">Document Classifier v2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Training Dataset</Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDatasets.map((dataset) => (
                        <SelectItem key={dataset.name} value={dataset.name}>
                          {dataset.name} ({dataset.documentCount} docs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Training Configuration */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Epochs</Label>
                  <Input
                    type="number"
                    value={trainingConfig.epochs}
                    onChange={(e) => setTrainingConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Learning Rate</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={trainingConfig.learning_rate}
                    onChange={(e) => setTrainingConfig(prev => ({ ...prev, learning_rate: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Batch Size</Label>
                  <Input
                    type="number"
                    value={trainingConfig.batch_size}
                    onChange={(e) => setTrainingConfig(prev => ({ ...prev, batch_size: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Validation Split</Label>
                  <Input
                    type="number"
                    step="0.05"
                    max="0.5"
                    value={trainingConfig.validation_split}
                    onChange={(e) => setTrainingConfig(prev => ({ ...prev, validation_split: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>
              
              <Button onClick={startTrainingJob} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Training Job
              </Button>
            </CardContent>
          </Card>

          {/* Active Training Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Training Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingJobs.map((job) => (
                  <Card key={job.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <CardTitle className="text-lg">{job.job_name}</CardTitle>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                          
                          {job.status === 'running' && (
                            <Badge variant="outline">
                              {job.progress_percentage}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <div className="font-medium capitalize">{job.training_type.replace('_', ' ')}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Base Model:</span>
                          <div className="font-medium">{job.base_model}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Dataset:</span>
                          <div className="font-medium">{job.training_dataset.name}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Config:</span>
                          <div className="font-medium">
                            {job.training_config.epochs} epochs, LR {job.training_config.learning_rate}
                          </div>
                        </div>
                      </div>

                      {job.status === 'running' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.progress_percentage}%</span>
                          </div>
                          <Progress value={job.progress_percentage} className="h-2" />
                          
                          {job.training_metrics && (
                            <div className="grid grid-cols-3 gap-4 text-xs bg-gray-50 p-3 rounded">
                              <div>
                                <span className="text-gray-500">Epoch:</span>
                                <div className="font-medium">{job.training_metrics.current_epoch}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Loss:</span>
                                <div className="font-medium">{job.training_metrics.current_loss}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Val Acc:</span>
                                <div className="font-medium">{Math.round(job.training_metrics.validation_accuracy * 100)}%</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {job.status === 'completed' && job.training_metrics && (
                        <div className="grid grid-cols-3 gap-4 text-xs bg-green-50 p-3 rounded">
                          <div>
                            <span className="text-gray-500">Final Accuracy:</span>
                            <div className="font-medium text-green-600">
                              {Math.round(job.training_metrics.final_accuracy * 100)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Final Loss:</span>
                            <div className="font-medium">{job.training_metrics.final_loss}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Training Time:</span>
                            <div className="font-medium">{job.training_metrics.training_time_hours}h</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {job.status === 'running' && (
                          <Button variant="outline" size="sm">
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        
                        {job.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download Model
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4 mr-1" />
                          Clone
                        </Button>
                        
                        {job.status !== 'running' && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Trained Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No trained models available yet</p>
                <p className="text-sm">Complete training jobs to see models here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Training Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Training analytics will appear here</p>
                <p className="text-sm">Start training jobs to see performance metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLTrainingPipeline;