import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ClaimsRepairsProvider, useClaimsRepairs } from '@/contexts/ClaimsRepairsContext';
import { ClaimsRepairsForm } from '@/components/claims-repairs/ClaimsRepairsForm';
import { CommunicationHub } from '@/components/claims-repairs/CommunicationHub';
import { QuoteManagement } from '@/components/claims-repairs/QuoteManagement';
import { AIIntegration } from '@/components/claims-repairs/AIIntegration';
import { CrossModuleIntegration } from '@/components/claims-repairs/CrossModuleIntegration';
import { MaritimeComplianceTracker } from '@/components/claims-repairs/MaritimeComplianceTracker';
import { WorkflowAutomationDashboard } from '../components/claims-repairs/WorkflowAutomationDashboard';
import { MobileDashboard } from '../components/claims-repairs/MobileDashboard';
import { VoiceInterface } from '../components/claims-repairs/VoiceInterface';
import { AdvancedAnalyticsDashboard } from '../components/claims-repairs/AdvancedAnalyticsDashboard';
import { LiveCollaboration } from '../components/claims-repairs/LiveCollaboration';
import AdvancedSecurityDashboard from '../components/security/AdvancedSecurityDashboard';
import PerformanceOptimizationCenter from '../components/performance/PerformanceOptimizationCenter';
import {
  Search,
  Plus,
  Filter,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Ship,
  Wrench,
  MessageSquare,
  FileText,
  Settings,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Paperclip,
  Send,
  Upload,
  Eye,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const ClaimsRepairsManager: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'active';

  const {
    jobs,
    yachts,
    loading,
    selectedYacht,
    activeFilter,
    searchTerm,
    createJob,
    updateJob,
    selectYacht,
    setActiveFilter,
    setSearchTerm,
    refreshData
  } = useClaimsRepairs();

  useEffect(() => {
    refreshData();
  }, []);

  // Filter jobs based on current filters and search
  const filteredJobs = jobs.filter(job => {
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'claims' && job.job_type === 'warranty_claim') ||
      (activeFilter === 'repairs' && job.job_type === 'repair') ||
      (activeFilter === 'audits' && job.job_type === 'audit') ||
      (activeFilter === job.status);

    const matchesSearch = !searchTerm || 
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.yacht?.yacht_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'warranty_claim': return <ShieldCheck className="h-4 w-4" />;
      case 'repair': return <Wrench className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'active': return 'bg-warning';
      case 'pending': return 'bg-info';
      case 'cancelled': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const JobCard: React.FC<{ job: any }> = ({ job }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getJobTypeIcon(job.job_type)}
              <CardTitle className="text-lg">{job.name}</CardTitle>
              <Badge variant="outline" className={getPriorityColor(job.priority)}>
                {job.priority}
              </Badge>
            </div>
            <Badge className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
          </div>
          <CardDescription className="text-sm">
            {job.description || 'No description available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ship className="h-4 w-4" />
              <span>{job.yacht?.name || 'No yacht assigned'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            {job.estimated_cost && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{job.estimated_cost} {job.currency || 'USD'}</span>
              </div>
            )}
            {job.warranty_expires_at && (
              <div className={`flex items-center gap-2 text-sm ${
                new Date(job.warranty_expires_at) < new Date() ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                <Clock className="h-4 w-4" />
                <span>Warranty: {new Date(job.warranty_expires_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetails(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getJobTypeIcon(job.job_type)}
                {job.name}
                <Badge className={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Created on {new Date(job.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6">
              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Job Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Type:</strong> {job.job_type.replace('_', ' ').toUpperCase()}</div>
                    <div><strong>Priority:</strong> {job.priority}</div>
                    <div><strong>Risk Level:</strong> {job.risk_level || 'Not assessed'}</div>
                    {job.estimated_cost && (
                      <div><strong>Estimated Cost:</strong> {job.estimated_cost} {job.currency}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Yacht Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {job.yacht?.name || 'Not assigned'}</div>
                    <div><strong>IMO:</strong> {job.yacht?.imo_number || 'N/A'}</div>
                    <div><strong>Flag:</strong> {job.yacht?.flag_state || 'N/A'}</div>
                    <div><strong>Length:</strong> {job.yacht?.length_meters || 'N/A'}m</div>
                  </div>
                </div>
              </div>

              {/* Warranty Information (for warranty claims) */}
              {job.job_type === 'warranty_claim' && (
                <div>
                  <h4 className="font-semibold mb-2">Warranty Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Start Date:</strong> {job.warranty_start_date || 'Not set'}</div>
                    <div><strong>Duration:</strong> {job.warranty_duration_months ? `${job.warranty_duration_months} months` : 'Not set'}</div>
                    <div><strong>Expires:</strong> {job.warranty_expires_at ? new Date(job.warranty_expires_at).toLocaleDateString() : 'Not calculated'}</div>
                    <div className={`font-semibold ${
                      job.warranty_expires_at && new Date(job.warranty_expires_at) < new Date() ? 'text-destructive' : 'text-success'
                    }`}>
                      <strong>Status:</strong> {
                        job.warranty_expires_at 
                          ? (new Date(job.warranty_expires_at) < new Date() ? 'Expired' : 'Valid')
                          : 'Unknown'
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              {job.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Conversation
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                {job.job_type === 'warranty_claim' && (
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                )}
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in {job.job_type === 'repair' ? 'Procurement' : 'Inventory'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Claims & Repairs</h1>
          <p className="text-muted-foreground">
            Manage warranty claims, repairs, and maritime compliance inspections
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <ClaimsRepairsForm
                isOpen={true}
                onClose={() => {}}
                mode="create"
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={refreshData}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, yachts, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="claims">Warranty Claims</SelectItem>
            <SelectItem value="repairs">Repairs</SelectItem>
            <SelectItem value="audits">Audits</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        {selectedYacht && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md">
            <Ship className="h-4 w-4" />
            <span className="text-sm font-medium">{selectedYacht.yacht_name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectYacht(undefined as any)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Tabs value={defaultTab} onValueChange={(value) => setSearchParams({ tab: value })}>
        <TabsList className="grid w-full grid-cols-13">
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="conversations">Voice Chat</TabsTrigger>
          <TabsTrigger value="reports">Quotes</TabsTrigger>
          <TabsTrigger value="settings">AI Insights</TabsTrigger>
          <TabsTrigger value="integration">Cross-Module</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
          <TabsTrigger value="collaboration">Live Collab</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredJobs.filter(j => j.status === 'active').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Warranty Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredJobs.filter(j => j.job_type === 'warranty_claim').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Repair Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredJobs.filter(j => j.job_type === 'repair').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {filteredJobs.filter(j => 
                    j.warranty_expires_at && 
                    new Date(j.warranty_expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No jobs found matching your criteria</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Jobs</CardTitle>
              <CardDescription>View completed warranty claims, repairs, and audits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Completed jobs will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <VoiceInterface />
        </TabsContent>

        <TabsContent value="reports">
          <QuoteManagement />
        </TabsContent>

        <TabsContent value="settings">
          <AIIntegration />
        </TabsContent>

        <TabsContent value="integration">
          <CrossModuleIntegration selectedJobId={filteredJobs[0]?.id} />
        </TabsContent>

        <TabsContent value="compliance">
          <MaritimeComplianceTracker selectedJobId={filteredJobs[0]?.id} yachtId={selectedYacht?.id} />
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="automation">
          <WorkflowAutomationDashboard />
        </TabsContent>
        
        <TabsContent value="mobile">
          <MobileDashboard />
        </TabsContent>
        
        <TabsContent value="collaboration">
          <LiveCollaboration />
        </TabsContent>
        
        <TabsContent value="security">
          <AdvancedSecurityDashboard />
        </TabsContent>
        
        <TabsContent value="performance">
          <PerformanceOptimizationCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ClaimsRepairs: React.FC = () => {
  return (
    <ClaimsRepairsProvider>
      <ClaimsRepairsManager />
    </ClaimsRepairsProvider>
  );
};

export default ClaimsRepairs;