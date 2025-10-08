import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  EnhancedErrorLog, 
  useEnhancedErrorLogs 
} from "@/hooks/useEnhancedErrorLogs";
import {
  AlertTriangle,
  Clock,
  User,
  Hash,
  Tag,
  CheckCircle,
  XCircle,
  Pause,
  Eye,
  MessageSquare,
  Calendar,
  BarChart3,
  Code
} from "lucide-react";

interface ErrorDetailsModalProps {
  error: EnhancedErrorLog | null;
  isOpen: boolean;
  onClose: () => void;
}

const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({
  error,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const { updateStatus } = useEnhancedErrorLogs();
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!error) return null;

  const handleStatusUpdate = async (newStatus: EnhancedErrorLog['status']) => {
    setIsUpdating(true);
    try {
      await updateStatus.mutateAsync({
        id: error.id,
        status: newStatus,
        resolutionNotes: newStatus === 'resolved' ? resolutionNotes : undefined,
      });
      
      toast({
        title: "Status Updated",
        description: `Error marked as ${newStatus}`,
      });
      
      if (newStatus === 'resolved') {
        onClose();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update error status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200';
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-500 bg-blue-50 border-blue-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'investigating': return <Pause className="h-4 w-4 text-blue-500" />;
      case 'ignored': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return 'N/A';
    
    try {
      // Parse PostgreSQL interval format (e.g., "1 day 2 hours 30 minutes")
      const parts = duration.split(' ');
      if (parts.length >= 2) {
        return `${parts[0]} ${parts[1]}`;
      }
      return duration;
    } catch {
      return duration;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Technical Details</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="resolution">Resolution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Header Info */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{error.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getSeverityColor(error.severity)}>
                    {error.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getStatusIcon(error.status)}
                    {error.status.toUpperCase()}
                  </Badge>
                  {error.category && (
                    <Badge 
                      variant="secondary"
                      style={{ backgroundColor: error.category.color + '20', color: error.category.color }}
                    >
                      {error.category.name}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>{error.error_hash.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>Occurred {error.frequency_count} times</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {error.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{error.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Impact Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${error.user_impact_score * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{error.user_impact_score}/10</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Business Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${error.business_impact_score * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{error.business_impact_score}/10</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tags */}
            {error.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {error.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Error Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Module:</strong> {error.module || 'N/A'}</div>
                  <div><strong>Source Table:</strong> {error.source_table || 'N/A'}</div>
                  <div><strong>Error Code:</strong> {error.error_code || 'N/A'}</div>
                  <div><strong>Hash:</strong> <code className="bg-muted px-2 py-1 rounded">{error.error_hash}</code></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Timestamps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <strong>First Occurred:</strong><br />
                    {new Date(error.first_occurred_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Last Occurred:</strong><br />
                    {new Date(error.last_occurred_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Created:</strong><br />
                    {new Date(error.created_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stack Trace */}
            {error.stack_trace && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Stack Trace
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                    {error.stack_trace}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {error.metadata && Object.keys(error.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                    {JSON.stringify(error.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Error Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Error First Detected</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(error.first_occurred_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {error.frequency_count > 1 && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Recurring Occurrences</div>
                      <div className="text-xs text-muted-foreground">
                        Occurred {error.frequency_count - 1} more times. Last: {new Date(error.last_occurred_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {error.status === 'resolved' && error.resolved_at && (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Error Resolved</div>
                      <div className="text-xs text-muted-foreground">
                        Resolved on {new Date(error.resolved_at).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Resolution time: {formatDuration(error.actual_resolution_time)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolution" className="space-y-4">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  {getStatusIcon(error.status)}
                  <span className="font-medium">{error.status.toUpperCase()}</span>
                  {error.resolved_at && (
                    <span className="text-sm text-muted-foreground ml-2">
                      - Resolved {new Date(error.resolved_at).toLocaleString()}
                    </span>
                  )}
                </div>

                {error.resolution_notes && (
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="text-sm font-medium mb-1">Resolution Notes:</div>
                    <div className="text-sm">{error.resolution_notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resolution Actions */}
            {error.status !== 'resolved' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Resolution Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resolution-notes">Resolution Notes</Label>
                    <Textarea
                      id="resolution-notes"
                      placeholder="Describe the steps taken to resolve this error..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => handleStatusUpdate('investigating')}
                      disabled={isUpdating || error.status === 'investigating'}
                      variant="outline"
                      size="sm"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Mark as Investigating
                    </Button>
                    
                    <Button
                      onClick={() => handleStatusUpdate('resolved')}
                      disabled={isUpdating}
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark as Resolved
                    </Button>
                    
                    <Button
                      onClick={() => handleStatusUpdate('ignored')}
                      disabled={isUpdating}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Ignore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resolution Time Estimates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Resolution Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <strong>Estimated Resolution Time:</strong> {formatDuration(error.estimated_resolution_time)}
                </div>
                {error.actual_resolution_time && (
                  <div>
                    <strong>Actual Resolution Time:</strong> {formatDuration(error.actual_resolution_time)}
                  </div>
                )}
                <div>
                  <strong>Frequency:</strong> {error.frequency_count} occurrence{error.frequency_count !== 1 ? 's' : ''}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDetailsModal;