/**
 * Crew Onboarding Dashboard Component
 * Displays and manages comprehensive crew onboarding workflows
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  Eye,
  Download,
  Zap,
  Brain
} from "lucide-react";
import { toast } from "sonner";
import { crewOnboardingService, type OnboardingWorkflow, type CrewOnboardingData } from "@/services/CrewOnboardingService";
import { fleetCentricService } from "@/services/FleetCentricService";
import UniversalSmartScan from "@/components/UniversalSmartScan";

const CrewOnboardingDashboard: React.FC = () => {
  const [workflows, setWorkflows] = useState<OnboardingWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<OnboardingWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [isSmartScanOpen, setIsSmartScanOpen] = useState(false);
  const [scanContext, setScanContext] = useState<{workflowId: string, documentType: string} | null>(null);
  const [newCrewData, setNewCrewData] = useState<Partial<CrewOnboardingData>>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      nationality: '',
      email: '',
      phone: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    }
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const currentYachtId = fleetCentricService.getCurrentYachtId();
      const yachtId = currentYachtId;
      
      const activeWorkflows = await crewOnboardingService.getActiveWorkflows(yachtId);
      setWorkflows(activeWorkflows);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast.error('Failed to load onboarding workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewWorkflow = async () => {
    if (!newCrewData.personalInfo?.firstName || !newCrewData.personalInfo?.lastName) {
      toast.error('Please provide at least first and last name');
      return;
    }

    setIsCreatingWorkflow(true);
    try {
      const currentYachtId = fleetCentricService.getCurrentYachtId();
      const yachtId = currentYachtId || 'default_yacht';
      
      const workflow = await crewOnboardingService.initiateCrewOnboarding(
        yachtId,
        'current_user', // This should come from auth context
        newCrewData
      );
      
      setWorkflows(prev => [...prev, workflow]);
      setNewCrewData({
        personalInfo: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          nationality: '',
          email: '',
          phone: '',
          emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
          }
        }
      });
      
      toast.success(`Onboarding workflow created for ${newCrewData.personalInfo?.firstName} ${newCrewData.personalInfo?.lastName}`);
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create onboarding workflow');
    } finally {
      setIsCreatingWorkflow(false);
    }
  };

  const handleSmartScan = (workflowId: string, documentType: string) => {
    setScanContext({ workflowId, documentType });
    setIsSmartScanOpen(true);
  };

  const handleScanComplete = async (scanResult: any) => {
    if (!scanContext) return;

    try {
      const result = await crewOnboardingService.processScannedDocument(
        scanContext.workflowId,
        scanContext.documentType,
        scanResult
      );

      if (result.success) {
        toast.success(`${scanContext.documentType} document processed successfully`);
        await loadWorkflows(); // Refresh workflows
      } else {
        toast.error(result.error || 'Document processing failed');
      }
    } catch (error) {
      console.error('Error processing scan result:', error);
      toast.error('Failed to process scanned document');
    } finally {
      setIsSmartScanOpen(false);
      setScanContext(null);
    }
  };

  const completeStep = async (workflowId: string, stepId: string) => {
    try {
      const result = await crewOnboardingService.completeStep(workflowId, stepId);
      
      if (result.success) {
        toast.success('Step completed successfully');
        await loadWorkflows();
        
        if (result.nextStep) {
          toast.info(`Next step: ${result.nextStep.name}`);
        } else {
          toast.success('All steps completed! Workflow ready for approval.');
        }
      }
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Failed to complete step');
    }
  };

  const performBackgroundCheck = async (workflowId: string) => {
    try {
      const result = await crewOnboardingService.performBackgroundCheck(workflowId);
      
      if (result.success) {
        toast.success('Background check completed');
        await loadWorkflows();
      } else {
        toast.error(result.error || 'Background check failed');
      }
    } catch (error) {
      console.error('Error performing background check:', error);
      toast.error('Failed to perform background check');
    }
  };

  const approveCrewMember = async (workflowId: string, position: string) => {
    try {
      const result = await crewOnboardingService.approveCrewMember(
        workflowId,
        position,
        'current_user' // This should come from auth context
      );
      
      if (result.success) {
        toast.success('Crew member approved and assigned successfully');
        await loadWorkflows();
      } else {
        toast.error(result.error || 'Approval failed');
      }
    } catch (error) {
      console.error('Error approving crew member:', error);
      toast.error('Failed to approve crew member');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'pending_validation': return 'bg-orange-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'completed': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  const getStepIcon = (step: any) => {
    if (step.completed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (step.aiValidated) return <Brain className="h-4 w-4 text-blue-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const calculateProgress = (workflow: OnboardingWorkflow) => {
    const completedSteps = workflow.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / workflow.steps.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crew Onboarding</h1>
          <p className="text-muted-foreground">Comprehensive crew onboarding with AI validation</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Start New Onboarding
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Start New Crew Onboarding</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newCrewData.personalInfo?.firstName || ''}
                    onChange={(e) => setNewCrewData(prev => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo!,
                        firstName: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newCrewData.personalInfo?.lastName || ''}
                    onChange={(e) => setNewCrewData(prev => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo!,
                        lastName: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCrewData.personalInfo?.email || ''}
                    onChange={(e) => setNewCrewData(prev => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo!,
                        email: e.target.value
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={newCrewData.personalInfo?.nationality || ''}
                    onChange={(e) => setNewCrewData(prev => ({
                      ...prev,
                      personalInfo: {
                        ...prev.personalInfo!,
                        nationality: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button onClick={createNewWorkflow} disabled={isCreatingWorkflow}>
                  {isCreatingWorkflow ? 'Creating...' : 'Create Workflow'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Validation</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === 'pending_validation').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully onboarded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.length > 0 ? 
                Math.round(workflows.reduce((sum, w) => sum + calculateProgress(w), 0) / workflows.length) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {workflows.filter(w => w.status !== 'completed').length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active onboarding workflows</p>
                  <p className="text-sm text-muted-foreground">Start a new workflow to begin crew onboarding</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {workflows.filter(w => w.status !== 'completed').map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`/avatars/placeholder.jpg`} />
                          <AvatarFallback>
                            {workflow.data.personalInfo?.firstName?.[0] || '?'}
                            {workflow.data.personalInfo?.lastName?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {workflow.data.personalInfo?.firstName || 'New'} {workflow.data.personalInfo?.lastName || 'Crew Member'}
                          </CardTitle>
                          <CardDescription>
                            Started {new Date(workflow.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(workflow.status)} text-white`}>
                          {workflow.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-medium">{calculateProgress(workflow)}%</span>
                      </div>
                    </div>
                    <Progress value={calculateProgress(workflow)} className="mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {workflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getStepIcon(step)}
                            <div>
                              <p className="font-medium text-sm">{step.name}</p>
                              <p className="text-xs text-muted-foreground">{step.description}</p>
                              {step.validationNotes && (
                                <p className="text-xs text-green-600">{step.validationNotes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {step.name === 'Smart Scan Validation' && !step.completed && (
                              <Button size="sm" variant="outline" onClick={() => handleSmartScan(workflow.id, 'passport')}>
                                <Zap className="h-4 w-4 mr-1" />
                                Smart Scan
                              </Button>
                            )}
                            {step.name === 'Background Check' && !step.completed && (
                              <Button size="sm" variant="outline" onClick={() => performBackgroundCheck(workflow.id)}>
                                <Brain className="h-4 w-4 mr-1" />
                                AI Check
                              </Button>
                            )}
                            {!step.completed && step.name !== 'Smart Scan Validation' && step.name !== 'Background Check' && (
                              <Button size="sm" onClick={() => completeStep(workflow.id, step.id)}>
                                Complete
                              </Button>
                            )}
                            {workflow.status === 'pending_validation' && step.name === 'Final Approval' && (
                              <Select onValueChange={(position) => approveCrewMember(workflow.id, position)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Approve as..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="deckhand">Deckhand</SelectItem>
                                  <SelectItem value="steward">Steward</SelectItem>
                                  <SelectItem value="engineer">Engineer</SelectItem>
                                  <SelectItem value="chef">Chef</SelectItem>
                                  <SelectItem value="officer">Officer</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {workflows.filter(w => w.status === 'completed').length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed workflows yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {workflows.filter(w => w.status === 'completed').map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={`/avatars/placeholder.jpg`} />
                          <AvatarFallback>
                            {workflow.data.personalInfo?.firstName?.[0] || '?'}
                            {workflow.data.personalInfo?.lastName?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {workflow.data.personalInfo?.firstName} {workflow.data.personalInfo?.lastName}
                          </CardTitle>
                          <CardDescription>
                            Completed {workflow.completedAt ? new Date(workflow.completedAt).toLocaleDateString() : 'Recently'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <UniversalSmartScan
        isOpen={isSmartScanOpen}
        onClose={() => {
          setIsSmartScanOpen(false);
          setScanContext(null);
        }}
        onScanComplete={handleScanComplete}
        module="crew_onboarding"
        context={scanContext?.documentType || 'document'}
        scanType="document"
      />
    </div>
  );
};

export default CrewOnboardingDashboard;