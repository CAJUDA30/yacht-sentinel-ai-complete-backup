/**
 * Comprehensive Crew Onboarding Service
 * Handles complete crew onboarding workflow with Smart Scan integration
 */

import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from './YachtieIntegrationService';

export interface CrewOnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    email: string;
    phone: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  documents: {
    passport: {
      number: string;
      expiryDate: string;
      imageUrl?: string;
    };
    visa?: {
      type: string;
      expiryDate: string;
      imageUrl?: string;
    };
    medicalCertificate?: {
      type: string;
      expiryDate: string;
      imageUrl?: string;
    };
    seamanBook?: {
      number: string;
      expiryDate: string;
      imageUrl?: string;
    };
  };
  certifications: Array<{
    type: string;
    number: string;
    issuingAuthority: string;
    expiryDate: string;
    imageUrl?: string;
  }>;
  experience: {
    totalYears: number;
    previousYachts: Array<{
      yachtName: string;
      position: string;
      duration: string;
      reference?: string;
    }>;
    specialSkills: string[];
  };
  preferences: {
    preferredLanguages: string[];
    dietaryRequirements?: string;
    medicalConditions?: string;
    bankingDetails?: {
      accountHolder: string;
      bankName: string;
      accountNumber: string;
      routingNumber: string;
    };
  };
}

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  aiValidated?: boolean;
  confidence?: number;
  validationNotes?: string;
}

export interface OnboardingWorkflow {
  id: string;
  crewMemberId: string;
  yachtId: string;
  status: 'initiated' | 'in_progress' | 'pending_validation' | 'approved' | 'rejected' | 'completed';
  currentStep: number;
  steps: OnboardingStep[];
  assignedBy: string;
  createdAt: string;
  completedAt?: string;
  data: CrewOnboardingData;
  aiAnalysis?: {
    backgroundCheck: any;
    documentValidation: any;
    riskAssessment: any;
    recommendations: string[];
  };
}

class CrewOnboardingService {
  private defaultWorkflowSteps: Omit<OnboardingStep, 'id' | 'completed' | 'aiValidated'>[] = [
    {
      name: 'Personal Information',
      description: 'Basic personal details and contact information',
      required: true
    },
    {
      name: 'Document Upload',
      description: 'Upload passport, visa, and other required documents',
      required: true
    },
    {
      name: 'Smart Scan Validation',
      description: 'AI-powered document verification using Smart Scan',
      required: true
    },
    {
      name: 'Certifications',
      description: 'Professional certifications and licenses',
      required: true
    },
    {
      name: 'Experience Verification',
      description: 'Previous work experience and references',
      required: false
    },
    {
      name: 'Background Check',
      description: 'AI-powered background and sentiment analysis',
      required: true
    },
    {
      name: 'Medical Clearance',
      description: 'Medical certificate validation',
      required: true
    },
    {
      name: 'Banking Setup',
      description: 'Payment and banking information',
      required: false
    },
    {
      name: 'Final Approval',
      description: 'Management approval and yacht assignment',
      required: true
    }
  ];

  /**
   * Initiate crew onboarding process
   */
  async initiateCrewOnboarding(
    yachtId: string, 
    assignedBy: string, 
    initialData?: Partial<CrewOnboardingData>
  ): Promise<OnboardingWorkflow> {
    try {
      const workflowId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      
      // Create initial crew member record
      const { data: crewMember, error: crewError } = await supabase
        .from('crew_members')
        .insert([{
          id: `crew_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          yacht_id: yachtId,
          name: initialData?.personalInfo ? 
            `${initialData.personalInfo.firstName} ${initialData.personalInfo.lastName}` : 
            'New Crew Member',
          status: 'onboarding',
          position: 'To be assigned',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (crewError) throw crewError;

      // Create workflow steps
      const steps: OnboardingStep[] = this.defaultWorkflowSteps.map((step, index) => ({
        ...step,
        id: `step_${index + 1}`,
        completed: false,
        aiValidated: false
      }));

      // Create workflow in database using database function
      const { data: workflowUuid, error: workflowError } = await supabase
        .rpc('create_onboarding_workflow', {
          p_workflow_id: workflowId,
          p_crew_member_id: crewMember.id,
          p_yacht_id: yachtId,
          p_assigned_by: assignedBy,
          p_initial_data: {
            personalInfo: {
              firstName: initialData?.personalInfo?.firstName || '',
              lastName: initialData?.personalInfo?.lastName || '',
              dateOfBirth: '',
              nationality: '',
              email: '',
              phone: '',
              emergencyContact: { name: '', relationship: '', phone: '' }
            },
            documents: { passport: { number: '', expiryDate: '' } },
            certifications: [],
            experience: { totalYears: 0, previousYachts: [], specialSkills: [] },
            preferences: { preferredLanguages: [] }
          }
        });

      if (workflowError) {
        console.error('Error creating workflow in database:', workflowError);
        throw workflowError;
      }

      // Fetch the created workflow from database
      const { data: workflowData, error: fetchError } = await supabase
        .rpc('get_onboarding_workflow', {
          p_workflow_id: workflowId
        });

      if (fetchError || !workflowData) {
        console.error('Error fetching created workflow:', fetchError);
        throw new Error('Failed to retrieve created workflow');
      }

      const workflow = workflowData as OnboardingWorkflow;
      
      // Send initial notification
      await this.sendOnboardingNotification(crewMember.id, 'initiated');

      return workflow;

    } catch (error) {
      console.error('Error initiating crew onboarding:', error);
      throw error;
    }
  }

  /**
   * Process Smart Scan document upload
   */
  async processScannedDocument(
    workflowId: string, 
    documentType: string, 
    scanResult: any
  ): Promise<{success: boolean, validationResult?: any, error?: string}> {
    try {
      // Get workflow
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) throw new Error('Workflow not found');

      // Use Yachtie to validate the scanned document
      const validationRequest = {
        text: JSON.stringify(scanResult.extractedData),
        task: 'validate' as const,
        context: `crew_document_${documentType}`,
        options: {
          documentType,
          validateExpiry: true,
          checkAuthenticity: true,
          extractStructuredData: true
        }
      };

      const validationResponse = await yachtieService.process(validationRequest);
      
      if (validationResponse.success) {
        // Update workflow data with validated document info
        const updatedData = { ...workflow.data };
        
        switch (documentType) {
          case 'passport':
            updatedData.documents = {
              ...updatedData.documents,
              passport: {
                number: scanResult.extractedData.passportNumber || '',
                expiryDate: scanResult.extractedData.expiryDate || '',
                imageUrl: scanResult.imageUrl
              }
            };
            break;
          case 'visa':
            updatedData.documents = {
              ...updatedData.documents,
              visa: {
                type: scanResult.extractedData.visaType || 'Tourist',
                expiryDate: scanResult.extractedData.expiryDate || '',
                imageUrl: scanResult.imageUrl
              }
            };
            break;
          case 'medical_certificate':
            updatedData.documents = {
              ...updatedData.documents,
              medicalCertificate: {
                type: scanResult.extractedData.certificateType || 'ENG1',
                expiryDate: scanResult.extractedData.expiryDate || '',
                imageUrl: scanResult.imageUrl
              }
            };
            break;
        }

        // Mark document validation step as completed
        const updatedSteps = workflow.steps.map(step => {
          if (step.name === 'Smart Scan Validation') {
            return {
              ...step,
              completed: true,
              aiValidated: true,
              confidence: validationResponse.confidence,
              validationNotes: `Document validated with ${Math.round(validationResponse.confidence * 100)}% confidence`
            };
          }
          return step;
        });

        await this.updateWorkflow(workflowId, {
          data: updatedData,
          steps: updatedSteps
        });

        return { 
          success: true, 
          validationResult: validationResponse.result 
        };
      }

      return { 
        success: false, 
        error: 'Document validation failed' 
      };

    } catch (error) {
      console.error('Error processing scanned document:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Perform AI background check and sentiment analysis
   */
  async performBackgroundCheck(workflowId: string): Promise<{success: boolean, analysis?: any, error?: string}> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) throw new Error('Workflow not found');

      // Compile information for analysis
      const analysisData = {
        personalInfo: workflow.data.personalInfo,
        experience: workflow.data.experience,
        certifications: workflow.data.certifications
      };

      // Use Yachtie for background analysis
      const analysisRequest = {
        text: JSON.stringify(analysisData),
        task: 'analyze' as const,
        context: 'crew_background_check',
        options: {
          analyzeRisk: true,
          checkExperience: true,
          validateCertifications: true,
          sentimentAnalysis: true
        }
      };

      const analysisResponse = await yachtieService.process(analysisRequest);

      if (analysisResponse.success) {
        const analysis = {
          backgroundCheck: analysisResponse.result,
          riskLevel: analysisResponse.result.riskLevel || 'low',
          recommendations: analysisResponse.result.recommendations || [],
          confidence: analysisResponse.confidence,
          timestamp: new Date().toISOString()
        };

        // Update workflow with analysis
        await this.updateWorkflow(workflowId, {
          aiAnalysis: {
            ...workflow.aiAnalysis,
            backgroundCheck: analysis
          }
        });

        // Mark background check step as completed
        const updatedSteps = workflow.steps.map(step => {
          if (step.name === 'Background Check') {
            return {
              ...step,
              completed: true,
              aiValidated: true,
              confidence: analysisResponse.confidence,
              validationNotes: `Risk level: ${analysis.riskLevel}`
            };
          }
          return step;
        });

        await this.updateWorkflow(workflowId, { steps: updatedSteps });

        return { success: true, analysis };
      }

      return { success: false, error: 'Background check failed' };

    } catch (error) {
      console.error('Error performing background check:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Complete onboarding step
   */
  async completeStep(workflowId: string, stepId: string, data?: any): Promise<{success: boolean, nextStep?: OnboardingStep}> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) throw new Error('Workflow not found');

      // Update step as completed
      const updatedSteps = workflow.steps.map(step => {
        if (step.id === stepId) {
          return { ...step, completed: true };
        }
        return step;
      });

      // Update workflow data if provided
      const updatedData = data ? { ...workflow.data, ...data } : workflow.data;

      // Find next incomplete step
      const nextIncompleteStep = updatedSteps.find(step => !step.completed);
      const currentStep = nextIncompleteStep ? 
        updatedSteps.findIndex(step => step.id === nextIncompleteStep.id) : 
        updatedSteps.length;

      // Update workflow status
      let status = workflow.status;
      if (!nextIncompleteStep) {
        status = 'pending_validation';
      } else if (status === 'initiated') {
        status = 'in_progress';
      }

      await this.updateWorkflow(workflowId, {
        steps: updatedSteps,
        data: updatedData,
        currentStep,
        status
      });

      return { 
        success: true, 
        nextStep: nextIncompleteStep 
      };

    } catch (error) {
      console.error('Error completing step:', error);
      return { success: false };
    }
  }

  /**
   * Approve crew member and assign to yacht
   */
  async approveCrewMember(workflowId: string, position: string, approvedBy: string): Promise<{success: boolean, error?: string}> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) throw new Error('Workflow not found');

      // Update crew member record
      const { error: updateError } = await supabase
        .from('crew_members')
        .update({
          status: 'active',
          position: position,
          hire_date: new Date().toISOString().split('T')[0],
          nationality: workflow.data.personalInfo?.nationality,
          passport_number: workflow.data.documents?.passport?.number,
          passport_expiry: workflow.data.documents?.passport?.expiryDate,
          emergency_contact: workflow.data.personalInfo?.emergencyContact?.name,
          certifications: workflow.data.certifications?.map(cert => cert.type) || []
        })
        .eq('id', workflow.crewMemberId);

      if (updateError) throw updateError;

      // Update workflow as completed
      await this.updateWorkflow(workflowId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      // Send welcome notification
      await this.sendOnboardingNotification(workflow.crewMemberId, 'welcome', {
        yachtName: 'Current Yacht', // This should come from yacht data
        position
      });

      return { success: true };

    } catch (error) {
      console.error('Error approving crew member:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send onboarding notifications
   */
  async sendOnboardingNotification(
    crewMemberId: string, 
    stage: 'initiated' | 'document_required' | 'validation_pending' | 'approved' | 'welcome', 
    data?: any
  ): Promise<void> {
    try {
      // Get crew member info with personal details
      const { data: crewMember, error } = await supabase
        .from('crew_members')
        .select(`
          *,
          crew_personal_details(*)
        `)
        .eq('id', crewMemberId)
        .single();

      if (error || !crewMember) {
        console.warn('Could not find crew member for notification:', error);
        return;
      }

      let subject = '';
      let message = '';
      const recipientEmail = crewMember.crew_personal_details?.[0]?.emergency_contact_name || 'crew@yachtexcel.com';

      switch (stage) {
        case 'initiated':
          subject = 'Welcome to the onboarding process';
          message = `Hello ${crewMember.name}, your onboarding process has been initiated. Please complete all required steps.`;
          break;
        case 'document_required':
          subject = 'Documents required for onboarding';
          message = `Please upload the required documents to continue your onboarding process.`;
          break;
        case 'validation_pending':
          subject = 'Document validation in progress';
          message = `Your documents are being validated. We'll notify you once the process is complete.`;
          break;
        case 'approved':
          subject = 'Onboarding approved';
          message = `Congratulations! Your onboarding has been approved. Welcome to the team.`;
          break;
        case 'welcome':
          subject = `Welcome aboard ${data?.yachtName || 'the yacht'}`;
          message = `Welcome to your new position as ${data?.position || 'crew member'}. We're excited to have you on board!`;
          break;
      }

      // Get workflow ID for logging
      const { data: workflowData } = await supabase
        .from('onboarding_workflows')
        .select('workflow_id')
        .eq('crew_member_id', crewMemberId)
        .eq('status', 'in_progress')
        .single();

      const workflowId = workflowData?.workflow_id;

      // Log notification to database
      if (workflowId) {
        await supabase.rpc('log_onboarding_notification', {
          p_workflow_id: workflowId,
          p_crew_member_id: crewMemberId,
          p_notification_type: 'email',
          p_stage: stage,
          p_subject: subject,
          p_message: message,
          p_recipient_email: recipientEmail
        });
      }

      // Send notification via edge function
      await supabase.functions.invoke('send-communication', {
        body: {
          type: 'email',
          to: recipientEmail,
          subject,
          content: message
        }
      });

    } catch (error) {
      console.error('Error sending onboarding notification:', error);
    }
  }

  /**
   * Get onboarding workflow
   */
  async getWorkflow(workflowId: string): Promise<OnboardingWorkflow | null> {
    try {
      const { data: workflowData, error } = await supabase
        .rpc('get_onboarding_workflow', {
          p_workflow_id: workflowId
        });

      if (error) {
        console.error('Error fetching workflow:', error);
        return null;
      }

      return workflowData as OnboardingWorkflow | null;
    } catch (error) {
      console.error('Error in getWorkflow:', error);
      return null;
    }
  }

  /**
   * Update workflow
   */
  private async updateWorkflow(workflowId: string, updates: Partial<OnboardingWorkflow>): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('update_onboarding_workflow', {
          p_workflow_id: workflowId,
          p_updates: updates
        });

      if (error) {
        console.error('Error updating workflow:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateWorkflow:', error);
      throw error;
    }
  }

  /**
   * Get all active onboarding workflows
   */
  async getActiveWorkflows(yachtId?: string): Promise<OnboardingWorkflow[]> {
    try {
      const { data: workflowsData, error } = await supabase
        .rpc('get_active_onboarding_workflows', {
          p_yacht_id: yachtId || null
        });

      if (error) {
        console.error('Error fetching active workflows:', error);
        return [];
      }

      return (workflowsData as OnboardingWorkflow[]) || [];
    } catch (error) {
      console.error('Error in getActiveWorkflows:', error);
      return [];
    }
  }
}

export const crewOnboardingService = new CrewOnboardingService();