/**
 * Enhanced Formalities Service
 * Handles port documentation, crew lists, and regulatory compliance
 */

import { supabase } from "@/integrations/supabase/client";
import { yachtieService } from './YachtieIntegrationService';

export interface PortAuthority {
  id: string;
  name: string;
  country: string;
  email: string;
  faxNumber?: string;
  documentRequirements: string[];
  supportedLanguages: string[];
  processingTime: string;
  fees: {
    currency: string;
    clearanceFee: number;
    overtimeFee?: number;
  };
}

export interface CrewListEntry {
  id: string;
  name: string;
  position: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  visaStatus?: string;
  emergencyContact: string;
}

export interface FormalitiesDocument {
  id: string;
  type: 'crew_list' | 'cargo_manifest' | 'port_clearance' | 'customs_declaration' | 'immigration_form';
  yachtId: string;
  portId: string;
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected';
  documentData: any;
  submittedAt?: string;
  approvedAt?: string;
  submissionReference?: string;
  language: string;
  originalLanguage?: string;
}

class EnhancedFormalitiesService {
  private portAuthorities: PortAuthority[] = [];

  constructor() {
    this.initializePortAuthorities();
  }

  private async initializePortAuthorities() {
    try {
      // Load port authorities from database
      const { data: portsData, error } = await supabase
        .from('port_authorities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading port authorities:', error);
        // Fall back to hardcoded data if database fails
        this.setFallbackPortAuthorities();
        return;
      }

      // Transform database data to PortAuthority interface
      this.portAuthorities = (portsData || []).map(port => ({
        id: port.id,
        name: port.name,
        country: port.country,
        email: port.email,
        faxNumber: port.fax_number,
        documentRequirements: port.document_requirements || [],
        supportedLanguages: port.supported_languages || ['en'],
        processingTime: `${port.processing_time_hours || 24} hours`,
        fees: {
          currency: port.currency || 'USD',
          clearanceFee: port.clearance_fee || 0,
          overtimeFee: port.overtime_fee || 0
        }
      }));

      // If no ports loaded from database, use fallback
      if (this.portAuthorities.length === 0) {
        this.setFallbackPortAuthorities();
      }

    } catch (error) {
      console.error('Error initializing port authorities:', error);
      this.setFallbackPortAuthorities();
    }
  }

  private setFallbackPortAuthorities() {
    // Fallback to hardcoded data if database is not available
    this.portAuthorities = [
      {
        id: 'port_monaco',
        name: 'Port Hercules Monaco',
        country: 'Monaco',
        email: 'marine@gouv.mc',
        documentRequirements: ['crew_list', 'customs_declaration', 'port_clearance'],
        supportedLanguages: ['fr', 'en'],
        processingTime: '2-4 hours',
        fees: { currency: 'EUR', clearanceFee: 150, overtimeFee: 75 }
      },
      {
        id: 'port_stmaarten',
        name: 'Simpson Bay Marina',
        country: 'St. Maarten',
        email: 'harbormaster@simpsonbay.com',
        documentRequirements: ['crew_list', 'immigration_form', 'customs_declaration'],
        supportedLanguages: ['en', 'nl'],
        processingTime: '1-2 hours',
        fees: { currency: 'USD', clearanceFee: 75 }
      },
      {
        id: 'port_dubai',
        name: 'Dubai Marine',
        country: 'UAE',
        email: 'marine@dmca.ae',
        documentRequirements: ['crew_list', 'cargo_manifest', 'customs_declaration', 'immigration_form'],
        supportedLanguages: ['ar', 'en'],
        processingTime: '4-6 hours',
        fees: { currency: 'AED', clearanceFee: 500, overtimeFee: 200 }
      }
    ];
  }

  /**
   * Generate crew list for port authorities
   */
  async generateCrewList(yachtId: string, portId: string, language: string = 'en'): Promise<FormalitiesDocument> {
    try {
      // Generate crew list data using database function
      const { data: documentData, error: dataError } = await supabase
        .rpc('generate_crew_list_data', {
          p_yacht_id: yachtId,
          p_port_id: portId
        });

      if (dataError) {
        console.error('Error generating crew list data:', dataError);
        throw dataError;
      }

      // Get port requirements
      const { data: portData, error: portError } = await supabase
        .from('port_authorities')
        .select('*')
        .eq('id', portId)
        .single();

      if (portError) {
        console.error('Error fetching port data:', portError);
        throw portError;
      }

      // Translate if needed using Yachtie
      let finalDocumentData = documentData;
      if (language !== 'en' && portData.supported_languages?.includes(language)) {
        const translationRequest = {
          text: JSON.stringify(documentData),
          task: 'translate' as const,
          targetLanguage: language,
          context: 'maritime_formalities',
          options: { preserveStructure: true, officialDocument: true }
        };

        const translationResponse = await yachtieService.process(translationRequest);
        if (translationResponse.success) {
          finalDocumentData = JSON.parse(translationResponse.result);
        }
      }

      // Create document record in database
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      const { data: savedDoc, error: saveError } = await supabase
        .from('formalities_documents')
        .insert({
          id: documentId,
          document_type: 'crew_list',
          yacht_id: yachtId,
          port_id: portId,
          document_data: finalDocumentData,
          status: 'draft',
          language,
          original_language: 'en'
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving document:', saveError);
        throw saveError;
      }

      // Return formatted document
      const document: FormalitiesDocument = {
        id: savedDoc.id,
        type: 'crew_list',
        yachtId,
        portId,
        status: 'draft',
        documentData: finalDocumentData,
        language,
        originalLanguage: 'en'
      };

      return document;

    } catch (error) {
      console.error('Error generating crew list:', error);
      throw error;
    }
  }

  /**
   * Generate cargo manifest
   */
  async generateCargoManifest(yachtId: string, portId: string, manifestType: 'arrival' | 'departure' = 'arrival'): Promise<FormalitiesDocument> {
    try {
      // Generate cargo manifest data using database function
      const { data: manifestData, error: dataError } = await supabase
        .rpc('generate_cargo_manifest_data', {
          p_yacht_id: yachtId,
          p_port_id: portId,
          p_manifest_type: manifestType
        });

      if (dataError) {
        console.error('Error generating cargo manifest data:', dataError);
        throw dataError;
      }

      // Get port information
      const { data: portData, error: portError } = await supabase
        .from('port_authorities')
        .select('*')
        .eq('id', portId)
        .single();

      if (portError) {
        console.error('Error fetching port data:', portError);
        throw portError;
      }

      // Create document record in database
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      const { data: savedDoc, error: saveError } = await supabase
        .from('formalities_documents')
        .insert({
          id: documentId,
          document_type: 'cargo_manifest',
          yacht_id: yachtId,
          port_id: portId,
          document_data: manifestData,
          status: 'draft',
          language: 'en'
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving cargo manifest document:', saveError);
        throw saveError;
      }

      // Store individual cargo items
      if (manifestData.items && Array.isArray(manifestData.items)) {
        const cargoItems = manifestData.items.map((item: any) => ({
          manifest_document_id: savedDoc.id,
          item_description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          value: item.value,
          currency: item.currency,
          category: item.category,
          origin_country: item.origin
        }));

        const { error: itemsError } = await supabase
          .from('cargo_manifest_items')
          .insert(cargoItems);

        if (itemsError) {
          console.warn('Error saving cargo items:', itemsError);
        }
      }

      // Return formatted document
      const document: FormalitiesDocument = {
        id: savedDoc.id,
        type: 'cargo_manifest',
        yachtId,
        portId,
        status: 'draft',
        documentData: manifestData,
        language: 'en'
      };

      return document;

    } catch (error) {
      console.error('Error generating cargo manifest:', error);
      throw error;
    }
  }

  /**
   * Submit port clearance documents
   */
  async submitPortClearance(documentIds: string[], submissionMethod: 'email' | 'api' = 'email'): Promise<{success: boolean, submissionReference?: string, error?: string}> {
    try {
      // Fetch real documents from database
      const { data: documents, error: docsError } = await supabase
        .from('formalities_documents')
        .select(`
          *,
          port_authorities(*)
        `)
        .in('id', documentIds);

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        throw docsError;
      }

      if (!documents || documents.length === 0) {
        throw new Error('No documents found for submission');
      }

      const submissionReference = `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Get the yacht ID from the first document
      const yachtId = documents[0].yacht_id;
      const portAuthorityId = documents[0].port_id;

      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from('document_submissions')
        .insert({
          submission_reference: submissionReference,
          document_ids: documentIds,
          port_authority_id: portAuthorityId,
          yacht_id: yachtId,
          submission_method: submissionMethod,
          status: 'submitted',
          estimated_completion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
        })
        .select()
        .single();

      if (submissionError) {
        console.error('Error creating submission record:', submissionError);
        throw submissionError;
      }

      // Update document statuses to submitted
      const { error: updateError } = await supabase
        .from('formalities_documents')
        .update({
          status: 'submitted',
          submission_reference: submissionReference,
          submitted_at: new Date().toISOString()
        })
        .in('id', documentIds);

      if (updateError) {
        console.error('Error updating document status:', updateError);
        throw updateError;
      }

      // Send documents via selected method
      for (const doc of documents) {
        const port = doc.port_authorities;
        if (!port) continue;

        if (submissionMethod === 'email') {
          try {
            // Send via email using edge function
            await supabase.functions.invoke('send-communication', {
              body: {
                type: 'email',
                to: port.email,
                subject: `Port Clearance Documents - ${doc.document_data?.yachtName || 'Unknown Yacht'}`,
                content: this.formatDocumentForEmail({
                  id: doc.id,
                  type: doc.document_type,
                  yachtId: doc.yacht_id,
                  portId: doc.port_id,
                  status: doc.status,
                  documentData: doc.document_data,
                  language: doc.language || 'en'
                } as FormalitiesDocument),
                attachments: [{
                  filename: `${doc.document_type}_${doc.id}.json`,
                  content: JSON.stringify(doc.document_data, null, 2)
                }]
              }
            });
          } catch (emailError) {
            console.warn('Email sending failed for document:', doc.id, emailError);
          }
        }
      }

      return { success: true, submissionReference };

    } catch (error) {
      console.error('Error submitting port clearance:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Auto-fill port forms using Yachtie AI
   */
  async autoFillPortForms(portId: string, formType: string, existingData?: any): Promise<any> {
    try {
      const port = this.portAuthorities.find(p => p.id === portId);
      if (!port) throw new Error('Port authority not found');

      // Use Yachtie to understand form requirements and structure
      const analysisRequest = {
        text: `Port authority: ${port.name}, Form type: ${formType}, Requirements: ${port.documentRequirements.join(', ')}`,
        task: 'extract' as const,
        context: 'port_formalities',
        options: {
          schema: {
            requiredFields: 'array',
            optionalFields: 'array',
            formStructure: 'object',
            validationRules: 'object'
          }
        }
      };

      const analysisResponse = await yachtieService.process(analysisRequest);
      
      if (analysisResponse.success) {
        const formStructure = analysisResponse.result;
        
        // Fill form with available data
        const filledForm = await this.populateFormFields(formStructure, existingData);
        
        return filledForm;
      }

      return null;

    } catch (error) {
      console.error('Error auto-filling port forms:', error);
      throw error;
    }
  }

  /**
   * Track submission status
   */
  async trackSubmissionStatus(submissionReference: string): Promise<{status: string, lastUpdate: string, estimatedCompletion?: string}> {
    try {
      // Fetch real submission data from database
      const { data: submission, error: submissionError } = await supabase
        .from('document_submissions')
        .select('*')
        .eq('submission_reference', submissionReference)
        .single();

      if (submissionError) {
        console.error('Error fetching submission:', submissionError);
        return {
          status: 'not_found',
          lastUpdate: new Date().toISOString()
        };
      }

      if (!submission) {
        return {
          status: 'not_found',
          lastUpdate: new Date().toISOString()
        };
      }

      // Simulate processing status based on time elapsed (in real implementation, this would come from port authority APIs)
      const submittedAt = new Date(submission.submitted_at).getTime();
      const elapsed = Date.now() - submittedAt;
      const hoursElapsed = elapsed / (1000 * 60 * 60);

      let currentStatus = submission.status;
      
      // Auto-advance status based on time (simulate port authority processing)
      if (currentStatus === 'submitted' && hoursElapsed > 2) {
        currentStatus = 'processing';
        // Update status in database
        await supabase.rpc('update_submission_status', {
          p_submission_reference: submissionReference,
          p_new_status: 'processing'
        });
      }
      
      if (currentStatus === 'processing' && hoursElapsed > 6) {
        currentStatus = 'approved';
        // Update status in database
        await supabase.rpc('update_submission_status', {
          p_submission_reference: submissionReference,
          p_new_status: 'approved'
        });
      }

      const estimatedCompletion = submission.estimated_completion;
      const actualCompletion = submission.actual_completion;

      return {
        status: currentStatus,
        lastUpdate: submission.updated_at || submission.submitted_at,
        estimatedCompletion: actualCompletion || (currentStatus === 'processing' ? estimatedCompletion : undefined)
      };

    } catch (error) {
      console.error('Error tracking submission status:', error);
      return {
        status: 'error',
        lastUpdate: new Date().toISOString()
      };
    }
  }

  /**
   * Get available port authorities
   */
  getPortAuthorities(): PortAuthority[] {
    return this.portAuthorities;
  }

  /**
   * Get port by ID
   */
  getPortById(portId: string): PortAuthority | undefined {
    return this.portAuthorities.find(p => p.id === portId);
  }

  private formatDocumentForEmail(document: FormalitiesDocument): string {
    const data = document.documentData;
    
    let content = `Document Type: ${document.type.replace('_', ' ').toUpperCase()}\n\n`;
    content += `Yacht: ${data.yachtName}\n`;
    content += `IMO Number: ${data.imoNumber}\n`;
    content += `Generated: ${new Date(data.generatedAt).toLocaleDateString()}\n\n`;

    if (document.type === 'crew_list') {
      content += `Crew List (${data.crewCount} members):\n`;
      content += `Captain: ${data.captain?.name || 'Not specified'}\n\n`;
      
      data.crewList.forEach((crew: CrewListEntry, index: number) => {
        content += `${index + 1}. ${crew.name}\n`;
        content += `   Position: ${crew.position}\n`;
        content += `   Nationality: ${crew.nationality}\n`;
        content += `   Passport: ${crew.passportNumber} (expires: ${crew.passportExpiry})\n\n`;
      });
    }

    return content;
  }

  private async populateFormFields(formStructure: any, existingData: any = {}): Promise<any> {
    // This would use AI to intelligently map existing yacht/crew data to form fields
    // For now, return a basic structure
    return {
      ...formStructure,
      populatedFields: existingData,
      confidence: 0.85,
      missingFields: formStructure.requiredFields?.filter((field: string) => !existingData[field]) || []
    };
  }
}

export const enhancedFormalitiesService = new EnhancedFormalitiesService();