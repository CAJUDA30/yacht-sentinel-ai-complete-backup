import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle,
  XCircle,
  Camera,
  Mic,
  Upload,
  Eye,
  MessageSquare,
  AlertTriangle,
  Zap,
  Play,
  Pause
} from 'lucide-react';

interface AuditItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'ok' | 'ko' | 'na' | 'deferred';
  evaluation_type: 'ok_ko' | 'numeric' | 'text' | 'checkbox' | 'rating';
  ai_assisted: boolean;
  confidence_score?: number;
}

interface AuditExecutionProps {
  auditId: string;
  items: AuditItem[];
  onItemUpdate: (itemId: string, updates: Partial<AuditItem>) => void;
}

const AuditExecution: React.FC<AuditExecutionProps> = ({ auditId, items, onItemUpdate }) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [comment, setComment] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = items[currentItemIndex];
  const progress = ((currentItemIndex + 1) / items.length) * 100;

  const handleStatusChange = async (status: 'ok' | 'ko' | 'na' | 'deferred') => {
    try {
      const { error } = await supabase
        .from('audit_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', currentItem.id);

      if (error) throw error;

      onItemUpdate(currentItem.id, { status });
      
      toast({
        title: 'Status Updated',
        description: `Item marked as ${status.toUpperCase()}`,
      });

      // Auto-advance to next item
      if (currentItemIndex < items.length - 1) {
        setCurrentItemIndex(currentItemIndex + 1);
        setComment('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        variant: 'destructive'
      });
    }
  };

  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: 'Recording Started',
        description: 'Speak your audit comments...',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Could not access microphone',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: 'Recording Stopped',
        description: 'Processing voice note...',
      });
    }
  }, [isRecording, toast]);

  const analyzeWithAI = async () => {
    if (!recordedBlob && !comment) {
      toast({
        title: 'No Input',
        description: 'Please provide voice note or text comment',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      let analysisPayload: any = {
        item_id: currentItem.id,
        item_title: currentItem.title,
        item_description: currentItem.description,
        evaluation_type: currentItem.evaluation_type
      };

      if (recordedBlob) {
        // Convert blob to base64 for voice analysis
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          analysisPayload.voice_data = base64Audio;
          analysisPayload.has_voice = true;
        };
        reader.readAsDataURL(recordedBlob);
      }

      if (comment) {
        analysisPayload.text_comment = comment;
      }

      // Call enhanced multi-AI processor for audit analysis
      const { data, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
        body: {
          content: `Analyze audit item: ${currentItem.title}. ${comment || 'Voice analysis requested.'}`,
          context: `Audit evaluation for: ${currentItem.description}`,
          module: 'audit',
          action_type: 'evaluation',
          risk_level: 'medium',
          audit_data: analysisPayload
        }
      });

      if (error) throw error;

      // Process AI response
      const aiResult = data;
      const suggestedStatus = aiResult.action?.toLowerCase();
      const confidence = aiResult.confidence || 0;

      // Save AI response
      await supabase.from('audit_responses').insert({
        audit_item_id: currentItem.id,
        response_type: recordedBlob ? 'mixed' : 'text',
        text_response: comment,
        ai_analysis: aiResult,
        evaluation_result: suggestedStatus,
        confidence_score: confidence,
        recorded_by: (await supabase.auth.getUser()).data.user?.id
      });

      // Update item with AI insights
      await supabase.from('audit_ai_insights').insert({
        audit_item_id: currentItem.id,
        insight_type: 'defect_detection',
        modality: recordedBlob ? 'multi_modal' : 'text',
        insight_data: aiResult,
        confidence_score: confidence,
        ai_model: 'enhanced-multi-ai'
      });

      onItemUpdate(currentItem.id, { 
        ai_assisted: true, 
        confidence_score: confidence 
      });

      toast({
        title: 'AI Analysis Complete',
        description: `Suggested status: ${suggestedStatus?.toUpperCase()} (${Math.round(confidence * 100)}% confidence)`,
      });

    } catch (error) {
      console.error('Error analyzing with AI:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to analyze with AI',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle image upload and AI analysis
      toast({
        title: 'Image Uploaded',
        description: 'Processing image with AI vision...',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-success text-success-foreground';
      case 'ko': return 'bg-destructive text-destructive-foreground';
      case 'na': return 'bg-secondary text-secondary-foreground';
      case 'deferred': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Execution</h2>
          <p className="text-muted-foreground">
            Item {currentItemIndex + 1} of {items.length}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {progress.toFixed(0)}% Complete
        </Badge>
      </div>

      {/* Progress */}
      <Progress value={progress} className="w-full" />

      {/* Current Item */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{currentItem.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{currentItem.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {currentItem.ai_assisted && (
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  AI Assisted
                </Badge>
              )}
              <Badge className={getStatusColor(currentItem.status)}>
                {currentItem.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Multi-Modal Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Voice Input */}
            <Card className="p-4">
              <div className="text-center space-y-3">
                <Mic className={`h-8 w-8 mx-auto ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium text-sm">Voice Input</p>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className="mt-2"
                  >
                    {isRecording ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {isRecording ? 'Stop' : 'Record'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Camera Input */}
            <Card className="p-4">
              <div className="text-center space-y-3">
                <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Visual Input</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImageCapture}
                    className="mt-2"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Capture
                  </Button>
                </div>
              </div>
            </Card>

            {/* AI Analysis */}
            <Card className="p-4">
              <div className="text-center space-y-3">
                <Zap className="h-8 w-8 mx-auto text-primary" />
                <div>
                  <p className="font-medium text-sm">AI Analysis</p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={analyzeWithAI}
                    disabled={isAnalyzing}
                    className="mt-2"
                  >
                    {isAnalyzing ? (
                      <div className="animate-spin h-4 w-4 mr-1 rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Zap className="h-4 w-4 mr-1" />
                    )}
                    Analyze
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Text Comments */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Comments & Observations</label>
            <Textarea
              placeholder="Add detailed comments about this audit item..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleStatusChange('ok')}
              className="flex-1 bg-success/10 hover:bg-success/20 border-success text-success"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              OK
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleStatusChange('ko')}
              className="flex-1 bg-destructive/10 hover:bg-destructive/20 border-destructive text-destructive"
            >
              <XCircle className="h-5 w-5 mr-2" />
              KO
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleStatusChange('na')}
              className="flex-1"
            >
              <AlertTriangle className="h-5 w-5 mr-2" />
              N/A
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleStatusChange('deferred')}
              className="flex-1"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Defer
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
              disabled={currentItemIndex === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentItemIndex + 1} of {items.length}
            </span>
            <Button
              onClick={() => setCurrentItemIndex(Math.min(items.length - 1, currentItemIndex + 1))}
              disabled={currentItemIndex === items.length - 1}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default AuditExecution;